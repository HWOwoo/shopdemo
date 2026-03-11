package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import shop.inst.shopdemo.entity.Goods;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.admin}")
    private String adminEmail;

    @Async
    public void sendCopyrightPermissionRequest(Goods goods) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(goods.getRightsHolderEmail());
            helper.setCc(adminEmail);
            helper.setSubject("[ShopDemo] 저작물 이용 허가 요청 - " + goods.getName());
            helper.setText(buildCopyrightRequestBody(goods), true);
            mailSender.send(message);
            log.info("Copyright permission request email sent for goods id={}", goods.getId());
        } catch (MessagingException e) {
            log.error("Failed to send copyright permission request email for goods id={}", goods.getId(), e);
        }
    }

    @Async
    public void sendApprovalEmail(Goods goods) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(goods.getSeller().getEmail());
            helper.setSubject("[ShopDemo] 굿즈 승인 완료 - " + goods.getName());
            helper.setText(buildApprovalBody(goods), true);
            mailSender.send(message);
            log.info("Approval email sent for goods id={}", goods.getId());
        } catch (MessagingException e) {
            log.error("Failed to send approval email for goods id={}", goods.getId(), e);
        }
    }

    @Async
    public void sendRejectionEmail(Goods goods) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(goods.getSeller().getEmail());
            helper.setSubject("[ShopDemo] 굿즈 등록 거절 - " + goods.getName());
            helper.setText(buildRejectionBody(goods), true);
            mailSender.send(message);
            log.info("Rejection email sent for goods id={}", goods.getId());
        } catch (MessagingException e) {
            log.error("Failed to send rejection email for goods id={}", goods.getId(), e);
        }
    }

    private String buildCopyrightRequestBody(Goods goods) {
        return """
                <html><body>
                <h2>저작물 이용 허가 요청</h2>
                <p>안녕하세요,</p>
                <p>ShopDemo 플랫폼에서 귀하의 저작물을 이용한 팬 굿즈 판매 허가를 요청드립니다.</p>
                <table border="1" cellpadding="8" cellspacing="0">
                  <tr><th>굿즈명</th><td>%s</td></tr>
                  <tr><th>설명</th><td>%s</td></tr>
                  <tr><th>판매가</th><td>%s원</td></tr>
                  <tr><th>판매자</th><td>%s</td></tr>
                </table>
                <p>허가 여부를 관리자 이메일(%s)로 회신해 주시기 바랍니다.</p>
                <p>감사합니다.<br>ShopDemo 운영팀</p>
                </body></html>
                """.formatted(
                goods.getName(),
                goods.getDescription(),
                goods.getPrice().toPlainString(),
                goods.getSeller().getUsername(),
                adminEmail
        );
    }

    private String buildApprovalBody(Goods goods) {
        return """
                <html><body>
                <h2>굿즈 승인 완료 안내</h2>
                <p>안녕하세요, %s님!</p>
                <p>등록하신 굿즈가 승인되어 쇼핑몰에 공개되었습니다.</p>
                <table border="1" cellpadding="8" cellspacing="0">
                  <tr><th>굿즈명</th><td>%s</td></tr>
                  <tr><th>판매가</th><td>%s원</td></tr>
                </table>
                <p>감사합니다.<br>ShopDemo 운영팀</p>
                </body></html>
                """.formatted(
                goods.getSeller().getUsername(),
                goods.getName(),
                goods.getPrice().toPlainString()
        );
    }

    private String buildRejectionBody(Goods goods) {
        return """
                <html><body>
                <h2>굿즈 등록 거절 안내</h2>
                <p>안녕하세요, %s님!</p>
                <p>등록하신 굿즈가 아래의 사유로 거절되었습니다.</p>
                <table border="1" cellpadding="8" cellspacing="0">
                  <tr><th>굿즈명</th><td>%s</td></tr>
                  <tr><th>거절 사유</th><td>%s</td></tr>
                </table>
                <p>수정 후 재등록하시거나 문의사항이 있으시면 관리자에게 연락해 주세요.</p>
                <p>감사합니다.<br>ShopDemo 운영팀</p>
                </body></html>
                """.formatted(
                goods.getSeller().getUsername(),
                goods.getName(),
                goods.getRejectionReason() != null ? goods.getRejectionReason() : "사유 미기재"
        );
    }
}
