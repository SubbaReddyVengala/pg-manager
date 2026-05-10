package com.pgmanager.common.util;

import java.util.regex.Pattern;

public class ValidationUtils {
    
    // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";
    
    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);

    public static void validatePassword(String password) {
        if (password == null || !pattern.matcher(password).matches()) {
            throw new RuntimeException("Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character.");
        }
    }
}
