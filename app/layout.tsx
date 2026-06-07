import "./globals.css";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

const FigtreeFont = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://mosmos.world"),
  title: "Mosmos — 내 AI가 자라는 세계",
  description:
    "말만 하세요. 움직이는 건 Mos. 목표만 말하면 내 AI 화신 Mos가 필요한 Mon을 불러 일을 끝냅니다. Mosmos 비공개 베타 웨이트리스트에 참여하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <meta property="og:image" content="/opengraph-image.png" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:title" content="Mosmos — 내 AI가 자라는 세계" />
      <meta property="og:site_name" content="Mosmos" />
      <meta property="og:url" content="https://mosmos.world/" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="/twitter-image.png" />
      <meta name="twitter:image:type" content="image/png" />
      <meta name="twitter:image:width" content="1200" />
      <meta name="twitter:image:height" content="630" />
      <body className={FigtreeFont.className}>
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
