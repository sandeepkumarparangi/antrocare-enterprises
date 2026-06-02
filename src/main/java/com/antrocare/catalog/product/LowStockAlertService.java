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
public class LowStockAlertService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LowStockAlertService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectProvider<SesV2Client> sesClientProvider;
    private final String adminEmail;
    private final int threshold;
    private final boolean mailAlertsEnabled;
    private final boolean sesAlertsEnabled;

    public LowStockAlertService(
        ObjectProvider<JavaMailSender> mailSenderProvider,
        ObjectProvider<SesV2Client> sesClientProvider,
        @Value("${antrocare.admin-email}") String adminEmail,
        @Value("${antrocare.low-stock-threshold}") int threshold,
        @Value("${antrocare.mail-alerts-enabled:false}") boolean mailAlertsEnabled,
        @Value("${antrocare.ses-alerts-enabled:false}") boolean sesAlertsEnabled
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.sesClientProvider = sesClientProvider;
        this.adminEmail = adminEmail;
        this.threshold = threshold;
        this.mailAlertsEnabled = mailAlertsEnabled;
        this.sesAlertsEnabled = sesAlertsEnabled;
    }

    public int threshold() {
        return threshold;
    }

    public boolean notifyIfNeeded(Product product) {
        if (!product.isLowStock(threshold) || product.isLowStockAlertSent()) {
            return false;
        }

        String subject = "Low stock alert: " + product.getName();
        String body = """
            Your product is going to end.

            Product: %s
            Category: %s
            Available stock: %d
            Alert threshold: less than %d

            Please update stock in the Antrocare admin dashboard.
            """.formatted(product.getName(), product.getCategory(), product.getStockQuantity(), threshold);

        if (sesAlertsEnabled && sendWithSes(subject, body)) {
            return true;
        }

        if (mailAlertsEnabled && sendWithSmtp(subject, body)) {
            return true;
        }

        if (!sesAlertsEnabled && !mailAlertsEnabled) {
            LOGGER.info(
                "Low stock alert for {} skipped because mail alerts are disabled. Remaining stock: {}",
                product.getName(),
                product.getStockQuantity()
            );
        }

        return false;
    }

    private boolean sendWithSmtp(String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("Low stock alert skipped because JavaMailSender is not configured.");
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (RuntimeException error) {
            LOGGER.warn("Low stock SMTP email failed.", error);
            return false;
        }
    }

    private boolean sendWithSes(String subject, String body) {
        SesV2Client sesClient = sesClientProvider.getIfAvailable();
        if (sesClient == null) {
            LOGGER.warn("Low stock alert skipped because SES is enabled but no SES client is configured.");
            return false;
        }

        try {
            sesClient.sendEmail(SendEmailRequest.builder()
                .fromEmailAddress(adminEmail)
                .destination(Destination.builder().toAddresses(adminEmail).build())
                .content(EmailContent.builder()
                    .simple(Message.builder()
                        .subject(Content.builder().data(subject).build())
                        .body(Body.builder().text(Content.builder().data(body).build()).build())
                        .build())
                    .build())
                .build());
            return true;
        } catch (RuntimeException error) {
            LOGGER.warn("Low stock SES email failed. Verify the SES email identity for {}.", adminEmail, error);
            return false;
        }
    }
}
