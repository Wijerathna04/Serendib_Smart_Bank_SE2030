package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.entity.TransactionRecord;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import java.time.Clock;
import java.time.LocalDate;

@RestController @RequestMapping("/api/transactions") @RequiredArgsConstructor
public class TransactionController {
    private final TransactionService service;
    private final TransactionRecordRepository transactionRecordRepository;
    private final CurrentUserService currentUserService;
    private final PdfGeneratorService pdfGeneratorService;
    private final Clock clock;

    @GetMapping public PageResult<TransactionView> list(@RequestParam(required=false) String type,@RequestParam(required=false) String status,
        @RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to,@RequestParam(required=false) String search,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(type,status,from,to,search,page,size); }
    @GetMapping("/{id}") public TransactionView get(@PathVariable Integer id) { return service.get(id); }
    @GetMapping("/{id}/receipt") public TransactionView receipt(@PathVariable Integer id) { var t=service.get(id); BankRules.require("COMPLETED".equals(t.status()),"INVALID_STATE","Receipt is available after completion"); return t; }

    @GetMapping(value = "/{id}/receipt.pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> getReceiptPdf(@PathVariable Integer id) {
        TransactionRecord t = transactionRecordRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        User user = currentUserService.requireUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        boolean isStaff = "ROLE_EMPLOYEE".equalsIgnoreCase(roleName) || "EMPLOYEE".equalsIgnoreCase(roleName)
                || "ROLE_MANAGER".equalsIgnoreCase(roleName) || "MANAGER".equalsIgnoreCase(roleName)
                || "ROLE_ADMIN".equalsIgnoreCase(roleName) || "ADMIN".equalsIgnoreCase(roleName);

        if (!isStaff) {
            boolean isOwner = (t.getFromAccount() != null && t.getFromAccount().getCustomer() != null && t.getFromAccount().getCustomer().getUser() != null && t.getFromAccount().getCustomer().getUser().getUserId().equals(user.getUserId()))
                    || (t.getToAccount() != null && t.getToAccount().getCustomer() != null && t.getToAccount().getCustomer().getUser() != null && t.getToAccount().getCustomer().getUser().getUserId().equals(user.getUserId()))
                    || (t.getInitiatedBy() != null && t.getInitiatedBy().getUserId().equals(user.getUserId()));
            if (!isOwner) {
                throw new AccessDeniedException("Access denied: You do not own this transaction receipt.");
            }
        }

        byte[] pdfBytes = pdfGeneratorService.generateTransactionReceiptPdf(t, clock);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"receipt-txn-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
