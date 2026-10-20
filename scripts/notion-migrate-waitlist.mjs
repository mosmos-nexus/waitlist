// Adds the survey v2 + UTM columns to the Notion Waitlist DB.
//   node scripts/notion-migrate-waitlist.mjs           # dry run: print what is missing
//   node scripts/notion-migrate-waitlist.mjs --apply   # actually add the missing properties
//
// Reads NOTION_SECRET and NOTION_DB from the environment, falling back to .env.local / .env
// at the repo root. It only ever ADDS missing properties: existing properties and their
// options are never renamed, retyped or deleted, so historic rows stay untouched. Option
// values must stay in sync with src/lib/data/survey-options.ts.
import { Client } from '@notionhq/client';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// loadEnvFile never overrides a variable that is already set, so load the
// higher-priority file first.
for (const file of ['.env.local', '.env']) {
  const path = fileURLToPath(new URL(`../${file}`, import.meta.url));
  if (existsSync(path)) process.loadEnvFile(path);
}

const { NOTION_SECRET, NOTION_DB } = process.env;
if (!NOTION_SECRET || !NOTION_DB) {
  console.error('NOTION_SECRET and NOTION_DB must be set (environment, .env.local or .env).');
  process.exit(1);
}
const apply = process.argv.includes('--apply');

const select = (...names) => ({ select: { options: names.map((name) => ({ name })) } });
const richText = { rich_text: {} };

// name -> [expected Notion type, create-payload]
const WANTED = {
  국가: ['select', select('한국', '일본', '기타')],
  'AI 서비스 수': ['select', select('0–1개', '2–3개', '4개 이상')],
  '처음 맡겨 볼 일': ['rich_text', richText],
  'UTM Source': ['rich_text', richText],
  'UTM Medium': ['rich_text', richText],
  'UTM Campaign': ['rich_text', richText],
  Referrer: ['rich_text', richText],
};

const notion = new Client({ auth: NOTION_SECRET });

// Same resolution as src/lib/server/notion.ts: the DB id -> its first data source.
const db = await notion.databases.retrieve({ database_id: NOTION_DB });
const data_source_id = db.data_sources?.[0]?.id;
if (!data_source_id) {
  console.error('Notion database has no data source.');
  process.exit(1);
}
const { properties: existing } = await notion.dataSources.retrieve({ data_source_id });

const missing = [];
let mismatched = 0;
for (const [name, [type]] of Object.entries(WANTED)) {
  if (!existing[name]) {
    missing.push(name);
    console.log(`  missing   ${name} (${type})`);
  } else if (existing[name].type !== type) {
    mismatched++;
    console.log(
      `  MISMATCH  ${name} exists as "${existing[name].type}", expected "${type}" (left untouched)`,
    );
  } else {
    console.log(`  ok        ${name} (${type})`);
  }
}

console.log(`\nData source ${data_source_id}`);
if (missing.length === 0) {
  console.log('Nothing to add.');
} else if (!apply) {
  console.log(`DRY RUN: would add ${missing.length} propert${missing.length === 1 ? 'y' : 'ies'}.`);
  console.log('Re-run with --apply to make the change.');
} else {
  const properties = Object.fromEntries(missing.map((name) => [name, WANTED[name][1]]));
  const updated = await notion.dataSources.update({ data_source_id, properties });
  const stillMissing = missing.filter((name) => !updated.properties?.[name]);
  if (stillMissing.length > 0) {
    console.error(`Update returned without: ${stillMissing.join(', ')}`);
    process.exit(1);
  }
  console.log(`APPLIED: added ${missing.length} propert${missing.length === 1 ? 'y' : 'ies'}.`);
}
if (mismatched > 0) {
  console.log(
    `${mismatched} existing propert${mismatched === 1 ? 'y has' : 'ies have'} an unexpected type.`,
  );
}
