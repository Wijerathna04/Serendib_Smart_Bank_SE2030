package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.RegisterRequest;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.exception.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.security.TokenSessionService;
import com.smartbank.smartbank_api.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Lifecycle tests with mocked persistence. These do not validate SQL or transaction boundaries. */
class ModuleWorkflowTests {
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-20T00:00:00Z"), ZoneId.of("Asia/Colombo"));
    private final Decision reason = new Decision("Test workflow decision");
    private CurrentUserService current;
    private AuditLogService audit;
    private NotificationService notifications;
    private NumberingService numbering;
    private User owner;
    private Customer customer;
    private Account account;

    @BeforeEach void setUp() {
        current = mock(CurrentUserService.class); audit = mock(AuditLogService.class); notifications = mock(NotificationService.class);
        numbering = mock(NumberingService.class);
        when(numbering.formatCif(any())).thenReturn("0000000");
        when(numbering.generateLoanNumber(any())).thenReturn("7000000");
        when(numbering.generateAccountNumber(any())).thenReturn("1000000");

        owner = new User(); owner.setUserId(1); owner.setUsername("fixture"); owner.setStatus("ACTIVE");
        customer = new Customer(); customer.setCustomerId(2); customer.setUser(owner); customer.setCifNumber("0000000");
        account = new Account(); account.setAccountId(3); account.setCustomer(customer); account.setStatus("ACTIVE"); account.setBalance(new BigDecimal("10000.00"));
        when(current.requireUser()).thenReturn(owner); when(current.requireCustomer()).thenReturn(customer);
        when(current.requireOwnedAccount(3)).thenReturn(account);
    }

    @Test void registrationCreatesCustomerAndHashesPasswordAndNotifies() {
        UserRepository users = mock(UserRepository.class); CustomerRepository customers = mock(CustomerRepository.class);
        RoleRepository roles = mock(RoleRepository.class); Role role = new Role(); role.setRoleName("Customer");
        when(roles.findByRoleNameIgnoreCase("Customer")).thenReturn(Optional.of(role));
        when(users.save(any())).thenAnswer(inv -> { User u = inv.getArgument(0); u.setUserId(1); return u; });
        var encoder = new BCryptPasswordEncoder(4);
        UserService service = new UserService(users, roles, customers, mock(EmployeeRepository.class), mock(AccountRepository.class), mock(FixedDepositRepository.class), mock(LoanRepository.class), mock(CardRepository.class), mock(TransactionRecordRepository.class), encoder, numbering, current, audit, notifications, new TokenSessionService(clock, 10), clock);
        RegisterRequest request = new RegisterRequest(); request.setUsername("new_customer"); request.setEmail("NEW@EXAMPLE.INVALID"); request.setPassword("test-only-password");
        User user = service.registerUser(request);
        assertEquals("new@example.invalid", user.getEmail()); assertEquals("Customer", user.getRole().getRoleName());
        assertTrue(encoder.matches("test-only-password", user.getPasswordHash()));
        verify(customers, atLeastOnce()).save(argThat(c -> c.getUser() == user));
        verify(notifications).createNotification(eq(1), eq("WELCOME"), anyString(), anyString());
    }

    @Test void loginRejectsWrongPasswordAndDisabledUser() {
        UserRepository users = mock(UserRepository.class); var encoder = new BCryptPasswordEncoder(4);
        owner.setPasswordHash(encoder.encode("test-only-password")); when(users.findByUsername("fixture")).thenReturn(Optional.of(owner));
        UserService service = new UserService(users, mock(RoleRepository.class), mock(CustomerRepository.class), mock(EmployeeRepository.class), mock(AccountRepository.class), mock(FixedDepositRepository.class), mock(LoanRepository.class), mock(CardRepository.class), mock(TransactionRecordRepository.class), encoder, numbering, current, audit, notifications, new TokenSessionService(clock, 10), clock);
        assertSame(owner, service.authenticate("fixture", "test-only-password"));
        assertThrows(BadCredentialsException.class, () -> service.authenticate("fixture", "wrong"));
        owner.setStatus("DISABLED");
        assertThrows(BadCredentialsException.class, () -> service.authenticate("fixture", "test-only-password"));
        assertThrows(BadCredentialsException.class, () -> service.authenticate("unknown", "test-only-password"));
    }

    @Test void loanReviewInformationRecommendationAndSeparateManagerDecision() {
        LoanRepository loans = mock(LoanRepository.class); LoanDecisionRepository decisions = mock(LoanDecisionRepository.class);
        Loan loan = new Loan(); loan.setLoanId(4); loan.setCustomer(customer); loan.setStatus("SUBMITTED"); loan.setAdditionalInformation("Original information");
        when(loans.lockById(4)).thenReturn(Optional.of(loan)); when(decisions.findByLoan_LoanIdOrderByCreatedAtAsc(4)).thenReturn(List.of());
        Employee officer = new Employee(); officer.setEmployeeId(5); officer.setUser(owner); when(current.requireEmployee()).thenReturn(officer);
        CustomerRepository customers = mock(CustomerRepository.class);
        UserRepository users = mock(UserRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
        LoanService service = new LoanService(loans, customers, users, roles, decisions, mock(AccountRepository.class), mock(FixedDepositRepository.class), mock(TransactionRecordRepository.class), encoder, numbering, current, notifications, audit, clock, mock(RiskScoringService.class), mock(RiskAssessmentRepository.class));
        assertEquals("UNDER_REVIEW", service.officerAction(4, "review", reason).status());
        assertEquals("MORE_INFORMATION_REQUIRED", service.officerAction(4, "request-information", reason).status());
        service.customerAction(4, "information", reason); assertTrue(loan.getAdditionalInformation().startsWith("Original information"));
        assertEquals("PENDING_MANAGER_REVIEW", service.officerAction(4, "recommend", reason).status());
        assertThrows(BusinessRuleException.class, () -> service.managerAction(4, true, reason));
        User manager = new User(); manager.setUserId(6); when(current.requireUser()).thenReturn(manager);
        assertEquals("APPROVED", service.managerAction(4, true, reason).status());
        verify(decisions, times(5)).save(any());
    }

    @Test void cardRequiresIssuanceAndSupportsLifecycleWithMaskedNumber() {
        CardRepository cards = mock(CardRepository.class); Card card = new Card(); card.setCardId(4); card.setAccount(account); card.setStatus("PENDING");
        when(cards.lockById(4)).thenReturn(Optional.of(card));
        CardService service = new CardService(cards, mock(AccountRepository.class), mock(TransactionRecordRepository.class), current, notifications, audit, clock, mock(RiskScoringService.class), mock(RiskAssessmentRepository.class));
        assertThrows(BusinessRuleException.class, () -> service.action(4, "activate"));
        var issued = service.issue(4, true); assertTrue(issued.cardNumber().startsWith("SIM **** ")); assertNotEquals(card.getCardNumber(), issued.cardNumber());
        assertEquals("ACTIVE", service.action(4, "activate").status());
        assertEquals("BLOCKED", service.action(4, "block").status());
        assertEquals("ACTIVE", service.action(4, "unblock").status());
        assertEquals("CANCELLED", service.action(4, "cancel").status());
        assertThrows(BusinessRuleException.class, () -> service.action(4, "activate"));
    }

    @Test void approvedReviewCannotEnterPrivateComplaintClosure() {
        FeedbackRepository repository = mock(FeedbackRepository.class); Feedback feedback = new Feedback(); feedback.setFeedbackId(4); feedback.setCustomer(customer); feedback.setFeedbackType("REVIEW"); feedback.setRating(5); feedback.setStatus("SUBMITTED");
        when(repository.lockById(4)).thenReturn(Optional.of(feedback));
        FeedbackService service = new FeedbackService(repository, current, audit, notifications, clock);
        service.moderate(4, "review", reason); service.moderate(4, "approve", reason);
        assertThrows(BusinessRuleException.class, () -> service.moderate(4, "resolve", reason));
        assertThrows(BusinessRuleException.class, () -> service.moderate(4, "close", reason));
        assertEquals("APPROVED", feedback.getStatus());
    }

    @Test void privateComplaintCanResolveAndClose() {
        FeedbackRepository repository = mock(FeedbackRepository.class); Feedback feedback = new Feedback(); feedback.setFeedbackId(4); feedback.setCustomer(customer); feedback.setFeedbackType("COMPLAINT"); feedback.setStatus("SUBMITTED");
        when(repository.lockById(4)).thenReturn(Optional.of(feedback));
        FeedbackService service = new FeedbackService(repository, current, audit, notifications, clock);
        for (String action : List.of("review", "approve", "resolve", "close")) service.moderate(4, action, reason);
        assertEquals("CLOSED", feedback.getStatus());
    }

    @Test void publicReviewsQueryOnlyApprovedReviewType() {
        FeedbackRepository repository = mock(FeedbackRepository.class);
        when(repository.findAllPublicReviews(any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(repository.findByFeedbackTypeAndStatus(eq("REVIEW"), eq("APPROVED"), any())).thenReturn(org.springframework.data.domain.Page.empty());
        assertTrue(new ReviewService(repository).list(0, 20).content().isEmpty());
    }

    @Test void beneficiaryUpdateAndSoftRemovalEnforceState() {
        BeneficiaryRepository repository = mock(BeneficiaryRepository.class); AccountRepository accounts = mock(AccountRepository.class);
        Beneficiary beneficiary = new Beneficiary(); beneficiary.setBeneficiaryId(4); beneficiary.setCustomer(customer); beneficiary.setAccountNumber("123456");
        when(repository.findByBeneficiaryIdAndCustomer_User_UserId(4, 1)).thenReturn(Optional.of(beneficiary));
        when(accounts.findByAccountNumber("123456")).thenReturn(Optional.of(account));
        BeneficiaryService service = new BeneficiaryService(repository, accounts, current, audit, clock);
        var input = new BeneficiaryInput("Updated name", "123456", "SERENDIB", "Family");
        assertEquals("Updated name", service.update(4, input).name()); service.remove(4); assertFalse(beneficiary.isActive());
        assertThrows(BusinessRuleException.class, () -> service.update(4, input));
        verify(repository, never()).delete(any());
    }

    @Test void billInsufficientFundsDoesNotCreatePendingRecord() {
        BillPaymentRepository repository = mock(BillPaymentRepository.class); TransactionService transactions = mock(TransactionService.class); OtpService otp = mock(OtpService.class);
        BillPaymentService service = new BillPaymentService(repository, current, transactions, otp, audit, clock);
        assertThrows(BusinessRuleException.class, () -> service.initiate(new Bill(3, "WATER", "123456", new BigDecimal("10001.00")), "test-key-123"));
        verifyNoInteractions(repository, otp);
    }

    @Test void notificationRetrievalUsesCurrentUserAndHidesDeletedRecords() {
        NotificationRepository repository = mock(NotificationRepository.class);
        NotificationService service = new NotificationService(repository, mock(UserRepository.class), current, null, null, clock);
        assertThrows(ResourceNotFoundException.class, () -> service.get(4));
        verify(repository).findByNotificationIdAndUser_UserId(4, 1);
        Notification notification = new Notification(); notification.setStatus("DELETED");
        when(repository.findByNotificationIdAndUser_UserId(4, 1)).thenReturn(Optional.of(notification));
        assertThrows(ResourceNotFoundException.class, () -> service.get(4));
    }

    @Test void fixedDepositMaturityUsesSimpleInterestAndHalfEvenRounding() {
        assertEquals(new BigDecimal("1070.00"), FixedDepositService.maturity(new BigDecimal("1000.00"), new BigDecimal("7.00"), 12));
        assertEquals(new BigDecimal("1012.50"), FixedDepositService.maturity(new BigDecimal("1000.00"), new BigDecimal("5.00"), 3));
    }

    @Test void transactionIdempotencyRejectsChangedPayloadAndOtherInitiator() {
        TransactionRecordRepository repository = mock(TransactionRecordRepository.class);
        TransactionService service = new TransactionService(repository, current, clock);
        TransactionRecord transaction = new TransactionRecord(); transaction.setInitiatedBy(owner); transaction.setRequestFingerprint("original");
        when(repository.findByInitiatedBy_UserIdAndIdempotencyKey(1, "test-key-123")).thenReturn(Optional.of(transaction));
        assertSame(transaction, service.existing(owner, "test-key-123", "original").orElseThrow());
        assertThrows(BusinessRuleException.class, () -> service.existing(owner, "test-key-123", "changed"));
        when(repository.lockById(4)).thenReturn(Optional.of(transaction));
        assertThrows(ResourceNotFoundException.class, () -> service.lockInitiated(4, 99));
    }
}
