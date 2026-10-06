package com.smartbank.smartbank_api.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank
    @jakarta.validation.constraints.Size(max=50)
    private String username;

    @NotBlank
    @jakarta.validation.constraints.Size(max=72)
    private String password;

    public LoginRequest() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}