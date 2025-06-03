'use server'

import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

/**
 * 서버 액션: 데이터베이스 상태를 확인하고 필요한 경우 초기화합니다.
 */
export async function initializeDatabase() {
  console.log('서버 액션: 데이터베이스 상태를 확인하는 중...')
  
  try {
    // 테이블 존재 여부 확인
    await prisma.user.count()
    console.log('User 테이블이 존재합니다.')
    
    await prisma.settings.count()
    console.log('Settings 테이블이 존재합니다.')
    
    console.log('데이터베이스가 정상입니다.')
    return { success: true, message: '데이터베이스가 정상적으로 초기화되어 있습니다.' }
  } catch (error) {
    console.error('데이터베이스 테이블이 존재하지 않습니다:', error)
    console.log('데이터베이스를 초기화합니다...')
    
    try {
      // 마이그레이션 실행
      const { stdout: migrateOutput } = await execAsync('npx prisma migrate dev --name init')
      console.log('마이그레이션 실행 결과:', migrateOutput)
      
      // Prisma 클라이언트 재생성
      const { stdout: generateOutput } = await execAsync('npx prisma generate')
      console.log('Prisma 클라이언트 생성 결과:', generateOutput)
      
      return { success: true, message: '데이터베이스가 성공적으로 초기화되었습니다.' }
    } catch (migrateError) {
      console.error('마이그레이션 실행 중 오류가 발생했습니다:', migrateError)
      
      // 더 강력한 리셋 시도
      try {
        console.log('강제 리셋을 시도합니다...')
        
        // 프로젝트 루트 경로
        const projectRoot = process.cwd()
        
        // 데이터베이스 파일 경로
        const dbPath = path.join(projectRoot, 'prisma', 'dev.db')
        
        // 데이터베이스 파일 삭제
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath)
          console.log('기존 데이터베이스 파일을 삭제했습니다:', dbPath)
        }
        
        // 마이그레이션 디렉토리 경로
        const migrationsPath = path.join(projectRoot, 'prisma', 'migrations')
        
        // 마이그레이션 디렉토리 삭제
        if (fs.existsSync(migrationsPath)) {
          fs.rmSync(migrationsPath, { recursive: true, force: true })
          console.log('기존 마이그레이션 디렉토리를 삭제했습니다:', migrationsPath)
        }
        
        // 새 마이그레이션 생성 및 적용
        await execAsync('npx prisma migrate dev --name initial_setup')
        console.log('새 마이그레이션이 생성되었습니다.')
        
        return { success: true, message: '데이터베이스가 강제로 재설정되었습니다.' }
      } catch (resetError) {
        console.error('강제 리셋 중 오류가 발생했습니다:', resetError)
        return { success: false, message: '데이터베이스 초기화에 실패했습니다.' }
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}
