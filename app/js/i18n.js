// Translations. Every key must exist in every language (test/i18n.test.js checks this).
// To add a language: copy the `en` block, translate the values, add it to STRINGS and
// LANGUAGES. Values may contain {placeholders}; a few contain trusted inline HTML (<b>).

import { storage } from './util.js';

const LANG_KEY = 'goatpocket.lang';

export const LANGUAGES = { en: 'English', de: 'Deutsch' };

export const STRINGS = {
  en: {
    'range.today': 'Today',
    'range.today.prev': 'yesterday',
    'range.7': '7 days',
    'range.7.prev': 'previous week',
    'range.30': '30 days',
    'range.30.prev': 'previous 30 days',
    'range.90': '90 days',
    'range.90.prev': 'previous 90 days',
    'range.365': '12 months',
    'range.365.prev': 'previous year',
    'range.nav': 'Time range',
    'range.custom': 'Custom …',
    'range.custom.prev': 'previous {count} days',
    'range.custom.prevDay': 'day before',
    'range.custom.title': 'Custom range',
    'range.custom.from': 'From',
    'range.custom.to': 'To',
    'range.custom.apply': 'Show',
    'range.custom.invalid': 'Please pick a start and an end date.',

    'section.pages': 'Pages',
    'section.toprefs': 'Referrers',
    'section.locations': 'Locations',
    'section.browsers': 'Browsers',
    'section.systems': 'Systems',
    'section.sizes': 'Sizes',
    'section.languages': 'Languages',
    'section.campaigns': 'Campaigns',
    'name.direct': 'Direct / unknown',
    'name.unknown': 'Unknown',

    'setup.title': 'GoatPocket',
    'setup.intro': 'Your GoatCounter stats, made for your phone.',
    'setup.addTitle': 'Another account',
    'setup.addIntro': 'For sites with their own GoatCounter login: enter the code and token of that account.',
    'setup.site': 'Your GoatCounter site',
    'setup.sitePlaceholder': 'mysite or stats.example.com',
    'setup.siteHint':
      'The code before <b>.goatcounter.com</b>, or the full address for a custom domain or self-hosted instance.',
    'setup.token': 'API token',
    'setup.tokenPlaceholder': 'Paste token',
    'setup.tokenHint': 'Stored on this device only and sent nowhere but your GoatCounter site.',
    'setup.connect': 'Connect',
    'setup.checking': 'Checking …',
    'setup.demo': 'Try the demo first',
    'setup.cancel': 'Cancel',
    'setup.step1': 'Sign in to GoatCounter → <b>User</b> (top right) → <b>API</b>',
    'setup.step2': 'Create a new token with <b>Read statistics</b> and <b>Read sites</b>',
    'setup.step3': 'Copy the token and paste it here',
    'setup.help': 'Need help?',
    'setup.badAddress': 'That address doesn’t look right.',

    'error.tokenInvalid': 'The token is invalid.',
    'error.tokenPermission': 'The token is missing a required permission.',
    'error.offline': 'Can’t reach {host}.',
    'error.http': 'Error {status}',
    'error.reenter': '{message} Please enter the token again.',
    'error.noAccess': 'No access to {site}: {message}',

    'dash.refresh': 'Refresh',
    'dash.settings': 'Settings',
    'dash.switchSite': 'Switch site',
    'dash.demoBanner': 'Demo with made-up numbers.',
    'dash.connectOwn': 'Connect your site',
    'dash.visitors': 'Visitors',
    'dash.visitorsIn': 'Visitors · {range}',
    'dash.previous': '{count} in the previous period ({prev})',
    'dash.events': 'including {count} events',
    'dash.chart': 'Visitors over time',
    'dash.updated': 'Updated {time}',
    'dash.noData': 'No data for this period yet.',
    'dash.more': 'Show more',
    'dash.loading': 'Loading …',
    'dash.event': 'Event',
    'chart.hour': '{from}:00–{to}:00',
    'chart.hourAxis': '{hour}:00',
    'chart.week': 'Week of {date}',

    'sites.kicker': 'Your sites · {range}',
    'sites.title': 'Choose a site',
    'sites.error': 'Couldn’t load the site list: {message}',
    'sites.add': '+ Connect another account',
    'sites.note':
      'This lists every site in the same GoatCounter account. Sites with their own login are separate accounts and need their own token.',

    'detail.pageKicker': 'Page · Referrers',
    'detail.empty': 'No further details.',

    'settings.title': 'Settings',
    'settings.open': 'Open GoatCounter dashboard',
    'settings.language': 'Language',
    'settings.help': 'Help & documentation',
    'settings.about': 'About GoatPocket',
    'settings.disconnect': 'Disconnect all accounts',
    'settings.disconnectSub': 'Removes every token from this device',
    'settings.leaveDemo': 'Leave demo',
    'settings.leaveDemoSub': 'Back to sign-in',
    'settings.tip': 'Tip: “Share → Add to Home Screen” turns GoatPocket into an app.',
    'common.close': 'Close',
    'legal.privacy': 'Privacy',
    'legal.imprint': 'Imprint',
    'kofi.short': '☕ Buy me a coffee',
    'kofi.long': '☕ Like GoatPocket? Buy me a coffee',
  },

  de: {
    'range.today': 'Heute',
    'range.today.prev': 'gestern',
    'range.7': '7 Tage',
    'range.7.prev': 'Vorwoche',
    'range.30': '30 Tage',
    'range.30.prev': '30 Tage davor',
    'range.90': '90 Tage',
    'range.90.prev': '90 Tage davor',
    'range.365': '12 Monate',
    'range.365.prev': 'Vorjahr',
    'range.nav': 'Zeitraum',
    'range.custom.prev': '{count} Tage davor',
    'range.custom': 'Eigener …',
    'range.custom.prevDay': 'Vortag',
    'range.custom.title': 'Eigener Zeitraum',
    'range.custom.from': 'Von',
    'range.custom.to': 'Bis',
    'range.custom.apply': 'Anzeigen',
    'range.custom.invalid': 'Bitte wähle ein Start- und ein Enddatum.',

    'section.pages': 'Seiten',
    'section.toprefs': 'Herkunft',
    'section.locations': 'Länder',
    'section.browsers': 'Browser',
    'section.systems': 'Systeme',
    'section.sizes': 'Geräte',
    'section.languages': 'Sprachen',
    'section.campaigns': 'Kampagnen',
    'name.direct': 'Direkt / unbekannt',
    'name.unknown': 'Unbekannt',

    'setup.title': 'GoatPocket',
    'setup.intro': 'Deine GoatCounter-Statistiken, gemacht fürs Handy.',
    'setup.addTitle': 'Weiteres Konto',
    'setup.addIntro': 'Für Seiten mit eigenem GoatCounter-Login: Code und Token dieses Kontos eintragen.',
    'setup.site': 'Deine GoatCounter-Seite',
    'setup.sitePlaceholder': 'meinprojekt oder stats.example.com',
    'setup.siteHint':
      'Der Code vor <b>.goatcounter.com</b> – oder die ganze Adresse bei eigener Domain oder selbst gehostet.',
    'setup.token': 'API-Token',
    'setup.tokenPlaceholder': 'Token einfügen',
    'setup.tokenHint': 'Bleibt nur auf diesem Gerät gespeichert und geht ausschließlich an deine GoatCounter-Seite.',
    'setup.connect': 'Verbinden',
    'setup.checking': 'Prüfe …',
    'setup.demo': 'Erst mal die Demo ansehen',
    'setup.cancel': 'Abbrechen',
    'setup.step1': 'In GoatCounter anmelden → oben rechts <b>User</b> → <b>API</b>',
    'setup.step2': 'Neuen Token anlegen, <b>Read statistics</b> und <b>Read sites</b> ankreuzen',
    'setup.step3': 'Token kopieren und hier einfügen',
    'setup.help': 'Hilfe',
    'setup.badAddress': 'Die Adresse sieht nicht richtig aus.',

    'error.tokenInvalid': 'Token ungültig.',
    'error.tokenPermission': 'Dem Token fehlt die nötige Berechtigung.',
    'error.offline': 'Keine Verbindung zu {host}.',
    'error.http': 'Fehler {status}',
    'error.reenter': '{message} Bitte Token neu eingeben.',
    'error.noAccess': 'Kein Zugriff auf {site}: {message}',

    'dash.refresh': 'Aktualisieren',
    'dash.settings': 'Einstellungen',
    'dash.switchSite': 'Seite wechseln',
    'dash.demoBanner': 'Demo mit erfundenen Zahlen.',
    'dash.connectOwn': 'Eigene Seite verbinden',
    'dash.visitors': 'Besucher',
    'dash.visitorsIn': 'Besucher · {range}',
    'dash.previous': '{count} im Zeitraum davor ({prev})',
    'dash.events': 'davon {count} Events',
    'dash.chart': 'Verlauf der Besucher',
    'dash.updated': 'Stand {time} Uhr',
    'dash.noData': 'Noch keine Daten in diesem Zeitraum.',
    'dash.more': 'Mehr anzeigen',
    'dash.loading': 'Lade …',
    'dash.event': 'Event',
    'chart.hour': '{from}–{to} Uhr',
    'chart.hourAxis': '{hour} Uhr',
    'chart.week': 'Woche ab {date}',

    'sites.kicker': 'Deine Seiten · {range}',
    'sites.title': 'Seite wählen',
    'sites.error': 'Seitenliste nicht geladen – {message}',
    'sites.add': '+ Weiteres Konto verbinden',
    'sites.note':
      'Hier stehen alle Seiten, die im selben GoatCounter-Konto angelegt sind. Seiten mit eigenem Login sind eigene Konten und brauchen einen eigenen Token.',

    'detail.pageKicker': 'Seite · Herkunft der Besucher',
    'detail.empty': 'Keine weiteren Details vorhanden.',

    'settings.title': 'Einstellungen',
    'settings.open': 'GoatCounter-Dashboard öffnen',
    'settings.language': 'Sprache',
    'settings.help': 'Hilfe & Dokumentation',
    'settings.about': 'Über GoatPocket',
    'settings.disconnect': 'Alle Verbindungen trennen',
    'settings.disconnectSub': 'Löscht alle Token von diesem Gerät',
    'settings.leaveDemo': 'Demo verlassen',
    'settings.leaveDemoSub': 'Zur Anmeldung',
    'settings.tip': 'Tipp: Über „Teilen → Zum Home-Bildschirm“ wird GoatPocket zur App.',
    'common.close': 'Schließen',
    'legal.privacy': 'Datenschutz',
    'legal.imprint': 'Impressum',
    'kofi.short': '☕ Kaffee spendieren',
    'kofi.long': '☕ Gefällt dir GoatPocket? Spendier mir einen Kaffee',
  },
};

// GoatCounter reports screen sizes as English descriptions; translate the known ones.
const SIZE_NAMES = {
  de: {
    Phones: 'Smartphones',
    'Large phones, small tablets': 'Große Phones, kleine Tablets',
    'Tablets and small laptops': 'Tablets & kleine Laptops',
    'Computer monitors': 'Monitore',
    'Computer monitors larger than HD': 'Monitore größer als HD',
  },
};

/** Pick a supported language: explicit choice → ?lang= → browser languages → English. */
export function detectLanguage(saved, query, preferred = []) {
  for (const candidate of [saved, query, ...preferred]) {
    const code = String(candidate || '')
      .slice(0, 2)
      .toLowerCase();
    if (code in STRINGS) return code;
  }
  return 'en';
}

const browserLanguages = () => (typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language]);
const queryLanguage = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('lang'));

export let lang = detectLanguage(storage.get(LANG_KEY), queryLanguage(), browserLanguages());

/** Locale for Intl formatting: keep the user's region (en-GB, de-AT) if it matches. */
const locale = () => browserLanguages().find((l) => l?.toLowerCase().startsWith(lang)) || lang;

let formats;
function makeFormats() {
  const l = locale();
  return {
    number: new Intl.NumberFormat(l),
    day: new Intl.DateTimeFormat(l, { weekday: 'short', day: 'numeric', month: 'short' }),
    date: new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short' }),
    dateYear: new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short', year: 'numeric' }),
    time: new Intl.DateTimeFormat(l, { hour: '2-digit', minute: '2-digit' }),
  };
}

/** Shared Intl formatters for the current language. */
export const fmt = () => (formats ||= makeFormats());

export function setLanguage(code) {
  if (!(code in STRINGS)) return;
  lang = code;
  formats = null;
  storage.set(LANG_KEY, code);
  if (typeof document !== 'undefined') document.documentElement.lang = code;
}

/** Look up a translated string and fill in {placeholders}. Missing keys fall back to English. */
export function t(key, vars = {}) {
  const template = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

export const sizeName = (raw) => SIZE_NAMES[lang]?.[raw] || raw;
