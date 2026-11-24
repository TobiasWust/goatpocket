# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Custom time range: the new last chip opens two date fields (from/to). The range is remembered and compared
  with the same number of days right before it.

### Changed
- The app moved to its own domain, <https://app.goatpocket.com>; goatpocket.com is the website. Old app addresses
  (goatpocket.com/app/ and goatpocket.wust.io) redirect there. The app has its own service worker (`app/sw.js`).
  Because the address changed, accounts have to be connected once more.
- The website (not the app) counts visits with GoatCounter, without cookies; the privacy policy describes it.
- Privacy policy and imprint (`legal.html`) are now in English. The old German anchors (`#datenschutz`,
  `#impressum`) keep working.

## [1.0.0] – 2026-11-21

First public, open-source release.

### Added
- New home: <https://goatpocket.com>. The old address goatpocket.wust.io redirects there.
- Landing page at `/`; the app moved to `/app/`. Installed home-screen apps that still start at `/` are forwarded
  automatically.
- English translation; the language follows the browser and can be switched in the settings.
- Keyboard support for the chart (arrow keys).
- Links to help and documentation in the app.
- Privacy policy and imprint (`legal.html`), "Made with ❤️ by Wust" footer and Ko-fi link on the landing page and in
  the app.
- Documentation: help, self-hosting guide, contributing guide, security policy.
- Unit tests, ESLint, Prettier and a CI workflow.
- Content Security Policy and further security headers in `netlify.toml`.

### Changed
- Code split into ES modules (`api`, `config`, `period`, `i18n`, `demo`, `util`).
- Bottom sheets use the native `<dialog>` element (focus handling, Esc/back gesture, tap outside to close).
- Demo data uses neutral example sites.

### Fixed
- Leaving the demo no longer deletes a real account that is also connected.
- `localStorage` being unavailable (private mode, blocked storage) no longer breaks the app.

## Before 1.0.0

Private development: mobile dashboard, site switcher, multiple accounts, PWA, rate-limit handling.
