```markdown
# Agent 04: Vue 3 フロントエンド開発専門家（vue-architect）

## 1. エージェント概要

### 役割と責任範囲

`vue-architect` は、Web制作サービスにおけるフロントエンド実装を担うエージェントです。一人運営の制作フローにおいて、**1サイトあたり5〜10時間以内**での納品を実現するため、再利用可能なコンポーネント群・AI駆動開発フロー・パフォーマンス最適化の三本柱を提供します。

### 技術スタック

| カテゴリ | 採用技術 | バージョン目安 |
|----------|----------|----------------|
| UIフレームワーク | Vue 3 (Composition API) | ^3.4 |
| ビルドツール | Vite | ^5.x |
| 型システム | TypeScript | ^5.x |
| スタイリング | Tailwind CSS | ^3.4 |
| 状態管理 | Pinia | ^2.x |
| ルーティング | Vue Router | ^4.x |
| CMS | microCMS | REST API v1 |
| SEO | @vueuse/head | ^2.x |

### エージェントの入出力

- **入力元**: Agent 03（ヒアリングシート・ブランドトーン・コンテンツ素材）
- **出力先**: Agent 05（完成済みVueプロジェクト一式・デプロイ設定）

---

## 2. プロジェクト構成

### ディレクトリツリー（業種横断テンプレート）

```
project-root/
├── public/
│   ├── favicon.ico
│   └── og-image.jpg              # OGP画像（1200x630px）
├── src/
│   ├── assets/
│   │   ├── images/               # ローカル画像（最適化済みWebP）
│   │   └── fonts/                # セルフホストフォント（任意）
│   ├── components/
│   │   ├── sections/             # ページセクション単位
│   │   │   ├── HeroSection.vue
│   │   │   ├── AboutSection.vue
│   │   │   ├── ServicesSection.vue
│   │   │   ├── GallerySection.vue
│   │   │   ├── ReviewsSection.vue
│   │   │   ├── AccessSection.vue
│   │   │   └── ContactSection.vue
│   │   ├── layout/               # レイアウト共通部品
│   │   │   ├── SiteHeader.vue
│   │   │   └── SiteFooter.vue
│   │   └── ui/                   # 汎用UIプリミティブ
│   │       ├── BaseButton.vue
│   │       ├── BaseImage.vue     # 遅延読み込みラッパー
│   │       ├── BaseCard.vue
│   │       └── SectionHeading.vue
│   ├── composables/
│   │   ├── useMicroCMS.ts        # CMS取得ロジック
│   │   ├── useIntersection.ts    # Intersection Observer
│   │   └── useSeo.ts             # ページ別メタタグ生成
│   ├── stores/
│   │   ├── siteStore.ts          # 店舗基本情報（全コンポーネント共有）
│   │   ├── contentStore.ts       # CMSコンテンツキャッシュ
│   │   └── uiStore.ts            # モーダル・ローディング状態
│   ├── types/
│   │   ├── site.ts               # 店舗情報型定義
│   │   ├── microcms.ts           # microCMSレスポンス型
│   │   └── components.ts         # コンポーネントprops型定義
│   ├── pages/                    # Vue Router ページコンポーネント
│   │   ├── HomePage.vue
│   │   ├── ServiceDetailPage.vue # （任意：多ページ構成時）
│   │   └── NotFoundPage.vue
│   ├── router/
│   │   └── index.ts
│   ├── styles/
│   │   ├── base.css              # Tailwind base + カスタムCSS変数
│   │   └── typography.css        # @tailwindcss/typography 調整
│   ├── App.vue
│   └── main.ts
├── .env                          # VITE_MICROCMS_API_KEY 等
├── .env.example
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### Vite 設定（重要箇所）

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          microcms: ['microcms-js-sdk']
        }
      }
    }
  }
})
```

---

## 3. コンポーネント設計

### 3-1. HeroSection.vue

```typescript
// Props
interface HeroProps {
  headline: string          // メインキャッチコピー
  subheadline?: string      // サブコピー
  ctaLabel: string          // CTAボタンテキスト
  ctaHref: string           // CTAリンク先（'#contact' 等）
  backgroundImage: string   // 背景画像URL
  overlayOpacity?: number   // 背景オーバーレイ濃度 (0〜100, default: 50)
}

// Emits
interface HeroEmits {
  (e: 'cta-click'): void
}
```

**実装のポイント**
- 背景画像は `<picture>` + `srcset` でレスポンシブ対応
- LCP対象要素のため `loading="eager"` + `fetchpriority="high"` を指定
- CTAボタンは `BaseButton` を使用し `role="button"` を付与

---

### 3-2. AboutSection.vue

```typescript
interface AboutProps {
  title: string
  body: string              // HTMLを含む場合は v-html で描画
  imageUrl?: string
  imageAlt?: string
  stats?: Array<{
    label: string
    value: string           // 例: '創業20年' '満足度98%'
  }>
}
```

---

### 3-3. ServicesSection.vue

```typescript
interface ServiceItem {
  id: string
  title: string
  description: string
  price?: string            // 例: '¥5,000〜'
  iconUrl?: string
  badge?: string            // 例: '人気No.1'
}

interface ServicesProps {
  title?: string
  services: ServiceItem[]
  layout?: 'grid' | 'list'  // default: 'grid'
  columns?: 2 | 3 | 4       // default: 3
}

interface ServicesEmits {
  (e: 'service-click', id: string): void
}
```

---

### 3-4. GallerySection.vue

```typescript
interface GalleryImage {
  url: string
  alt: string
  caption?: string
  category?: string         // フィルタリング用タグ
}

interface GalleryProps {
  title?: string
  images: GalleryImage[]
  enableFilter?: boolean    // カテゴリフィルターUI
  columns?: 2 | 3 | 4       // default: 3
}

interface GalleryEmits {
  (e: 'image-click', index: number): void
}
```

**実装のポイント**
- `BaseImage` コンポーネント経由で `loading="lazy"` を自動付与
- `useIntersection` composableでビューポート外は描画スキップ

---

### 3-5. ReviewsSection.vue

```typescript
interface ReviewItem {
  id: string
  authorName: string
  rating: number            // 1〜5
  body: string
  date?: string
  avatarUrl?: string
  platform?: 'google' | 'other'
}

interface ReviewsProps {
  title?: string
  reviews: ReviewItem[]
  averageRating?: number
  totalCount?: number
  displayCount?: number     // 表示件数上限 (default: 6)
}
```

---

### 3-6. AccessSection.vue

```typescript
interface AccessProps {
  address: string
  nearestStation?: string
  walkingMinutes?: number
  parkingInfo?: string
  businessHours: Array<{
    days: string            // 例: '月〜金'
    hours: string           // 例: '10:00〜19:00'
    note?: string           // 例: '最終受付18:30'
  }>
  regularHoliday?: string
  mapEmbedUrl?: string      // Google Maps埋め込みURL
  mapLinkUrl?: string       // Google Mapsリンク
}
```

---

### 3-7. ContactSection.vue

```typescript
interface ContactField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: string[]        // select/checkbox用
  validation?: RegExp
}

interface ContactProps {
  title?: string
  description?: string
  fields: ContactField[]
  submitLabel?: string      // default: '送信する'
  formspreeId?: string      // Formspree使用時
  webhookUrl?: string       // 独自エンドポイント使用時
}

interface ContactEmits {
  (e: 'submit-success'): void
  (e: 'submit-error', message: string): void
}
```

---

### 3-8. SiteFooter.vue

```typescript
interface FooterLink {
  label: string
  href: string
  external?: boolean
}

interface FooterProps {
  businessName: string
  address?: string
  phone?: string
  email?: string
  links?: FooterLink[]
  socialLinks?: Array<{
    platform: 'instagram' | 'line' | 'x' | 'facebook' | 'youtube'
    url: string
  }>
  copyrightYear?: number    // default: 現在年
}
```

---

### 3-9. BaseImage.vue（遅延読み込みラッパー）

```typescript
interface BaseImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  eager?: boolean           // LCP対象画像のみ true
  objectFit?: 'cover' | 'contain' | 'fill'
  aspectRatio?: string      // 例: '16/9', '4/3', '1/1'
}
```

```vue
<!-- BaseImage.vue 実装例 -->
<template>
  <img
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : 'auto'"
    :decoding="eager ? 'sync' : 'async'"
    :style="aspectRatio ? { aspectRatio } : {}"
    :class="['object-' + (objectFit ?? 'cover'), 'w-full h-full']"
  />
</template>
```

---

## 4. microCMS スキーマ設計

### 4-1. `site-info`（店舗基本情報 / シングルコンテンツ）

| フィールドID | 名称 | 種別 | 必須 |
|---|---|---|---|
| `businessName` | 店舗名 | テキスト | ✓ |
| `catchCopy` | キャッチコピー | テキスト | ✓ |
| `subCopy` | サブコピー | テキスト | |
| `description` | 店舗説明文 | リッチエディタ | ✓ |
| `phone` | 電話番号 | テキスト | |
| `address` | 住所 | テキスト | ✓ |
| `nearestStation` | 最寄り駅 | テキスト | |
| `businessHours` | 営業時間（複数）| 繰り返しフィールド | ✓ |
| `regularHoliday` | 定休日 | テキスト | |
| `heroImage` | ヒーロー画像 | 画像 | ✓ |
| `ogImage` | OGP画像 | 画像 | ✓ |
| `mapEmbedUrl` | Google Maps埋め込みURL | テキスト | |

### 4-2. `services`（サービス一覧 / リスト型）

| フィールドID | 名称 | 種別 | 必須 |
|---|---|---|---|
| `title` | サービス名 | テキスト | ✓ |
| `description` | 説明文 | テキストエリア | ✓ |
| `price` | 料金表示 | テキスト | |
| `icon` | アイコン画像 | 画像 | |
| `badge` | バッジテキスト | テキスト | |
| `displayOrder` | 表示順 | 数値 | ✓ |

### 4-3. `gallery`（ギャラリー / リスト型）

| フィールドID | 名称 | 種別 | 必須 |
|---|---|---|---|
| `image` | 画像 | 画像 | ✓ |
| `alt` | 代替テキスト | テキスト | ✓ |
| `caption` | キャプション | テキスト | |
| `category` | カテゴリ | セレクトフィールド | |

### 4-4. `reviews`（お客様の声 / リスト型）

| フィールドID | 名称 | 種別 | 必須 |
|---|---|---|---|
| `authorName` | 投稿者名 | テキスト | ✓ |
| `rating` | 評価（1〜5） | 数値 | ✓ |
| `body` | レビュー本文 | テキストエリア | ✓ |
| `date` | 投稿日 | 日時 | |
| `platform` | 投稿元 | セレクトフィールド | |

### Pinia siteStore の設計

```typescript
// stores/siteStore.ts
import { defineStore } from 'pinia'
import type { SiteInfo } from '@/types/site'

export const useSiteStore = defineStore('site', {
  state: (): { info: SiteInfo | null; loading: boolean; error: string | null } => ({
    info: null,
    loading: false,
    error: null
  }),
  getters: {
    businessName: (state) => state.info?.businessName ?? '',
    heroImage: (state) => state.info?.heroImage?.url ?? '',
    businessHours: (state) => state.info?.businessHours ?? []
  },
  actions: {
    async fetchSiteInfo() {
      this.loading = true
      try {
        const { useMicroCMS } = await import('@/composables/useMicroCMS')
        const { getObject } = useMicroCMS()
        this.info = await getObject<SiteInfo>('site-info')
      } catch (e) {
        this.error = 'サイト情報の取得に失敗しました'
      } finally {
        this.loading = false
      }
    }
  }
})
```

---

## 5. AIコンテンツ生成プロンプト集

### 5-1. ヒアリングシート → サイトコンテンツ生成

```
# 役割
あなたはWeb制作のコピーライターです。以下のヒアリング情報をもとに、
指定された各セクションのコンテンツを生成してください。

# ヒアリング情報
- 業種：{industry}
- 店舗名：{businessName}
- 強み・特徴（3つ）：{strengths}
- ターゲット顧客：{targetCustomer}
- 立地・アクセス：{location}
- 価格帯：{priceRange}
- スタッフの雰囲気：{staffVibe}
- こだわりのポイント：{uniquePoint}

# 出力形式（JSON）
{
  "hero": {
    "headline": "（20文字以内のメインキャッチコピー）",
    "subheadline": "（40文字以内のサブコピー）",
    "ctaLabel": "（CTAボタンテキスト 10文字以内）"
  },
  "about": {
    "title": "（セクションタイトル 15文字以内）",
    "body": "（店舗説明文 200〜300文字。改行は\\nで表現）",
    "stats": [
      { "label": "ラベル", "value": "数値や実績" }
    ]
  },
  "services": [
    {
      "title": "サービス名",
      "description": "説明文（50〜80文字）",
      "badge": "バッジ（任意）"
    }
  ],
  "footer": {
    "tagline": "フッターのブランドメッセージ（30文字以内）"
  }
}

# 制約
- 誇大表現（日本一・最高・完璧など）は使用しない
- 親しみやすく、専門的すぎない言葉遣い
- ターゲット顧客が共感できる表現を優先
```

---

### 5-2. Google レビュー → 「お客様の声」セクション生成

```
# 役割
あなたはWebコンテンツ編集者です。Googleレビューの原文を整形し、
Webサイト掲載用の「お客様の声」コンテンツを生成してください。

# 入力レビュー（生データ）
{rawReviews}

# 処理ルール
1. 誤字・脱字を修正する（意味は変えない）
2. 個人を特定できる情報（苗字フルネーム・具体的な日時）を削除
3. 投稿者名は「○○様」形式に統一（イニシャル+様でも可）
4. 150文字を超えるレビューは要点を維持しつつ120文字程度に要約
5. 評価4〜5のものを優先的に選択

# 出力形式（JSON配列）
[
  {
    "authorName": "○○様",
    "rating": 5,
    "body": "整形済みレビュー本文",
    "shortQuote": "ひと言引用（30文字以内）"
  }
]

# 禁止事項
- レビューの評価を上げる改ざん
- ポジティブでない内容の削除（改ざんに相当）
- 存在しない情報の追加
```

---

### 5-3. Cursor でのコンポーネント生成プロンプトパターン

#### パターン A：セクションコンポーネント新規作成

```
# Cursor Prompt: セクションコンポーネント生成

Vue 3 + TypeScript + Tailwind CSS で {ComponentName}.vue を作成してください。

## 仕様
- Composition API（<script setup>）を使用
- Props: {propsDefinition}
- スマホファースト（モバイルで縦1列、md:以上でグリッド）
- アクセシビリティ: セマンティックHTML（<section>, <h2>等）を使用
- アニメーション: Intersection Observer で要素がビューポートに入ったらフェードイン

## スタイルガイド
- 主色: {primaryColor}（Tailwindのカスタムカラーに設定済み）
- フォント: ヒラギノ角ゴ → Noto Sans JP（フォールバック）
- 余白: セクション上下 py-16 md:py-24

## 参照コンポーネント
src/components/ui/BaseImage.vue（画像はこれを使用）
src/components/ui/SectionHeading.vue（見出しはこれを使用）

生成後、stories ファイル（{ComponentName}.stories.ts）も作成してください。
```

#### パターン B：既存コンポーネントのレスポンシブ修正

```
# Cursor Prompt: レスポンシブ修正

{ComponentName}.vue のレスポンシブ対応を改善してください。

## 問題
{problemDescription}

## 対応ブレークポイント
- sm: 640px（スマホ横）
- md: 768px（タブレット）
- lg: 1024px（PC）

## 制約
- 既存のProps・Emitsインターフェースは変更しない
- Tailwindクラスのみで対応（カスタムCSSを追加しない）
```

#### パターン C：microCMS データ取得統合

```
# Cursor Prompt: CMS統合

{ComponentName}.vue に microCMS からのデータ取得を統合してください。

## CMSエンドポイント
- エンドポイントID: {endpointId}
- レスポンス型: src/types/microcms.ts の {TypeName} を参照

## 要件
- useMicroCMS composable（src/composables/useMicroCMS.ts）を使用
- ローディング状態: スケルトンUIを表示（animate-pulse）
- エラー状態: エラーメッセージを表示（空のフォールバックUIも可）
- データのキャッシュ: contentStore（Pinia）に保存

## 型安全性
- any 型の使用禁止
- microCMSListResponse<T> 型でラップする
```

---

## 6. Cursor でのAI駆動開発フロー（ステップバイステップ）

### Phase 0: プロジェクト初期化（30分）

```
Step 1: テンプレートリポジトリのクローン・依存関係インストール
  $ git clone <template-repo> <project-name>
  $ cd <project-name> && npm install

Step 2: 環境変数設定
  .env に以下を設定:
  VITE_MICROCMS_SERVICE_DOMAIN=xxx
  VITE_MICROCMS_API_KEY=xxx

Step 3: tailwind.config.ts にブランドカラーを設定
  → Cursorに「クライアントのブランドカラー #XXXXXX を primary として追加」と指示

Step 4: siteStore の初期データを入力
  → ヒアリングシートから基本情報をコピペ
```

### Phase 1: CMSセットアップ（30分）

```
Step 5: microCMSダッシュボードでAPIを作成
  - site-info（シングル）
  - services（リスト）
  - gallery（リスト）
  - reviews（リスト）

Step 6: スキーマに従いフィールドを設定
  → 管理画面でフィールドを追加（約15分）

Step 7: テストデータを3〜5件入力
  → Claude APIで生成したコンテンツを貼り付け
```

### Phase 2: コンポーネント生成（2〜3時間）

```
Step 8: Cursor でセクションを順番に生成
  優先順位: Hero → Services → About → Reviews → Gallery → Access → Contact → Footer

  各コンポーネントの生成手順:
  a. 上記「パターン A」プロンプトをCursorのChat/Composerに貼り付け
  b. 生成されたコードを確認・必要に応じて修正指示
  c. ブラウザで表示確認（Vite HMRで即時反映）
  d. レスポンシブ確認（Chrome DevTools）

Step 9: HomePage.vue にセクションを組み込み
  → Cursorに「セクションをスクロール順に並べて HomePage.vue を完成させて」と指示
```

### Phase 3: CMSデータ統合（1時間）

```
Step 10: useMicroCMS composable でデータ取得
  → 「パターン C」プロンプトで各コンポーネントにCMS統合

Step 11: ローディング・エラー状態の確認
  → ネットワークタブでAPIレスポンスを確認

Step 12: microCMSダッシュボードでコンテンツ更新テスト
  → 店舗スタッフが操作できるか確認
```

### Phase 4: 仕上げ（1〜2時間）

```
Step 13: SEO設定（後述「7. パフォーマンス・SEO実装チェックリスト」参照）

Step 14: パフォーマンス確認
  $ npm run build && npm run preview
  → Chrome Lighthouse でスコア確認（目標: Performance 90+）

Step 15: アクセシビリティ確認
  → axe DevTools拡張でゼロエラーを確認

Step 16: フォーム動作確認
  → ContactSection の送信テスト（Formspree等）
```

---

## 7. パフォーマンス・SEO実装チェックリスト

### Core Web Vitals 最適化

#### LCP（Largest Contentful Paint）目標: 2.5秒以内

- [ ] Hero背景画像に `fetchpriority="high"` + `loading="eager"` を設定
- [ ] Hero画像をWebP形式に変換（vite-imagetools等で自動化）
- [ ] `<link rel="preconnect" href="https://images.microcms-assets.io">` を `index.html` に追加
- [ ] フォント読み込みに `font-display: swap` を指定
- [ ] Vite の `manualChunks` でベンダーバンドルを分離

#### CLS（Cumulative Layout Shift）目標: 0.1以下

- [ ] 全ての `<img>` に `width` と `height` 属性を明示（アスペクト比予約）
- [ ] 動的に追加されるコンテンツエリアに最小高さを設定
- [ ] カスタムフォントのFOUTを `font-display: optional` または preload で防ぐ

#### INP（Interaction to Next Paint）目標: 200ms以内

- [ ] イベントハンドラー内の重い処理を `setTimeout` または `requestIdleCallback` に移動
- [ ] フォーム送信処理を非同期化（`async/await`）
- [ ] 画像ギャラリーのモーダル開閉アニメーションは CSS transition のみで実装

---

### Vue Router コード分割

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/pages/HomePage.vue')  // 動的インポート
  },
  {
    path: '/services/:id',
    component: () => import('@/pages/ServiceDetailPage.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/NotFoundPage.vue')
  }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to) => {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})
```

---

### @vueuse/head でのSEO・OGP設定

```typescript
// composables/useSeo.ts
import { useHead } from '@vueuse/head'
import type { SiteInfo } from '@/types/site'

export function useSeo(info: SiteInfo, pageTitle?: string) {
  const title = pageTitle
    ? `${pageTitle} | ${info.businessName}`
    : `${info.businessName} | ${info.catchCopy}`

  useHead({
    title,
    meta: [
      { name: 'description', content: info.description.replace(/<[^>]*>/g, '').slice(0, 120) },
      // OGP
      { property: 'og:title', content: title },
      { property: 'og:description', content: info.description.replace(/<[^>]*>/g, '').slice(0, 120) },
      { property: 'og:image', content: info.ogImage?.url ?? '' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: info.businessName },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:image', content: info.ogImage?.url ?? '' },
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  })
}
```

---

### 構造化データ（JSON-LD）

```typescript
// App.vue 内 または useSeo.ts に追加
useHead({
  script: [{
    type: 'application/ld+json',
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: info.businessName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: info.address
      },
      telephone: info.phone,
      openingHoursSpecification: info.businessHours.map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.days,
        opens: h.hours.split('〜')[0],
        closes: h.hours.split('〜')[1]
      })),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating,
        reviewCount: totalCount
      }
    })
  }]
})
```

---

### Tailwind CSS アクセシビリティ対応チェックリスト

#### カラーコントラスト

- [ ] テキスト（通常）と背景のコントラスト比: **4.5:1以上**（WCAG AA）
- [ ] 大きいテキスト（18px以上 / 太字14px以上）: **3:1以上**
- [ ] Tailwindの `text-gray-600` on `bg-white` = 5.74:1（OK）
- [ ] `text-gray-500` on `bg-white` = 4.48:1（ギリギリOK）
- [ ] `text-gray-400` on `bg-white` = 2.85:1（NG → `text-gray-600` に変更）

#### フォーカス管理

- [ ] フォーカスリングを Tailwind の `focus:ring-2 focus:ring-primary focus:outline-none` で統一
- [ ] モーダル・ドロワー開閉時にフォーカスをトラップ（`useFocusTrap` composable）
- [ ] `tabindex="-1"` でスキップリンクから本文へのジャンプを実装

#### セマンティックHTML

- [ ] ページに `<h1>` が1つのみ存在する
- [ ] 見出しレベルが飛び番なし（h1→h2→h3）
- [ ] ナビゲーションに `<nav aria-label="メインナビゲーション">` を付与
- [ ] アイコンのみのボタンに `aria-label` を設定
- [ ] 画像の `alt` テキストが「画像の内容」ではなく「コンテキスト」を説明している
- [ ] 装飾目的の画像は `alt=""` を設定

#### フォームアクセシビリティ

- [ ] 全ての入力フィールドに `<label>` が関連付けられている（`for` + `id`）
- [ ] バリデーションエラーは `aria-describedby` でフィールドに関連付け
- [ ] 必須フィールドに `required` + `aria-required="true"` を設定
- [ ] フォーム送信後に `aria-live="polite"` エリアで結果を通知

#### モーション・アニメーション

- [ ] `prefers-reduced-motion: reduce` のメディアクエリを考慮
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```

---

## 8. Agent 3からの受け取り仕様 / Agent 5への引き渡し仕様

### Agent 3（コンテンツ企画エージェント）からの受け取り

| 項目 | 形式 | 用途 |
|------|------|------|
| ヒアリングシート（完成版） | JSON / Markdown | Claude APIプロンプトへの入力 |
| ブランドカラーコード | HEX (#RRGGBB) | tailwind.config.ts の primary カラー |
| ブランドトーン定義 | テキスト | Cursorへのコンポーネント生成指示に付加 |
| 使用フォント指定 | テキスト | base.css のフォント設定 |
| サイトマップ | Markdown リスト | Vue Router のルート定義 |
| 素材画像 | フォルダ（WebP推奨）| src/assets/images/ + microCMS gallery |
| Google レビュー原文 | テキスト / JSON | Claude APIでの「お客様の声」生成 |
| 競合調査レポート | Markdown | デザイン方針の参考情報（任意） |

**受け取り時の確認事項**

```
[ ] ヒアリングシートの全必須項目が埋まっているか
[ ] ブランドカラーのコントラスト比が AA 基準を満たすか（事前確認）
[ ] 素材画像の解像度が十分か（Hero: 1920px幅以上 / Gallery: 800px幅以上）
[ ] microCMS の APIキーが発行されているか
```

---

### Agent 5（デプロイ・品質保証エージェント）への引き渡し

| 項目 | 形式 | 説明 |
|------|------|------|
| Viteビルド済み成果物 | `dist/` フォルダ | `npm run build` の出力 |
| 環境変数設定ファイル | `.env.example` | 実際のキーは含まず |
| Lighthouse スコアレポート | HTMLレポート | Performance・SEO・A11y の各スコア |
| axe DevTools 検査結果 | スクリーンショット | アクセシビリティエラー 0件を確認 |
| microCMS 管理マニュアル | Markdown | 店舗スタッフ向け更新手順書 |
| コンポーネント一覧 | Markdown | 各コンポーネントのprops仕様まとめ |
| フォーム送信先設定 | `.env.example` に記載 | Formspree IDまたはwebhook URL |

**引き渡し時の品質基準**

```
[ ] npm run build がエラーなく完了する
[ ] TypeScript 型エラーが 0 件（npm run type-check）
[ ] Lighthouse Performance スコア: 90以上
[ ] Lighthouse SEO スコア: 100
[ ] Lighthouse Accessibility スコア: 95以上
[ ] microCMS でコンテンツ更新→即時反映を確認
[ ] スマホ（375px）・タブレット（768px）・PC（1280px）での表示確認
[ ] ContactSection のフォーム送信テスト完了
[ ] 全リンクの動作確認（リンク切れゼロ）
```

---

*作成日: 2026-05-21 | Agent: vue-architect (04) | Version: 1.0.0*

```