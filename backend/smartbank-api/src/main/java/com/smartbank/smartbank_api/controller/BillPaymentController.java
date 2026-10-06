package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.entity.BillPayment;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.dto.BankRequests.Bill;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import java.time.Clock;

@RestController @RequestMapping("/api/bill-payments") @RequiredArgsConstructor
public class BillPaymentController {
    private final BillPaymentService service;
    private final BillPaymentRepository billPaymentRepository;
    private final CurrentUserService currentUserService;
    private final PdfGeneratorService pdfGeneratorService;
    private final Clock clock;

    @GetMapping public PageResult<BillView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(page,size); }
    @GetMapping("/{id}") public BillView get(@PathVariable Integer id) { return service.get(id); }
    @PostMapping public BillView create(@Valid @RequestBody Bill request,@RequestHeader("Idempotency-Key") String key) { return service.initiate(request,key); }

    @GetMapping(value = "/{id}/receipt.pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> getReceiptPdf(@PathVariable Integer id) {
        BillPayment b = billPaymentRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        User user = currentUserService.requireUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        boolean isStaff = "ROLE_EMPLOYEE".equalsIgnoreCase(roleName) || "EMPLOYEE".equalsIgnoreCase(roleName)
                || "ROLE_MANAGER".equalsIgnoreCase(roleName) || "MANAGER".equalsIgnoreCase(roleName)
                || "ROLE_ADMIN".equalsIgnoreCase(roleName) || "ADMIN".equalsIgnoreCase(roleName);

        if (!isStaff) {
            boolean isOwner = (b.getAccount() != null && b.getAccount().getCustomer() != null && b.getAccount().getCustomer().getUser() != null && b.getAccount().getCustomer().getUser().getUserId().equals(user.getUserId()));
            if (!isOwner) {
                throw new AccessDeniedException("Access denied: You do not own this bill payment receipt.");
            }
        }

        byte[] pdfBytes = pdfGeneratorService.generateBillPaymentReceiptPdf(b, clock);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"receipt-bill-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
