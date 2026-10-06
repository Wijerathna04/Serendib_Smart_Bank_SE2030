package com.smartbank.smartbank_api.security;
import org.springframework.stereotype.Component;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.core.AuthenticationException;
import jakarta.servlet.http.*;
import java.io.IOException;
@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override public void commence(HttpServletRequest request,HttpServletResponse response,AuthenticationException exception) throws IOException {
        response.setStatus(401);response.setContentType("application/json");response.getWriter().write("{\"code\":\"UNAUTHENTICATED\",\"message\":\"Sign in again to continue\"}");
    }
}
