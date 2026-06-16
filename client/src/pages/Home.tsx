import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  TrendingUp,
  Zap,
  BarChart3,
  Shield,
  Rocket,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">BAZ Crypto Tech</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400">{user?.name}</span>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <div className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
            <span className="text-sm font-medium text-blue-400">
              Institutional-Grade Trading Bot
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Automated Funding Rate
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Arbitrage Trading
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            High-frequency funding rate arbitrage bot with real-time monitoring,
            institutional-level risk management, and professional-grade
            dashboard. Deploy on Binance futures in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "High-Frequency Execution",
              description:
                "Lightning-fast order execution in the final seconds before funding settlement for maximum profit capture.",
            },
            {
              icon: BarChart3,
              title: "Real-Time Analytics",
              description:
                "Live PnL ticker, open positions monitor, and funding rate leaderboard with institutional-level metrics.",
            },
            {
              icon: Shield,
              title: "Risk Management",
              description:
                "Advanced position sizing, leverage controls, and maximum position limits to protect your capital.",
            },
            {
              icon: TrendingUp,
              title: "Performance Tracking",
              description:
                "Daily, monthly, and yearly performance breakdowns with Sharpe ratio, max drawdown, and win rate.",
            },
            {
              icon: Rocket,
              title: "Testnet Support",
              description:
                "Practice with Binance testnet before deploying to mainnet. Zero risk paper trading.",
            },
            {
              icon: BarChart3,
              title: "Portfolio Equity Curve",
              description:
                "Visual equity curve tracking with detailed trade history and funding collected analytics.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800/80 transition-colors"
            >
              <feature.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>

        <div className="space-y-8">
          {[
            {
              step: "1",
              title: "Configure API Keys",
              description:
                "Connect your Binance futures account with restricted API keys. Support for both testnet and mainnet.",
            },
            {
              step: "2",
              title: "Set Risk Parameters",
              description:
                "Define leverage, position size, funding rate threshold, and maximum open positions.",
            },
            {
              step: "3",
              title: "Start the Bot",
              description:
                "Click start and the bot continuously scans funding rates, identifies opportunities, and executes trades.",
            },
            {
              step: "4",
              title: "Monitor & Optimize",
              description:
                "Watch real-time metrics, analyze trade history, and optimize parameters based on performance data.",
            },
          ].map((item, idx) => (
            <div key={idx} className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-lg border border-slate-700 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Arbitrage Trading?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join institutional traders using BAZ Crypto Tech for consistent,
            automated funding rate arbitrage profits.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-950 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span className="font-bold">BAZ Crypto Tech</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2026 BAZ Crypto Tech. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
