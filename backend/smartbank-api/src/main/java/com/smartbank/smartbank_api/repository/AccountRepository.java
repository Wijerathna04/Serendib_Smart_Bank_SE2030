package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.Account;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface AccountRepository extends JpaRepository<Account,Integer> {
boolean existsByCustomer_User_UserId(Integer userId);
Page<Account> findByCustomer_User_UserId(Integer userId, Pageable pageable);
List<Account> findByCustomer_CustomerId(Integer customerId);
Optional<Account> findByAccountIdAndCustomer_User_UserId(Integer id,Integer userId);
Optional<Account> findByAccountNumber(String number);
Page<Account> findByStatus(String status, Pageable pageable);
Page<Account> findByStatusIn(List<String> statuses, Pageable pageable);
@Query("SELECT a FROM Account a WHERE " +
       "(:query IS NULL OR :query = '' OR " +
       "LOWER(a.accountNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "LOWER(a.customer.nic) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "LOWER(a.customer.cifNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "LOWER(a.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
       "LOWER(a.customer.user.username) LIKE LOWER(CONCAT('%', :query, '%')))")
Page<Account> searchAccounts(@Param("query") String query, Pageable pageable);
@Query("SELECT MAX(a.accountNumber) FROM Account a WHERE a.accountNumber LIKE :prefix%")
String findMaxAccountNumberByPrefix(@Param("prefix") String prefix);
@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select a from Account a where a.accountId=:id") Optional<Account> lockById(@Param("id") Integer id);
}
