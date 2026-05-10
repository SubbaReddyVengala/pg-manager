package com.pgmanager.api.auth.util;
import com.pgmanager.api.auth.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")           private String secret;
    @Value("${jwt.expiration}")        private long expiration;
    @Value("${jwt.refresh-expiration}") private long refreshExpiration;

    private Key signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        return generateAccessTokenWithClaims(user, Map.of());
    }

    public String generateImpersonationToken(User user, Long adminId) {
        return generateAccessTokenWithClaims(user, Map.of("impersonatorId", adminId));
    }

    private String generateAccessTokenWithClaims(User user, Map<String, Object> extraClaims) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("ownerId", user.getOwnerId())
                .claim("role", user.getRole().name())
                .claim("sub", user.getEmail())
                .addClaims(extraClaims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey()).build()
                .parseClaimsJws(token).getBody();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractOwnerId(String token) {
        return extractAllClaims(token).get("ownerId", Long.class);
    }

    public boolean isTokenValid(String token, User user) {
        try {
            String email = extractEmail(token);
            return email.equals(user.getEmail()) && !isExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    private boolean isExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }
}




