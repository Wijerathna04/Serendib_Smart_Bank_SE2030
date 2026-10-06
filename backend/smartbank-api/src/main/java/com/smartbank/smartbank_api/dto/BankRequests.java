package com.smartbank.smartbank_api.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Validated input contracts. Identity and calculated financial values are never client inputs. */
public final class BankRequests {
    private BankRequests() {}

    public record Profile(
        @NotBlank @Email @Size(max=100) String email,
        @Size(max=20) String phone,
        @Size(max=255) String address,
        @Size(max=12) String nic,
        @Past LocalDate dateOfBirth,
        String profileImage,
        String nicFrontImage,
        String nicBackImage
    ) {}

    public record Password(@NotBlank String currentPassword, @NotBlank @Size(min=8,max=72) String newPassword) {}
    public record Status(@NotBlank @Pattern(regexp="ACTIVE|DISABLED") String status) {}
    public record RoleChange(@NotBlank @Pattern(regexp="Customer|Employee|Manager|Admin") String role) {}

    public record DirectDeposit(
        @NotBlank String accountNumber,
        @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal amount,
        @Size(max=255) String description
    ) {}

    public record Staff(
        @NotBlank @Size(min=3,max=50) String username,
        @NotBlank @Email @Size(max=100) String email,
        @NotBlank @Size(min=8,max=72) String password,
        @NotBlank @Pattern(regexp="Customer|Employee|Manager|Admin") String role,
        @Size(max=100) String department,
        @Size(max=100) String position
    ) {}

    public record Deposit(
        @NotNull @Positive Integer accountId,
        @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal principalAmount,
        @NotNull @Positive Integer termMonths,
        String interestPayoutFrequency,
        String maturityInstruction,
        Boolean fatcaCompliance,
        Boolean pepDeclaration
    ) {}

    public record AccountApplication(
        @NotBlank String accountType,
        @NotBlank String fullName,
        @NotBlank @Size(max=12) String nicNumber,
        @NotBlank String dateOfBirth,
        @NotBlank String nationality,
        @NotBlank String gender,
        @NotBlank String permanentAddress,
        @NotBlank String currentAddress,
        @NotBlank String mobileNumber,
        @NotBlank String emailAddress,
        String occupationType,
        String employerName,
        String monthlyAverageIncome,
        String sourceOfFunds,
        Boolean fatcaCompliance,
        Boolean pepDeclaration,
        String nicFrontUpload,
        String nicBackUpload,
        String addressDocUpload
    ) {}

    public record AccountApprovalRequest(
        BigDecimal initialDeposit
    ) {}

    public record EmployeeDirectAccount(
        Integer customerUserId,
        @NotBlank @Size(max=12) String nic,
        String cifNumber,
        String fullName,
        String email,
        String phone,
        String address,
        @Past LocalDate dateOfBirth,
        @NotBlank String accountType,
        BigDecimal initialDeposit,
        Integer approvedByOfficerId,
        Integer approvedByManagerId
    ) {}

    public record EmployeeDirectLoan(
        Integer customerUserId,
        @NotBlank String nic,
        String cifNumber,
        String fullName,
        String email,
        String phone,
        String address,
        @Past LocalDate dateOfBirth,
        Integer accountId,
        String accountNumber,
        @NotBlank String loanType,
        @NotNull @DecimalMin("1000.00") @Digits(integer=10,fraction=2) BigDecimal amount,
        Integer termMonths,
        BigDecimal interestRate,
        @NotBlank @Size(max=2000) String information,
        Integer approvedByOfficerId,
        Integer approvedByManagerId
    ) {}

    public record RegisterExistingCustomer(
        @NotBlank String nic,
        @NotBlank @Email String email,
        @NotBlank String phone,
        @NotBlank @Size(min=3,max=50) String username,
        @NotBlank @Size(min=8,max=72) String password
    ) {}

    public record Transfer(
        @NotNull @Positive Integer accountId,
        Integer beneficiaryId,
        Integer toAccountId,
        String bankName,
        String beneficiaryName,
        String accountNumber,
        @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal amount,
        @Size(max=200) String description,
        @Size(max=20) String remarks
    ) {}

    public record Bill(
        @NotNull @Positive Integer accountId,
        @NotBlank @Pattern(regexp="[A-Za-z0-9_ -]{2,50}") String billType,
        @NotBlank @Pattern(regexp="[A-Za-z0-9 /-]{3,50}") String referenceNumber,
        @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal amount
    ) {}

    public record FavouriteBillerInput(
        @NotBlank @Size(max=50) String billerCategory,
        @NotBlank @Size(max=100) String billerName,
        @NotBlank @Size(max=100) String nickname,
        @NotBlank @Pattern(regexp="[A-Za-z0-9 /-]{3,50}") String referenceNumber,
        @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal defaultAmount
    ) {}

    public record OtpCode(@NotBlank @Pattern(regexp="[0-9]{6}") String code) {}

    public record BeneficiaryInput(
        @NotBlank @Size(max=100) String name,
        @NotBlank @Pattern(regexp="[0-9]{6,30}") String accountNumber,
        @NotBlank @Size(max=100) String bankName,
        @Size(max=100) String relationship
    ) {}

    public record LoanApplication(
        @NotBlank String loanType,
        @NotNull @DecimalMin("1000.00") @Digits(integer=10,fraction=2) BigDecimal amount,
        @NotBlank @Size(max=2000) String information,
        Integer accountId,
        String accountNumber,
        Integer fixedDepositId,
        Integer tenureMonths,
        BigDecimal basicMonthlySalary,
        BigDecimal fixedAllowances,
        BigDecimal existingMonthlyLoanDeductionsCrib,
        String employmentStatus,
        Integer servicePeriodYears,
        String vehicleCondition,
        Integer yearOfManufacture,
        BigDecimal vehicleValuationAmount,
        String chassisNumber,
        String engineNumber,
        String salarySlipsUpload,
        String bankStatementsUpload,
        String employmentLetterUpload
    ) {
        public String additionalInformation() {
            return information;
        }
    }

    public record LoanPaymentRequest(
        @NotNull Integer accountId,
        @NotNull @DecimalMin("1.00") @Digits(integer=10,fraction=2) BigDecimal amount
    ) {}

    public record Decision(@NotBlank @Size(max=2000) String reason) {}

    public record CardRequest(
        Integer accountId, // Required for DEBIT, null for CREDIT
        @NotBlank @Pattern(regexp="DEBIT|CREDIT") String cardType,
        String cardProduct,
        BigDecimal requestedCreditLimit,
        String fullName,
        String nicNumber,
        String mobileNumber,
        String emailAddress,
        String residentialAddress,
        String housingStatus,
        String employmentType,
        String employerName,
        String designation,
        Integer yearsOfService,
        BigDecimal grossMonthlyIncome,
        BigDecimal fixedAllowances,
        BigDecimal existingCreditDeductions,
        String primaryBankName,
        Boolean cribConsent,
        String paySlipsUpload,
        String bankStatementsUpload,
        String employmentLetterUpload
    ) {}

    public record CardIssueRequest(
        BigDecimal creditLimit
    ) {}


    public record FeedbackInput(
        @NotBlank @Pattern(regexp="REVIEW|COMPLAINT|SERVICE") String feedbackType,
        @NotBlank @Size(max=200) String subject,
        @NotBlank @Size(max=4000) String message,
        @Min(1) @Max(5) Integer rating
    ) {}
}
