package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import shop.inst.shopdemo.entity.Order;
import shop.inst.shopdemo.entity.User;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 판매자 기준: 내 굿즈에 들어온 주문 전체
    @Query("SELECT o FROM Order o JOIN FETCH o.goods g JOIN FETCH o.buyer WHERE g.seller = :seller ORDER BY o.createdAt DESC")
    List<Order> findByGoodsSeller(@Param("seller") User seller);

    // 구매자 기준: 내가 신청한 주문 전체
    List<Order> findByBuyerOrderByCreatedAtDesc(User buyer);

    boolean existsByOrderNumber(String orderNumber);
}
