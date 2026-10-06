package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.entity.Customer;
import com.smartbank.smartbank_api.entity.Role;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.repository.CustomerRepository;
import com.smartbank.smartbank_api.repository.RoleRepository;
import com.smartbank.smartbank_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class SpendingSummaryMockMvcTests {

    @Autowired private WebApplicationContext context;
    @Autowired private UserRepository users;
    @Autowired private RoleRepository roles;
    @Autowired private CustomerRepository customers;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        if (users.findByUsername("mock_cust_mvc").isEmpty()) {
            Role role = roles.findByRoleNameIgnoreCase("ROLE_CUSTOMER").orElseGet(() -> {
                Role r = new Role();
                r.setRoleName("ROLE_CUSTOMER");
                return roles.save(r);
            });

            User user = new User();
            user.setUsername("mock_cust_mvc");
            user.setEmail("mock_cust_mvc@example.invalid");
            user.setPasswordHash("hash");
            user.setStatus("ACTIVE");
            user.setRole(role);
            user = users.save(user);

            Customer customer = new Customer();
            customer.setUser(user);
            customers.save(customer);
        }
    }

    @Test
    void spendingSummaryReturns401UnauthenticatedAnd200ForCustomerNever404() throws Exception {
        // Without token -> 401 Unauthorized (never 404)
        mockMvc.perform(get("/api/customers/me/spending-summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "mock_cust_mvc", roles = "CUSTOMER")
    void spendingSummaryReturns200ForCustomerNever404() throws Exception {
        // With CUSTOMER role -> 200 OK (never 404)
        mockMvc.perform(get("/api/customers/me/spending-summary"))
                .andExpect(status().isOk());
    }
}
