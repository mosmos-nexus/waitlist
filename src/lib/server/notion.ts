import { Client } from '@notionhq/client';
import { NOTION_SECRET, NOTION_DB } from './env';
import type { Utm } from './validation';

// @notionhq/client v5 is data-source based: pages are created under a data source and
// queries run against it. NOTION_DB holds the database id, so we resolve (and cache)
// its primary data source id once.
const notion = new Client({ auth: NOTION_SECRET });

let dataSourceId: string | null = null;

async function getDataSourceId(): Promise<string> {
  if (dataSourceId) return dataSourceId;
  const db = (await notion.databases.retrieve({ database_id: NOTION_DB })) as {
    data_sources?: Array<{ id: string }>;
  };
  const id = db.data_sources?.[0]?.id;
  if (!id) throw new Error('Notion database has no data source');
  dataSourceId = id;
  return id;
}

// The data source's property types by name, cached briefly. Writes are filtered against them so
// signup and survey keep working before scripts/notion-migrate-waitlist.mjs has added the new
// columns, or if someone retypes one. The TTL lets a running instance notice the migration
// without a redeploy.
let schemaCache: { types: Map<string, string>; at: number } | null = null;
const SCHEMA_TTL_MS = 5 * 60_000;

async function getPropertyTypes(): Promise<ReadonlyMap<string, string>> {
  if (schemaCache && Date.now() - schemaCache.at < SCHEMA_TTL_MS) return schemaCache.types;
  const ds = await notion.dataSources.retrieve({ data_source_id: await getDataSourceId() });
  const types = new Map(Object.entries(ds.properties).map(([name, p]) => [name, p.type as string]));
  schemaCache = { types, at: Date.now() };
  return types;
}

/** A property that can't be written: absent from the schema (`actual` unset) or of another type. */
export interface Dropped {
  name: string;
  expected: string;
  actual?: string;
}

/**
 * Splits `properties` into the ones the schema can take and the ones it can't. A value is shaped
 * `{ <notion type>: payload }`, so its key is the type the property has to have.
 */
export function filterToSchema(
  properties: Record<string, Record<string, unknown>>,
  schema: ReadonlyMap<string, string>,
): { kept: Record<string, Record<string, unknown>>; dropped: Dropped[] } {
  const kept: Record<string, Record<string, unknown>> = {};
  const dropped: Dropped[] = [];
  for (const [name, value] of Object.entries(properties)) {
    const expected = Object.keys(value)[0];
    const actual = schema.get(name);
    if (actual && actual === expected) kept[name] = value;
    else dropped.push({ name, expected, actual });
  }
  return { kept, dropped };
}

const describe = ({ expected, actual }: Dropped) =>
  actual === undefined
    ? 'not found in the data source'
    : `is a "${actual}" in the data source, expected "${expected}"`;

// Without these a row is meaningless (or unconsented), so a problem with one is an error, never a drop.
const REQUIRED_PROPERTIES = ['Name', 'Email', '개인정보 수집·이용 동의'];
const warned = new Set<string>();

async function fitToSchema(
  properties: Record<string, Record<string, unknown>>,
): Promise<Record<string, Record<string, unknown>>> {
  const { kept, dropped } = filterToSchema(properties, await getPropertyTypes());
  for (const d of dropped) {
    if (REQUIRED_PROPERTIES.includes(d.name)) {
      throw new Error(`Notion data source required property "${d.name}" ${describe(d)}`);
    }
    const warning = `Notion property "${d.name}" ${describe(d)}; skipping it`;
    if (!warned.has(warning)) {
      warned.add(warning);
      console.warn(warning);
    }
  }
  return kept;
}

const richText = (content: string) => ({ rich_text: [{ text: { content } }] });

export async function isDuplicateEmail(email: string): Promise<boolean> {
  const data_source_id = await getDataSourceId();
  const res = await notion.dataSources.query({
    data_source_id,
    filter: { property: 'Email', email: { equals: email } },
    page_size: 1,
  });
  return res.results.length > 0;
}

// Live registrant count, sourced from Notion. Cached briefly so an enabled counter
// doesn't paginate the whole DB on every page render. (Gated off by default — §8.)
let countCache: { value: number; at: number } | null = null;
const COUNT_TTL_MS = 60_000;

export async function getWaitlistCount(): Promise<number> {
  if (countCache && Date.now() - countCache.at < COUNT_TTL_MS) return countCache.value;
  const data_source_id = await getDataSourceId();
  let count = 0;
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id,
      page_size: 100,
      start_cursor: cursor,
    });
    count += res.results.length;
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  countCache = { value: count, at: Date.now() };
  return count;
}

/** Creates the row with email + enforced consent. Name = the email's local part. Returns the page id. */
export async function createWaitlistEntry(email: string, utm?: Utm): Promise<string> {
  const data_source_id = await getDataSourceId();
  const name = email.split('@')[0] || email;
  const properties: Record<string, Record<string, unknown>> = {
    Name: { title: [{ text: { content: name } }] },
    Email: { email },
    '개인정보 수집·이용 동의': { checkbox: true },
  };
  if (utm?.source) properties['UTM Source'] = richText(utm.source);
  if (utm?.medium) properties['UTM Medium'] = richText(utm.medium);
  if (utm?.campaign) properties['UTM Campaign'] = richText(utm.campaign);
  if (utm?.referrer) properties['Referrer'] = richText(utm.referrer);
  const page = await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id },
    properties: await fitToSchema(properties),
    // SDK property union can't know this DB's schema; the shapes above are valid Notion values.
  } as Parameters<typeof notion.pages.create>[0]);
  return page.id;
}

export interface SurveyUpdate {
  job?: string;
  aiTasks?: string[];
  country?: string;
  aiCount?: string;
  firstTask?: string;
  jobOther?: string;
  taskOther?: string;
}

/** Updates the optional 2nd-step survey fields on an existing waitlist row. */
export async function updateWaitlistSurvey(pageId: string, survey: SurveyUpdate): Promise<void> {
  const properties: Record<string, Record<string, unknown>> = {};
  if (survey.job) {
    properties['직업'] = { select: { name: survey.job } };
  }
  if (survey.aiTasks && survey.aiTasks.length > 0) {
    properties['사용 중인 AI 작업'] = { multi_select: survey.aiTasks.map((name) => ({ name })) };
  }
  if (survey.country) {
    properties['국가'] = { select: { name: survey.country } };
  }
  if (survey.aiCount) {
    properties['AI 서비스 수'] = { select: { name: survey.aiCount } };
  }
  if (survey.firstTask && survey.firstTask.trim()) {
    properties['처음 맡겨 볼 일'] = richText(survey.firstTask.trim());
  }
  if (survey.jobOther && survey.jobOther.trim()) {
    properties['직업 기타'] = richText(survey.jobOther.trim());
  }
  if (survey.taskOther && survey.taskOther.trim()) {
    properties['작업 기타'] = richText(survey.taskOther.trim());
  }
  if (Object.keys(properties).length === 0) return;
  const fitted = await fitToSchema(properties);
  if (Object.keys(fitted).length === 0) return;
  await notion.pages.update({
    page_id: pageId,
    properties: fitted,
  } as Parameters<typeof notion.pages.update>[0]);
}
