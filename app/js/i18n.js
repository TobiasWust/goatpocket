// UI strings and number/date formatting. GoatPocket is English-only; keeping the
// strings in one place makes wording consistent and the app easy to translate later.
// Values may contain {placeholders}; a few contain trusted inline HTML (<b>).

export const STRINGS = {
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
};

/** Look up a string and fill in {placeholders}. Unknown keys are returned as-is. */
export function t(key, vars = {}) {
  const template = STRINGS[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

/** English, but keep the user's regional English (en-GB, en-AU, …) for dates and numbers. */
function locale() {
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language];
  return preferred.find((l) => /^en(-|$)/i.test(l || '')) || 'en';
}

let formats;

/** Shared Intl formatters. */
export function fmt() {
  if (!formats) {
    const l = locale();
    formats = {
      number: new Intl.NumberFormat(l),
      day: new Intl.DateTimeFormat(l, { weekday: 'short', day: 'numeric', month: 'short' }),
      date: new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short' }),
      time: new Intl.DateTimeFormat(l, { hour: '2-digit', minute: '2-digit' }),
    };
  }
  return formats;
}
