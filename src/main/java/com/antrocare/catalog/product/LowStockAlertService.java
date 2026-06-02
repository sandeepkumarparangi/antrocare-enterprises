package com.antrocare.catalog.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class LowStockAlertService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LowStockAlertService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String adminEmail;
    private final int threshold;
    private final boolean mailAlertsEnabled;

    public LowStockAlertService(
        ObjectProvider<JavaMailSender> mailSenderProvider,
        @Value("${antrocare.admin-email}") String adminEmail,
        @Value("${antrocare.low-stock-threshold}") int threshold,
        @Value("${antrocare.mail-alerts-enabled:false}") boolean mailAlertsEnabled
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.adminEmail = adminEmail;
        this.threshold = threshold;
        this.mailAlertsEnabled = mailAlertsEnabled;
    }

    public int threshold() {
        return threshold;
    }

    public boolean notifyIfNeeded(Product product) {
        if (!product.isLowStock(threshold) || product.isLowStockAlertSent()) {
            return false;
        }

        if (!mailAlertsEnabled) {
            LOGGER.info(
                "Low stock alert for {} skipped because mail alerts are disabled. Remaining stock: {}",
                product.getName(),
                product.getStockQuantity()
            );
            return true;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("Low stock alert for {} skipped because JavaMailSender is not configured.", product.getName());
            return true;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("Low stock alert: " + product.getName());
        message.setText("""
            Your product is going to end.

            Product: %s
            Category: %s
            Available stock: %d
            Alert threshold: less than %d

            Please update stock in the Antrocare admin dashboard.
            """.formatted(product.getName(), product.getCategory(), product.getStockQuantity(), threshold));
        mailSender.send(message);
        return true;
    }
}
