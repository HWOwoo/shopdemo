package shop.inst.shopdemo.entity.enums;

public enum OrderStatus {
    PENDING_PAYMENT,   // 입금 대기
    PAYMENT_CONFIRMED, // 입금 확인 완료
    SHIPPED,           // 배송 중
    DELIVERED,         // 배송 완료 (구매자 수령 확인)
    CANCELLED          // 취소
}
