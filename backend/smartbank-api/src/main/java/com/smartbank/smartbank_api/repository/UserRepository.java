package com.smartbank.smartbank_api.repository;

import com.smartbank.smartbank_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Integer>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<User> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "role")
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from User u where upper(u.role.roleName)='ADMIN' order by u.userId")
    java.util.List<User> lockAdministrators();
}
