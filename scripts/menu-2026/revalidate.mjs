#!/usr/bin/env node
// Phase 12 / Plan 03: expires the live Next.js data-cache tags of the menu by
// calling the signed /api/revalidate route (src/app/api/revalidate/route.ts ->
// revalidateTag(_type, { expire: 0 })), exactly as a Sanity GROQ webhook would.
//
//   node --env-file=.env.local scripts/menu-2026/revalidate.mjs
//        [--url https://umai-ramen.fr/api/revalidate]
//        [--types menuCategory,menuItem,menuExtra,menuFormule]
//        [--delay <seconds>] [--self-test]
//
// WHY: sanityFetch() passes `revalidate: false` whenever tags are given, so the
// menu/home Sanity data stays cached until its tag is revalidated (or the container
// restarts with an empty runtime cache). The 60 s page ISR alone re-renders the
// page with the cached fetch result.
//
// Signature = `t=<ms>,v1=<base64url(HMAC-SHA256(secret, "<ms>.<raw body>"))>` in the
// `sanity-webhook-signature` header, identical to @sanity/webhook's
// encodeSignatureHeader (checked by --self-test). The secret is never printed.
// Only node:crypto + global fetch are used.

import { createHmac } from 'node:crypto';

const DEFAULT_URL = 'https://umai-ramen.fr/api/revalidate';
const DEFAULT_TYPES = ['menuCategory', 'menuItem', 'menuExtra', 'menuFormule'];
const SIGNATURE_HEADER = 'sanity-webhook-signature';
const SECRET_HINT =
  'HINT: the VPS SANITY_WEBHOOK_SECRET differs from .env.local; rerun with ' +
  'SANITY_WEBHOOK_SECRET="$(ssh umai-app "grep \'^SANITY_WEBHOOK_SECRET=\' /home/ek/apps/umai/.env.local | cut -d= -f2-")" ' +
  'node scripts/menu-2026/revalidate.mjs';

function usage(message) {
  if (message) console.error(`ERROR ${message}`);
  console.error(
    'usage: node --env-file=.env.local scripts/menu-2026/revalidate.mjs ' +
      '[--url <url>] [--types a,b,c] [--delay <seconds>] [--self-test]',
  );
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { url: DEFAULT_URL, types: DEFAULT_TYPES, delay: 0, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--self-test') {
      opts.selfTest = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') usage();
    if (!['--url', '--types', '--delay'].includes(arg)) usage(`unknown argument ${arg}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) usage(`${arg} needs a value`);
    i += 1;
    if (arg === '--url') opts.url = value;
    else if (arg === '--types') {
      opts.types = value
        .split(',')
        .map((type) => type.trim())
        .filter(Boolean);
    } else if (arg === '--delay') opts.delay = Number(value);
  }
  if (!/^https?:\/\//i.test(opts.url)) usage('--url must be an http(s) URL');
  if (opts.types.length === 0) usage('--types is empty');
  if (opts.types.some((type) => !/^[A-Za-z][\w.-]*$/.test(type))) usage('--types: invalid type name');
  if (!Number.isFinite(opts.delay) || opts.delay < 0) usage('--delay must be a number >= 0');
  return opts;
}

/** Same header value as @sanity/webhook encodeSignatureHeader(body, ts, secret). */
function sign(body, ts, secret) {
  return 't=' + ts + ',v1=' + createHmac('sha256', secret).update(ts + '.' + body).digest('base64url');
}

async function selfTest() {
  const { encodeSignatureHeader } = await import('@sanity/webhook');
  const body = '{"_type":"menuItem"}';
  const ts = 1732380000000;
  const secret = 'self-test-secret';
  const ours = sign(body, ts, secret);
  const theirs = await encodeSignatureHeader(body, ts, secret);
  if (ours === theirs) {
    console.log('SELF-TEST OK');
    return 0;
  }
  console.log(`SELF-TEST FAILED\n  ours:   ${ours}\n  sanity: ${theirs}`);
  return 1;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.selfTest) return selfTest();

  const secret = (process.env.SANITY_WEBHOOK_SECRET ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');
  if (!secret) {
    console.error('SANITY_WEBHOOK_SECRET missing');
    return 2;
  }

  if (opts.delay > 0) {
    console.log(`waiting ${opts.delay}s before revalidating`);
    await new Promise((resolve) => setTimeout(resolve, opts.delay * 1000));
  }

  let allOk = true;
  let unauthorized = false;
  for (const type of opts.types) {
    const body = JSON.stringify({ _type: type });
    try {
      const res = await fetch(opts.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [SIGNATURE_HEADER]: sign(body, Date.now(), secret),
        },
        body,
        signal: AbortSignal.timeout(60_000),
      });
      const text = (await res.text()).replace(/\s+/g, ' ').slice(0, 120);
      console.log(`revalidate ${type} -> ${res.status} ${text}`);
      if (res.status < 200 || res.status > 299) allOk = false;
      if (res.status === 401) unauthorized = true;
    } catch (err) {
      console.log(`revalidate ${type} -> ERROR ${err.cause?.code ?? err.message}`);
      allOk = false;
    }
  }
  if (unauthorized) console.log(SECRET_HINT);
  return allOk ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`ERROR ${err?.message ?? err}`);
    process.exit(2);
  },
);
