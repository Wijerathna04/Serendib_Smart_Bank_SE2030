package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.Beneficiary;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface BeneficiaryRepository extends JpaRepository<Beneficiary,Integer> {
Page<Beneficiary> findByCustomer_User_UserIdAndActiveTrue(Integer userId,Pageable pageable);
Optional<Beneficiary> findByBeneficiaryIdAndCustomer_User_UserId(Integer id,Integer userId);
boolean existsByCustomer_CustomerIdAndAccountNumberAndBankNameIgnoreCaseAndActiveTrue(Integer customerId,String number,String bank);
@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select b from Beneficiary b where b.beneficiaryId=:id") Optional<Beneficiary> lockById(@Param("id") Integer id);
}
