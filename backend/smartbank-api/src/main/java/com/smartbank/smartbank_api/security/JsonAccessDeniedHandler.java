package com.smartbank.smartbank_api.security;
import org.springframework.stereotype.Component;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.access.AccessDeniedException;
import jakarta.servlet.http.*;
import java.io.IOException;
@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {
    @Override public void handle(HttpServletRequest request,HttpServletResponse response,AccessDeniedException exception) throws IOException {
        response.setStatus(403);response.setContentType("application/json");response.getWriter().write("{\"code\":\"FORBIDDEN\",\"message\":\"Your role cannot perform this operation\"}");
    }
}
