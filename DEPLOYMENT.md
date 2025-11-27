# 🚀 Deploying to Railway

Since you already have a Railway project with a database, deploying the bot is easy!

## Step 1: Install Railway CLI (Optional but recommended)
If you want to deploy from your terminal:
```bash
npm i -g @railway/cli
railway login
```

## Step 2: Link to Your Project
1. Run `railway link` inside the project folder.
2. Select the project you created earlier (where your database is).

## Step 3: Deploy
Run:
```bash
railway up
```

## Alternative: Deploy via GitHub (Easiest)
1. Push this code to a GitHub repository.
2. Go to your Railway project dashboard.
3. Click **"New"** -> **"GitHub Repo"**.
4. Select your repository.
5. Railway will automatically detect the `Dockerfile` and build it.

## Step 4: Configure Environment Variables
1. Go to your new service in Railway.
2. Click **"Variables"**.
3. Add the following:
   - `TELEGRAM_BOT_TOKEN`: Your bot token.
   - `DATABASE_URL`: (This should be auto-injected if you linked it, but verify).
   - `CHECK_INTERVAL_MINUTES`: `60` (or your preference).

## Step 5: Verify
Check the **"Logs"** tab in Railway. You should see:
`🚀 Starting Costco Price Tracker Bot...`
