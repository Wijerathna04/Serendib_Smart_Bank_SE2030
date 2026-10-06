package com.smartbank.smartbank_api.config;

import com.smartbank.smartbank_api.entity.Role;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.repository.RoleRepository;
import com.smartbank.smartbank_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.LocalDateTime;

/** Explicitly enabled local demonstration account; existing users are never overwritten. */
@Component
@ConditionalOnProperty(name="bank.demo.admin-enabled",havingValue="true")
@RequiredArgsConstructor
public class DemoAdminInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder encoder;
    private final Clock clock;

    @Override @Transactional
    public void run(ApplicationArguments args) {
        if(users.findByUsername("admin").isPresent()) return;
        Role role=roles.findByRoleNameIgnoreCase("Admin").orElseGet(()->{
            Role created=new Role();created.setRoleName("Admin");created.setDescription("System administration and audit");return roles.save(created);
        });
        User user=new User();user.setUsername("admin");user.setPasswordHash(encoder.encode("admin"));
        user.setEmail("admin@serendib.example");user.setRole(role);user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now(clock));users.save(user);
    }
}
