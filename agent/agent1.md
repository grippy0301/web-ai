# Agent 1: lead-scout — リード発掘・スクリーニング専門家

> 作成日: 2026-05-21
> バージョン: 1.0（Round 1〜3 ブラッシュアップ完了版）
> 担当フェーズ: Phase 1 — リード発掘・スクリーニング

---

## 1. エージェント概要

### 目的

Google Maps Places API を中心としたデータパイプラインで、**Webサイトなし・または質の低いWebサイトの店舗を自動検出**し、Agent 2（sales-strategist）が即座に営業アクションを取れるリードデータを提供する。

### KPI

| 指標 | 目標値 |
|---|---|
| 月間抽出リード数 | 30〜50件 |
| 営業対象に絞り込んだ優先リード | 10〜30件/月 |
| スクリプト1回あたりの手動作業時間 | 15分以内 |
| APIコスト（月次） | $15〜$30 以内 |

### 対象店舗の定義

下記をすべて満たす店舗を「優先リード」として扱う。

- Google Maps にプレイスとして登録済み
- Webサイトなし、またはWebサイトURLが存在するが以下のいずれかに該当
  - PageSpeed スコア（モバイル）が 49 以下
  - SSL非対応（http://のみ）
  - 最終更新から3年以上経過（Wayback Machine で推定）
  - レスポンシブ対応なし（viewport metaタグ未設定）
- レビュー数 5 以上（存在感があるが未Web化）
- 評価 3.8 以上（営業相手として成立する最低水準）
- 業種：飲食・美容・整体/整骨院・クリーニング・工務店・税理士・歯科医院 等

---

## 2. 使用ツール・API仕様

### 2-1. Google Maps Places API

#### 使用するエンドポイント

| エンドポイント | 用途 | 推奨 SDK |
|---|---|---|
| Nearby Search | 指定座標の半径内で業種絞り込み | Places API（旧版） |
| Text Search | キーワード + 地域で横断検索 | Places API（旧版） |
| Place Details | 個別店舗の詳細取得 | Places API（旧版） |

> **注意**: 2024年以降、Google は「Places API (New)」を推奨しているが、旧版も引き続き利用可能。新版は `places.googleapis.com` ベース、旧版は `maps.googleapis.com/maps/api/place/` ベース。本スクリプトは**旧版を前提**とする（料金体系が安定しているため）。

#### Nearby Search

```
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
  ?location={lat},{lng}
  &radius={meters}           // 最大 50000m
  &type={place_type}         // 例: restaurant, beauty_salon
  &key={API_KEY}
```

**取得できる主なフィールド（基本レスポンス）**:

| フィールド | 内容 |
|---|---|
| `place_id` | 一意なプレイスID（Place Details の呼び出しに使用） |
| `name` | 店舗名 |
| `vicinity` | 住所（簡略版） |
| `rating` | 評価（0〜5） |
| `user_ratings_total` | レビュー数 |
| `business_status` | OPERATIONAL / CLOSED_TEMPORARILY 等 |
| `types` | 業種タグ配列 |

**注意**: `website` フィールドは Nearby Search のレスポンスに**含まれない**。必ず Place Details で個別取得が必要。

**1回のレスポンスで最大 20件**を返却。`next_page_token` が存在すれば追加 20件（合計最大 60件/クエリ）。次ページ取得は **2秒以上の待機**が必要（即時リクエストは INVALID_REQUEST になる）。

#### Place Details

```
GET https://maps.googleapis.com/maps/api/place/details/json
  ?place_id={PLACE_ID}
  &fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,types
  &key={API_KEY}
```

**`fields` パラメータで課金カテゴリが変わる**:

| フィールドカテゴリ | 代表フィールド | 単価（1000件あたり） |
|---|---|---|
| Basic | name, place_id, types, business_status | $17.00 |
| Contact | formatted_phone_number, website | $17.00（Basic込み） |
| Atmosphere | rating, user_ratings_total, opening_hours | $17.00（Basic込み） |

> **コスト最適化**: `fields` を必要なものだけに絞ることで課金を抑制できる。`website,formatted_phone_number,rating,user_ratings_total,name,formatted_address,types` を基本セットとする。

#### Text Search

```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
  ?query={検索語句 例: "美容室 渋谷"}
  &key={API_KEY}
```

Nearby Search より広域・自由度高い検索が可能。単価は Nearby Search と同じ。

---

### 2-2. Google PageSpeed Insights API

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url={TARGET_URL}
  &strategy=mobile
  &key={API_KEY}
```

**取得できる主な値**:

| フィールド | パス | 意味 |
|---|---|---|
| パフォーマンススコア | `lighthouseResult.categories.performance.score` | 0〜1（×100でスコア） |
| LCP | `lighthouseResult.audits.largest-contentful-paint.displayValue` | 最大コンテンツ描画時間 |
| CLS | `lighthouseResult.audits.cumulative-layout-shift.displayValue` | レイアウトシフト |

**料金**: 無料（APIキーなし・1日 25,000リクエストまで）  
APIキーありで上限なし（ただし無料枠で十分）。

**注意**: レスポンスに5〜15秒かかることがある。タイムアウトは 20秒以上に設定すること。

---

### 2-3. Wayback Machine API（Internet Archive）

```
GET https://archive.org/wayback/available
  ?url={TARGET_URL}
  &timestamp={YYYYMMDD}
```

**レスポンス例**:

```json
{
  "archived_snapshots": {
    "closest": {
      "available": true,
      "url": "https://web.archive.org/web/20230101120000/https://example.com",
      "timestamp": "20230101120000",
      "status": "200"
    }
  }
}
```

**有効な活用法**:
- `timestamp` を3年前の日付（例: `20230101`）に設定してリクエスト
- `available: true` かつ該当スナップショット以降に新しいアーカイブがほぼない → 「長期間更新なし」と推定
- `available: false` → アーカイブなし（サイトが存在しないか、ブロックされている）

**料金**: 無料。ただし連続アクセスは 1秒/リクエスト のレート制限を推奨（DoS防止）。

---

### 2-4. SSL判定（Node.js 標準モジュール）

PageSpeed API のレスポンスや `website` フィールドの URL を解析することで判定可能。

```javascript
const url = new URL(websiteUrl);
const isSSL = url.protocol === 'https:';
```

または `https` モジュールで HEAD リクエストを送り、接続成否でチェック。

---

### 2-5. viewport meta タグ判定（レスポンシブ確認）

```javascript
const response = await axios.get(websiteUrl, { timeout: 8000 });
const hasViewport = response.data.includes('viewport');
```

HTML に `viewport` メタタグが含まれているかで簡易判定。誤検知を許容するが、スクリーニングの1項目として扱う。

---

## 3. スクリーニング条件の詳細

### スクリーニングフロー

```
[Places API] → 店舗リスト取得
      ↓
[フィルタ1] レビュー数 ≥ 5 かつ 評価 ≥ 3.8 かつ business_status = OPERATIONAL
      ↓
[Place Details] website / phone / rating 取得
      ↓
[フィルタ2A] website フィールドが null / 空 → 即「優先リード」へ
      ↓
[フィルタ2B] website あり → 以下のサブスクリーニングへ
      ↓
  ┌─ SSL判定（非SSL → マイナス評点）
  ├─ PageSpeed スコア（モバイル ≤ 49 → マイナス評点）
  ├─ viewport meta タグ（未設定 → マイナス評点）
  └─ Wayback Machine（3年以上更新なし → マイナス評点）
      ↓
[スコアリング] 2点以上 → 優先リード / 1点 → 補欠リード / 0点 → 除外
```

### スコアリング基準

| 条件 | 評点 |
|---|---|
| website フィールドが null | +3（即優先） |
| PageSpeed モバイルスコア ≤ 49 | +2 |
| SSL非対応（http://） | +2 |
| viewport meta タグなし | +1 |
| Wayback Machine: 最終アーカイブが3年以上前 | +1 |
| PageSpeed スコア 50〜69 | +1 |

**合計スコア 3以上 → 優先リード（A判定）**
**合計スコア 1〜2 → 補欠リード（B判定）**
**合計スコア 0 → 除外**

---

## 4. 実装フロー（擬似コード付き）

### ディレクトリ構成

```
lead-scout/
├── src/
│   ├── index.js          // メインエントリー
│   ├── places.js         // Google Maps API ラッパー
│   ├── screening.js      // スクリーニングロジック
│   ├── pagespeed.js      // PageSpeed API
│   ├── wayback.js        // Wayback Machine API
│   └── exporter.js       // CSV/JSON 出力
├── config/
│   └── targets.json      // 検索対象地域・業種定義
├── output/
│   └── leads_YYYYMMDD.csv
├── .env
└── package.json
```

### `config/targets.json` 定義例

```json
{
  "searches": [
    {
      "location": { "lat": 35.6895, "lng": 139.6917 },
      "radius": 2000,
      "type": "restaurant",
      "label": "渋谷_飲食"
    },
    {
      "location": { "lat": 35.6586, "lng": 139.7013 },
      "radius": 1500,
      "type": "beauty_salon",
      "label": "恵比寿_美容室"
    }
  ],
  "filters": {
    "minRatings": 5,
    "minScore": 3.8
  }
}
```

### `src/places.js` — Google Maps APIラッパー

```javascript
const axios = require('axios');

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Nearby Search: 1ロケーション最大60件取得
async function nearbySearch({ lat, lng, radius, type }) {
  const results = [];
  let pageToken = null;

  do {
    const params = {
      location: `${lat},${lng}`,
      radius,
      type,
      key: API_KEY,
    };
    if (pageToken) {
      params.pagetoken = pageToken;
      // next_page_token はトークン生成に2〜3秒かかるため待機必須
      await sleep(2500);
    }

    const res = await axios.get(`${PLACES_BASE}/nearbysearch/json`, { params });
    results.push(...res.data.results);
    pageToken = res.data.next_page_token || null;

  } while (pageToken);

  return results;
}

// Place Details: website, phone, rating を取得
async function placeDetails(placeId) {
  const res = await axios.get(`${PLACES_BASE}/details/json`, {
    params: {
      place_id: placeId,
      fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types',
      key: API_KEY,
    },
  });
  return res.data.result;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { nearbySearch, placeDetails, sleep };
```

### `src/screening.js` — スクリーニングロジック

```javascript
const axios = require('axios');
const { checkPageSpeed } = require('./pagespeed');
const { checkWayback } = require('./wayback');

async function screenPlace(details) {
  const result = {
    name: details.name,
    address: details.formatted_address,
    phone: details.formatted_phone_number || null,
    website: details.website || null,
    rating: details.rating,
    reviewCount: details.user_ratings_total,
    score: 0,
    reasons: [],
    grade: null,
  };

  // website がない → 即A判定
  if (!details.website) {
    result.score = 3;
    result.reasons.push('Webサイトなし');
    result.grade = 'A';
    return result;
  }

  const url = details.website;

  // SSL判定
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:') {
      result.score += 2;
      result.reasons.push('SSL非対応');
    }
  } catch (_) {
    result.score += 2;
    result.reasons.push('URL不正');
  }

  // PageSpeed チェック（モバイル）
  try {
    const psScore = await checkPageSpeed(url);
    if (psScore !== null && psScore <= 49) {
      result.score += 2;
      result.reasons.push(`PageSpeed低（${psScore}点）`);
    } else if (psScore !== null && psScore <= 69) {
      result.score += 1;
      result.reasons.push(`PageSpeed中（${psScore}点）`);
    }
    result.pagespeedScore = psScore;
  } catch (_) {
    result.reasons.push('PageSpeed取得失敗');
  }

  // viewport meta タグ確認
  try {
    const html = await axios.get(url, { timeout: 8000 });
    if (!html.data.includes('viewport')) {
      result.score += 1;
      result.reasons.push('viewport未設定');
    }
  } catch (_) {
    result.reasons.push('HTML取得失敗');
  }

  // Wayback Machine チェック
  try {
    const isOld = await checkWayback(url);
    if (isOld) {
      result.score += 1;
      result.reasons.push('3年以上更新なし（推定）');
    }
  } catch (_) {
    result.reasons.push('Wayback取得失敗');
  }

  // グレード決定
  result.grade = result.score >= 3 ? 'A' : result.score >= 1 ? 'B' : 'C';
  return result;
}

module.exports = { screenPlace };
```

### `src/pagespeed.js`

```javascript
const axios = require('axios');

async function checkPageSpeed(url) {
  const res = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
    params: {
      url,
      strategy: 'mobile',
      // key は省略可（無料枠）
    },
    timeout: 20000,
  });
  const score = res.data?.lighthouseResult?.categories?.performance?.score;
  return score !== undefined ? Math.round(score * 100) : null;
}

module.exports = { checkPageSpeed };
```

### `src/wayback.js`

```javascript
const axios = require('axios');

// 3年以上前のスナップショットのみ存在するか確認
async function checkWayback(url) {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const ts = threeYearsAgo.toISOString().replace(/[-:T]/g, '').slice(0, 8);

  const res = await axios.get('https://archive.org/wayback/available', {
    params: { url, timestamp: ts },
    timeout: 10000,
  });

  const snapshot = res.data?.archived_snapshots?.closest;
  if (!snapshot?.available) return false;

  // 最新のスナップショットが3年以上前か確認
  const latestRes = await axios.get('https://archive.org/wayback/available', {
    params: { url },
    timeout: 10000,
  });

  const latestTs = latestRes.data?.archived_snapshots?.closest?.timestamp;
  if (!latestTs) return true; // 最新取得不可 → 古いとみなす

  const latestDate = new Date(
    `${latestTs.slice(0,4)}-${latestTs.slice(4,6)}-${latestTs.slice(6,8)}`
  );
  const diffYears = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return diffYears >= 3;
}

module.exports = { checkWayback };
```

### `src/index.js` — メインエントリー

```javascript
require('dotenv').config();
const { nearbySearch, placeDetails, sleep } = require('./places');
const { screenPlace } = require('./screening');
const { exportLeads } = require('./exporter');
const targets = require('../config/targets.json');

async function main() {
  const allLeads = [];

  for (const target of targets.searches) {
    console.log(`[検索開始] ${target.label}`);
    const places = await nearbySearch(target);

    // 基本フィルタ
    const filtered = places.filter(p =>
      p.user_ratings_total >= targets.filters.minRatings &&
      p.rating >= targets.filters.minScore &&
      p.business_status === 'OPERATIONAL'
    );
    console.log(`  候補: ${filtered.length}件`);

    for (const place of filtered) {
      await sleep(300); // API負荷軽減
      const details = await placeDetails(place.place_id);
      await sleep(500); // スクリーニング前の待機

      const result = await screenPlace(details);
      result.searchLabel = target.label;
      result.placeId = place.place_id;

      if (result.grade !== 'C') {
        allLeads.push(result);
        console.log(`  [${result.grade}] ${result.name} — ${result.reasons.join(', ')}`);
      }
    }
  }

  await exportLeads(allLeads);
  console.log(`\n完了: ${allLeads.length}件のリードを出力`);
}

main().catch(console.error);
```

---

## 5. データ出力仕様

### 5-1. CSV 出力カラム定義

| カラム名 | 型 | 内容 | 例 |
|---|---|---|---|
| `lead_id` | string | `YYYYMMDD-{連番3桁}` | `20260521-001` |
| `grade` | string | A / B | `A` |
| `score` | number | スクリーニングスコア | `4` |
| `name` | string | 店舗名 | `カフェ山田` |
| `address` | string | 住所（フルテキスト） | `東京都渋谷区〇〇1-2-3` |
| `phone` | string | 電話番号 | `03-1234-5678` |
| `website` | string | WebサイトURL（nullの場合は空） | `` |
| `rating` | number | Google評価 | `4.1` |
| `review_count` | number | レビュー数 | `23` |
| `pagespeed_score` | number | モバイルPageSpeedスコア | `38` |
| `reasons` | string | スクリーニング理由（カンマ区切り） | `Webサイトなし,SSL非対応` |
| `search_label` | string | 検索タグ | `渋谷_飲食` |
| `place_id` | string | Google PlaceID | `ChIJ...` |
| `extracted_at` | string | 抽出日時（ISO 8601） | `2026-05-21T09:30:00+09:00` |
| `status` | string | 初期値: `new` / 更新: `contacted`, `rejected`, `won` | `new` |

### 5-2. Notion DB カラム定義（Agent 2 連携用）

Notion に手動インポート、または Notion API で自動挿入する場合のプロパティ定義。

| Notion プロパティ名 | 型 | 対応 CSV カラム |
|---|---|---|
| 店舗名 | Title | `name` |
| グレード | Select（A/B） | `grade` |
| スコア | Number | `score` |
| 住所 | Text | `address` |
| 電話番号 | Phone | `phone` |
| 現在のWebサイト | URL | `website` |
| 評価 | Number | `rating` |
| レビュー数 | Number | `review_count` |
| PageSpeed（モバイル） | Number | `pagespeed_score` |
| 理由 | Text | `reasons` |
| エリア・業種 | Text | `search_label` |
| Place ID | Text | `place_id` |
| 抽出日 | Date | `extracted_at` |
| ステータス | Select（new/contacted/rejected/won） | `status` |
| 試作サイトURL | URL | （Agent 2 が記入） |
| 営業メモ | Text | （Agent 2 が記入） |

### 5-3. JSON スキーマ（Agent 2 への引き渡し用）

```json
{
  "version": "1.0",
  "extracted_at": "2026-05-21T09:30:00+09:00",
  "total_count": 18,
  "leads": [
    {
      "lead_id": "20260521-001",
      "grade": "A",
      "score": 3,
      "name": "カフェ山田",
      "address": "東京都渋谷区〇〇1-2-3",
      "phone": "03-1234-5678",
      "website": null,
      "rating": 4.1,
      "review_count": 23,
      "pagespeed_score": null,
      "reasons": ["Webサイトなし"],
      "search_label": "渋谷_飲食",
      "place_id": "ChIJxxxxxxxxxxxxxxxx",
      "extracted_at": "2026-05-21T09:30:00+09:00",
      "status": "new"
    }
  ]
}
```

---

## 6. コスト試算

### 前提条件

- 月4回スクリプト実行（週1回）
- 1回あたり: 3エリア × 3業種 = 9クエリ
- Nearby Search 1クエリあたり平均 40件取得
- 候補絞り込み後に Place Details を呼ぶ件数: 40件 × 50% = 20件（基本フィルタ通過）
- PageSpeed API: 無料枠のため $0

### Google Maps API コスト

#### Nearby Search

| 項目 | 計算 | 月次合計 |
|---|---|---|
| 1回の実行: クエリ数 | 9クエリ × ページ数 2 = 18リクエスト | — |
| 月4回 | 18 × 4 = 72リクエスト | — |
| 単価 | $32.00 / 1000件 | — |
| **Nearby Search 月次コスト** | 72 / 1000 × $32 | **$2.30** |

#### Place Details

| 項目 | 計算 | 月次合計 |
|---|---|---|
| 1回の実行: Details呼び出し | 20件 × 9クエリ = 180件 | — |
| 月4回 | 180 × 4 = 720件 | — |
| 単価（Basic + Contact + Atmosphere） | $17.00 / 1000件 | — |
| **Place Details 月次コスト** | 720 / 1000 × $17 | **$12.24** |

#### 月次合計

| 項目 | コスト |
|---|---|
| Nearby Search | $2.30 |
| Place Details | $12.24 |
| PageSpeed API | $0.00（無料） |
| Wayback Machine | $0.00（無料） |
| **合計** | **$14.54 / 月** |

> Google Maps Platform は毎月 **$200 の無料クレジット**が付与される。上記コストはすべて無料枠内に収まるため、**実質 $0 / 月**での運用が可能。ただし無料枠は他のGoogle Maps APIとの合算なので注意。

### 無料枠超過リスクのシナリオ

| シナリオ | 追加コスト |
|---|---|
| 月8回実行（無料枠内で2倍スケール） | $29 → 無料枠内 |
| エリア・業種を3倍に拡大（月12回相当） | $43 → 無料枠超過分: 約 $0（まだ枠内） |
| 月100回以上の大規模実行 | $200超 → 課金発生 |

---

## 7. リスクと回避策

### 7-1. Google Maps API 利用規約

**禁止事項（Terms of Service 上の重要ポイント）**:

| 禁止行為 | 内容 |
|---|---|
| データのキャッシュ・永続保存 | Place Details の結果を自前DBに無期限保存することは原則禁止（30日以内のキャッシュは許可） |
| 競合サービスへのデータ提供 | 取得データを他社地図サービスや競合APIに転用禁止 |
| Google Maps 以外での地図表示用データ活用 | 取得した座標・場所情報を他社地図で表示禁止 |
| スクレイピング | APIを使わないHTMLスクレイピングは**明確に禁止** |

**本スクリプトが**問題ない理由**:
- 正規APIのみ使用（スクレイピング不使用）
- 取得データを自社営業活動（Webサイト提案）に限定利用
- 30日以内に消費するため、実質的なキャッシュ問題なし

**グレーゾーン対応**:
- CSVへの永続保存は「30日ルール」に注意。**30日経過したリードは再取得するか削除**する運用を推奨
- lead_id の `extracted_at` を参照して古いデータを自動クリーニングする処理を追加推奨

### 7-2. API レート制限

| API | 制限 | 対策 |
|---|---|---|
| Places API | QPS（Queries Per Second）: 50/秒 | `sleep(300ms)` で余裕をもってリクエスト |
| Places API | 月間リクエスト数: 課金で実質無制限 | 無料枠 $200 を監視 |
| PageSpeed API | 25,000リクエスト/日 | 1実行で最大200件なので問題なし |
| Wayback Machine | 公式制限なし（非公式: 1req/sec） | `sleep(1000ms)` を維持 |

### 7-3. Webサイト取得の失敗ケース

| ケース | 発生頻度 | 対策 |
|---|---|---|
| CORS/robots.txt でブロック | 中 | axios の User-Agent を設定（`Mozilla/5.0...`相当） |
| タイムアウト | 中 | タイムアウト 8〜10秒に設定し、失敗時は `reasons` に「HTML取得失敗」を記録 |
| リダイレクト多段 | 低 | axios の `maxRedirects: 5` を設定 |
| JavaScript レンダリング必須のSPA | 低 | viewport チェックをスキップし、PageSpeedの結果のみ利用 |

### 7-4. データ品質リスク

| リスク | 内容 | 対策 |
|---|---|---|
| 重複リード | 複数エリアの境界で同店舗が重複取得される | `place_id` をキーに重複除去 |
| 廃業・移転済み | `business_status` が OPERATIONAL でも実態が閉店のケース | `business_status` チェック + 電話番号確認を営業前に実施 |
| Place Details のwebsiteが古い | オーナーが更新していない | 実際の営業時にURLを目視確認 |
| 個人情報扱い | 電話番号・住所は個人情報に準じる扱い | 社外共有禁止、30日保存ルールを徹底 |

### 7-5. 代替手段（APIが利用不可になった場合）

| 代替手段 | 特徴 | コスト |
|---|---|---|
| SerpAPI（Google Maps 結果） | Places APIの非公式ラッパー | $50/月〜 |
| Outscraper | Google Maps データを取得できるSaaS | $3/1000件〜 |
| 手動リサーチ + Notion入力 | API不要、工数大 | $0 |
| iタウンページ / Yelp APIの活用 | 業種・地域絞り込みが可能 | 無料枠あり |

---

## 8. 1日の運用フロー

### 運用サイクル: 週1回（平日朝）

```
[月曜 or 火曜の朝 — 所要時間: 約15分]

7:00 AM  スクリプト実行
  $ node src/index.js
  ↓ 自動処理（10〜20分）
  - Nearby Search で候補取得
  - Place Details でwebsite/phone取得
  - PageSpeed / Wayback / SSLスクリーニング
  - output/leads_YYYYMMDD.csv を生成

7:20 AM  CSVをNotionにインポート or 確認
  - Notion DBにCSVをインポート
  - Aグレードのリードを優先確認（目視で店舗名・住所チェック）
  - 明らかにおかしいデータ（廃業済み等）をステータス = 'rejected' に変更

7:30 AM  Agent 2（sales-strategist）へ引き渡し
  - AグレードリードのJSON / CSV を共有
  - 試作サイト制作キューに追加
```

### 月次メンテナンス（月末 — 所要時間: 約30分）

```
- config/targets.json に新エリア・業種を追加（月1〜2エリア拡張）
- 30日超過の古いリードデータを削除（利用規約準拠）
- Google Cloud Console で APIコスト確認（$200無料枠の消化率チェック）
- スクリプトのエラーログ確認・修正
```

### 月次 KPI チェック

| 指標 | チェック方法 |
|---|---|
| 月間Aグレードリード数 | Notion DB のフィルタ（grade = A） |
| 接触済み率 | status = 'contacted' の件数 ÷ total |
| 受注率 | status = 'won' の件数 ÷ contacted |
| APIコスト | Google Cloud Console の請求ページ |

---

## 9. 他エージェントへの引き渡し仕様（Agent 2への出力データ構造）

### 引き渡すファイル

1. `output/leads_YYYYMMDD.csv` — 全リード（A + Bグレード）
2. `output/leads_YYYYMMDD_priority.json` — Aグレードのみ（Agent 2 が使用するJSON）

### JSON スキーマ（確定版）

```typescript
// Agent 2 が期待するインターフェース定義
interface Lead {
  lead_id: string;          // "20260521-001"
  grade: "A" | "B";        // スクリーニンググレード
  score: number;            // 0〜6
  name: string;             // 店舗名
  address: string;          // フル住所
  phone: string | null;     // 電話番号（null許容）
  website: string | null;   // 現在のWebサイトURL（null = なし）
  rating: number;           // Google評価（3.8〜5.0）
  review_count: number;     // レビュー数
  pagespeed_score: number | null;  // モバイルスコア（0〜100, null = 計測不可）
  reasons: string[];        // スクリーニング理由の配列
  search_label: string;     // "渋谷_飲食" 等
  place_id: string;         // Google Place ID
  extracted_at: string;     // ISO 8601
  status: "new";            // Agent 1 出力時は常に "new"
}

interface LeadExportFile {
  version: "1.0";
  extracted_at: string;
  total_count: number;
  grade_a_count: number;
  grade_b_count: number;
  leads: Lead[];
}
```

### Agent 2 への申し送り事項

- `website: null` のリードは試作サイト名を自由に設定可能
- `website` がある場合は既存サイトを参考にリデザイン案を提示
- `phone` が `null` のリードは電話番号を調べてからアプローチ
- `reasons` の内容を営業トークに活用可能（例: 「PageSpeed 38点でして...」）
- `place_id` を使えばGoogle Maps の店舗ページへの直リンクを生成可能

```javascript
// Google Maps 店舗ページURL生成
const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${lead.place_id}`;
```

---

## 付録: 環境セットアップ

### 必要な依存パッケージ

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.0.0",
    "csv-writer": "^1.6.0"
  }
}
```

### `.env` ファイル

```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. 「APIとサービス」→「ライブラリ」で以下を有効化
   - Places API
   - PageSpeed Insights API（任意: APIキーなしでも動作）
3. 「認証情報」→「APIキーを作成」
4. APIキーの制限: 「HTTPリファラー」または「IPアドレス」を指定（セキュリティ）
5. 「請求」→ 請求先アカウントを設定（無料枠利用のためにも必要）
6. 「予算とアラート」で月 $30 のアラートを設定（安全管理）
