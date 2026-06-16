import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Search, Download, TrendingUp, TrendingDown } from "lucide-react";

export default function TradeHistory() {
  const [searchSymbol, setSearchSymbol] = useState("");
  const [limit, setLimit] = useState(50);

  // Query
  const trades = trpc.trades.list.useQuery({ limit, offset: 0 });

  // Filter trades
  const filteredTrades = trades.data?.filter((trade) =>
    trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase())
  );

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    return `${value.toFixed(4)}%`;
  };

  // Export trades to CSV
  const handleExport = () => {
    if (!trades.data) return;

    const csv = [
      [
        "Symbol",
        "Direction",
        "Entry Price",
        "Exit Price",
        "Quantity",
        "Funding Collected",
        "Fees",
        "Net Profit",
        "Profit %",
        "Status",
        "Entry Time",
        "Exit Time",
      ],
      ...trades.data.map((trade) => [
        trade.symbol,
        trade.direction,
        trade.entryPrice,
        trade.exitPrice || "-",
        trade.quantity,
        trade.fundingCollected,
        trade.fees,
        trade.netProfit || "-",
        trade.profitPercentage || "-",
        trade.status,
        new Date(trade.entryTime).toISOString(),
        trade.exitTime ? new Date(trade.exitTime).toISOString() : "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trade History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and analyze all executed trades
        </p>
      </div>

      {/* Search and Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol (e.g., BTCUSDT)"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleExport}
              disabled={!trades.data || trades.data.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredTrades?.length || 0} Trade{filteredTrades?.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Spinner />
            </div>
          ) : filteredTrades && filteredTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-3 font-medium">Symbol</th>
                    <th className="text-left py-3 px-3 font-medium">
                      Direction
                    </th>
                    <th className="text-right py-3 px-3 font-medium">
                      Entry Price
                    </th>
                    <th className="text-right py-3 px-3 font-medium">
                      Exit Price
                    </th>
                    <th className="text-right py-3 px-3 font-medium">
                      Quantity
                    </th>
                    <th className="text-right py-3 px-3 font-medium">
                      Funding
                    </th>
                    <th className="text-right py-3 px-3 font-medium">Fees</th>
                    <th className="text-right py-3 px-3 font-medium">
                      Net Profit
                    </th>
                    <th className="text-right py-3 px-3 font-medium">
                      Profit %
                    </th>
                    <th className="text-left py-3 px-3 font-medium">Status</th>
                    <th className="text-left py-3 px-3 font-medium">
                      Entry Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade) => {
                    const netProfit = trade.netProfit || 0;
                    const profitPercent = trade.profitPercentage || 0;

                    return (
                      <tr
                        key={trade.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-3 font-medium">
                          {trade.symbol}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              trade.direction === "LONG"
                                ? "default"
                                : "destructive"
                            }
                            className="gap-1"
                          >
                            {trade.direction === "LONG" ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {trade.direction}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          ${trade.entryPrice.toFixed(4)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          {trade.exitPrice
                            ? `$${trade.exitPrice.toFixed(4)}`
                            : "-"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          {trade.quantity.toFixed(4)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-green-600">
                          {formatCurrency(trade.fundingCollected)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-red-600">
                          {formatCurrency(trade.fees)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono text-xs font-medium ${
                            netProfit > 0
                              ? "text-green-600"
                              : netProfit < 0
                                ? "text-red-600"
                                : ""
                          }`}
                        >
                          {formatCurrency(netProfit)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono text-xs font-medium ${
                            profitPercent > 0
                              ? "text-green-600"
                              : profitPercent < 0
                                ? "text-red-600"
                                : ""
                          }`}
                        >
                          {formatPercent(profitPercent)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              trade.status === "CLOSED"
                                ? "default"
                                : trade.status === "OPEN"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {trade.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {new Date(trade.entryTime).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trades found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More Button */}
      {trades.data && trades.data.length >= limit && (
        <div className="flex justify-center">
          <Button
            onClick={() => setLimit(limit + 50)}
            variant="outline"
            disabled={trades.isLoading}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
