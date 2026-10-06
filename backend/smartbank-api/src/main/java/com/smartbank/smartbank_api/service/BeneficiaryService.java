package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.dto.BankRequests.BeneficiaryInput;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.Beneficiary;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
@Service @RequiredArgsConstructor @Transactional
public class BeneficiaryService {
    private final BeneficiaryRepository beneficiaries;
    private final AccountRepository accounts;
    private final CurrentUserService current;
    private final AuditLogService audit;
    private final Clock clock;
    private Beneficiary own(Integer id) { return beneficiaries.findByBeneficiaryIdAndCustomer_User_UserId(id,current.requireUser().getUserId()).orElseThrow(ResourceNotFoundException::new); }
    private void apply(Beneficiary b, BeneficiaryInput r) {
        String targetBank = r.bankName() != null && !r.bankName().isBlank() ? r.bankName().trim() : "Serendib Bank";
        boolean isSerendib = "Serendib Bank".equalsIgnoreCase(targetBank)
                || "Serendib".equalsIgnoreCase(targetBank)
                || "Serendib Smart Bank".equalsIgnoreCase(targetBank);

        if (isSerendib) {
            BankRules.require(accounts.findByAccountNumber(r.accountNumber().trim()).isPresent(), "INVALID_DESTINATION", "A matching Serendib account is required for internal payees.");
        }

        if (b.getBeneficiaryId() == null || !r.accountNumber().equals(b.getAccountNumber())) {
            BankRules.require(!beneficiaries.existsByCustomer_CustomerIdAndAccountNumberAndBankNameIgnoreCaseAndActiveTrue(
                b.getCustomer().getCustomerId(), r.accountNumber().trim(), targetBank
            ), "DUPLICATE_BENEFICIARY", "An active beneficiary already uses that account number for this bank");
        }

        b.setName(r.name().trim());
        b.setAccountNumber(r.accountNumber().trim());
        b.setBankName(targetBank);
        b.setRelationship(r.relationship() != null ? r.relationship().trim() : null);
        b.setUpdatedAt(LocalDateTime.now(clock));
    }

    public BeneficiaryView create(BeneficiaryInput r) { Beneficiary b=new Beneficiary();b.setCustomer(current.requireCustomer());b.setCreatedAt(LocalDateTime.now(clock));apply(b,r);beneficiaries.save(b);audit.record(current.requireUser(),"BENEFICIARY_CREATED","Beneficiary",b.getBeneficiaryId());return ResponseMapper.beneficiary(b); }
    public BeneficiaryView update(Integer id,BeneficiaryInput r) { Beneficiary b=own(id);BankRules.require(b.isActive(),"INVALID_STATE","Removed beneficiaries cannot be edited");apply(b,r);audit.record(current.requireUser(),"BENEFICIARY_UPDATED","Beneficiary",id);return ResponseMapper.beneficiary(b); }
    public void remove(Integer id) { Beneficiary b=own(id);if(b.isActive()) {b.setActive(false);b.setUpdatedAt(LocalDateTime.now(clock));audit.record(current.requireUser(),"BENEFICIARY_REMOVED","Beneficiary",id);} }
    @Transactional(readOnly=true) public BeneficiaryView get(Integer id) { return ResponseMapper.beneficiary(own(id)); }
    @Transactional(readOnly=true) public PageResult<BeneficiaryView> list(int page,int size) { return PageResult.from(beneficiaries.findByCustomer_User_UserIdAndActiveTrue(current.requireUser().getUserId(),BankRules.page(page,size,"beneficiaryId")).map(ResponseMapper::beneficiary)); }
}
