package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.preorder.PreorderEntryRequest;
import shop.inst.shopdemo.dto.preorder.PreorderEntryResponse;
import shop.inst.shopdemo.dto.preorder.PreorderSummaryResponse;
import shop.inst.shopdemo.entity.*;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.entity.enums.GoodsType;
import shop.inst.shopdemo.entity.enums.NotificationType;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.GoodsOptionRepository;
import shop.inst.shopdemo.repository.GoodsRepository;
import shop.inst.shopdemo.repository.PreorderEntryRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PreorderService {

    private final PreorderEntryRepository preorderEntryRepository;
    private final GoodsRepository goodsRepository;
    private final GoodsOptionRepository goodsOptionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WishlistService wishlistService;

    /** 수요조사 신청 */
    @Transactional
    public PreorderEntryResponse register(String username, Long goodsId, PreorderEntryRequest req) {
        User user = findUser(username);
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));

        if (goods.getGoodsType() != GoodsType.PREORDER) {
            throw new BadRequestException("수요조사 상품이 아닙니다.");
        }
        if (goods.getStatus() != GoodsStatus.APPROVED) {
            throw new BadRequestException("신청할 수 없는 상품입니다.");
        }
        if (goods.getPreorderDeadline() != null && LocalDateTime.now().isAfter(goods.getPreorderDeadline())) {
            throw new BadRequestException("수요조사 마감일이 지났습니다.");
        }
        if (preorderEntryRepository.existsByUserAndGoods(user, goods)) {
            throw new BadRequestException("이미 신청한 수요조사입니다.");
        }

        PreorderEntry entry = PreorderEntry.builder()
                .user(user)
                .goods(goods)
                .build();

        for (var itemReq : req.getItems()) {
            if (itemReq.getQuantity() != null && itemReq.getQuantity() < 0) {
                throw new BadRequestException("수량은 음수일 수 없습니다.");
            }
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) continue;
            GoodsOption option = goodsOptionRepository.findById(itemReq.getOptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("옵션을 찾을 수 없습니다."));
            if (!option.getGoods().getId().equals(goodsId)) {
                throw new BadRequestException("해당 상품의 옵션이 아닙니다.");
            }
            PreorderEntryItem item = PreorderEntryItem.builder()
                    .entry(entry)
                    .option(option)
                    .quantity(itemReq.getQuantity())
                    .build();
            entry.getItems().add(item);
        }

        if (entry.getItems().isEmpty()) {
            throw new BadRequestException("수량이 1개 이상인 항목이 없습니다.");
        }

        entry = preorderEntryRepository.save(entry);

        // 셀러에게 알림
        notificationService.create(
                goods.getSeller(),
                NotificationType.PREORDER_REGISTERED,
                "수요조사 신청이 접수되었습니다",
                user.getUsername() + "님이 '" + goods.getName() + "' 수요조사에 신청했습니다.",
                null,
                goods.getId()
        );

        return toResponse(entry);
    }

    /** 내 수요조사 신청 취소 */
    @Transactional
    public void cancel(String username, Long goodsId) {
        User user = findUser(username);
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));
        PreorderEntry entry = preorderEntryRepository.findByUserAndGoods(user, goods)
                .orElseThrow(() -> new ResourceNotFoundException("신청 내역이 없습니다."));
        preorderEntryRepository.delete(entry);
    }

    /** 수요조사 집계 (판매자용) */
    @Transactional(readOnly = true)
    public PreorderSummaryResponse getSummary(String sellerUsername, Long goodsId) {
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));
        if (!goods.getSeller().getUsername().equals(sellerUsername)) {
            throw new BadRequestException("권한이 없습니다.");
        }

        List<PreorderEntry> entries = preorderEntryRepository.findByGoodsOrderByCreatedAtDesc(goods);

        // 옵션별 수량 집계
        Map<Long, PreorderSummaryResponse.OptionAggregate> aggregateMap = new HashMap<>();
        for (PreorderEntry entry : entries) {
            for (PreorderEntryItem item : entry.getItems()) {
                Long optionId = item.getOption().getId();
                aggregateMap.merge(optionId,
                        PreorderSummaryResponse.OptionAggregate.builder()
                                .optionId(optionId)
                                .optionName(item.getOption().getName())
                                .totalQuantity(item.getQuantity())
                                .build(),
                        (existing, newVal) -> {
                            existing.setTotalQuantity(existing.getTotalQuantity() + newVal.getTotalQuantity());
                            return existing;
                        });
            }
        }

        return PreorderSummaryResponse.builder()
                .goodsId(goods.getId())
                .goodsName(goods.getName())
                .goodsStatus(goods.getStatus())
                .preorderDeadline(goods.getPreorderDeadline())
                .totalEntries(entries.size())
                .optionAggregates(aggregateMap.values().stream().toList())
                .entries(entries.stream().map(this::toResponse).toList())
                .build();
    }

    /** 특정 상품의 수요조사 신청 목록 (판매자용) */
    @Transactional(readOnly = true)
    public List<PreorderEntryResponse> getEntriesForGoods(String sellerUsername, Long goodsId) {
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));
        if (!goods.getSeller().getUsername().equals(sellerUsername)) {
            throw new BadRequestException("권한이 없습니다.");
        }
        return preorderEntryRepository.findByGoodsOrderByCreatedAtDesc(goods).stream()
                .map(this::toResponse)
                .toList();
    }

    /** 내 수요조사 신청 목록 (구매자용) */
    @Transactional(readOnly = true)
    public List<PreorderEntryResponse> getMyEntries(String username) {
        User user = findUser(username);
        return preorderEntryRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    /** 수요조사 인원 수 */
    @Transactional(readOnly = true)
    public long countByGoods(Goods goods) {
        return preorderEntryRepository.countByGoods(goods);
    }

    /** 판매자: 생산 확정 → SALE 타입으로 전환 */
    @Transactional
    public void confirmPreorder(String sellerUsername, Long goodsId) {
        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));
        if (!goods.getSeller().getUsername().equals(sellerUsername)) {
            throw new BadRequestException("권한이 없습니다.");
        }
        if (goods.getGoodsType() != GoodsType.PREORDER) {
            throw new BadRequestException("수요조사 상품이 아닙니다.");
        }

        goods.setGoodsType(GoodsType.SALE);
        goods.setPreorderDeadline(null);
        goodsRepository.save(goods);

        // 수요조사 신청자들에게 알림
        List<PreorderEntry> entries = preorderEntryRepository.findByGoodsOrderByCreatedAtDesc(goods);
        for (PreorderEntry entry : entries) {
            notificationService.create(
                    entry.getUser(),
                    NotificationType.PREORDER_CONFIRMED,
                    "수요조사 생산이 확정되었습니다",
                    "'" + goods.getName() + "' 상품의 생산이 확정되었습니다. 지금 구매할 수 있습니다!",
                    null,
                    goods.getId()
            );
        }

        // 찜한 유저들에게 알림
        wishlistService.notifyGoodsOnSale(goods);
    }

    /** 마감일 지난 수요조사 자동 마감 (스케줄러에서 호출) */
    @Transactional
    public void closeExpiredPreorders() {
        List<Goods> expired = goodsRepository.findExpiredPreorders(
                GoodsStatus.APPROVED, GoodsType.PREORDER, LocalDateTime.now());
        for (Goods goods : expired) {
            goods.setStatus(GoodsStatus.CLOSED);
            goodsRepository.save(goods);

            // 셀러에게 알림
            notificationService.create(
                    goods.getSeller(),
                    NotificationType.PREORDER_CLOSED,
                    "수요조사가 마감되었습니다",
                    "'" + goods.getName() + "' 수요조사 마감일이 지나 자동 마감되었습니다. 생산 확정 여부를 결정해주세요.",
                    null,
                    goods.getId()
            );
        }
    }

    /** 내가 이 상품에 신청했는지 확인 */
    @Transactional(readOnly = true)
    public boolean hasRegistered(String username, Long goodsId) {
        User user = findUser(username);
        Goods goods = goodsRepository.findById(goodsId).orElse(null);
        if (goods == null) return false;
        return preorderEntryRepository.existsByUserAndGoods(user, goods);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private PreorderEntryResponse toResponse(PreorderEntry entry) {
        String imageUrl = entry.getGoods().getOptions().stream()
                .filter(o -> o.getImageUrl() != null)
                .map(GoodsOption::getImageUrl)
                .findFirst().orElse(null);

        return PreorderEntryResponse.builder()
                .id(entry.getId())
                .goodsId(entry.getGoods().getId())
                .goodsName(entry.getGoods().getName())
                .goodsImageUrl(imageUrl)
                .username(entry.getUser().getUsername())
                .items(entry.getItems().stream()
                        .map(i -> PreorderEntryResponse.ItemResponse.builder()
                                .optionId(i.getOption().getId())
                                .optionName(i.getOption().getName())
                                .quantity(i.getQuantity())
                                .build())
                        .toList())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
