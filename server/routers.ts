import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as botEngine from "./botEngine";
import { BinanceClient } from "./binance";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Bot Control ============
  bot: router({
    start: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        await botEngine.startBot(ctx.user.id);
        return { success: true, message: "Bot started" };
      } catch (error) {
        console.error("[API] Error starting bot:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to start bot"
        );
      }
    }),

    stop: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        await botEngine.stopBot(ctx.user.id);
        return { success: true, message: "Bot stopped" };
      } catch (error) {
        console.error("[API] Error stopping bot:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to stop bot"
        );
      }
    }),

    status: protectedProcedure.query(async ({ ctx }) => {
      const config = await db.getBotConfig(ctx.user.id);
      const status = botEngine.getBotStatus(ctx.user.id);
      const openPositions = await db.getOpenPositionsByUser(ctx.user.id);

      return {
        isRunning: status.isRunning,
        isConfigured: !!config?.binanceApiKey,
        environment: config?.environment || "testnet",
        openPositions: openPositions.length,
      };
    }),
  }),

  // ============ Configuration ============
  config: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const config = await db.getBotConfig(ctx.user.id);

      if (!config) {
        return {
          environment: "testnet",
          leverage: 1,
          minFundingRate: 0.001,
          maxOpenPositions: 5,
          tradeSizeUSDT: 100,
          isActive: false,
        };
      }

      return {
        environment: config.environment,
        leverage: config.leverage,
        minFundingRate: parseFloat(config.minFundingRate.toString()),
        maxOpenPositions: config.maxOpenPositions,
        tradeSizeUSDT: parseFloat(config.tradeSize.toString()),
        isActive: config.isActive,
      };
    }),

    update: protectedProcedure
      .input(
        z.object({
          apiKey: z.string().optional(),
          apiSecret: z.string().optional(),
          environment: z.enum(["testnet", "mainnet"]).optional(),
          leverage: z.number().min(1).max(125).optional(),
          minFundingRate: z.number().min(0.0001).optional(),
          maxOpenPositions: z.number().min(1).max(20).optional(),
          tradeSizeUSDT: z.number().min(10).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Validate API keys if provided
          if (input.apiKey && input.apiSecret) {
            const testnet = input.environment === "testnet";
            const client = new BinanceClient(
              input.apiKey,
              input.apiSecret,
              testnet
            );

            // Test connection
            try {
              await client.getBalance();
            } catch (error) {
              throw new Error("Invalid API keys or connection failed");
            }
          }

          // Update config
          await db.upsertBotConfig(ctx.user.id, {
            binanceApiKey: input.apiKey,
            binanceApiSecret: input.apiSecret,
            environment: input.environment as any,
            leverage: input.leverage,
            minFundingRate: input.minFundingRate?.toString() as any,
            maxOpenPositions: input.maxOpenPositions,
            tradeSize: input.tradeSizeUSDT?.toString() as any,
          });

          return { success: true, message: "Configuration updated" };
        } catch (error) {
          console.error("[API] Error updating config:", error);
          throw new Error(
            error instanceof Error ? error.message : "Failed to update config"
          );
        }
      }),

    testConnection: protectedProcedure
      .input(
        z.object({
          apiKey: z.string(),
          apiSecret: z.string(),
          testnet: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const client = new BinanceClient(
            input.apiKey,
            input.apiSecret,
            input.testnet
          );

          const balance = await client.getBalance();

          return {
            success: true,
            balance: {
              totalWalletBalance: balance.totalWalletBalance,
              totalUnrealizedProfit: balance.totalUnrealizedProfit,
              totalMarginBalance: balance.totalMarginBalance,
            },
          };
        } catch (error) {
          console.error("[API] Error testing connection:", error);
          throw new Error(
            error instanceof Error
              ? error.message
              : "Failed to connect to Binance"
          );
        }
      }),
  }),

  // ============ Trades ============
  trades: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const trades = await db.getTradesByUser(
          ctx.user.id,
          input.limit,
          input.offset
        );

        return trades.map((trade) => ({
          id: trade.id,
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice: parseFloat(trade.entryPrice.toString()),
          exitPrice: trade.exitPrice
            ? parseFloat(trade.exitPrice.toString())
            : null,
          quantity: parseFloat(trade.quantity.toString()),
          fundingCollected: parseFloat(trade.fundingCollected.toString()),
          fees: parseFloat(trade.fees.toString()),
          netProfit: trade.netProfit
            ? parseFloat(trade.netProfit.toString())
            : null,
          profitPercentage: trade.profitPercentage
            ? parseFloat(trade.profitPercentage.toString())
            : null,
          status: trade.status,
          entryTime: trade.entryTime,
          exitTime: trade.exitTime,
        }));
      }),

    open: protectedProcedure.query(async ({ ctx }) => {
      const trades = await db.getOpenTradesByUser(ctx.user.id);

      return trades.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: parseFloat(trade.entryPrice.toString()),
        quantity: parseFloat(trade.quantity.toString()),
        fundingCollected: parseFloat(trade.fundingCollected.toString()),
        status: trade.status,
        entryTime: trade.entryTime,
      }));
    }),
  }),

  // ============ Open Positions ============
  positions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const positions = await db.getOpenPositionsByUser(ctx.user.id);

      return positions.map((pos) => ({
        id: pos.id,
        symbol: pos.symbol,
        direction: pos.direction,
        entryPrice: parseFloat(pos.entryPrice.toString()),
        currentPrice: parseFloat(pos.currentPrice.toString()),
        quantity: parseFloat(pos.quantity.toString()),
        unrealizedPnL: parseFloat(pos.unrealizedPnL.toString()),
        fundingRate: parseFloat(pos.fundingRate.toString()),
        entryTime: pos.entryTime,
        updatedAt: pos.updatedAt,
      }));
    }),
  }),

  // ============ Funding Rates ============
  fundingRates: router({
    topRates: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
        })
      )
      .query(async ({ input }) => {
        const rates = await db.getLatestFundingRates(input.limit);

        // Group by symbol and get latest rate
        const latestRates = new Map<
          string,
          {
            symbol: string;
            fundingRate: number;
            nextFundingTime: Date;
          }
        >();

        for (const rate of rates) {
          if (!latestRates.has(rate.symbol)) {
            latestRates.set(rate.symbol, {
              symbol: rate.symbol,
              fundingRate: parseFloat(rate.fundingRate.toString()),
              nextFundingTime: rate.nextFundingTime,
            });
          }
        }

        // Sort by funding rate magnitude
        const sorted = Array.from(latestRates.values()).sort((a, b) => {
          const aMag = Math.abs(a.fundingRate);
          const bMag = Math.abs(b.fundingRate);
          return bMag - aMag;
        });

        return sorted.slice(0, input.limit);
      }),
  }),

  // ============ Portfolio Metrics ============
  portfolio: router({
    metrics: protectedProcedure
      .input(
        z.object({
          period: z.enum(["daily", "monthly", "yearly"]),
          limit: z.number().min(1).max(365).default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const metrics = await db.getPortfolioMetrics(
          ctx.user.id,
          input.period,
          input.limit
        );

        return metrics.map((m) => ({
          date: m.date,
          totalPnL: parseFloat(m.totalPnL.toString()),
          winRate: parseFloat(m.winRate.toString()),
          sharpeRatio: parseFloat(m.sharpeRatio.toString()),
          maxDrawdown: parseFloat(m.maxDrawdown.toString()),
          totalTrades: m.totalTrades,
          winningTrades: m.winningTrades,
          totalFees: parseFloat(m.totalFees.toString()),
          totalFundingCollected: parseFloat(m.totalFundingCollected.toString()),
        }));
      }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      const trades = await db.getTradesByUser(ctx.user.id, 1000, 0);

      let totalPnL = 0;
      let winningTrades = 0;
      let totalFees = 0;
      let totalFundingCollected = 0;

      for (const trade of trades) {
        if (trade.status === "CLOSED") {
          const netProfit = trade.netProfit
            ? parseFloat(trade.netProfit.toString())
            : 0;
          const fees = parseFloat(trade.fees.toString());
          const funding = parseFloat(trade.fundingCollected.toString());

          totalPnL += netProfit;
          totalFees += fees;
          totalFundingCollected += funding;

          if (netProfit > 0) {
            winningTrades++;
          }
        }
      }

      const winRate =
        trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

      return {
        totalPnL,
        winRate,
        totalTrades: trades.length,
        winningTrades,
        totalFees,
        totalFundingCollected,
        closedTrades: trades.filter((t) => t.status === "CLOSED").length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
