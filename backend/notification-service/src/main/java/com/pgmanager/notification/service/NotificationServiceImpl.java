package com.pgmanager.notification.service;

import com.pgmanager.notification.dto.NotificationRequest;
import com.pgmanager.notification.entity.Notification;
import com.pgmanager.notification.repository.NotificationRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;
    private final NotificationRepository repository;
    private final com.pgmanager.notification.client.ResendEmailClient resendClient;
    private final com.pgmanager.notification.client.WhatsAppCloudApiClient waCloudClient;

    @Value("${spring.mail.username:noreply@pgmanager.com}")
    private String fromEmail;

    @Value("${resend.api-key:re_placeholder}")
    private String resendApiKey;

    @Value("${whatsapp.api-token:wa_placeholder}")
    private String waApiToken;

    @Value("${twilio.account-sid:AC_placeholder}")
    private String twilioSid;

    @Value("${twilio.auth-token:token_placeholder}")
    private String twilioToken;

    @Value("${twilio.from-number:whatsapp:+14155238886}")
    private String twilioFrom;

    @PostConstruct
    public void initTwilio() {
        if (twilioSid != null && !twilioSid.startsWith("AC_") && !twilioSid.isEmpty()) {
            Twilio.init(twilioSid, twilioToken);
        }
    }

    @Override
    public void sendNotification(NotificationRequest req) {
        log.info("Processing notification request of type: {} for tenant: {}", req.getType(), req.getTenantId());

        // 1. Persist to DB for Alert Feed
        repository.save(Notification.builder()
                .title(req.getSubject() != null ? req.getSubject() : "PG Alert")
                .message(req.getMessage())
                .type(determineType(req.getSubject()))
                .recipient(req.getRecipient())
                .tenantId(req.getTenantId())
                .build());

        // 2. Dispatch via Email/WhatsApp
        if ("EMAIL".equalsIgnoreCase(req.getType()) || "BOTH".equalsIgnoreCase(req.getType())) {
            sendEmail(req.getRecipient(), req.getSubject(), req.getMessage());
        }

        if ("WHATSAPP".equalsIgnoreCase(req.getType()) || "BOTH".equalsIgnoreCase(req.getType())) {
            sendWhatsApp(req.getRecipient(), req.getMessage());
        }
    }

    @Override
    public List<Notification> getAlerts() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public long getUnreadCount() {
        return repository.countByIsReadFalse();
    }

    @Override
    @Transactional
    public void markAllRead() {
        repository.markAllAsRead();
    }

    private String determineType(String subject) {
        if (subject == null) return "REMINDER";
        String s = subject.toUpperCase();
        if (s.contains("OVERDUE") || s.contains("LATE")) return "OVERDUE";
        if (s.contains("MAINTENANCE") || s.contains("COMPLAINT")) return "MAINTENANCE";
        if (s.contains("PAYMENT") || s.contains("RECEIVED") || s.contains("RECEIPT")) return "PAYMENT";
        if (s.contains("MOVE-OUT") || s.contains("VACATE")) return "MOVE_OUT";
        return "REMINDER";
    }

    private void sendEmail(String to, String subject, String body) {
        if (resendApiKey != null && !resendApiKey.startsWith("re_placeholder") && !resendApiKey.isEmpty()) {
            resendClient.sendEmail(to, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private void sendWhatsApp(String to, String body) {
        if (waApiToken != null && !waApiToken.startsWith("wa_placeholder") && !waApiToken.isEmpty()) {
            waCloudClient.sendMessage(to, body);
            return;
        }

        if (twilioSid == null || twilioSid.startsWith("AC_") || twilioSid.isEmpty()) {
            log.warn("Twilio not configured. Skipping WhatsApp message to {}", to);
            return;
        }
        try {
            String formattedTo = to.startsWith("whatsapp:") ? to : "whatsapp:" + to;
            Message.creator(
                    new PhoneNumber(formattedTo),
                    new PhoneNumber(twilioFrom),
                    body
            ).create();
            log.info("WhatsApp message sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp to {}: {}", to, e.getMessage());
        }
    }
}
