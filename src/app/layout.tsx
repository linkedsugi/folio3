import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RoleFit Canvas — 지원할지 말지, 부서장의 눈으로 먼저 판단하세요",
    template: "%s · RoleFit Canvas",
  },
  description:
    "공고와 이력을 넣으면 뽑는 부서장이 실제로 원하는 사람을 복원하고, 내 경험으로 그 역할을 해낼 수 있다는 근거를 세우고, 합격선 80% 대비 어디에 있는지 냉정하게 알려드립니다.",
  applicationName: "RoleFit Canvas",
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoKr.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
