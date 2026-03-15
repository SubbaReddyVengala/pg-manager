package com.pgmanager.auth.util;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")           private String secret;
    @Value("${jwt.expiration}")        private long expiration;
    @Value("${jwt.refresh-expiration}") private long refreshExpiration;

    private Key signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UserDetails user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean isTokenValid(String token, UserDetails user) {
        try {
            String email = extractEmail(token);
            return email.equals(user.getUsername()) && !isExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    private boolean isExpired(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey()).build()
                .parseClaimsJws(token).getBody()
                .getExpiration().before(new Date());
    }
}
