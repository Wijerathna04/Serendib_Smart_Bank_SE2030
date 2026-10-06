package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.Notification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface NotificationRepository extends JpaRepository<Notification,Integer> {
Page<Notification> findByUser_UserIdAndStatusNot(Integer userId,String status,Pageable pageable);
@Query("select n from Notification n where n.user.userId=:userId and n.status<>'DELETED' and (:status is null or n.status=:status) and (:event is null or n.eventType=:event)") Page<Notification> search(@Param("userId") Integer userId,@Param("status") String status,@Param("event") String event,Pageable pageable);
Optional<Notification> findByNotificationIdAndUser_UserId(Integer id,Integer userId);
long countByUser_UserIdAndStatus(Integer userId,String status);
}
