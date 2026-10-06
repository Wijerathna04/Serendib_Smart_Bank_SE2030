package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.AuditLog;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface AuditLogRepository extends JpaRepository<AuditLog,Integer> {
@Query("select a from AuditLog a where (:action is null or a.action=:action) and (:actor is null or a.user.userId=:actor) and (cast(:since as LocalDateTime) is null or a.performedAt>=:since) and (cast(:until as LocalDateTime) is null or a.performedAt<:until)") Page<AuditLog> search(@Param("action") String action,@Param("actor") Integer actor,@Param("since") LocalDateTime since,@Param("until") LocalDateTime until,Pageable pageable);
}
