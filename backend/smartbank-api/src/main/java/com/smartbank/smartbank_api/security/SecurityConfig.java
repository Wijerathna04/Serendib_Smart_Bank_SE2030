package com.smartbank.smartbank_api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/auth/register",
                                "/auth/login")
                        .permitAll()

                        .requestMatchers(
                                "/customer/**")
                        .authenticated()

                        .requestMatchers(
                                "/employee/**")
                        .authenticated()

                        .requestMatchers(
                                "/manager/**")
                        .authenticated()

                        .requestMatchers(
                                "/admin/**")
                        .authenticated()

                        .anyRequest()
                        .authenticated())

                .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}