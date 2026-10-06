export type Role = 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface Profile {
  userId: number;
  customerId: number | null;
  cifNumber?: string | null;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  nic: string | null;
  address: string | null;
  dateOfBirth: string | null;
  profileImage?: string | null;
  nicFrontImage?: string | null;
  nicBackImage?: string | null;
  mustChangePassword?: boolean;
}

export interface FinancialStatsView {
  totalAccounts: number;
  totalAccountBalance: number;
  totalFixedDepositsCount: number;
  totalFixedDepositAmount: number;
  totalLoansCount: number;
  totalLoanBalance: number;
  totalCardsCount: number;
  totalTransactionsCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netFlow: number;
}

export interface ProfileView {
  userId: number;
  customerId: number | null;
  cifNumber: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  nic: string | null;
  address: string | null;
  dateOfBirth: string | null;
  profileImage?: string;
  nicFrontImage?: string;
  nicBackImage?: string;
  fullName?: string | null;
  userCategory?: string | null;
  financialStats?: FinancialStatsView;
  mustChangePassword?: boolean;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Account {
  accountId: number;
  accountNumber: string;
  accountType: string;
  balance: string;
  availableBalance: string;
  status: string;
  openDate: string;
  isPrimary?: boolean;
  kycData?: string | null;
  rejectionReason?: string | null;
  customerName?: string | null;
  customerNic?: string | null;
  cifNumber?: string | null;
  approvedByOfficerId?: string | null;
  approvedByManagerId?: string | null;
  tempUsername?: string | null;
  tempPassword?: string | null;
}

export interface Deposit {
  fixedDepositId: number;
  accountId: number;
  accountNumber: string;
  principalAmount: string;
  interestRate: string;
  termMonths: number;
  startDate: string | null;
  maturityDate: string | null;
  maturityAmount: string | null;
  status: string;
  openingTransactionId: number;
  closingTransactionId: number | null;
  createdAt: string;
  fdDetails?: string | null;
}

export interface Product {
  termMonths: number;
  annualRate: string;
  minimumAmount: string;
  disclosure: string;
}

export interface Notification {
  notificationId: number;
  title: string;
  message: string;
  eventType: string;
  status: string;
  createdAt: string;
}

export interface Transaction {
  transactionId: number;
  fromAccountId: number | null;
  toAccountId: number | null;
  amount: string;
  transactionType: string;
  status: string;
  description: string;
  createdAt: string;
  completedAt: string | null;
  authorizationExpiresAt: string | null;
  canAuthorize: boolean;
  failureCode: string | null;
}

export interface Beneficiary {
  beneficiaryId: number;
  name: string;
  accountNumber: string;
  bankName: string;
  relationship: string | null;
  active: boolean;
}

export interface Bill {
  paymentId: number;
  accountId: number;
  billType: string;
  referenceNumber: string;
  amount: string;
  status: string;
  transactionId: number;
  createdAt: string;
}

export interface FavouriteBiller {
  favouriteId: number;
  billerCategory: string;
  billerName: string;
  nickname: string;
  referenceNumber: string;
  defaultAmount?: string | null;
  createdAt: string;
}

export interface Loan {
  loanId: number;
  loanNumber?: string | null;
  customer: string;
  customerNic?: string | null;
  cifNumber?: string | null;
  loanType: string;
  amount: string;
  interestRate: string;
  status: string;
  information: string;
  additionalInformation?: string | null;
  termMonths?: number | null;
  preferredTenureMonths?: number | null;
  basicMonthlySalary?: number | string | null;
  fixedAllowances?: number | string | null;
  existingMonthlyLoanDeductionsCrib?: number | string | null;
  nicFrontDoc?: string | null;
  nicBackDoc?: string | null;
  addressVerificationDoc?: string | null;
  salarySlipsUpload?: string | null;
  bankStatementsUpload?: string | null;
  employmentLetterUpload?: string | null;
  scrutinyData?: string | null;
  applyDate: string;
  decisions: { action: string; reason: string; actor: string; createdAt: string }[];
  approvedByOfficerId?: string | null;
  approvedByManagerId?: string | null;
  targetAccountId?: number | null;
  targetAccountNumber?: string | null;
  fixedDepositId?: number | null;
  paidAmount?: string | null;
  remainingAmount?: string | null;
  riskScore?: number | null;
  riskLevel?: string | null;
  riskFactors?: string[] | null;
  riskExplanation?: string | null;
}

export interface Card {
  cardId: number;
  accountId?: number | null;
  accountType?: string | null;
  cardNumber: string;
  cardType: string;
  cardProduct?: string | null;
  expiryDate: string | null;
  status: string;
  issued: boolean;
  requestedAt: string;
  creditLimit?: string | null;
  availableCredit?: string | null;
  currentBalance?: string | null;
  applicantName?: string | null;
  applicantNic?: string | null;
  employmentType?: string | null;
  employerName?: string | null;
  designation?: string | null;
  yearsOfService?: number | null;
  grossMonthlyIncome?: string | null;
  fixedAllowances?: string | null;
  existingCreditDeductions?: string | null;
  cribConsent?: boolean | null;
  paySlipsUpload?: string | null;
  bankStatementsUpload?: string | null;
  employmentLetterUpload?: string | null;
  riskScore?: number | null;
  riskLevel?: string | null;
  riskFactors?: string[] | null;
  riskExplanation?: string | null;
}

export interface RiskAssessmentView {
  assessmentId: number;
  applicationType: string;
  applicationId: number;
  customerId: number;
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
  explanation: string;
  createdAt: string;
}


export interface Feedback {
  feedbackId: number;
  feedbackType: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  staffResponse: string | null;
  createdAt: string;
}

export interface Review {
  feedbackId: number;
  subject: string;
  message: string;
  rating: number;
  createdAt: string;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  status: string;
}

export interface Audit {
  logId: number;
  actor: string;
  action: string;
  entityType: string;
  entityId: number | null;
  performedAt: string;
}

export interface CustomerSearchResult {
  exists: boolean;
  customerId?: number | null;
  userId?: number | null;
  cifNumber?: string | null;
  nic?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  nextCifNumber?: string | null;
}

export interface SpendingCategoryView {
  key: string;
  label: string;
  amount: string;
  percent: number;
  count: number;
}

export interface SpendingSummaryView {
  monthKey: string;
  monthLabel: string;
  currency: string;
  total: string;
  daysUntilReset: number;
  generatedAt: string;
  categories: SpendingCategoryView[];
}
