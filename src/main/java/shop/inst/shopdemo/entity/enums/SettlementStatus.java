package shop.inst.shopdemo.entity.enums;

public enum SettlementStatus {
    REQUESTED,  // 판매자가 정산 신청 (어드민 검토 대기)
    PENDING,    // 어드민 승인 후 송금 대기
    PAID,       // 정산 완료
    REJECTED    // 어드민이 신청 거절
}
