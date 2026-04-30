package shop.inst.shopdemo.dto.user;

import lombok.Builder;
import lombok.Data;
import shop.inst.shopdemo.entity.enums.Role;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private Boolean active;
    private LocalDateTime createdAt;
}
