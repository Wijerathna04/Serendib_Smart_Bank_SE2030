package com.smartbank.smartbank_api.repository;

import com.smartbank.smartbank_api.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Integer> {
    Optional<RiskAssessment> findTopByApplicationTypeAndApplicationIdOrderByCreatedAtDesc(String applicationType, Integer applicationId);
    List<RiskAssessment> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);
}
