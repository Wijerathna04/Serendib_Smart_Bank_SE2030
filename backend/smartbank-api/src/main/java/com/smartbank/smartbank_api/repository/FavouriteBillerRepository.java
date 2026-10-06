package com.smartbank.smartbank_api.repository;

import com.smartbank.smartbank_api.entity.FavouriteBiller;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavouriteBillerRepository extends JpaRepository<FavouriteBiller, Integer> {
    List<FavouriteBiller> findByCustomer_User_UserIdOrderByCreatedAtDesc(Integer userId);
    Optional<FavouriteBiller> findByFavouriteIdAndCustomer_User_UserId(Integer favouriteId, Integer userId);
    boolean existsByCustomer_CustomerIdAndBillerNameIgnoreCaseAndReferenceNumber(Integer customerId, String billerName, String referenceNumber);
}
