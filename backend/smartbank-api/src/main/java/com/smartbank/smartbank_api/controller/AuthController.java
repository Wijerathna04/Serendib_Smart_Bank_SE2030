package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.dto.*;
import com.smartbank.smartbank_api.dto.BankResponses.ProfileView;
import com.smartbank.smartbank_api.security.*;
import com.smartbank.smartbank_api.service.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.Map;
@RestController @RequestMapping("/auth") @RequiredArgsConstructor
public class AuthController {
    private final UserService users;
    private final JwtService jwt;
    private final TokenSessionService sessions;
    private final AuthAttemptService attempts;
    private final AuditLogService audit;
    private final CurrentUserService current;
    private final EmailService emailService;
    @PostMapping("/register") public UserResponse register(@Valid @RequestBody RegisterRequest request,HttpServletRequest http) {
        attempts.check("register:"+http.getRemoteAddr(),5);var user=users.registerUser(request);return new UserResponse(user.getUserId(),user.getUsername(),user.getEmail(),user.getRole().getRoleName());
    }
    @PostMapping("/register-existing") public UserResponse registerExisting(@Valid @RequestBody BankRequests.RegisterExistingCustomer request,HttpServletRequest http) {
        attempts.check("register-existing:"+http.getRemoteAddr(),5);var user=users.registerExistingCustomer(request);return new UserResponse(user.getUserId(),user.getUsername(),user.getEmail(),user.getRole().getRoleName());
    }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest request,HttpServletRequest http) {
        attempts.check("login-ip:"+http.getRemoteAddr(),30);attempts.check("login-user:"+request.getUsername().trim(),10);
        var user=users.authenticate(request.getUsername(),request.getPassword());String token=jwt.generateToken(user.getUsername());
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendLoginNotification(user.getEmail(), user.getUsername(), http.getRemoteAddr());
        }
        return new AuthResponse(token,user.getUsername(),user.getRole().getRoleName());
    }
    @GetMapping("/me") public ProfileView me() {return users.profile();}
    @PostMapping("/logout") public void logout(@RequestHeader("Authorization") String header) {
        var claims=jwt.claims(header.substring(7));sessions.revoke(claims.getId());
        var user=current.requireUser();
        audit.record(user,"LOGOUT","User",user.getUserId());
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendLogoutNotification(user.getEmail(), user.getUsername());
        }
    }
    @PostMapping("/activity") public Map<String,Boolean> activity(@RequestHeader("Authorization") String header) {
        var claims=jwt.claims(header.substring(7));if(!sessions.activity(claims.getId(),claims.getSubject())) throw new org.springframework.security.authentication.BadCredentialsException("Session expired");return Map.of("active",true);
    }
    @PostMapping("/change-password") public void password(@Valid @RequestBody BankRequests.Password request) { attempts.check("password:"+current.requireUser().getUserId(),5);users.changePassword(request); }
}
