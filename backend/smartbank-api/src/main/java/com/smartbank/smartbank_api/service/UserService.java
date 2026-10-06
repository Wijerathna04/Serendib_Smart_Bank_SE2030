package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.security.TokenSessionService;
import com.smartbank.smartbank_api.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customers;
    private final EmployeeRepository employees;
    private final AccountRepository accountRepository;
    private final FixedDepositRepository fixedDepositRepository;
    private final LoanRepository loanRepository;
    private final CardRepository cardRepository;
    private final TransactionRecordRepository transactionRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final NumberingService numbering;
    private final CurrentUserService current;
    private final AuditLogService audit;
    private final NotificationService notifications;
    private final TokenSessionService sessions;
    private final Clock clock;

    private void passwordPolicy(String password) {
        BankRules.require(
                password != null && password.length() >= 8 && password.getBytes(StandardCharsets.UTF_8).length <= 72,
                "PASSWORD_POLICY", "Password must contain at least 8 characters and at most 72 UTF-8 bytes");
    }

    private Role role(String name) {
        return roleRepository.findByRoleNameIgnoreCase(name)
                .orElseThrow(() -> new BusinessRuleException("ROLE_MISSING",
                        "Required role is missing; apply the documented database setup"));
    }

    private void unique(String username, String email) {
        BankRules.require(!userRepository.existsByUsername(username), "DUPLICATE_USER", "Username already exists");
        BankRules.require(!userRepository.existsByEmail(email), "DUPLICATE_EMAIL", "Email already exists");
    }

    public User registerUser(RegisterRequest request) {
        String username = request.getUsername().trim(), email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        BankRules.require(username.matches("[A-Za-z0-9_.-]{3,50}"), "INVALID_USERNAME",
                "Use 3 to 50 letters, digits, dots, hyphens or underscores");
        unique(username, email);
        passwordPolicy(request.getPassword());

        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        u.setRole(role("Customer"));
        u.setStatus("ACTIVE");
        u.setCreatedAt(LocalDateTime.now(clock));
        userRepository.save(u);

        Customer c = new Customer();
        c.setUser(u);
        customers.save(c);

        // Set CIF number starting from 0000000 based on primary key customer_id
        c.setCifNumber(numbering.formatCif(c.getCustomerId()));
        customers.save(c);

        audit.record(u, "USER_REGISTERED", "User", u.getUserId());
        notifications.createNotification(u.getUserId(), "WELCOME", "Welcome to Serendib",
                "Your customer profile is ready. CIF Number: " + c.getCifNumber());
        return u;
    }

    public User registerExistingCustomer(RegisterExistingCustomer r) {
        String nic = r.nic().trim();
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        String phone = r.phone().trim();

        passwordPolicy(r.password());

        // Find customer record by matching NIC, bank registered email, and phone
        Customer c = customers.findByNicIgnoreCaseAndUser_EmailIgnoreCaseAndUser_Phone(nic, email, phone)
                .or(() -> customers.findByNicIgnoreCase(nic))
                .or(() -> customers.findByUser_EmailIgnoreCaseAndUser_Phone(email, phone))
                .orElseThrow(() -> new BusinessRuleException("CUSTOMER_NOT_FOUND",
                        "No existing bank customer profile found matching this NIC, registered email, and phone number. Please contact customer support."));

        User u = c.getUser();
        String newUsername = r.username().trim();
        if (!u.getUsername().equals(newUsername)) {
            BankRules.require(!userRepository.existsByUsername(newUsername), "DUPLICATE_USER",
                    "Username already exists");
            u.setUsername(newUsername);
        }

        u.setEmail(email);
        u.setPhone(phone);
        u.setPasswordHash(passwordEncoder.encode(r.password()));
        u.setStatus("ACTIVE");
        userRepository.save(u);

        if (c.getCifNumber() == null) {
            c.setCifNumber(numbering.formatCif(c.getCustomerId()));
            customers.save(c);
        }

        audit.record(u, "EXISTING_CUSTOMER_REGISTERED", "User", u.getUserId());
        notifications.createNotification(u.getUserId(), "ONLINE_BANKING_ACTIVATED", "Online Banking Activated",
                "Your Serendib Smart Bank online access is active. CIF Number: " + c.getCifNumber());

        return u;
    }

    @Transactional(readOnly = true)
    public CustomerSearchResult searchCustomerByNic(String nic) {
        if (nic == null || nic.isBlank()) {
            return new CustomerSearchResult(false, null, null, null, null, null, null, null, null, null,
                    numbering.getNextCifNumber());
        }

        Customer c = customers.findByNicIgnoreCase(nic.trim()).orElse(null);
        if (c == null) {
            return new CustomerSearchResult(false, null, null, null, nic.trim(), null, null, null, null, null,
                    numbering.getNextCifNumber());
        }

        String cif = c.getCifNumber() != null ? c.getCifNumber() : numbering.formatCif(c.getCustomerId());
        User u = c.getUser();
        return new CustomerSearchResult(
                true,
                c.getCustomerId(),
                u != null ? u.getUserId() : null,
                cif,
                c.getNic(),
                u != null ? u.getUsername() : "Customer",
                u != null ? u.getEmail() : null,
                u != null ? u.getPhone() : null,
                c.getAddress(),
                c.getDateOfBirth(),
                cif);
    }

    public User authenticate(String username, String rawPassword) {
        User u = userRepository.findByUsername(username.trim()).orElse(null);
        if (u == null || !"ACTIVE".equals(u.getStatus())
                || !passwordEncoder.matches(rawPassword, u.getPasswordHash())) {
            audit.recordAttempt(u, "LOGIN_FAILED", "User", u == null ? null : u.getUserId());
            throw new BadCredentialsException("Invalid username or password");
        }
        audit.record(u, "LOGIN_SUCCESS", "User", u.getUserId());
        return u;
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public ProfileView profile() {
        return profile(current.requireUser());
    }

    private ProfileView profile(User u) {
        Customer c = customers.findByUser_UserId(u.getUserId()).orElse(null);
        String cif = c != null ? (c.getCifNumber() != null ? c.getCifNumber() : numbering.formatCif(c.getCustomerId()))
                : null;

        String fullName = (c != null && c.getFullName() != null && !c.getFullName().isBlank()) ? c.getFullName() : u.getUsername();
        boolean hasBankAccounts = accountRepository != null && accountRepository.existsByCustomer_User_UserId(u.getUserId());
        String userCategory = hasBankAccounts ? "Bank users" : "Wallet users";

        // Default fallback avatar and document preview URLs if missing in DB
        String profileImg = (c != null && c.getProfileImage() != null && !c.getProfileImage().isBlank())
                ? c.getProfileImage()
                : (u.getProfileImage() != null && !u.getProfileImage().isBlank()
                    ? u.getProfileImage()
                    : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + u.getUsername());

        String nicFrontImg = (c != null && c.getNicFrontImage() != null)
                ? c.getNicFrontImage()
                : "https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Front+Document+Card";

        String nicBackImg = (c != null && c.getNicBackImage() != null)
                ? c.getNicBackImage()
                : "https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Back+Document+Card";

        FinancialStatsView financialStats = calculateFinancialStats(u.getUserId());

        return new ProfileView(
                u.getUserId(),
                c == null ? null : c.getCustomerId(),
                cif,
                u.getUsername(),
                u.getEmail(),
                u.getPhone(),
                u.getRole().getRoleName(),
                u.getStatus(),
                c == null ? null : c.getNic(),
                c == null ? null : c.getAddress(),
                c == null ? null : c.getDateOfBirth(),
                profileImg,
                nicFrontImg,
                nicBackImg,
                fullName,
                userCategory,
                financialStats,
                u.getMustChangePassword());
    }

    private FinancialStatsView calculateFinancialStats(Integer userId) {
        if (userId == null) {
            return new FinancialStatsView(0, BigDecimal.ZERO, 0, BigDecimal.ZERO, 0, BigDecimal.ZERO, 0, 0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        // Accounts
        List<Account> accs = accountRepository != null ? accountRepository.findByCustomer_User_UserId(userId, org.springframework.data.domain.Pageable.unpaged()).getContent() : List.of();
        int totalAccounts = accs.size();
        BigDecimal totalAccountBalance = accs.stream()
                .map(Account::getBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fixed Deposits
        List<FixedDeposit> fds = fixedDepositRepository != null ? fixedDepositRepository.findByAccount_Customer_User_UserId(userId, org.springframework.data.domain.Pageable.unpaged()).getContent() : List.of();
        int totalFixedDepositsCount = fds.size();
        BigDecimal totalFixedDepositAmount = fds.stream()
                .map(FixedDeposit::getPrincipalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Loans
        List<Loan> lns = loanRepository != null ? loanRepository.findByCustomer_User_UserId(userId, org.springframework.data.domain.Pageable.unpaged()).getContent() : List.of();
        int totalLoansCount = lns.size();
        BigDecimal totalLoanBalance = lns.stream()
                .map(l -> {
                    BigDecimal app = l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO;
                    BigDecimal paid = l.getPaidAmount() != null ? l.getPaidAmount() : BigDecimal.ZERO;
                    BigDecimal rem = app.subtract(paid);
                    return rem.compareTo(BigDecimal.ZERO) > 0 ? rem : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Cards
        int totalCardsCount = cardRepository != null ? (int) cardRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements() : 0;

        // Transactions
        List<TransactionRecord> txs = transactionRecordRepository != null ? transactionRecordRepository.search(userId, null, null, null, null, null, org.springframework.data.domain.Pageable.unpaged()).getContent() : List.of();
        long totalTransactionsCount = txs.size();

        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalWithdrawals = BigDecimal.ZERO;

        for (TransactionRecord tx : txs) {
            if ("COMPLETED".equalsIgnoreCase(tx.getStatus()) || tx.getStatus() == null) {
                BigDecimal amt = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
                boolean fromUser = tx.getFromAccount() != null && tx.getFromAccount().getCustomer() != null && tx.getFromAccount().getCustomer().getUser() != null && userId.equals(tx.getFromAccount().getCustomer().getUser().getUserId());
                boolean toUser = tx.getToAccount() != null && tx.getToAccount().getCustomer() != null && tx.getToAccount().getCustomer().getUser() != null && userId.equals(tx.getToAccount().getCustomer().getUser().getUserId());

                if (fromUser && !toUser) {
                    totalWithdrawals = totalWithdrawals.add(amt);
                } else if (toUser && !fromUser) {
                    totalDeposits = totalDeposits.add(amt);
                } else if (!fromUser && !toUser) {
                    totalDeposits = totalDeposits.add(amt);
                }
            }
        }

        BigDecimal netFlow = totalDeposits.subtract(totalWithdrawals);

        return new FinancialStatsView(
                totalAccounts,
                totalAccountBalance,
                totalFixedDepositsCount,
                totalFixedDepositAmount,
                totalLoansCount,
                totalLoanBalance,
                totalCardsCount,
                totalTransactionsCount,
                totalDeposits,
                totalWithdrawals,
                netFlow);
    }

    public ProfileView updateProfile(Profile r) {
        User u = current.requireUser();
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmail(email).ifPresent(other -> BankRules.require(other.getUserId().equals(u.getUserId()),
                "DUPLICATE_EMAIL", "Email already exists"));

        if (r.dateOfBirth() != null && r.dateOfBirth().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException("INVALID_DATE_OF_BIRTH", "Date of birth cannot be in the future");
        }

        u.setEmail(email);
        u.setPhone(r.phone());
        if (r.profileImage() != null) {
            String imgUrl = r.profileImage().trim().isEmpty() ? null : r.profileImage().trim();
            u.setProfileImage(imgUrl);
        }
        userRepository.save(u);

        Customer c = customers.findByUser_UserId(u.getUserId()).orElse(null);
        if (c != null) {
            c.setAddress(r.address());
            c.setNic(r.nic());
            c.setDateOfBirth(r.dateOfBirth());
            if (r.profileImage() != null) {
                String imgUrl = r.profileImage().trim().isEmpty() ? null : r.profileImage().trim();
                c.setProfileImage(imgUrl);
            }
            if (r.nicFrontImage() != null) {
                String imgUrl = r.nicFrontImage().trim().isEmpty() ? null : r.nicFrontImage().trim();
                c.setNicFrontImage(imgUrl);
            }
            if (r.nicBackImage() != null) {
                String imgUrl = r.nicBackImage().trim().isEmpty() ? null : r.nicBackImage().trim();
                c.setNicBackImage(imgUrl);
            }
            if (c.getCifNumber() == null) {
                c.setCifNumber(numbering.formatCif(c.getCustomerId()));
            }
            customers.save(c);
        }
        audit.record(u, "PROFILE_UPDATED", "User", u.getUserId());
        return profile(u);
    }

    public ProfileView updateKycDocuments(String nicFrontImage, String nicBackImage, String profileImage) {
        User u = current.requireUser();
        Customer c = customers.findByUser_UserId(u.getUserId()).orElse(null);
        if (c != null) {
            if (nicFrontImage != null && !nicFrontImage.isBlank()) {
                c.setNicFrontImage(nicFrontImage.trim());
            }
            if (nicBackImage != null && !nicBackImage.isBlank()) {
                c.setNicBackImage(nicBackImage.trim());
            }
            if (profileImage != null && !profileImage.isBlank()) {
                c.setProfileImage(profileImage.trim());
                u.setProfileImage(profileImage.trim());
                userRepository.save(u);
            }
            customers.save(c);
        }
        audit.record(u, "KYC_DOCUMENTS_UPDATED", "Customer", c != null ? c.getCustomerId() : null);
        return profile(u);
    }

    public ProfileView updateProfileImage(String imageUrl) {
        User u = current.requireUser();
        String img = (imageUrl != null && !imageUrl.isBlank()) ? imageUrl.trim() : null;
        u.setProfileImage(img);
        userRepository.save(u);

        Customer c = customers.findByUser_UserId(u.getUserId()).orElse(null);
        if (c != null) {
            c.setProfileImage(img);
            customers.save(c);
        }
        audit.record(u, img == null ? "PROFILE_IMAGE_DELETED" : "PROFILE_IMAGE_UPDATED", "User", u.getUserId());
        return profile(u);
    }

    public void changePassword(Password r) {
        User u = current.requireUser();
        BankRules.require(passwordEncoder.matches(r.currentPassword(), u.getPasswordHash()), "INVALID_PASSWORD",
                "Current password is incorrect");
        passwordPolicy(r.newPassword());
        u.setPasswordHash(passwordEncoder.encode(r.newPassword()));
        u.setMustChangePassword(false);
        userRepository.save(u);
        sessions.revokeUser(u.getUsername());
        audit.record(u, "PASSWORD_CHANGED", "User", u.getUserId());
        notifications.createNotification(u.getUserId(), "SECURITY_ALERT", "Password changed",
                "Your password was changed. Sign in again to continue.");
    }

    @Transactional(readOnly = true)
    public PageResult<UserView> users(String search, String status, int page, int size) {
        return PageResult.from(userRepository.findAll((root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (search != null && !search.isBlank())
                predicates
                        .add(cb.or(cb.like(cb.lower(root.get("username")), "%" + search.toLowerCase(Locale.ROOT) + "%"),
                                cb.like(cb.lower(root.get("email")), "%" + search.toLowerCase(Locale.ROOT) + "%")));
            if (status != null && !status.isBlank())
                predicates.add(cb.equal(root.get("status"), status));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        }, BankRules.page(page, size, "userId")).map(ResponseMapper::user));
    }

    @Transactional(readOnly = true)
    public UserView user(Integer id) {
        return ResponseMapper.user(userRepository.findById(id).orElseThrow(ResourceNotFoundException::new));
    }

    public UserView createStaff(Staff r) {
        String name = r.username().trim(), email = r.email().trim().toLowerCase(Locale.ROOT);
        BankRules.require(name.matches("[A-Za-z0-9_.-]{3,50}"), "INVALID_USERNAME", "Invalid username");
        unique(name, email);
        passwordPolicy(r.password());
        User u = new User();
        u.setUsername(name);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(r.password()));
        u.setRole(role(r.role()));
        u.setStatus("ACTIVE");
        u.setCreatedAt(LocalDateTime.now(clock));
        userRepository.save(u);

        if ("Customer".equalsIgnoreCase(r.role())) {
            Customer c = new Customer();
            c.setUser(u);
            customers.save(c);
            c.setCifNumber(numbering.formatCif(c.getCustomerId()));
            customers.save(c);
        } else if (!"Admin".equalsIgnoreCase(r.role())) {
            Employee e = new Employee();
            e.setUser(u);
            e.setDepartment(
                    r.department() != null && !r.department().isBlank() ? r.department().trim() : "Bank operations");
            e.setPosition(r.position() != null && !r.position().isBlank() ? r.position().trim() : r.role());
            e.setDateJoined(LocalDate.now(clock));
            employees.save(e);
        }
        audit.record(current.requireUser(), "USER_CREATED", "User", u.getUserId());
        return ResponseMapper.user(u);
    }

    private User administratorTarget(Integer id, boolean removesAdmin) {
        var admins = userRepository.lockAdministrators();
        User u = userRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        if (removesAdmin && "ACTIVE".equals(u.getStatus()) && "Admin".equalsIgnoreCase(u.getRole().getRoleName()))
            BankRules.require(admins.stream().filter(a -> "ACTIVE".equals(a.getStatus())).count() > 1, "LAST_ADMIN",
                    "The last active administrator cannot be removed");
        return u;
    }

    public UserView status(Integer id, String status) {
        User actor = current.requireUser(), u = administratorTarget(id, !"ACTIVE".equals(status));
        u.setStatus(status);
        sessions.revokeUser(u.getUsername());
        audit.record(actor, "USER_STATUS_CHANGED", "User", id);
        notifications.createNotification(id, "SECURITY_ALERT", "User status changed",
                "Your sign-in status is now " + status + ".");
        return ResponseMapper.user(u);
    }

    public UserView changeRole(Integer id, String roleName) {
        User actor = current.requireUser(), u = administratorTarget(id, !"Admin".equalsIgnoreCase(roleName));
        u.setRole(role(roleName));
        if ("Customer".equalsIgnoreCase(roleName) && customers.findByUser_UserId(id).isEmpty()) {
            Customer c = new Customer();
            c.setUser(u);
            customers.save(c);
            c.setCifNumber(numbering.formatCif(c.getCustomerId()));
            customers.save(c);
        }
        if (("Employee".equalsIgnoreCase(roleName) || "Manager".equalsIgnoreCase(roleName))
                && employees.findByUser_UserId(id).isEmpty()) {
            Employee e = new Employee();
            e.setUser(u);
            e.setDateJoined(LocalDate.now(clock));
            e.setDepartment("Bank operations");
            e.setPosition(roleName);
            employees.save(e);
        }
        sessions.revokeUser(u.getUsername());
        audit.record(actor, "USER_ROLE_CHANGED", "User", id);
        return ResponseMapper.user(u);
    }

    @Transactional(readOnly = true)
    public PageResult<ProfileView> customers(int page, int size) {
        return customers(page, size, null);
    }

    @Transactional(readOnly = true)
    public PageResult<ProfileView> customers(int page, int size, String search) {
        if (search != null && !search.isBlank()) {
            List<Customer> searchResults = customers.searchCustomers(search.trim());
            List<ProfileView> allProfiles = searchResults.stream()
                    .map(c -> profile(c.getUser()))
                    .collect(Collectors.toList());

            int totalElements = allProfiles.size();
            int start = Math.min(page * size, totalElements);
            int end = Math.min(start + size, totalElements);
            List<ProfileView> pageContent = allProfiles.subList(start, end);
            int totalPages = totalElements == 0 ? 1 : (int) Math.ceil((double) totalElements / size);

            return new PageResult<>(pageContent, page, size, totalElements, totalPages);
        }
        return PageResult
                .from(customers.findAll(BankRules.page(page, size, "customerId")).map(c -> profile(c.getUser())));
    }

    @Transactional(readOnly = true)
    public ProfileView customer(Integer id) {
        return profile(customers.findById(id).orElseThrow(ResourceNotFoundException::new).getUser());
    }

    @Transactional
    public ProfileView toggleCustomerStatus(Integer userId, boolean enabled) {
        String targetStatus = enabled ? "ACTIVE" : "DISABLED";
        status(userId, targetStatus);
        return profile(userRepository.findById(userId).orElseThrow(ResourceNotFoundException::new));
    }

    @Transactional
    public ProfileView requestCustomerDeletion(Integer userId) {
        User u = userRepository.findById(userId).orElseThrow(ResourceNotFoundException::new);
        User actor = current.requireUser();
        u.setStatus("PENDING_DELETION");
        userRepository.save(u);
        audit.record(actor, "CUSTOMER_DELETION_REQUESTED", "User", userId);
        notifications.createNotification(
            userId,
            "DELETION_REQUESTED",
            "Customer Deletion Requested",
            "A request to delete customer account " + u.getUsername() + " has been initiated and is pending Branch Manager approval."
        );
        return profile(u);
    }

    @Transactional
    public ProfileView approveCustomerDeletion(Integer userId) {
        User u = userRepository.findById(userId).orElseThrow(ResourceNotFoundException::new);
        User actor = current.requireUser();
        u.setStatus("DELETED");
        userRepository.save(u);
        audit.record(actor, "CUSTOMER_DELETION_APPROVED", "User", userId);
        notifications.createNotification(
            userId,
            "DELETION_APPROVED",
            "Customer Account Deleted",
            "The customer account " + u.getUsername() + " has been approved for deletion by the Branch Manager."
        );
        return profile(u);
    }

    @Transactional
    public ProfileView rejectCustomerDeletion(Integer userId) {
        User u = userRepository.findById(userId).orElseThrow(ResourceNotFoundException::new);
        User actor = current.requireUser();
        u.setStatus("ACTIVE");
        userRepository.save(u);
        audit.record(actor, "CUSTOMER_DELETION_REJECTED", "User", userId);
        notifications.createNotification(
            userId,
            "DELETION_REJECTED",
            "Customer Deletion Request Rejected",
            "The request to delete customer account " + u.getUsername() + " was rejected by the Branch Manager."
        );
        return profile(u);
    }
}