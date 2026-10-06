package com.smartbank.smartbank_api.repository;
import com.smartbank.smartbank_api.entity.AiChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
public interface AiChatRepository extends JpaRepository<AiChat,Integer> {
    Page<AiChat> findByCustomer_User_UserId(Integer userId,Pageable pageable);
}
