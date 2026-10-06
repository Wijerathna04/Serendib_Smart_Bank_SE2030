package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.BillPayment;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface BillPaymentRepository extends JpaRepository<BillPayment,Integer> {
Page<BillPayment> findByCustomer_User_UserId(Integer userId,Pageable pageable);
Optional<BillPayment> findByPaymentIdAndCustomer_User_UserId(Integer id,Integer userId);
Optional<BillPayment> findByTransaction_TransactionId(Integer id);
}
