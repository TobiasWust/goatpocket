# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] – 2026-11-21

First public, open-source release.

### Added
- New home: the landing page is at <https://goatpocket.com>, the app at <https://app.goatpocket.com>. The old
  address goatpocket.wust.io redirects there.
- Landing page at `/`; the app moved to `/app/`. Installed home-screen apps that still start at `/` are forwarded
  automatically.
- The app, landing page and documentation are in English.
- Keyboard support for the chart (arrow keys).
- Links to help and documentation in the app.
- Privacy policy and imprint in English (`legal.html`), "Made with ❤️ by Wust" footer and Ko-fi link on the landing page and in
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
