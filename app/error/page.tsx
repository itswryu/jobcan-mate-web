'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 오류 로깅
    console.error('오류 페이지:', error);
  }, [error]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-center text-xl">오류가 발생했습니다</CardTitle>
          <CardDescription className="text-center">
            {error?.message || '알 수 없는 오류가 발생했습니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          <p className="mb-2">다음과 같은 해결 방법을 시도해 보세요:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>브라우저를 새로고침하세요.</li>
            <li>다시 로그인을 시도하세요.</li>
            <li>쿠키와 캐시를 삭제한 후 다시 시도하세요.</li>
            <li>문제가 지속되면 관리자에게 문의하세요.</li>
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
