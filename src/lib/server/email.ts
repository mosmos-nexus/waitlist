import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from './env';
import type { AppLocale } from '$lib/i18n';

let client: Resend | null = null;

function getResend(): Resend | null {
  if (client) return client;
  if (!RESEND_API_KEY) return null;
  client = new Resend(RESEND_API_KEY);
  return client;
}

interface MailContent {
  subject: string;
  html: string;
  text: string;
}

// Brand Kit tone (warm 해요체), result-first, reassuring. No launch dates/quarters (§2).
function welcomeContent(locale: AppLocale): MailContent {
  if (locale === 'en') {
    const subject = 'Welcome — you’re in line for Mosmos';
    const text = [
      'Thanks for joining.',
      '',
      'We’re building Mosmos — a world where your AI grows up. As soon as we’re ready, we’ll send your invite from the front of the line.',
      'We’d rather share the making of it honestly than only the finished picture, so you’ll hear from us along the way.',
      '',
      'If this email landed in spam, marking it “not spam” keeps the next note from getting lost.',
      '',
      '— The Mosmos team',
    ].join('\n');
    return { subject, text, html: wrap('en', 'Thanks for joining', text) };
  }
  const subject = '환영해요 — Mosmos 앞줄에 함께해요';
  const text = [
    '함께해 주셔서 고마워요.',
    '',
    '내 AI가 자라는 세계, Mosmos를 만들고 있어요. 준비되는 대로 앞줄에서 가장 먼저 초대 소식을 보내드릴게요.',
    '완성된 모습만 보여드리기보다, 만들어가는 과정도 솔직하게 나눌게요.',
    '',
    '혹시 이 메일이 스팸함에 있었다면 ‘스팸 아님’으로 표시해 주시면 다음 소식을 놓치지 않아요.',
    '',
    '— Mosmos 드림',
  ].join('\n');
  return { subject, text, html: wrap('ko', '함께해 주셔서 고마워요', text) };
}

function wrap(locale: AppLocale, heading: string, body: string): string {
  const paragraphs = body
    .split('\n\n')
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2A2F38;">${p
          .split('\n')
          .join('<br>')}</p>`,
    )
    .join('');
  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;background:#F7F8F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <div style="background:#FFFFFF;border:1px solid #E8EDF2;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0F6FDA 0%,#9CBDE9 100%);padding:28px 28px;">
          <span style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;">mosmos</span>
        </div>
        <div style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1D2026;">${heading}</h1>
          ${paragraphs}
        </div>
      </div>
      <p style="margin:16px 4px 0;font-size:12px;color:#AAB4C2;">© Mosmos</p>
    </div>
  </body>
</html>`;
}

/** Sends the welcome email. No-op (returns false) when Resend isn't configured. */
export async function sendWelcomeEmail(to: string, locale: AppLocale): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  const { subject, html, text } = welcomeContent(locale);
  await resend.emails.send({ from: RESEND_FROM_EMAIL, to, subject, html, text });
  return true;
}
