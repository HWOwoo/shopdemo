# 다굿즈 (DaGoods) 서비스 요구 명세서

> 코믹월드·행사 창작자들이 통신판매 폼을 올리고, 구매 희망자가 신청하는 굿즈 통판 플랫폼

---

## 1. 서비스 개요

### 핵심 콘셉트

코믹월드, 코믹아트서울 등 오프라인 동인 행사에 참가하는 창작자(서클)가 행사 종료 후 또는 행사 전에 **통신판매(통판)** 를 진행할 수 있도록 폼을 올리는 플랫폼이다. 행사에 직접 참가하지 못한 팬들이 온라인으로 굿즈를 구매하거나, 창작자가 생산 수량 결정을 위해 **사전수요조사** 를 진행하는 기능도 제공한다.

### 사용자 유형

| 역할 | 설명 |
|------|------|
| **구매자 (BUYER)** | 굿즈를 구경하고 통판 신청하는 일반 유저 |
| **판매자 (SELLER)** | 굿즈를 제작·판매하는 창작자/서클 |
| **관리자 (ADMIN)** | 굿즈 심사, 판매자 승인, 플랫폼 관리 담당 |

---

## 2. 현재 구현 현황

### ✅ 완료된 기능

#### 인증
- 회원가입 / 로그인 (JWT)
- 프로필 수정
- 판매자 신청 → 어드민 승인 후 SELLER 역할 부여

#### 굿즈 관리
- 굿즈 등록 / 수정 / 삭제
- 옵션별 가격·재고 설정 (GoodsOption)
- 굿즈 유형: `SALE`(통판) / `PREORDER`(사전수요조사) — ✅ 전체 흐름 구현 완료
- 굿즈 상태: `PENDING`(심사 중) → `APPROVED`(판매 중) / `REJECTED`(반려) / `SOLDOUT`(품절) / `CLOSED`(마감)
- 저작권 허락 여부 필드 (requiresCopyrightPermission, rightsHolderEmail)
- 이미지 업로드

#### 주문
- 주문 생성 + 재고 자동 차감
- 주문 상태 흐름: `PENDING_PAYMENT` → `PAYMENT_CONFIRMED` → `SHIPPED` → `DELIVERED`
- 취소 흐름: `CANCEL_REQUESTED` → 어드민 승인/거절 → `CANCELLED`
- 구매 방식: `DIRECT`(직접 계좌이체) / `PLATFORM`(안심거래)
- 구매자: 수령 확인, 취소 (입금 대기·확인 상태)
- 판매자: 입금 확인, 송장 등록, 취소 요청
- 어드민: 취소 요청 승인/거절

#### 리뷰
- 리뷰 작성 (구매 이력 있는 상품만) / 수정 / 삭제
- 리뷰 작성 가능 상품 목록 (`/my/reviews` 페이지에서 노출)
- 상품 상세 페이지에서 리뷰 목록 표시

#### 알림
- 실시간 폴링 방식 (30초 간격)
- 알림 유형: 입금 확인, 배송 시작, 수령 확인, 취소, 리뷰 등록, 수요조사 신청/확정/마감

#### 어드민
- 대시보드 (회원 통계, 굿즈 심사 대기, 판매자 신청 대기, 취소 요청 카운트)
- 굿즈 심사 (승인/반려 + 반려 사유)
- 판매자 신청 심사
- 주문 취소 요청 관리
- 전체 주문 조회 (상태 탭 필터 + 검색, 상세 드로어)
- 회원 관리 (역할 변경 BUYER↔SELLER, 계정 활성/정지)
- 공지사항 관리 (작성/수정/삭제, 상단 고정)

---

## 3. 미완성 / 개선 필요 기능

### 3-1. ✅ 사전수요조사 (Preorder) — **구현 완료**

> 핵심 기능. 창작자가 "이 굿즈 만들어도 될까?"를 확인하는 수요조사 폼.

#### 흐름
```
창작자 글 작성 (PREORDER 타입)
  └─ 수요조사 기간 설정 (시작일 ~ 마감일)
  └─ 구매 희망자: 옵션 선택 + 수량 입력 후 "신청"
  └─ 마감일 도달 → 스케줄러 자동 마감 (1시간 간격)
  └─ 창작자: 수요 집계 확인 후 "생산 확정" or "취소"
        ├─ 생산 확정 → SALE 타입으로 전환, 신청자에게 알림
        └─ 취소 → 신청자에게 알림
```

#### 구현된 항목
- **백엔드**
  - `PreorderEntry` + `PreorderEntryItem` 엔티티 (수요조사 신청 기록 + 옵션별 수량)
  - `Goods.preorderDeadline` 필드 (마감일)
  - `PreorderScheduler`: 마감일 지난 PREORDER 자동 CLOSED (매 정시)
  - `PreorderService.confirmPreorder()`: 생산 확정 → SALE 전환 + 알림
  - 알림 타입: `PREORDER_REGISTERED`, `PREORDER_CONFIRMED`, `PREORDER_CLOSED`
- **프론트**
  - 굿즈 등록 폼에 마감일 입력 필드 (PREORDER 선택 시)
  - 굿즈 상세 페이지: 수요조사 신청/취소 UI, 마감일·신청 인원 표시
  - 판매자 대시보드: 신청 인원 표시, 생산 확정 버튼
  - 판매자 수요조사 집계 페이지 (`/seller/preorders/:goodsId` — `SellerPreordersPage`):
    옵션별 수요 집계, 신청자 목록, CLOSED 상태에서 생산 확정/취소 버튼
  - 구매자: 내 수요조사 신청 목록 (`/my/preorders`)

---

### 3-2. ✅ 정산 (Settlement) — **구현 완료** (판매자 신청 흐름 2026-04-30 추가)

> 판매자가 판매 금액을 정산받는 흐름.

#### 흐름 (판매자 풀 방식 + 어드민 직접 생성 백업)
```
DELIVERED 상태 주문 누적 (각 주문에 settlement FK = null)
  └─ 판매자: "신청 가능 금액" 확인 → "정산 신청" 클릭
        └─ Settlement(REQUESTED) 생성, 누적 주문 모두 settlement_id 잠금
        └─ 어드민 전원에게 SETTLEMENT_REQUESTED 알림
  └─ 어드민: 신청 검토
        ├─ 승인 → REQUESTED → PENDING (송금 대기), SETTLEMENT_APPROVED 알림
        │     └─ 실제 송금 후 "정산 완료" 클릭 → PENDING → PAID, SETTLEMENT_PAID 알림
        └─ 거절 → REQUESTED → REJECTED (사유 첨부), 묶였던 주문 settlement=null 복귀
              └─ 판매자에게 SETTLEMENT_REJECTED 알림 + 사유 전달
              └─ 판매자는 사유 확인 후 다시 신청 가능

[백업] 어드민이 직접 정산 생성하는 기존 흐름도 유지 (PENDING부터 시작)
```

#### 구현된 항목
- **백엔드**
  - `Settlement` 엔티티 (seller, amount, orderCount, periodStart/End, status, requestedAt, paidAt, rejectedAt, rejectedReason)
  - `SettlementStatus`: `REQUESTED` / `PENDING` / `PAID` / `REJECTED`
  - `Order.settlement` FK 추가 — 주문이 한 정산에만 묶이도록 잠금 (이중 정산 방지)
  - `SettlementService`: `requestSettlement(seller)` / `approveRequest(id)` / `rejectRequest(id, reason)` / `markAsPaid(id)` / `getAvailable(seller)` / 어드민 직접 `createSettlement`
  - `OrderRepository.findUnsettledDeliveredOrdersBySeller`, `findBySettlementId` — 신청·거절 시 주문 잠금/해제
  - `NotificationType` 4종 추가: `SETTLEMENT_REQUESTED` / `_APPROVED` / `_REJECTED` / `_PAID`
  - `AdminController`: `/admin/settlements/{id}/approve`, `/admin/settlements/{id}/reject`
  - `SellerController`: `/seller/settlements/available`, `/seller/settlements/request`
- **프론트**
  - 판매자 (`/seller/settlements`):
    - 신청 가능 금액 카드 (미정산 누적분 + 가장 오래된/최근 주문일 표시)
    - "정산 신청" 버튼 — 검토 중인 신청이 있으면 비활성
    - 거절 사유 표시
  - 어드민 (`/admin/settlements`):
    - 상태 탭(신청 검토 / 송금 대기 / 정산 완료 / 거절 / 전체) + 카운트
    - REQUESTED 행: 승인/거절 버튼, 거절 시 사유 입력 모달
    - PENDING 행: 정산 완료 버튼
    - 직접 생성 폼은 백업 흐름으로 유지 (안내 문구 추가)
  - `NotificationsPage`: 4종 SETTLEMENT 알림 아이콘/스타일 매핑

---

### 3-3. ✅ 창작자/서클 프로필 페이지 — **구현 완료**

> 판매자 별 페이지. 해당 창작자의 굿즈 목록, SNS 링크 등을 보여줌.

#### 구현된 항목
- **백엔드**
  - `User` 엔티티에 `twitterUrl`, `pixivUrl`, `instagramUrl` 필드 추가
  - `UserProfileResponse`에 role, SNS 필드 추가
  - `GET /api/goods/seller/{username}` — 판매자의 승인된 굿즈 목록
- **프론트**
  - `/seller/:username` — 창작자 프로필 페이지 (아바타, 소개, SNS 링크, 굿즈 그리드)
  - 판매자: 프로필 편집 페이지에 SNS 링크 입력 추가
  - 굿즈 상세 페이지: 판매자 이름/아바타 클릭 → 프로필 페이지 이동

---

### 3-4. ✅ 굿즈 태그 / 카테고리 + 검색 — **구현 완료**

> 원작(IP), 굿즈 유형, 행사 태그 등으로 필터링.

#### 분류 예시
- **원작 태그**: 블루아카, 호요버스 등 (자유 입력, 쉼표 구분)
- **굿즈 유형**: 아크릴 스탠드, 포토카드, 포스터, 키링, 에코백, 동인지, 기타
- **행사 태그**: 코믹월드 서울 2024 하반기, 코믹아트서울 등

#### 구현된 항목
- **백엔드**
  - `Goods.category` (String), `Goods.tags` (String, 쉼표 구분) 필드 추가
  - JPQL 키워드 검색 (상품명, 설명, 판매자명, 카테고리, 태그)
  - `findExpiredPreorders` 쿼리 (스케줄러용)
- **프론트**
  - 굿즈 등록 폼에 카테고리 드롭다운, 태그 텍스트 입력
  - ShopPage 서버 사이드 검색 연동 (클라이언트 필터링 → 서버 검색 전환)
  - 굿즈 상세 페이지에 카테고리·태그 배지 표시
  - **[2026-04-15 추가]** ShopPage 카테고리 필터 칩 UI 추가
    - 메인 탭(통판/사전수요조사) 하단에 가로 스크롤 칩 행 추가
    - URL `?category=` 파라미터 연동 — 탭 전환 / 검색어와 독립 동작
    - 클라이언트 사이드 필터링 (`goods.filter(item => item.category === selectedCategory)`)
    - 사전수요조사 탭에도 동일 카테고리 필터 적용
  - **[2026-04-15 추가]** 굿즈 상세 페이지 태그 클릭 → `/?q={tag}` 검색 이동

---

### 3-5. ✅ 찜 / 관심 목록 — **구현 완료**

> 장바구니 대신. 관심 굿즈를 저장하고 알림 받기.

#### 흐름
```
구매자: 굿즈 상세 페이지에서 하트 버튼 클릭 → 찜 추가/취소 토글
  └─ 찜한 굿즈가 PREORDER → SALE 전환 시 → 찜한 유저에게 알림 발송
```

#### 구현된 항목
- **백엔드**
  - `Wishlist` 엔티티 (`user`, `goods`, `createdAt`, 복합 유니크 제약)
  - `WishlistRepository`: 유저별 목록 조회, 굿즈별 찜한 유저 조회, 존재 여부 확인
  - `WishlistService`: 찜 토글, 목록 조회, 해제, 찜 여부 확인, `notifyGoodsOnSale()` (PREORDER→SALE 전환 시 알림)
  - `WishlistController`: `POST /api/wishlist/{goodsId}` (토글), `GET /api/wishlist` (목록), `GET /api/wishlist/{goodsId}/status` (찜 여부), `DELETE /api/wishlist/{goodsId}` (해제)
  - `SecurityConfig`: `/api/wishlist/**` authenticated 처리
  - `NotificationType.GOODS_ON_SALE` — 찜한 상품 판매 시작 알림 타입
  - `PreorderService.confirmPreorder()` — 생산 확정 시 `notifyGoodsOnSale()` 호출 연동
- **프론트**
  - `GoodsDetailPage`: 하트 버튼 (찜 토글, 찜 여부 상태 반영)
  - `MyWishlistPage` (`/my/wishlist`): 찜 목록 그리드, 찜 취소 버튼, 품절/수요조사 배지
  - `NotificationsPage`: `GOODS_ON_SALE` 알림 아이콘·스타일 매핑 추가
  - `App.jsx`: `/my/wishlist` 라우트 등록 (ProtectedRoute)
  - `Navbar`: 찜 목록 메뉴 링크 추가

---

### 3-6. ✅ 어드민 고도화 — **구현 완료 (2026-04-17)**

| 기능 | 현황 |
|------|------|
| 전체 주문 조회 | ✅ `AdminOrdersPage` — 상태 탭 필터, 검색, 상세 드로어 |
| 전체 회원 관리 | ✅ `AdminUsersPage` — 역할 변경(BUYER↔SELLER), 활성/정지 토글 |
| 공지사항 관리 | ✅ `AdminNoticesPage` + `AdminNoticeEditPage` — CRUD, 상단 고정 |
| 굿즈 전체 목록 | ✅ `AdminGoodsPage` (`/admin/goods`) — 상태 탭(ALL/PENDING/APPROVED/CLOSED/SOLDOUT/REJECTED) + 키워드 검색 |

---

### 3-7. ✅ 공지사항 — **구현 완료 (2026-04-17)**

> 서비스 공지, 판매자 준수 규정 등을 어드민이 작성하여 전체 공개.

#### 구현된 항목
- **백엔드**
  - `Notice` 엔티티 (`title`, `content`, `author`, `pinned`, `viewCount`, `createdAt`, `updatedAt`)
  - `NoticeRepository`: 전체 목록(고정 우선), 고정만, 상단 N개 조회
  - `NoticeService`: 목록/상세(조회수 증가)/작성/수정/삭제
  - `NoticeController` (공개): `GET /api/notices`, `GET /api/notices/banner?limit=`, `GET /api/notices/{id}`
  - `AdminController`: `POST/PUT/DELETE /api/admin/notices` (작성자는 요청 사용자의 username으로 저장)
  - `SecurityConfig`: `/api/notices*` GET permitAll
- **프론트**
  - `NoticesPage` (`/notices`): 목록, 고정 배지, 조회수·작성일
  - `NoticeDetailPage` (`/notices/:id`): DOMPurify sanitize된 HTML 렌더링
  - `AdminNoticesPage` (`/admin/notices`): 목록 + 수정/삭제
  - `AdminNoticeEditPage` (`/admin/notices/new`, `/admin/notices/:id/edit`): RichEditor 기반 작성/수정
  - `ShopPage`: 최상단 공지 배너(가로 스크롤, 고정 우선 N개)
  - `Navbar`: 사용자 메뉴에 공지사항 링크 추가

---

### 3-8. ✅ 1:1 채팅 — **구현 완료**

> 구매자 ↔ 판매자 간 1:1 메시지 기능.

#### 흐름
```
굿즈 상세 페이지 → 판매자 프로필 하단 메시지 버튼 클릭
  └─ getOrCreateRoom() 호출 → 채팅방 생성 or 기존 방 재사용
  └─ /chat/:roomId 로 이동 → 메시지 입력 및 수신
```

#### 구현된 항목
- **백엔드**
  - `ChatRoom` 엔티티 (`user1`, `user2`, unique constraint, `getOtherUser()` 편의 메서드)
  - `ChatMessage` 엔티티 (`room`, `sender`, `content`, `readByReceiver`)
  - `ChatRoomRepository`: 방 조회, 내 방 목록
  - `ChatMessageRepository`: 메시지 목록, 안읽은 수, 읽음 처리
  - `ChatService`: 방 생성/조회, 메시지 전송, 읽음 처리, 안읽은 수 집계
  - `ChatController`: 5개 엔드포인트 (`POST /rooms/{username}`, `GET /rooms`, `GET /rooms/{roomId}/messages`, `POST /rooms/{roomId}/messages`, `GET /unread-count`)
  - `SecurityConfig`: `/api/chat/**` authenticated 처리
- **프론트**
  - `api/chat.js`: API 호출 함수
  - `ChatListPage` (`/chat`): 대화 목록, 마지막 메시지·시간·안읽은 뱃지, 5초 폴링
    - **[2026-04-15]** `visibilitychange` 이벤트로 탭 비활성 시 폴링 자동 중단/재개
  - `ChatRoomPage` (`/chat/:roomId`): 카카오톡 스타일 버블, 날짜 구분선, 3초 폴링, Enter 전송
    - **[2026-04-15]** `getMyRooms()` 병행 조회로 대화 0건 상태에서도 상대방 이름 표시
    - **[2026-04-15]** `visibilitychange` 폴링 최적화 동일 적용
    - **[2026-04-15]** 헤더 상대방 이름 → `/seller/:username` 프로필 링크 연결
  - `SellerProfilePage`: 메시지 버튼 → `getOrCreateRoom()` 후 채팅방으로 이동 (자기 자신 글에서는 숨김)
  - `GoodsDetailPage`: 메시지 버튼 동일 연결
  - `Navbar`: 채팅 아이콘 + 안읽은 수 뱃지 추가 (30초 폴링)
  - `App.jsx`: `/chat`, `/chat/:roomId` 라우트 등록

---

### 3-10. ✅ 커스텀 확인 모달 (ConfirmModal) — **구현 완료 (2026-04-15)**

> `window.confirm()` 대신 앱 통일성 있는 커스텀 모달.

#### 구현된 항목
- `frontend/src/components/ui/ConfirmModal.jsx`
  - `useConfirm()` 훅: `{ confirm, ConfirmModal }` 반환
  - `confirm(message, subMessage?)` — Promise 기반 async/await 사용 가능
  - 디자인: 흰색 카드, 주황 경고 아이콘, 취소(회색) / 확인(인디고) 버튼
- 적용 파일 (16곳): `MyOrdersPage`, `MyReviewsPage`, `MyPreordersPage`, `MyWishlistPage`, `GoodsDetailPage`, `SellerDashboard`, `SellerOrdersPage`, `SellerPreordersPage`, `AdminCancelRequestsPage`, `AdminSettlementsPage`

---

### 3-11. ✅ 사전수요조사 생산 취소 — **구현 완료 (2026-04-15)**

> 판매자가 생산 확정 대신 취소를 선택했을 때 신청자에게 알림 발송.

#### 구현된 항목
- **백엔드**
  - `PreorderService.cancelPreorder(sellerUsername, goodsId)`: 판매자 소유권 확인, PREORDER·CLOSED 상태 검증, 신청자 전원에게 `PREORDER_CLOSED` 알림 발송
  - `GoodsController`: `POST /api/goods/my/{id}/preorder-cancel` 엔드포인트
- **프론트**
  - `SellerPreordersPage`: CLOSED 상태에서 생산 확정 + 취소 버튼 나란히 표시, `useConfirm` 연결

---

### 3-9. 기타 (장기 과제)

| 기능 | 설명 |
|------|------|
| 소셜 로그인 | 카카오 / 네이버 / Google OAuth (현재 버튼만 존재) |
| 실 이메일 인증 | 현재 mock 처리 |
| 결제 모듈 연동 | 토스페이먼츠 또는 포트원 (현재 무통장 입금만) |
| 실시간 알림/채팅 | 현재 폴링 → WebSocket / SSE 전환 |
| 이미지 다중 업로드 | ✅ GoodsForm에 추가 이미지 최대 5장 업로드 구현됨 |

---

## 4. 화면 목록 (전체)

### 공통
| 경로 | 페이지 | 상태 |
|------|--------|------|
| `/` | 굿즈 목록 (ShopPage) | ✅ 구현됨 |
| `/goods/:id` | 굿즈 상세 | ✅ 구현됨 |
| `/login` | 로그인 | ✅ 구현됨 |
| `/register` | 회원가입 | ✅ 구현됨 |
| `/seller/:username` | 창작자 프로필 | ✅ 구현됨 |
| `/notices` | 공지사항 목록 | ✅ 구현됨 |
| `/notices/:id` | 공지사항 상세 | ✅ 구현됨 |

### 구매자
| 경로 | 페이지 | 상태 |
|------|--------|------|
| `/my` | 마이페이지 허브 | ✅ 구현됨 |
| `/my/orders` | 구매 내역 | ✅ 구현됨 |
| `/my/reviews` | 내 리뷰 + 리뷰 작성 | ✅ 구현됨 |
| `/my/wishlist` | 찜 목록 | ✅ 구현됨 |
| `/my/preorders` | 내 수요조사 신청 목록 | ✅ 구현됨 |
| `/chat` | 채팅 목록 | ✅ 구현됨 |
| `/chat/:roomId` | 1:1 채팅방 | ✅ 구현됨 |
| `/notifications` | 알림 | ✅ 구현됨 |
| `/profile/edit` | 프로필 편집 | ✅ 구현됨 |

### 판매자
| 경로 | 페이지 | 상태 |
|------|--------|------|
| `/seller/apply` | 판매자 신청 | ✅ 구현됨 |
| `/seller/dashboard` | 판매자 대시보드 | ✅ 구현됨 |
| `/seller/goods/new` | 굿즈 등록 | ✅ 구현됨 |
| `/seller/goods/:id` | 굿즈 상세 (판매자) | ✅ 구현됨 |
| `/seller/goods/:id/edit` | 굿즈 수정 | ✅ 구현됨 |
| `/seller/orders` | 주문 관리 | ✅ 구현됨 |
| `/seller/settlements` | 정산 내역 | ✅ 구현됨 |
| `/seller/preorders/:goodsId` | 수요조사 집계 | ✅ 구현됨 |

### 어드민
| 경로 | 페이지 | 상태 |
|------|--------|------|
| `/admin/dashboard` | 관리자 대시보드 | ✅ 구현됨 |
| `/admin/goods/pending` | 굿즈 심사 목록 | ✅ 구현됨 |
| `/admin/goods/:id/review` | 굿즈 심사 상세 | ✅ 구현됨 |
| `/admin/seller-applications` | 판매자 신청 목록 | ✅ 구현됨 |
| `/admin/seller-applications/:id/review` | 판매자 신청 심사 | ✅ 구현됨 |
| `/admin/orders/cancel-requests` | 취소 요청 관리 | ✅ 구현됨 |
| `/admin/orders` | 전체 주문 조회 | ✅ 구현됨 |
| `/admin/users` | 전체 회원 관리 | ✅ 구현됨 |
| `/admin/settlements` | 정산 관리 | ✅ 구현됨 |
| `/admin/notices` | 공지사항 관리 | ✅ 구현됨 |
| `/admin/notices/new`, `/admin/notices/:id/edit` | 공지 작성/수정 | ✅ 구현됨 |
| `/admin/goods` | 굿즈 전체 조회 | ✅ 구현됨 |

---

## 5. 도메인 모델 현황 및 확장 방향

### 현재 엔티티

```
User ──< SellerApplication
User ──< Goods (as seller)
User ──< Order (as buyer)
Goods ──< GoodsOption
Goods ──< Order
Order ──< OrderItem ──> GoodsOption
Goods ──< Review ──> User (reviewer)
User ──< Notification
```

### 추가 예정 엔티티

```
Goods ──< PreorderEntry ──< PreorderEntryItem ──> GoodsOption  # ✅ 구현됨
User ──< Wishlist ──> Goods           # 찜 ✅ 구현됨
User ──< Settlement                   # 정산 ✅ 구현됨
User ──< ChatRoom ──< ChatMessage     # 1:1 채팅 ✅ 구현됨
User ──< Notice (as author)           # 공지사항 ✅ 구현됨
```

---

## 6. 주문 상태 흐름

```
[통판 - SALE]
PENDING_PAYMENT
  ├─ 구매자 취소 → CANCELLED
  └─ 판매자 입금 확인 → PAYMENT_CONFIRMED
       ├─ 판매자 취소 요청 → CANCEL_REQUESTED
       │     ├─ 어드민 승인 → CANCELLED (재고 복구)
       │     └─ 어드민 거절 → PAYMENT_CONFIRMED (복구)
       └─ 판매자 송장 등록 → SHIPPED
            └─ 구매자 수령 확인 → DELIVERED
                 └─ 리뷰 작성 가능

[수요조사 - PREORDER]
수요조사 신청 (PreorderEntry 생성)
  └─ 마감일 도달 → 자동 CLOSED
       ├─ 판매자 생산 확정 → Goods APPROVED, 신청자에게 주문 유도 알림
       └─ 판매자 취소 → 신청자에게 취소 알림
```

---

## 7. 우선순위 요약

| 우선순위 | 기능 | 이유 |
|----------|------|------|
| ~~**P0 (핵심)**~~ | ~~사전수요조사 완성~~ | ✅ 구현 완료 |
| ~~**P0 (핵심)**~~ | ~~굿즈 태그/카테고리 + 검색~~ | ✅ 구현 완료 |
| ~~**P1 (중요)**~~ | ~~정산 시스템~~ | ✅ 구현 완료 |
| ~~**P1 (중요)**~~ | ~~창작자 프로필 페이지~~ | ✅ 구현 완료 |
| ~~**P2 (개선)**~~ | ~~찜 목록~~ | ✅ 구현 완료 |
| **P2 (개선)** | 이미지 다중 업로드 | 굿즈 상세 표현력 |
| **P3 (장기)** | 실시간 알림 (SSE) | UX 개선 |
| **P3 (장기)** | 결제 모듈 연동 | 안심거래 신뢰도 |
| **P3 (장기)** | 소셜 로그인 | 가입 허들 감소 |

---

## 8. 변경 이력

### 2026-04-09

#### 신규 기능 구현

**정산 시스템 (Settlement) — P1 완료**
- **백엔드**
  - `Settlement` 엔티티 (`seller`, `amount`, `orderCount`, `periodStart/End`, `status: PENDING/PAID`, `paidAt`)
  - `SettlementStatus` enum (`PENDING`, `PAID`)
  - `SettlementRepository` (판매자별 조회, 상태별 조회, 전체 조회)
  - `SettlementService`: 배송완료(`DELIVERED`) 주문을 기간별로 집계하여 정산 생성, 정산 완료 처리, 알림 발송
  - `CreateSettlementRequest`, `SettlementResponse` DTO
  - `AdminController`에 정산 엔드포인트 추가: `GET /api/admin/settlements`, `POST /api/admin/settlements`, `POST /api/admin/settlements/{id}/pay`
  - `SellerController`에 정산 조회 엔드포인트 추가: `GET /api/seller/settlements`
  - `OrderRepository`에 `findDeliveredOrdersBySellerAndPeriod` 쿼리 추가
  - `SecurityConfig`에 `/api/seller/settlements` GET 허용 (SELLER)
- **프론트엔드**
  - `SellerSettlementsPage` (`/seller/settlements`): 정산 완료/대기 합계 카드, 데스크탑 테이블 + 모바일 카드 목록
  - `AdminSettlementsPage` (`/admin/settlements`): 판매자/기간 선택 정산 생성 폼, 정산 완료 처리 버튼, 전체 목록
  - `App.jsx`에 라우트 등록, `Navbar`에 판매자 "정산 내역" / 어드민 "정산 관리" 메뉴 추가

**창작자/서클 프로필 페이지 — P1 완료**
- **백엔드**
  - `User` 엔티티에 SNS 필드 추가: `twitterUrl`, `pixivUrl`, `instagramUrl`
  - `UserProfileResponse`에 `role`, `twitterUrl`, `pixivUrl`, `instagramUrl` 필드 추가
  - `UpdateProfileRequest`에 SNS 필드 추가 (각 max 200자)
  - `UserService.updateProfile()`에서 SNS 필드 저장 로직 추가
  - `GoodsRepository.findBySellerAndStatus()` 쿼리 추가 (판매자별 승인 상품 조회)
  - `GoodsService.getApprovedGoodsBySeller()` 메서드 추가
  - `GoodsController`에 `GET /api/goods/seller/{username}` 공개 엔드포인트 추가
  - `SecurityConfig`에 `/api/goods/seller/*` GET permitAll 추가
- **프론트엔드**
  - `SellerProfilePage` (`/seller/:username`): 아바타, 자기소개, SNS 링크 배지, 승인된 굿즈 그리드
  - `ProfileEditPage`에 SNS 링크 입력 필드 추가 (판매자 전용, Twitter/Pixiv/Instagram)
  - `GoodsDetailPage`의 판매자 프로필 카드: 아바타/이름 클릭 시 `/seller/:username`으로 이동
  - `App.jsx`에 라우트 등록
  - Navbar 판매자 메뉴에 "주문 관리" 링크 추가

#### 버그 수정

| 심각도 | 파일 | 내용 |
|--------|------|------|
| **Critical** | `SecurityConfig.java` | 구매자(`BUYER`)가 주문 수령 확인(`PUT .../confirm-delivery`) 및 취소(`PUT .../cancel`) 시 403 Forbidden 발생 — buyer PUT 엔드포인트에 `.authenticated()` 규칙 추가 |
| **High** | `OrderService.java` `restoreStock()` | 주문 취소로 재고 복구 시 판매자가 수동으로 설정한 품절 상태(`manualSoldOut=true`)가 무시되고 `APPROVED`로 강제 전환됨 — `manualSoldOut` 체크 조건 추가 |
| **Medium** | `GoodsService.java` `updateGoods()` | 굿즈 수정 시 `goodsOptionRepository.deleteAll()` + `goods.getOptions().clear()`로 동일 옵션을 이중 삭제하여 `StaleStateException` 발생 위험 — `clear()` + `flush()`로 orphanRemoval만 사용하도록 수정 |

### 2026-04-10

#### 코드 리뷰 기반 개선

**프론트엔드 개선**

| 파일 | 내용 |
|------|------|
| `MyOrdersPage.jsx` | `CANCEL_REQUESTED`(취소 요청 중) 필터 탭 누락 — 추가 |
| `SellerOrdersPage.jsx` | `SHIPPED`(배송 중), `DELIVERED`(배송 완료) 필터 탭 누락 — 추가 |
| `AdminDashboard.jsx` | `Promise.all` 에러 핸들링 부재로 API 실패 시 무한 로딩/빈 화면 — `.catch()` + 에러 UI 추가 |
| `SellerDashboard.jsx` | `preorderCount`가 `null`/`undefined`일 때 `> 0` 비교에서 예기치 않은 결과 — `?? 0` null 안전 처리 |

**백엔드 개선**

| 파일 | 내용 |
|------|------|
| `GoodsController.java` | 페이지 `size` 파라미터 무제한 허용으로 `size=999999` 요청 시 성능 문제 — `size > 100` 제한 추가 |
| `SettlementService.java` | 정산 기간 `periodStart > periodEnd` 유효성 검증 누락 — 시작일/종료일 순서 검증 추가 |
| `OrderService.java` | 클라이언트 전송 `totalPrice`를 검증 없이 저장하여 금액 조작 가능 — 서버 사이드 금액 계산 후 비교 검증 추가 |
| `OrderService.java` | 잘못된 주문 수량(음수) 입력을 `continue`로 무시 — 명시적 `BadRequestException` 발생으로 변경 |
| `PreorderService.java` | 동일 이슈 — 음수 수량 입력 시 명시적 에러 발생으로 변경 |

#### 보안 및 유효성 검증 개선 (2026-04-10 추가)

| 심각도 | 파일 | 내용 |
|--------|------|------|
| **Critical** | `GoodsDetailPage.jsx`, `AdminReviewPage.jsx`, `SellerGoodsDetailPage.jsx` | `dangerouslySetInnerHTML`에 XSS 공격 가능 — `DOMPurify.sanitize()` 적용 (3개 파일 모두 수정) |
| **High** | `CreateOrderRequest.java` | `ordererEmail` 필드에 `@Email` 어노테이션 누락으로 잘못된 이메일 형식 허용 — `@Email` 검증 추가 |
| **High** | `GoodsService.java` | 수요조사(PREORDER) 마감일에 과거 날짜 허용 — `createGoods()`와 `updateGoods()` 모두 현재 시각 이후 검증 추가 |
| **Medium** | `RegisterRequest.java` | 비밀번호 최소 길이가 백엔드(6자) / 프론트엔드(8자) 불일치 — 백엔드도 `@Size(min = 8)` 으로 통일 |
| **Medium** | `DirectPurchaseForm.jsx` | 우편번호(`postalCode`) 프론트엔드 필수 검증 누락 (백엔드는 `@NotBlank`) — 프론트 validate에 우편번호 검증 및 에러 표시 추가 |

#### 동시성·입력검증·UX 개선 (2026-04-10 추가)

| 심각도 | 파일 | 내용 |
|--------|------|------|
| **Critical** | `GoodsOptionRepository.java`, `OrderService.java` | 동시 주문 시 재고 초과 차감 (Race Condition) — `PESSIMISTIC_WRITE` 비관적 락 `findByIdForUpdate()` 메서드 추가 후 주문 시 사용 |
| **High** | `CreateOrderRequest.java` | 전화번호(`ordererPhone`, `recipientPhone`)·우편번호(`postalCode`) 형식 검증 없음 — `@Pattern` 정규식 추가 (전화번호: 10~13자리 숫자/하이픈, 우편번호: 5자리 숫자) |
| **High** | `CreateReviewRequest.java` | 리뷰 `content` 길이 제한 없음 (무한 텍스트 저장 가능) — `@Size(max = 5000)` 추가 |
| **High** | `CreateGoodsRequest.java` | 상품 `description` 길이 제한 없음 — `@Size(max = 50000)` 추가 |
| **Medium** | `GoodsOptionRequest.java` | 재고(`stock`)에 음수 입력 가능 — `@Min(0)` 추가 |
| **Medium** | `SellerApplyRequest.java` | 판매자 신청 `contactPhone` 형식 검증 없음 — `@Pattern` 추가 |
| **Medium** | `SecurityConfig.java` | CORS `setAllowedHeaders("*")` 과도한 허용 — `Content-Type`, `Authorization`, `X-Requested-With`로 명시 |
| **Medium** | `NotificationsPage.jsx` | 수요조사 알림 타입(`PREORDER_REGISTERED/CONFIRMED/CLOSED`) 아이콘/스타일 매핑 누락 — 3개 타입 추가 |
| **Low** | `SellerOrdersPage.jsx` | 주문 상세 Drawer에서 배송 중(`SHIPPED`) 상태 시 택배사·송장번호 표시 없음 — 배송 정보 섹션 추가 |
| **Low** | `MyOrdersPage.jsx` | 구매자 주문 상세에서 배송 정보(택배사·송장번호) 표시 없음 — 배송 정보 섹션 추가 |

---

### 2026-04-15

#### 신규 기능 구현

**찜 / 관심 목록 (Wishlist) — P2 완료**
- **백엔드**
  - `Wishlist` 엔티티 (`user`, `goods`, `createdAt`, `user_id + goods_id` 복합 유니크 제약)
  - `WishlistRepository`: `existsByUserAndGoods`, `findByUserAndGoods`, `findByUserOrderByCreatedAtDesc`, `findByGoods`
  - `WishlistService`: 찜 토글(`toggleWishlist`), 목록 조회(`getMyWishlist`), 직접 해제(`removeWishlist`), 찜 여부 확인(`isWishlisted`), PREORDER→SALE 전환 시 찜한 유저 알림(`notifyGoodsOnSale`)
  - `WishlistController`: `POST /api/wishlist/{goodsId}` (토글), `GET /api/wishlist` (목록), `GET /api/wishlist/{goodsId}/status` (찜 여부), `DELETE /api/wishlist/{goodsId}` (해제)
  - `SecurityConfig`: `/api/wishlist/**` authenticated 처리
  - `NotificationType.GOODS_ON_SALE` — 찜한 상품 판매 시작 알림 타입 추가
  - `PreorderService.confirmPreorder()` — 생산 확정 시 `wishlistService.notifyGoodsOnSale()` 호출 연동
- **프론트엔드**
  - `GoodsDetailPage`: 하트 버튼 (찜 토글, 로그인 상태에서 찜 여부 자동 반영)
  - `MyWishlistPage` (`/my/wishlist`): 찜 목록 2~3열 그리드, 개별 찜 취소 버튼, 품절·수요조사 배지, 빈 목록 안내
  - `NotificationsPage`: `GOODS_ON_SALE` 알림 아이콘(🛍)·스타일 매핑 추가
  - `App.jsx`: `/my/wishlist` 라우트 등록 (ProtectedRoute)
  - `Navbar`: 찜 목록 메뉴 링크 추가

#### UI/UX 개선
- `GoodsDetailPage` 판매자 프로필 카드에 메시지·판매자 페이지 버튼 추가
- `Navbar` 드롭다운 슬림화 (BUYER: 마이페이지·판매자신청, SELLER: 마이페이지·판매관리, ADMIN: 관리자패널)
- `MyPage` (`/my`) 허브 페이지 신규 생성 — 구매 내역·찜·수요조사·리뷰 카드 그리드

---

### 2026-04-15 (2)

#### 신규 기능 구현

**1:1 채팅 (Chat) — 구현 완료**
- **백엔드**
  - `ChatRoom` 엔티티 (`user1`, `user2`, unique(user1_id, user2_id), `getOtherUser()` 편의 메서드)
  - `ChatMessage` 엔티티 (`room`, `sender`, `content`, `readByReceiver`)
  - `ChatRoomRepository`: 방 조회, 내 방 목록 (`findByUser1OrUser2`)
  - `ChatMessageRepository`: 메시지 목록, 안읽은 수, 읽음 처리, 마지막 메시지 조회
  - `ChatService`: 방 생성/조회 (id 오름차순 정렬로 unique 보장), 메시지 전송, 읽음 처리, 안읽은 수 집계
  - `ChatController`: `POST /api/chat/rooms/{username}`, `GET /api/chat/rooms`, `GET /api/chat/rooms/{roomId}/messages`, `POST /api/chat/rooms/{roomId}/messages`, `GET /api/chat/unread-count`
  - `SecurityConfig`: `/api/chat/**` authenticated 처리
- **프론트엔드**
  - `api/chat.js`: API 호출 함수 5개
  - `ChatListPage` (`/chat`): 대화 목록, 아바타·마지막 메시지·시간·안읽은 뱃지, 5초 폴링
  - `ChatRoomPage` (`/chat/:roomId`): 카카오톡 스타일 버블(내 메시지 우측 indigo, 상대 좌측 회색), 날짜 구분선, Enter 전송(Shift+Enter 줄바꿈), 3초 폴링
  - `GoodsDetailPage`: 메시지 버튼 → `getOrCreateRoom()` 후 채팅방 이동, 자기 자신 글에서는 버튼 숨김
  - `Navbar`: 채팅 아이콘 + 안읽은 수 뱃지 (30초 폴링)
  - `App.jsx`: `/chat`, `/chat/:roomId` 라우트 등록

---

### 2026-04-17

#### 신규 기능 구현

**공지사항 (Notice) — 구현 완료**
- **백엔드**
  - `Notice` 엔티티 (`title`, `content TEXT`, `author`, `pinned`, `viewCount`, `createdAt`, `updatedAt`)
  - `NoticeRepository`: `findAllByOrderByPinnedDescCreatedAtDesc`, `findByPinnedTrueOrderByCreatedAtDesc`, `findTopByOrderByPinnedDescCreatedAtDesc(Pageable)` — 배너용
  - `NoticeRequest`, `NoticeResponse`, `NoticeSummaryResponse` DTO
  - `NoticeService`: 목록(요약)/상세(조회수 +1)/생성/수정/삭제
  - `NoticeController` (공개 GET): `GET /api/notices`, `GET /api/notices/banner?limit=3`, `GET /api/notices/{id}`
  - `AdminController`: `POST /api/admin/notices`, `PUT /api/admin/notices/{id}`, `DELETE /api/admin/notices/{id}`
  - `SecurityConfig`: `/api/notices`, `/api/notices/banner`, `/api/notices/*` GET permitAll
- **프론트엔드**
  - `api/notice.js`: 목록/배너/상세/작성/수정/삭제 호출
  - `NoticesPage` (`/notices`): 고정 배지, 조회수, 작성일 표시
  - `NoticeDetailPage` (`/notices/:id`): `DOMPurify.sanitize`된 본문 렌더
  - `AdminNoticesPage` (`/admin/notices`): 목록 + 수정/삭제 (`useConfirm`)
  - `AdminNoticeEditPage` (`/admin/notices/new`, `/admin/notices/:id/edit`): `RichEditor` 기반 작성/수정, 상단 고정 토글
  - `ShopPage`: 최상단 공지 배너(고정 우선 N개, 가로 스크롤) 추가 — 클릭 시 상세로 이동
  - `Navbar`: 사용자 메뉴 드롭다운에 공지사항 진입점 추가

**어드민 전체 주문 조회 — 구현 완료**
- **백엔드**
  - `OrderRepository`: `findAllWithGoodsAndUsers()`, `findAllByStatusWithGoodsAndUsers(status)` JOIN FETCH 쿼리 추가 (N+1 방지)
  - `OrderService.getAllOrders(String statusFilter)`: `"ALL"`/`null` 또는 `OrderStatus` 값으로 필터
  - `AdminController`: `GET /api/admin/orders?status=...`
- **프론트엔드**
  - `AdminOrdersPage` (`/admin/orders`): 상태 탭(ALL/PENDING_PAYMENT/PAYMENT_CONFIRMED/SHIPPED/DELIVERED/CANCEL_REQUESTED/CANCELLED), 주문번호·상품·구매자·판매자 검색, 데스크탑 테이블, 우측 슬라이드 상세 드로어(주문/참여자/배송지/송장)

**어드민 전체 회원 관리 — 구현 완료**
- **백엔드**
  - `User` 엔티티에 `active: Boolean` 필드 추가 (null은 활성 처리)
  - `UserPrincipal`: `isEnabled()`, `isAccountNonLocked()` 가 `active` 반영 → 정지 계정 로그인 차단
  - `AdminUserResponse`, `AdminUpdateUserRequest` DTO 신규
  - `UserService.getAllUsersForAdmin()`, `adminUpdateUser(adminUserId, targetUserId, request)`
    - 자기 자신 변경 금지, 기존 ADMIN의 role 변경 금지, ADMIN 권한 부여 금지, ADMIN 비활성화 금지
  - `AdminController`: `GET /api/admin/users` 응답 타입 `List<AdminUserResponse>`로 변경, `PUT /api/admin/users/{id}` 추가
- **프론트엔드**
  - `AdminUsersPage` (`/admin/users`): 역할별 카운트 카드, 역할 탭, 검색, 드롭다운 역할 변경(BUYER↔SELLER), 계정 정지/활성화 버튼 (모두 `useConfirm`)
  - `AdminDashboard`: 전체 주문 조회 / 회원 관리 / 공지사항 관리 / 정산 관리 바로가기 추가

**JWT 만료(401) 인터셉터 강화**
- `axiosClient.js`: 401 응답 시 로그인 페이지·auth 엔드포인트는 제외하고 토큰 제거 + `/login?expired=1&redirect={encoded}` 이동 (리다이렉트 루프 방지)
- `LoginPage.jsx`: `expired=1` 쿼리 시 "로그인 세션이 만료되었습니다" 배너 표시, 로그인 성공 후 `redirect` 경로 복귀

---

### 2026-04-28

#### 신규 기능 구현

**리뷰 통계 (별점 평균/분포) — 구현 완료**
- **백엔드**
  - `ReviewRepository`: `findAverageRatingByGoodsId`, `countByGoodsId`, `findRatingDistributionByGoodsId(GROUP BY rating)` 추가
  - `GoodsResponse`: `averageRating`, `reviewCount` 필드 추가 → `GoodsService.toResponse`에서 채움
  - `ReviewStatsResponse` DTO + `ReviewService.getStatsByGoods` (1~5점 분포 항상 포함)
  - `ReviewController.getGoodsReviewStats`: `GET /api/reviews/goods/{goodsId}/stats` (공개, 기존 permitAll 패턴 적용)
- **프론트엔드**
  - `ShopPage` `GoodsCard` / `PreorderCard`: 가격 옆에 ★ 평균(개수) 노출 (리뷰 0건이면 숨김)
  - `GoodsDetailPage`: 판매자 프로필 하단에 `ReviewsSection` 신설
    - 평균/분포 헤더(가로 막대 그래프)
    - 리뷰 리스트(작성자 아바타·별점·작성일·본문)
  - `StarsReadOnly` 공용 작은 별 컴포넌트 인라인 정의
- **참고:** 기존 REQUIREMENTS의 "상품 상세 페이지에서 리뷰 목록 표시 ✅" 표기는 사실은 미구현이었던 stale 항목 — 이번 작업으로 실제 구현됨

**굿즈 정렬 옵션 — 구현 완료**
- **백엔드**
  - `GoodsController.getApprovedGoods()`에 `sort` 파라미터 추가 (`latest`/`priceAsc`/`priceDesc`/`deadlineAsc`)
  - 잘못된 값은 기본 `latest`(createdAt DESC)로 폴백
- **프론트엔드**
  - `ShopPage`: 카테고리 칩 행 우측에 정렬 셀렉트 박스 추가
  - 통판 탭: 최신순/낮은가격/높은가격 (3개)
  - 사전수요조사 탭: + 마감 임박순 (4개)
  - URL `?sort=` 연동 (`latest`는 파라미터 생략), 탭 전환 시 자동 리셋

**어드민 굿즈 전체 조회 — 구현 완료**
- **백엔드**
  - `GoodsRepository.searchForAdmin(status, keyword)` — JOIN FETCH로 N+1 방지, status null 허용(전체), 키워드(이름/판매자/카테고리/태그) 부분일치
  - `AdminService.getAllGoodsForAdmin(statusFilter, keyword)` — `"ALL"`/`null`/공백은 전체, 잘못된 status는 `BadRequestException`
  - `AdminController`: `GET /api/admin/goods?status=...&q=...`
- **프론트엔드**
  - `AdminGoodsPage` (`/admin/goods`): 상태 탭(ALL/PENDING/APPROVED/CLOSED/SOLDOUT/REJECTED), 키워드 검색(Enter 제출), 테이블(굿즈명/유형/판매자/카테고리/가격/상태/등록일), 행 클릭 시 `/admin/goods/:id/review` 이동
  - `App.jsx`: `/admin/goods` 라우트 등록
  - `AdminDashboard`: "굿즈 전체 조회" 단축 버튼 추가
- **문서 정정**
  - 4장 판매자 화면: `/seller/preorders/:goodsId` ❌ → ✅ (`SellerPreordersPage` 실제 구현됨)
  - 3-1 사전수요조사 섹션에 `SellerPreordersPage` 항목(옵션 집계, 신청자 목록, 생산 확정/취소) 추가
