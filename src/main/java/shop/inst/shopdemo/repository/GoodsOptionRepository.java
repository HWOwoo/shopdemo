package shop.inst.shopdemo.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import shop.inst.shopdemo.entity.GoodsOption;

import java.util.List;
import java.util.Optional;

public interface GoodsOptionRepository extends JpaRepository<GoodsOption, Long> {
    List<GoodsOption> findByGoodsIdOrderByIdAsc(Long goodsId);

    /** 주문 시 재고 차감용 — 비관적 락으로 동시 주문 Race Condition 방지 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM GoodsOption o WHERE o.id = :id")
    Optional<GoodsOption> findByIdForUpdate(@Param("id") Long id);
}
