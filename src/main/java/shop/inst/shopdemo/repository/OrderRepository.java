package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import shop.inst.shopdemo.entity.Order;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 판매자 기준: 내 굿즈에 들어온 주문 전체
    @Query("SELECT o FROM Order o JOIN FETCH o.goods g JOIN FETCH o.buyer WHERE g.seller = :seller ORDER BY o.createdAt DESC")
    List<Order> findByGoodsSeller(@Param("seller") User seller);

    // 구매자 기준: 내가 신청한 주문 전체
    List<Order> findByBuyerOrderByCreatedAtDesc(User buyer);

    // 구매자 기준: 특정 굿즈에 대한 내 주문 이력
    List<Order> findByBuyerAndGoodsIdOrderByCreatedAtDesc(User buyer, Long goodsId);

    boolean existsByOrderNumber(String orderNumber);

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    @Query("SELECT o FROM Order o JOIN FETCH o.goods g JOIN FETCH g.seller JOIN FETCH o.buyer ORDER BY o.createdAt DESC")
    List<Order> findAllWithGoodsAndUsers();

    @Query("SELECT o FROM Order o JOIN FETCH o.goods g JOIN FETCH g.seller JOIN FETCH o.buyer WHERE o.status = :status ORDER BY o.createdAt DESC")
    List<Order> findAllByStatusWithGoodsAndUsers(@Param("status") OrderStatus status);

    // 정산용: 특정 판매자의 배송완료 주문 (기간 내, 미정산만)
    @Query("SELECT o FROM Order o JOIN FETCH o.goods g WHERE g.seller = :seller AND o.status = 'DELIVERED' " +
           "AND o.settlement IS NULL " +
           "AND o.updatedAt >= :start AND o.updatedAt < :end ORDER BY o.updatedAt ASC")
    List<Order> findDeliveredOrdersBySellerAndPeriod(
            @Param("seller") User seller,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // 정산 신청용: 특정 판매자의 미정산 배송완료 주문 전체
    @Query("SELECT o FROM Order o JOIN FETCH o.goods g WHERE g.seller = :seller AND o.status = 'DELIVERED' " +
           "AND o.settlement IS NULL ORDER BY o.updatedAt ASC")
    List<Order> findUnsettledDeliveredOrdersBySeller(@Param("seller") User seller);

    // 특정 정산에 묶인 주문 목록 (거절 시 연결 해제용)
    List<Order> findBySettlementId(Long settlementId);
}
