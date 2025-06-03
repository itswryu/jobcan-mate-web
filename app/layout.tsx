import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/providers/session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { initializeDatabase } from "./actions";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jobcan Mate",
  description: "자동 출퇴근 관리 서비스",
};

// 서버 사이드에서 데이터베이스 초기화 함수 실행
// 서버 액션은 레이아웃의 전역 스코프에서 안전하게 실행됨
initializeDatabase().catch(error => {
  console.error('데이터베이스 초기화 중 오류:', error);
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}