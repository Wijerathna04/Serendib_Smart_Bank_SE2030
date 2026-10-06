package com.smartbank.smartbank_api.security;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter filter;
    private final JsonAuthenticationEntryPoint unauthenticated;
    private final JsonAccessDeniedHandler forbidden;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable()).cors(c -> {})
            .httpBasic(c -> c.disable()).formLogin(c -> c.disable()).logout(c -> c.disable())
            .sessionManagement(c -> c.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(c -> c.authenticationEntryPoint(unauthenticated).accessDeniedHandler(forbidden))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews", "/api/reviews/summary", "/api/exchange-rates").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/customers/me/spending-summary").hasRole("CUSTOMER")
                .requestMatchers("/auth/**", "/api/notifications/**", "/api/customers/me/**", "/api/profile/**").authenticated()
                .requestMatchers("/api/admin/operations/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/employee/customers/**", "/api/employee/accounts/**", "/api/employee/fixed-deposits/**").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")
                .requestMatchers("/api/employee/cards/**", "/api/employee/feedback/**").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")
                .requestMatchers("/api/employee/loans/**").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")
                .requestMatchers("/api/customers/*/risk-summary").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")
                .requestMatchers("/api/manager/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/assistant/**", "/api/accounts/**", "/api/fixed-deposits/**", "/api/transfers/**", "/api/transactions/**", "/api/simulation/**", "/api/beneficiaries/**", "/api/bill-payments/**", "/api/loans/**", "/api/cards/**", "/api/feedback/**", "/api/customers/**").hasRole("CUSTOMER")
                .anyRequest().denyAll())
            .addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
