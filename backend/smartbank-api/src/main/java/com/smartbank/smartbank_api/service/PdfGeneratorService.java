package com.smartbank.smartbank_api.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.smartbank.smartbank_api.entity.Account;
import com.smartbank.smartbank_api.entity.BillPayment;
import com.smartbank.smartbank_api.entity.Customer;
import com.smartbank.smartbank_api.entity.TransactionRecord;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfGeneratorService {

    private static final ZoneId COLOMBO_ZONE = ZoneId.of("Asia/Colombo");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] generateStatementPdf(
            Customer customer,
            Account account,
            List<TransactionRecord> transactions,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime,
            BigDecimal openingBalance,
            BigDecimal closingBalance,
            BigDecimal totalCredits,
            BigDecimal totalDebits,
            Clock clock
    ) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.NORMAL, new java.awt.Color(3, 105, 161));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, new java.awt.Color(100, 116, 139));
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.NORMAL, java.awt.Color.WHITE);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, java.awt.Color.DARK_GRAY);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.NORMAL, java.awt.Color.BLACK);

            Paragraph title = new Paragraph("SERENDIB SMART BANK", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph sub = new Paragraph("Licensed Commercial Bank | Official Account Statement", subTitleFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(15);
            document.add(sub);

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(15);

            String custName = customer != null && customer.getUser() != null ? customer.getUser().getUsername() : "Valued Customer";
            if (customer != null && customer.getFullName() != null && !customer.getFullName().isBlank()) {
                custName = customer.getFullName();
            }

            String rawAcc = account != null ? account.getAccountNumber() : "N/A";
            String maskedAcc = rawAcc.length() > 4 ? "****" + rawAcc.substring(rawAcc.length() - 4) : rawAcc;

            String generatedTime = LocalDateTime.now(clock.withZone(COLOMBO_ZONE)).format(DATE_TIME_FORMATTER);

            addCell(summaryTable, "Customer Name: " + custName, bodyFont);
            addCell(summaryTable, "Account Number: " + maskedAcc, bodyFont);
            addCell(summaryTable, "From Date: " + fromDateTime.toLocalDate(), bodyFont);
            addCell(summaryTable, "To Date: " + toDateTime.toLocalDate(), bodyFont);
            addCell(summaryTable, "Opening Balance: LKR " + openingBalance, boldFont);
            addCell(summaryTable, "Closing Balance: LKR " + closingBalance, boldFont);
            addCell(summaryTable, "Total Credits: LKR " + totalCredits, boldFont);
            addCell(summaryTable, "Total Debits: LKR " + totalDebits, boldFont);
            addCell(summaryTable, "Generated On: " + generatedTime + " (Asia/Colombo)", bodyFont);
            addCell(summaryTable, "Status: ACTIVE", bodyFont);

            document.add(summaryTable);

            Paragraph txHeading = new Paragraph("Transaction Records", titleFont);
            txHeading.setSpacingAfter(10);
            document.add(txHeading);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 2.0f, 1.8f, 1.5f});

            addHeaderCell(table, "ID", headerFont);
            addHeaderCell(table, "Date & Time", headerFont);
            addHeaderCell(table, "Type", headerFont);
            addHeaderCell(table, "Amount (LKR)", headerFont);
            addHeaderCell(table, "Status", headerFont);

            for (TransactionRecord t : transactions) {
                addCell(table, "#" + t.getTransactionId(), bodyFont);
                addCell(table, t.getCreatedAt() != null ? t.getCreatedAt().format(DATE_TIME_FORMATTER) : "N/A", bodyFont);
                addCell(table, t.getTransactionType() != null ? t.getTransactionType() : "N/A", bodyFont);
                addCell(table, t.getAmount() != null ? t.getAmount().toPlainString() : "0.00", bodyFont);
                addCell(table, t.getStatus() != null ? t.getStatus() : "N/A", bodyFont);
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating statement PDF", e);
        }

        return out.toByteArray();
    }

    public byte[] generateTransactionReceiptPdf(TransactionRecord t, Clock clock) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A5, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Font.NORMAL, new java.awt.Color(3, 105, 161));
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, java.awt.Color.DARK_GRAY);

            Paragraph title = new Paragraph("SERENDIB SMART BANK", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph sub = new Paragraph("Official Transaction Receipt", bodyFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(15);
            document.add(sub);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);

            String generatedTime = LocalDateTime.now(clock.withZone(COLOMBO_ZONE)).format(DATE_TIME_FORMATTER);

            addCell(table, "Transaction Reference:", bodyFont);
            addCell(table, "#" + t.getTransactionId(), bodyFont);
            addCell(table, "Date & Time:", bodyFont);
            addCell(table, t.getCreatedAt() != null ? t.getCreatedAt().format(DATE_TIME_FORMATTER) : "N/A", bodyFont);
            addCell(table, "Transaction Type:", bodyFont);
            addCell(table, t.getTransactionType(), bodyFont);
            addCell(table, "Amount:", bodyFont);
            addCell(table, "LKR " + (t.getAmount() != null ? t.getAmount().toPlainString() : "0.00"), bodyFont);
            addCell(table, "From Account:", bodyFont);
            addCell(table, t.getFromAccount() != null ? t.getFromAccount().getAccountNumber() : "N/A", bodyFont);
            addCell(table, "To Account:", bodyFont);
            addCell(table, t.getToAccount() != null ? t.getToAccount().getAccountNumber() : (t.getExternalAccountNumber() != null ? t.getExternalAccountNumber() : "N/A"), bodyFont);
            addCell(table, "Status:", bodyFont);
            addCell(table, t.getStatus(), bodyFont);
            addCell(table, "Description:", bodyFont);
            addCell(table, t.getDescription() != null ? t.getDescription() : "N/A", bodyFont);
            addCell(table, "Receipt Generated:", bodyFont);
            addCell(table, generatedTime, bodyFont);

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating transaction receipt PDF", e);
        }

        return out.toByteArray();
    }

    public byte[] generateBillPaymentReceiptPdf(BillPayment b, Clock clock) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A5, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Font.NORMAL, new java.awt.Color(3, 105, 161));
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, java.awt.Color.DARK_GRAY);

            Paragraph title = new Paragraph("SERENDIB SMART BANK", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph sub = new Paragraph("Official Bill Payment Receipt", bodyFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(15);
            document.add(sub);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);

            String generatedTime = LocalDateTime.now(clock.withZone(COLOMBO_ZONE)).format(DATE_TIME_FORMATTER);

            addCell(table, "Payment Reference:", bodyFont);
            addCell(table, "#" + b.getPaymentId(), bodyFont);
            addCell(table, "Date & Time:", bodyFont);
            addCell(table, b.getCreatedAt() != null ? b.getCreatedAt().format(DATE_TIME_FORMATTER) : "N/A", bodyFont);
            addCell(table, "Biller Category:", bodyFont);
            addCell(table, b.getBillType(), bodyFont);
            addCell(table, "Biller Account / Ref:", bodyFont);
            addCell(table, b.getReferenceNumber(), bodyFont);
            addCell(table, "Paid Amount:", bodyFont);
            addCell(table, "LKR " + (b.getAmount() != null ? b.getAmount().toPlainString() : "0.00"), bodyFont);
            addCell(table, "Funding Account:", bodyFont);
            addCell(table, b.getAccount() != null ? b.getAccount().getAccountNumber() : "N/A", bodyFont);
            addCell(table, "Status:", bodyFont);
            addCell(table, b.getStatus(), bodyFont);
            addCell(table, "Receipt Generated:", bodyFont);
            addCell(table, generatedTime, bodyFont);

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating bill payment receipt PDF", e);
        }

        return out.toByteArray();
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new java.awt.Color(3, 105, 161));
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(5);
        table.addCell(cell);
    }
}
