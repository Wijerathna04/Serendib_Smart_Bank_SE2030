package com.smartbank.smartbank_api.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.filter.OncePerRequestFilter;
import lombok.RequiredArgsConstructor;
import java.io.IOException;
@Component @RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final CustomUserDetailsService users;
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String header=request.getHeader("Authorization");
        if(header!=null && header.startsWith("Bearer ")) {
            String token=header.substring(7);
            try {
                String username=jwt.extractUsername(token);var details=users.loadUserByUsername(username);
                if(details.isEnabled() && jwt.validateToken(token,username)) {
                    var authentication=new UsernamePasswordAuthenticationToken(details,null,details.getAuthorities());authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch(io.jsonwebtoken.JwtException|IllegalArgumentException|UsernameNotFoundException e) {SecurityContextHolder.clearContext();}
        }
        chain.doFilter(request,response);
    }
}
