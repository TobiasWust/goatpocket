# Security policy

GoatPocket handles GoatCounter API tokens, so security reports are taken seriously.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through
[GitHub security advisories](https://github.com/TobiasWust/goatpocket/security/advisories/new)
("Report a vulnerability" on the repository's *Security* tab).

You can expect an answer within a few days. Once a fix is deployed, the advisory will be published and you will be
credited unless you prefer otherwise.

## Scope

In scope: anything that could expose a user's token or statistics to someone else – for example cross-site
scripting, a token being sent to the wrong host, or weaknesses in the recommended deployment headers.

Out of scope: vulnerabilities in GoatCounter itself (please report those to
[GoatCounter](https://github.com/arp242/goatcounter)), and attacks that require an already compromised device or
browser.

## Supported versions

Only the latest version on `main` (deployed at <https://goatpocket.wust.io>) receives fixes.
