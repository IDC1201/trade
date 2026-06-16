import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

/**
 * Binance API client for futures trading
 */
export class BinanceClient {
  private apiKey: string;
  private apiSecret: string;
  private baseURL: string;
  private client: AxiosInstance;

  constructor(apiKey: string, apiSecret: string, testnet: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = testnet
      ? "https://testnet.binancefuture.com"
      : "https://fapi.binance.com";

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "X-MBX-APIKEY": this.apiKey,
      },
    });
  }

  /**
   * Generate signature for authenticated requests
   */
  private generateSignature(queryString: string): string {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(queryString)
      .digest("hex");
  }

  /**
   * Get funding rate for a symbol
   */
  async getFundingRate(symbol: string): Promise<{
    symbol: string;
    fundingRate: number;
    fundingTime: number;
    nextFundingTime: number;
  }> {
    try {
      const response = await this.client.get("/fapi/v1/fundingRate", {
        params: {
          symbol: symbol,
          limit: 1,
        },
      });

      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        return {
          symbol,
          fundingRate: parseFloat(data.fundingRate),
          fundingTime: data.fundingTime,
          nextFundingTime: data.nextFundingTime,
        };
      }

      throw new Error(`No funding rate data for ${symbol}`);
    } catch (error) {
      console.error(`[Binance] Error fetching funding rate for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get all funding rates for all symbols
   */
  async getAllFundingRates(): Promise<
    Array<{
      symbol: string;
      fundingRate: number;
      fundingTime: number;
      nextFundingTime: number;
    }>
  > {
    try {
      const response = await this.client.get("/fapi/v1/fundingRate");

      return response.data.map((item: any) => ({
        symbol: item.symbol,
        fundingRate: parseFloat(item.fundingRate),
        fundingTime: item.fundingTime,
        nextFundingTime: item.nextFundingTime,
      }));
    } catch (error) {
      console.error("[Binance] Error fetching all funding rates:", error);
      throw error;
    }
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await this.client.get("/fapi/v1/ticker/price", {
        params: { symbol },
      });

      return parseFloat(response.data.price);
    } catch (error) {
      console.error(`[Binance] Error fetching price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Place a futures order
   */
  async placeOrder(params: {
    symbol: string;
    side: "BUY" | "SELL";
    positionSide: "LONG" | "SHORT";
    type: "MARKET" | "LIMIT";
    quantity: number;
    price?: number;
    leverage?: number;
  }): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryParams = {
        symbol: params.symbol,
        side: params.side,
        positionSide: params.positionSide,
        type: params.type,
        quantity: params.quantity,
        ...(params.price && { price: params.price }),
        timestamp,
      };

      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.generateSignature(queryString);

      const response = await this.client.post("/fapi/v1/order", null, {
        params: {
          ...queryParams,
          signature,
        },
      });

      return response.data;
    } catch (error) {
      console.error("[Binance] Error placing order:", error);
      throw error;
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string, positionSide: "LONG" | "SHORT"): Promise<any> {
    try {
      const side = positionSide === "LONG" ? "SELL" : "BUY";

      const timestamp = Date.now();
      const queryParams = {
        symbol,
        side,
        positionSide,
        type: "MARKET",
        closePosition: true,
        timestamp,
      };

      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.generateSignature(queryString);

      const response = await this.client.post("/fapi/v1/order", null, {
        params: {
          ...queryParams,
          signature,
        },
      });

      return response.data;
    } catch (error) {
      console.error("[Binance] Error closing position:", error);
      throw error;
    }
  }

  /**
   * Get open positions
   */
  async getOpenPositions(): Promise<
    Array<{
      symbol: string;
      positionAmt: number;
      positionSide: string;
      entryPrice: number;
      markPrice: number;
      unRealizedProfit: number;
      percentage: number;
    }>
  > {
    try {
      const timestamp = Date.now();
      const queryParams = {
        timestamp,
      };

      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.generateSignature(queryString);

      const response = await this.client.get("/fapi/v2/positionRisk", {
        params: {
          ...queryParams,
          signature,
        },
      });

      return response.data
        .filter((pos: any) => parseFloat(pos.positionAmt) !== 0)
        .map((pos: any) => ({
          symbol: pos.symbol,
          positionAmt: parseFloat(pos.positionAmt),
          positionSide: pos.positionSide,
          entryPrice: parseFloat(pos.entryPrice),
          markPrice: parseFloat(pos.markPrice),
          unRealizedProfit: parseFloat(pos.unRealizedProfit),
          percentage: parseFloat(pos.percentage),
        }));
    } catch (error) {
      console.error("[Binance] Error fetching open positions:", error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{
    totalWalletBalance: number;
    totalUnrealizedProfit: number;
    totalMarginBalance: number;
  }> {
    try {
      const timestamp = Date.now();
      const queryParams = {
        timestamp,
      };

      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.generateSignature(queryString);

      const response = await this.client.get("/fapi/v2/account", {
        params: {
          ...queryParams,
          signature,
        },
      });

      return {
        totalWalletBalance: parseFloat(response.data.totalWalletBalance),
        totalUnrealizedProfit: parseFloat(response.data.totalUnrealizedProfit),
        totalMarginBalance: parseFloat(response.data.totalMarginBalance),
      };
    } catch (error) {
      console.error("[Binance] Error fetching balance:", error);
      throw error;
    }
  }

  /**
   * Set leverage
   */
  async setLeverage(symbol: string, leverage: number): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryParams = {
        symbol,
        leverage,
        timestamp,
      };

      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.generateSignature(queryString);

      const response = await this.client.post("/fapi/v1/leverage", null, {
        params: {
          ...queryParams,
          signature,
        },
      });

      return response.data;
    } catch (error) {
      console.error("[Binance] Error setting leverage:", error);
      throw error;
    }
  }
}
