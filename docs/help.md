# GoatPocket help

GoatPocket shows the statistics of your [GoatCounter](https://www.goatcounter.com) sites in a dashboard made for
phones. This page explains how to connect, what you see, and what to do when something doesn't work.

- [Connect your site](#connect-your-site)
- [Using the dashboard](#using-the-dashboard)
- [Several sites and accounts](#several-sites-and-accounts)
- [Install as an app](#install-as-an-app)
- [Privacy and data](#privacy-and-data)
- [Troubleshooting](#troubleshooting)

## Connect your site

GoatPocket needs two things: the address of your GoatCounter site and an API token.

### 1. Create an API token

1. Sign in to GoatCounter.
2. Click your user name in the top right and open **API**.
3. Create a new token and tick these permissions:
   - **Read statistics** – required.
   - **Read sites** – optional; enables the site switcher.
4. Copy the token.

GoatPocket only ever reads. Don't give the token any write permissions.

### 2. Enter it in GoatPocket

Open the app and fill in:

| Field                  | What to enter                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Your GoatCounter site  | The code of your site, e.g. `mysite` for `mysite.goatcounter.com`. For a custom domain or a self-hosted instance the full address, e.g. `stats.example.com`. |
| API token              | The token from step 1.                                                                                                                |

GoatPocket checks the token right away. If it works, you see your dashboard.

Want to look around first? Tap **Try the demo first** – it uses made-up numbers.

## Using the dashboard

- **Time range** – the chips at the top: today, 7, 30 or 90 days, 12 months. Ranges are whole calendar days in your
  local time zone, including today.
- **Visitors** – the big number is the total for the range. The badge compares it with the period of the same length
  right before (for 7 days: the previous week).
- **Chart** – one bar per hour (today), day (up to 90 days) or week (12 months). Slide your finger over it – or hover
  with a mouse, or focus it and use the arrow keys – to see a single bar. Tap outside the chart to go back.
- **Cards** – pages, referrers, locations, browsers, systems, sizes, languages and campaigns. The shaded bar and the
  percentage show each row's share of all visitors. **Show more** loads more rows (up to 100).
- **Details** – rows with a › can be tapped: a page shows where its visitors came from, a browser or system shows the
  versions, a location shows regions, a referrer shows the exact URLs.
- **Refresh** (↻) – reloads everything and bypasses the cache.
- **Settings** (sliders icon) – open the original GoatCounter dashboard, read the help, or disconnect.

GoatCounter counts *visitors*, not page views. Totals in GoatPocket match GoatCounter's own dashboard, but small
differences around midnight are possible because GoatCounter stores hourly numbers in UTC and GoatPocket regroups them
into your local days.

## Several sites and accounts

Tap the site name at the top to open the site switcher. It lists every site of your account(s) together with its
visitors in the selected range.

- **Sites in the same account** (created under *Settings → Sites* in GoatCounter) appear automatically – this needs
  the **Read sites** permission.
- **Sites with their own login** are separate accounts. Use **+ Connect another account** in the site switcher and
  enter that site's code and its own token.
- On a **self-hosted** GoatCounter, only sites with their own domain (cname) can be listed, because GoatPocket needs a
  separate address for each site.

## Install as an app

- **iPhone / iPad (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** menu → *Install app* or *Add to Home screen*.
- **Desktop (Chrome, Edge):** the install icon in the address bar.

The installed app opens without browser bars and starts even without a connection (statistics still need one).

## Privacy and data

- There is **no GoatPocket server**. The app is a set of static files; your browser talks to your GoatCounter site
  directly.
- Your **token** is stored in your browser's `localStorage` and only sent, as an `Authorization` header, to the
  GoatCounter site it belongs to.
- API responses are **cached for five minutes** on the device so the app opens instantly; the refresh button clears
  this cache.
- GoatPocket has **no analytics, no cookies and no third-party requests**.
- **Settings → Disconnect all accounts** deletes every token and the cache from the device.

Anyone with access to your unlocked device and browser could read the token. It can only read statistics, and you can
revoke it any time in GoatCounter under *User → API*.

## Troubleshooting

**"The token is invalid."**
The token was mistyped, deleted, or belongs to another GoatCounter site. Create a new one and connect again.

**"The token is missing a required permission."**
Edit the token in GoatCounter and tick **Read statistics**. If only the site switcher shows this error, tick
**Read sites** – or ignore it, the dashboard works without.

**"Can't reach …"**
- Check the address: the code before `.goatcounter.com`, or the full domain of your instance.
- Self-hosted: the instance must be reachable from your phone over **HTTPS** with a valid certificate. A page loaded
  over HTTPS can't call plain-HTTP addresses.
- Self-hosted behind a proxy: make sure the proxy passes through the CORS headers GoatCounter sends for `/api/` and
  answers `OPTIONS` requests.
- GoatCounter may be rate-limiting you. GoatPocket retries automatically; wait a moment and tap refresh.

**Loading takes a few seconds.**
GoatCounter allows 4 API requests per second, and browsers send an extra CORS request before each call. GoatPocket
spaces its calls out (about two per second) so it never hits the limit; a full dashboard needs a dozen calls. After
that, responses come from the cache for five minutes.

**A site from my account is missing in the switcher.**
The token needs **Read sites**. On self-hosted instances, the site needs its own domain. Sites with a separate login
must be added as another account.

**The numbers differ slightly from GoatCounter.**
See the note on time zones under [Using the dashboard](#using-the-dashboard).

**Something else?**
[Open an issue](https://github.com/TobiasWust/goatpocket/issues) – please include your browser and what you saw.
Never post your token.
