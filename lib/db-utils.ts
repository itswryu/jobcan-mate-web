import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * 데이터베이스 상태를 진단하는 유틸리티
 */
export async function diagnosticDb() {
  try {
    console.log('데이터베이스 진단 시작...');

    // 데이터베이스 파일 존재 확인
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const dbExists = fs.existsSync(dbPath);
    console.log(`데이터베이스 파일 존재 여부: ${dbExists}`);

    if (dbExists) {
      // 파일 크기 확인
      const stats = fs.statSync(dbPath);
      console.log(`데이터베이스 파일 크기: ${stats.size} bytes`);
    }

    // 테이블 존재 확인
    try {
      const userCount = await prisma.user.count();
      console.log(`User 테이블 레코드 수: ${userCount}`);

      const settingsCount = await prisma.settings.count();
      console.log(`Settings 테이블 레코드 수: ${settingsCount}`);

      // 사용자 목록 가져오기
      const users = await prisma.user.findMany();
      console.log('사용자 목록:', users);

      // 설정 목록 가져오기
      const settings = await prisma.settings.findMany();
      console.log('설정 목록:', settings);

      return {
        dbExists,
        fileSize: dbExists ? fs.statSync(dbPath).size : 0,
        userCount,
        settingsCount,
        users,
        settings
      };
    } catch (tableError: unknown) {
      console.error('테이블 접근 오류:', tableError);
      const errorMessage = tableError instanceof Error ? tableError.message : String(tableError);
      return {
        dbExists,
        fileSize: dbExists ? fs.statSync(dbPath).size : 0,
        error: errorMessage
      };
    }
  } catch (error: unknown) {
    console.error('데이터베이스 진단 중 오류:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: errorMessage };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 데이터베이스에 직접 설정을 저장하는 함수
 */
export async function directSaveSettings(userId: string, settings: any) {
  console.log('직접 설정 저장 시작:', { userId, settings });

  try {
    // 트랜잭션 사용
    const result = await prisma.$transaction(async (tx) => {
      // 설정 존재 확인
      const existingSettings = await tx.settings.findUnique({
        where: { userId }
      });

      console.log('기존 설정 확인 결과:', existingSettings || '없음');

      let savedSettings;
      if (existingSettings) {
        // 업데이트
        savedSettings = await tx.settings.update({
          where: { userId },
          data: settings
        });
        console.log('설정 업데이트 완료');
      } else {
        // 생성
        savedSettings = await tx.settings.create({
          data: {
            userId,
            ...settings
          }
        });
        console.log('설정 생성 완료');
      }

      return savedSettings;
    });

    console.log('직접 설정 저장 결과:', result);
    return result;
  } catch (error) {
    console.error('직접 설정 저장 중 오류:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
