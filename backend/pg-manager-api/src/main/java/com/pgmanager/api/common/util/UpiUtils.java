package com.pgmanager.api.common.util;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class UpiUtils {

    /**
     * Generates a UPI Deep Link for mobile payments.
     * Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
     */
    public static String generateDeepLink(String vpa, String name, BigDecimal amount, String note) {
        if (vpa == null || vpa.isEmpty()) return null;
        
        try {
            StringBuilder sb = new StringBuilder("upi://pay?");
            sb.append("pa=").append(vpa);
            sb.append("&pn=").append(URLEncoder.encode(name != null ? name : "PG Manager", StandardCharsets.UTF_8));
            if (amount != null) {
                sb.append("&am=").append(amount.setScale(2).toPlainString());
            }
            sb.append("&cu=INR");
            if (note != null && !note.isEmpty()) {
                sb.append("&tn=").append(URLEncoder.encode(note, StandardCharsets.UTF_8));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}




