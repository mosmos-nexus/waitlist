# Waitlist copy change log

Per "Waitlist 동적 연출 구현 에이전트 지침 (v2)" §7, every copy/register migration to
the latest brand resources is logged here as _date · changed item · source_.

Source-of-truth pages (Notion):

- 언어 전략 (register & disclosure ladder) — `d78d52c74af240259fd8922533dda03a`
- 메시지 하우스 · 태그라인 · 콜드 카피 (브랜드 포지셔닝 §5) — `c44b8643c5824b2487628163133778ab`
- 보이스 · 톤 · 말투 (브랜드 페르소나) — `cdd7c71bca5948778f7d5bd31c6a06e8`
- 용어집 (glossary) — `35f338c1445180c0b38de195b4c5e6db`
- 컬러·서체 / 화면 적용 — `dbe7fc724a8e4df7a0225aabe509f1c5` · `9c2338c144518372969f0162e1d36f1f`
- Local design system: `design_system/` (README + tokens)

---

## 2026-06-18 — Full redesign to the v2 cold/범용 IA

The page was rebuilt on a blank slate (new 7-section IA); the tech stack and the
waitlist DB (collection / consent / verification / storage) were reused unchanged.
Copy was re-synced to the cold-register message house.

| Item                              | v1 (before)                               | Latest standard (after)                                                                                                            | Source                                |
| --------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Hero tagline                      | "내 AI가 자라는 세계" (세계관)            | "쓸수록 손발 맞는 내 AI 조력자" (콜드 범용)                                                                                        | 포지셔닝 §5.1                         |
| Hero sub/slogan                   | "말만 하세요. 움직이는 건 Mos."           | "자잘한 일은 맡기고, 중요한 것에 집중하세요."                                                                                      | 포지셔닝 §5.1                         |
| Core hook                         | 기억·성장                                 | "쓸수록 손발이 맞는다(숙련)" — moved to §5, off the cold hero                                                                      | 지침 v2 §2                            |
| Trust line                        | —                                         | "준비되면 가장 먼저 알려드려요"                                                                                                    | 지침 v2 §3                            |
| Scarcity                          | —                                         | "정성껏 돌볼 수 있는" 케어 용량 (수치 희소성 미사용)                                                                               | 지침 v2 §3                            |
| World tagline                     | (on hero)                                 | "디지털 세상 속, 또 하나의 나" — moved to the post-signup confirmation only                                                        | 지침 v2 §2 / 포지셔닝 §5              |
| World terms density               | Mos·Mon used freely                       | one coined term per screen + first-use gloss; "Mos" introduced only in §5; "Mon" rendered as "전문가" everywhere on this cold page | 언어 전략 (Waitlist row) / 지침 v2 §3 |
| `meta_title` / `meta_description` | "내 AI가 자라는 세계" + "움직이는 건 Mos" | cold 범용, no coined terms                                                                                                         | 언어 전략                             |

### Voice-rule overrides (브랜드 페르소나 — 절대어 금지)

- **Demo climax line "완벽해!" → dropped.** §2 of the spec cites "완벽해!" as the demo
  climax, but "완벽" is on the brand voice **절대어(absolute-word) blocklist**. Per §2
  step 4 (resolve copy conflicts to the latest brand resource and log it), the demo now
  closes with voice-compliant, result-first lines — `demo_chat_ai2` "정리된 결과예요.
  확인해보세요." and `demo_chat_user2` "딱 이거예요. 고마워요!". Source: 보이스 페이지 절대어 금지.

### Removed (sections cut in the redesign)

`conv_*`, `how_step4_*`, `how_teaser*`, `mosmon_*`, `mos_name/role/desc/keywords`,
`mon_*`, `story_*`, `hero_slogan`, `hero_target`, `hero_mos_gloss`, `social_eyebrow`
were removed with their v1 sections (ConversationCuts, MosMonCards, StoryExample,
SocialProof). Their roles fold into the new InteractiveDemo, MosTeaser, and TrustCta.

### Kept verbatim (already on-voice)

`founder_note`, `founder_sign`, `social_count`, `gated_stat_n45`, all `survey_*`,
`error_*`, `consent_*`, `confirm_*`, and the `privacy_*` block were retained.

### Welcome email (`src/lib/server/email.ts`)

The welcome email is sent _after_ signup, so it intentionally uses the warmer
worldview register (Mos in first person; tagline "내 AI가 자라는 세계, Mosmos") —
consistent with the post-confirmation worldview reveal on the page. The send/template
logic was left untouched (reused per the spec). One copy fix during review:

- **Removed the 👋 emoji** from both locale headings ("Hi, I’m Mos" / "안녕하세요,
  저는 Mos예요") to satisfy the brand "no emoji in copy" rule. Source: 브랜드 페르소나 / DS readme.

### Post-review polish (DoD self-check, 2026-06-18)

Non-copy fixes from the adversarial DoD/a11y/perf review:

- §2 demo: reduced-motion is now decided eagerly (not in `onMount`) so the timeline
  never runs for reduced-motion users — the static final frame holds (DoD §5).
- §2 demo: pause/play control raised to the 44px tap target; progress fill animates
  `transform: scaleX` instead of `width`.
- Character `<img>` width/height set to the assets' true ~1.06 aspect ratio (was square)
  to prevent CLS and proportion distortion (DS "원본 비율").
- Confirmation: explicit reduced-motion final-frame block added as belt-and-braces.
