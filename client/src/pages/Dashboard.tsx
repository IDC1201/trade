import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Settings,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "monthly" | "yearly"
  >("daily");

  // Queries
  const botStatus = trpc.bot.status.useQuery();
  const portfolioSummary = trpc.portfolio.summary.useQuery();
  const portfolioMetrics = trpc.portfolio.metrics.useQuery({
    period: selectedPeriod,
    limit: 30,
  });
  const openPositions = trpc.positions.list.useQuery();
  const fundingRates = trpc.fundingRates.topRates.useQuery({ limit: 10 });

  // Mutations
  const startBot = trpc.bot.start.useMutation({
    onSuccess: () => {
      toast.success("Bot started successfully");
      botStatus.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to start bot: ${error.message}`);
    },
  });

  const stopBot = trpc.bot.stop.useMutation({
    onSuccess: () => {
      toast.success("Bot stopped successfully");
      botStatus.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to stop bot: ${error.message}`);
    },
  });

  const handleStartBot = () => {
    if (!botStatus.data?.isConfigured) {
      toast.error("Please configure API keys first");
      return;
    }
    startBot.mutate();
  };

  const handleStopBot = () => {
    stopBot.mutate();
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Bot Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time funding rate arbitrage monitoring
          </p>
        </div>

        <div className="flex items-center gap-4">
          {botStatus.isLoading ? (
            <Spinner className="w-4 h-4" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    botStatus.data?.isRunning
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  {botStatus.data?.isRunning ? "Running" : "Stopped"}
                </span>
              </div>

              {botStatus.data?.isRunning ? (
                <Button
                  onClick={handleStopBot}
                  disabled={stopBot.isPending}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Stop Bot
                </Button>
              ) : (
                <Button
                  onClick={handleStartBot}
                  disabled={startBot.isPending}
                  size="sm"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Bot
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total PnL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioSummary.isLoading
                ? "-"
                : formatCurrency(portfolioSummary.data?.totalPnL || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolioSummary.data?.closedTrades || 0} closed trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioSummary.isLoading
                ? "-"
                : formatPercent(portfolioSummary.data?.winRate || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolioSummary.data?.winningTrades || 0} /
              {portfolioSummary.data?.totalTrades || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Funding Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioSummary.isLoading
                ? "-"
                : formatCurrency(
                    portfolioSummary.data?.totalFundingCollected || 0
                  )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {openPositions.isLoading ? "-" : openPositions.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Equity Curve */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Portfolio Performance</CardTitle>
              <Tabs
                value={selectedPeriod}
                onValueChange={(v) =>
                  setSelectedPeriod(v as "daily" | "monthly" | "yearly")
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {portfolioMetrics.isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Spinner />
              </div>
            ) : portfolioMetrics.data && portfolioMetrics.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={portfolioMetrics.data}>
                  <defs>
                    <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="totalPnL"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorPnL)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Funding Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Top Funding Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {fundingRates.isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : fundingRates.data && fundingRates.data.length > 0 ? (
              <div className="space-y-3">
                {fundingRates.data.map((rate) => (
                  <div
                    key={rate.symbol}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{rate.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          rate.nextFundingTime
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        rate.fundingRate > 0 ? "destructive" : "default"
                      }
                    >
                      {(rate.fundingRate * 100).toFixed(4)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openPositions.isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : openPositions.data && openPositions.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Symbol</th>
                    <th className="text-left py-2 px-2">Direction</th>
                    <th className="text-right py-2 px-2">Entry Price</th>
                    <th className="text-right py-2 px-2">Current Price</th>
                    <th className="text-right py-2 px-2">Quantity</th>
                    <th className="text-right py-2 px-2">Unrealized PnL</th>
                    <th className="text-right py-2 px-2">Funding Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {openPositions.data.map((pos) => {
                    const pnl = parseFloat(pos.unrealizedPnL.toString());
                    const pnlPercent =
                      ((pos.currentPrice - pos.entryPrice) /
                        pos.entryPrice) *
                      100;

                    return (
                      <tr key={pos.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">
                          {pos.symbol}
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={
                              pos.direction === "LONG"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {pos.direction}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          ${pos.entryPrice.toFixed(4)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          ${pos.currentPrice.toFixed(4)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {pos.quantity.toFixed(4)}
                        </td>
                        <td
                          className={`py-3 px-2 text-right font-medium ${
                            pnl > 0
                              ? "text-green-500"
                              : pnl < 0
                                ? "text-red-500"
                                : ""
                          }`}
                        >
                          {formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)
                        </td>
                        <td className="py-3 px-2 text-right">
                          {(pos.fundingRate * 100).toFixed(4)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No open positions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
