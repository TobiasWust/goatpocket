# GoatPocket

Mobiles Dashboard für [GoatCounter](https://www.goatcounter.com). Reine statische Seite ohne Build-Schritt: `index.html`, `style.css`, `app.js`.

## Starten

```bash
python3 -m http.server 4173
```

Dann `http://localhost:4173` öffnen. Mit `?demo` läuft die App mit erfundenen Zahlen.

## Verbinden

1. In GoatCounter: **User → API** → neuen Token anlegen, **Read statistics** und **Read sites** ankreuzen.
2. In GoatPocket den Seiten-Code (z. B. `meinprojekt`) und den Token eintragen.

Der Token liegt nur im `localStorage` des Geräts und wird ausschließlich an die eigene GoatCounter-Seite geschickt (`/api/v0/...`, CORS ist dort offen).

## Aufs Handy

Live unter https://goatpocket.wust.io – jeder Push auf `main` wird von Netlify automatisch veröffentlicht. Die Adresse am Handy öffnen und über „Teilen → Zum Home-Bildschirm“ als App ablegen.

## Hinweise

- PWA: `sw.js` cached die App-Hülle (Netz zuerst, Cache als Rückfall); Statistiken brauchen weiterhin eine Verbindung.
- Mit der Token-Berechtigung **Read sites** erscheint oben ein Umschalter für alle Seiten des Kontos.

- GoatCounter erlaubt 4 Anfragen pro Sekunde, und die CORS-Vorabanfrage des Browsers zählt mit. Die App macht deshalb höchstens 2 API-Aufrufe pro Sekunde und versucht abgelehnte Aufrufe erneut; ein kompletter Ladevorgang dauert rund 6 Sekunden. Antworten werden 5 Minuten auf dem Gerät zwischengespeichert.
- Seiten mit eigenem GoatCounter-Login sind eigene Konten: über den Seiten-Umschalter → „Weiteres Konto verbinden“ mit eigenem Token hinzufügen.
- Die Balken werden aus den Stundenwerten der API (UTC) in lokaler Zeit zusammengesetzt.
