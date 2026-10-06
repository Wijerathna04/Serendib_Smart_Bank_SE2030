package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.Feedback;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import java.time.*;
public interface FeedbackRepository extends JpaRepository<Feedback,Integer> {
Page<Feedback> findByCustomer_User_UserId(Integer userId,Pageable pageable);
Optional<Feedback> findByFeedbackIdAndCustomer_User_UserId(Integer id,Integer userId);
Page<Feedback> findByStatus(String status,Pageable pageable);
Page<Feedback> findByFeedbackType(String type,Pageable pageable);
long countByFeedbackType(String type);

@Query("SELECT f FROM Feedback f WHERE (UPPER(f.feedbackType) = 'REVIEW' OR f.rating IS NOT NULL OR UPPER(f.status) = 'APPROVED') AND UPPER(f.status) != 'REJECTED' ORDER BY f.createdAt DESC")
Page<Feedback> findAllPublicReviews(Pageable pageable);

@Query("SELECT COUNT(f) FROM Feedback f WHERE (UPPER(f.feedbackType) = 'REVIEW' OR f.rating IS NOT NULL OR UPPER(f.status) = 'APPROVED') AND UPPER(f.status) != 'REJECTED'")
long countAllPublicReviews();

@Query("SELECT COALESCE(AVG(f.rating), 5.0) FROM Feedback f WHERE (UPPER(f.feedbackType) = 'REVIEW' OR f.rating IS NOT NULL) AND UPPER(f.status) != 'REJECTED'")
Double averageRatingForReviews();

Page<Feedback> findByFeedbackTypeAndStatus(String type,String status,Pageable pageable);
long countByFeedbackTypeAndStatus(String type,String status);
@Query("select avg(f.rating) from Feedback f where f.feedbackType='REVIEW' and f.status='APPROVED'") Double averageApprovedRating();
@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select f from Feedback f where f.feedbackId=:id") Optional<Feedback> lockById(@Param("id") Integer id);
}

