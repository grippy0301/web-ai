# 

> 作成日: 2026-05-21
> 
> 
> バージョン: 2.0（6専門エージェント × 3ラウンドブラッシュアップ 統合版）
> 
> 運営形態: 一人（副業〜個人事業） / 技術: Vue 3 + Cursor + Codex/Claude API
> 
> 収益モデル: 制作費一括 ＋ 月額保守費
> 

---

## **目次**

1. [全体フローと設計思想](#1-全体フロー)
2. [エージェントシステム設計](#2-エージェントシステム設計)
3. [Phase 1: リード発掘・スクリーニング](#3-phase-1-リード発掘スクリーニング)
4. [Phase 2: 営業・試作サイト提案](#4-phase-2-営業試作サイト提案)
5. [Phase 3: 受注・契約・ヒアリング](#5-phase-3-受注契約ヒアリング)
6. [Phase 4: Vue 3 本開発](#6-phase-4-vue-3-本開発)
7. [Phase 5: デプロイ・納品・QA](#7-phase-5-デプロイ納品qa)
8. [Phase 6: 保守・継続収益・成長](#8-phase-6-保守継続収益成長)
9. [収益シミュレーション](#9-収益シミュレーション)
10. [全体タイムライン](#10-全体タイムライン)
11. [ツールスタック・コストまとめ](#11-ツールスタックコストまとめ)

---

## **1. 全体フロー**

```
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

| プラン | 制作費（税抜） | 月額保守（税抜） | ページ数 | 標準納期 |
| --- | --- | --- | --- | --- |
| ライト | 5〜8万円 | 3,000〜5,000円 | LP1枚 | 2〜3週間 |
| スタンダード | 10〜18万円 | 8,000〜12,000円 | 3〜8ページ | 4〜6週間 |
| プレミアム | 20〜35万円 | 15,000〜30,000円 | 10ページ以上+機能 | 6〜10週間 |

---

## **2. エージェントシステム設計**

本ロードマップは6つの専門エージェントが各フェーズを担当し、すべての出力が次のエージェントへ引き渡される設計になっている。各エージェントは3ラウンドのブラッシュアップを経た確定仕様を持つ。

```
Orchestrator（本ドキュメント）
├── Agent 1: lead-scout       → 01_lead_scout.md
├── Agent 2: sales-strategist → 02_sales_strategist.md
├── Agent 3: contract-advisor → 03_contract_advisor.md
├── Agent 4: vue-architect    → 04_vue_architect.md
├── Agent 5: deploy-ops       → 05_deploy_ops.md
└── Agent 6: growth-manager   → 06_growth_manager.md
```

**エージェント間のデータフロー:**

```
Agent 1 → leads_YYYYMMDD_priority.json
  └→ Agent 2 → handoff_agent3_{lead_id}.json
       └→ Agent 3 → requirements_{project_id}.json
            └→ Agent 4 → dist/ + Lighthouse レポート
                 └→ Agent 5 → delivery_{client_id}.json
                      └→ Agent 6 → 月次保守管理台帳
```

### **Phase別の実行ロードマップ**

各Phaseには、全体版から切り出した「運用ロードマップ」と、専門エージェントが深掘りした「詳細仕様」の2系統を用意した。まずは実行ロードマップを読み、必要な箇所だけ詳細仕様を参照する運用を想定する。

| Phase | 実行ロードマップ | 専門仕様 |
| --- | --- | --- |
| Phase 1 | `new/web_creation_service_phase_01_lead_scout_JP.md` | `new/agents/01_lead_scout.md` |
| Phase 2 | `new/web_creation_service_phase_02_sales_strategy_JP.md` | `new/agents/02_sales_strategist.md` |
| Phase 3 | `new/web_creation_service_phase_03_contract_requirements_JP.md` | `new/agents/03_contract_advisor.md` |
| Phase 4 | `new/web_creation_service_phase_04_vue_development_JP.md` | `new/agents/04_vue_architect.md` |
| Phase 5 | `new/web_creation_service_phase_05_deploy_delivery_qa_JP.md` | `new/agents/05_deploy_ops.md` |
| Phase 6 | `new/web_creation_service_phase_06_maintenance_growth_JP.md` | `new/agents/06_growth_manager.md` |

---

## **3. Phase 1: リード発掘・スクリーニング**

> 実行ロードマップ: `new/web_creation_service_phase_01_lead_scout_JP.md`
> 
> 
> 専門仕様: `new/agents/01_lead_scout.md`
> 

### **目標KPI**

| 指標 | 目標値 |
| --- | --- |
| 月間抽出リード | 30〜50件 |
| 優先リード（A判定） | 10〜30件/月 |
| スクリプト手動作業時間 | 15分/回 以内 |
| APIコスト | $0（$200無料枠内） |

### **スクリーニング条件**

```
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

| API | エンドポイント | 用途 | コスト |
| --- | --- | --- | --- |
| Google Maps Places API（旧版） | `nearbysearch` / `textsearch` | 店舗リスト取得 | $200無料枠内 |
| Place Details | `place/details` | website/phone 取得 | 同上 |
| PageSpeed Insights API | `pagespeedonline/v5` | モバイルスコア計測 | 無料 |
| Wayback Machine API | `archive.org/wayback` | 最終更新日推定 | 無料 |

> **重要制約**: `website` フィールドは Nearby Search に含まれない。Place Details の個別呼び出しが必須。次ページ取得時は 2.5 秒以上の待機が必要。
> 

### **スクリーニングスクリプト構成**

```
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

```tsx
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

```
週1回（月曜朝・所要15分）:
  7:00  $ node src/index.js → leads_YYYYMMDD.csv 生成
  7:20  Notion DBにインポート・廃業店を目視除去
  7:30  Agent 2（sales-strategist）へAグレードリストを共有
```

---

## **4. Phase 2: 営業・試作サイト提案**

> 実行ロードマップ: `new/web_creation_service_phase_02_sales_strategy_JP.md`
> 
> 
> 専門仕様: `new/agents/02_sales_strategist.md`
> 

### **試作サイト自動生成フロー**

```
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

```jsx
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

```
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

| チャネル | 反応率目安 | 1日上限 | 最適タイミング |
| --- | --- | --- | --- |
| Instagram DM | 10〜20% | 20件 | Instagramアカウントがある場合 |
| メール | 5〜12% | 30件 | 火〜木 10:00〜11:00 |
| 電話 | 25〜40% | - | 飲食店 14:00〜17:00 |
| Googleフォーム | 3〜8% | - | 上記が使えない場合 |

### **営業メールテンプレート（AIが生成するプロンプト構成）**

```
件名: 【試作サイト作成済み】${store.name}様のウェブサイトをご覧ください

本文構成:
1. 自己紹介（1文）
2. 試作URL（デプロイ済み）
3. プランと価格帯（ライト5〜8万円〜）
4. CTA「URLをご確認いただけますと幸いです」
5. 連絡先
```

### **追客フロー**

```
Day 0:  送付
Day 1:  Vercel アナリティクスでURL開封確認
Day 3:  第1追客（アクセスあり→確認依頼 / なし→再送）
Day 7:  第2追客（別チャネルに切り替え）
Day 14: 最終追客 or 60日後再アプローチ設定
```

### **Notion CRM 主要ステータス**

```
試作生成待ち → 送付済み → アクセスあり → 返信あり
→ 商談中 → 受注 / 不成立 / 60日後再アプローチ
```

---

## **5. Phase 3: 受注・契約・ヒアリング**

> 実行ロードマップ: `new/web_creation_service_phase_03_contract_requirements_JP.md`
> 
> 
> 専門仕様: `new/agents/03_contract_advisor.md`
> 

### **契約書の必須条項（11条構成）**

| 条項 | 内容 | 実務上の最重要ポイント |
| --- | --- | --- |
| 第2条 制作仕様 | 別紙要件定義書に限定 | 要件定義書外は追加費用発生と明記 |
| 第3条 支払条件 | 着手50% / 初稿30% / 納品20% | 前払い受取前に着手しない（鉄則） |
| 第4条 月額保守 | 1ヶ月前予告で解約 | Stripe 自動引き落とし推奨 |
| 第5条 納期 | 確認遅延分は納期後ろ倒し / 7日返答なし→承認とみなす | 無限待ち問題を防ぐ |
| 第6条 修正対応 | デザイン確認2回 / テキスト修正3回まで無償 | 構成変更は1件15,000円〜別途 |
| 第7条 著作権 | 制作費全額支払い後に譲渡 | 未払い時の著作権保持が最大の保護 |
| 第8条 免責 | 検索順位・第三者サービス障害は保証しない | 損害賠償上限 = 支払済み制作費 |
| 第10条 解除 | 支払い30日遅延 / ハラスメント等で即時解除可 | 解除理由を具体的に列挙 |

> **印紙税**: 電子契約（クラウドサイン）を使えば印紙税不要。一人運営には必須。
> 

### **支払いスケジュール**

```
ライト（5〜8万円）: 着手50% → 納品50%
スタンダード以上:  着手50% → 初稿30% → 納品20%
月額保守: クレジットカード自動引き落とし（Stripe）を強く推奨
```

### **ヒアリングシート 主要セクション（9セクション・計47項目）**

```
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

```jsx
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

```
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

| トラブル | 予防策 |
| --- | --- |
| 「イメージと違う」クレーム | 初稿前にデザインカンプで方向性合意・参考URL必須化 |
| 際限ない追加要求 | 契約書第2条に「要件定義書外は対象外」と明記 |
| 支払い遅延・不払い | 前払い50%後に着手 + Stripeで自動引き落とし |
| 「サイトが壊れた」クレーム | 第8条に第三者サービス障害の免責を明記 |
| 解約時の引き継ぎトラブル | GitHubリポジトリを顧客アカウント所有にしておく |

---

## **6. Phase 4: Vue 3 本開発**

> 実行ロードマップ: `new/web_creation_service_phase_04_vue_development_JP.md`
> 
> 
> 専門仕様: `new/agents/04_vue_architect.md`
> 

### **技術スタック**

| カテゴリ | 採用技術 |
| --- | --- |
| UIフレームワーク | Vue 3 (Composition API) + TypeScript |
| ビルドツール | Vite |
| スタイリング | Tailwind CSS |
| 状態管理 | Pinia |
| CMS | microCMS |
| SEO | @vueuse/head |
| AI開発環境 | Cursor + Codex/Claude API |

**目標工数: 1サイト 5〜10時間以内**

### **ディレクトリ構成（業種横断テンプレート）**

```
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

| エンドポイント | 種別 | 主なフィールド |
| --- | --- | --- |
| `site-info` | シングル | businessName / catchCopy / heroImage / businessHours |
| `services` | リスト | title / description / price / badge |
| `gallery` | リスト | image / alt / category |
| `reviews` | リスト | authorName / rating / body |

### **AI駆動開発フロー（Cursor使用）**

```
Phase 0（30分）: テンプレートクローン・環境変数設定・ブランドカラー設定
Phase 1（30分）: microCMS スキーマ作成・テストデータ3〜5件入力
Phase 2（2〜3時間）: Cursor でセクションコンポーネントを順番に生成
                     Hero → Services → About → Reviews → Gallery → Access → Contact → Footer
Phase 3（1時間）: CMS データ統合・ローディング/エラー状態確認
Phase 4（1〜2時間）: SEO設定・パフォーマンス確認・フォームテスト
```

### **Cursor プロンプトパターン（セクション生成用）**

```
Vue 3 + TypeScript + Tailwind CSS で {ComponentName}.vue を作成してください。
- Composition API（<script setup>）使用
- Props: {propsDefinition}
- スマホファースト（モバイル縦1列、md:以上でグリッド）
- Intersection Observer でビューポートに入ったらフェードイン
- 主色: {primaryColor}（tailwind.config.ts に設定済み）
- BaseImage.vue / SectionHeading.vue を使用
```

### **コンテンツ生成プロンプト（ヒアリング → コピー）**

```
業種: {industry} / 強み: {strengths} / ターゲット: {targetCustomer}
↓ Claude API（temperature: 0.7）
出力JSON: hero.headline（20文字以内）/ about.body（200〜300文字）
          services配列 / footer.tagline
制約: 誇大表現禁止・専門用語を使わない・ターゲットが共感できる表現
```

### **パフォーマンス・SEO実装チェックリスト**

```
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
> 
> 
> 専門仕様: `new/agents/05_deploy_ops.md`
> 

### **CI/CDパイプライン設計**

```
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

```
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

```jsx
// scripts/generate_manual.js
// ヒアリング情報（店舗名・業種・ITリテラシー・CMSコンテンツ一覧）を入力
// → Claude API（claude-opus-4-5 / max_tokens: 4096）
// → 店舗名・担当者名入りのmicroCMS更新マニュアルを Markdown で生成
// → Pandoc で PDF 変換して納品
// コスト: 約$0.05〜$0.10/件
```

### **納品物チェックリスト**

```
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
> 
> 
> 専門仕様: `new/agents/06_growth_manager.md`
> 

### **月額保守プラン詳細**

| プラン | 月額 | 実作業時間 | 時給換算 |
| --- | --- | --- | --- |
| ライト | 3,000〜5,000円 | 15〜20分/月 | 約12,000〜16,000円/時 |
| スタンダード | 8,000〜12,000円 | 30〜45分/月 | 約13,000〜20,000円/時 |
| プレミアム | 15,000〜30,000円 | 60〜90分/月 | 約13,000〜20,000円/時 |

**保守自動化により20件でも月10〜15時間で管理可能**

### **保守作業の自動化設計**

```
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

```jsx
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

```
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

```
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

| KPI | 目標（初期） | 目標（成熟期） |
| --- | --- | --- |
| 新規受注件数 | 2件/月 | 4件/月 |
| MRR（月次経常収益） | 10万円 | 50万円 |
| ARPU（顧客単価） | 8,000円 | 15,000円 |
| Churn Rate（解約率） | < 5% | < 3% |
| LTV | 12ヶ月 × ARPU | 24ヶ月 × ARPU |
| 保守作業時間/件 | < 1h | < 30min |

---

## **9. 収益シミュレーション**

### **収益積み上げシミュレーション（月別）**

| 月 | 新規受注 | 累計保守件数 | MRR | 制作収益 | 月収目安 |
| --- | --- | --- | --- | --- | --- |
| 1ヶ月目 | 1件 | 1件 | 10,000円 | 100,000円 | 110,000円 |
| 3ヶ月目 | 2件 | 5件 | 50,000円 | 150,000円 | 200,000円 |
| 6ヶ月目 | 2件 | 11件 | 110,000円 | 150,000円 | 260,000円 |
| 9ヶ月目 | 3件 | 19件 | 190,000円 | 200,000円 | 390,000円 |
| 12ヶ月目 | 3件 | 26件 | 280,000円 ※アップセル込 | 250,000円 | 530,000円 |
| 18ヶ月目 | 3件 | 38件 | 430,000円 | 300,000円 | 730,000円 |
| 24ヶ月目 | 4件 | 50件 | 600,000円 ※SaaS検討 | 350,000円 | 950,000円 |

> 前提: 解約率 5%/月、アップセル率 20%/年
> 

### **月収30万円の達成構成（6〜9ヶ月目）**

```
保守19件 × 平均7,000円 = 133,000円/月
制作2〜3件 × 平均60,000円 = 120,000〜180,000円/月
合計: 約25〜32万円/月
```

### **SaaS移行トリガー条件**

```
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

```
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

| カテゴリ | ツール | 選定理由 |
| --- | --- | --- |
| リード発掘 | Google Maps Places API + Node.js | 月$200無料枠内で完結 |
| AI開発環境 | Cursor Pro + Claude API / Codex API | 開発速度の最大化 |
| フロントエンド | Vue 3 + Vite + TypeScript + Tailwind CSS | 業種横断テンプレートの汎用性 |
| CMS | microCMS | 日本語サポート充実・店舗スタッフでも使いやすい |
| デプロイ | Vercel | GitHub連携・無料枠が充実 |
| DNS/CDN | Cloudflare | SSL自動更新・無料プランで十分 |
| フォーム | Formspree | バックエンドなしで問い合わせフォームを実装 |
| 分析 | Google Analytics 4 | 無料・GA4 Data APIで自動レポート連携 |
| 監視 | UptimeRobot | 50件まで無料で死活監視 |
| 顧客管理 | Notion | CRM・KPI・プロジェクト管理を一元化 |
| 請求管理 | Misoca / freee | 日本の請求書・確定申告に最適化 |
| 電子契約 | クラウドサイン | 印紙税不要・無料プランで開始可能 |

### **月次コスト試算**

| 項目 | 費用 |
| --- | --- |
| Google Maps API | $0（$200無料枠内） |
| Claude API（試作生成・レポート生成） | 5,000〜15,000円 |
| Vercel Pro（複数本番サイト管理） | 約2,000円 |
| Cursor Pro | 約2,800円 |
| Notion Personal Pro | 約1,600円 |
| Misoca / freee（スターター） | 約1,000〜3,000円 |
| UptimeRobot | 0円（無料枠） |
| **合計** | **約12,000〜25,000円/月** |

---

## **注意事項・リスク管理**

| リスク | 対策 |
| --- | --- |
| Google Maps API 利用規約 | 正規API使用・30日以内のデータ利用・スクレイピング不使用 |
| 試作サイトの写真著作権 | Google Maps 写真は試作のみに限定。本番は顧客提供素材に差し替え |
| 営業メールのスパム判定 | 1日送付数を制限（メール30件/日、DM20件/日）・パーソナライズ徹底 |
| 顧客の不払い | 着手金50%受取後に着手・著作権は全額支払い後に移転 |
| 保守業務の肥大化 | 自動化を徹底・20件で15時間以内に収まるよう設計 |
| 第三者サービス障害 | 契約書第8条に免責を明記・UptimeRobotで即時検知 |

---

## **関連ドキュメント**

| ファイル | 内容 |
| --- | --- |
| `new/agents/agent_system_design.md` | エージェントシステム設計書 |
| `new/web_creation_service_phase_01_lead_scout_JP.md` | Phase 1 実行ロードマップ |
| `new/agents/01_lead_scout.md` | リード発掘・スクリーニング詳細仕様 |
| `new/web_creation_service_phase_02_sales_strategy_JP.md` | Phase 2 実行ロードマップ |
| `new/agents/02_sales_strategist.md` | 営業・試作サイト生成詳細仕様 |
| `new/web_creation_service_phase_03_contract_requirements_JP.md` | Phase 3 実行ロードマップ |
| `new/agents/03_contract_advisor.md` | 受注・契約・ヒアリング詳細仕様 |
| `new/web_creation_service_phase_04_vue_development_JP.md` | Phase 4 実行ロードマップ |
| `new/agents/04_vue_architect.md` | Vue 3 開発詳細仕様 |
| `new/web_creation_service_phase_05_deploy_delivery_qa_JP.md` | Phase 5 実行ロードマップ |
| `new/agents/05_deploy_ops.md` | デプロイ・納品・QA詳細仕様 |
| `new/web_creation_service_phase_06_maintenance_growth_JP.md` | Phase 6 実行ロードマップ |
| `new/agents/06_growth_manager.md` | 保守・継続収益・成長詳細仕様 |

[**Web制作サービス Phase 1 ロードマップ_JP**](https://www.notion.so/Web-Phase-1-_JP-367089a9cb07804e9256c8d6f7b0ecb1?pvs=21)

# **Web制作サービス Phase 1 ロードマップ_JP**

[**Web制作サービス Phase 2 営業・試作提案ロードマップ**](https://www.notion.so/Web-Phase-2-367089a9cb0780749085cbc1d76283a4?pvs=21)

[**Web制作サービス Phase 3 ロードマップ — 契約・要件定義運用版**](https://www.notion.so/Web-Phase-3-367089a9cb07807f8ee4fc2b09790310?pvs=21)

[**Web制作サービス Phase 4: Vue開発ロードマップ**](https://www.notion.so/Web-Phase-4-Vue-367089a9cb07807daab2e37d3a33a7a9?pvs=21)

# **Web制作サービス Phase 4: Vue開発ロードマップ**

[**Web制作サービス Phase 5 ロードマップ（デプロイ・納品・QA）_JP**](https://www.notion.so/Web-Phase-5-QA-_JP-367089a9cb07802bb88af27eae1e7b1b?pvs=21)

[**Web制作サービス Phase 6 ロードマップ: 保守・継続収益・成長**](https://www.notion.so/Web-Phase-6-367089a9cb0780c692c5d90528c71949?pvs=21)