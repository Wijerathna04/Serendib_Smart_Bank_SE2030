package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.AiAssistant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AiAssistantRepository extends JpaRepository<AiAssistant,Integer> {
    Optional<AiAssistant> findFirstByStatusIgnoreCaseOrderByAssistantIdAsc(String status);
}
