package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.AuthResponse;
import com.smartbank.smartbank_api.dto.LoginRequest;
import com.smartbank.smartbank_api.dto.RegisterRequest;
import com.smartbank.smartbank_api.dto.UserResponse;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.security.JwtService;
import com.smartbank.smartbank_api.service.UserService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

        private final UserService userService;
        private final JwtService jwtService;

        public AuthController(UserService userService, JwtService jwtService) {
                this.userService = userService;
                this.jwtService = jwtService;
        }

        @PostMapping("/register")
        public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
                User savedUser = userService.registerUser(request);
                UserResponse response = new UserResponse(
                                savedUser.getUserId(), savedUser.getUsername(),
                                savedUser.getEmail(), savedUser.getRole().getRoleName());
                return ResponseEntity.ok(response);
        }

        @PostMapping("/login")
        public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
                User user = userService.authenticate(request.getUsername(), request.getPassword());
                String token = jwtService.generateToken(user.getUsername());
                AuthResponse response = new AuthResponse(token, user.getUsername(), user.getRole().getRoleName());
                return ResponseEntity.ok(response);
        }
}