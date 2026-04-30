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

import java.time.LocalDateTime;
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

    /** 검색 (이름, 설명, 판매자명, 카테고리, 태그) */
    @Query("SELECT g FROM Goods g WHERE g.status = :status AND g.goodsType = :goodsType AND " +
           "EXISTS (SELECT sa FROM SellerApplication sa WHERE sa.user = g.seller AND sa.status = :appStatus) AND " +
           "(LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(g.seller.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(g.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(g.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Goods> searchByKeyword(
            @Param("status") GoodsStatus status,
            @Param("appStatus") ApplicationStatus appStatus,
            @Param("goodsType") GoodsType goodsType,
            @Param("keyword") String keyword,
            Pageable pageable);

    /** 특정 판매자의 승인된 상품 목록 (공개 프로필용) */
    @Query("SELECT g FROM Goods g WHERE g.seller = :seller AND g.status = :status ORDER BY g.createdAt DESC")
    List<Goods> findBySellerAndStatus(@Param("seller") User seller, @Param("status") GoodsStatus status);

    /** 어드민 전체 굿즈 조회: 상태 + 키워드(이름/판매자명/카테고리/태그) 필터 */
    @Query("SELECT g FROM Goods g JOIN FETCH g.seller WHERE " +
           "(:status IS NULL OR g.status = :status) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(g.seller.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(g.category, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(g.tags, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY g.createdAt DESC")
    List<Goods> searchForAdmin(@Param("status") GoodsStatus status, @Param("keyword") String keyword);

    /** 마감일 지난 PREORDER 상품 */
    @Query("SELECT g FROM Goods g WHERE g.status = :status AND g.goodsType = :goodsType " +
           "AND g.preorderDeadline IS NOT NULL AND g.preorderDeadline < :now")
    List<Goods> findExpiredPreorders(
            @Param("status") GoodsStatus status,
            @Param("goodsType") GoodsType goodsType,
            @Param("now") LocalDateTime now);
}
