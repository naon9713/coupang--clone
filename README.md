# Multi-Vendor Shopping Mall

Next.js 기반 멀티벤더 쇼핑몰 플랫폼

## 설치

```bash
npm install
```

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/multi_vendor_mall?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

## 데이터베이스 설정

```bash
# Prisma Client 생성
npx prisma generate

# 마이그레이션 실행
npx prisma migrate dev --name init

# Prisma Studio 열기 (선택)
npx prisma studio
```

## 개발 서버 실행

```bash
npm run dev
```

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router
│   ├── customer/     # 고객 페이지 라우트 그룹
│   ├── vendor/       # 판매자 페이지 라우트 그룹
│   ├── admin/        # 관리자 페이지 라우트 그룹
│   └── api/          # API 라우트
├── components/       # 공통 컴포넌트
├── lib/              # 유틸리티 함수
├── store/            # Zustand 상태 관리
├── types/            # TypeScript 타입
└── hooks/            # 커스텀 훅
```

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Stripe
- Socket.io
- Zustand
- React Query
