import { BinanceClient } from "./binance";
import * as db from "./db";
import { BotConfiguration } from "../drizzle/schema";

export interface BotState {
  isRunning: boolean;
  userId: number;
  config: BotConfiguration;
  binanceClient: BinanceClient;
  scanInterval: NodeJS.Timeout | null;
  executionInterval: NodeJS.Timeout | null;
}

// Store active bot instances per user
const activeBots = new Map<number, BotState>();

/**
 * Start the arbitrage bot for a user
 */
export async function startBot(userId: number): Promise<void> {
  if (activeBots.has(userId)) {
    console.log(`[Bot] Bot already running for user ${userId}`);
    return;
  }

  const config = await db.getBotConfig(userId);
  if (!config || !config.binanceApiKey || !config.binanceApiSecret) {
    throw new Error("Bot configuration incomplete: missing API keys");
  }

  const testnet = config.environment === "testnet";
  const binanceClient = new BinanceClient(
    config.binanceApiKey,
    config.binanceApiSecret,
    testnet
  );

  const botState: BotState = {
    isRunning: true,
    userId,
    config,
    binanceClient,
    scanInterval: null,
    executionInterval: null,
  };

  activeBots.set(userId, botState);

  // Start funding rate scanner (every 5 seconds)
  botState.scanInterval = setInterval(() => {
    scanFundingRates(botState).catch((err) =>
      console.error("[Bot] Scan error:", err)
    );
  }, 5000);

  // Start execution engine (every 2 seconds, checks for positions to close)
  botState.executionInterval = setInterval(() => {
    executeArbitrage(botState).catch((err) =>
      console.error("[Bot] Execution error:", err)
    );
  }, 2000);

  console.log(`[Bot] Started bot for user ${userId}`);

  // Update bot config status
  await db.upsertBotConfig(userId, { isActive: true });
}

/**
 * Stop the arbitrage bot for a user
 */
export async function stopBot(userId: number): Promise<void> {
  const botState = activeBots.get(userId);
  if (!botState) {
    console.log(`[Bot] No active bot for user ${userId}`);
    return;
  }

  botState.isRunning = false;

  if (botState.scanInterval) {
    clearInterval(botState.scanInterval);
  }
  if (botState.executionInterval) {
    clearInterval(botState.executionInterval);
  }

  activeBots.delete(userId);

  console.log(`[Bot] Stopped bot for user ${userId}`);

  // Update bot config status
  await db.upsertBotConfig(userId, { isActive: false });
}

/**
 * Scan funding rates and identify arbitrage opportunities
 */
async function scanFundingRates(botState: BotState): Promise<void> {
  try {
    const allRates = await botState.binanceClient.getAllFundingRates();

    // Filter for high magnitude funding rates
    const minRate = parseFloat(botState.config.minFundingRate.toString());

    const longCandidates = allRates.filter((r) => r.fundingRate < -minRate);
    const shortCandidates = allRates.filter((r) => r.fundingRate > minRate);

    // Store funding rates in database
    for (const rate of allRates) {
      await db.upsertFundingRate({
        symbol: rate.symbol,
        fundingRate: rate.fundingRate.toString() as any,
        fundingTime: new Date(rate.fundingTime),
        nextFundingTime: new Date(rate.nextFundingTime),
      });
    }

    console.log(
      `[Bot] Scan complete: ${longCandidates.length} long candidates, ${shortCandidates.length} short candidates`
    );
  } catch (error) {
    console.error("[Bot] Error scanning funding rates:", error);
  }
}

/**
 * Execute arbitrage trades
 */
async function executeArbitrage(botState: BotState): Promise<void> {
  try {
    const openPositions = await db.getOpenPositionsByUser(botState.userId);

    // Check if we can open new positions
    if (
      openPositions.length <
      parseInt(botState.config.maxOpenPositions.toString())
    ) {
      // Get current funding rates
      const allRates = await botState.binanceClient.getAllFundingRates();

      // Find best opportunities
      const minRate = parseFloat(botState.config.minFundingRate.toString());
      const longCandidates = allRates
        .filter((r) => r.fundingRate < -minRate)
        .sort((a, b) => a.fundingRate - b.fundingRate)
        .slice(0, 3);

      const shortCandidates = allRates
        .filter((r) => r.fundingRate > minRate)
        .sort((a, b) => b.fundingRate - a.fundingRate)
        .slice(0, 3);

      // Execute trades for best opportunities
      for (const candidate of longCandidates) {
        if (
          openPositions.length >=
          parseInt(botState.config.maxOpenPositions.toString())
        ) {
          break;
        }

        await executeLongTrade(botState, candidate.symbol, candidate.fundingRate);
      }

      for (const candidate of shortCandidates) {
        if (
          openPositions.length >=
          parseInt(botState.config.maxOpenPositions.toString())
        ) {
          break;
        }

        await executeShortTrade(botState, candidate.symbol, candidate.fundingRate);
      }
    }

    // Check for positions to close (profit > fees)
    await checkAndClosePositions(botState);
  } catch (error) {
    console.error("[Bot] Error executing arbitrage:", error);
  }
}

/**
 * Execute a long trade
 */
async function executeLongTrade(
  botState: BotState,
  symbol: string,
  fundingRate: number
): Promise<void> {
  try {
    const tradeSize = parseFloat(botState.config.tradeSize.toString());
    const leverage = parseInt(botState.config.leverage.toString());

    // Get current price
    const price = await botState.binanceClient.getPrice(symbol);

    // Calculate quantity
    const quantity = (tradeSize * leverage) / price;

    // Set leverage
    await botState.binanceClient.setLeverage(symbol, leverage);

    // Place long order
    const order = await botState.binanceClient.placeOrder({
      symbol,
      side: "BUY",
      positionSide: "LONG",
      type: "MARKET",
      quantity,
      leverage,
    });

    // Record trade
    const trade = await db.createTrade({
      userId: botState.userId,
      symbol,
      direction: "LONG",
      entryPrice: price.toString() as any,
      quantity: quantity.toString() as any,
      fundingCollected: (0).toString() as any,
      fees: (0).toString() as any,
      status: "OPEN",
      entryTime: new Date(),
      exitPrice: null as any,
      netProfit: null as any,
      profitPercentage: null as any,
      exitTime: null as any,
    });

    // Record open position
    await db.createOpenPosition({
      userId: botState.userId,
      tradeId: (trade as any).insertId,
      symbol,
      direction: "LONG",
      entryPrice: price.toString() as any,
      currentPrice: price.toString() as any,
      quantity: quantity.toString() as any,
      unrealizedPnL: (0).toString() as any,
      fundingRate: fundingRate.toString() as any,
      entryTime: new Date(),
    });

    console.log(
      `[Bot] Opened LONG position: ${symbol} @ ${price} (funding rate: ${fundingRate})`
    );
  } catch (error) {
    console.error(`[Bot] Error executing long trade for ${symbol}:`, error);
  }
}

/**
 * Execute a short trade
 */
async function executeShortTrade(
  botState: BotState,
  symbol: string,
  fundingRate: number
): Promise<void> {
  try {
    const tradeSize = parseFloat(botState.config.tradeSize.toString());
    const leverage = parseInt(botState.config.leverage.toString());

    // Get current price
    const price = await botState.binanceClient.getPrice(symbol);

    // Calculate quantity
    const quantity = (tradeSize * leverage) / price;

    // Set leverage
    await botState.binanceClient.setLeverage(symbol, leverage);

    // Place short order
    const order = await botState.binanceClient.placeOrder({
      symbol,
      side: "SELL",
      positionSide: "SHORT",
      type: "MARKET",
      quantity,
      leverage,
    });

    // Record trade
    const trade = await db.createTrade({
      userId: botState.userId,
      symbol,
      direction: "SHORT",
      entryPrice: price.toString() as any,
      quantity: quantity.toString() as any,
      fundingCollected: (0).toString() as any,
      fees: (0).toString() as any,
      status: "OPEN",
      entryTime: new Date(),
      exitPrice: null as any,
      netProfit: null as any,
      profitPercentage: null as any,
      exitTime: null as any,
    });

    // Record open position
    await db.createOpenPosition({
      userId: botState.userId,
      tradeId: (trade as any).insertId,
      symbol,
      direction: "SHORT",
      entryPrice: price.toString() as any,
      currentPrice: price.toString() as any,
      quantity: quantity.toString() as any,
      unrealizedPnL: (0).toString() as any,
      fundingRate: fundingRate.toString() as any,
      entryTime: new Date(),
    });

    console.log(
      `[Bot] Opened SHORT position: ${symbol} @ ${price} (funding rate: ${fundingRate})`
    );
  } catch (error) {
    console.error(`[Bot] Error executing short trade for ${symbol}:`, error);
  }
}

/**
 * Check and close profitable positions
 */
async function checkAndClosePositions(botState: BotState): Promise<void> {
  try {
    const openPositions = await db.getOpenPositionsByUser(botState.userId);

    for (const position of openPositions) {
      try {
        // Get current price
        const currentPrice = await botState.binanceClient.getPrice(position.symbol);

        // Convert Decimal types to numbers
        const entryPriceNum = parseFloat(position.entryPrice.toString());
        const quantityNum = parseFloat(position.quantity.toString());

        // Calculate unrealized PnL
        let unrealizedPnL = 0;
        if (position.direction === "LONG") {
          unrealizedPnL =
            (currentPrice - entryPriceNum) * quantityNum;
        } else {
          unrealizedPnL =
            (entryPriceNum - currentPrice) * quantityNum;
        }

        // Update position
        await db.updateOpenPosition(position.id, {
          currentPrice: currentPrice.toString() as any,
          unrealizedPnL: unrealizedPnL.toString() as any,
        });

        // Check if we should close (profit > fees, typically 0.04% maker + 0.04% taker = 0.08%)
        const fundingRateNum = parseFloat(position.fundingRate.toString());
        
        const fees = (quantityNum * currentPrice * 0.0008) / 2;
        const fundingCollected = Math.abs(fundingRateNum * quantityNum * currentPrice * 8);

        if (unrealizedPnL + fundingCollected > fees) {
          // Close position
          await botState.binanceClient.closePosition(
            position.symbol,
            position.direction as "LONG" | "SHORT"
          );

          // Update trade
          const trade = await db.getTradesByUser(botState.userId, 1, 0);
          if (trade.length > 0) {
            const netProfit = unrealizedPnL + fundingCollected - fees;
            const profitPercentage = (netProfit / (entryPriceNum * quantityNum)) * 100;

            await db.updateTrade(trade[0].id, {
              exitPrice: currentPrice.toString() as any,
              exitTime: new Date(),
              fundingCollected: fundingCollected.toString() as any,
              fees: fees.toString() as any,
              netProfit: netProfit.toString() as any,
              profitPercentage: profitPercentage.toString() as any,
              status: "CLOSED",
            });
          }

          // Delete open position
          await db.deleteOpenPosition(position.id);

          console.log(
            `[Bot] Closed ${position.direction} position: ${position.symbol} (PnL: ${unrealizedPnL.toFixed(2)} USDT)`
          );
        }
      } catch (error) {
        console.error(
          `[Bot] Error checking position ${position.symbol}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("[Bot] Error checking and closing positions:", error);
  }
}

/**
 * Get bot status for a user
 */
export function getBotStatus(userId: number): {
  isRunning: boolean;
  openPositions: number;
} {
  const botState = activeBots.get(userId);

  return {
    isRunning: botState?.isRunning ?? false,
    openPositions: 0,
  };
}
