package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {
    private final AccountRepository accounts;
    private final TransactionRecordRepository transactionRecords;
    private final CustomerRepository customers;
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;
    private final NumberingService numbering;
    private final CurrentUserService current;
    private final NotificationService notifications;
    private final AuditLogService audit;
    private final Clock clock;
    private final tools.jackson.databind.ObjectMapper objectMapper;

    private void ensurePrimaryAccountForUser(Integer userId) {
        Customer customer = customers.findByUser_UserId(userId).orElse(null);
        if (customer == null) return;
        var userAccounts = accounts.findByCustomer_CustomerId(customer.getCustomerId());
        if (userAccounts.isEmpty()) return;
        boolean hasPrimary = userAccounts.stream().anyMatch(a -> Boolean.TRUE.equals(a.getIsPrimary()));
        if (!hasPrimary) {
            Account first = userAccounts.stream()
                    .filter(a -> "ACTIVE".equals(a.getStatus()))
                    .findFirst()
                    .orElse(userAccounts.get(0));
            first.setIsPrimary(true);
            accounts.save(first);
        }
    }

    public AccountView setPrimaryAccount(Integer id) {
        User user = current.requireUser();
        Account selected = current.requireOwnedAccount(id);
        BankRules.require("ACTIVE".equals(selected.getStatus()), "INVALID_STATE", "Only active accounts can be set as primary");

        Integer customerId = selected.getCustomer().getCustomerId();
        var customerAccounts = accounts.findByCustomer_CustomerId(customerId);
        for (Account a : customerAccounts) {
            boolean target = a.getAccountId().equals(id);
            if (!Boolean.valueOf(target).equals(a.getIsPrimary())) {
                a.setIsPrimary(target);
                accounts.save(a);
            }
        }

        audit.record(user, "PRIMARY_ACCOUNT_UPDATED", "Account", id);
        return ResponseMapper.account(selected);
    }

    @Transactional
    public PageResult<AccountView> list(int page, int size) {
        Integer userId = current.requireUser().getUserId();
        ensurePrimaryAccountForUser(userId);
        return PageResult.from(accounts
                .findByCustomer_User_UserId(userId, BankRules.page(page, size, "accountId"))
                .map(ResponseMapper::account));
    }

    @Transactional(readOnly = true)
    public AccountView get(Integer id) {
        return ResponseMapper.account(current.requireOwnedAccount(id));
    }

    public AccountView apply(AccountApplication r) {
        Customer c = current.requireCustomer();

        // Validate birthday - no future dates allowed
        if (r.dateOfBirth() != null && !r.dateOfBirth().isBlank()) {
            try {
                LocalDate dob = LocalDate.parse(r.dateOfBirth());
                BankRules.require(!dob.isAfter(LocalDate.now(clock)), "INVALID_DATE_OF_BIRTH",
                        "Date of birth cannot be in the future");
                c.setDateOfBirth(dob);
            } catch (java.time.format.DateTimeParseException e) {
                throw new BusinessRuleException("INVALID_DATE_OF_BIRTH", "Invalid date of birth format: " + r.dateOfBirth());
            }
        }

        // Update & save Customer KYC details on file
        if (r.nicNumber() != null && !r.nicNumber().isBlank()) {
            c.setNic(r.nicNumber().trim());
        }
        if (r.permanentAddress() != null && !r.permanentAddress().isBlank()) {
            c.setAddress(r.permanentAddress().trim());
        }
        customers.save(c);

        boolean isCurrent = r.accountType().contains("Current") || r.accountType().contains("Corporate")
                || r.accountType().contains("SmartBiz");
        String initialStatus = isCurrent ? "PENDING_MANAGER_APPROVAL" : "PENDING_EMPLOYEE_APPROVAL";

        Account a = new Account();
        a.setCustomer(c);
        a.setAccountType(r.accountType());
        a.setBalance(BigDecimal.ZERO);
        a.setStatus(initialStatus);

        java.util.Map<String, Object> kycMap = new java.util.LinkedHashMap<>();
        kycMap.put("fullName", r.fullName());
        kycMap.put("nic", r.nicNumber());
        kycMap.put("dob", r.dateOfBirth());
        kycMap.put("nationality", r.nationality());
        kycMap.put("gender", r.gender());
        kycMap.put("permanentAddress", r.permanentAddress());
        kycMap.put("currentAddress", r.currentAddress());
        kycMap.put("mobile", r.mobileNumber());
        kycMap.put("email", r.emailAddress());
        kycMap.put("occupation", r.occupationType());
        kycMap.put("employer", r.employerName());
        kycMap.put("income", r.monthlyAverageIncome());
        kycMap.put("sourceOfFunds", r.sourceOfFunds());
        kycMap.put("fatca", Boolean.TRUE.equals(r.fatcaCompliance()));
        kycMap.put("pep", Boolean.TRUE.equals(r.pepDeclaration()));

        String kycJson;
        try {
            kycJson = objectMapper.writeValueAsString(kycMap);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize KYC data", e);
        }
        a.setKycData(kycJson);
        accounts.save(a);

        audit.record(current.requireUser(), "ACCOUNT_APPLICATION_SUBMITTED", "Account", a.getAccountId());
        notifications.createNotification(
                c.getUser().getUserId(),
                "ACCOUNT_APPLICATION_RECEIVED",
                "Account Application Received",
                "Your application for a " + r.accountType() + " has been received and is under review ("
                        + (isCurrent ? "Requires Branch Manager Approval" : "Under Employee Verification") + ").");

        return ResponseMapper.account(a);
    }

    public AccountView employeeCreate(EmployeeDirectAccount r) {
        Employee emp = current.requireEmployee();
        User staffUser = emp.getUser();

        if (r.dateOfBirth() != null && r.dateOfBirth().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException("INVALID_DATE_OF_BIRTH", "Date of birth cannot be in the future");
        }

        Customer c = null;
        if (r.customerUserId() != null && r.customerUserId() > 0) {
            c = customers.findByUser_UserId(r.customerUserId()).orElse(null);
        }

        if (c == null && r.nic() != null && !r.nic().isBlank()) {
            c = customers.findByNicIgnoreCase(r.nic().trim()).orElse(null);
        }

        String tempUsername = null;
        String tempPassword = null;

        // If customer exists, update their record with provided parameters
        if (c != null) {
            if (r.nic() != null && !r.nic().isBlank())
                c.setNic(r.nic().trim());
            if (r.address() != null && !r.address().isBlank())
                c.setAddress(r.address().trim());
            if (r.dateOfBirth() != null)
                c.setDateOfBirth(r.dateOfBirth());
            customers.save(c);
        } else {
            // If customer does not exist, create a new Customer & User profile (Mandatory New CIF)
            BankRules.require(r.nic() != null && !r.nic().isBlank(), "NIC_REQUIRED",
                    "NIC number is mandatory for new customer provision");

            String normalizedNic = r.nic().trim().toLowerCase(Locale.ROOT);
            String username = "cust_" + normalizedNic.replaceAll("[^a-z0-9]", "");
            if (users.existsByUsername(username)) {
                username = username + "_" + ((int) (Math.random() * 900) + 100);
            }

            String email = (r.email() != null && !r.email().isBlank()) ? r.email().trim().toLowerCase(Locale.ROOT)
                    : (normalizedNic + "@serendibsmartbank.lk");
            if (users.existsByEmail(email)) {
                email = "cust_" + System.currentTimeMillis() + "@serendibsmartbank.lk";
            }

            Role custRole = roles.findByRoleNameIgnoreCase("Customer")
                    .orElseThrow(() -> new BusinessRuleException("ROLE_MISSING", "Customer role missing"));

            tempUsername = username;
            tempPassword = "Sb" + ((int) (Math.random() * 900000) + 100000) + "!";

            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setPhone(r.phone() != null ? r.phone().trim() : null);
            newUser.setPasswordHash(passwordEncoder.encode(tempPassword));
            newUser.setRole(custRole);
            newUser.setStatus("ACTIVE");
            newUser.setMustChangePassword(true);
            newUser.setCreatedAt(LocalDateTime.now(clock));
            users.save(newUser);

            c = new Customer();
            c.setUser(newUser);
            c.setNic(r.nic().trim());
            c.setAddress(r.address() != null ? r.address().trim() : "Colombo, Sri Lanka");
            c.setDateOfBirth(r.dateOfBirth());
            customers.save(c);

            // Assign CIF number starting from 0000000 based on primary key customer_id
            c.setCifNumber(numbering.formatCif(c.getCustomerId()));
            customers.save(c);

            audit.record(staffUser, "NEW_CUSTOMER_PROVISIONED", "Customer", c.getCustomerId());

            // Send notification with system generated credentials to user & customer email
            notifications.createNotification(
                    c.getUser().getUserId(),
                    "WELCOME_CREDENTIALS",
                    "Welcome to Serendib Smart Bank - Your Online Banking Credentials",
                    "Welcome to Serendib Smart Bank!\n\nYour online banking access has been created by bank staff.\n\n"
                            + "Username: " + tempUsername + "\n"
                            + "Temporary Password: " + tempPassword + "\n\n"
                            + "Please log in to online banking and upload your NIC Front image, NIC Back image, and Profile Picture to complete your verification.");
        }

        boolean isCurrent = r.accountType().contains("Current") || r.accountType().contains("Corporate")
                || r.accountType().contains("SmartBiz");
        BigDecimal initialBal = r.initialDeposit() != null && r.initialDeposit().compareTo(BigDecimal.ZERO) > 0
                ? r.initialDeposit()
                : BigDecimal.ZERO;

        Account a = new Account();
        a.setCustomer(c);
        a.setAccountType(r.accountType());
        a.setBalance(initialBal);
        a.setApprovedByOfficer(staffUser);

        if (staffUser.getRole() != null && "Manager".equalsIgnoreCase(staffUser.getRole().getRoleName())) {
            a.setApprovedByManager(staffUser);
        }

        a.setAccountNumber(numbering.generateAccountNumber(r.accountType()));
        if (isCurrent
                && (staffUser.getRole() == null || !"Manager".equalsIgnoreCase(staffUser.getRole().getRoleName()))) {
            a.setStatus("PENDING_MANAGER_APPROVAL");
        } else {
            a.setStatus("ACTIVE");
            a.setOpenDate(LocalDate.now(clock));
        }
        accounts.save(a);

        audit.record(staffUser, "EMPLOYEE_CREATED_ACCOUNT", "Account", a.getAccountId());
        notifications.createNotification(
                c.getUser().getUserId(),
                "ACCOUNT_PROVISIONED",
                "Account Provisioned",
                isCurrent
                        ? "An application for " + r.accountType()
                                + " has been initiated for you and is pending Branch Manager final approval."
                        : "A new " + r.accountType() + " account (" + a.getAccountNumber()
                                + ") has been opened for you.");

        return ResponseMapper.account(a, tempUsername, tempPassword);
    }

    @Transactional(readOnly = true)
    public PageResult<AccountView> listPendingEmployee(int page, int size) {
        current.requireEmployee();
        return PageResult.from(
                accounts.findByStatusIn(java.util.List.of("PENDING_EMPLOYEE_APPROVAL", "PENDING_MANAGER_APPROVAL"),
                        BankRules.page(page, size, "accountId")).map(ResponseMapper::account));
    }

    @Transactional(readOnly = true)
    public PageResult<AccountView> listPendingManager(int page, int size) {
        current.requireUser(); // Employee or Manager can view queue
        return PageResult
                .from(accounts.findByStatus("PENDING_MANAGER_APPROVAL", BankRules.page(page, size, "accountId"))
                        .map(ResponseMapper::account));
    }

    public AccountView approve(Integer id, BigDecimal initialDeposit) {
        Employee emp = current.requireEmployee();
        User staff = emp.getUser();
        Account a = accounts.findById(id).orElseThrow(ResourceNotFoundException::new);
        BankRules.require(
                "PENDING_EMPLOYEE_APPROVAL".equals(a.getStatus()) || "PENDING_MANAGER_APPROVAL".equals(a.getStatus()),
                "INVALID_STATE",
                "Only pending account applications can be approved");

        boolean isManagerOrAdmin = staff.getRole() != null &&
                ("Manager".equalsIgnoreCase(staff.getRole().getRoleName()) || "Admin".equalsIgnoreCase(staff.getRole().getRoleName()));
        boolean isCurrent = a.getAccountType() != null &&
                (a.getAccountType().contains("Current") || a.getAccountType().contains("Corporate") || a.getAccountType().contains("SmartBiz"));

        if (isCurrent && !isManagerOrAdmin) {
            a.setStatus("PENDING_MANAGER_APPROVAL");
            if (a.getApprovedByOfficer() == null) {
                a.setApprovedByOfficer(staff);
            }
            accounts.save(a);

            audit.record(staff, "ACCOUNT_RECOMMENDED_TO_MANAGER", "Account", a.getAccountId());
            notifications.createNotification(
                    a.getCustomer().getUser().getUserId(),
                    "ACCOUNT_APPLICATION_RECOMMENDED",
                    "Current Account Pre-Approved",
                    "Your application for " + a.getAccountType() + " has been verified by bank staff and submitted to the Branch Manager for final approval.");

            return ResponseMapper.account(a);
        }

        a.setStatus("ACTIVE");
        a.setOpenDate(LocalDate.now(clock));
        if (a.getApprovedByOfficer() == null) {
            a.setApprovedByOfficer(staff);
        }
        if (isManagerOrAdmin) {
            a.setApprovedByManager(staff);
        }
        if (a.getAccountNumber() == null || a.getAccountNumber().isBlank() || a.getAccountNumber().startsWith("SB-")) {
            a.setAccountNumber(numbering.generateAccountNumber(a.getAccountType()));
        }

        BigDecimal depositAmount = (initialDeposit != null && initialDeposit.compareTo(BigDecimal.ZERO) > 0)
                ? initialDeposit
                : new BigDecimal("1000.00");
        a.setBalance(a.getBalance() != null ? a.getBalance().add(depositAmount) : depositAmount);

        accounts.save(a);

        audit.record(staff, "ACCOUNT_APPROVED", "Account", a.getAccountId());
        notifications.createNotification(
                a.getCustomer().getUser().getUserId(),
                "ACCOUNT_APPROVED",
                "Account Approved & Funded",
                "Congratulations! Your " + a.getAccountType() + " account (" + a.getAccountNumber()
                        + ") is now ACTIVE with an initial deposit of LKR " + BankRules.decimal(depositAmount) + ".");

        return ResponseMapper.account(a);
    }

    public AccountView approve(Integer id) {
        return approve(id, null);
    }


    public AccountView reject(Integer id, String reason) {
        Employee emp = current.requireEmployee();
        User staff = emp.getUser();
        Account a = accounts.findById(id).orElseThrow(ResourceNotFoundException::new);
        BankRules.require(
                "PENDING_EMPLOYEE_APPROVAL".equals(a.getStatus()) || "PENDING_MANAGER_APPROVAL".equals(a.getStatus()),
                "INVALID_STATE",
                "Only pending account applications can be rejected");

        a.setStatus("REJECTED");
        a.setRejectionReason(reason);
        accounts.save(a);

        audit.record(staff, "ACCOUNT_REJECTED", "Account", a.getAccountId());
        notifications.createNotification(
                a.getCustomer().getUser().getUserId(),
                "ACCOUNT_REJECTED",
                "Account Application Status",
                "Your application for a " + a.getAccountType() + " account was not approved. Reason: " + reason);

        return ResponseMapper.account(a);
    }

    public TransactionView depositCash(DirectDeposit req) {
        Account a = null;
        try {
            a = accounts.findByAccountNumber(req.accountNumber()).orElse(null);
            if (a == null) {
                a = accounts.findById(Integer.parseInt(req.accountNumber())).orElseThrow(ResourceNotFoundException::new);
            }
        } catch (NumberFormatException e) {
            throw new ResourceNotFoundException();
        }
        if (a == null) throw new ResourceNotFoundException();

        BankRules.require("ACTIVE".equals(a.getStatus()), "INACTIVE_ACCOUNT", "Account is not active");

        BigDecimal amount = req.amount();
        a.setBalance(a.getBalance().add(amount));
        Account saved = accounts.save(a);

        TransactionRecord txn = new TransactionRecord();
        txn.setToAccount(saved);
        txn.setAmount(amount);
        txn.setTransactionType("DEPOSIT");
        txn.setStatus("COMPLETED");
        txn.setDescription(req.description() != null && !req.description().isBlank() ? req.description() : "Cash Deposit");
        txn.setCreatedAt(LocalDateTime.now(clock));
        txn.setCompletedAt(LocalDateTime.now(clock));

        User actor = null;
        try { actor = current.requireUser(); } catch (Exception ignored) {}
        if (actor != null) txn.setInitiatedBy(actor);

        TransactionRecord record = transactionRecords.save(txn);

        audit.record(actor, "CASH_DEPOSIT", "Account", a.getAccountId());
        notifications.createNotification(
                a.getCustomer().getUser().getUserId(),
                "DEPOSIT",
                "Cash Deposit Completed",
                "LKR " + BankRules.decimal(amount) + " deposited to account (" + a.getAccountNumber() + "). New balance: LKR " + BankRules.decimal(saved.getBalance()) + "."
        );

        return ResponseMapper.transaction(record, a.getCustomer().getUser().getUserId());
    }

    public User requireManagerOrAdmin() {
        User user = current.requireUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        if (!"Manager".equalsIgnoreCase(roleName) && !"Admin".equalsIgnoreCase(roleName)) {
            throw new BusinessRuleException("FORBIDDEN", "Only Branch Managers and System Administrators can perform this action");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public PageResult<AccountView> listAllAccounts(String query, int page, int size) {
        current.requireUser();
        return PageResult.from(accounts.searchAccounts(query, BankRules.page(page, size, "accountId"))
                .map(ResponseMapper::account));
    }

    @Transactional(readOnly = true)
    public PageResult<TransactionView> getAccountTransactions(Integer accountId, int page, int size) {
        current.requireUser();
        return PageResult.from(transactionRecords.findByAccountId(accountId, BankRules.page(page, size, "createdAt"))
                .map(t -> ResponseMapper.transaction(t, current.requireUser().getUserId())));
    }

    public AccountView toggleHoldAccount(Integer id) {
        User staff = requireManagerOrAdmin();
        Account a = accounts.findById(id).orElseThrow(ResourceNotFoundException::new);

        if ("HELD".equalsIgnoreCase(a.getStatus()) || "HOLD".equalsIgnoreCase(a.getStatus())) {
            a.setStatus("ACTIVE");
            audit.record(staff, "ACCOUNT_UNHELD", "Account", a.getAccountId());
            if (a.getCustomer() != null && a.getCustomer().getUser() != null) {
                notifications.createNotification(
                        a.getCustomer().getUser().getUserId(),
                        "ACCOUNT_STATUS_UPDATED",
                        "Account Un-held",
                        "The hold on your account (" + a.getAccountNumber() + ") has been released by bank management.");
            }
        } else {
            a.setStatus("HELD");
            audit.record(staff, "ACCOUNT_HELD", "Account", a.getAccountId());
            if (a.getCustomer() != null && a.getCustomer().getUser() != null) {
                notifications.createNotification(
                        a.getCustomer().getUser().getUserId(),
                        "ACCOUNT_STATUS_UPDATED",
                        "Account Held / Frozen",
                        "Your account (" + a.getAccountNumber() + ") has been placed on HOLD by bank management.");
            }
        }
        accounts.save(a);
        return ResponseMapper.account(a);
    }

    public void deleteAccount(Integer id) {
        User staff = requireManagerOrAdmin();
        Account a = accounts.findById(id).orElseThrow(ResourceNotFoundException::new);
        a.setStatus("DELETED");
        accounts.save(a);
        audit.record(staff, "ACCOUNT_DELETED", "Account", a.getAccountId());
        if (a.getCustomer() != null && a.getCustomer().getUser() != null) {
            notifications.createNotification(
                    a.getCustomer().getUser().getUserId(),
                    "ACCOUNT_DELETED",
                    "Account Closed",
                    "Your account (" + a.getAccountNumber() + ") has been closed by bank management.");
        }
    }

    private String escapeJson(String input) {
        if (input == null)
            return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }
}