import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getServerSession } from 'next-auth'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.error('signIn callback: user email is missing', user);
        console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
        return false;
      }

      try {
        console.log('signIn callback: checking for existing user', user.id);
        
        // 유저 찾기 시도
        let existingUser;
        try {
          existingUser = await prisma.user.findUnique({
            where: { id: user.id as string },
          });
          console.log('signIn callback: user lookup result', existingUser ? 'found' : 'not found');
        } catch (findError) {
          console.error('signIn callback: error finding user', findError);
          console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
          
          // 테이블이 없는 경우 서버 액션을 통해 데이터베이스 초기화 시도
          const { initializeDatabase } = await import('@/app/db-actions');
          const result = await initializeDatabase();
          console.log('signIn callback: database initialization result', result);
          
          // 새로 생성될 사용자로 처리
          existingUser = null;
        }
        
        if (!existingUser) {
          // 새 유저 생성 시도
          try {
            console.log('signIn callback: creating new user', user.id);
            await prisma.user.create({
              data: {
                id: user.id as string,
                email: user.email,
                name: user.name || '',
                image: user.image || '',
              },
            });
            console.log('signIn callback: user created successfully');
          } catch (createUserError) {
            console.error('signIn callback: error creating user', createUserError);
            console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
            throw createUserError;
          }
          
          // 기본 설정 생성 시도
          try {
            console.log('signIn callback: creating default settings for user', user.id);
            await prisma.settings.create({
              data: {
                userId: user.id as string,
                jobcanEmail: '',
                jobcanPassword: '',
                weekdaysOnly: true,
                checkInTime: '09:00',
                checkOutTime: '18:00',
                schedulerEnabled: true,
                checkInDelay: -10,
                checkOutDelay: 5,
                timezone: 'Asia/Seoul',
                testMode: false,
                messageLanguage: 'ko',
                telegramBotToken: '',
                telegramChatId: '',
                annualLeaveCalendarUrl: '',
                annualLeaveKeyword: '연차'
              },
            });
            console.log('signIn callback: settings created successfully');
          } catch (createSettingsError) {
            console.error('signIn callback: error creating settings', createSettingsError);
            console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
            // 설정 생성 실패는 로그인 자체를 실패시키지 않음
            console.log('signIn callback: continuing despite settings creation error');
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
        return false;
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
}

// getAuthSession 함수 추가
export const getAuthSession = async () => {
  return await getServerSession(authOptions)
}