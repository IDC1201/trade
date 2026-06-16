import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  botConfigurations,
  BotConfiguration,
  trades,
  Trade,
  openPositions,
  OpenPosition,
  fundingRates,
  FundingRate,
  portfolioMetrics,
  PortfolioMetric,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Bot Configuration ============

export async function getBotConfig(userId: number): Promise<BotConfiguration | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(botConfigurations)
    .where(eq(botConfigurations.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertBotConfig(
  userId: number,
  config: Partial<BotConfiguration>
): Promise<BotConfiguration> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getBotConfig(userId);

  if (existing) {
    await db
      .update(botConfigurations)
      .set({
        ...config,
        updatedAt: new Date(),
      })
      .where(eq(botConfigurations.userId, userId));

    const updated = await getBotConfig(userId);
    return updated!;
  } else {
    const result = await db.insert(botConfigurations).values({
      userId,
      ...config,
    } as any);

    const inserted = await getBotConfig(userId);
    return inserted!;
  }
}

// ============ Trades ============

export async function createTrade(trade: Omit<Trade, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(trades).values(trade as any);
  return result;
}

export async function updateTrade(tradeId: number, updates: Partial<Trade>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(trades)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(trades.id, tradeId));
}

export async function getTradesByUser(
  userId: number,
  limit: number = 100,
  offset: number = 0
): Promise<Trade[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getOpenTradesByUser(userId: number): Promise<Trade[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.status, "OPEN")))
    .orderBy(desc(trades.entryTime));
}

// ============ Open Positions ============

export async function createOpenPosition(
  position: Omit<OpenPosition, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(openPositions).values(position as any);
}

export async function updateOpenPosition(
  positionId: number,
  updates: Partial<OpenPosition>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(openPositions)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(openPositions.id, positionId));
}

export async function deleteOpenPosition(positionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(openPositions).where(eq(openPositions.id, positionId));
}

export async function getOpenPositionsByUser(userId: number): Promise<OpenPosition[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(openPositions)
    .where(eq(openPositions.userId, userId))
    .orderBy(desc(openPositions.entryTime));
}

// ============ Funding Rates ============

export async function upsertFundingRate(rate: Omit<FundingRate, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(fundingRates).values(rate as any).onDuplicateKeyUpdate({
    set: {
      fundingRate: rate.fundingRate,
      fundingTime: rate.fundingTime,
      nextFundingTime: rate.nextFundingTime,
    },
  });
}

export async function getLatestFundingRates(limit: number = 50): Promise<FundingRate[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(fundingRates)
    .orderBy(desc(fundingRates.createdAt))
    .limit(limit);
}

// ============ Portfolio Metrics ============

export async function createPortfolioMetric(
  metric: Omit<PortfolioMetric, "id" | "createdAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(portfolioMetrics).values(metric as any);
}

export async function getPortfolioMetrics(
  userId: number,
  period: "daily" | "monthly" | "yearly",
  limit: number = 100
): Promise<PortfolioMetric[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(portfolioMetrics)
    .where(
      and(eq(portfolioMetrics.userId, userId), eq(portfolioMetrics.period, period))
    )
    .orderBy(desc(portfolioMetrics.date))
    .limit(limit);
}
