package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.wishlist.WishlistResponse;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.GoodsOption;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.Wishlist;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.entity.enums.NotificationType;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.GoodsRepository;
import shop.inst.shopdemo.repository.UserRepository;
import shop.inst.shopdemo.repository.WishlistRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final GoodsRepository goodsRepository;
    private final NotificationService notificationService;

    /** 찜 토글: 찜이면 취소, 아니면 추가 */
    @Transactional
    public Map<String, Boolean> toggleWishlist(String username, Long goodsId) {
        User user = findUser(username);
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));

        boolean nowWishlisted;
        if (wishlistRepository.existsByUserAndGoods(user, goods)) {
            wishlistRepository.findByUserAndGoods(user, goods)
                    .ifPresent(wishlistRepository::delete);
            nowWishlisted = false;
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .goods(goods)
                    .build();
            wishlistRepository.save(wishlist);
            nowWishlisted = true;
        }
        return Map.of("wishlisted", nowWishlisted);
    }

    /** 내 찜 목록 */
    @Transactional(readOnly = true)
    public List<WishlistResponse> getMyWishlist(String username) {
        User user = findUser(username);
        return wishlistRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    /** 찜 직접 해제 */
    @Transactional
    public void removeWishlist(String username, Long goodsId) {
        User user = findUser(username);
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));
        wishlistRepository.findByUserAndGoods(user, goods)
                .ifPresent(wishlistRepository::delete);
    }

    /** 찜 여부 확인 */
    @Transactional(readOnly = true)
    public boolean isWishlisted(String username, Long goodsId) {
        User user = findUser(username);
        Goods goods = goodsRepository.findById(goodsId).orElse(null);
        if (goods == null) return false;
        return wishlistRepository.existsByUserAndGoods(user, goods);
    }

    /** 상품이 PREORDER → SALE 전환될 때 찜한 유저들에게 알림 발송 */
    @Transactional
    public void notifyGoodsOnSale(Goods goods) {
        List<Wishlist> wishlists = wishlistRepository.findByGoods(goods);
        for (Wishlist w : wishlists) {
            notificationService.create(
                    w.getUser(),
                    NotificationType.GOODS_ON_SALE,
                    "찜한 상품이 판매를 시작했습니다",
                    "찜해두신 '" + goods.getName() + "' 상품의 생산이 확정되어 지금 구매할 수 있습니다!",
                    null,
                    goods.getId()
            );
        }
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private WishlistResponse toResponse(Wishlist w) {
        Goods goods = w.getGoods();
        String imageUrl = goods.getOptions().stream()
                .filter(o -> o.getImageUrl() != null)
                .map(GoodsOption::getImageUrl)
                .findFirst().orElse(null);

        BigDecimal displayPrice = goods.getOptions().stream()
                .map(GoodsOption::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(goods.getPrice());

        boolean soldOut = Boolean.TRUE.equals(goods.getManualSoldOut())
                || goods.getStatus() == GoodsStatus.SOLDOUT;

        return WishlistResponse.builder()
                .id(w.getId())
                .goodsId(goods.getId())
                .goodsName(goods.getName())
                .goodsImageUrl(imageUrl)
                .price(displayPrice)
                .sellerUsername(goods.getSeller().getUsername())
                .soldOut(soldOut)
                .goodsType(goods.getGoodsType().name())
                .createdAt(w.getCreatedAt())
                .build();
    }
}
