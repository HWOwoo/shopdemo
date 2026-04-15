package shop.inst.shopdemo.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import shop.inst.shopdemo.service.PreorderService;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class PreorderScheduler {

    private final PreorderService preorderService;

    /** 매 시간 정각에 마감일 지난 수요조사 자동 마감 */
    @Scheduled(cron = "0 0 * * * *")
    public void closeExpiredPreorders() {
        log.info("수요조사 마감 스케줄러 실행");
        preorderService.closeExpiredPreorders();
    }
}
