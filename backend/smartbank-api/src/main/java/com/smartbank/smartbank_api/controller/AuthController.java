package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.AuthResponse;
import com.smartbank.smartbank_api.dto.LoginRequest;
import com.smartbank.smartbank_api.dto.RegisterRequest;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.security.JwtService;
import com.smartbank.smartbank_api.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService,
            JwtService jwtService) {

        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        User savedUser = userService.registerUser(request);

        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        User user = userService
                .getUserByUsername(
                        request.getUsername())
                .orElseThrow(
                        () -> new RuntimeException(
                                "Invalid username"));

        String token = jwtService.generateToken(
                user.getUsername());

        AuthResponse response = new AuthResponse(
                token,
                user.getUsername(),
                user.getRole().getRoleName());

        return ResponseEntity.ok(response);
    }
}