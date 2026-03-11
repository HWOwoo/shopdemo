package shop.inst.shopdemo.entity.enums;

public enum PaymentType {
    /** 계좌이체 - 판매자 계좌로 직접 입금 */
    BANK_TRANSFER,

    /** 플랫폼 결제 - 카드/간편결제 (중개가입 후 이용 가능, 수수료 적용) */
    PLATFORM
}
