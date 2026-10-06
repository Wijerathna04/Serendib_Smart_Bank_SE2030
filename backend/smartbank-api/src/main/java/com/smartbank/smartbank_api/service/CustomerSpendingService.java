package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.Customer;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
import com.smartbank.smartbank_api.repository.TransactionRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomerSpendingService {

    private final CurrentUserService current;
    private final TransactionRecordRepository transactionRecords;
    private final Clock clock;

    public static final ZoneId COLOMBO_ZONE = ZoneId.of("Asia/Colombo");

    public record CategoryDefinition(String key, String label) {}

    public static final List<CategoryDefinition> ALL_CATEGORIES = List.of(
        new CategoryDefinition("UTILITY_BILLS", "Utility Bills"),
        new CategoryDefinition("MONEY_TRANSFERS", "Money Transfers"),
        new CategoryDefinition("CARD_PURCHASES", "Card & Retail Purchases"),
        new CategoryDefinition("LOANS_INVESTMENTS", "Loans & Investments"),
        new CategoryDefinition("OTHER", "Other")
    );

    /**
     * Spending category transaction type mapping:
     * - BILL_PAYMENT -> Utility Bills
     * - TRANSFER, INTERBANK_TRANSFER, CEFT_TRANSFER, TRANSFER_FEE -> Money Transfers
     * - CARD_PAYMENT, CARD_PURCHASE, CARD_FEE, DEBIT_CARD_FEE -> Card & Retail Purchases
     * - LOAN_PAYMENT, FD_OPEN, FD_DEPOSIT -> Loans & Investments
     * - Any unmapped transaction type -> Other
     */
    public static String mapCategoryKey(String type) {
        if (type == null) return "OTHER";
        return switch (type.toUpperCase(Locale.ROOT)) {
            case "BILL_PAYMENT" -> "UTILITY_BILLS";
            case "TRANSFER", "INTERBANK_TRANSFER", "CEFT_TRANSFER", "TRANSFER_FEE" -> "MONEY_TRANSFERS";
            case "CARD_PAYMENT", "CARD_PURCHASE", "CARD_FEE", "DEBIT_CARD_FEE" -> "CARD_PURCHASES";
            case "LOAN_PAYMENT", "FD_OPEN", "FD_DEPOSIT" -> "LOANS_INVESTMENTS";
            default -> "OTHER";
        };
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    public SpendingSummaryView getSpendingSummary() {
        User user = current.requireUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        if (!"ROLE_CUSTOMER".equalsIgnoreCase(roleName) && !"CUSTOMER".equalsIgnoreCase(roleName)) {
            throw new org.springframework.security.access.AccessDeniedException("Only customers can access spending summary");
        }
        Customer customer = current.requireCustomer();

        ZonedDateTime nowColombo = ZonedDateTime.now(clock.withZone(COLOMBO_ZONE));
        YearMonth currentYm = YearMonth.from(nowColombo);
        LocalDateTime startOfMonth = currentYm.atDay(1).atStartOfDay();
        LocalDateTime endOfWindow = currentYm.plusMonths(1).atDay(1).atStartOfDay();

        String monthKey = currentYm.toString();
        String monthLabel = currentYm.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + currentYm.getYear();
        int daysUntilReset = (int) ChronoUnit.DAYS.between(nowColombo.toLocalDate(), currentYm.atEndOfMonth());
        if (daysUntilReset < 0) daysUntilReset = 0;

        List<CategorySummaryRaw> rawResults = transactionRecords.summarizeSpendingByCustomerAndDateRange(
            customer.getCustomerId(),
            startOfMonth,
            endOfWindow
        );

        Map<String, BigDecimal> categoryAmounts = new LinkedHashMap<>();
        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        for (CategoryDefinition def : ALL_CATEGORIES) {
            categoryAmounts.put(def.key(), BigDecimal.ZERO);
            categoryCounts.put(def.key(), 0L);
        }

        BigDecimal grandTotal = BigDecimal.ZERO;
        for (CategorySummaryRaw raw : rawResults) {
            String catKey = mapCategoryKey(raw.transactionType());
            BigDecimal amt = raw.totalAmount() != null ? raw.totalAmount() : BigDecimal.ZERO;
            long cnt = raw.count() != null ? raw.count() : 0L;

            categoryAmounts.put(catKey, categoryAmounts.get(catKey).add(amt));
            categoryCounts.put(catKey, categoryCounts.get(catKey) + cnt);
            grandTotal = grandTotal.add(amt);
        }

        // Compute percentages using Largest-Remainder Method so sum is exactly 100 (or 0 when total is 0)
        Map<String, Integer> categoryPercents = computeLargestRemainderPercentages(ALL_CATEGORIES, categoryAmounts, grandTotal);

        List<SpendingCategoryView> catViews = new ArrayList<>();
        for (CategoryDefinition def : ALL_CATEGORIES) {
            String catKey = def.key();
            BigDecimal amt = categoryAmounts.get(catKey).setScale(2, RoundingMode.HALF_UP);
            int pct = categoryPercents.get(catKey);
            long cnt = categoryCounts.get(catKey);

            catViews.add(new SpendingCategoryView(
                catKey,
                def.label(),
                amt.toPlainString(),
                pct,
                cnt
            ));
        }

        return new SpendingSummaryView(
            monthKey,
            monthLabel,
            "LKR",
            grandTotal.setScale(2, RoundingMode.HALF_UP).toPlainString(),
            daysUntilReset,
            nowColombo.toInstant().toString(),
            catViews
        );
    }

    private Map<String, Integer> computeLargestRemainderPercentages(
        List<CategoryDefinition> categories,
        Map<String, BigDecimal> amounts,
        BigDecimal total
    ) {
        Map<String, Integer> result = new LinkedHashMap<>();
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            for (CategoryDefinition def : categories) {
                result.put(def.key(), 0);
            }
            return result;
        }

        double totalDouble = total.doubleValue();
        int sumFloors = 0;
        List<RemainderEntry> entries = new ArrayList<>();

        for (int i = 0; i < categories.size(); i++) {
            String key = categories.get(i).key();
            double amt = amounts.getOrDefault(key, BigDecimal.ZERO).doubleValue();
            double exactPercent = (amt / totalDouble) * 100.0;
            int floor = (int) Math.floor(exactPercent);
            double remainder = exactPercent - floor;

            sumFloors += floor;
            entries.add(new RemainderEntry(key, floor, remainder, i));
        }

        int deficit = 100 - sumFloors;
        entries.sort((a, b) -> {
            int cmp = Double.compare(b.remainder, a.remainder);
            if (cmp != 0) return cmp;
            return Integer.compare(a.originalIndex, b.originalIndex);
        });

        for (int i = 0; i < entries.size(); i++) {
            RemainderEntry entry = entries.get(i);
            int finalPct = entry.floor;
            if (i < deficit && entry.remainder > 0) {
                finalPct += 1;
            }
            result.put(entry.key, finalPct);
        }

        return result;
    }

    private record RemainderEntry(String key, int floor, double remainder, int originalIndex) {}
}
