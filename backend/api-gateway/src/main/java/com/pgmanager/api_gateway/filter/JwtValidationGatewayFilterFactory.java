package com.pgmanager.api_gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class JwtValidationGatewayFilterFactory
        extends AbstractGatewayFilterFactory<Object> {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${gateway.internal-secret:pg-internal-trust-secret-2026}")
    private String internalSecret;

    public JwtValidationGatewayFilterFactory() {
        super(Object.class);
    }

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            String auth = exchange.getRequest()
                    .getHeaders()
                    .getFirst("Authorization");

            if (auth == null || !auth.startsWith("Bearer ")) {
                return unauthorized(exchange);
            }

            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(Keys.hmacShaKeyFor(
                                secret.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseClaimsJws(auth.substring(7))
                        .getBody();

                String email = claims.getSubject();
                String userId = String.valueOf(claims.get("userId"));
                String tenantId = String.valueOf(claims.get("tenantId"));
                String role = String.valueOf(claims.get("role"));

                exchange.getRequest().mutate()
                        .header("X-User-Email", email)
                        .header("X-User-Id", userId)
                        .header("X-User-Tenant-Id", tenantId)
                        .header("X-User-Role", role)
                        .header("X-Gateway-Secret", internalSecret)
                        .build();

                return chain.filter(exchange);

            } catch (JwtException e) {
                return unauthorized(exchange);
            }
        };
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }
}