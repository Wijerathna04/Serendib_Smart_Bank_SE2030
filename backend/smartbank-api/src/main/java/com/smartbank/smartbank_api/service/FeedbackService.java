package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.FeedbackRepository;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service @RequiredArgsConstructor @Transactional
public class FeedbackService {
    private final FeedbackRepository feedback;
    private final CurrentUserService current;
    private final AuditLogService audit;
    private final NotificationService notifications;
    private final Clock clock;
    private void apply(Feedback f,FeedbackInput r) {
        BankRules.require(!"REVIEW".equals(r.feedbackType()) || r.rating()!=null,"RATING_REQUIRED","Public reviews require a rating");
        f.setFeedbackType(r.feedbackType());f.setSubject(r.subject().trim());f.setMessage(r.message().trim());f.setRating("REVIEW".equals(r.feedbackType())?r.rating():null);f.setUpdatedAt(LocalDateTime.now(clock));
    }
    public FeedbackView submit(FeedbackInput r) { 
        Feedback f = new Feedback();
        f.setCustomer(current.requireCustomer());
        f.setStatus("REVIEW".equals(r.feedbackType()) ? "APPROVED" : "SUBMITTED");
        f.setCreatedAt(LocalDateTime.now(clock));
        apply(f, r);
        feedback.save(f);
        audit.record(current.requireUser(), "FEEDBACK_SUBMITTED", "Feedback", f.getFeedbackId());
        return ResponseMapper.feedback(f); 
    }

    public void delete(Integer id) {
        current.requireUser();
        feedback.deleteById(id);
        audit.record(current.requireUser(), "FEEDBACK_DELETED", "Feedback", id);
    }
    @Transactional(readOnly=true) public PageResult<FeedbackView> list(int page,int size) { return PageResult.from(feedback.findByCustomer_User_UserId(current.requireUser().getUserId(),BankRules.page(page,size,"createdAt")).map(ResponseMapper::feedback)); }
    @Transactional(readOnly=true) public FeedbackView get(Integer id) { return ResponseMapper.feedback(feedback.findByFeedbackIdAndCustomer_User_UserId(id,current.requireUser().getUserId()).orElseThrow(ResourceNotFoundException::new)); }
    public FeedbackView update(Integer id,FeedbackInput r) { Feedback f=feedback.lockById(id).orElseThrow(ResourceNotFoundException::new);if(!f.getCustomer().getUser().getUserId().equals(current.requireUser().getUserId())) throw new ResourceNotFoundException();BankRules.require("SUBMITTED".equals(f.getStatus()),"INVALID_STATE","Only unreviewed submissions can be edited");apply(f,r);audit.record(current.requireUser(),"FEEDBACK_UPDATED","Feedback",id);return ResponseMapper.feedback(f); }
    @Transactional(readOnly=true) public PageResult<FeedbackView> staffList(String status,int page,int size) { var p=BankRules.page(page,size,"createdAt");return PageResult.from((status==null?feedback.findAll(p):feedback.findByStatus(status,p)).map(ResponseMapper::feedback)); }
    @Transactional(readOnly=true) public FeedbackView staffGet(Integer id) { return ResponseMapper.feedback(feedback.findById(id).orElseThrow(ResourceNotFoundException::new)); }
    public FeedbackView moderate(Integer id,String action,Decision r) {
        Feedback f=feedback.lockById(id).orElseThrow(ResourceNotFoundException::new);String s=f.getStatus();
        switch(action) {
            case "review" -> { BankRules.require("SUBMITTED".equals(s),"INVALID_STATE","Submission must be unreviewed");f.setStatus("UNDER_REVIEW"); }
            case "approve", "reject" -> { BankRules.require("UNDER_REVIEW".equals(s),"INVALID_STATE","Feedback must be under review");f.setStatus("approve".equals(action)?"APPROVED":"REJECTED"); }
            case "resolve" -> { BankRules.require(!"REVIEW".equals(f.getFeedbackType()) && "APPROVED".equals(s),"INVALID_STATE","Only approved private service feedback can be resolved");f.setStatus("RESOLVED"); }
            case "close" -> { BankRules.require(!"REVIEW".equals(f.getFeedbackType()) && Set.of("RESOLVED","REJECTED").contains(s),"INVALID_STATE","Only resolved or rejected private feedback can be closed");f.setStatus("CLOSED"); }
            default -> throw new IllegalArgumentException("Invalid moderation action");
        }
        f.setModerator(current.requireUser());f.setStaffResponse(r.reason());f.setUpdatedAt(LocalDateTime.now(clock));audit.record(current.requireUser(),"FEEDBACK_"+f.getStatus(),"Feedback",id);
        notifications.createNotification(f.getCustomer().getUser().getUserId(),"FEEDBACK_"+f.getStatus(),"Feedback update","Submission #"+id+" is now "+f.getStatus()+".");return ResponseMapper.feedback(f);
    }
}
