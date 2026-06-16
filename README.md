# BAZ Crypto Tech - Funding Rate Arbitrage Bot

A professional, institutional-grade high-frequency funding rate arbitrage bot for Binance futures with a real-time React dashboard. Automate profitable funding rate trades with precision execution and comprehensive performance tracking.

## Features

### Core Bot Engine
- **Binance Futures Integration**: REST API for order execution and WebSocket for real-time data
- **Funding Rate Scanner**: Continuously scans all futures pairs for arbitrage opportunities
- **Smart Arbitrage Logic**: Automatically identifies and executes trades on high-magnitude funding rates
- **Risk Management**: Configurable leverage, position sizing, and maximum open positions
- **Auto-Close Logic**: Closes positions when profit exceeds fees for consistent gains

### Dashboard
- **Real-Time Monitoring**: Live PnL ticker, open positions table, and funding rate leaderboard
- **Portfolio Analytics**: Daily, monthly, and yearly performance breakdowns
- **Performance Metrics**: Win rate, total PnL, funding collected, and trade fees
- **Trade History**: Comprehensive filterable log of all executed trades
- **Bot Controls**: Start/stop bot with visual status indicator
- **Configuration Panel**: Secure API key management and risk parameter tuning

### Deployment
- **Vercel Ready**: Optimized for serverless deployment on Vercel
- **Testnet Support**: Practice with Binance testnet before going live
- **Mainnet Ready**: Switch to live trading with a single configuration change

## Prerequisites

- Node.js 18+ and pnpm
- Binance Futures account (testnet or mainnet)
- Binance API keys with futures trading permissions

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd baz-crypto-tech
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# OAuth (Manus)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/auth

# Built-in Forge API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key

# Session
JWT_SECRET=your_jwt_secret_key

# Owner Info
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

### 3. Database Setup

The project uses Drizzle ORM with MySQL. Ensure your database is running and the `DATABASE_URL` is configured.

```bash
# Generate migrations (if schema changes)
pnpm drizzle-kit generate

# Apply migrations (via Management UI or webdev_execute_sql)
```

### 4. Start Development Server

```bash
pnpm dev
```

The app will start at `http://localhost:3000`

## Usage

### Initial Setup

1. **Sign In**: Use Manus OAuth to authenticate
2. **Configure API Keys**: 
   - Go to Configuration → API Keys
   - Choose Testnet or Mainnet environment
   - Enter your Binance API key and secret
   - Click "Test Connection" to verify
3. **Set Risk Parameters**:
   - Configure leverage (1-125x)
   - Set minimum funding rate threshold
   - Define trade size in USDT
   - Set maximum open positions

### Running the Bot

1. **Dashboard**: View real-time metrics and open positions
2. **Start Bot**: Click "Start Bot" button (requires configured API keys)
3. **Monitor**: Watch the funding rate leaderboard and trade history
4. **Optimize**: Adjust parameters based on performance metrics

### Trade Execution Flow

1. **Scan**: Bot scans all funding rates every 5 seconds
2. **Identify**: Finds pairs with funding rates above your threshold
3. **Execute**: Places orders in the final seconds before settlement
4. **Collect**: Receives funding payment at settlement
5. **Close**: Automatically closes position when profit > fees
6. **Record**: Logs trade with PnL and funding collected

## API Endpoints

### Bot Control
- `POST /api/trpc/bot.start` - Start the bot
- `POST /api/trpc/bot.stop` - Stop the bot
- `GET /api/trpc/bot.status` - Get bot status

### Configuration
- `GET /api/trpc/config.get` - Get current configuration
- `POST /api/trpc/config.update` - Update configuration
- `POST /api/trpc/config.testConnection` - Test API key connection

### Trades
- `GET /api/trpc/trades.list` - List all trades
- `GET /api/trpc/trades.open` - List open trades

### Positions
- `GET /api/trpc/positions.list` - List open positions

### Funding Rates
- `GET /api/trpc/fundingRates.topRates` - Get top funding rates

### Portfolio
- `GET /api/trpc/portfolio.metrics` - Get performance metrics
- `GET /api/trpc/portfolio.summary` - Get portfolio summary

## Architecture

### Backend
- **Express.js**: HTTP server with tRPC for type-safe API
- **Binance Client**: Custom REST client for order execution
- **Bot Engine**: Funding rate scanner and arbitrage logic
- **Database**: MySQL with Drizzle ORM for data persistence

### Frontend
- **React 19**: Modern UI framework
- **Recharts**: Professional charting library
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: High-quality component library

### Database Schema
- `users`: User accounts and authentication
- `bot_configurations`: API keys and risk settings per user
- `trades`: Executed trades with entry/exit prices and PnL
- `open_positions`: Real-time position tracking
- `funding_rates`: Historical funding rate snapshots
- `portfolio_metrics`: Daily/monthly/yearly performance data

## Deployment to Vercel

### 1. Prepare for Deployment

```bash
# Build the project
pnpm build

# Verify build output
ls dist/
```

### 2. Connect to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### 3. Set Environment Variables in Vercel

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add all variables from your `.env.local`
3. Redeploy the project

### 4. Configure Database

Ensure your MySQL database is accessible from Vercel (use a cloud database service like PlanetScale, AWS RDS, or similar).

## Security Best Practices

1. **API Keys**: Never commit `.env.local` to version control
2. **Testnet First**: Always test on Binance testnet before mainnet
3. **Limited Permissions**: Use Binance API keys with restricted permissions (futures trading only)
4. **Monitoring**: Regularly check trade logs and performance metrics
5. **Risk Management**: Start with small position sizes and low leverage
6. **Backup**: Keep backups of your configuration and trade history

## Troubleshooting

### Bot Won't Start
- Check API key configuration in the Configuration panel
- Verify API key has futures trading permissions on Binance
- Ensure you're using the correct environment (testnet/mainnet)
- Check bot logs for error messages

### No Trades Executing
- Verify minimum funding rate threshold is appropriate
- Check that you have sufficient balance on Binance
- Ensure bot status shows "Running"
- Monitor funding rate leaderboard for available opportunities

### Connection Errors
- Verify database connection string
- Check internet connectivity
- Ensure Binance API is accessible
- Review error logs in browser console

## Development

### Project Structure

```
baz-crypto-tech/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app component
│   └── index.html
├── server/                # Express backend
│   ├── binance.ts        # Binance API client
│   ├── botEngine.ts      # Arbitrage bot logic
│   ├── db.ts             # Database helpers
│   ├── routers.ts        # tRPC routes
│   └── _core/            # Framework internals
├── drizzle/              # Database schema
│   └── schema.ts
└── package.json
```

### Running Tests

```bash
# Run vitest
pnpm test

# Run with watch mode
pnpm test --watch
```

### Code Quality

```bash
# Type check
pnpm check

# Format code
pnpm format
```

## Performance Optimization

- **Lazy Loading**: Dashboard components load on demand
- **Memoization**: React components use memo for expensive renders
- **Database Indexing**: Indexes on frequently queried columns
- **Caching**: Funding rates cached to reduce API calls
- **Compression**: Gzip compression for API responses

## Monitoring & Logging

- **Dev Server Logs**: `.manus-logs/devserver.log`
- **Browser Console**: Client-side errors and debug info
- **Network Requests**: `.manus-logs/networkRequests.log`
- **Trade Logs**: Available in Trade History page

## Support & Documentation

- **Binance API Docs**: https://binance-docs.github.io/apidocs/
- **tRPC Documentation**: https://trpc.io/docs
- **Drizzle ORM**: https://orm.drizzle.team

## License

MIT

## Disclaimer

This bot is provided for educational purposes. Cryptocurrency trading involves substantial risk of loss. Past performance does not guarantee future results. Always test thoroughly on testnet before using with real funds. Use at your own risk.

---

**BAZ Crypto Tech** - Professional Funding Rate Arbitrage Trading
