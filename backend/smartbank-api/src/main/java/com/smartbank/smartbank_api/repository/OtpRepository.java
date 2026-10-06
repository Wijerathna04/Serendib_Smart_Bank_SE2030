package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.Otp;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface OtpRepository extends JpaRepository<Otp,Integer> {
Optional<Otp> findByTransaction_TransactionId(Integer id);
}
