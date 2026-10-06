package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.config.CorsConfig;
import com.smartbank.smartbank_api.controller.AccountController;
import com.smartbank.smartbank_api.exception.GlobalExceptionHandler;
import com.smartbank.smartbank_api.security.*;
import com.smartbank.smartbank_api.service.AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.time.Clock;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real security filter chain, isolated HTTP fixture and mocked persistence-facing services. */
@SpringJUnitWebConfig(SecurityHttpTests.Config.class)
class SecurityHttpTests {
    @Autowired WebApplicationContext context;
    @Autowired JwtService jwt;
    @Autowired TokenSessionService sessions;
    @Autowired CustomUserDetailsService users;
    private MockMvc mvc;

    @BeforeEach void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(users);
    }

    @Test void anonymousAndMalformedBearerAreRejected() throws Exception {
        mvc.perform(get("/api/accounts")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(get("/api/accounts").header("Authorization", "Bearer malformed")).andExpect(status().isUnauthorized());
    }

    @Test void allFourRolesObeyPathRules() throws Exception {
        String[] roles = {"CUSTOMER", "EMPLOYEE", "MANAGER", "ADMIN"};
        String[] paths = {"/api/accounts", "/api/employee/loans", "/api/manager/loans", "/api/admin/users"};
        for (int role = 0; role < roles.length; role++) {
            for (int path = 0; path < paths.length; path++) {
                mvc.perform(get(paths[path]).with(user("fixture").roles(roles[role])))
                    .andExpect(status().is((path == 0 ? role == 0 : role >= path) ? 200 : 403));
            }
            mvc.perform(get("/api/notifications").with(user("fixture").roles(roles[role]))).andExpect(status().isOk());
        }
    }

    @Test void sharedStaffPathsUseExplicitRoleSets() throws Exception {
        for (String role : new String[]{"CUSTOMER", "EMPLOYEE", "MANAGER", "ADMIN"}) {
            mvc.perform(get("/api/employee/customers").with(user("fixture").roles(role)))
                .andExpect(status().is(!role.equals("CUSTOMER") ? 200 : 403));
            mvc.perform(get("/api/employee/cards").with(user("fixture").roles(role)))
                .andExpect(status().is(!role.equals("CUSTOMER") ? 200 : 403));
        }
    }

    @Test void publicRatesAndAdministrativeOversight() throws Exception {
        mvc.perform(get("/api/exchange-rates")).andExpect(status().isOk());
        for(String role : new String[]{"CUSTOMER","EMPLOYEE","MANAGER","ADMIN"}) {
            mvc.perform(get("/api/admin/operations/accounts").with(user("fixture").roles(role)))
                .andExpect(status().is(role.equals("ADMIN") || role.equals("MANAGER") ? 200 : 403));
            mvc.perform(put("/api/employee/cards/1/issue").with(user("fixture").roles(role)))
                .andExpect(status().is(role.equals("CUSTOMER") ? 403 : 200));
        }
    }

    @Test void validRevokedAndDisabledUserBearerRequests() throws Exception {
        when(users.loadUserByUsername("fixture")).thenReturn(User.withUsername("fixture").password("unused").roles("CUSTOMER").build());
        String token = jwt.generateToken("fixture");
        mvc.perform(get("/api/accounts").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        sessions.revokeUser("fixture");
        mvc.perform(get("/api/accounts").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        token = jwt.generateToken("fixture");
        when(users.loadUserByUsername("fixture")).thenReturn(User.withUsername("fixture").password("unused").roles("CUSTOMER").disabled(true).build());
        mvc.perform(get("/api/accounts").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    }

    @Test void accountsHaveNoWriteMappings() throws Exception {
        mvc.perform(post("/api/accounts").with(user("fixture").roles("CUSTOMER"))).andExpect(status().isMethodNotAllowed());
        mvc.perform(put("/api/accounts/1").with(user("fixture").roles("CUSTOMER"))).andExpect(status().isMethodNotAllowed());
        mvc.perform(delete("/api/accounts/1").with(user("fixture").roles("CUSTOMER"))).andExpect(status().isMethodNotAllowed());
    }

    @Test void corsAllowsConfiguredOriginAndRejectsOthers() throws Exception {
        mvc.perform(options("/api/accounts").header("Origin", "http://localhost:5173").header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/api/accounts").header("Origin", "https://untrusted.invalid").header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test void invalidIdAndUnknownRouteAreControlled() throws Exception {
        mvc.perform(get("/api/accounts/invalid").with(user("fixture").roles("CUSTOMER")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        mvc.perform(get("/unconfigured").with(user("fixture").roles("ADMIN"))).andExpect(status().isForbidden());
    }

    @Test void spendingSummaryRoutePermissions() throws Exception {
        mvc.perform(get("/api/customers/me/spending-summary")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/customers/me/spending-summary").with(user("fixture").roles("EMPLOYEE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/customers/me/spending-summary").with(user("fixture").roles("CUSTOMER"))).andExpect(status().isOk());
    }

    @Test void statementDispatchSecurityAndOwnership() throws Exception {
        mvc.perform(post("/api/admin/operations/dispatch-monthly-statements").with(user("fixture").roles("CUSTOMER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/operations/dispatch-monthly-statements").with(user("fixture").roles("EMPLOYEE"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/operations/dispatch-monthly-statements").with(user("fixture").roles("MANAGER"))).andExpect(status().isOk());
        mvc.perform(post("/api/admin/operations/dispatch-monthly-statements").with(user("fixture").roles("ADMIN"))).andExpect(status().isOk());
    }

    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, CorsConfig.class, JwtAuthFilter.class, JsonAuthenticationEntryPoint.class,
        JsonAccessDeniedHandler.class, AccountController.class, com.smartbank.smartbank_api.controller.CustomerController.class,
        com.smartbank.smartbank_api.controller.AdminOperationsController.class, GlobalExceptionHandler.class, PathFixture.class})
    static class Config {
        @Bean Clock clock() { return Clock.systemUTC(); }
        @Bean TokenSessionService sessions(Clock clock) { return new TokenSessionService(clock, 10); }
        @Bean JwtService jwt(Clock clock, TokenSessionService sessions) { return new JwtService("isolated-http-test-key-at-least-32-bytes", 24, clock, sessions); }
        @Bean CustomUserDetailsService users() { return mock(CustomUserDetailsService.class); }
        @Bean AccountService accounts() { return mock(AccountService.class); }
        @Bean com.smartbank.smartbank_api.repository.AccountRepository accountRepository() { return mock(com.smartbank.smartbank_api.repository.AccountRepository.class); }
        @Bean com.smartbank.smartbank_api.repository.TransactionRecordRepository transactionRecordRepository() { return mock(com.smartbank.smartbank_api.repository.TransactionRecordRepository.class); }
        @Bean com.smartbank.smartbank_api.repository.FixedDepositRepository fixedDepositRepository() { return mock(com.smartbank.smartbank_api.repository.FixedDepositRepository.class); }
        @Bean com.smartbank.smartbank_api.repository.BillPaymentRepository billPaymentRepository() { return mock(com.smartbank.smartbank_api.repository.BillPaymentRepository.class); }
        @Bean com.smartbank.smartbank_api.repository.BeneficiaryRepository beneficiaryRepository() { return mock(com.smartbank.smartbank_api.repository.BeneficiaryRepository.class); }
        @Bean com.smartbank.smartbank_api.service.CurrentUserService currentUserService() { return mock(com.smartbank.smartbank_api.service.CurrentUserService.class); }
        @Bean com.smartbank.smartbank_api.service.MonthlyStatementService statementService() { return mock(com.smartbank.smartbank_api.service.MonthlyStatementService.class); }
        @Bean com.smartbank.smartbank_api.service.CustomerSpendingService customerSpendingService() { return mock(com.smartbank.smartbank_api.service.CustomerSpendingService.class); }
        @Bean com.smartbank.smartbank_api.service.AuditLogService auditLogService() { return mock(com.smartbank.smartbank_api.service.AuditLogService.class); }
        @Bean com.smartbank.smartbank_api.service.PdfGeneratorService pdfGeneratorService() { return mock(com.smartbank.smartbank_api.service.PdfGeneratorService.class); }
        @Bean com.smartbank.smartbank_api.service.UserService userService() { return mock(com.smartbank.smartbank_api.service.UserService.class); }
        @Bean com.smartbank.smartbank_api.service.RiskScoringService riskScoringService() { return mock(com.smartbank.smartbank_api.service.RiskScoringService.class); }
        @Bean com.smartbank.smartbank_api.service.SmsService smsService() { return mock(com.smartbank.smartbank_api.service.SmsService.class); }
        @Bean com.smartbank.smartbank_api.service.EmailService emailService() { return mock(com.smartbank.smartbank_api.service.EmailService.class); }
    }

    @RestController static class PathFixture {
        @GetMapping({"/api/employee/loans", "/api/manager/loans", "/api/admin/users", "/api/notifications", "/api/employee/customers", "/api/employee/cards", "/api/exchange-rates", "/api/admin/operations/accounts"})
        String permitted() { return "allowed"; }
        @PutMapping("/api/employee/cards/1/issue") String issue() { return "allowed"; }
    }
}
