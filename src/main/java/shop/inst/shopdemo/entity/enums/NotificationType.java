package shop.inst.shopdemo.entity.enums;

public enum NotificationType {
    PAYMENT_CONFIRMED,  // 입금 확인
    ORDER_SHIPPED,      // 배송 시작
    ORDER_DELIVERED,    // 배송 완료
    ORDER_CANCELLED,    // 주문 취소
    REVIEW_RECEIVED,        // 리뷰 등록 (셀러에게)
    PREORDER_REGISTERED,    // 수요조사 신청 (셀러에게)
    PREORDER_CONFIRMED,     // 수요조사 생산 확정 (신청자에게)
    PREORDER_CLOSED,        // 수요조사 마감/취소 (신청자에게)
    GOODS_ON_SALE           // 찜한 상품 판매 시작 (찜 유저에게)
}
