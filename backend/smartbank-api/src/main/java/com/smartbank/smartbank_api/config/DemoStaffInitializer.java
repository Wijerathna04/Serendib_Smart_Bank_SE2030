package com.smartbank.smartbank_api.config;

import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Local demonstration users only. Existing credentials and roles are preserved. */
@Component
@ConditionalOnProperty(name="bank.demo.staff-enabled",havingValue="true")
@RequiredArgsConstructor
public class DemoStaffInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final EmployeeRepository employees;
    private final PasswordEncoder encoder;
    private final Clock clock;

    @Override @Transactional
    public void run(ApplicationArguments args) {
        create("clb1020","Manager","Branch manager");
        create("pf2030","Employee","Bank staff member");
    }

    private void create(String username,String roleName,String position) {
        if(users.findByUsername(username).isPresent()) return;
        Role role=roles.findByRoleNameIgnoreCase(roleName).orElseGet(()->{
            Role created=new Role();created.setRoleName(roleName);created.setDescription(position);return roles.save(created);
        });
        User user=new User();user.setUsername(username);user.setPasswordHash(encoder.encode(username));
        user.setEmail(username+"@serendib.example");user.setRole(role);user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now(clock));users.save(user);
        Employee employee=new Employee();employee.setUser(user);employee.setDepartment("Bank operations");
        employee.setPosition(position);employee.setDateJoined(LocalDate.now(clock));employees.save(employee);
    }
}
