package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.BadCredentialsException;
@Service @RequiredArgsConstructor
public class CurrentUserService {
    private final UserRepository users;
    private final CustomerRepository customers;
    private final EmployeeRepository employees;
    private final AccountRepository accounts;
    public User requireUser() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if(auth==null || !auth.isAuthenticated()) throw new BadCredentialsException("Authentication required");
        User user=users.findByUsername(auth.getName()).orElseThrow(()->new BadCredentialsException("Authentication required"));
        if(!"ACTIVE".equals(user.getStatus())) throw new BadCredentialsException("Authentication required");
        return user;
    }
    public Customer requireCustomer() { return customers.findByUser_UserId(requireUser().getUserId()).orElseThrow(()->new BusinessRuleException("PROFILE_REQUIRED","Customer profile is unavailable")); }
    public Employee requireEmployee() {
        User user=requireUser();
        return employees.findByUser_UserId(user.getUserId()).orElseGet(()-> {
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
            if (!"Admin".equalsIgnoreCase(roleName) && !"Manager".equalsIgnoreCase(roleName) && !"Employee".equalsIgnoreCase(roleName)) {
                throw new BusinessRuleException("PROFILE_REQUIRED", "Employee profile is unavailable");
            }
            Employee employee = new Employee();
            employee.setUser(user);
            employee.setDepartment("Bank operations");
            employee.setPosition("Manager".equalsIgnoreCase(roleName) ? "Branch Manager" : "Bank Officer");
            return employees.save(employee);
        });
    }
    public Account requireOwnedAccount(Integer id) { return accounts.findByAccountIdAndCustomer_User_UserId(id,requireUser().getUserId()).orElseThrow(ResourceNotFoundException::new); }
}
