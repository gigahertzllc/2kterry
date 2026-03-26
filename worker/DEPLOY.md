# 2K Terry's Downloads Worker — Deployment Guide

## What This Does
This Cloudflare Worker protects paid mod files in your R2 bucket. Free mods are served directly via the R2 public URL. Paid mods go through this Worker which verifies a download token before streaming the file.

## Setup Steps

### 1. Install Wrangler (if not already installed)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create KV Namespace for Download Tokens
```bash
cd worker
wrangler kv:namespace create "DOWNLOAD_TOKENS"
```
Copy the output ID and paste it into `wrangler.toml` under the `[[kv_namespaces]]` section (uncomment those lines first).

### 4. Set Stripe Webhook Secret
```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```
Enter your Stripe webhook signing secret when prompted.

### 5. Deploy the Worker
```bash
npm install
npm run deploy
```

### 6. Set Up Stripe Webhook
In your Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://2kterry-downloads.YOUR_SUBDOMAIN.workers.dev/webhook/stripe`
3. Select events: `checkout.session.completed`
4. Copy the signing secret and set it via step 4 above

### 7. Add Metadata to Stripe Payment Links
When creating Payment Links in Stripe, add metadata:
- `r2_key`: The filename in your R2 bucket (e.g., `AllStar-Jersey-Pack.zip`)
- `display_name`: Friendly filename for the download (e.g., `All-Star Weekend Jersey Pack.zip`)

## How It Works
1. Customer pays via Stripe Payment Link
2. Stripe sends webhook to this Worker
3. Worker generates a unique download token (valid 24hrs, max 3 downloads)
4. Customer gets redirected to success page with the token
5. Success page uses token to download file through Worker
6. Worker verifies token, streams file from R2

## Endpoints
- `GET /download/:token` — Download a paid file (requires valid token)
- `POST /webhook/stripe` — Stripe webhook receiver
- `POST /admin/generate-token` — Manually generate a download token
- `GET /health` — Health check
