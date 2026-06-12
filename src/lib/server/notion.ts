import { Client } from '@notionhq/client';
import { NOTION_DB, NOTION_SECRET } from '$env/static/private';

const notion = new Client({ auth: NOTION_SECRET });

// Notion API 2025-09-03: pages are created under a data source, not a database.
// Resolve the database's data source id once and cache it.
let dataSourceId: string | null = null;

async function getDataSourceId(): Promise<string> {
	if (dataSourceId) return dataSourceId;

	const database = await notion.databases.retrieve({ database_id: NOTION_DB });
	if (!('data_sources' in database) || database.data_sources.length === 0) {
		throw new Error('Notion database has no data source.');
	}

	dataSourceId = database.data_sources[0].id;
	return dataSourceId;
}

/** Adds an entry to the waitlist database (Name: Title, Email: Email). */
export async function addToWaitlist(name: string, email: string): Promise<void> {
	await notion.pages.create({
		parent: { type: 'data_source_id', data_source_id: await getDataSourceId() },
		properties: {
			Name: { title: [{ text: { content: name } }] },
			Email: { email }
		}
	});
}
