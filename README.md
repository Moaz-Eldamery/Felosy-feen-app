# Spending

A personal monthly spending tracker for iPhone. It's an installable web app (PWA) on your Home Screen, backed by your own free Cloudflare Worker and D1 database.

- The app opens on **Add Payment**. Pick a category, type the amount on the keypad, and confirm.
- **Apple Pay capture:** a Shortcuts automation sends each Wallet tap (amount and merchant) to your server. When you next open the app, you file each payment with one tap.
- The **main screen** shows the month total, a pace chart (your cumulative spending against the on-track line for your budget), each category's spent vs. budget, and warnings at 80% and over budget.
- **History** lets you browse past months, filter by category, edit or delete any payment (with undo), and export to CSV.
- It works offline. Payments are saved on the phone and sync when you're back online.
- Currency is EGP. Months follow the **Cairo** calendar month.

## 1. Deploy (once, from Windows)

You need Node.js (you already have it) and a free Cloudflare account.

```powershell
cd D:\part_time\finance_management_app
npm install
npx wrangler login                     # opens the browser to sign in to Cloudflare
npx wrangler d1 create spending        # prints a database_id
```

1. Paste the printed `database_id` into `wrangler.toml`, replacing the zeros.
2. Create your secret key. Use a long random string, for example from a password manager:
   ```powershell
   npx wrangler secret put APP_KEY     # paste the key when asked
   ```
3. Create the tables and deploy:
   ```powershell
   npm run db:migrate
   npm run deploy                      # prints https://spending.<you>.workers.dev
   ```

## 2. Install on the iPhone

1. Open the `https://spending.<you>.workers.dev` URL in **Safari**.
2. Tap **Share › Add to Home Screen**.
3. Open it from the Home Screen and paste your `APP_KEY` once.

## 3. Apple Pay automation (optional, recommended)

In the app, open **Settings** (the sliders icon). It shows your Capture URL and has buttons to copy the URL and the key. Then, in the **Shortcuts** app:

1. Go to **Automation › + › Wallet**. Choose your cards and set it to **Run Immediately**.
2. Tap **Create New Shortcut** and add the **Get Contents of URL** action.
3. Set the URL to `https://spending.<you>.workers.dev/api/capture`.
4. Set **Method** to **POST** and **Request Body** to **JSON**, with three fields:
   - `amount` = *Shortcut Input › Amount*
   - `merchant` = *Shortcut Input › Merchant*
   - `key` = your APP_KEY
5. Optional: add **Show Notification** with "Open Spending to sort it".

Each tap is saved as an *unsorted* payment, and the app shows it first the next time you open it. iOS doesn't let a Shortcut open a Home Screen web app with data attached. That's why payments arrive in the database and you sort them in the app.

## Local development

```powershell
echo APP_KEY=dev-local-key-123 > .dev.vars
npm run dev                            # http://127.0.0.1:8787
```

## How it's built

| Path | What |
|---|---|
| `web/` | The PWA: plain HTML/CSS/JS modules with no build step. `js/model.js` handles Cairo time, money, and monthly sums. `js/store.js` keeps the local cache and the offline outbox. `js/app.js` is the UI. |
| `worker/src/index.js` | The API (`/api/state`, `/api/payments`, `/api/capture`, `/api/budgets`, `/api/export`). It also serves `web/`. |
| `worker/migrations/` | The D1 schema. Amounts are stored in piasters. Deletes are soft, so undo works. |
| `tools/make_icons.py` | Draws the app icons with Pillow. |

**Budgets repeat.** Saving budgets in a month applies them from that month onward. Earlier months keep their own budgets. An empty budget means "no limit": the category still counts toward the total but never warns.
