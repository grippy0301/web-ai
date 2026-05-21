const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function loadNotionToken() {
  if (process.env.NOTION_TOKEN || process.env.NOTION_API_KEY) return;
  const mcpPath = path.join(
    process.env.USERPROFILE || process.env.HOME,
    '.cursor',
    'mcp.json'
  );
  const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  const raw = mcp.mcpServers?.notionApi?.env?.OPENAPI_MCP_HEADERS;
  if (!raw) throw new Error('Notion token not found in ~/.cursor/mcp.json');
  const headers = JSON.parse(raw);
  const auth = headers.Authorization || '';
  process.env.NOTION_TOKEN = auth.replace(/^Bearer\s+/i, '').trim();
}

loadNotionToken();

const CACHE_DIR = path.join(__dirname, '..', '.notion-cache');
const fetchScript = path.join(__dirname, 'fetch-notion-page.js');

const PAGES = [
  ['367089a9-cb07-8051-8235-df13c9cf1ee8', 'main.json'],
  ['367089a9-cb07-804e-9256-c8d6f7b0ecb1', 'phase-01.json'],
  ['367089a9-cb07-8074-9085-cbc1d76283a4', 'phase-02.json'],
  ['367089a9-cb07-807f-8ee4-fc2b09790310', 'phase-03.json'],
  ['367089a9-cb07-807d-aab2-e37d3a33a7a9', 'phase-04.json'],
  ['367089a9-cb07-802b-b88a-f27eae1e7b1b', 'phase-05.json'],
  ['367089a9-cb07-80c6-92c5-d90528c71949', 'phase-06.json'],
];

fs.mkdirSync(CACHE_DIR, { recursive: true });

for (const [pageId, outName] of PAGES) {
  const outPath = path.join(CACHE_DIR, outName);
  const r = spawnSync(
    process.execPath,
    [fetchScript, pageId, outPath],
    { stdio: 'inherit', env: process.env }
  );
  if (r.status !== 0) process.exit(r.status);
}

console.log('All pages fetched to .notion-cache/');
