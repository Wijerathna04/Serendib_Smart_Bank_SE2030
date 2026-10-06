package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.repository.AccountRepository;
import com.smartbank.smartbank_api.repository.CustomerRepository;
import com.smartbank.smartbank_api.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NumberingService {

    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final LoanRepository loanRepository;

    /**
     * Formats customer primary key to a 7-digit CIF string starting from '0000000'.
     */
    public String formatCif(Integer customerId) {
        if (customerId == null || customerId < 1) {
            return "0000000";
        }
        return String.format("%07d", customerId - 1);
    }

    /**
     * Predicts or calculates next CIF number for a new customer record.
     */
    public String getNextCifNumber() {
        Integer maxId = customerRepository.findMaxCustomerId();
        int nextId = (maxId == null ? 0 : maxId);
        return String.format("%07d", nextId);
    }

    /**
     * Account Number Generation:
     * Savings account numbers start from '1000000'
     * Fixed Deposit account numbers start from '2000000'
     * Current account numbers start from '3000000'
     */
    public String generateAccountNumber(String accountType) {
        String type = accountType == null ? "" : accountType.toUpperCase();
        String prefix;
        long startBase;

        if (type.contains("FIXED") || type.contains("FD") || type.contains("TERM")) {
            prefix = "2";
            startBase = 2000000L;
        } else if (type.contains("CURRENT") || type.contains("CORPORATE") || type.contains("SMARTBIZ")) {
            prefix = "3";
            startBase = 3000000L;
        } else {
            // Default Savings
            prefix = "1";
            startBase = 1000000L;
        }

        String maxNum = accountRepository.findMaxAccountNumberByPrefix(prefix);
        if (maxNum == null || maxNum.isBlank() || !maxNum.matches("\\d+")) {
            return String.valueOf(startBase);
        }

        try {
            long currentMax = Long.parseLong(maxNum);
            if (currentMax < startBase) {
                return String.valueOf(startBase);
            }
            return String.valueOf(currentMax + 1);
        } catch (NumberFormatException e) {
            return String.valueOf(startBase);
        }
    }

    /**
     * Loan / Leasing Number Generation:
     * Loan numbers start from '7000000'
     * Leasing numbers start from '8000000'
     */
    public String generateLoanNumber(String loanType) {
        String type = loanType == null ? "" : loanType.toUpperCase();
        String prefix;
        long startBase;

        if (type.contains("LEASING") || type.contains("GREENDRIVE") || type.contains("VEHICLE")) {
            prefix = "8";
            startBase = 8000000L;
        } else {
            // Loans (Personal, Home, Education, Business, etc.)
            prefix = "7";
            startBase = 7000000L;
        }

        String maxNum = loanRepository.findMaxLoanNumberByPrefix(prefix);
        if (maxNum == null || maxNum.isBlank() || !maxNum.matches("\\d+")) {
            return String.valueOf(startBase);
        }

        try {
            long currentMax = Long.parseLong(maxNum);
            if (currentMax < startBase) {
                return String.valueOf(startBase);
            }
            return String.valueOf(currentMax + 1);
        } catch (NumberFormatException e) {
            return String.valueOf(startBase);
        }
    }
}
