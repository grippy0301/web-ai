/**
 * Notion ページの全ブロックを取得して JSON に保存（MCP取得データの補完用）
 * 環境変数 NOTION_TOKEN または NOTION_API_KEY が必要
 */
const fs = require('fs');
const path = require('path');

const token = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;
if (!token) {
  console.error('NOTION_TOKEN / NOTION_API_KEY が未設定です');
  process.exit(1);
}

const pageId = process.argv[2];
const outFile = process.argv[3];
if (!pageId || !outFile) {
  console.error('Usage: node fetch-notion-page.js <page-id> <output.json>');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function fetchAllBlocks(blockId) {
  const results = [];
  let cursor;
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return results;
}

(async () => {
  const results = await fetchAllBlocks(pageId);
  const out = { object: 'list', results, has_more: false };
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(out), 'utf8');
  console.log(`Saved ${results.length} blocks -> ${outFile}`);
})();
