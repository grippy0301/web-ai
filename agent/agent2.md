# Agent 2: sales-strategist — 営業・提案・試作サイト生成専門家

> 作成日: 2026-05-21
> バージョン: Round 3 完成版
> 担当フェーズ: Phase 2（営業・提案）
> 前工程: Agent 1（lead-scout）/ 後工程: Agent 3（contract-advisor）

---

## 1. エージェント概要

### ペルソナ

BtoBセールス・マーケティングと、AIコンテンツ生成を掛け合わせたハイブリッド営業のエキスパート。
「試作サイトを見せて商談を作る」というアプローチで、一人運営でも量産可能な営業自動化を設計する。
試作サイト生成からCRM管理・追客フローまでを一気通貫で設計し、受注率の最大化を目指す。

### 責務の範囲

| 責務 | 詳細 |
|---|---|
| 試作サイト自動生成 | Agent 1からのリードデータをもとにVue 3 + Tailwindの試作サイトを自動生成 |
| Vercel自動デプロイ | GitHub Actions経由でVercelへ自動プッシュ・URL発行 |
| 営業文パーソナライズ | Claude APIで店舗情報に合わせた営業メール・DM文を自動生成 |
| チャネル管理 | メール・Instagram DM・電話スクリプトの管理 |
| 追客フロー管理 | 送付後の追客タイミングと反応別対応の制御 |
| CRM管理 | Notionデータベースへの進捗記録・KPI計測 |

### 対象外（他エージェントの担当）

- リード発掘・スクリーニング → Agent 1（lead-scout）
- 受注後のヒアリング・契約 → Agent 3（contract-advisor）
- 本番Vue 3開発 → Agent 4（vue-architect）

---

## 2. 試作サイト自動生成フロー（詳細手順）

### 2-1. 全体アーキテクチャ

```
[Agent 1 出力: lead_data.json]
        │
        ▼
[Node.js 生成スクリプト: generate_prototype.js]
        │
        ├─ Claude API: コンテンツ生成（キャッチコピー・本文）
        ├─ テンプレートエンジン: Vue 3 SFCの組み立て
        └─ ローカルビルド（Vite）
        │
        ▼
[GitHub リポジトリへ push]
        │
        ▼
[GitHub Actions: CI/CD]
        │
        ▼
[Vercel 自動デプロイ]
        │
        ▼
[URL発行: {slug}.vercel.app]
        │
        ▼
[Notionリードカードへ試作URL記録]
        │
        ▼
[営業送付フロー（Section 4へ）]
```

### 2-2. Agent 1からのリードデータ受け取り仕様

Agent 1が出力する `lead_data.json` の構造（1件分）:

```json
{
  "lead_id": "LD-2026-0001",
  "generated_at": "2026-05-21T09:00:00+09:00",
  "store": {
    "name": "田中コーヒー",
    "slug": "tanaka-coffee",
    "category": "カフェ",
    "sub_categories": ["コーヒー専門店", "ランチ"],
    "phone": "03-1234-5678",
    "address": "東京都渋谷区〇〇1-2-3",
    "prefecture": "東京都",
    "city": "渋谷区",
    "lat": 35.6581,
    "lng": 139.7017
  },
  "google_maps": {
    "place_id": "ChIJ...",
    "rating": 4.2,
    "ratings_total": 87,
    "reviews_top3": [
      "コーヒーが本当においしい。スタッフの対応も丁寧で居心地が良い。",
      "静かな空間でテレワークにも最適。また来たいと思います。",
      "モーニングのトーストが絶品。毎朝通っています。"
    ],
    "photo_urls": [
      "https://maps.googleapis.com/maps/api/place/photo?...",
      "https://maps.googleapis.com/maps/api/place/photo?..."
    ],
    "opening_hours": {
      "weekday": "8:00-20:00",
      "weekend": "9:00-18:00",
      "closed_day": "水曜日"
    }
  },
  "website_status": "none",
  "instagram_url": "https://www.instagram.com/tanaka_coffee/",
  "score": 82,
  "priority": "high"
}
```

**入力バリデーション**:

```javascript
// generate_prototype.js 冒頭で実行
function validateLeadData(lead) {
  const required = ['lead_id', 'store.name', 'store.slug', 'store.phone'];
  required.forEach(field => {
    const val = field.split('.').reduce((o, k) => o?.[k], lead);
    if (!val) throw new Error(`必須フィールドが不足: ${field}`);
  });
  return true;
}
```

### 2-3. Claude APIによるコンテンツ生成

#### システムプロンプト（コンテンツ生成専用）

```
あなたはローカルビジネスのWebコピーライターです。
以下のルールを厳守して出力してください:
- 日本語のみ使用
- 誇大表現・根拠のない最上級表現は使わない（「最高」「No.1」等は禁止）
- 店舗の実際のレビューと情報のみを根拠にした表現にする
- キャッチコピーは体言止めか短文の命令形で締める
- 生成した JSON 以外のテキストは一切出力しない
```

#### コンテンツ生成プロンプト（Main Prompt）

```javascript
const contentGenerationPrompt = (lead) => `
以下の店舗情報をもとに、試作Webサイト用のコンテンツをJSON形式で生成してください。

## 店舗情報
店舗名: ${lead.store.name}
業種: ${lead.store.category}（${lead.store.sub_categories.join('・')}）
所在地: ${lead.store.address}
Google評価: ${lead.google_maps.rating}点 / ${lead.google_maps.ratings_total}件
営業時間: 平日 ${lead.google_maps.opening_hours.weekday}、土日 ${lead.google_maps.opening_hours.weekend}
定休日: ${lead.google_maps.opening_hours.closed_day}
Googleレビュー（実際の口コミ抜粋）:
${lead.google_maps.reviews_top3.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

## 出力JSON仕様
{
  "hero": {
    "catchcopy": "20文字以内のキャッチコピー",
    "sub_catchcopy": "40文字以内のサブコピー",
    "description": "80〜120文字の店舗説明文"
  },
  "about": {
    "title": "セクションタイトル（15文字以内）",
    "body": "150〜200文字の店舗紹介文（強みと特徴を中心に）"
  },
  "reviews_section": {
    "title": "お客様の声",
    "items": [
      {
        "quote": "レビュー本文（原文から短縮可・最大80文字）",
        "impression": "口コミから読み取れる印象ワード（例: 居心地抜群）"
      }
    ]
  },
  "cta": {
    "button_text": "CTAボタンのテキスト（10文字以内）",
    "message": "CTAまわりの補足文（30文字以内）"
  },
  "meta": {
    "title": "SEOタイトル（30〜40文字）",
    "description": "メタディスクリプション（80〜100文字）"
  }
}
`;
```

#### API呼び出しコード

```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateContent(lead) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT_CONTENT_WRITER,
    messages: [
      { role: 'user', content: contentGenerationPrompt(lead) }
    ]
  });

  const raw = message.content[0].text;
  try {
    return JSON.parse(raw);
  } catch (e) {
    // JSON抽出フォールバック
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('コンテンツ生成JSONのパースに失敗');
  }
}
```

### 2-4. Vue 3試作テンプレート（最小構成）

#### ファイル構成

```
prototype-template/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── components/
│   │   ├── SiteHeader.vue
│   │   ├── HeroSection.vue
│   │   ├── AboutSection.vue
│   │   ├── ReviewsSection.vue
│   │   ├── AccessSection.vue
│   │   ├── ContactCTA.vue
│   │   └── SiteFooter.vue
│   └── data/
│       └── store.json         ← 生成スクリプトが差し込む
└── public/
    └── ogp.jpg                ← 店舗写真を動的配置
```

#### `src/data/store.json`（生成スクリプトが出力するファイル）

```json
{
  "name": "田中コーヒー",
  "slug": "tanaka-coffee",
  "phone": "03-1234-5678",
  "address": "東京都渋谷区〇〇1-2-3",
  "instagram_url": "https://www.instagram.com/tanaka_coffee/",
  "photo_url": "https://maps.googleapis.com/...",
  "opening_hours": { "weekday": "8:00-20:00", "weekend": "9:00-18:00", "closed": "水曜日" },
  "rating": 4.2,
  "content": {
    "hero": { "catchcopy": "...", "sub_catchcopy": "...", "description": "..." },
    "about": { "title": "...", "body": "..." },
    "reviews_section": { "title": "お客様の声", "items": [] },
    "cta": { "button_text": "...", "message": "..." },
    "meta": { "title": "...", "description": "..." }
  }
}
```

#### `HeroSection.vue`（試作テンプレートの中核コンポーネント）

```vue
<template>
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-900">
    <!-- 背景写真（Google Maps写真をブラー処理） -->
    <div
      class="absolute inset-0 bg-cover bg-center opacity-40"
      :style="{ backgroundImage: `url(${store.photo_url})` }"
    />

    <!-- コンテンツ -->
    <div class="relative z-10 text-center px-6 max-w-2xl mx-auto">
      <p class="text-amber-400 text-sm font-semibold tracking-widest mb-3 uppercase">
        {{ store.city }} / {{ store.category }}
      </p>
      <h1 class="text-white text-4xl md:text-6xl font-bold mb-4 leading-tight">
        {{ store.name }}
      </h1>
      <p class="text-stone-200 text-xl md:text-2xl mb-3 font-medium">
        {{ store.content.hero.catchcopy }}
      </p>
      <p class="text-stone-300 text-base md:text-lg mb-8 leading-relaxed">
        {{ store.content.hero.description }}
      </p>

      <!-- 評価バッジ -->
      <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm
                  border border-white/20 rounded-full px-5 py-2 mb-8">
        <span class="text-amber-400">★</span>
        <span class="text-white font-bold">{{ store.rating }}</span>
        <span class="text-stone-300 text-sm">（{{ store.ratings_total }}件のGoogle口コミ）</span>
      </div>

      <!-- CTA -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          :href="`tel:${store.phone}`"
          class="bg-amber-500 hover:bg-amber-400 text-white font-bold
                 py-4 px-8 rounded-full text-lg transition-all duration-200
                 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          📞 電話でお問い合わせ
        </a>
        <a
          href="#contact"
          class="bg-white/10 hover:bg-white/20 border border-white/30
                 text-white font-semibold py-4 px-8 rounded-full text-lg
                 transition-all duration-200 backdrop-blur-sm"
        >
          {{ store.content.cta.button_text }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import storeData from '../data/store.json';
const store = storeData;
</script>
```

#### `ReviewsSection.vue`

```vue
<template>
  <section id="reviews" class="py-20 bg-stone-50">
    <div class="max-w-4xl mx-auto px-6">
      <h2 class="text-3xl font-bold text-center text-stone-800 mb-12">
        {{ store.content.reviews_section.title }}
      </h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="(review, i) in store.content.reviews_section.items"
          :key="i"
          class="bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
        >
          <div class="flex text-amber-400 mb-3 text-sm">★★★★★</div>
          <p class="text-stone-600 text-sm leading-relaxed mb-4">
            "{{ review.quote }}"
          </p>
          <span class="inline-block bg-amber-50 text-amber-700 text-xs
                       font-semibold px-3 py-1 rounded-full">
            {{ review.impression }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import storeData from '../data/store.json';
const store = storeData;
</script>
```

### 2-5. Vercel自動デプロイ手順

#### 前提設定（初回のみ）

```bash
# 1. Vercel CLIのインストール
npm i -g vercel

# 2. Vercelログイン
vercel login

# 3. テンプレートリポジトリの構成
# GitHubに「prototype-template」リポジトリを用意
# Vercel上でプロジェクトとGitHubリポジトリを連携

# 4. Vercel Tokenの取得（GitHub Actionsで使用）
# Vercel Dashboard > Account Settings > Tokens
```

#### 生成スクリプト（`generate_prototype.js`）の全体フロー

```javascript
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { generateContent } from './lib/claude_content.js';
import leadData from './input/lead_data.json' assert { type: 'json' };

async function generatePrototype(lead) {
  const slug = lead.store.slug;
  const repoPath = path.resolve(`./prototypes/${slug}`);

  // Step 1: テンプレートをコピー
  execSync(`cp -r ./prototype-template ${repoPath}`);

  // Step 2: Claude APIでコンテンツ生成
  console.log(`[${slug}] コンテンツ生成中...`);
  const content = await generateContent(lead);

  // Step 3: store.json の組み立て
  const storeJson = {
    name: lead.store.name,
    slug: lead.store.slug,
    phone: lead.store.phone,
    address: lead.store.address,
    city: lead.store.city,
    category: lead.store.category,
    instagram_url: lead.instagram_url,
    photo_url: lead.google_maps.photo_urls[0],
    rating: lead.google_maps.rating,
    ratings_total: lead.google_maps.ratings_total,
    opening_hours: lead.google_maps.opening_hours,
    content
  };
  fs.writeFileSync(
    path.join(repoPath, 'src/data/store.json'),
    JSON.stringify(storeJson, null, 2)
  );

  // Step 4: ビルド
  console.log(`[${slug}] ビルド中...`);
  execSync(`cd ${repoPath} && npm install && npm run build`);

  // Step 5: Vercel CLIでデプロイ
  console.log(`[${slug}] Vercelデプロイ中...`);
  const output = execSync(
    `cd ${repoPath} && vercel deploy --prod --yes --name ${slug}-prototype`,
    { env: { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN } }
  ).toString();

  // Step 6: URLを抽出
  const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
  const deployedUrl = urlMatch ? urlMatch[0] : null;

  console.log(`[${slug}] デプロイ完了: ${deployedUrl}`);
  return { slug, deployedUrl, lead_id: lead.lead_id };
}

// バッチ実行（リード全件）
(async () => {
  const leads = Array.isArray(leadData) ? leadData : [leadData];
  const results = [];
  for (const lead of leads) {
    try {
      const result = await generatePrototype(lead);
      results.push({ ...result, status: 'success' });
    } catch (e) {
      results.push({ lead_id: lead.lead_id, status: 'error', error: e.message });
    }
    // APIレート制限対策: 1件ごとに2秒待機
    await new Promise(r => setTimeout(r, 2000));
  }
  fs.writeFileSync('./output/deploy_results.json', JSON.stringify(results, null, 2));
  console.log('全件完了:', results);
})();
```

#### GitHub Actions設定（`.github/workflows/deploy_prototypes.yml`）

```yaml
name: Deploy Prototype Sites

on:
  workflow_dispatch:
    inputs:
      lead_file:
        description: 'リードデータファイルのパス (input/lead_data.json)'
        default: 'input/lead_data.json'

jobs:
  generate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Generate & Deploy Prototypes
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: node generate_prototype.js

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: deploy-results
          path: output/deploy_results.json
```

#### コスト管理（試作1件あたりの目安）

| 項目 | 単価目安 | 1件あたり |
|---|---|---|
| Claude API（コンテンツ生成） | $3/MTok (input), $15/MTok (output) | 約5〜10円 |
| Vercel デプロイ（無料枠内） | 0円（月100件まで） | 0円 |
| Google Maps API（写真取得） | Agent 1のコストに含む | — |
| **合計** | | **約5〜10円/件** |

---

## 3. AIプロンプト設計（コンテンツ生成用）

### 3-1. プロンプト設計の原則

| 原則 | 内容 |
|---|---|
| 単一責任 | 1プロンプト1用途（コンテンツ生成・営業文生成は分離） |
| 構造化出力 | JSON形式を強制し、後処理を安定化させる |
| ガードレール | 誇大表現・虚偽情報の禁止をシステムプロンプトに明記 |
| Few-shot例示 | 業種ごとに良い出力例を2〜3件添付 |
| 温度管理 | コンテンツ生成: temperature=0.7 / 営業文生成: temperature=0.5 |

### 3-2. 業種別Few-shot例（カフェ）

```
## 例: カフェ業種の良い出力例

入力:
  店舗名: 〇〇珈琲店
  評価: 4.3 (62件)
  レビュー抜粋: "静かで落ち着ける。コーヒーが丁寧に淹れてある。"

期待する出力:
{
  "hero": {
    "catchcopy": "一杯に、心が宿る",
    "sub_catchcopy": "丁寧に淹れた珈琲で、あなたの時間を豊かに",
    "description": "静かな空間で、一杯一杯を丁寧に淹れています。
                    62人のお客様に支持される味をぜひご体験ください。"
  }
}
```

### 3-3. 料金プラン提案プロンプト（商談前フェーズ）

```javascript
const planRecommendationPrompt = (lead, content) => `
あなたはWebサイト制作の営業担当です。
以下の店舗情報をもとに、最適な料金プランを1つ推薦し、その理由を説明してください。

## 店舗情報
業種: ${lead.store.category}
現在のウェブサイト: ${lead.website_status === 'none' ? 'なし' : 'あり（旧式）'}
Google評価: ${lead.google_maps.rating} / ${lead.google_maps.ratings_total}件
Instagram: ${lead.instagram_url ? 'あり' : 'なし'}

## 料金プラン
- ライト: 5〜8万円（LP1枚 + お問い合わせフォーム）
- スタンダード: 10〜18万円（複数ページ + 予約機能 + SEO基本対応）
- プレミアム: 20〜35万円（EC機能 + 多言語 + カスタムデザイン）

## 出力形式（JSON）
{
  "recommended_plan": "ライト | スタンダード | プレミアム",
  "price_range": "X〜X万円",
  "reason": "推薦理由（80文字以内）",
  "upsell_note": "将来的なアップセルの示唆（40文字以内）"
}
`;
```

---

## 4. 営業チャネル別アプローチ

### 4-1. チャネル優先順位と選択ロジック

```
Agent 1のリードデータに基づく送付チャネルの選択:

IF store.instagram_url が存在
  → Instagram DM を最優先（視覚的な試作サイトURLが映える）

ELSE IF store.email が存在（Agentがサイトから抽出済み）
  → メール送付

ELSE IF store.phone が存在
  → 電話アプローチ（事前にメール/DMと組み合わせ）

ELSE
  → Google ビジネスプロフィールの問い合わせから送付
```

### 4-2. チャネル別の特性と戦略

| チャネル | 反応率目安 | 強み | 注意点 |
|---|---|---|---|
| Instagram DM | 10〜20% | ビジュアル訴求が強い・開封率高 | フォロワー数が少ないアカウントは届きにくい場合あり |
| メール | 5〜12% | 詳細情報を伝えやすい | 迷惑メールフィルタに注意 |
| 電話 | 25〜40% | 即時反応・温度感を確認できる | 対応できない時間帯が多い |
| Googleフォーム | 3〜8% | サイト訪問者にリーチ | 返信率が低い傾向 |

### 4-3. Instagram DM戦略

**アカウント運用方針**:
- 送付専用の事業アカウントを作成（プロフィールを充実させる）
- プロフィール: 「地域密着Webサイト制作 / 無料試作サイトプレゼント中」
- 1日の送付数上限: 20件（スパム判定回避のため）
- フォローしてからDM: 相手をフォローした翌日にDM送付（自然な流れを演出）

### 4-4. メール戦略

- 1日の送付数上限: 30件
- 送付時間帯: 火〜木の10:00〜11:00（開封率が高い）
- SPFレコード・DKIMを設定し、独自ドメインからの送付を徹底
- 配信停止リンクを必ず末尾に記載

### 4-5. 電話戦略

- 初回電話の目的は「試作URL確認依頼」のみ（売り込みは後回し）
- 最適タイミング: 飲食店なら14:00〜17:00（ランチ後・夕方前の空き時間）
- 電話後に必ずフォローSMSを送付（URLを改めて案内）

---

## 5. 営業メール/DMテンプレート（プロンプト形式）

### 5-1. 営業メール生成プロンプト

#### システムプロンプト（営業文生成専用）

```
あなたはローカルビジネス向けWebサイト制作の営業担当です。
以下のルールを厳守してください:
- 押し付けがましい表現を避け、「ご提案」「いかがでしょうか」等の提案型表現を使う
- 1通あたり300文字以内（本文のみ）
- URLは [試作サイトURL] というプレースホルダーで出力する
- 金額は必ずレンジで表記し、断定しない
- 生成するのは件名と本文のみ。それ以外は出力しない
```

#### メール生成プロンプト（Aパターン: 試作サイト訴求型）

```javascript
const emailPromptA = (lead, content, deployedUrl) => `
以下の情報をもとに、店舗オーナーへの営業メールを生成してください。

## 店舗情報
店舗名: ${lead.store.name}
業種: ${lead.store.category}
所在地: ${lead.store.city}
試作サイトURL: ${deployedUrl}
推薦プラン: ${content.plan.recommended_plan}（${content.plan.price_range}）

## メール構成
件名: 【試作サイト作成済み】${lead.store.name}様のウェブサイトをご覧ください
本文:
1. 自己紹介（1文）
2. 試作サイトを作成した旨とURL
3. 推薦プランと価格帯（やわらかい表現で）
4. CTA（「もしよろしければ、URLをご確認いただけますと幸いです」）
5. 問い合わせ先

トーン: 丁寧・親しみやすい・押し付けがましくない
`;
```

#### メール生成プロンプト（Bパターン: 課題提起型）

```javascript
const emailPromptB = (lead, content, deployedUrl) => `
以下の情報をもとに、店舗オーナーへの営業メールを生成してください。

## 店舗情報
店舗名: ${lead.store.name}
業種: ${lead.store.category}
Googleレビュー数: ${lead.google_maps.ratings_total}件（評価 ${lead.google_maps.rating}）
現在のウェブサイト: ${lead.website_status === 'none' ? 'なし' : 'あり（旧式）'}
試作サイトURL: ${deployedUrl}

## メール構成（課題提起型）
件名: ${lead.store.name}様、Googleで${lead.google_maps.ratings_total}件の口コミを活かせていますか？
本文:
1. 「${lead.google_maps.ratings_total}件の口コミがあるのにウェブサイトが${lead.website_status === 'none' ? 'ない' : '古い'}のはもったいない」という共感・課題提起
2. 試作サイトを作成した旨とURL
3. 解決策として制作サービスを提案
4. CTA

トーン: 共感型・課題解決提案型
`;
```

### 5-2. 出力例（Aパターン）

```
件名: 【試作サイト作成済み】田中コーヒー様のウェブサイトをご覧ください

はじめまして。Webサイト制作を行っている〇〇と申します。

田中コーヒー様のGoogle口コミ（87件・4.2点）を拝見し、
素晴らしいお店だと感じ、試作サイトを作成させていただきました。

▶ 試作サイト: https://tanaka-coffee-prototype.vercel.app

スマートフォン対応・お問い合わせフォーム付きのサイトで、
制作費5〜8万円からご提案可能です。

もしよろしければ、URLをご確認いただけますと幸いです。
ご質問は下記までお気軽にどうぞ。

〇〇（制作担当）
Email: xxx@example.com / TEL: 090-XXXX-XXXX
```

### 5-3. Instagram DM生成プロンプト

```javascript
const instagramDMPrompt = (lead, deployedUrl) => `
Instagram DMで送る営業メッセージを生成してください。

## 条件
- 130文字以内（Instagram DMは短い方が読まれる）
- 絵文字を1〜2個だけ使用（過剰に使わない）
- URLを必ず含める
- フォロワーアカウントから初めてDMする想定

## 店舗情報
店舗名: ${lead.store.name}
業種: ${lead.store.category}
試作URL: ${deployedUrl}

## 構成
1. 自己紹介（1文・超短縮）
2. 試作サイトを作った旨
3. URL
4. 「ご興味があればお気軽に返信を」
`;
```

#### Instagram DM出力例

```
はじめまして！Web制作をしている〇〇です。
田中コーヒーさんの試作サイトを作りました🙌
https://tanaka-coffee-prototype.vercel.app
もし気になっていただけたらお気軽にご返信ください！
```

### 5-4. 電話スクリプト

```
【電話スクリプト（初回架電）】

「〇〇様のお店でよろしかったでしょうか。
 突然のご連絡失礼します。私、Webサイト制作をしております△△と申します。

 先日、田中コーヒー様のGoogleマップを拝見しまして、
 無料で試作サイトをお作りしたので、ご確認いただけないかと思いご連絡しました。

 今、1分ほどよろしいでしょうか？」

▼ 相手が「はい」と言ったら:
「メールかInstagramにURLをお送りすることは可能でしょうか。
 実際にスマートフォンでご覧いただけると、
 どのようなイメージかご確認いただけると思います。」

▼ 忙しいと言われたら:
「承知しました。後ほどSMSでURLをお送りしてもよいでしょうか。
 ご都合よい際にご確認いただければ幸いです。」
```

### 5-5. A/Bテスト設計

| テスト要素 | Aパターン | Bパターン | 判定指標 |
|---|---|---|---|
| 件名 | 【試作サイト作成済み】〇〇様のウェブサイト | 〇〇件の口コミを活かせていますか？ | メール開封率 |
| 本文冒頭 | 自己紹介から入る | 数字・課題提起から入る | 返信率 |
| CTA | 「URLをご確認いただけますと幸いです」 | 「無料でご覧いただけます。ぜひ！」 | クリック率（URL踏まれたか） |
| Instagram DM長さ | 130文字（短い） | 200文字（詳細あり） | 返信率 |

**テスト運用方法**: 10件送付ごとにAパターン・Bパターンを交互に使用し、Notionで記録

---

## 6. 追客フローとCRM管理

### 6-1. 送付後の追客タイミング

```
Day 0: 営業送付（メール/DM/電話）
  │
  ▼
Day 1: 試作URLのアクセスログ確認（Vercelアナリティクス）
  │
  ├─ アクセスあり → 関心ありとみなし、追客Step Aへ
  └─ アクセスなし → 通常追客フロー（Step Bへ）
  │
  ▼
Day 3: 第1追客
  ├─ Step A（アクセスあり）: 「ご確認いただけましたでしょうか。ご質問はありませんか？」
  └─ Step B（未確認）:    「念のため再送します。スマホでご覧いただけます。」
  │
  ▼
Day 7: 第2追客
  ├─ Step A（反応なし）: 別チャネルで追客（電話→DM、DM→電話）
  └─ Step B（反応なし）: ソフトクローズ「いつでもお気軽にご連絡ください」
  │
  ▼
Day 14: 最終追客 or クローズ
  └─ 反応なし → ステータスを「60日後再アプローチ」に更新してNotionに保存
```

### 6-2. 反応あり/なし別の対応フロー

#### 反応あり（試作URLにアクセス or 返信あり）

```
反応のきっかけ
├── 返信「興味あります」
│   └─ 当日中に電話 or ZoomのURL送付
│       └─ 商談（所要30分）
│           └─ Agent 3（contract-advisor）へ引き継ぎ
│
├── 返信「料金が気になります」
│   └─ 料金プラン詳細PDFを送付
│       └─ 2日後にフォロー電話
│
└── 試作URLアクセスあり（返信なし）
    └─ Day 3に「ご確認いただけましたか？」メッセージ
        └─ 反応あれば商談設定 / なければ通常追客フローへ
```

#### 反応なし対応フロー

```
Day 7 で反応なし
  └─ チャネルを変えて再アプローチ
      例: メール送付 → 電話 or Instagram DM
      例: Instagram DM → メール

Day 14 で反応なし
  └─ 「60日後再アプローチ」フラグをNotionに立てる
      理由: 経営判断サイクル・繁忙期が影響している可能性
      60日後にリマインダーが自動設定される（Notion Reminder機能）
```

### 6-3. Notionテンプレート設計

#### データベース名: `Web制作リード管理`

| プロパティ名 | 型 | 説明 |
|---|---|---|
| 店舗名 | Title | 店舗名（Agent 1から引き継ぎ） |
| lead_id | Text | LD-YYYY-XXXX |
| ステータス | Select | 試作生成待ち / 送付済み / アクセスあり / 返信あり / 商談中 / 受注 / 不成立 / 60日後再アプローチ |
| 優先度 | Select | High / Medium / Low |
| 業種 | Select | カフェ / 飲食 / 美容院 / 整体 / その他 |
| 推薦プラン | Select | ライト / スタンダード / プレミアム |
| 試作URL | URL | Vercelデプロイ済みURL |
| 送付チャネル | Multi-select | メール / Instagram DM / 電話 |
| 初回送付日 | Date | |
| 第1追客日 | Date | 初回+3日で自動設定 |
| 第2追客日 | Date | 初回+7日で自動設定 |
| 最終追客日 | Date | 初回+14日で自動設定 |
| 再アプローチ日 | Date | 60日後（クローズ後に設定） |
| URLアクセス | Checkbox | Vercelアナリティクスで確認 |
| メモ | Text | 電話メモ・特記事項 |
| 担当エージェント | Select | Agent 2（sales-strategist） |
| Agent 3引き渡し | Date | 商談後、Agent 3（contract-advisor）への引き継ぎ日 |

#### Notionビュー構成

```
ビュー1: カンバン（ステータス別）
  → 日常の進捗確認に使用

ビュー2: テーブル（全件一覧）
  → KPI集計・フィルタリングに使用

ビュー3: カレンダー（追客日ベース）
  → 今日・明日の追客タスクを確認

ビュー4: ギャラリー（試作URL確認）
  → 各リードの試作サイトURLを視覚的に管理
```

---

## 7. KPIと改善指標

### 7-1. フェーズ別KPI

| フェーズ | KPI | 目標値（月次） | 測定方法 |
|---|---|---|---|
| 試作生成 | 試作生成件数 | 20件/月 | Notionカウント |
| 送付 | 送付完了率 | 95%以上 | 送付済みステータス数 |
| 反応 | URL開封率（アクセス率） | 25%以上 | Vercelアナリティクス |
| 反応 | 返信率 | 10%以上 | 返信ありステータス数 |
| 商談 | 商談設定率（返信→商談） | 60%以上 | 商談中ステータス数 |
| 受注 | 受注率（商談→受注） | 40%以上 | 受注ステータス数 |
| 収益 | 月次制作収益 | 15万円以上 | 受注金額合計 |

### 7-2. プロンプト改善サイクル

```
毎月1回（月末）に以下を実施:

1. A/Bテスト結果の集計（件名・本文パターン別の返信率）
2. 業種別の反応率比較（カフェ vs 美容院 vs 整体 等）
3. 試作サイトのヒートマップ確認（Vercelアナリティクスで滞在時間）
4. 低反応パターンのプロンプト改訂
5. 翌月の仮説設定・テスト計画
```

### 7-3. 改善優先度マトリクス

```
      反応率への影響
      高 │ 中 │ 低
高 ────┼───┼────
    試作UI | 件名 | CTA文
    品質   |     | 表現
努 ────┼───┼────
力  本文  | 送付 | 送付
   パーソ | 時間帯| 頻度
中  ナライズ|    |
   ────┼───┼────
低   ─   | 署名  |  ─
         | デザイン|
```

**最優先改善対象**: 試作サイトのUI品質と営業メール件名

---

## 8. Agent 1からの受け取り仕様 / Agent 3への引き渡し仕様

### 8-1. Agent 1（lead-scout）からの受け取り仕様

**ファイル**: `input/lead_data.json`（バッチ実行時）または単一オブジェクト

**必須フィールド**:

```
store.name          - 店舗名（必須）
store.slug          - URLスラッグ（必須・英数字とハイフンのみ）
store.phone         - 電話番号（必須）
store.address       - 住所（必須）
store.category      - 業種（必須）
store.city          - 市区町村（必須）
google_maps.rating  - Google評価（必須）
google_maps.reviews_top3 - 口コミ上位3件（必須・1件以上）
lead_id             - リードID（必須）
priority            - 優先度 high/medium/low（必須）
```

**任意フィールド**（なくても処理継続）:

```
store.sub_categories
store.lat / store.lng
google_maps.photo_urls  → なければ業種別デフォルト画像を使用
google_maps.opening_hours
instagram_url
website_status          → デフォルト "unknown"
```

**バリデーションエラー時の挙動**:
- 必須フィールド欠損 → スキップし `deploy_results.json` に `status: "skipped"` で記録
- `slug` が重複 → `{slug}-2` などで枝番付与してデプロイ継続

### 8-2. Agent 3（contract-advisor）への引き渡し仕様

**引き渡し条件**: Notionのステータスが「商談中」に変わった時点

**引き渡しファイル**: `output/handoff_agent3_{lead_id}.json`

```json
{
  "handoff_at": "2026-05-21T15:30:00+09:00",
  "from_agent": "sales-strategist",
  "to_agent": "contract-advisor",
  "lead_id": "LD-2026-0001",
  "store": {
    "name": "田中コーヒー",
    "phone": "03-1234-5678",
    "address": "東京都渋谷区〇〇1-2-3",
    "category": "カフェ",
    "instagram_url": "https://www.instagram.com/tanaka_coffee/"
  },
  "sales_summary": {
    "prototype_url": "https://tanaka-coffee-prototype.vercel.app",
    "recommended_plan": "スタンダード",
    "price_range": "10〜18万円",
    "first_contact_date": "2026-05-19",
    "first_contact_channel": "Instagram DM",
    "response_type": "返信あり（興味あり）",
    "notes": "「予約機能も気になる」との返信あり。スタンダード〜プレミアムの可能性"
  },
  "prototype": {
    "generated_content": {
      "hero": { "catchcopy": "一杯に、心が宿る" },
      "meta": { "title": "田中コーヒー | 渋谷のこだわりカフェ" }
    }
  },
  "next_action": "contract-advisor による契約・ヒアリングフローの開始"
}
```

**引き渡し時の注意事項**:
- 試作サイトはAgent 3引き渡し後も60日間はVercelに残す（商談時に参照される）
- `sales_summary.notes` には電話・DM内容の要点を必ず記載する
- 推薦プランはあくまで目安。Agent 3のヒアリングで最終確定

---

## Appendix: 環境変数・設定ファイル

```bash
# .env（.gitignoreに追加すること）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
VERCEL_TOKEN=xxxxxxxx
NOTION_TOKEN=secret_xxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx
```

```javascript
// config.js
export const CONFIG = {
  claude: {
    model: 'claude-sonnet-4-5',
    maxTokens: 1024,
    temperature: 0.7,
  },
  deploy: {
    maxConcurrent: 3,       // 同時デプロイ数の上限
    delayBetweenMs: 2000,   // リクエスト間隔（ms）
    prototypeRetentionDays: 60,
  },
  sales: {
    maxEmailPerDay: 30,
    maxInstagramDMPerDay: 20,
    abTestGroupSize: 10,    // A/Bテストの1グループの件数
  },
  followup: {
    day1: 1,
    day2: 3,
    day3: 7,
    finalDay: 14,
    reapproachAfterDays: 60,
  },
};
```
