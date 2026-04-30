# TODO

## 완료
- [x] 회원가입 / 로그인 (JWT)
- [x] 상품 등록 / 수정 / 삭제 (옵션별 가격·재고)
- [x] 상품 심사 (어드민 승인/반려)
- [x] 주문 생성 및 재고 차감
- [x] 주문 상태 흐름 (PENDING_PAYMENT → PAYMENT_CONFIRMED → SHIPPED → DELIVERED)
- [x] 판매자 신청 / 어드민 심사
- [x] 리뷰 작성 / 수정 / 삭제 (배송 완료 여부 관계없이 구매 이력만 있으면 작성 가능)
- [x] 알림 시스템
- [x] 이미지 업로드
- [x] 주문 취소 요청 / 어드민 승인·거절 (AdminCancelRequestsPage)
- [x] 사전수요조사 (Preorder) 전체 흐름
- [x] 굿즈 카테고리 / 태그 + 서버 사이드 검색
- [x] 정산 시스템 (Settlement)
- [x] 창작자 프로필 페이지

---

## 버그 수정 내역

### 2026-04-08
- [x] `OrderResponse` DTO에 `sellerUsername` 필드 추가
  - `AdminCancelRequestsPage`에서 판매자 컬럼이 항상 `-`로 표시되던 버그 수정
  - `OrderService.toResponse()`에서 `o.getGoods().getSeller().getUsername()` 설정 추가
- [x] `MyOrdersPage` 주문 상태 배지 누락 수정
  - `SHIPPED`(배송 중), `DELIVERED`(배송 완료), `CANCEL_REQUESTED`(취소 요청 중) 상태 추가
  - 필터 탭에 `SHIPPED`, `DELIVERED` 추가
- [x] `MyOrdersPage` 구매자 액션 버튼 추가
  - `SHIPPED` 상태: "수령 확인" 버튼 → `PUT /seller/orders/my/{id}/confirm-delivery`
  - `PENDING_PAYMENT` / `PAYMENT_CONFIRMED` 상태: "주문 취소" 버튼 → `PUT /seller/orders/my/{id}/cancel`
- [x] Navbar ADMIN 메뉴에 "주문 취소 요청" 링크 추가
  - `/admin/orders/cancel-requests` 경로 연결
- [x] 사전수요조사 (Preorder) 전체 구현
  - 백엔드: `PreorderEntry`, `PreorderEntryItem` 엔티티, `PreorderService`, `PreorderScheduler` (1시간 간격 자동 마감)
  - 프론트: 굿즈 등록 폼 마감일 입력, 상세 페이지 수요조사 신청/취소 UI, 판매자 대시보드 생산 확정
  - 구매자 내 수요조사 신청 목록 (`/my/preorders` — `MyPreordersPage`)
  - 알림: `PREORDER_REGISTERED`, `PREORDER_CONFIRMED`, `PREORDER_CLOSED` 타입 추가
- [x] 굿즈 카테고리 / 태그 + 서버 사이드 검색
  - 백엔드: `Goods.category`, `Goods.tags` 필드, JPQL 키워드 검색 쿼리
  - 프론트: 굿즈 등록 폼 카테고리·태그 입력, ShopPage 서버 사이드 검색 연동

### 2026-04-09
- [x] 정산 시스템 (Settlement) 전체 구현
  - 백엔드: `Settlement` 엔티티, `SettlementService`, `SettlementRepository`
  - 어드민: 정산 생성 (배송완료 주문 기간별 집계) + 정산 완료 처리
  - 판매자: 정산 내역 조회 (정산 완료/대기 합계)
  - Navbar: 판매자 "정산 내역", 어드민 "정산 관리" 메뉴 추가
- [x] 창작자/서클 프로필 페이지
  - 백엔드: `User` 엔티티에 SNS 필드 (twitterUrl, pixivUrl, instagramUrl) 추가
  - `UserProfileResponse`에 role, SNS 필드 추가
  - `GET /api/goods/seller/{username}` 공개 굿즈 목록 API
  - 프론트: `/seller/:username` 프로필 페이지 (아바타, 소개, SNS 링크, 굿즈 그리드)
  - 프론트: 프로필 편집 페이지에 SNS 링크 입력 추가 (판매자 전용)
  - 굿즈 상세 페이지: 판매자 이름/아바타 클릭 → 프로필 페이지 이동

---

## 미구현

### 커뮤니티
- [ ] 백엔드: 게시글 Entity / API
- [ ] 프론트: CommunityPage, 글 작성 페이지

### 기타
- [ ] 소셜 로그인 (카카오 / 네이버 / Google) — 현재 버튼만 존재, 백엔드 없음
- [ ] 이메일 인증 실제 연동 (현재 mock)
- [ ] 결제 연동 (현재 무통장 입금만)

---

## 2026-04-15

### 🔴 버그 / 기능 결함

- [x] **채팅방 - 대화 없을 때 상대방 이름 미표시**
  - `ChatRoomPage.jsx`에서 `getMyRooms()`로 `otherUsername` 별도 조회 처리 완료

- [x] **SellerPreordersPage - 수요조사 생산 취소 버튼 없음**
  - 백엔드 `POST /goods/my/{goodsId}/preorder-cancel` 엔드포인트 추가
  - 프론트 취소 버튼 + 확인 모달 연결 완료

- [x] **GoodsDetailPage - 구매자가 판매자용 주문 API 호출**
  - `user?.role === 'BUYER'` 체크 추가, BUYER 전용 조건부 호출로 수정

### 🟠 미구현 페이지

- [x] **어드민 전체 주문 조회 페이지** (`/admin/orders`) — 2026-04-17
  - 주문 상태 탭 필터 + 검색, 주문 상세 드로어
- [x] **어드민 전체 회원 관리 페이지** (`/admin/users`) — 2026-04-17
  - BUYER↔SELLER 역할 변경, 계정 활성/정지 토글
- [x] **공지사항 페이지** (`/notices`, `/notices/:id`) — 2026-04-17
  - 어드민 CRUD 페이지, ShopPage 상단 배너 연동

### 🟡 UX / 기능 개선

- [x] **ShopPage 카테고리 필터 UI**
  - 메인 탭 하단에 카테고리 칩 필터 바 추가 (전체/아크릴 스탠드/포토카드 등)
  - URL `?category=` 파라미터 연동, 클라이언트 사이드 필터링

- [x] **태그 클릭 → 검색 연동**                 
  - 굿즈 상세 페이지 태그 배지를 버튼으로 교체, 클릭 시 `/?q={tag}` 이동

- [x] **`window.confirm()` → 커스텀 모달로 교체**
  - `ConfirmModal.jsx` 공용 컴포넌트 + `useConfirm()` 훅 제작
  - 적용 파일: `MyOrdersPage`, `MyReviewsPage`, `MyPreordersPage`, `MyWishlistPage`,
    `SellerDashboard`, `SellerOrdersPage`, `SellerPreordersPage`,
    `AdminCancelRequestsPage`, `AdminSettlementsPage`, `GoodsDetailPage`

- [x] **이미지 다중 업로드 연결**
  - `GoodsForm.jsx`에 이미 추가 이미지 최대 5장 업로드 UI 구현됨 (이전 작업에서 완료)

### 🔵 성능 / 아키텍처

- [x] **채팅 폴링 최적화**
  - `ChatListPage`, `ChatRoomPage` 모두 `visibilitychange` 이벤트로 탭 비활성 시 폴링 중단 처리

- [x] **JWT 만료 처리** — 2026-04-17
  - `axiosClient`에 401 응답 시 자동 로그아웃 + `/login?expired=1&redirect=...` 리다이렉트
  - `LoginPage`에서 `expired=1` 배너 + 로그인 후 원래 페이지 복귀 처리

---

## 2026-04-28 — 추가 작업 후보 (audit)

### 📄 문서 정정
- [x] `REQUIREMENTS.md` — `/seller/preorders/:goodsId` 상태 ❌ → ✅ (실제 `SellerPreordersPage` 구현됨)

### 🟠 기능 갭 (명세 외 식별)
- [x] **어드민 굿즈 전체 목록** — `AdminGoodsPage` (`/admin/goods`) 추가, 상태 탭 + 키워드 검색 (2026-04-28)
- [x] **굿즈 정렬 옵션** — ShopPage 정렬 셀렉트 박스 (최신순/가격순, PREORDER 탭 마감 임박순) — 2026-04-28
  - 백엔드 `GET /api/goods?sort=` 파라미터 추가 (latest/priceAsc/priceDesc/deadlineAsc)
  - 인기순은 주문/조회 카운트 인프라 필요 — 별도 과제로 보류
- [x] **리뷰 통계** — 카드 ★ 평균(개수), 굿즈 상세 평균/분포/리뷰 리스트 (2026-04-28)
  - 백엔드 `GET /api/reviews/goods/{goodsId}/stats` 추가, `GoodsResponse`에 `averageRating`/`reviewCount` 채움
  - 굿즈 상세에 리뷰 섹션 자체가 없던 것도 함께 추가
- [ ] **신고 기능** — 굿즈/리뷰/유저 신고 → 어드민 처리 큐
- [ ] **알림 설정** — 카테고리별 ON/OFF, 일괄 읽음 처리
- [x] **판매자 정산 신청 플로우** — `REQUESTED → PENDING → PAID` / `REJECTED` 흐름 추가, 주문↔정산 FK로 이중 정산 차단 (2026-04-30)
- [ ] **차단(블락)** — 채팅·프로필에서 상대 차단
- [ ] **재고 0 자동 SOLDOUT 전환** 검증 (`manualSoldOut` 플래그와의 상호작용 점검)

### 🔐 보안 / 운영
- [ ] **Refresh Token** — 현재 access JWT only
- [ ] **Rate Limiting** — 로그인·주문·신고 엔드포인트
- [ ] **이미지 업로드 검증 강화** — MIME/용량 제한, S3·CDN 분리
- [ ] **DB 인덱스 점검** — `Goods(status, createdAt)`, `Order(buyer_id, status)`, `Wishlist(user_id, goods_id)` 등
- [ ] **API 문서화** — Swagger/OpenAPI
- [ ] **테스트 커버리지** — 주문 동시성·재고 차감·정산 통합 테스트

### 🟡 명세상 미구현 (기존)
- [ ] 커뮤니티 (게시글)
- [ ] 소셜 로그인 (Kakao/Naver/Google)
- [ ] 이메일 인증 실연동
- [ ] 결제 모듈 (토스/포트원)
- [ ] 실시간 알림 (SSE/WebSocket)
