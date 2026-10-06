package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.TransactionRecord;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface TransactionRecordRepository extends JpaRepository<TransactionRecord,Integer> {
Optional<TransactionRecord> findByInitiatedBy_UserIdAndIdempotencyKey(Integer userId,String key);
@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select t from TransactionRecord t where t.transactionId=:id") Optional<TransactionRecord> lockById(@Param("id") Integer id);
@Query("select t from TransactionRecord t left join t.fromAccount f left join f.customer fc left join t.toAccount d left join d.customer dc where (fc.user.userId=:userId or dc.user.userId=:userId) and (:type is null or t.transactionType=:type) and (:status is null or t.status=:status) and (cast(:since as LocalDateTime) is null or t.createdAt>=:since) and (cast(:until as LocalDateTime) is null or t.createdAt<:until) and (:search is null or lower(t.description) like lower(concat('%',cast(:search as String),'%')))") Page<TransactionRecord> search(@Param("userId") Integer userId,@Param("type") String type,@Param("status") String status,@Param("since") LocalDateTime since,@Param("until") LocalDateTime until,@Param("search") String search,Pageable pageable);
@Query("SELECT t FROM TransactionRecord t WHERE (t.fromAccount.accountId = :accId OR t.toAccount.accountId = :accId) ORDER BY t.createdAt DESC") Page<TransactionRecord> findByAccountId(@Param("accId") Integer accId, Pageable pageable);
List<TransactionRecord> findByFromAccount_AccountIdOrToAccount_AccountId(Integer fromId, Integer toId);
List<TransactionRecord> findTop100ByStatusAndAuthorizationExpiresAtBefore(String status,LocalDateTime now);

@Query("SELECT t FROM TransactionRecord t WHERE (t.fromAccount.accountId = :accId OR t.toAccount.accountId = :accId) AND t.createdAt >= :startDate AND t.createdAt <= :endDate ORDER BY t.createdAt ASC")
List<TransactionRecord> findByAccountIdAndDateRange(@Param("accId") Integer accId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

@Query("""
    SELECT new com.smartbank.smartbank_api.dto.BankResponses$CategorySummaryRaw(
        t.transactionType,
        SUM(t.amount),
        COUNT(t)
    )
    FROM TransactionRecord t
    JOIN t.fromAccount f
    LEFT JOIN t.toAccount toAcc
    WHERE f.customer.customerId = :customerId
      AND t.status = 'COMPLETED'
      AND (toAcc IS NULL OR toAcc.customer.customerId <> :customerId)
      AND t.createdAt >= :startDate
      AND t.createdAt < :endDate
    GROUP BY t.transactionType
""")
List<com.smartbank.smartbank_api.dto.BankResponses.CategorySummaryRaw> summarizeSpendingByCustomerAndDateRange(
    @Param("customerId") Integer customerId,
    @Param("startDate") LocalDateTime startDate,
    @Param("endDate") LocalDateTime endDate
);
}
