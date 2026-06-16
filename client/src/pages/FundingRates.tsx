import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

export default function FundingRates() {
  const [countdown, setCountdown] = useState(0);

  // Query
  const fundingRates = trpc.fundingRates.topRates.useQuery({ limit: 50 });

  // Calculate countdown to next funding
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      const seconds = now.getUTCSeconds();

      // Binance funding times: 00:00, 08:00, 16:00 UTC
      const fundingTimes = [0, 8, 16];
      let nextFundingHour = fundingTimes[0];

      for (const time of fundingTimes) {
        if (time > hours || (time === hours && minutes > 0)) {
          nextFundingHour = time;
          break;
        }
      }

      // If no funding time found today, next is tomorrow at 00:00
      if (nextFundingHour === fundingTimes[0] && hours >= 16) {
        nextFundingHour = 24;
      }

      const nextFunding = new Date();
      if (nextFundingHour === 24) {
        nextFunding.setUTCDate(nextFunding.getUTCDate() + 1);
        nextFunding.setUTCHours(0, 0, 0, 0);
      } else {
        nextFunding.setUTCHours(nextFundingHour, 0, 0, 0);
      }

      const diff = nextFunding.getTime() - now.getTime();
      setCountdown(Math.max(0, Math.floor(diff / 1000)));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Separate long and short opportunities
  const longCandidates = fundingRates.data?.filter((r) => r.fundingRate < 0) || [];
  const shortCandidates = fundingRates.data?.filter((r) => r.fundingRate > 0) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Funding Rates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time funding rate leaderboard for arbitrage opportunities
        </p>
      </div>

      {/* Countdown to Next Funding */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-300">
                  Next Funding Settlement
                </p>
                <p className="text-xs text-blue-200">
                  Binance futures funding occurs at 00:00, 08:00, and 16:00 UTC
                </p>
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-blue-300">
              {formatCountdown(countdown)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Long Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Long Opportunities (Negative Funding)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fundingRates.isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner />
            </div>
          ) : longCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">Funding Rate</th>
                    <th className="text-right py-2 px-3">Next Settlement</th>
                    <th className="text-right py-2 px-3">8h Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {longCandidates.map((rate) => {
                    const collected = Math.abs(rate.fundingRate) * 100 * 8; // Estimated for 1 BTC
                    return (
                      <tr key={rate.symbol} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-3 font-medium">{rate.symbol}</td>
                        <td className="py-3 px-3 text-right">
                          <Badge variant="default" className="bg-red-600">
                            {(rate.fundingRate * 100).toFixed(4)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-muted-foreground">
                          {new Date(
                            rate.nextFundingTime
                          ).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 text-right text-green-600 font-medium">
                          +{collected.toFixed(4)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No long opportunities available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Short Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Short Opportunities (Positive Funding)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fundingRates.isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner />
            </div>
          ) : shortCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">Funding Rate</th>
                    <th className="text-right py-2 px-3">Next Settlement</th>
                    <th className="text-right py-2 px-3">8h Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {shortCandidates.map((rate) => {
                    const collected = rate.fundingRate * 100 * 8; // Estimated for 1 BTC
                    return (
                      <tr key={rate.symbol} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-3 font-medium">{rate.symbol}</td>
                        <td className="py-3 px-3 text-right">
                          <Badge variant="destructive">
                            +{(rate.fundingRate * 100).toFixed(4)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-muted-foreground">
                          {new Date(
                            rate.nextFundingTime
                          ).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 text-right text-green-600 font-medium">
                          +{collected.toFixed(4)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No short opportunities available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-base">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Long Opportunities:</strong> Negative funding rates mean you
            receive funding when going long. The bot automatically enters long
            positions on high-magnitude negative rates.
          </p>
          <p>
            <strong>Short Opportunities:</strong> Positive funding rates mean you
            receive funding when going short. The bot automatically enters short
            positions on high-magnitude positive rates.
          </p>
          <p>
            <strong>Countdown:</strong> The countdown shows time until the next
            funding settlement. The bot executes trades in the final seconds
            before settlement to capture funding.
          </p>
          <p>
            <strong>8h Collected:</strong> Estimated funding collected over 8
            hours (one funding period) for a 1 BTC position at current rates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
