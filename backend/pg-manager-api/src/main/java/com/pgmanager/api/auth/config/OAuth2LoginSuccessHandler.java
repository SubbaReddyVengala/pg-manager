package com.pgmanager.api.auth.config;

import com.pgmanager.api.auth.entity.User;
import com.pgmanager.api.auth.repository.UserRepository;
import com.pgmanager.api.auth.util.JwtUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        
        log.info("Google Login Success: {}", email);
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("Access denied for email: {}. User not found in whitelist.", email);
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=access_denied");
            return;
        }

        User user = userOpt.get();
        if (!user.isEnabled()) {
            log.warn("Access denied for email: {}. Account is disabled.", email);
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=account_disabled");
            return;
        }

        String accessToken = jwtUtil.generateAccessToken(user);
        
        // Redirect to frontend with token in fragment
        String targetUrl = frontendUrl + "/auth/oauth-callback#access_token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}




