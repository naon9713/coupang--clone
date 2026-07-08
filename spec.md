# Multi-Vendor Shopping Mall System Specification

## 1. System Overview

### 1.1 Project Goals
Next.js 기반 멀티벤더 쇼핑몰 플랫폼으로, 여러 판매자가 입점하여 상품을 판매하고 고객들이 구매할 수 있는 시스템입니다. 하나의 주문에 여러 벤더의 상품이 포함될 수 있는 복잡한 멀티벤더 구조를 지원합니다.

### 1.2 Tech Stack

**Frontend & Framework**
- Next.js 14 (App Router)
- TypeScript
- React 18
- TailwindCSS
- shadcn/ui (UI Components)
- Lucide React (Icons)

**Backend & API**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Primary Database)
- Redis (Caching & Session)

**Authentication & Authorization**
- NextAuth.js v5
- JWT Tokens
- Role-Based Access Control (RBAC)

**Real-time Communication**
- Socket.io (Real-time Chat)
- Socket.io Redis Adapter (Scaling)

**Payment Integration**
- Stripe (Payment Processing)
- Stripe Webhooks

**State Management**
- Zustand (Client State)
- React Query (Server State)

**Deployment**
- Vercel (Primary)
- PostgreSQL (Supabase or Railway)
- Redis (Upstash)

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                  │
├─────────────────────────────────────────────────────────┤
│  Route Groups                                            │
│  ├── /customer      (고객 페이지)                        │
│  ├── /vendor        (판매자 페이지)                       │
│  └── /admin         (관리자 페이지)                       │
├─────────────────────────────────────────────────────────┤
│  API Routes (RESTful)                                    │
│  ├── /api/auth/*     (인증)                              │
│  ├── /api/products/* (상품)                              │
│  ├── /api/orders/*   (주문)                              │
│  ├── /api/payments/* (결제)                              │
│  ├── /api/chat/*     (채팅)                              │
│  └── /api/admin/*    (관리자)                            │
├─────────────────────────────────────────────────────────┤
│  Services                                               │
│  ├── AuthService                                        │
│  ├── ProductService                                      │
│  ├── OrderService                                        │
│  ├── PaymentService                                      │
│  ├── ChatService                                         │
│  └── AnalyticsService                                   │
├─────────────────────────────────────────────────────────┤
│  Database Layer                                          │
│  ├── Prisma ORM                                          │
│  ├── PostgreSQL (Primary)                                │
│  └── Redis (Cache)                                       │
└─────────────────────────────────────────────────────────┘
```

## 2. Route Group Structure

### 2.1 Customer Routes (`/customer`)
```
/customer
├── /profile              # 사용자 프로필
│   ├── /edit            # 프로필 수정
│   └── /addresses       # 배송지 관리
├── /orders              # 주문 관리
│   ├── /[id]            # 주문 상세
│   └── /tracking        # 배송 추적
├── /wishlist            # 찜하기
├── /recommendations     # 맞춤 추천
├── /chat                # 판매자 채팅
│   └── /[vendorId]      # 특정 판매자와의 채팅
└── /cart                # 장바구니
```

### 2.2 Vendor Routes (`/vendor`)
```
/vendor
├── /dashboard           # 대시보드
├── /products            # 상품 관리
│   ├── /new             # 상품 등록
│   ├── /[id]/edit       # 상품 수정
│   └── /inventory       # 재고 관리
├── /orders              # 주문 관리
│   ├── /[id]            # 주문 상세
│   └── /fulfillment     # 배송 처리
├── /pricing             # 가격 책정
├── /promotions          # 프로모션 관리
├── /analytics           # 판매 성과 분석
├── /settlements         # 정산 관리
└── /chat                # 고객 채팅
    └── /[customerId]    # 특정 고객과의 채팅
```

### 2.3 Admin Routes (`/admin`)
```
/admin
├── /dashboard           # 플랫폼 대시보드
├── /vendors             # 벤더 관리
│   ├── /pending         # 승인 대기
│   ├── /[id]/approve    # 벤더 승인
│   └── /[id]/suspend    # 벤더 정지
├── /products            # 상품 모니터링
├── /users               # 사용자 관리
├── /permissions         # 권한 관리
├── /analytics           # 통계 및 분석
├── /reports             # 리포트
└── /settings           # 시스템 설정
```

## 3. Database Schema

### 3.1 User & Authentication Tables

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?
  name          String?
  phone         String?
  avatar        String?
  role          UserRole  @default(CUSTOMER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Customer Relations
  customerProfile  CustomerProfile?
  orders           Order[]
  wishlistItems    WishlistItem[]
  cartItems        CartItem[]
  addresses        Address[]
  
  // Vendor Relations
  vendorProfile    VendorProfile?
  vendorProducts   Product[]
  vendorOrders     OrderItem[]
  
  // Chat Relations
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  chatRooms        ChatRoom[] @relation("UserChatRooms")

  accounts Account[]
  sessions Session[]
}

enum UserRole {
  CUSTOMER
  VENDOR
  ADMIN
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 3.2 Customer Profile Tables

```prisma
model CustomerProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  preferences Json?    // 고객 선호도 (카테고리, 가격대 등)
  loyaltyPoints Int    @default(0)
  totalSpent  Decimal  @default(0) @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Address {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label       String   // 집, 회사 등
  recipient   String
  phone       String
  address     String
  detail      String?
  postalCode  String
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3.3 Vendor Profile Tables

```prisma
model VendorProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  businessName    String
  businessNumber  String   @unique // 사업자등록번호
  businessType    String   // 개인/법인
  description     String?  @db.Text
  logo            String?
  banner          String?
  status          VendorStatus @default(PENDING)
  rating          Decimal  @default(0) @db.Decimal(3, 2)
  reviewCount     Int      @default(0)
  totalSales      Decimal  @default(0) @db.Decimal(15, 2)
  commissionRate  Decimal  @default(0.05) @db.Decimal(4, 3) // 5%
  bankAccount     String?
  bankName        String?
  accountHolder   String?
  approvedAt      DateTime?
  rejectedAt      DateTime?
  rejectionReason String?   @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  products        Product[]
  settlements     Settlement[]
}

enum VendorStatus {
  PENDING
  APPROVED
  SUSPENDED
  REJECTED
}
```

### 3.4 Product Tables

```prisma
model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?    @db.Text
  image       String?
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  vendorId    String
  vendor      VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  
  name        String
  slug        String
  description String?  @db.Text
  images      String[] // JSON array of image URLs
  
  // 가격 정보
  basePrice   Decimal  @db.Decimal(10, 2)
  salePrice   Decimal? @db.Decimal(10, 2)
  costPrice   Decimal? @db.Decimal(10, 2) // 원가
  
  // 재고 정보
  sku         String   @unique
  stock       Int      @default(0)
  reservedStock Int    @default(0) // 주문 확정 전 예약 재고
  
  // 상품 상태
  status      ProductStatus @default(ACTIVE)
  
  // 메타데이터
  weight      Decimal? @db.Decimal(8, 2)
  dimensions  Json?    // {length, width, height}
  tags        String[]
  attributes  Json?    // 커스텀 속성
  
  // 통계
  viewCount   Int      @default(0)
  soldCount   Int      @default(0)
  rating      Decimal  @default(0) @db.Decimal(3, 2)
  reviewCount Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  orderItems  OrderItem[]
  wishlistItems WishlistItem[]
  cartItems   CartItem[]
  promotions  ProductPromotion[]
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  OUT_OF_STOCK
  DISCONTINUED
}

model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  name        String   // 색상: 블랙, 사이즈: M
  sku         String   @unique
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  attributes  Json     // {color: "black", size: "M"}
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3.5 Order Tables (Multi-Vendor Structure)

```prisma
model Order {
  id              String   @id @default(cuid())
  orderNumber     String   @unique
  
  // 고객 정보
  customerId      String
  customer        User     @relation(fields: [customerId], references: [id])
  
  // 배송 정보
  shippingAddress Json     // 주문 시점의 배송지 정보 스냅샷
  shippingMethod  String
  shippingFee     Decimal  @db.Decimal(10, 2)
  
  // 결제 정보
  paymentMethod   String
  paymentStatus   PaymentStatus @default(PENDING)
  paymentId       String?  // Stripe Payment Intent ID
  
  // 주문 상태
  status          OrderStatus @default(PENDING)
  
  // 금액 정보
  subtotal        Decimal  @db.Decimal(15, 2) // 상품 총액
  discountAmount  Decimal  @db.Decimal(10, 2) @default(0)
  taxAmount       Decimal  @db.Decimal(10, 2) @default(0)
  totalAmount     Decimal  @db.Decimal(15, 2) // 최종 결제 금액
  
  // 메모
  customerNote    String?  @db.Text
  adminNote       String?  @db.Text
  
  // 타임스탬프
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  paidAt          DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  
  items           OrderItem[]
  payments        Payment[]
}

model OrderItem {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // 벤더 정보 (멀티벤더 구조의 핵심)
  vendorId        String
  vendor          VendorProfile @relation(fields: [vendorId], references: [id])
  
  // 상품 정보 (주문 시점의 스냅샷)
  productId       String
  productName     String
  productImage    String
  productSku      String
  
  // 구매 정보
  quantity        Int
  unitPrice       Decimal  @db.Decimal(10, 2)
  totalPrice      Decimal  @db.Decimal(15, 2)
  
  // 배송 상태 (벤더별 개별 배송)
  shippingStatus  ShippingStatus @default(PENDING)
  trackingNumber  String?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  
  // 정산 정보
  commissionRate  Decimal  @db.Decimal(4, 3)
  commissionAmount Decimal @db.Decimal(10, 2)
  vendorAmount    Decimal  @db.Decimal(15, 2) // 벤더 정산 금액
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  settlementItems SettlementItem[]
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum ShippingStatus {
  PENDING
  PREPARING
  SHIPPED
  IN_TRANSIT
  DELIVERED
  CANCELLED
  RETURNED
}
```

### 3.6 Payment Tables

```prisma
model Payment {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Stripe 정보
  stripePaymentIntentId String  @unique
  stripeCustomerId      String?
  
  // 결제 정보
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @default("KRW")
  method          String   // card, kakao_pay, naver_pay 등
  
  // 상태
  status          PaymentStatus
  failureReason   String?  @db.Text
  
  // 환불 정보
  refundedAmount  Decimal  @db.Decimal(15, 2) @default(0)
  refundedAt      DateTime?
  
  // 타임스탬프
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 3.7 Cart & Wishlist Tables

```prisma
model CartItem {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity    Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, productId])
}

model WishlistItem {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([userId, productId])
}
```

### 3.8 Chat System Tables

```prisma
model ChatRoom {
  id          String   @id @default(cuid())
  participants Json     // [{userId, role, readAt}]
  type        ChatType @default(DIRECT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  messages    Message[]
  users       User[]   @relation("UserChatRooms")
}

model Message {
  id          String   @id @default(cuid())
  chatRoomId  String
  chatRoom    ChatRoom @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  
  senderId    String
  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  receiverId  String?
  receiver    User?    @relation("ReceivedMessages", fields: [receiverId], references: [id])
  
  content     String   @db.Text
  type        MessageType @default(TEXT)
  isRead      Boolean  @default(false)
  readAt      DateTime?
  
  createdAt   DateTime @default(now())
}

enum ChatType {
  DIRECT      // 1:1 채팅
  GROUP       // 그룹 채팅
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
}
```

### 3.9 Promotion Tables

```prisma
model Promotion {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  description String?  @db.Text
  
  // 할인 유형
  type        PromotionType
  value       Decimal  @db.Decimal(10, 2)
  
  // 적용 범위
  applicableTo Json?    // {type: "all" | "category" | "product", ids: []}
  
  // 조건
  minPurchase Decimal?  @db.Decimal(10, 2)
  maxDiscount Decimal?  @db.Decimal(10, 2)
  
  // 기간
  startDate   DateTime
  endDate     DateTime
  
  // 사용 제한
  usageLimit  Int?
  usedCount   Int      @default(0)
  perUserLimit Int?
  
  // 상태
  status      PromotionStatus @default(ACTIVE)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  products    ProductPromotion[]
}

model ProductPromotion {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  promotionId String
  promotion   Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([productId, promotionId])
}

enum PromotionType {
  PERCENTAGE
  FIXED_AMOUNT
  BOGO
}

enum PromotionStatus {
  ACTIVE
  INACTIVE
  EXPIRED
}
```

### 3.10 Settlement & Analytics Tables

```prisma
model Settlement {
  id          String   @id @default(cuid())
  vendorId    String
  vendor      VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  
  // 정산 기간
  startDate   DateTime
  endDate     DateTime
  
  // 금액 정보
  totalSales  Decimal  @db.Decimal(15, 2)
  totalCommission Decimal @db.Decimal(15, 2)
  netAmount   Decimal  @db.Decimal(15, 2)
  
  // 상태
  status      SettlementStatus @default(PENDING)
  
  // 지급 정보
  paidAt      DateTime?
  bankAccount String?
  bankName    String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  items       SettlementItem[]
}

model SettlementItem {
  id          String   @id @default(cuid())
  settlementId String
  settlement  Settlement @relation(fields: [settlementId], references: [id], onDelete: Cascade)
  orderItemId String
  orderItem   OrderItem @relation(fields: [orderItemId], references: [id])
  
  saleAmount  Decimal  @db.Decimal(15, 2)
  commission  Decimal  @db.Decimal(10, 2)
  netAmount   Decimal  @db.Decimal(15, 2)
  
  createdAt   DateTime @default(now())
}

enum SettlementStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

### 3.11 Admin & Analytics Tables

```prisma
model Analytics {
  id          String   @id @default(cuid())
  date        DateTime @unique
  metrics     Json     // {orders, sales, visitors, conversionRate, etc.}
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SystemLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  entity      String
  entityId    String?
  changes     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
}
```

## 4. Feature Specifications

### 4.1 Customer Features

#### 4.1.1 User Profile
- **프로필 관리**: 이름, 이메일, 전화번호, 아바타 수정
- **배송지 관리**: 여러 배송지 등록, 기본 배송지 설정
- **비밀번호 변경**: 보안을 위한 비밀번호 변경 기능
- **계정 설정**: 알림 설정, 마케팅 수신 동의

#### 4.1.2 Order Management
- **주문 목록**: 전체 주문 내역 조회 (페이지네이션)
- **주문 상세**: 주문 상태, 배송 정보, 결제 내역 확인
- **주문 취소**: 배송 전 주문 취소 요청
- **배송 추적**: 실시간 배송 추적 (택배사 API 연동)
- **리뷰 작성**: 구매 완료 후 상품 리뷰 작성

#### 4.1.3 Wishlist
- **찜 목록**: 관심 상품 추가/삭제
- **가격 알림**: 찜한 상품 가격 하락 시 알림
- **재고 알림**: 품절 상품 재입고 시 알림

#### 4.1.4 Personalized Recommendations
- **AI 추천**: 구매 이력, 찜 목록 기반 추천
- **인기 상품**: 전체 인기 상품 표시
- **카테고리 추천**: 관심 카테고리 기반 추천

### 4.2 Vendor Features

#### 4.2.1 Product Management
- **상품 등록**: 상품 정보, 이미지, 가격, 재고 등록
- **상품 수정**: 기존 상품 정보 수정
- **재고 관리**: 실시간 재고 추적, 자동 알림
- **상품 옵션**: 색상, 사이즈 등 변형 옵션 관리
- **대량 등록**: CSV/Excel 파일로 대량 상품 등록

#### 4.2.2 Pricing & Promotion
- **가격 책정**: 기본 가격, 세일 가격 설정
- **프로모션 생성**: 할인 쿠폰, 세일 이벤트 생성
- **일괄 가격 변경**: 여러 상품의 가격 일괄 수정
- **경쟁사 가격 비교**: 시장 가격 분석 (선택적)

#### 4.2.3 Order Fulfillment
- **주문 수신**: 실시간 주문 알림
- **배송 준비**: 포장, 송장 입력
- **배송 처리**: 택배사 연동, 배송 상태 업데이트
- **교환/반품 처리**: 고객 요청에 따른 처리

#### 4.2.4 Sales Analytics
- **매출 대시보드**: 일/주/월별 매출 현황
- **상품 분석**: 인기 상품, 판매 순위
- **고객 분석**: 구매 고객 통계
- **트렌드 분석**: 시즌별 판매 트렌드

#### 4.2.5 Settlement Management
- **정산 내역**: 주기별 정산 금액 확인
- **정산 상세**: 주문별 정산 내역
- **지급 계좌**: 정산 계좌 정보 관리
- **세금 보고**: 매출 세금 보고서 (선택적)

### 4.3 Admin Features

#### 4.3.1 Platform Dashboard
- **전체 현황**: 총 매출, 주문 수, 활성 사용자, 벤더 수
- **실시간 통계**: 실시간 주문, 방문자 수
- **트렌드 차트**: 매출, 주문 추이 그래프
- **KPI 지표**: 전환율, 평균 주문 금액 등

#### 4.3.2 Vendor Management
- **벤더 승인**: 신규 벤더 가입 승인/거절
- **벤더 목록**: 전체 벤더 조회, 검색, 필터
- **벤더 상세**: 벤더 정보, 판매 현황, 평점
- **벤더 정지**: 규정 위반 벤더 정지/해제
- **수수료 설정**: 벤더별 수수료율 조정

#### 4.3.3 Product Monitoring
- **전체 상품**: 플랫폼 전체 상품 모니터링
- **신고 상품**: 부적절한 상품 신고 처리
- **카테고리 관리**: 카테고리 구조 관리
- **상품 검색**: 상품 검색, 필터링

#### 4.3.4 User Management
- **사용자 목록**: 전체 사용자 조회
- **사용자 상세**: 활동 내역, 주문 내역
- **계정 정지**: 위반 사용자 계정 정지
- **권한 관리**: 관리자 권한 부여/회수

#### 4.3.5 Analytics & Reports
- **매출 리포트**: 기간별 매출 리포트
- **벤더 리포트**: 벤더별 성과 리포트
- **카테고리 리포트**: 카테고리별 판매 현황
- **사용자 리포트**: 사용자 행동 분석
- **내보내기**: 리포트 CSV/PDF 내보내기

### 4.4 Real-time Chat System

#### 4.4.1 Chat Features
- **1:1 채팅**: 고객-판매자 직접 채팅
- **실시간 메시지**: Socket.io 기반 실시간 통신
- **메시지 유형**: 텍스트, 이미지, 파일 전송
- **읽음 확인**: 메시지 읽음 상태 표시
- **채팅 기록**: 과거 채팅 내역 조회

#### 4.4.2 Chat Management
- **채팅방 목록**: 활성 채팅방 목록
- **알림**: 새 메시지 알림
- **차단**: 스팸 차단 기능
- **신고**: 부적절한 채팅 신고

### 4.5 Payment Integration

#### 4.5.1 Stripe Integration
- **결제 처리**: Stripe Payment Intent 사용
- **다중 결제 수단**: 카드, 카카오페이, 네이버페이 등
- **결제 보안**: PCI DSS 준수
- **환불 처리**: 전체/부분 환불 지원

#### 4.5.2 Payment Features
- **장바구니 결제**: 여러 상품 일괄 결제
- **결제 검증**: 결제 금액 검증
- **웹훅 처리**: Stripe 웹훅으로 상태 동기화
- **결제 실패 처리**: 실패 시 재시도 로직

## 5. API Design

### 5.1 Authentication Endpoints

```
POST   /api/auth/register          # 회원가입
POST   /api/auth/login             # 로그인
POST   /api/auth/logout            # 로그아웃
POST   /api/auth/refresh           # 토큰 갱신
GET    /api/auth/me                # 현재 사용자 정보
POST   /api/auth/forgot-password   # 비밀번호 찾기
POST   /api/auth/reset-password    # 비밀번호 재설정
```

### 5.2 Customer Endpoints

```
# Profile
GET    /api/customer/profile       # 프로필 조회
PUT    /api/customer/profile       # 프로필 수정
GET    /api/customer/addresses     # 배송지 목록
POST   /api/customer/addresses     # 배송지 추가
PUT    /api/customer/addresses/:id # 배송지 수정
DELETE /api/customer/addresses/:id # 배송지 삭제

# Orders
GET    /api/customer/orders        # 주문 목록
GET    /api/customer/orders/:id    # 주문 상세
POST   /api/customer/orders        # 주문 생성
POST   /api/customer/orders/:id/cancel  # 주문 취소

# Wishlist
GET    /api/customer/wishlist      # 찜 목록
POST   /api/customer/wishlist      # 찜 추가
DELETE /api/customer/wishlist/:id  # 찜 삭제

# Cart
GET    /api/customer/cart          # 장바구니 조회
POST   /api/customer/cart          # 장바구니 추가
PUT    /api/customer/cart/:id      # 장바구니 수정
DELETE /api/customer/cart/:id      # 장바구니 삭제

# Recommendations
GET    /api/customer/recommendations  # 맞춤 추천
```

### 5.3 Vendor Endpoints

```
# Dashboard
GET    /api/vendor/dashboard       # 대시보드 통계

# Products
GET    /api/vendor/products        # 상품 목록
POST   /api/vendor/products        # 상품 등록
GET    /api/vendor/products/:id    # 상품 상세
PUT    /api/vendor/products/:id    # 상품 수정
DELETE /api/vendor/products/:id    # 상품 삭제
POST   /api/vendor/products/batch  # 대량 등록

# Orders
GET    /api/vendor/orders          # 주문 목록
GET    /api/vendor/orders/:id      # 주문 상세
PUT    /api/vendor/orders/:id/ship # 배송 처리

# Pricing
GET    /api/vendor/pricing         # 가격 설정 조회
PUT    /api/vendor/pricing         # 가격 설정 수정

# Promotions
GET    /api/vendor/promotions      # 프로모션 목록
POST   /api/vendor/promotions      # 프로모션 생성
PUT    /api/vendor/promotions/:id  # 프로모션 수정
DELETE /api/vendor/promotions/:id  # 프로모션 삭제

# Analytics
GET    /api/vendor/analytics/sales     # 매출 분석
GET    /api/vendor/analytics/products  # 상품 분석
GET    /api/vendor/analytics/customers # 고객 분석

# Settlements
GET    /api/vendor/settlements     # 정산 내역
GET    /api/vendor/settlements/:id # 정산 상세
```

### 5.4 Admin Endpoints

```
# Dashboard
GET    /api/admin/dashboard        # 플랫폼 대시보드

# Vendors
GET    /api/admin/vendors          # 벤더 목록
GET    /api/admin/vendors/:id      # 벤더 상세
PUT    /api/admin/vendors/:id/approve   # 벤더 승인
PUT    /api/admin/vendors/:id/suspend   # 벤더 정지
PUT    /api/admin/vendors/:id/commission # 수수료 설정

# Products
GET    /api/admin/products         # 상품 모니터링
PUT    /api/admin/products/:id/approve  # 상품 승인
DELETE /api/admin/products/:id     # 상품 삭제

# Users
GET    /api/admin/users            # 사용자 목록
GET    /api/admin/users/:id        # 사용자 상세
PUT    /api/admin/users/:id/suspend    # 사용자 정지

# Analytics
GET    /api/admin/analytics/sales      # 매출 리포트
GET    /api/admin/analytics/vendors    # 벤더 리포트
GET    /api/admin/analytics/categories # 카테고리 리포트
GET    /api/admin/analytics/users      # 사용자 리포트

# Reports
GET    /api/admin/reports/:type    # 리포트 생성
```

### 5.5 Payment Endpoints

```
POST   /api/payments/create-intent    # 결제 Intent 생성
POST   /api/payments/confirm          # 결제 확인
POST   /api/payments/:id/refund       # 환불 처리
GET    /api/payments/:id/status       # 결제 상태 조회
POST   /api/payments/webhook          # Stripe 웹훅
```

### 5.6 Chat Endpoints

```
# Socket.io Events
connect                    # 연결
disconnect                 # 연결 해제
join_room                  # 채팅방 참여
leave_room                 # 채팅방 나가기
send_message               # 메시지 전송
receive_message            # 메시지 수신
message_read               # 읽음 확인
typing_start               # 입력 중
typing_stop                # 입력 중지

# REST API
GET    /api/chat/rooms          # 채팅방 목록
GET    /api/chat/rooms/:id      # 채팅방 상세
GET    /api/chat/rooms/:id/messages  # 메시지 내역
POST   /api/chat/rooms          # 채팅방 생성
PUT    /api/chat/rooms/:id/read # 읽음 처리
```

## 6. Security & Authorization

### 6.1 Role-Based Access Control (RBAC)

```typescript
enum Role {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN'
}

// 권한 매트릭스
const permissions = {
  CUSTOMER: [
    'profile:read', 'profile:update',
    'order:create', 'order:read', 'order:cancel',
    'wishlist:read', 'wishlist:create', 'wishlist:delete',
    'cart:read', 'cart:create', 'cart:update', 'cart:delete',
    'chat:send', 'chat:read'
  ],
  VENDOR: [
    'product:create', 'product:read', 'product:update', 'product:delete',
    'order:read', 'order:fulfill',
    'promotion:create', 'promotion:read', 'promotion:update', 'promotion:delete',
    'analytics:read',
    'settlement:read',
    'chat:send', 'chat:read'
  ],
  ADMIN: [
    'vendor:approve', 'vendor:suspend', 'vendor:read',
    'product:monitor', 'product:delete',
    'user:read', 'user:suspend',
    'analytics:read',
    'report:generate',
    'system:configure'
  ]
}
```

### 6.2 Authentication Flow

1. **회원가입**: 이메일 인증 후 계정 생성
2. **로그인**: NextAuth.js로 JWT 토큰 발급
3. **토큰 검증**: API 호출마다 토큰 검증
4. **세션 관리**: Redis에 세션 저장
5. **토큰 갱신**: Access Token 만료 시 Refresh Token으로 갱신

### 6.3 Data Access Control

- **고객 데이터**: 본인 데이터만 접근 가능
- **벤더 데이터**: 자신의 상품/주문만 접근 가능
- **관리자 데이터**: 전체 데이터 접근 가능
- **채팅 데이터**: 참여자만 메시지 접근 가능

### 6.4 Payment Security

- **PCI DSS 준수**: Stripe를 통한 결제 처리
- **결제 금액 검증**: 서버에서 결제 금액 재검증
- **웹훅 서명**: Stripe 웹훅 서명 검증
- **민감 정보 암호화**: 결제 정보 암호화 저장

### 6.5 Rate Limiting

- **API Rate Limit**: IP/사용자별 요청 제한
- **로그인 시도 제한**: brute force 방지
- **채팅 메시지 제한**: 스팸 방지

## 7. Development Phases

### Phase 1: Foundation (Week 1-2)
- 프로젝트 초기 설정 (Next.js, TypeScript, Prisma)
- 데이터베이스 스키마 설계 및 마이그레이션
- 인증 시스템 구현 (NextAuth.js)
- 기본 레이아웃 및 라우트 구조

### Phase 2: Core Features (Week 3-4)
- 상품 관리 시스템 (CRUD)
- 장바구니 및 위시리스트
- 주문 시스템 기본 구조
- 멀티벤더 주문 로직

### Phase 3: Payment & Chat (Week 5-6)
- Stripe 결제 통합
- 결제 웹훅 처리
- Socket.io 채팅 시스템
- 실시간 알림

### Phase 4: Vendor Features (Week 7-8)
- 판매자 대시보드
- 재고 관리
- 가격 및 프로모션 관리
- 정산 시스템

### Phase 5: Admin Features (Week 9-10)
- 관리자 대시보드
- 벤더 승인 시스템
- 상품 모니터링
- 통계 및 리포트

### Phase 6: Testing & Deployment (Week 11-12)
- 단위 테스트 및 통합 테스트
- 성능 최적화
- 보안 감사
- Vercel 배포
- 모니터링 설정

## 8. Additional Considerations

### 8.1 Performance Optimization
- **이미지 최적화**: Next.js Image Optimization
- **캐싱 전략**: Redis 캐싱, CDN
- **데이터베이스 인덱싱**: 자주 조회하는 필드 인덱싱
- **코드 분할**: 동적 import로 코드 분할

### 8.2 Monitoring & Logging
- **에러 추적**: Sentry 연동
- **성능 모니터링**: Vercel Analytics
- **로그 관리**: SystemLog 테이블
- **Uptime 모니터링**: 서비스 가용성 확인

### 8.3 Scalability
- **데이터베이스 샤딩**: 대용량 데이터 처리
- **Redis 클러스터**: 캐싱 확장
- **Socket.io 스케일링**: Redis Adapter 사용
- **CDN 사용**: 정적 리소스 배포

### 8.4 Internationalization (i18n)
- **다국어 지원**: next-intl 라이브러리
- **통화 처리**: 다국 통화 지원
- **시간대 처리**: 사용자 시간대 반영

### 8.5 Mobile Support
- **반응형 디자인**: 모바일 최적화
- **PWA 지원**: 오프라인 기능
- **모바일 앱**: React Native (선택적)

## 9. Success Metrics

### 9.1 Technical Metrics
- **페이지 로드 시간**: < 2초
- **API 응답 시간**: < 200ms
- **가동 시간**: 99.9%
- **에러율**: < 0.1%

### 9.2 Business Metrics
- **전환율**: > 3%
- **고객 유지율**: > 60%
- **벤더 만족도**: > 4.5/5
- **평균 주문 금액**: 지속적 증가
