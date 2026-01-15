import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "유러피안 양상추 진단 시스템",
  description: "CPJ 프레임워크 기반 식물공장 유러피안 양상추 AI 진단 시스템",
  keywords: ["양상추", "식물공장", "AI 진단", "CPJ", "스마트팜"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
