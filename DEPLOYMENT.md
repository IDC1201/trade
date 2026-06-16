# BAZ Crypto Tech - Deployment Guide

This guide covers deploying BAZ Crypto Tech to Vercel with proper environment configuration and database setup.

## Prerequisites

- Vercel account (free tier available)
- GitHub account with repository access
- MySQL database (cloud-hosted recommended)
- Binance API credentials (for testing/production)

## Step 1: Prepare Your Repository

### 1.1 Create GitHub Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: BAZ Crypto Tech"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/baz-crypto-tech.git
git branch -M main
git push -u origin main
```

### 1.2 Update Package Version

Edit `package.json` and ensure version is set:

```json
{
  "name": "baz-crypto-tech",
  "version": "1.0.0",
  "description": "High-frequency funding rate arbitrage bot for Binance futures"
}
```

## Step 2: Set Up Database

### Option A: PlanetScale (Recommended for Vercel)

1. Create account at https://planetscale.com
2. Create new database named `baz-crypto-tech`
3. Get connection string from "Connect" button
4. Copy the MySQL connection string

### Option B: AWS RDS

1. Create MySQL 8.0 instance
2. Configure security group to allow Vercel IPs
3. Get connection string in format: `mysql://user:password@host:3306/database`

### Option C: Other Cloud Providers

- **DigitalOcean Managed Databases**
- **Google Cloud SQL**
- **Azure Database for MySQL**
- **Heroku Postgres** (with MySQL driver)

### 2.1 Initialize Database Schema

Once you have the connection string:

```bash
# Update DATABASE_URL in .env.local
export DATABASE_URL="mysql://user:password@host:3306/database"

# Run migrations (locally first)
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Or use the Manus Management UI to execute SQL
```

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose your GitHub repository
4. Click "Import"

### 3.2 Configure Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

```
DATABASE_URL=mysql://user:password@host:3306/database
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/auth
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
JWT_SECRET=your_jwt_secret_key_min_32_chars
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
NODE_ENV=production
```

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 2-3 minutes)
3. Once deployed, you'll get a URL like `https://baz-crypto-tech.vercel.app`

## Step 4: Verify Deployment

### 4.1 Check Application

1. Visit your Vercel URL
2. Sign in with Manus OAuth
3. Navigate to Configuration
4. Test API key connection with Binance testnet

### 4.2 Monitor Logs

In Vercel dashboard:
1. Go to **Deployments**
2. Click on latest deployment
3. View **Functions** tab for server logs
4. View **Logs** tab for real-time logs

## Step 5: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings → Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update OAuth redirect URLs if needed

## Step 6: Set Up Continuous Deployment

### 6.1 Automatic Deployments

By default, Vercel automatically deploys on every push to main branch.

To disable:
1. Go to **Settings → Git**
2. Uncheck "Deploy on push to main"

### 6.2 Manual Deployments

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Step 7: Production Configuration

### 7.1 Switch to Mainnet (After Testing)

1. Sign in to your BAZ Crypto Tech dashboard
2. Go to Configuration → API Keys
3. Change environment from "testnet" to "mainnet"
4. Enter your mainnet Binance API keys
5. Click "Test Connection"

### 7.2 Set Risk Parameters

Start conservative:
- Leverage: 1-2x
- Minimum Funding Rate: 0.001 (0.1%)
- Trade Size: $100-500 USDT
- Max Open Positions: 3-5

### 7.3 Monitor Performance

1. Check Trade History regularly
2. Review Portfolio metrics
3. Adjust parameters based on results
4. Monitor Vercel logs for errors

## Troubleshooting

### Build Failures

**Error: "Cannot find module"**
```bash
# Ensure all dependencies are installed
pnpm install

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Error: "Database connection failed"**
- Verify DATABASE_URL is correct
- Ensure database is accessible from Vercel
- Check firewall/security group settings
- Test connection locally first

### Runtime Errors

**"API key invalid"**
- Verify API keys are correct
- Check Binance account has futures trading enabled
- Ensure API key has correct permissions

**"No trades executing"**
- Check funding rates are above threshold
- Verify bot is running (check dashboard status)
- Monitor funding rate leaderboard for opportunities
- Check browser console for errors

### Performance Issues

**Slow dashboard loading**
- Check database query performance
- Ensure indexes are created
- Reduce data range in charts
- Clear browser cache

**High memory usage**
- Reduce polling frequency
- Limit trade history pagination
- Archive old trades to separate table

## Monitoring & Maintenance

### Weekly Tasks
- Review trade history and PnL
- Check funding rate trends
- Monitor bot logs for errors
- Verify database backups

### Monthly Tasks
- Analyze performance metrics
- Optimize risk parameters
- Review and update API key permissions
- Check Vercel usage and costs

### Quarterly Tasks
- Security audit of API keys
- Database optimization
- Update dependencies
- Review and update documentation

## Backup & Recovery

### Database Backups

Most cloud providers offer automatic backups:

**PlanetScale**: Automatic daily backups (retention varies by plan)
**AWS RDS**: Configure automated backups in RDS console
**DigitalOcean**: Enable automated backups in database settings

### Manual Backup

```bash
# Backup database
mysqldump -u user -p database > backup.sql

# Restore from backup
mysql -u user -p database < backup.sql
```

## Rollback Procedure

If deployment breaks:

1. In Vercel dashboard, go to **Deployments**
2. Find the last working deployment
3. Click "..." menu and select "Promote to Production"
4. Verify application works
5. Investigate and fix issues

## Cost Estimation

### Vercel
- Free tier: 100 GB bandwidth/month
- Pro tier: $20/month (recommended for production)

### Database
- PlanetScale free: Up to 5 GB storage
- AWS RDS free tier: 750 hours/month
- DigitalOcean: $15/month for managed database

### Total Monthly Cost
- Development: $0-15 (free tier)
- Production: $35-50 (Vercel Pro + managed database)

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Binance API**: https://binance-docs.github.io/apidocs/
- **PlanetScale**: https://planetscale.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions

## Security Checklist

- [ ] Database password is strong (min 32 chars)
- [ ] JWT_SECRET is unique and long (min 32 chars)
- [ ] API keys have minimal required permissions
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Backups are automated
- [ ] Logs are monitored
- [ ] Access logs are reviewed regularly
- [ ] Secrets are not committed to git

## Next Steps

1. Test thoroughly on testnet
2. Start with small position sizes
3. Monitor performance for 1-2 weeks
4. Gradually increase position sizes
5. Maintain regular backups
6. Keep dependencies updated
7. Monitor costs and performance

---

**Happy trading with BAZ Crypto Tech! 🚀**
