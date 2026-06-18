# Waitlist copy migration log

Per the v2 dynamic-staging spec (§2, §7) every copy move to the latest brand
resources is logged here with **date · what changed · source page**. Brand
single-sources: [언어 전략] (register), [브랜드 포지셔닝 §5] (message house / cold copy),
[브랜드 페르소나] (voice/tone), [용어집] (term definitions).

[언어 전략]: https://app.notion.com/p/d78d52c74af240259fd8922533dda03a
[브랜드 포지셔닝 §5]: https://app.notion.com/p/c44b8643c5824b2487628163133778ab
[브랜드 페르소나]: https://app.notion.com/p/cdd7c71bca5948778f7d5bd31c6a06e8
[용어집]: https://app.notion.com/p/35f338c1445180c0b38de195b4c5e6db

---

## 2026-06-18 — Redesign to a "living" page (go beyond v2)

Stack + waitlist DB reused unchanged (SvelteKit/Notion/Resend/Upstash; `/api/waitlist`

- survey, validation, feature gates). IA / layout / visuals / motion / copy redesigned.
  New IA: Hero → Empathy bridge → **3-Mon Interactive Demo** → How-it-works → Mos →
  **Growth-loop differentiation (new)** → Trust + re-CTA → **Build/recruit band (new)** → Confirmation.

| Item                 | Change                                                                                                                                                                                                  | Source / rationale                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero tagline/slogan  | Kept cold/general register — "쓸수록 손발 맞는 내 AI 조력자" / "자잘한 일은 맡기고, 중요한 것에 집중하세요."                                                                                            | 브랜드 포지셔닝 §5.1 (cold register, R1–R7 validated)                                                                                                               |
| Hero anchor (new)    | Added "리서치하고, 정리하고, 문서 만드는 사람을 위한 내 AI예요."                                                                                                                                        | 5-sec category clarity; 사용자 페르소나 ① Goal-First Operator beachhead                                                                                             |
| Interactive demo     | Rebuilt around the **three sample Mons** (research/organize/design) with real art; one goal decomposes → assembles into one result. Helpers labeled by function (리서치/정리/구성).                     | User instruction (3 Mons blend); 디자인 시스템 character set; v2 §6②                                                                                                |
| "Mon" naming         | Demo no longer names Mon (helpers = "전문가"); **Mon introduced once in the Mos section**, subordinate to Mos.                                                                                          | 언어 전략 §3 (1 worldview term/screen, first-use gloss) + cold-reader R1: Mos/Mon/Mosmos collision                                                                  |
| Growth loop (new)    | Prosumer loop as a differentiation beat: 맡기기 → 쌓이기 → 내 것 되기 → 더 잘 맞게; kicker "쓸수록 내 것이 되는 AI". Reframed away from "share → value returns to you".                                 | 브랜드 포지셔닝 §5.1/§7 + 소개 promise ③ "쓰다가 만들 수 있다". Cold-reader R1 flagged the "value returns" line as MLM-ish; monetization deferred for cold readers. |
| Empathy task chips   | Localized (메일 정리/자료 찾기/표 만들기 ↔ Inbox triage/Finding sources/Making tables) — previously hardcoded Korean, leaked onto the EN page.                                                          | Cold-reader R1 (EN): untranslated Korean = trust ding                                                                                                               |
| Recruit band (new)   | Secondary, purple/outline band → team/specialist/investor Notion page; placed after the re-CTA so it reaches end-of-page, higher-intent readers without competing with the single primary waitlist CTA. | User instruction (2026-06-18) + Corey Haines single-primary-CTA                                                                                                     |
| Global rules honored | No launch-date promises ("준비되면 가장 먼저"); consent double-block kept; n=45 / registrant count gated; no fabricated proof.                                                                          | 구현 지침서 global rules §; features.ts gates                                                                                                                       |

### Cold-reader verification (sub-agent, zero universe context)

- **Round 1** (KO+EN): core 5-sec value understood ✓. Issues → fixed: EN Korean leak, Mos/Mon hierarchy, growth-loop "value returns" vagueness, awkward EN demo headline.
- **Round 2** (KO+EN): EN confirms "non-English text: none"; MLM concern gone; 5-sec passes; clarity 3/5. Residual ("show live product proof") is inherent to a pre-launch waitlist — the interactive demo is the intended show-don't-tell; founder note carries trust (no fabricated proof per brand rules).
- **Round 3** (recruit band): primary waitlist action stays clear; recruit band distraction ≈2/5 and reads as "early but serious" (mild trust lift), not scatter.

## 2026-06-18 (session 2) — cold-reader re-verification + strategy pivot

Re-ran the cold-reader gate (Notion CMO/CDO/CSO lenses re-captured first) across **5 rounds /
10 zero-context reads (KO+EN)**. Baseline reproduced clarity 3/3, signup 2/2, 3 neologism stumbles.

| Item          | Change                                                                                                                                     | Source / rationale                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Mon" naming  | **Removed the word "Mon" from all cold copy.** Mos kept as the single glossed teaser; the three Mon _images_ stay (labeled by function).   | 언어 전략 §6 (waitlist = ONE teaser term) + cold-reader R1/R2: "Mos/Mon look like a typo"; §7.1 protocol "stuck on a coinage → reinforce general register". |
| Helpers = AI  | "전문가" → "**전문 AI**" / "specialist AIs" everywhere.                                                                                    | Cold readers read bare "전문가/specialists" as _humans_; brand Mon = 실행 전문가(AI).                                                                       |
| Hero sub      | Benefit-contrast: "보통 AI는 초안까지예요. 여기선 …바로 쓸 수 있는 결과까지" / "Most AI stops at a draft…".                                | CSO differentiation (목표→결과 실행, not answer-quality); answers cold-reader "how is this different from ChatGPT".                                         |
| How-it-works  | **Section removed** (pure restatement of the demo).                                                                                        | Cold readers R2–R5: "promise repeated ~4×, stopped trusting it." `how_*` keys + component deleted.                                                          |
| Demo close    | Cut the gushing "딱 이거예요. 고마워요!" / "Exactly what I needed — thank you!"; ends on the assembled result + a product-affordance line. | Cold readers' #1 "reads like marketing fiction / scripted."                                                                                                 |
| Growth loop   | Reframed asset/share/ownership → **learning loop** (숙련); dropped "원하면 다른 사람과 나눌 수도" / "You can even share what you make".    | Brand: defer monetization/asset framing on cold (MLM-adjacent); CMO R1–R7.                                                                                  |
| Mos vs Mosmos | One-line tie: "Mos는 Mosmos가 만든…" / "made by Mosmos". mos_eyebrow frames Mos as a name.                                                 | Cold readers every round: Mos/Mosmos conflated.                                                                                                             |
| Founder sign  | "— honey.hunter · Mosmos 만드는 사람" / "· building Mosmos".                                                                               | EN reader: lowercase handle read as placeholder.                                                                                                            |
| Hero CSS      | `.tagline { word-break: keep-all; text-wrap: balance }`.                                                                                   | Korean H1 was breaking mid-syllable.                                                                                                                        |

### Re-verification matrix + finding

clarity KO/EN · signup KO/EN · stumbles: Base 3/3·2/2·3 → R2 2/3·2/2·4 → R3 2/2·2/2·3 →
**R4 2/3·2/2·3 (best)** → R5 2/2·2/2·3 (concrete-H1 regressed EN, so hero reverted to R4 = brand
tagline + benefit-contrast sub).

**Finding (brand-corroborated):** 5 rounds / 3 distinct strategies did not move the text-only
cold-reader needle. Both readers, every round, converge on **proof-bound blockers copy cannot fix**:
(1) "all claims, zero evidence — SHOW the product"; every verbal claim is one every AI markets, so
none differentiate in a 5-sec _text_ read without shown proof (impossible pre-launch w/o
fabrication — brand forbids). The live **interactive demo** is the intended proof but a text-only
reader can't perceive its motion; real users can. (2) Mos/Mosmos is inherent naming friction.
This reproduces the brand's own R1–R7 conclusion: _"카피 정성은 수렴 — 다음 레버는 증거·데모·정량."_

**Remaining levers (USER decisions, not copy):** (A) a real product screenshot / short demo above
the fold; (B) turn on gated evidence — `registrantCounter` and/or `surveyStatN45` (real n=45 pain
stat), both OFF in `features.ts`; (C) recruit band's "투자자/Investor" framing dents _consumer_
trust (twice-flagged) — kept per explicit user request.

## 2026-06-18 (session 2b — post-feedback revision)

User reviewed the shipped page and gave 8 concrete fixes (no questions). All applied + re-verified (R6).

**Layout bug (root cause).** "텍스트가 이리저리 튀는" — the loop title/eyebrow/lead rendered **on top of the hero** (desktop) and the loop header was **missing on mobile**. Both from ONE bug: `GrowthLoop.svelte` defined a scoped `.center { position:absolute; left/top:50%; transform:translate(-50%,-50%) }` for its ring-centre medallion, which ALSO matched the section header `<div class="section-head center">` (Svelte scopes both with the same hash). The header escaped flow against the viewport onto the hero, and got `display:none` on mobile (`.center{display:none}`). Fix: renamed the medallion class to `.world`. **Gotcha: never name a scoped positioning rule after a utility class (`center`) that co-occurs on another element in the same component.**

**Growth loop — restored to the REAL Grow Loop** (per user + Notion Grow-Loop `697eb2b8…`): 맡기기(소비) → 쌓이기(생산·보관) → 나누기(공유) → 돌아오기(환류), anchored on "내 AI가 자라는 세계." This **reverses last round's learning-loop flattening.** Kept MLM-safe per brand: 나누기 is explicitly optional ("원하면…수도 있어요"); 돌아오기 anchored on accumulation ("쌓인 만큼…"), NOT on sharing — brand reviewer confirmed the share→value-returns read is cleared. Layout redesigned to a 4-corner card ring so the centre Mos+Mon medallion is never occluded (fixes "Mon이 카드에 가려져").

**Demo — corrected mental model** (Notion 공통목표 `b0b338c1…`): NOT "셋이 나눠서," but Mos **selects** the right 전문 AI per situation from **내 보관함 (Inventory, 개인)** and **공용 허브 (Hub, 공용)** — shown as per-chip source tags (1 from Hub, 2 from Inventory) + glossed inline. Ends on a real deliverable handoff ("요청하신 발표 자료가 준비됐어요. 바로 열어 보세요."); removed the low-trust "고칠 부분을 말해주면 다시 다듬어요." Chat avatar changed from a flat blue orb → the **Mos character**. "누구나 쓰는 공용 허브" gloss also defuses the cold-reader "is my data shared?" worry.

**Recruit band — reframed to early-team** (was "투자자/Investor", which read pre-funding/no-team to consumers — now reversed at user request): "초기 멤버로 함께 만들래요?" · 도메인 전문가 / 창업 멤버 / 함께할 동료 · CTA "초기 팀 합류 알아보기."

**Email focus bug.** `Hero .form-wrap:focus-within { box-shadow: 0 0 0 4px … }` ringed the WHOLE form block (input+button+consent+microcopy) = the "테두리 영역이 이상하게." Removed it; the field's own focus ring (Input.svelte) is the sole affordance.

**Re-verification (R6).** 4 zero-context cold readers (KO/EN × skim/careful) + a screenshot layout reviewer + a brand reviewer. Cold metrics held at the proof-bound ceiling (clarity 3.0/5, signup 2.0/5 — same as session 2). All 5 targeted layout fixes confirmed holding. #1 cold blocker = undefined coined nouns → fixed via inline gloss. Brand reviewer flagged the loop 돌아오기/share coupling → fixed → re-reviewed PASS. Remaining blockers unchanged & proof-bound (no shown product, Mos/Mosmos naming, no price/date). Gates: check/lint/build all 0; package.json/pnpm-lock net-zero.
