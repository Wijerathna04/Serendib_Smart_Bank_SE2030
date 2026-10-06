package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.Loan;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface LoanRepository extends JpaRepository<Loan,Integer> {
Page<Loan> findByCustomer_User_UserId(Integer userId,Pageable pageable);
List<Loan> findByCustomer_CustomerId(Integer customerId);
Optional<Loan> findByLoanIdAndCustomer_User_UserId(Integer id,Integer userId);
Page<Loan> findByStatus(String status,Pageable pageable);
@Query("SELECT MAX(l.loanNumber) FROM Loan l WHERE l.loanNumber LIKE :prefix%")
String findMaxLoanNumberByPrefix(@Param("prefix") String prefix);
@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select l from Loan l where l.loanId=:id") Optional<Loan> lockById(@Param("id") Integer id);
@Query("SELECT l FROM Loan l WHERE " +
       "(:query IS NULL OR :query = '' OR " +
       "LOWER(l.loanNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "LOWER(l.loanType) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "(l.customer IS NOT NULL AND (" +
       "  LOWER(l.customer.nic) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "  LOWER(l.customer.cifNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "  LOWER(l.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "  LOWER(l.customer.user.username) LIKE LOWER(CONCAT('%', :query, '%'))" +
       ")))")
Page<Loan> searchLoans(@Param("query") String query, Pageable pageable);
}
