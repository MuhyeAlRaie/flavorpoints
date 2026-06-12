# FlavorPoints - Complete Setup Guide

> **FlavorPoints** is a Restaurant Loyalty & Rewards Platform built with Next.js 16, Supabase, and deployed on GitHub Pages.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create a Supabase Project](#step-1-create-a-supabase-project)
4. [Step 2: Set Up the Database](#step-2-set-up-the-database)
5. [Step 3: Configure Authentication](#step-3-configure-authentication)
6. [Step 4: Local Development Setup](#step-4-local-development-setup)
7. [Step 5: Deploy to GitHub Pages](#step-5-deploy-to-github-pages)
8. [Demo Accounts](#demo-accounts)
9. [Project Structure](#project-structure)
10. [Features Guide](#features-guide)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              GitHub Pages (Static)               │
│         Next.js Static Export (HTML/JS)          │
└──────────────────────┬──────────────────────────┘
                       │ Supabase JS Client
                       ▼
┌─────────────────────────────────────────────────┐
│                  Supabase                        │
│  ┌─────────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  PostgreSQL  │ │   Auth   │ │  RPC Funcs   │ │
│  │  + RLS      │ │ (Email)  │ │ (add_visit,  │ │
│  │             │ │          │ │  play_game,   │ │
│  │             │ │          │ │  redeem_reward│ │
│  └─────────────┘ └──────────┘ └──────────────┘ │
└─────────────────────────────────────────────────┘
```

**Key Points:**
- The app is a **static site** — no server-side code runs
- All data operations happen **client-side** via the Supabase JS SDK
- **Row Level Security (RLS)** policies protect all data access
- **PostgreSQL RPC functions** handle complex operations (visits, games, redemptions)
- Phone numbers are mapped to fake emails (`{phone}@flavorpoints.local`) for Supabase Auth compatibility

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/) runtime
- A [GitHub](https://github.com/) account
- A [Supabase](https://supabase.com/) account (free tier works)

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `flavorpoints` (or any name you like)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Pick the closest to your users
4. Click **"Create new project"** and wait for it to provision (~2 minutes)
5. Once ready, go to **Project Settings → API**
6. Copy these two values — you'll need them later:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

---

## Step 2: Set Up the Database

### 2.1 Run the Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the **entire contents** of the file `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success" — this creates:
   - 8 tables (`customers`, `visits`, `menu_items`, `rewards`, `game_history`, `app_settings`, `missions`, `reward_redemptions`)
   - Indexes for performance
   - Row Level Security (RLS) policies on all tables
   - 3 PostgreSQL RPC functions: `add_visit()`, `play_game()`, `redeem_reward()`
   - Default settings and menu/reward seed data

### 2.2 Run the Seed Data

1. Still in the **SQL Editor**, create another new query
2. Copy the **entire contents** of `supabase/seed.sql`
3. Paste and run it
4. This creates demo users:
   - Admin account (phone: `000000`, password: `admin123`)
   - Employee account (phone: `111111`, password: `emp123`)
   - Two customer accounts (phone: `123456` and `654321`, password: `cust123`)
   - Plus sample visits and missions

---

## Step 3: Configure Authentication

1. In Supabase dashboard, go to **Authentication → Providers**
2. Click on **Email** provider
3. **Turn OFF** "Confirm email" — this is critical! Without this, users can't sign in because the fake emails aren't real.
4. Click **Save**

> ⚠️ **IMPORTANT**: If you don't disable "Confirm email", no one will be able to log in!

---

## Step 4: Local Development Setup

### 4.1 Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/flavorpoints.git
cd flavorpoints
bun install
```

### 4.2 Configure Environment Variables

Copy the example env file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_BASE_PATH=
```

> 💡 Leave `NEXT_PUBLIC_BASE_PATH` empty for local development.

### 4.3 Run the Development Server

```bash
bun run dev
```

Open your browser and navigate to `http://localhost:3000`. You should see the FlavorPoints login screen.

### 4.4 Verify Everything Works

1. Log in with the admin account: phone `000000`, password `admin123`
2. You should see the admin dashboard with analytics
3. Log out and try the customer account: phone `123456`, password `cust123`
4. You should see your points balance, games, rewards, etc.

---

## Step 5: Deploy to GitHub Pages

### 5.1 Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `flavorpoints`)
3. Do NOT initialize with README (you already have the code)
4. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/flavorpoints.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 5.2 Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Add these **repository secrets**:

| Secret Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_BASE_PATH` | `/<your-repo-name>` (e.g., `/flavorpoints`) |

> ⚠️ The `NEXT_PUBLIC_BASE_PATH` must match your repo name with a leading slash. For example, if your repo URL is `https://username.github.io/flavorpoints/`, set this to `/flavorpoints`. If you're using a custom domain, leave it empty.

### 5.3 Enable GitHub Pages

1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, select **"GitHub Actions"**
3. The deployment workflow will automatically run when you push to `main`

### 5.4 Trigger Deployment

Push any change to `main`:
```bash
git commit --allow-empty -m "Trigger deployment"
git push
```

Or manually trigger it:
1. Go to **Actions** tab in your repository
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"**

### 5.5 Access Your App

After deployment completes (~2-3 minutes):
- Your app will be live at: `https://YOUR_USERNAME.github.io/flavorpoints/`
- Or at your custom domain if configured

---

## Demo Accounts

| Role | Phone | Password | Description |
|---|---|---|---|
| **Admin** | `000000` | `admin123` | Full access: analytics, settings, menu & reward management |
| **Employee** | `111111` | `emp123` | Search customers, add visits, redeem rewards |
| **Customer 1** | `123456` | `cust123` | 500 pts, 3 visits, active missions |
| **Customer 2** | `654321` | `cust123` | 320 pts, 5 visits, one completed mission |

> New users who sign up get 100 bonus points and 3 default missions.

---

## Project Structure

```
flavorpoints/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions deployment workflow
├── public/
│   ├── 404.html                # SPA routing for GitHub Pages
│   └── logo.svg                # App logo
├── src/
│   ├── app/
│   │   ├── globals.css         # Global styles (glassmorphism theme)
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main page (auth + dashboard routing)
│   ├── components/
│   │   ├── auth/
│   │   │   └── auth-screen.tsx          # Login/signup form
│   │   ├── dashboard/
│   │   │   ├── customer-dashboard.tsx    # Customer layout + bottom nav
│   │   │   ├── points-overview.tsx       # Points balance card
│   │   │   ├── games-hub.tsx             # Game selection + launch
│   │   │   ├── menu-view.tsx             # Menu browser
│   │   │   ├── rewards-store.tsx         # Rewards grid
│   │   │   ├── history-view.tsx          # Visit & game history
│   │   │   └── missions-view.tsx         # Active/completed missions
│   │   ├── games/
│   │   │   ├── burger-catch.tsx          # Burger Catch canvas game
│   │   │   ├── coffee-shooter.tsx        # Coffee Shooter canvas game
│   │   │   └── grand-wheel.tsx           # Grand Wheel canvas game
│   │   ├── admin/
│   │   │   └── admin-dashboard.tsx       # Admin panel (analytics, settings, CRUD)
│   │   ├── employee/
│   │   │   └── employee-dashboard.tsx    # Employee portal
│   │   └── ui/                           # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts               # Supabase API client (all data operations)
│   │   ├── supabase.ts          # Supabase client configuration
│   │   └── utils.ts             # Utility functions
│   ├── store/
│   │   ├── auth-store.ts        # Auth state (Zustand + persist)
│   │   └── app-store.ts         # UI navigation state
│   └── hooks/
│       ├── use-mobile.ts        # Mobile detection hook
│       └── use-toast.ts         # Toast notifications hook
├── supabase/
│   ├── schema.sql               # Database schema, RLS, functions
│   └── seed.sql                 # Demo data
├── .env.example                 # Environment variable template
├── next.config.ts               # Next.js config (static export)
├── package.json                 # Dependencies
└── SETUP_GUIDE.md               # This file
```

---

## Features Guide

### Customer Dashboard
- **Home**: Points balance, quick navigation cards, active missions preview
- **Menu**: Browse menu items by category (Burgers, Coffee, Salads, Sides, Desserts)
- **Games**: 3 arcade games to win bonus points:
  - **Burger Catch** (50 pts entry, 7-day cooldown): Catch falling burgers with a plate
  - **Coffee Shooter** (50 pts entry, 7-day cooldown): Click falling coffee cups
  - **Grand Wheel** (100 pts entry, 30-day cooldown): Spin the prize wheel
- **Rewards**: Redeem points for rewards (food, drinks, discounts)
- **Missions**: Track progress on visit and spending goals

### Admin Dashboard
- **Analytics**: User counts, points circulation, visit charts, game distribution
- **Settings**: Points per $1, game costs, cooldown periods
- **Menu Management**: Create, view, and delete menu items
- **Reward Management**: Create, view, and delete rewards

### Employee Dashboard
- **Search**: Find customers by phone number
- **Add Visit**: Record a customer visit and award points
- **Redeem**: Redeem rewards on behalf of customers

---

## Troubleshooting

### "Supabase is not configured" screen
This means your environment variables aren't set. Make sure:
- `.env.local` exists with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- You restarted the dev server after adding the variables

### "Invalid login credentials"
- Make sure you ran the `seed.sql` to create demo users
- Check that "Confirm email" is OFF in Supabase Auth settings
- Phone numbers are mapped to emails: phone `123456` → email `123456@flavorpoints.local`

### Blank page on GitHub Pages
- Verify `NEXT_PUBLIC_BASE_PATH` is set correctly in your GitHub secrets
- It should be `/<repo-name>` with a leading slash
- Check that GitHub Pages is set to use "GitHub Actions" as the source

### RLS policy blocking reads
- Make sure the `customers` profile is created for each auth user
- The signup flow handles this automatically
- For manually created users (via seed.sql), ensure the profile row exists

### Game cooldown not working
- Game cooldowns are checked in the PostgreSQL `play_game()` function
- Cooldown periods are configurable in admin settings
- Default: 7 days for Burger Catch & Coffee Shooter, 30 days for Grand Wheel

### New user gets "Profile not found" error
- This happens if the customer profile wasn't created during signup
- Make sure the signup flow is working (check browser console for errors)
- The `customers` table has a policy: `WITH CHECK (auth.uid() = id)` for inserts

### Build fails on GitHub Actions
- Check the Actions tab for error logs
- Common issue: missing environment variables in GitHub secrets
- Make sure all three secrets are set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_PATH`

---

## Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| State | Zustand (persist) |
| Charts | Recharts |
| Games | HTML5 Canvas API |
| Deployment | GitHub Pages (static export) |
| CI/CD | GitHub Actions |

---

## Security Notes

- **anon key** is safe to expose in client-side code — RLS policies protect the data
- **Never** expose your Supabase `service_role` key in the frontend
- All data mutations go through RLS-protected queries or SECURITY DEFINER functions
- The `add_visit`, `play_game`, and `redeem_reward` functions use `SECURITY DEFINER` to bypass RLS for authorized operations while still validating permissions internally

---

*Built with ❤️ using Next.js, Supabase, and shadcn/ui*
