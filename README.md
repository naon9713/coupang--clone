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
- Playwright (E2E 테스트)

## 테스트

### E2E 테스트 실행

```bash
# E2E 테스트 실행
npm run test:e2e

# UI 모드로 테스트 실행
npm run test:e2e:ui

# 디버그 모드로 테스트 실행
npm run test:e2e:debug
```

## 구현된 기능

### Phase 1: 프로젝트 설정 및 기본 구조 ✅
- Next.js 14 프로젝트 설정
- TailwindCSS 설정
- shadcn/ui 컴포넌트 설정
- 라우트 그룹 구조 (/customer, /vendor, /admin)
- 상태 관리 설정 (Zustand, React Query)

### Phase 2: 데이터베이스 및 인증 시스템 ✅
- Prisma 스키마 정의
- NextAuth.js 인증 시스템
- 회원가입/로그인/로그아웃
- 역할 기반 접근 제어 (RBAC)
- 인증 미들웨어

### Phase 3: 기본 상품 및 카테고리 기능 ✅
- 카테고리 CRUD API
- 상품 CRUD API
- 상품 목록 페이지
- 상품 상세 페이지
- 상품 검색 및 필터링

### Phase 4: 장바구니 및 위시리스트 ✅
- 장바구니 CRUD API
- 위시리스트 CRUD API
- 장바구니 수량 수정
- 장바구니 총액 계산

### Phase 5: 주문 시스템 (기본) ✅
- 주문 생성 API
- 주문 목록 조회
- 주문 상세 조회
- 주문 취소 기능
- 멀티벤더 주문 로직

### Phase 6: 결제 시스템 ✅
- Stripe Payment Intent 생성
- 결제 확인 API
- Stripe Webhook 처리
- 환불 기능

### Phase 7: 판매자 기능 ✅
- 판매자 대시보드 API
- 판매자 주문 관리 API
- 배송 처리 기능
- 정산 내역 조회 API

### Phase 8: 실시간 채팅 시스템 ✅
- 채팅방 CRUD API
- 메시지 내역 조회 API
- 채팅방 참여자 관리

### Phase 9: 관리자 기능 및 분석 ✅
- 관리자 대시보드 API
- 벤더 관리 API (승인/거절/정지)
- 분석 및 리포트 API
- 시스템 통계

### Playwright 테스트 ✅
- 인증 시스템 테스트
- 상품 기능 테스트
- 장바구니 기능 테스트
- 주문 기능 테스트
- 판매자 기능 테스트
- 관리자 기능 테스트
