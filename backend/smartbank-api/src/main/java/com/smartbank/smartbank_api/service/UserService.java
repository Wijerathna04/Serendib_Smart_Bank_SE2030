package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.RegisterRequest;
import com.smartbank.smartbank_api.entity.Role;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.repository.RoleRepository;
import com.smartbank.smartbank_api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();

        user.setUsername(request.getUsername());

        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));

        user.setEmail(request.getEmail());

        user.setStatus("ACTIVE");

        user.setCreatedAt(LocalDateTime.now());

        // Default role = CUSTOMER
        Optional<Role> roleOptional = roleRepository.findByRoleNameIgnoreCase("CUSTOMER");

        if (roleOptional.isEmpty()) {
            throw new RuntimeException("Default role not found");
        }

        user.setRole(roleOptional.get());

        return userRepository.save(user);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
