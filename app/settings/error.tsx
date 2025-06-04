'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 오류 로깅
    console.error('설정 페이지 오류:', error);
  }, [error]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-center text-xl">설정 페이지 오류</CardTitle>
          <CardDescription className="text-center">
            {error?.message || '설정을 불러오는 중 오류가 발생했습니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          <p className="mb-2">다음과 같은 해결 방법을 시도해 보세요:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>다시 로그인을 시도하세요.</li>
            <li>데이터베이스 연결을 확인하세요.</li>
            <li>문제가 지속되면 데이터베이스 초기화를 실행하세요: <code>npm run force-reset-db</code></li>
          </ul>
          {error?.digest && (
            <p className="mt-4 text-xs text-gray-400">
              오류 코드: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button variant="outline" onClick={reset}>
            다시 시도
          </Button>
          <Button asChild>
            <Link href="/">
              메인으로 돌아가기
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
