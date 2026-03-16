package shop.inst.shopdemo.entity.enums;

public enum OrderStatus {
    PENDING_PAYMENT,   // 입금 대기
    PAYMENT_CONFIRMED, // 입금 확인 완료
    CANCELLED          // 취소
}
