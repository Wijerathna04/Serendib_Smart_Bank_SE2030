package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.repository.AuditLogRepository;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.service.BankRules;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
@RestController @RequestMapping("/api/admin/audit-logs") @RequiredArgsConstructor
public class AdminAuditLogController {
    private final AuditLogRepository logs;
    @GetMapping @Transactional(readOnly=true)
    public PageResult<AuditView> list(@RequestParam(required=false) String action,@RequestParam(required=false) Integer actor,
        @RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return PageResult.from(logs.search(action,actor,from==null?null:from.atStartOfDay(),to==null?null:to.plusDays(1).atStartOfDay(),BankRules.page(page,size,"performedAt"))
            .map(a->new AuditView(a.getLogId(),a.getUser()==null?a.getActorType():a.getUser().getUsername(),a.getAction(),a.getEntityType(),a.getEntityId(),a.getPerformedAt())));
    }
}
