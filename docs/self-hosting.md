# Self-hosting GoatPocket

GoatPocket is a folder of static files. There is nothing to build and nothing to run on a server – any host that can
serve files over HTTPS will do. A public instance runs at <https://goatpocket.com>; host your own if you prefer to
control the code that handles your token.

> This guide is about hosting **GoatPocket**. To host **GoatCounter** itself, see the
> [GoatCounter README](https://github.com/arp242/goatcounter#self-hosting-goatcounter).

## What to deploy

Deploy the repository root. These paths are needed at runtime:

```
index.html   legal.html   assets/   app/   icons/   sw.js
```

Everything else (`docs/`, `test/`, `scripts/`, config files) is optional. The app works in a subfolder too
(e.g. `https://example.com/goatpocket/`), as all paths are relative.

HTTPS is required: service workers and the installable app only work on secure origins (and on `localhost`).

## Netlify

The repository contains a ready-made [`netlify.toml`](../netlify.toml). Fork the repository, create a new Netlify site
from it, and leave the build command empty. Every push to `main` is deployed.

### App on its own subdomain

goatpocket.com serves the landing page and app.goatpocket.com the app – both from the same Netlify site. The
`[[redirects]]` in `netlify.toml` rewrite `app.<domain>/*` to `/app/`. To copy that setup, add both domains to your
Netlify site and replace `goatpocket.com` in those rules (and `SITE_URL` in `app/js/main.js`). Without a subdomain,
the app simply lives at `/app/`.

## GitHub Pages

In your fork: *Settings → Pages → Deploy from a branch → `main` / root*. GitHub Pages can't set custom headers, so the
security headers below won't be sent; the app still works.

## Cloudflare Pages

Create a project from your fork with no build command and `/` as the output directory. For headers, copy the values
from `netlify.toml` into a [`_headers`](https://developers.cloudflare.com/pages/configuration/headers/) file.

## nginx

```nginx
server {
    listen 443 ssl;
    server_name pocket.example.com;
    root /srv/goatpocket;

    include mime.types;
    types { application/manifest+json webmanifest; }

    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header X-Content-Type-Options "nosniff" always;

    location = /sw.js { add_header Cache-Control "no-cache"; }
}
```

## Caddy

```caddy
pocket.example.com {
    root * /srv/goatpocket
    file_server
    header {
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"
        Referrer-Policy "no-referrer"
        X-Content-Type-Options "nosniff"
    }
    header /sw.js Cache-Control "no-cache"
}
```

## Docker

```bash
docker run -d -p 8080:80 -v "$PWD:/usr/share/nginx/html:ro" nginx:alpine
```

Put a TLS-terminating proxy in front of it.

## Security headers

The headers in `netlify.toml` are recommended for every deployment:

| Header                       | Why                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`    | Only scripts from your own origin can run, so nothing injected could read the token from `localStorage`. `connect-src https:` is needed because GoatCounter can live on any domain. If all your users use goatcounter.com, you can tighten it to `connect-src 'self' https://*.goatcounter.com`. |
| `Referrer-Policy: no-referrer` | Links to GoatCounter don't reveal where they came from.                                                 |
| `X-Content-Type-Options`     | Prevents MIME sniffing.                                                                                   |
| `frame-ancestors 'none'`     | The app can't be embedded in other sites (clickjacking).                                                  |

## Customizing

- **Legal pages and credits – please change these.** `legal.html` contains the privacy policy and imprint of the
  operator of goatpocket.com, including their name and address. Replace it with your own (or remove it and the links if
  you don't need one). The footer links to the author's site and Ko-fi are set in `index.html`, `legal.html` and at
  the top of `app/js/main.js` (`AUTHOR_URL`, `LEGAL_URL`, `KOFI_URL`).
- **Links** to the help pages point to this GitHub repository. They are set in `app/js/main.js` (`HELP_URL`) and in
  `index.html`.
- **Landing page:** if you only want the app, you can replace `index.html` with a redirect to `app/`.
- **Updates:** pull from upstream and redeploy. When you change the list of app files, bump `VERSION` in `sw.js` so
  installed apps pick up the new cache.
