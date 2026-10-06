package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.repository.FeedbackRepository;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
/** Public review projection over eligible approved feedback; there is no Review entity. */
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class ReviewService {
    private final FeedbackRepository feedback;

    public PageResult<ReviewView> list(int page, int size) {
        return PageResult.from(
            feedback.findAllPublicReviews(BankRules.page(page, size, "createdAt"))
                .map(f -> new ReviewView(
                    f.getFeedbackId(),
                    f.getSubject(),
                    f.getMessage(),
                    f.getRating() != null ? f.getRating() : 5,
                    f.getCreatedAt()
                ))
        );
    }

    public ReviewSummary summary() {
        Double avg = feedback.averageRatingForReviews();
        long count = feedback.countAllPublicReviews();
        return new ReviewSummary(avg != null ? avg : 5.0, count);
    }
}

