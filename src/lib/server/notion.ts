import { Client } from '@notionhq/client';
import { NOTION_SECRET, NOTION_DB } from './env';

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
export async function createWaitlistEntry(email: string): Promise<string> {
  const data_source_id = await getDataSourceId();
  const name = email.split('@')[0] || email;
  const page = await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Email: { email },
      '개인정보 수집·이용 동의': { checkbox: true },
    },
    // SDK property union can't know this DB's schema; the shapes above are valid Notion values.
  } as Parameters<typeof notion.pages.create>[0]);
  return page.id;
}

export interface SurveyUpdate {
  job?: string;
  aiTasks?: string[];
  other?: string;
}

/** Updates the optional 2nd-step survey fields on an existing waitlist row. */
export async function updateWaitlistSurvey(pageId: string, survey: SurveyUpdate): Promise<void> {
  const properties: Record<string, unknown> = {};
  if (survey.job) {
    properties['직업'] = { select: { name: survey.job } };
  }
  if (survey.aiTasks && survey.aiTasks.length > 0) {
    properties['사용 중인 AI 작업'] = { multi_select: survey.aiTasks.map((name) => ({ name })) };
  }
  if (survey.other && survey.other.trim()) {
    properties['기타 입력'] = { rich_text: [{ text: { content: survey.other.trim() } }] };
  }
  if (Object.keys(properties).length === 0) return;
  await notion.pages.update({
    page_id: pageId,
    properties,
  } as Parameters<typeof notion.pages.update>[0]);
}
