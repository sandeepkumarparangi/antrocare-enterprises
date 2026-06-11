package com.antrocare.catalog.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.Body;
import software.amazon.awssdk.services.sesv2.model.Content;
import software.amazon.awssdk.services.sesv2.model.Destination;
import software.amazon.awssdk.services.sesv2.model.EmailContent;
import software.amazon.awssdk.services.sesv2.model.Message;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

@Service
public class AdminApprovalNotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminApprovalNotificationService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectProvider<SesV2Client> sesClientProvider;
    private final String adminEmail;
    private final boolean mailAlertsEnabled;
    private final boolean sesAlertsEnabled;

    public AdminApprovalNotificationService(
        ObjectProvider<JavaMailSender> mailSenderProvider,
        ObjectProvider<SesV2Client> sesClientProvider,
        @Value("${antrocare.admin-email}") String adminEmail,
        @Value("${antrocare.mail-alerts-enabled:false}") boolean mailAlertsEnabled,
        @Value("${antrocare.ses-alerts-enabled:false}") boolean sesAlertsEnabled
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.sesClientProvider = sesClientProvider;
        this.adminEmail = adminEmail;
        this.mailAlertsEnabled = mailAlertsEnabled;
        this.sesAlertsEnabled = sesAlertsEnabled;
    }

    public void notifyApproved(ProductChangeRequest change) {
        notifyReviewDecision(
            change,
            "approved",
            "Antrocare product change approved: " + change.getProductName(),
            "The approved change is now live in the Antrocare application."
        );
    }

    public void notifyRejected(ProductChangeRequest change) {
        notifyReviewDecision(
            change,
            "rejected",
            "Antrocare product change rejected: " + change.getProductName(),
            "The live Antrocare catalog was not changed."
        );
    }

    public boolean sendTestEmail(String recipientEmail) {
        String recipient = recipientEmail == null || recipientEmail.isBlank() ? adminEmail : recipientEmail.trim();
        String subject = "Antrocare email test";
        String body = """
            Antrocare email delivery is working.

            This test confirms the backend can send notification emails for approvals, rejections, and low-stock alerts.
            """;

        if (sesAlertsEnabled && sendEmailWithSes(recipient, "test", subject, body)) {
            return true;
        }

        if (mailAlertsEnabled && sendEmailWithSmtp(recipient, "test", subject, body)) {
            return true;
        }

        LOGGER.info("Test email for {} skipped because SMTP/SES alerts are disabled.", recipient);
        return false;
    }

    private void notifyReviewDecision(ProductChangeRequest change, String decision, String subject, String resultLine) {
        String body = """
            Your product change request was %s by the main admin.

            Product: %s
            Category: %s

            Cost: %s -> %s
            Stock: %d -> %d
            Status: %s -> %s

            %s
            """.formatted(
                decision,
                change.getProductName(),
                change.getProductCategory(),
                change.getCurrentCost(),
                change.getRequestedCost(),
                change.getCurrentStockQuantity(),
                change.getRequestedStockQuantity(),
                change.getCurrentStatus(),
                change.getRequestedStatus(),
                resultLine
            );

        if (sesAlertsEnabled && sendEmailWithSes(change.getRequestedByEmail(), decision, subject, body)) {
            return;
        }

        if (mailAlertsEnabled && sendEmailWithSmtp(change.getRequestedByEmail(), decision, subject, body)) {
            return;
        }

        if (!sesAlertsEnabled && !mailAlertsEnabled) {
            LOGGER.info("{} email for {} skipped because mail alerts are disabled.", decision, change.getRequestedByEmail());
        }
    }

    private boolean sendEmailWithSmtp(String recipientEmail, String decision, String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("{} email skipped because JavaMailSender is not configured.", decision);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(adminEmail);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (RuntimeException error) {
            LOGGER.warn("{} SMTP email failed for {}.", decision, recipientEmail, error);
            return false;
        }
    }

    private boolean sendEmailWithSes(String recipientEmail, String decision, String subject, String body) {
        SesV2Client sesClient = sesClientProvider.getIfAvailable();
        if (sesClient == null) {
            LOGGER.warn("{} email skipped because SES is enabled but no SES client is configured.", decision);
            return false;
        }

        try {
            sesClient.sendEmail(SendEmailRequest.builder()
                .fromEmailAddress(adminEmail)
                .destination(Destination.builder().toAddresses(recipientEmail).build())
                .content(EmailContent.builder()
                    .simple(Message.builder()
                        .subject(Content.builder().data(subject).build())
                        .body(Body.builder().text(Content.builder().data(body).build()).build())
                        .build())
                    .build())
                .build());
            return true;
        } catch (RuntimeException error) {
            LOGGER.warn("{} SES email failed for {}.", decision, recipientEmail, error);
            return false;
        }
    }
}
