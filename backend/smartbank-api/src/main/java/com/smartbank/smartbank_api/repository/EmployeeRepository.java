package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.Employee;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface EmployeeRepository extends JpaRepository<Employee,Integer> {
Optional<Employee> findByUser_UserId(Integer userId);
}
