package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final UserService service;
    private final CustomerSpendingService customerSpendingService;
    private final RiskScoringService riskScoringService;
    private final CurrentUserService currentUserService;

    @GetMapping("/me")
    public ProfileView get() {
        return service.profile();
    }

    @GetMapping("/{id}/risk-summary")
    public java.util.List<RiskAssessmentView> getRiskSummary(@PathVariable Integer id) {
        com.smartbank.smartbank_api.entity.User user = currentUserService.requireUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        boolean isStaff = "ROLE_EMPLOYEE".equalsIgnoreCase(roleName) || "EMPLOYEE".equalsIgnoreCase(roleName)
                || "ROLE_MANAGER".equalsIgnoreCase(roleName) || "MANAGER".equalsIgnoreCase(roleName)
                || "ROLE_ADMIN".equalsIgnoreCase(roleName) || "ADMIN".equalsIgnoreCase(roleName);
        if (!isStaff) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: Only bank staff can view customer risk summary.");
        }
        return riskScoringService.getRiskSummaryForCustomer(id);
    }

    @GetMapping("/me/spending-summary")
    public SpendingSummaryView getSpendingSummary() {
        return customerSpendingService.getSpendingSummary();
    }

    @PatchMapping("/me")
    public ProfileView update(@Valid @RequestBody Profile r) {
        return service.updateProfile(r);
    }

    @PatchMapping("/me/profile-image")
    public ProfileView updateProfileImage(@RequestBody Map<String, String> body) {
        String url = body != null ? body.get("profileImage") : null;
        return service.updateProfileImage(url);
    }

    @PatchMapping({"/me/kyc-documents", "/me/kyc", "/kyc-documents", "/kyc"})
    @PostMapping({"/me/kyc-documents", "/me/kyc", "/kyc-documents", "/kyc"})
    @PutMapping({"/me/kyc-documents", "/me/kyc", "/kyc-documents", "/kyc"})
    public ProfileView updateKycDocuments(@RequestBody Map<String, String> body) {
        String nicFront = body != null ? body.get("nicFrontImage") : null;
        String nicBack = body != null ? body.get("nicBackImage") : null;
        String profileImg = body != null ? body.get("profileImage") : null;
        return service.updateKycDocuments(nicFront, nicBack, profileImg);
    }

    @DeleteMapping("/me/profile-image")
    public ProfileView deleteProfileImage() {
        return service.updateProfileImage(null);
    }
}
