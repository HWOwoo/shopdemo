package shop.inst.shopdemo.dto.user;

import lombok.Data;
import shop.inst.shopdemo.entity.enums.Role;

@Data
public class AdminUpdateUserRequest {
    /** 변경할 역할 (null이면 역할 변경 없음) */
    private Role role;
    /** 활성 여부 (null이면 변경 없음) */
    private Boolean active;
}
