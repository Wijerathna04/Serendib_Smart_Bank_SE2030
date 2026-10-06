package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.NotificationService;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;
    @GetMapping public PageResult<NotificationView> list(@RequestParam(required=false) String status,@RequestParam(required=false) String event,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(status,event,page,size); }
    @GetMapping("/unread-count") public Map<String,Long> count() { return Map.of("count",service.unreadCount()); }
    @GetMapping("/{id}") public NotificationView get(@PathVariable Integer id) { return service.get(id); }
    @PutMapping("/{id}/read") public NotificationView read(@PathVariable Integer id) { return service.setStatus(id,"READ"); }
    @PutMapping("/{id}/unread") public NotificationView unread(@PathVariable Integer id) { return service.setStatus(id,"UNREAD"); }
    @DeleteMapping("/{id}") public void hide(@PathVariable Integer id) { service.setStatus(id,"DELETED"); }
}
