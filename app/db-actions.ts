'use server'

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { PrismaClient } from '@prisma/client'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

/**
 * 데이터베이스 파일이 존재하는지 확인하고, 없으면 생성합니다.
 */
export async function ensureDatabaseFile() {
  console.log('데이터베이스 파일 확인 중...')
  
  try {
    // 프로젝트 루트 경로
    const projectRoot = process.cwd()
    
    // prisma 디렉토리 경로
    const prismaDir = path.join(projectRoot, 'prisma')
    
    // 데이터베이스 파일 경로
    const dbPath = path.join(prismaDir, 'dev.db')
    
    // prisma 디렉토리가 없으면 생성
    if (!fs.existsSync(prismaDir)) {
      console.log('prisma 디렉토리가 존재하지 않습니다. 생성합니다...')
      fs.mkdirSync(prismaDir, { recursive: true })
    }
    
    // 데이터베이스 파일 존재 확인
    const dbExists = fs.existsSync(dbPath)
    
    if (dbExists) {
      // 파일은 존재하지만 유효한지 확인
      try {
        console.log('데이터베이스 파일 존재. 유효성 확인 중...')
        await prisma.$queryRaw`SELECT 1`
        console.log('데이터베이스 파일이 유효합니다.')
        return { success: true, message: '데이터베이스 파일이 존재하고 유효합니다.' }
      } catch (error) {
        console.error('기존 데이터베이스 파일이 손상되었습니다:', error)
        console.log('손상된 데이터베이스 파일을 삭제하고 새로 생성합니다...')
        
        // 연결 종료
        await prisma.$disconnect()
        
        // 손상된 파일 삭제
        fs.unlinkSync(dbPath)
        
        // 아래 로직으로 계속 진행하여 새 파일 생성
      }
    } else {
      console.log('데이터베이스 파일이 존재하지 않습니다. 새로 생성합니다...')
    }
    
    // 마이그레이션 디렉토리 확인
    const migrationsDir = path.join(prismaDir, 'migrations')
    if (fs.existsSync(migrationsDir)) {
      console.log('기존 마이그레이션 디렉토리 삭제')
      fs.rmSync(migrationsDir, { recursive: true, force: true })
    }
    
    // 스키마 파일 확인
    const schemaPath = path.join(prismaDir, 'schema.prisma')
    if (!fs.existsSync(schemaPath)) {
      console.error('Prisma 스키마 파일이 없습니다.')
      return { success: false, message: 'Prisma 스키마 파일이 없습니다.' }
    }
    
    // 데이터베이스 URL 확인
    const envPath = path.join(projectRoot, '.env.local')
    if (!fs.existsSync(envPath)) {
      console.log('환경 변수 파일이 없습니다. 기본 파일을 생성합니다.')
      const defaultEnv = `DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=supersecret`
      
      fs.writeFileSync(envPath, defaultEnv)
    } else {
      // 파일은 있지만 DATABASE_URL이 없는 경우 추가
      let envContent = fs.readFileSync(envPath, 'utf8')
      if (!envContent.includes('DATABASE_URL')) {
        envContent += `\nDATABASE_URL="file:./dev.db"`
        fs.writeFileSync(envPath, envContent)
      }
    }
    
    try {
      // Prisma 초기 마이그레이션 실행
      console.log('데이터베이스 마이그레이션 실행 중...')
      
      const { stdout, stderr } = await execAsync('npx prisma migrate dev --name init', {
        cwd: projectRoot,
      })
      
      if (stderr && !stderr.includes('already exists')) {
        console.error('마이그레이션 오류:', stderr)
      }
      
      console.log('마이그레이션 결과:', stdout)
      
      // Prisma 클라이언트 생성
      await execAsync('npx prisma generate', {
        cwd: projectRoot,
      })
      
      // 데이터베이스 파일 다시 확인
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath)
        console.log(`데이터베이스 파일 생성 완료: ${stats.size} bytes`)
        return {
          success: true,
          message: '데이터베이스 파일이 성공적으로 생성되었습니다.',
          fileSize: stats.size
        }
      } else {
        console.error('마이그레이션 후에도 데이터베이스 파일이 생성되지 않았습니다.')
        return { success: false, message: '데이터베이스 파일 생성 실패' }
      }
    } catch (migrationError) {
      console.error('마이그레이션 실행 중 오류:', migrationError)
      const errorMessage = migrationError instanceof Error 
        ? migrationError.message 
        : '알 수 없는 마이그레이션 오류';
      return { success: false, message: '마이그레이션 오류', error: errorMessage }
    }
  } catch (error) {
    console.error('데이터베이스 파일 확인 중 오류:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : '알 수 없는 오류가 발생했습니다';
    return { success: false, message: '오류 발생', error: errorMessage }
  }
}

/**
 * 데이터베이스 초기 설정 - 앱 시작 시 호출됩니다.
 */
export async function initializeDatabase() {
  console.log('데이터베이스 초기화 시작...')
  
  try {
    // 1. 데이터베이스 파일 확인 및 생성
    const dbFileResult = await ensureDatabaseFile()
    console.log('데이터베이스 파일 확인 결과:', dbFileResult)
    
    // 파일은 있지만 테이블이 없는 경우
    try {
      // 테이블 존재 여부 확인
      await prisma.user.count()
      await prisma.settings.count()
      console.log('필요한 테이블이 모두 존재합니다.')
      return { success: true, message: '데이터베이스가 정상 초기화되었습니다.' }
    } catch (tableError) {
      console.log('테이블이 존재하지 않습니다. 마이그레이션을 실행합니다.')
      
      try {
        // 마이그레이션 실행
        await execAsync('npx prisma migrate dev --name init', {
          cwd: process.cwd(),
        })
        
        console.log('마이그레이션이 성공적으로 실행되었습니다.')
        return { success: true, message: '데이터베이스 테이블이 성공적으로 생성되었습니다.' }
      } catch (migrationError) {
        console.error('테이블 생성 중 오류:', migrationError)
        const errorMessage = migrationError instanceof Error 
          ? migrationError.message 
          : '알 수 없는 마이그레이션 오류';
        return { success: false, message: '테이블 생성 실패', error: errorMessage }
      }
    }
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : '알 수 없는 오류가 발생했습니다';
    return { success: false, message: '데이터베이스 초기화 실패', error: errorMessage }
  } finally {
    await prisma.$disconnect()
  }
}
