package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankRequests.FavouriteBillerInput;
import com.smartbank.smartbank_api.dto.BankResponses.FavouriteBillerView;
import com.smartbank.smartbank_api.entity.Customer;
import com.smartbank.smartbank_api.entity.FavouriteBiller;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import com.smartbank.smartbank_api.repository.FavouriteBillerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FavouriteBillerService {
    private final FavouriteBillerRepository repository;
    private final CurrentUserService current;
    private final AuditLogService audit;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<FavouriteBillerView> list() {
        return repository.findByCustomer_User_UserIdOrderByCreatedAtDesc(current.requireUser().getUserId())
                .stream()
                .map(ResponseMapper::favouriteBiller)
                .toList();
    }

    public FavouriteBillerView create(FavouriteBillerInput input) {
        Customer customer = current.requireCustomer();
        if (repository.existsByCustomer_CustomerIdAndBillerNameIgnoreCaseAndReferenceNumber(
                customer.getCustomerId(), input.billerName(), input.referenceNumber().trim())) {
            BankRules.require(false, "DUPLICATE_FAVOURITE", "This biller reference is already saved in your favourites");
        }
        FavouriteBiller f = new FavouriteBiller();
        f.setCustomer(customer);
        f.setBillerCategory(input.billerCategory().trim().toUpperCase());
        f.setBillerName(input.billerName().trim());
        f.setNickname(input.nickname().trim());
        f.setReferenceNumber(input.referenceNumber().trim());
        f.setDefaultAmount(input.defaultAmount());
        f.setCreatedAt(LocalDateTime.now(clock));
        repository.save(f);
        audit.record(current.requireUser(), "FAVOURITE_BILLER_CREATED", "FavouriteBiller", f.getFavouriteId());
        return ResponseMapper.favouriteBiller(f);
    }

    public void remove(Integer id) {
        FavouriteBiller f = repository.findByFavouriteIdAndCustomer_User_UserId(id, current.requireUser().getUserId())
                .orElseThrow(ResourceNotFoundException::new);
        repository.delete(f);
        audit.record(current.requireUser(), "FAVOURITE_BILLER_REMOVED", "FavouriteBiller", id);
    }
}
