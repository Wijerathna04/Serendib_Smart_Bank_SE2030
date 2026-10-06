package com.smartbank.smartbank_api.security;

import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        String rawRole = (user.getRole() != null && user.getRole().getRoleName() != null) ? user.getRole().getRoleName() : "CUSTOMER";
        String upper = rawRole.toUpperCase(Locale.ROOT).trim();
        if (upper.startsWith("ROLE_")) {
            upper = upper.substring(5);
        }
        if (upper.startsWith("BANK ")) {
            upper = upper.substring(5);
        }
        String roleName = "ROLE_" + upper;

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                "ACTIVE".equals(user.getStatus()), true, true, true,
                List.of(new SimpleGrantedAuthority(roleName)));
    }
}