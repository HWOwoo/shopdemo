package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.Settlement;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.SettlementStatus;

import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    List<Settlement> findBySellerOrderByCreatedAtDesc(User seller);

    List<Settlement> findByStatusOrderByCreatedAtDesc(SettlementStatus status);

    List<Settlement> findAllByOrderByCreatedAtDesc();

    boolean existsBySellerAndStatus(User seller, SettlementStatus status);
}
