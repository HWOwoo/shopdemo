package shop.inst.shopdemo.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import shop.inst.shopdemo.entity.enums.ApplicationStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerApplicationResponse {
    private Long id;
    private Long userId;
    private String username;
    private String shopName;
    private String description;
    private String contactPhone;
    private ApplicationStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
