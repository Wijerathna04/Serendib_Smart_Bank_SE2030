package com.smartbank.smartbank_api.repository;

import com.smartbank.smartbank_api.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    Optional<Customer> findByUser_UserId(Integer userId);

    Optional<Customer> findByNicIgnoreCase(String nic);

    Optional<Customer> findByCifNumber(String cifNumber);

    Optional<Customer> findByUser_EmailIgnoreCaseAndUser_Phone(String email, String phone);

    Optional<Customer> findByNicIgnoreCaseAndUser_EmailIgnoreCaseAndUser_Phone(String nic, String email, String phone);

    @Query("SELECT MAX(c.customerId) FROM Customer c")
    Integer findMaxCustomerId();

    // Multi-field search by CIF, NIC, name, username, email, phone, or linked account number
    @Query("SELECT DISTINCT c FROM Customer c LEFT JOIN c.user u WHERE " +
            "LOWER(COALESCE(c.cifNumber, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(c.nic, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(c.fullName, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "EXISTS (SELECT 1 FROM Account a WHERE a.customer = c AND LOWER(a.accountNumber) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Customer> searchCustomers(@Param("query") String query);
}