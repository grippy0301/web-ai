# AI駆動 店舗Webサイト自動作成サービス — 完全ロードマップ

> Notion: [元ページ](https://www.notion.so/AI-Web-367089a9cb0780518235df13c9cf1ee8)

> 作成日: 2026-05-21

---

## **目次**
1. 全体フローと設計思想
1. エージェントシステム設計
1. Phase 1: リード発掘・スクリーニング
1. Phase 2: 営業・試作サイト提案
1. Phase 3: 受注・契約・ヒアリング
1. Phase 4: Vue 3 本開発
1. Phase 5: デプロイ・納品・QA
1. Phase 6: 保守・継続収益・成長
1. 収益シミュレーション
1. 全体タイムライン
1. ツールスタック・コストまとめ

---

## **1. 全体フロー**

```plain text
Phase 1: リード発掘（AIスクリーニング）
  Google Maps API で「サイトなし・古いサイト」の店舗を自動検出
         ↓
Phase 2: 営業・提案（試作サイトを添付）
  Claude API で試作サイト自動生成 → Vercel デプロイ → メール/DM 送付
         ↓
Phase 3: 受注・契約（ヒアリング → AI要件定義）
  電子契約・ヒアリングシート → Claude API で要件定義書を自動生成
         ↓
Phase 4: 本開発（Vue 3 × Cursor AI）
  Cursor + Codex/Claude API で 5〜10 時間/案件を目標に開発
         ↓
Phase 5: 納品・デプロイ（Vercel + Cloudflare）
  Lighthouse CI 自動品質チェック → 顧客向けマニュアル自動生成 → 納品
         ↓
Phase 6: 保守・成長（MRR積み上げ）
  Dependabot 自動更新 + 月次レポート自動生成 + アップセル設計
```

### **料金体系**

| （Notion表 — 元ページで確認） |
| --- |


---

## **2. エージェントシステム設計**
本ロードマップは6つの専門エージェントが各フェーズを担当し、すべての出力が次のエージェントへ引き渡される設計になっている。各エージェントは3ラウンドのブラッシュアップを経た確定仕様を持つ。

```plain text
Orchestrator（本ドキュメント）
├── Agent 1: lead-scout       → 01_lead_scout.md
├── Agent 2: sales-strategist → 02_sales_strategist.md
├── Agent 3: contract-advisor → 03_contract_advisor.md
├── Agent 4: vue-architect    → 04_vue_architect.md
├── Agent 5: deploy-ops       → 05_deploy_ops.md
└── Agent 6: growth-manager   → 06_growth_manager.md
```

**エージェント間のデータフロー:**

```plain text
Agent 1 → leads_YYYYMMDD_priority.json
  └→ Agent 2 → handoff_agent3_{lead_id}.json
       └→ Agent 3 → requirements_{project_id}.json
            └→ Agent 4 → dist/ + Lighthouse レポート
                 └→ Agent 5 → delivery_{client_id}.json
                      └→ Agent 6 → 月次保守管理台帳
```

### **Phase別の実行ロードマップ**
各Phaseには、全体版から切り出した「運用ロードマップ」と、専門エージェントが深掘りした「詳細仕様」の2系統を用意した。まずは実行ロードマップを読み、必要な箇所だけ詳細仕様を参照する運用を想定する。

| （Notion表 — 元ページで確認） |
| --- |


---

## **3. Phase 1: リード発掘・スクリーニング**
> 実行ロードマップ: `new/web_creation_service_phase_01_lead_scout_JP.md`
### **目標KPI**

| （Notion表 — 元ページで確認） |
| --- |

### **スクリーニング条件**

```plain text
優先ターゲットの定義:
  - Google Maps にプレイス登録済み
  - Webサイトなし（即A判定: +3点）
  - またはWebサイトあり かつ以下のいずれか:
      PageSpeed モバイルスコア ≤ 49（+2点）
      SSL非対応（http://）（+2点）
      viewport未設定（+1点）
      最終アーカイブ 3年以上前（+1点）
  - レビュー数 5件以上
  - 評価 3.8 以上
  - business_status = OPERATIONAL

スコア 3以上 → A判定（優先）
スコア 1〜2  → B判定（補欠）
スコア 0     → 除外
```

### **使用API仕様**

| （Notion表 — 元ページで確認） |
| --- |

> **重要制約**: `website` フィールドは Nearby Search に含まれない。Place Details の個別呼び出しが必須。次ページ取得時は 2.5 秒以上の待機が必要。
### **スクリーニングスクリプト構成**

```plain text
lead-scout/
├── src/
│   ├── index.js        # メインエントリー
│   ├── places.js       # Google Maps API ラッパー
│   ├── screening.js    # スクリーニングロジック
│   ├── pagespeed.js    # PageSpeed API
│   ├── wayback.js      # Wayback Machine API
│   └── exporter.js     # CSV/JSON 出力
└── config/targets.json # 検索対象地域・業種定義
```

### **Agent 1 → Agent 2 引き渡しJSON仕様**

```typescript
interface Lead {
  lead_id: string;           // "20260521-001"
  grade: "A" | "B";
  score: number;             // 0〜6
  name: string;
  address: string;
  phone: string | null;
  website: string | null;    // null = サイトなし
  rating: number;
  review_count: number;
  pagespeed_score: number | null;
  reasons: string[];         // ["Webサイトなし"] 等
  place_id: string;          // Google Place ID
  extracted_at: string;      // ISO 8601
  status: "new";
}
```

### **1日の運用フロー**

```plain text
週1回（月曜朝・所要15分）:
  7:00  $ node src/index.js → leads_YYYYMMDD.csv 生成
  7:20  Notion DBにインポート・廃業店を目視除去
  7:30  Agent 2（sales-strategist）へAグレードリストを共有
```


---

## **4. Phase 2: 営業・試作サイト提案**
> 実行ロードマップ: `new/web_creation_service_phase_02_sales_strategy_JP.md`
### **試作サイト自動生成フロー**

```plain text
[Agent 1のリードデータ]
        ↓
[generate_prototype.js]
  ├─ Claude API: キャッチコピー・本文・レビュー整形
  ├─ Vue 3テンプレートに store.json を差し込み
  └─ Vite ビルド
        ↓
[Vercel CLI でデプロイ]
        ↓
[URL発行: {slug}-prototype.vercel.app]
        ↓
[Notionリードカードに試作URL記録]
        ↓
[営業送付フロー]
```

**コスト:** Claude API 約5〜10円/件、Vercel は月100件まで無料枠
### **コンテンツ生成プロンプト（コア部分）**

```javascript
const contentGenerationPrompt = (lead) => `
以下の店舗情報をもとに、試作Webサイト用コンテンツをJSON形式で生成してください。

店舗名: ${lead.store.name}
業種: ${lead.store.category}
Googleレビュー（抜粋）:
${lead.google_maps.reviews_top3.map((r, i) => `${i+1}. "${r}"`).join('\n')}
[出力: hero / about / reviews_section / cta / meta の JSON]
`;
// システムプロンプト: 誇大表現禁止、JSON以外出力不可、temperature: 0.7
```

### **試作サイト コンポーネント最小構成（Vue 3）**

```plain text
prototype-template/src/components/
  ├── SiteHeader.vue
  ├── HeroSection.vue      ← Google Maps 写真 + Claude生成コピー
  ├── AboutSection.vue
  ├── ReviewsSection.vue   ← Googleレビューを整形して掲載
  ├── AccessSection.vue    ← 営業時間・地図
  ├── ContactCTA.vue
  └── SiteFooter.vue
```

### **営業チャネル優先順位**

| （Notion表 — 元ページで確認） |
| --- |

### **営業メールテンプレート（AIが生成するプロンプト構成）**

```plain text
件名: 【試作サイト作成済み】${store.name}様のウェブサイトをご覧ください

本文構成:
1. 自己紹介（1文）
2. 試作URL（デプロイ済み）
3. プランと価格帯（ライト5〜8万円〜）
4. CTA「URLをご確認いただけますと幸いです」
5. 連絡先
```

### **追客フロー**

```plain text
Day 0:  送付
Day 1:  Vercel アナリティクスでURL開封確認
Day 3:  第1追客（アクセスあり→確認依頼 / なし→再送）
Day 7:  第2追客（別チャネルに切り替え）
Day 14: 最終追客 or 60日後再アプローチ設定
```

### **Notion CRM 主要ステータス**

```plain text
試作生成待ち → 送付済み → アクセスあり → 返信あり
→ 商談中 → 受注 / 不成立 / 60日後再アプローチ
```


---

## **5. Phase 3: 受注・契約・ヒアリング**
> 実行ロードマップ: `new/web_creation_service_phase_03_contract_requirements_JP.md`
### **契約書の必須条項（11条構成）**

| （Notion表 — 元ページで確認） |
| --- |

> **印紙税**: 電子契約（クラウドサイン）を使えば印紙税不要。一人運営には必須。
### **支払いスケジュール**

```plain text
ライト（5〜8万円）: 着手50% → 納品50%
スタンダード以上:  着手50% → 初稿30% → 納品20%
月額保守: クレジットカード自動引き落とし（Stripe）を強く推奨
```

### **ヒアリングシート 主要セクション（9セクション・計47項目）**

```plain text
Section A: 基本情報（店舗名・業種・SNS）
Section B: 現在のWeb状況（サイトあり/なし・不満点）
Section C: 目的・目標（問い合わせ増加・予約・採用など）
Section D: 掲載コンテンツ（ページ構成・写真素材の有無）
Section E: デザイン・イメージ（参考URL必須）
Section F: 技術要件（ドメイン・予約・EC・CMS更新の有無）
Section G: 公開スケジュール
Section H: 保守・運用希望
Section I: 予算・決定権者
```

### **AI要件定義書生成フロー**

```javascript
// ヒアリング回答 → Claude API → 要件定義書 自動生成
const systemPrompt = `
Vue 3開発者がそのまま着手できる要件定義書を生成してください。
曖昧表現を具体的仕様に変換し、不十分な項目は「要確認」フラグを立てる。
予算と要件の整合性をチェックし矛盾があれば指摘する。
`;
// 出力: プロジェクト概要 / ページ構成 / 機能要件 / デザイン要件
//       / スケジュール / 要確認事項（優先度付き） / Vueコンポーネントリスト
```

### **Agent 3 → Agent 4 引き渡し条件（チェックリスト）**

```plain text
開発着手前の必須確認:
[ ] 電子署名完了
[ ] 着手金（50%）入金確認
[ ] ヒアリングシート全必須項目回答済み
[ ] Ambiguity Check「高」優先度がすべて解消
[ ] 写真素材受領済み（またはAI生成代替が合意済み）
[ ] 参考URL 1件以上提出
[ ] 公開目標日合意
[ ] ドメイン方針確定
```

### **よくあるトラブル Top5 と予防策**

| （Notion表 — 元ページで確認） |
| --- |


---

## **6. Phase 4: Vue 3 本開発**
> 実行ロードマップ: `new/web_creation_service_phase_04_vue_development_JP.md`
### **技術スタック**

| （Notion表 — 元ページで確認） |
| --- |

**目標工数: 1サイト 5〜10時間以内**
### **ディレクトリ構成（業種横断テンプレート）**

```plain text
src/
├── components/
│   ├── sections/       # HeroSection / AboutSection / ServicesSection
│   │                   # GallerySection / ReviewsSection / AccessSection
│   │                   # ContactSection
│   ├── layout/         # SiteHeader / SiteFooter
│   └── ui/             # BaseButton / BaseImage / SectionHeading
├── stores/             # siteStore（店舗基本情報）/ contentStore
├── composables/        # useMicroCMS / useSeo / useIntersection
├── types/              # site.ts / microcms.ts
└── pages/              # HomePage / NotFoundPage
```

### **microCMS スキーマ設計（4エンドポイント）**

| （Notion表 — 元ページで確認） |
| --- |

### **AI駆動開発フロー（Cursor使用）**

```plain text
Phase 0（30分）: テンプレートクローン・環境変数設定・ブランドカラー設定
Phase 1（30分）: microCMS スキーマ作成・テストデータ3〜5件入力
Phase 2（2〜3時間）: Cursor でセクションコンポーネントを順番に生成
                     Hero → Services → About → Reviews → Gallery → Access → Contact → Footer
Phase 3（1時間）: CMS データ統合・ローディング/エラー状態確認
Phase 4（1〜2時間）: SEO設定・パフォーマンス確認・フォームテスト
```

### **Cursor プロンプトパターン（セクション生成用）**

```plain text
Vue 3 + TypeScript + Tailwind CSS で {ComponentName}.vue を作成してください。
- Composition API（<script setup>）使用
- Props: {propsDefinition}
- スマホファースト（モバイル縦1列、md:以上でグリッド）
- Intersection Observer でビューポートに入ったらフェードイン
- 主色: {primaryColor}（tailwind.config.ts に設定済み）
- BaseImage.vue / SectionHeading.vue を使用
```

### **コンテンツ生成プロンプト（ヒアリング → コピー）**

```plain text
業種: {industry} / 強み: {strengths} / ターゲット: {targetCustomer}
↓ Claude API（temperature: 0.7）
出力JSON: hero.headline（20文字以内）/ about.body（200〜300文字）
          services配列 / footer.tagline
制約: 誇大表現禁止・専門用語を使わない・ターゲットが共感できる表現
```

### **パフォーマンス・SEO実装チェックリスト**

```plain text
Core Web Vitals:
[ ] LCP: HeroImageに fetchpriority="high" + loading="eager" + WebP変換
[ ] CLS: 全img要素に width/height を明示
[ ] INP: フォーム送信を非同期化・重い処理を requestIdleCallback へ

SEO:
[ ] @vueuse/head でOGP・メタタグを動的設定
[ ] LocalBusiness 構造化データ（JSON-LD）を App.vue に追加
[ ] Vue Router で動的インポートによるコード分割
[ ] Vite manualChunks でベンダーバンドル分離

アクセシビリティ:
[ ] カラーコントラスト比 4.5:1 以上（text-gray-600以上を使用）
[ ] フォーカスリング: focus:ring-2 focus:ring-primary で統一
[ ] h1が1つのみ・見出し階層が飛び番なし
[ ] 全入力フィールドに <label> が関連付けられている
[ ] prefers-reduced-motion に対応
```


---

## **7. Phase 5: デプロイ・納品・QA**
> 実行ロードマップ: `new/web_creation_service_phase_05_deploy_delivery_qa_JP.md`
### **CI/CDパイプライン設計**

```plain text
feature/* → develop（Preview URL）
         → staging（顧客確認URL）
         → main（本番 + カスタムドメイン）

Vercel が GitHub 連携で自動デプロイ
Cloudflare DNS → Vercel の順で設定
```

### **デプロイ手順（ステップバイステップ）**

```bash
# 1. GitHub リポジトリ作成
gh repo create gora-[client-name]-website --private --source=. --push

# 2. Vercel 連携
vercel                    # プロジェクト作成
vercel --prod             # 本番デプロイ

# 3. 環境変数設定（シークレット管理）
vercel env add VITE_MICROCMS_API_KEY production
vercel env add VITE_MICROCMS_SERVICE_DOMAIN production

# 4. Cloudflare DNS 設定
# CNAME: www → cname.vercel-dns.com（プロキシ: オフ）
# A: @ → 76.76.21.21（プロキシ: オフ）
# ※Cloudflare プロキシ（オレンジ雲）はオフ必須。オンにするとSSL証明書発行失敗。
```

### **QAチェックリスト（全項目）**

```plain text
ビルド・デプロイ:
[ ] npm run build がエラーなく完了
[ ] Vercel デプロイステータスが "Ready"
[ ] 本番URL が正常表示・SPA ルーティング動作

パフォーマンス目標:
  Performance: 90+（最低80）
  Accessibility: 95+（最低90）
  Best Practices: 95+
  SEO: 100（最低95）

SEO:
[ ] title / meta description / OGP / Twitter Card 全ページ設定
[ ] canonical タグ設定
[ ] robots.txt / sitemap.xml 配置
[ ] Google Search Console 登録・サイトマップ送信
[ ] 構造化データ（LocalBusiness JSON-LD）設定

セキュリティ:
[ ] HTTP→HTTPS リダイレクト動作
[ ] セキュリティヘッダー設定（vercel.json）
[ ] npm audit: Critical/High 脆弱性ゼロ
[ ] .env がGitにコミットされていないこと
[ ] SecurityHeaders.com: Grade A 以上

クロスブラウザ:
[ ] Chrome / Safari(Mac+iOS) / Firefox / Chrome(Android)
[ ] 375px / 768px / 1280px のレスポンシブ確認
```

### **Lighthouse CI 自動化（GitHub Actions）**

```yaml
# .github/workflows/lighthouse-ci.yml
on:
  push:
    branches: [staging, main]
  pull_request:
    branches: [staging, main]
# 目標未達の場合はPRのマージをブロック
# Performance < 80 / Accessibility < 90 / SEO < 95 → エラー
```

### **顧客向けマニュアル自動生成（Claude API）**

```javascript
// scripts/generate_manual.js
// ヒアリング情報（店舗名・業種・ITリテラシー・CMSコンテンツ一覧）を入力
// → Claude API（claude-opus-4-5 / max_tokens: 4096）
// → 店舗名・担当者名入りのmicroCMS更新マニュアルを Markdown で生成
// → Pandoc で PDF 変換して納品
// コスト: 約$0.05〜$0.10/件
```

### **納品物チェックリスト**

```plain text
技術的納品物:
[ ] 本番URL（https://www.example.com）
[ ] microCMS 管理画面ログイン情報
[ ] Google Search Console 設定完了
[ ] Google Analytics 設置確認

ドキュメント:
[ ] microCMS更新マニュアル（PDF）
[ ] サイト構成説明書（1枚）
[ ] 保守サービス内容説明書
[ ] 緊急連絡先カード

引き渡しデモ（60〜90分）:
[ ] 本番サイト各ページ確認
[ ] microCMS ハンズオン（記事更新・画像アップロード）
[ ] パスワード変更サポート
[ ] 保守サービス案内・Q&A
```


---

## **8. Phase 6: 保守・継続収益・成長**
> 実行ロードマップ: `new/web_creation_service_phase_06_maintenance_growth_JP.md`
### **月額保守プラン詳細**

| （Notion表 — 元ページで確認） |
| --- |

**保守自動化により20件でも月10〜15時間で管理可能**
### **保守作業の自動化設計**

```plain text
【完全自動】
  - Dependabot: 依存関係の週次チェック・マイナー/パッチは自動マージ
  - GitHub Actions: 自動デプロイ（mainへのマージで即反映）
  - UptimeRobot: 5分間隔死活監視・障害時メール/LINE通知
  - GA4 Data API: 毎月1日 AM9:00 に全顧客データ自動取得

【半自動（確認のみ手動）】
  - Dependabotのメジャーバージョンアップのレビュー（月1〜2回）
  - 月次レポートへのコメント追記・送付確認
  - アップセル提案メール送付（テンプレート流用）

【手動】
  - コンテンツ更新代行
  - 小規模レイアウト修正
  - 技術的なトラブル対応
```

### **月次レポート自動生成（Claude API）**

```javascript
// GA4 Data API でセッション数・問い合わせ数・流入チャネルを取得
// → Claude API に渡してコメント自動生成（200〜300文字）
const prompt = `
今月は${gaData.sessions}名のお客様が訪問（先月比 ${gaData.sessionsDiff}%）...
構成: 総評（2〜3文）/ 注目数値の解説 / 来月へのアドバイス / さりげないアップセル提案
文体: 丁寧・親しみやすい / 数値を物語に変換 / 1案のみ提示
`;
// GitHub Actions cron で毎月1日 AM9:00 に全顧客へ自動送付
```

### **アップセルロードマップ**

```plain text
公開直後（0〜3ヶ月）:
  └→ 保守プランのアップグレード（ライト → スタンダード）

3〜6ヶ月目（セッション300以上・問い合わせ少ない場合）:
  └→ Step 1: SEO強化パッケージ
     - ブログ/お知らせ機能追加（microCMS）
     - SEOコンテンツ月2〜4記事（Claude API活用）
     - 初期30,000〜50,000円 + 月額10,000〜20,000円

6〜12ヶ月目（問い合わせ安定・モバイル比率70%以上）:
  └→ Step 2: 予約システム連携
     - Googleカレンダー連携予約・STORES予約
     - 初期30,000〜80,000円 + 月額3,000〜5,000円

12ヶ月目以降（EC化・インバウンド）:
  └→ Step 3: EC機能 / Step 4: 多言語対応
```

### **解約防止設計**

```plain text
危険シグナル（月次確認）:
  □ 2ヶ月連続でセッション数が10%以上減少
  □ 問い合わせが3ヶ月連続ゼロ
  □ レポートへの反応が2ヶ月以上ない

対応:
  □ 危険シグナル検知 → 翌月レポートで電話相談を提案
  □ 「サイト現状診断（無料）」を提案し改善案を作成
  □ 月次レポートに「推定広告換算価値」を掲載し価値を見える化
```

### **KPIダッシュボード（Notion）**

| （Notion表 — 元ページで確認） |
| --- |


---

## **9. 収益シミュレーション**
### **収益積み上げシミュレーション（月別）**

| （Notion表 — 元ページで確認） |
| --- |

> 前提: 解約率 5%/月、アップセル率 20%/年
### **月収30万円の達成構成（6〜9ヶ月目）**

```plain text
保守19件 × 平均7,000円 = 133,000円/月
制作2〜3件 × 平均60,000円 = 120,000〜180,000円/月
合計: 約25〜32万円/月
```

### **SaaS移行トリガー条件**

```plain text
定量トリガー:
  □ 保守件数が50件を超えた
  □ MRRが月100万円を超えた
  □ 保守作業に月40時間以上かかるようになった
  □ 同一業種の案件が10件以上（テンプレート再利用性が高い）

移行シナリオ:
  A: 既存SaaS活用（Studio/Wix + Stripe）→ 低コスト・即時展開
  B: 自社マルチテナントSaaS（Vue 3 + Nuxt 3 + Supabase）→ 高LTV
  C: ホワイトラベル（同業フリーランサーにライセンス販売）→ 水平展開
```


---

## **10. 全体タイムライン**

```plain text
Week 1〜2: 環境構築
  - Google Maps API / Vercel / GitHub アカウント設定
  - Cursor + Claude API 設定
  - スクリーニングスクリプト作成（AI補助）
  - prototype-template リポジトリ作成

Week 3〜4: パイロット営業（10件）
  - スクリーニングで10店舗選定
  - 試作サイト10件自動生成・デプロイ
  - 営業メール/DM 送付
  - 反応計測・A/Bテスト開始

Month 2: 最初の受注〜納品
  - 1〜2件受注を目標
  - 本開発フロー（Phase 3〜5）の実行・確立
  - テンプレートライブラリを業種別に拡充
  - 保守自動化（Dependabot・月次レポート）の設定

Month 3〜6: 量産・改善
  - 営業自動化の精度向上
  - アップセル戦略の初実行
  - 月5〜10万円の保守収益を目指す

Month 7〜12: 成長期
  - 保守20件以上を目指し MRR 20万円超へ
  - 制作と保守の比率を最適化
  - SaaS移行計画の検討開始
```


---

## **11. ツールスタック・コストまとめ**
### **技術スタック**

| （Notion表 — 元ページで確認） |
| --- |

### **月次コスト試算**

| （Notion表 — 元ページで確認） |
| --- |


---

## **注意事項・リスク管理**

| （Notion表 — 元ページで確認） |
| --- |


---

## **関連ドキュメント**

| （Notion表 — 元ページで確認） |
| --- |


## 子ページ（運用ロードマップ）

- [Web制作サービス Phase 1 ロードマップ_JP](./phase-01-lead-scout.md)
- [Web制作サービス Phase 2 営業・試作提案ロードマップ](./phase-02-sales-strategy.md)
- [Web制作サービス Phase 3 ロードマップ — 契約・要件定義運用版](./phase-03-contract-requirements.md)
- [Web制作サービス Phase 4: Vue開発ロードマップ](./phase-04-vue-development.md)
- [Web制作サービス Phase 5 ロードマップ（デプロイ・納品・QA）_JP](./phase-05-deploy-delivery-qa.md)
- [Web制作サービス Phase 6 ロードマップ: 保守・継続収益・成長](./phase-06-maintenance-growth.md)
