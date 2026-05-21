const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', '.notion-cache');
const OUT_DIR = path.join(__dirname, '..');

const PHASES = [
  {
    num: 1,
    title: 'Web制作サービス Phase 1 ロードマップ_JP',
    file: 'phase-01-lead-scout.md',
    cache: 'phase-01.json',
    notionUrl:
      'https://www.notion.so/Web-Phase-1-_JP-367089a9cb07804e9256c8d6f7b0ecb1',
  },
  {
    num: 2,
    title: 'Web制作サービス Phase 2 営業・試作提案ロードマップ',
    file: 'phase-02-sales-strategy.md',
    cache: 'phase-02.json',
    notionUrl:
      'https://www.notion.so/Web-Phase-2-367089a9cb0780749085cbc1d76283a4',
  },
  {
    num: 3,
    title: 'Web制作サービス Phase 3 ロードマップ — 契約・要件定義運用版',
    file: 'phase-03-contract-requirements.md',
    cache: 'phase-03.json',
    notionUrl:
      'https://www.notion.so/Web-Phase-3-367089a9cb07807f8ee4fc2b09790310',
  },
  {
    num: 4,
    title: 'Web制作サービス Phase 4: Vue開発ロードマップ',
    file: 'phase-04-vue-development.md',
    cache: 'phase-04.json',
    notionUrl:
      'https://www.notion.so/Web-Phase-4-Vue-367089a9cb07807daab2e37d3a33a7a9',
  },
  {
    num: 5,
    title: 'Web制作サービス Phase 5 ロードマップ（デプロイ・納品・QA）_JP',
    file: 'phase-05-deploy-delivery-qa.md',
    cache: 'phase-05.json',
    notionUrl:
      'https://www.notion.so/Web-Phase-5-QA-_JP-367089a9cb07802bb88af27eae1e7b1b',
  },
  {
    num: 6,
    title: 'Web制作サービス Phase 6 ロードマップ: 保守・継続収益・成長',
    file: 'phase-06-maintenance-growth.md',
    cache: 'phase-06.json',
    notionUrl:
      'https://www.notion.so/Web-Phase-6-367089a9cb0780c692c5d90528c71949',
  },
];

const MAIN = {
  title: 'AI駆動 店舗Webサイト自動作成サービス — 完全ロードマップ',
  file: 'ROADMAP.md',
  cache: 'main.json',
  notionUrl:
    'https://www.notion.so/AI-Web-367089a9cb0780518235df13c9cf1ee8',
};

function richTextToMd(richText) {
  return (richText || [])
    .map((rt) => {
      let t = rt.plain_text || '';
      const a = rt.annotations || {};
      if (a.code) t = `\`${t}\``;
      if (a.bold) t = `**${t}**`;
      if (a.italic) t = `*${t}*`;
      if (a.strikethrough) t = `~~${t}~~`;
      return t;
    })
    .join('');
}

function blockToLines(block) {
  const t = block.type;
  const lines = [];

  if (t === 'child_page' || t === 'child_database') return lines;
  if (t === 'divider') {
    lines.push('\n---\n');
    return lines;
  }
  if (t === 'table') {
    lines.push('\n| （Notion表 — 元ページで確認） |\n| --- |\n');
    return lines;
  }

  const textTypes = [
    'paragraph',
    'heading_1',
    'heading_2',
    'heading_3',
    'bulleted_list_item',
    'numbered_list_item',
    'to_do',
    'quote',
    'callout',
    'code',
  ];

  if (textTypes.includes(t)) {
    const text = richTextToMd(block[t]?.rich_text);
    const prefix = {
      heading_1: '# ',
      heading_2: '## ',
      heading_3: '### ',
      bulleted_list_item: '- ',
      numbered_list_item: '1. ',
      to_do: block.to_do?.checked ? '- [x] ' : '- [ ] ',
      quote: '> ',
    }[t];

    if (t === 'code') {
      const lang = block.code?.language || '';
      if (text.trim()) lines.push(`\n\`\`\`${lang}\n${text}\n\`\`\`\n`);
    } else if (text.trim() || t === 'paragraph') {
      lines.push((prefix || '') + text);
    }
  }
  return lines;
}

function blockPlainText(block) {
  const key = block.type;
  if (!block[key]?.rich_text) return '';
  return block[key].rich_text.map((r) => r.plain_text || '').join('');
}

function loadCache(name) {
  const fp = path.join(CACHE_DIR, name);
  if (!fs.existsSync(fp)) {
    throw new Error(`キャッシュがありません: ${fp}\n先に npm run notion:fetch を実行してください`);
  }
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  return data.results || [];
}

function blocksToMarkdown(title, notionUrl, blocks) {
  const header = [
    `# ${title}`,
    '',
    `> Notion: [元ページ](${notionUrl})`,
    '',
  ];
  return [...header, ...blocks.flatMap(blockToLines), ''].join('\n');
}

function exportChildPages() {
  for (const phase of PHASES) {
    const blocks = loadCache(phase.cache);
    const md = blocksToMarkdown(phase.title, phase.notionUrl, blocks);
    fs.writeFileSync(path.join(OUT_DIR, phase.file), md, 'utf8');
    console.log(`${phase.file} (${blocks.length} blocks)`);
  }
}

function exportParent() {
  const phaseTitles = new Set(PHASES.map((p) => p.title));
  const blocks = loadCache(MAIN.cache).filter((b) => {
    if (b.type === 'child_page' || b.type === 'child_database') return false;
    if (phaseTitles.has(blockPlainText(b))) return false;
    return true;
  });
  const childLinks = PHASES.map((p) => `- [${p.title}](./${p.file})`);
  const md =
    blocksToMarkdown(MAIN.title, MAIN.notionUrl, blocks) +
    '\n## 子ページ（運用ロードマップ）\n\n' +
    childLinks.join('\n') +
    '\n';
  fs.writeFileSync(path.join(OUT_DIR, MAIN.file), md, 'utf8');
  console.log(`${MAIN.file} (${blocks.length} blocks + ${PHASES.length} links)`);
}

exportChildPages();
exportParent();
