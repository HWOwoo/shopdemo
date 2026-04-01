package shop.inst.shopdemo.entity.enums;

public enum NotificationType {
    PAYMENT_CONFIRMED,  // 입금 확인
    ORDER_SHIPPED,      // 배송 시작
    ORDER_DELIVERED,    // 배송 완료
    ORDER_CANCELLED,    // 주문 취소
    REVIEW_RECEIVED     // 리뷰 등록 (셀러에게)
}
