# ⚡ AppBuilder — AI-Powered SaaS App Generator

> Users pay credits → describe an app → download complete working source code.  
> Your backend cost: **$0** (uses free AI model tiers).

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Auth | Auth.js v5 (NextAuth) + Google OAuth |
| Database | PostgreSQL + Prisma ORM |
| Payments | Stripe Checkout (one-time) |
| AI Providers | OpenRouter → Gemini → Groq (fallback chain) |
| UI | Tailwind CSS + Monaco Editor |
| Hosting | Vercel (free tier works) |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values — see sections below for each service.

### 3. Set up database

```bash
npx prisma db push       # Push schema to DB
npx prisma generate      # Generate Prisma client
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Setup

### Database (PostgreSQL)

Use one of these free options:
- **Supabase**: https://supabase.com (free tier: 500MB)
- **Neon**: https://neon.tech (free tier: 512MB)
- **Railway**: https://railway.app (free trial)

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### Auth.js

Generate a secret:
```bash
openssl rand -base64 32
```

```env
AUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"  # Change for production
```

#### Google OAuth (Optional but recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

```env
AUTH_GOOGLE_ID="your-client-id"
AUTH_GOOGLE_SECRET="your-client-secret"
```

---

## Stripe Setup

### Step 1: Create a Stripe account

Sign up at [stripe.com](https://stripe.com). Use **Test Mode** for development.

### Step 2: Get API keys

Dashboard → Developers → API keys:
```env
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Step 3: Create products and prices

In Stripe Dashboard → **Products** → Add product:

| Product | Price | Type |
|---------|-------|------|
| Starter Credits | $10.00 | One-time |
| Builder Credits | $25.00 | One-time |
| Pro Credits | $50.00 | One-time |

For each, copy the **Price ID** (`price_...`):

```env
STRIPE_PRICE_100_CREDITS="price_xxx"   # $10
STRIPE_PRICE_300_CREDITS="price_yyy"   # $25
STRIPE_PRICE_700_CREDITS="price_zzz"   # $50
```

### Step 4: Set up webhook (local development)

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret:
```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Step 5: Set up webhook (production)

Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events to listen: `checkout.session.completed`, `payment_intent.payment_failed`

---

## AI Provider Setup (Free Tiers)

All three providers have generous free tiers — your backend AI cost is **$0**.

### OpenRouter (Primary)
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get API key → set `OPENROUTER_API_KEY`
3. Uses `meta-llama/llama-3.1-8b-instruct:free` (no billing needed)

### Google Gemini (Fallback #1)
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Get API key → set `GEMINI_API_KEY`
3. Uses `gemini-2.0-flash-lite` (free, no billing required)

### Groq (Fallback #2)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Get API key → set `GROQ_API_KEY`
3. Uses `llama-3.3-70b-versatile` (free tier)

---

## Business Model

```
User pays $10 via Stripe
        ↓
You receive ~$9.70 (after Stripe 2.9% + $0.30 fee)
        ↓
User gets 100 credits
        ↓
User generates an app (5 credits deducted)
        ↓
Backend calls OpenRouter/Gemini/Groq FREE tier
        ↓
Your AI cost: $0
        ↓
Profit: ~$9.70 per $10 purchase
```

### Pricing Packages

| Package | Price | Credits | Apps | Per App |
|---------|-------|---------|------|---------|
| Starter | $10 | 100 | ~20 | $0.50 |
| Builder | $25 | 300 | ~60 | $0.42 |
| Pro | $50 | 700 | ~140 | $0.36 |

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Set all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

Update for production:
- `NEXTAUTH_URL` → your production URL
- `NEXT_PUBLIC_APP_URL` → your production URL
- Stripe webhook URL → production endpoint
- Google OAuth redirect URI → production callback URL

---

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/           # Login page
│   │   └── signup/          # Signup page
│   ├── (dashboard)/
│   │   ├── dashboard/       # Main dashboard
│   │   ├── generate/        # App builder form
│   │   ├── generations/     # Generation history + viewer
│   │   └── credits/         # Credit shop
│   └── api/
│       ├── auth/            # NextAuth + register
│       ├── credits/         # Balance, purchase, transactions
│       ├── stripe/          # Webhook handler
│       ├── generate/        # Core generation endpoint
│       └── generations/     # Generation history API
├── lib/
│   ├── ai-providers/        # OpenRouter, Gemini, Groq + router
│   ├── credits/             # Credit management logic
│   ├── stripe/              # Stripe client & server
│   ├── db/                  # Prisma client
│   ├── code-parser.ts       # AI output → file objects
│   └── zip-generator.ts     # File objects → ZIP download
├── components/
│   ├── Navbar.tsx           # Auth navbar with credit balance
│   └── GenerationViewer.tsx # Monaco editor + file tree
├── prisma/
│   └── schema.prisma        # DB schema
├── auth.ts                  # NextAuth configuration
├── middleware.ts             # Route protection
└── .env.local.example       # Environment template
```

---

## Credit System Flow

1. User registers → 0 credits (no free tier)
2. User buys a package via Stripe Checkout
3. Stripe fires `checkout.session.completed` webhook
4. Webhook grants credits to user's account
5. User submits prompt → credits checked → deducted → AI called
6. If AI fails → credits automatically refunded
7. User downloads ZIP of generated app

---

## Going Live Checklist

- [ ] Switch Stripe to live mode keys (`sk_live_`, `pk_live_`)
- [ ] Create live Stripe products with same Price IDs (or update env vars)
- [ ] Set up production webhook endpoint in Stripe Dashboard
- [ ] Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Update Google OAuth redirect URIs for production domain
- [ ] Set `NODE_ENV=production` (Vercel does this automatically)
- [ ] Test full purchase flow with a real card

---

## Support

If a generation fails, credits are automatically refunded within seconds.  
For payment issues, direct users to `support@yourdomain.com` with their Stripe payment intent ID.
