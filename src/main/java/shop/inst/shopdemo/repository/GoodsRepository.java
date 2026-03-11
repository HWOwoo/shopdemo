package shop.inst.shopdemo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.ApplicationStatus;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.entity.enums.GoodsType;

import java.util.List;
import java.util.Optional;

public interface GoodsRepository extends JpaRepository<Goods, Long> {

    Page<Goods> findByStatus(GoodsStatus status, Pageable pageable);
    List<Goods> findBySeller(User seller);
    List<Goods> findByStatus(GoodsStatus status);

    /** 공개 상품 목록: 상품 승인 + 판매자 신청 승인 + 판매 유형 필터 */
    @Query("SELECT g FROM Goods g WHERE g.status = :status AND g.goodsType = :goodsType AND " +
           "EXISTS (SELECT sa FROM SellerApplication sa WHERE sa.user = g.seller AND sa.status = :appStatus)")
    Page<Goods> findByStatusAndSellerApprovedAndType(
            @Param("status") GoodsStatus status,
            @Param("appStatus") ApplicationStatus appStatus,
            @Param("goodsType") GoodsType goodsType,
            Pageable pageable);

    /** 공개 상품 단건 조회: 상품 승인 + 판매자 신청 승인된 것만 */
    @Query("SELECT g FROM Goods g WHERE g.id = :id AND g.status = :status AND " +
           "EXISTS (SELECT sa FROM SellerApplication sa WHERE sa.user = g.seller AND sa.status = :appStatus)")
    Optional<Goods> findByIdAndStatusAndSellerApproved(
            @Param("id") Long id,
            @Param("status") GoodsStatus status,
            @Param("appStatus") ApplicationStatus appStatus);
}
