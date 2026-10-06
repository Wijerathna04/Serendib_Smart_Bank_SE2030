<#
 Copies ONE member's files from the FINAL project folder into the clean working clone.
 Usage:  powershell -ExecutionPolicy Bypass -File copy-member-files.ps1 -Member navishika -Source "C:\path\Serendib_FINAL" -Dest "C:\path\Serendib_Work"
 Members: navishika, wanni, wijerathna, jayasinghe, sanketh, vidara
#>
param(
  [Parameter(Mandatory=$true)][string]$Member,
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Dest
)
$map = @{
  navishika = @(
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/AdminUserController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/BillPaymentController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/FavouriteBillerController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/User.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Role.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/BillPayment.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/FavouriteBiller.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/UserRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/RoleRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/BillPaymentRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/FavouriteBillerRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/UserService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/BillPaymentService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/FavouriteBillerService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/CurrentUserService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/dto/UserResponse.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/dto/RegisterRequest.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/config/DemoAdminInitializer.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/config/DemoStaffInitializer.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/DemoAdminInitializerTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/DemoStaffInitializerTests.java'
    'frontend/src/pages/BillPaymentsPage.tsx'
    'frontend/src/pages/AdminPages.tsx'
    'frontend/src/pages/ProfilePage.tsx'
    'frontend/src/data/sriLankanBillers.ts'
    'frontend/src/components/FirstLoginPasswordModal.tsx'
  )
  wanni = @(
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/AccountController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/EmployeeAccountController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/ManagerAccountController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/CustomerController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/EmployeeCustomerController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/FixedDepositController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/EmployeeFixedDepositController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/ManagerFixedDepositController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Account.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Customer.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Employee.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/FixedDeposit.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/AccountRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/CustomerRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/EmployeeRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/FixedDepositRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/AccountService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/CustomerSpendingService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/MonthlyStatementService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/PdfGeneratorService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/FixedDepositService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/FixedDepositMaturityService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/config/FixedDepositProperties.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/CustomerSpendingTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/SpendingSummaryMockMvcTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/PdfGeneratorTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/SafeJsonSerializationTests.java'
    'frontend/src/pages/AccountsPage.tsx'
    'frontend/src/pages/ManagerAllAccountsPage.tsx'
    'frontend/src/pages/StaffAccountsPage.tsx'
    'frontend/src/pages/StaffCustomersPage.tsx'
    'frontend/src/pages/FixedDepositPages.tsx'
    'frontend/src/pages/DashboardPage.tsx'
    'frontend/src/pages/StaffDashboards.tsx'
    'frontend/src/components/KycPromptModal.tsx'
    'frontend/src/components/ApplicationDetails.tsx'
    'frontend/src/components/ApplicationPdfModal.tsx'
    'frontend/src/data/productCatalog.ts'
  )
  wijerathna = @(
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/AuthController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/TransferController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/TxnAuthController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/OtpSimulationController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/NotificationController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Otp.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Notification.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/OtpRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/NotificationRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/security/'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/dto/AuthResponse.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/dto/LoginRequest.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/TransferService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/TransactionPostingService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/OtpService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/OtpDeliveryService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/EmailService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/SmsService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/NotificationService.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/TransferServiceTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/TransactionPostingTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/EmailServiceTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/SmsServiceTests.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/SecurityHttpTests.java'
    'frontend/src/pages/PaymentPages.tsx'
    'frontend/src/pages/AuthPages.tsx'
    'frontend/src/pages/NotificationsPage.tsx'
    'frontend/src/auth/AuthProvider.tsx'
    'frontend/src/components/OtpDialog.tsx'
  )
  jayasinghe = @(
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/LoanController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/EmployeeLoanController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/ManagerLoanController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Loan.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/LoanDecision.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/RiskAssessment.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/LoanRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/LoanDecisionRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/RiskAssessmentRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/LoanService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/RiskScoringService.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/RiskScoringTests.java'
    'frontend/src/pages/LoanPages.tsx'
  )
  sanketh = @(
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/BeneficiaryController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/TransactionController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Beneficiary.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/TransactionRecord.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/BeneficiaryRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/TransactionRecordRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/BeneficiaryService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/TransactionService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/TransactionExpiryService.java'
    'backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/TxnHistoryTests.java'
    'frontend/src/pages/BeneficiariesPage.tsx'
    'frontend/src/pages/TransactionPages.tsx'
    'frontend/src/components/TransactionReportModal.tsx'
    'frontend/src/components/ReceiptModal.tsx'
  )
  vidara = @(
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/CardController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/EmployeeCardController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/ManagerCardController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/FeedbackController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/EmployeeFeedbackController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/ReviewController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/AdminAuditLogController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/controller/AdminOperationsController.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Card.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Feedback.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/AuditLog.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/CardRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/FeedbackRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/repository/AuditLogRepository.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/CardService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/CardExpiryService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/FeedbackService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/ReviewService.java'
    'backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/service/AuditLogService.java'
    'frontend/src/pages/CardPages.tsx'
    'frontend/src/pages/FeedbackPages.tsx'
    'frontend/src/pages/AdminOperationsPage.tsx'
  )
}
if (-not $map.ContainsKey($Member)) { throw "Unknown member '$Member'" }
$count = 0
foreach ($p in $map[$Member]) {
  $src = Join-Path $Source $p
  $dst = Join-Path $Dest $p
  if (-not (Test-Path $src)) { Write-Warning "Missing in FINAL: $p"; continue }
  if (Test-Path $src -PathType Container) {
    New-Item -ItemType Directory -Force $dst | Out-Null
    Copy-Item (Join-Path $src '*') $dst -Recurse -Force
  } else {
    New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
    Copy-Item $src $dst -Force
  }
  $count++
}
Write-Host "Copied $count entries for $Member. Now open GitHub Desktop and review the Changes tab." -ForegroundColor Green
