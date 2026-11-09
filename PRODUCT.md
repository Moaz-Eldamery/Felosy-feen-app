# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installable PWA added to the iPhone Home Screen. It's used only on the owner's iPhone, so it should feel like a native iOS app: one-handed use, safe areas, standalone display.

## Stack

PWA frontend (exact framework delegated) plus a free Cloudflare backend (Worker + D1 database) owned by the user.

- Why it's a PWA: the owner works on Windows and has no Mac, so building and sideloading a native app isn't possible. A PWA also avoids the 7-day re-signing that a free Apple ID requires.
- Why there's a backend: on iOS, Safari and a Home Screen web app keep separate storage. Apple Pay payments logged by a Shortcut have to land somewhere the app can read, so the cloud database is the single source of truth. It also serves as the backup.
- Hosting: free static hosting (e.g. Cloudflare Pages) with HTTPS, which installing a PWA requires.

## Users

One person: the owner, a student/developer in Egypt, on their own iPhone. They log each payment right after making it, often while standing at a checkout or walking away from one. The job is to know exactly how much went where this month, and to notice before a category runs past its budget.

## Product Purpose

A personal monthly spending tracker. Every payment is logged with a category and adds to the month's total and that category's total. Each calendar month is saved and stays viewable later. Success means logging a payment takes seconds, and one glance at the main screen shows the month total, the spending pace, and which categories are close to or over budget.

## Positioning

Built for one person's habits and nothing else. There are no bank links and no accounts. Apple Pay taps are captured automatically through an iOS Shortcuts automation, and you sort them with one tap.

## Operating Context

- **Manual logging:** the app always opens straight to the Add payment flow. You pick a category, enter the amount, and confirm.
- **Apple Pay capture:** a Shortcuts automation (trigger: Wallet transaction) sends the amount and merchant to the Worker with the secret key. These arrive as **unsorted payments**. When you open the app, unsorted payments appear before the blank Add payment form: "EGP 120 · Carrefour, pick a category", with the 8 categories as large tap targets. With nothing unsorted, the normal Add payment form opens.
- The month is the calendar month (resets on the 1st). The timezone is **Africa/Cairo**.

## Capabilities and Constraints

**Categories (fixed list of 8):** Food & Drinks, Water, Computer Accessories, Clothes, Bills, Transportation, Gifts, Others.

**Currency:** EGP only.

**A payment has:** amount (required), category (required), date & time (defaults to now in Cairo time, editable), payment method (Cash / Card / Apple Pay), and an optional short note or merchant.

**Budgets:**
- Each category can have a monthly budget. Budgets are optional, and a category without one is tracked but never warned about.
- Budgets repeat every month until changed. Past months keep the budgets that were active at the time.
- The total budget is the sum of the budgets that are set.

**Warnings:** a banner at the top of the main screen lists categories at 80% or more of their budget (amber) and those over budget (red).

**Screens:**
1. **Main:** month total, a pace chart, and per-category bars. The pace chart shows the cumulative total spent day by day from the 1st until today, against a dotted on-track line toward the total budget. Each bar shows spent vs. budget for one category. Add payment is always one tap away, and the app opens on it.
2. **Details & History:**
   - browse past months (total, category split, payments)
   - filter by category
   - edit any field of a payment, or delete it
   - export a month or all data to CSV

**Security:** a single long secret key, stored in the app and in the Shortcut. There are no logins and no PIN.

**Undecided / out of scope for now:**
- custom categories
- multiple currencies
- budget rollover
- income tracking

## Brand Commitments

- **Visual standard: standard iOS.** The owner chose a familiar native-iOS look over a custom visual world (2026-11-09), so the convention is the commitment.
- **Polish reference:** Apple's own apps (Wallet, Health, Fitness) for system type, grouped lists, sheets, and chart style. Revolut and bank apps for a bold total at the top and a clear transaction list.
- No name or logo yet.

## Evidence on Hand

None yet. The repository is empty. There is no real spending data, name, logo, or brand assets. Don't invent any.

## Product Principles

1. **Logging beats looking.** Every decision protects how fast a payment can be logged. Opening the app means entering a payment.
2. **Glanceable truth.** The main screen answers "how much this month, am I on pace, what's over" without scrolling or tapping.
3. **Fixable, never fragile.** Every payment can be edited or deleted, and nothing is lost between months.
4. **Warn early, not loudly.** Signal at 80% so the owner can still act. Over-budget gets clear but calm emphasis.
5. **Personal tool, zero ceremony.** No accounts, onboarding funnels, or features built for other people.
