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

### 어드민
- [ ] 프론트: 전체 주문 조회 페이지 (AdminOrdersPage)
- [ ] 프론트: 전체 회원 관리 페이지 (AdminUsersPage) — 현재 AdminDashboard에 목록만 표시

### 기타
- [ ] 소셜 로그인 (카카오 / 네이버 / Google) — 현재 버튼만 존재, 백엔드 없음
- [ ] 이메일 인증 실제 연동 (현재 mock)
- [ ] 결제 연동 (현재 무통장 입금만)
