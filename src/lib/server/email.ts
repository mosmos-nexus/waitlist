import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from './env';
import { mosGreeting, mosHappy } from './email-assets';
import type { AppLocale } from '$lib/i18n';

let client: Resend | null = null;

function getResend(): Resend | null {
  if (client) return client;
  if (!RESEND_API_KEY) return null;
  client = new Resend(RESEND_API_KEY);
  return client;
}

// Public site origin — the single CTA destination + footer link.
const SITE = 'https://mosmos.world';

// Inline image content IDs. The art is attached to the message and referenced with `cid:`,
// so it renders even before the site is deployed and when remote images are blocked.
const CID = { hero: 'mos-greeting', avatar: 'mos-happy' };

// Brand palette (mosmos design system).
const C = {
  primary: '#0F6FDA',
  gradientEnd: '#4F93E6',
  strong: '#1D2026',
  body: '#3A4250',
  muted: '#8A95A5',
  bg: '#EEF2F6',
  card: '#FFFFFF',
  border: '#E6EAF0',
  heroTint: '#EAF2FD',
};

interface MailContent {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

interface Copy {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  spamNote: string;
  signoff: string;
  heroAlt: string;
  tagline: string;
  optout: string;
}

// Mos speaks in the first person — warm, low-pressure, identity-affirming (§5 tone).
//
// Keyed by locale as a total Record rather than an if/else chain: widening
// `AppLocale` then has to be answered here, instead of silently falling through
// to Korean the way `ja` did when it was added.
const COPY: Record<AppLocale, Copy> = {
  en: {
    subject: 'Welcome — I’m Mos',
    preheader: 'Thanks for joining the front of the line. I’ll be the first to come find you.',
    heading: 'Hi, I’m Mos',
    paragraphs: [
      'Thanks for joining the front of the line. I’m Mos — the AI companion that grows up alongside you. From here on, there’s no picking the right tools or wrestling with prompts: just tell me the goal, and I’ll do the moving and bring back the result.',
      'We’re still getting ready. The moment everything’s in place, I’ll be the very first to bring your invite. We start small, just a few people at a time, because we want to listen closely to your story.',
      'Until then, I’ll share how we’re growing — honestly — now and then.',
    ],
    ctaLabel: 'Take a look around Mosmos',
    spamNote: 'If this landed in spam, marking it “not spam” keeps my next note from getting lost.',
    signoff: '— Mos',
    heroAlt: 'Mos, your AI companion, waving hello',
    tagline: 'Mosmos — a world where your AI grows up',
    optout: 'Not curious anymore? Just tell us at hello@mosmos.world and we’ll stop right away.',
  },

  ja: {
    subject: 'ようこそ — わたしはMosです',
    preheader:
      '前の列にご一緒いただき、ありがとうございます。準備ができたら、いちばん最初にお迎えにあがります。',
    heading: 'はじめまして、わたしはMosです',
    paragraphs: [
      '前の列にご一緒いただき、ありがとうございます。わたしはMos — あなたと一緒に育っていくAIの相棒です。これからは、どの道具を選ぶか迷ったり、プロンプトを整えたりする必要はありません。目標だけ伝えてください。動くのはわたしがやって、結果までお届けします。',
      'いまはまだ準備中です。すべて整い次第、いちばん最初にご招待をお持ちします。はじめは少ない人数から、ゆっくりお迎えします — お一人ずつのお話を、きちんと聞きたいからです。',
      'それまでは、わたしたちがどう育っているかを、ときどき正直にお伝えします。',
    ],
    ctaLabel: 'Mosmosをのぞいてみる',
    spamNote:
      'このメールが迷惑メールに入っていたら、「迷惑メールではない」と設定してください。次のお知らせを見逃さずに受け取れます。',
    signoff: '— Mos',
    heroAlt: 'あいさつをしているAIの相棒、Mos',
    tagline: 'わたしのAIが育つ世界、Mosmos',
    optout:
      'もう興味がなくなったら、hello@mosmos.world までお知らせください。すぐに配信を止めます。',
  },

  ko: {
    subject: '환영해요 — 저는 Mos예요',
    preheader: '앞줄에 함께해 주셔서 고마워요. 준비되는 대로 제가 가장 먼저 찾아올게요.',
    heading: '안녕하세요, 저는 Mos예요',
    paragraphs: [
      '앞줄에 함께해 주셔서 고마워요. 저는 당신과 함께 자라날 AI 동반자예요. 앞으로는 어떤 도구를 쓸지 고르거나 프롬프트를 다듬지 않아도 돼요 — 목표만 말해 주시면, 움직이는 건 제가 할게요. 결과까지 챙겨서 가져다드릴게요.',
      '아직은 준비 중이에요. 다 갖춰지는 대로, 제가 가장 먼저 초대장을 들고 찾아올게요. 처음엔 한 분 한 분 천천히 모실 거예요 — 당신의 이야기를 깊이 듣고 싶거든요.',
      '그때까지 가끔, 우리가 어떻게 자라고 있는지 솔직하게 들려드릴게요.',
    ],
    ctaLabel: 'Mosmos 둘러보기',
    spamNote:
      '혹시 이 메일이 스팸함에 있었다면 ‘스팸 아님’으로 표시해 주세요. 다음 소식을 놓치지 않아요.',
    signoff: '— Mos 드림',
    heroAlt: '인사하는 AI 동반자 Mos',
    tagline: '내 AI가 자라는 세계, Mosmos',
    optout: '이 소식이 더는 궁금하지 않다면 hello@mosmos.world로 알려주세요. 바로 멈출게요.',
  },
};

function copyFor(locale: AppLocale): Copy {
  return COPY[locale];
}

function welcomeContent(locale: AppLocale): MailContent {
  const c = copyFor(locale);
  const text = [
    c.heading.replace(' 👋', ''),
    '',
    ...c.paragraphs,
    '',
    `${c.ctaLabel}: ${SITE}`,
    '',
    c.spamNote,
    '',
    c.signoff,
    '',
    `${c.tagline} · ${SITE}`,
  ].join('\n');
  return { subject: c.subject, preheader: c.preheader, text, html: shell(locale, c) };
}

// Table-based, single-column, inline-styled — the layout that survives Gmail, Apple Mail,
// Naver/Daum, and Outlook. Designed to still read well with images off (alt text + bg colors).
function shell(locale: AppLocale, c: Copy): string {
  const paragraphs = c.paragraphs
    .map(
      (p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${C.body};">${p}</p>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${locale}" style="margin:0;padding:0;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${c.subject}</title>
    <style>
      @media (max-width:600px){
        .px{padding-left:24px !important;padding-right:24px !important;}
        .hero-img{width:200px !important;height:auto !important;}
      }
      a{color:${C.primary};}
    </style>
  </head>
  <body style="margin:0;padding:0;background:${C.bg};">
    <span style="display:none !important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${c.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${C.card};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
            <!-- Header wordmark (text, not an image — always renders) -->
            <tr>
              <td style="background:linear-gradient(135deg,${C.primary} 0%,${C.gradientEnd} 100%);padding:22px 32px;" class="px">
                <span style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#FFFFFF;">mosmos</span>
              </td>
            </tr>
            <!-- Hero: Mos waving -->
            <tr>
              <td align="center" style="background:${C.heroTint};padding:36px 32px 28px;" class="px">
                <img src="cid:${CID.hero}" alt="${c.heroAlt}" width="240" height="240" class="hero-img" style="display:block;width:240px;height:240px;border:0;outline:none;" />
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 40px 8px;" class="px">
                <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;color:${C.strong};">${c.heading}</h1>
                ${paragraphs}
              </td>
            </tr>
            <!-- CTA button (bulletproof) -->
            <tr>
              <td style="padding:12px 40px 36px;" class="px">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="${C.primary}" style="border-radius:12px;">
                      <a href="${SITE}" target="_blank" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:12px;">${c.ctaLabel} →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Sign-off with small Mos avatar -->
            <tr>
              <td style="padding:0 40px 36px;" class="px">
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${C.muted};">${c.spamNote}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:10px;vertical-align:middle;">
                      <img src="cid:${CID.avatar}" alt="" width="36" height="36" style="display:block;width:36px;height:36px;border-radius:50%;border:0;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:15px;font-weight:600;color:${C.strong};">${c.signoff}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:24px 40px 28px;border-top:1px solid ${C.border};" class="px">
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${C.muted};">${c.tagline}</p>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${C.muted};">${c.optout}</p>
                <p style="margin:0;font-size:12px;color:${C.muted};">© Mosmos · <a href="${SITE}" target="_blank" style="color:${C.muted};text-decoration:underline;">mosmos.world</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Sends the welcome email. No-op (returns false) when Resend isn't configured. */
export async function sendWelcomeEmail(to: string, locale: AppLocale): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  const { subject, html, text } = welcomeContent(locale);
  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject,
    html,
    text,
    // Inline (cid:) attachments so the brand art renders without depending on a deploy or
    // the recipient allowing remote images.
    attachments: [
      { filename: 'mos.png', content: mosGreeting, contentId: CID.hero },
      { filename: 'mos-mark.png', content: mosHappy, contentId: CID.avatar },
    ],
  });
  return true;
}
