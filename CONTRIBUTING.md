# Contributing to GoatPocket

Thanks for helping! Bug reports, translations, fixes and ideas are all welcome.

## Ground rules

- **Keep it small and static.** GoatPocket deliberately has no build step, no framework and no runtime dependencies.
  Anyone should be able to read the whole app in an afternoon and host it by copying files. Please don't add a bundler
  or npm packages that ship to the browser.
- **Privacy first.** The app must never send the token or statistics anywhere except the user's own GoatCounter
  instance, and must not add analytics, fonts or other third-party requests.
- **Be gentle on GoatCounter.** Every new API call counts against the 4 requests/second limit. Reuse cached responses
  (`client.get()` de-duplicates identical requests) and keep the number of calls per screen low.
- **Mobile first, accessible.** Test on a narrow screen, keep touch targets ≥ 44 px, and make sure things work with a
  keyboard and a screen reader.

## Getting started

```bash
git clone https://github.com/TobiasWust/goatpocket.git
cd goatpocket
npm install      # ESLint + Prettier, dev only
npm start        # http://localhost:4173
```

Use `http://localhost:4173/app/?demo` to work with made-up data. To test against a real account, create a read-only
token in GoatCounter (*User → API*, **Read statistics** + **Read sites**).

Before opening a pull request:

```bash
npm run format   # Prettier
npm run lint     # ESLint + Prettier check
npm test         # unit tests (Node's built-in test runner)
```

CI runs `lint` and `test` on every pull request.

## Code tour

| File                 | What it does                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `app/js/main.js`     | App state and all views: setup form, dashboard, bottom sheets (sites, details, settings).          |
| `app/js/api.js`      | GoatCounter API client: throttling, retries, in-memory + `localStorage` cache, `AuthError`.        |
| `app/js/config.js`   | Saved accounts and sites, migration of old configs, mapping `/api/v0/sites` responses.             |
| `app/js/period.js`   | Date ranges and grouping the API's hourly UTC numbers into local hours/days/weeks.                 |
| `app/js/i18n.js`     | Translations (`t()`), language detection, shared `Intl` formatters.                                |
| `app/js/demo.js`     | Fake API for `?demo`, deterministic per hour.                                                      |
| `app/js/util.js`     | `esc()`, `normalizeBase()`, safe `localStorage` wrapper and other helpers.                         |
| `app/style.css`      | App styles; colors are tokens on `:root` with a dark-mode variant.                                 |
| `sw.js`              | Service worker: caches the app shell, network first.                                               |
| `index.html`, `assets/` | Landing page.                                                                                   |

A few conventions:

- **Rendering** is template strings + `innerHTML`. Every value that comes from the API or the user **must** go
  through `esc()`. Translated strings are trusted (some contain `<b>`).
- **Stale responses:** `state.gen` is bumped on every reload; async work compares its generation before touching the
  DOM. Sheets use `openSheet()`'s token and `isSheetCurrent()` the same way.
- **Pure logic goes into modules without DOM access** (`period.js`, `config.js`, `util.js`, …) so it can be unit
  tested in Node. Add tests in `test/` for anything non-trivial there.
- When you add, rename or remove a file the app loads, update `SHELL` and bump `VERSION` in `sw.js`.

## Translations

GoatPocket speaks English and German. To add a language:

1. In `app/js/i18n.js`, copy the `en` block in `STRINGS`, translate the values, and add the language to `LANGUAGES`.
   Keep `{placeholders}` and any `<b>` tags.
2. Optionally translate GoatCounter's screen size names in `SIZE_NAMES`.
3. Run `npm test` – it checks that every key and placeholder exists in every language.

## Reporting bugs

Please [open an issue](https://github.com/TobiasWust/goatpocket/issues/new/choose) with your browser/OS, whether you
use goatcounter.com or a self-hosted instance, and what you expected. **Never include your API token.** Security
problems: see [SECURITY.md](SECURITY.md).

## License

By contributing you agree that your contributions are licensed under the [MIT license](LICENSE).
