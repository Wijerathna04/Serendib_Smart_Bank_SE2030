package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    private final NotificationRepository notifications;
    private final UserRepository users;
    private final CurrentUserService current;
    private final EmailService emailService;
    private final SmsService smsService;
    private final Clock clock;

    public void createNotification(Integer userId, String event, String title, String message) {
        User user = users.findById(userId).orElse(null);
        Notification n = new Notification();
        if (user != null) {
            n.setUser(user);
        } else {
            n.setUser(users.getReferenceById(userId));
        }
        n.setEventType(event);
        n.setTitle(title);
        n.setMessage(message);
        n.setStatus("UNREAD");
        n.setCreatedAt(LocalDateTime.now(clock));
        notifications.save(n);

        if (emailService != null && user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendNotificationEmail(user.getEmail(), user.getUsername(), title, message);
        }
        if (smsService != null && user != null && user.getPhone() != null && !user.getPhone().isBlank()) {
            smsService.sendNotificationSms(user.getPhone(), title, message);
        }
    }

    @Transactional(readOnly = true)
    public PageResult<NotificationView> list(String status, String event, int page, int size) {
        BankRules.require(status == null || java.util.Set.of("READ", "UNREAD").contains(status), "INVALID_STATUS",
                "Use READ or UNREAD");
        return PageResult.from(notifications
                .search(current.requireUser().getUserId(), status, event, BankRules.page(page, size, "createdAt"))
                .map(ResponseMapper::notification));
    }

    private Notification own(Integer id) {
        Notification n = notifications.findByNotificationIdAndUser_UserId(id, current.requireUser().getUserId())
                .orElseThrow(ResourceNotFoundException::new);
        if ("DELETED".equals(n.getStatus()))
            throw new ResourceNotFoundException();
        return n;
    }

    @Transactional(readOnly = true)
    public NotificationView get(Integer id) {
        return ResponseMapper.notification(own(id));
    }

    public NotificationView setStatus(Integer id, String status) {
        Notification n = own(id);
        n.setStatus(status);
        return ResponseMapper.notification(n);
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return notifications.countByUser_UserIdAndStatus(current.requireUser().getUserId(), "UNREAD");
    }
}
