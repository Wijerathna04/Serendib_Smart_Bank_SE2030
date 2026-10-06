package com.smartbank.smartbank_api.repository;

import com.smartbank.smartbank_api.entity.Card;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;

public interface CardRepository extends JpaRepository<Card, Integer> {
    @Query("select c from Card c left join c.account a left join a.customer cust left join cust.user u where c.user.userId = :userId or u.userId = :userId")
    Page<Card> findByUserId(@Param("userId") Integer userId, Pageable pageable);

    @Query("select c from Card c left join c.account a left join a.customer cust left join cust.user u where c.cardId = :id and (c.user.userId = :userId or u.userId = :userId)")
    Optional<Card> findByCardIdAndUserId(@Param("id") Integer id, @Param("userId") Integer userId);

    Page<Card> findByStatus(String status, Pageable pageable);

    boolean existsByAccount_AccountIdAndCardTypeAndStatusIn(Integer accountId, String type, Collection<String> statuses);

    @Query("select count(c) > 0 from Card c left join c.account a left join a.customer cust left join cust.user u where (c.user.userId = :userId or u.userId = :userId) and c.cardType = :type and c.status in :statuses")
    boolean existsByUserIdAndCardTypeAndStatusIn(@Param("userId") Integer userId, @Param("type") String type, @Param("statuses") Collection<String> statuses);

    List<Card> findTop100ByStatusInAndExpiryDateBefore(Collection<String> statuses, LocalDate today);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Card c where c.cardId = :id")
    Optional<Card> lockById(@Param("id") Integer id);

    @Query("SELECT c FROM Card c WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(c.cardNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.cardProduct) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(c.user IS NOT NULL AND LOWER(c.user.username) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(c.account IS NOT NULL AND (" +
           "  LOWER(c.account.accountNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "  LOWER(c.account.customer.nic) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "  LOWER(c.account.customer.cifNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "  LOWER(c.account.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%'))" +
           ")))")
    Page<Card> searchCards(@Param("query") String query, Pageable pageable);
}

