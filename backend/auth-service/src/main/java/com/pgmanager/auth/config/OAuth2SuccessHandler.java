package com.pgmanager.auth.config;

import com.pgmanager.auth.entity.User;
import com.pgmanager.auth.repository.UserRepository;
import com.pgmanager.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final com.pgmanager.auth.repository.StaffUserRepository staffUserRepository;
    private final AuthService authService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        
        DefaultOAuth2User oauthUser = (DefaultOAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");

        boolean isUser = userRepository.existsByEmail(email);
        boolean isStaff = staffUserRepository.findByEmail(email).isPresent();

        if (!isUser && !isStaff) {
            response.sendRedirect("http://localhost:4200/auth/login?error=not_authorized");
            return;
        }

        // Issue JWT tokens
        com.pgmanager.common.dto.AuthResponse authResponse = authService.loginWithEmail(email);
        
        // The above should set the HttpOnly cookie for refresh token
        // and return the access token in a way we can pass to frontend
        
        // Redirect to frontend with access token in query param (temporary, to be handled by oauth-callback)
        response.sendRedirect("http://localhost:4200/auth/oauth-callback?token=" + authResponse.getAccessToken());
    }
}
