package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.security.AuthAttemptService;
import com.smartbank.smartbank_api.service.FixedDepositMaturityService;
import com.smartbank.smartbank_api.service.TransactionExpiryService;
import com.smartbank.smartbank_api.service.CardExpiryService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.server.context.WebServerApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

/** Real HTTP + PostgreSQL tests. Only explicitly opted-in disposable serendib_qa_* databases. */
@EnabledIfEnvironmentVariable(named="SERENDIB_E2E", matches="true")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
    "bank.otp.simulation-enabled=true", "debug=false", "logging.level.root=ERROR",
    "logging.level.org.springframework=ERROR", "server.address=127.0.0.1"})
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FullProjectIntegrationTests {
    @DynamicPropertySource static void requireDisposableDatabaseBeforeStartup(DynamicPropertyRegistry properties) {
        String url=System.getenv("DB_URL");
        if(url==null || !url.matches("jdbc:postgresql://localhost:5432/serendib_qa_[0-9_]+"))
            throw new IllegalStateException("Set DB_URL to a disposable local serendib_qa_<timestamp> database");
        properties.add("spring.datasource.url",()->url);
    }
    @Autowired JdbcTemplate db;
    @Autowired ObjectMapper json;
    @Autowired WebServerApplicationContext context;
    @Autowired AuthAttemptService attempts;
    @Autowired FixedDepositMaturityService maturity;
    @Autowired TransactionExpiryService expiry;
    @Autowired CardExpiryService cardExpiry;
    final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    final Map<String,String> tokens=new HashMap<>();
    String base,run;
    int account,other,second,beneficiary,john,jane;
    record Reply(int status,JsonNode body) {}
    @BeforeAll void setup() throws Exception {
        assertTrue(db.queryForObject("select current_database()",String.class).matches("serendib_qa_[0-9_]+"),"Refusing non-disposable database");
        base="http://127.0.0.1:"+context.getWebServer().getPort(); run=UUID.randomUUID().toString().substring(0,8);
        for(String who:List.of("john_customer","jane_customer","bank_employee","branch_manager","system_admin")) {
            JsonNode login=call("POST","/auth/login",null,Map.of("username",who,"password","DemoBank!2026"),null,200);
            tokens.put(who,login.get("token").asText());
        }
        john=id("select user_id from users where username='john_customer'"); jane=id("select user_id from users where username='jane_customer'");
        account=id("select account_id from account where account_number='1000000001'");
        second=id("select account_id from account where account_number='1000000002'");
        other=id("select account_id from account where account_number='2000000001'");
        beneficiary=id("select beneficiary_id from beneficiary where account_number='2000000001' and active");
    }
    @BeforeEach void isolateRateWindows() { ((Map<?,?>)ReflectionTestUtils.getField(attempts,"windows")).clear(); }
    int id(String sql,Object...args){return db.queryForObject(sql,Integer.class,args);}
    BigDecimal balance(int id){return db.queryForObject("select balance from account where account_id=?",BigDecimal.class,id);}
    void money(BigDecimal expected,BigDecimal actual){assertEquals(0,expected.compareTo(actual));}
    String key(){return "qa-"+UUID.randomUUID();}
    Reply request(String method,String path,String who,Object body,String key) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create(base+path)).timeout(Duration.ofSeconds(25));
        if(who!=null)builder.header("Authorization","Bearer "+tokens.get(who));
        if(key!=null)builder.header("Idempotency-Key",key);
        if(body!=null)builder.header("Content-Type","application/json");
        var response=http.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build(),HttpResponse.BodyHandlers.ofString());
        JsonNode value=response.body().isBlank()?json.readTree("null"):json.readTree(response.body());
        return new Reply(response.statusCode(),value);
    }
    JsonNode call(String method,String path,String who,Object body,String key,int status) throws Exception {
        Reply reply=request(method,path,who,body,key);
        System.out.println("HTTP "+method+" "+path+" -> "+reply.status());
        assertEquals(status,reply.status(),method+" "+path+" code="+reply.body().path("code").asText());return reply.body();
    }
    JsonNode get(String path,String who) throws Exception{return call("GET",path,who,null,null,200);}
    String otp(int tx)throws Exception{return get("/api/simulation/otp/"+tx,"john_customer").get("code").asText();}
    JsonNode verify(int tx,String code,int expected)throws Exception{return call("POST","/api/transactions/"+tx+"/verify-otp","john_customer",Map.of("code",code),null,expected);}
    JsonNode deposit(String key)throws Exception{return call("POST","/api/fixed-deposits","john_customer",Map.of("accountId",account,"principalAmount","1000.00","termMonths",3),key,200);}
    int transfer(String amount)throws Exception{return call("POST","/api/transfers","john_customer",Map.of("accountId",account,"beneficiaryId",beneficiary,"amount",amount,"description","QA "+run),key(),200).get("transactionId").asInt();}

    @Test @Order(1) void registrationLoginJwtProfileAndValidation() throws Exception {
        String name="qa_"+run;
        call("POST","/auth/register",null,Map.of("username",name,"email",name+"@example.invalid","password","QaPassword!2026"),null,200);
        assertEquals(1,id("select count(*) from users u join customer c using(user_id) where username=?",name));
        assertTrue(db.queryForObject("select password_hash from users where username=?",String.class,name).startsWith("$2"));
        call("POST","/auth/register",null,Map.of("username",name,"email",name+"@example.invalid","password","QaPassword!2026"),null,409);
        call("POST","/auth/register",null,Map.of("username","x","email","bad","password","short"),null,400);
        call("POST","/auth/login",null,Map.of("username",name,"password","wrong"),null,401);
        JsonNode login=call("POST","/auth/login",null,Map.of("username",name,"password","QaPassword!2026"),null,200);tokens.put(name,login.get("token").asText());
        assertEquals("Customer",get("/auth/me",name).get("role").asText());
        assertEquals(0,get("/api/accounts",name).get("totalElements").asInt());
        call("PATCH","/api/customers/me",name,Map.of("email",name+"@example.invalid","phone","0700000000","address","QA address","nic","QA123","dateOfBirth","2000-01-01"),null,200);
        assertEquals("QA address",get("/auth/me",name).get("address").asText());
        call("POST","/auth/change-password",name,Map.of("currentPassword","QaPassword!2026","newPassword","ChangedQa!2026"),null,200);
        call("GET","/auth/me",name,null,null,401);
        login=call("POST","/auth/login",null,Map.of("username",name,"password","ChangedQa!2026"),null,200);tokens.put(name,login.get("token").asText());
        call("POST","/auth/logout",name,null,null,200);call("GET","/auth/me",name,null,null,401);
        call("GET","/api/accounts",null,null,null,401);
    }

    @Test @Order(2) void rolesAndReadOnlyAccounts() throws Exception {
        for(String role:List.of("bank_employee","branch_manager","system_admin"))call("GET","/api/accounts",role,null,null,403);
        call("GET","/api/admin/users","john_customer",null,null,403);
        call("GET","/api/manager/loans","bank_employee",null,null,403);
        call("GET","/api/employee/loans","branch_manager",null,null,403);
        get("/api/employee/customers","bank_employee");get("/api/employee/customers","branch_manager");
        assertEquals(2,get("/api/accounts","john_customer").get("totalElements").asInt());
        get("/api/accounts/"+account,"john_customer");call("GET","/api/accounts/"+other,"john_customer",null,null,404);
        for(String method:List.of("POST","PUT","PATCH","DELETE"))call(method,"/api/accounts"+(method.equals("POST")?"":"/"+account),"john_customer",null,null,405);
        call("GET","/api/accounts/invalid","john_customer",null,null,400);
    }

    @Test @Order(3) void depositFundingMaturityClosureAndReplay() throws Exception {
        BigDecimal before=balance(account);String openingKey=key();JsonNode fd=deposit(openingKey);int fid=fd.get("fixedDepositId").asInt(),tx=fd.get("openingTransactionId").asInt();
        assertEquals(fid,deposit(openingKey).get("fixedDepositId").asInt());money(before,balance(account));
        call("GET","/api/fixed-deposits/"+fid,"jane_customer",null,null,404);
        call("PUT","/api/fixed-deposits/"+fid+"/close","john_customer",null,key(),409);
        verify(tx,otp(tx),200);money(before.subtract(new BigDecimal("1000")),balance(account));
        fd=get("/api/fixed-deposits/"+fid,"john_customer");assertEquals("ACTIVE",fd.get("status").asText());assertEquals("1012.50",fd.get("maturityAmount").asText());
        call("PUT","/api/fixed-deposits/"+fid+"/cancel","john_customer",null,null,409);
        // Move only this disposable fixture's dates; invoke the real maturity job.
        db.update("update fixed_deposit set start_date=current_date-interval '3 months',maturity_date=current_date where fixed_deposit_id=?",fid);
        maturity.matureDueDeposits();assertEquals("MATURED",get("/api/fixed-deposits/"+fid,"john_customer").get("status").asText());
        money(before.subtract(new BigDecimal("1000")),balance(account));
        String closingKey=key();fd=call("PUT","/api/fixed-deposits/"+fid+"/close","john_customer",null,closingKey,200);int close=fd.get("closingTransactionId").asInt();
        call("PUT","/api/fixed-deposits/"+fid+"/close","john_customer",null,key(),409);
        verify(close,otp(close),200);assertEquals("CLOSED",get("/api/fixed-deposits/"+fid,"john_customer").get("status").asText());
        call("PUT","/api/fixed-deposits/"+fid+"/close","john_customer",null,closingKey,200);
        money(before.add(new BigDecimal("12.50")),balance(account));
    }

    @Test @Order(4) void pendingDepositCancellationAndInvalidRequests() throws Exception {
        BigDecimal before=balance(account);JsonNode fd=deposit(key());int fid=fd.get("fixedDepositId").asInt();
        call("PUT","/api/fixed-deposits/"+fid+"/cancel","jane_customer",null,null,404);
        call("PUT","/api/fixed-deposits/"+fid+"/cancel","john_customer",null,null,200);
        assertEquals("CANCELLED",get("/api/fixed-deposits/"+fid,"john_customer").get("status").asText());money(before,balance(account));
        call("POST","/api/fixed-deposits","john_customer",Map.of("accountId",other,"principalAmount","1000.00","termMonths",3),key(),404);
        call("POST","/api/fixed-deposits","john_customer",Map.of("accountId",account,"principalAmount","1.00","termMonths",3),key(),409);
        call("POST","/api/fixed-deposits","john_customer",Map.of("accountId",account,"principalAmount","1000.00","termMonths",5),key(),409);
    }

    @Test @Order(5) void notificationReadUnreadHideOwnership() throws Exception {
        JsonNode list=get("/api/notifications","john_customer");int nid=list.get("content").get(0).get("notificationId").asInt();
        call("GET","/api/notifications/"+nid,"jane_customer",null,null,404);
        call("PUT","/api/notifications/"+nid+"/read","jane_customer",null,null,404);
        assertEquals("READ",call("PUT","/api/notifications/"+nid+"/read","john_customer",null,null,200).get("status").asText());
        assertEquals("UNREAD",call("PUT","/api/notifications/"+nid+"/unread","john_customer",null,null,200).get("status").asText());
        get("/api/notifications/unread-count","john_customer");call("DELETE","/api/notifications/"+nid,"john_customer",null,null,200);
        call("GET","/api/notifications/"+nid,"john_customer",null,null,404);
        call("PUT","/api/notifications/"+nid+"/unread","john_customer",null,null,404);
        assertEquals("DELETED",db.queryForObject("select status from notification where notification_id=?",String.class,nid));
    }

    @Test @Order(6) void billPaymentOtpHistoryAndIdempotency() throws Exception {
        BigDecimal before=balance(account);String key=key();Map<String,Object> body=Map.of("accountId",account,"billType","WATER","referenceNumber","QA-12345","amount","15.50");
        JsonNode bill=call("POST","/api/bill-payments","john_customer",body,key,200);int bid=bill.get("paymentId").asInt(),tx=bill.get("transactionId").asInt();
        assertEquals(bid,call("POST","/api/bill-payments","john_customer",body,key,200).get("paymentId").asInt());money(before,balance(account));
        call("GET","/api/bill-payments/"+bid,"jane_customer",null,null,404);verify(tx,otp(tx),200);money(before.subtract(new BigDecimal("15.50")),balance(account));
        assertEquals("COMPLETED",get("/api/bill-payments/"+bid,"john_customer").get("status").asText());
        get("/api/transactions/"+tx+"/receipt","john_customer");
        assertTrue(get("/api/transactions?type=BILL_PAYMENT","john_customer").get("totalElements").asInt()>0);
    }

    @Test @Order(7) void transferOtpAttemptsOwnershipAndReceipt() throws Exception {
        BigDecimal from=balance(account),to=balance(other);int tx=transfer("25.00");String code=otp(tx);String wrong=code.equals("000000")?"000001":"000000";
        call("GET","/api/simulation/otp/"+tx,"jane_customer",null,null,409);
        call("POST","/api/transactions/"+tx+"/verify-otp","jane_customer",Map.of("code",code),null,404);
        verify(tx,wrong,409);assertEquals(1,id("select attempt_count from otp where transaction_id=?",tx));money(from,balance(account));
        verify(tx,code,200);verify(tx,code,200);money(from.subtract(new BigDecimal("25")),balance(account));money(to.add(new BigDecimal("25")),balance(other));
        assertFalse(get("/api/transactions/"+tx,"jane_customer").get("canAuthorize").asBoolean());
        get("/api/transactions/"+tx+"/receipt","jane_customer");
        assertTrue(id("select count(*) from notification where user_id=? and event_type='TRANSFER_RECEIVED'",jane)>0);
    }

    @Test @Order(8) void expiredOtpResendBudgetAndCancellation() throws Exception {
        BigDecimal before=balance(account);int tx=transfer("1.00");String code=otp(tx);
        call("POST","/api/transactions/"+tx+"/resend-otp","john_customer",null,null,409);
        db.update("update otp set expires_at=current_timestamp-interval '1 second',last_sent_at=current_timestamp-interval '1 minute' where transaction_id=?",tx);
        assertEquals("OTP_EXPIRED",verify(tx,code,409).get("code").asText());
        call("POST","/api/transactions/"+tx+"/resend-otp","john_customer",null,null,200);code=otp(tx);String wrong=code.equals("000000")?"000001":"000000";
        for(int i=0;i<5;i++)verify(tx,wrong,409);
        assertEquals(5,id("select attempt_count from otp where transaction_id=?",tx));assertEquals("FAILED",get("/api/transactions/"+tx,"john_customer").get("status").asText());money(before,balance(account));
        int cancelled=transfer("1.00");call("POST","/api/transactions/"+cancelled+"/cancel","john_customer",null,null,200);verify(cancelled,"123456",409);money(before,balance(account));
    }

    @Test @Order(9) void concurrentVerificationPostsExactlyOnce() throws Exception {
        int tx=transfer("7.00");String code=otp(tx);BigDecimal before=balance(account),dest=balance(other);
        ExecutorService pool=Executors.newFixedThreadPool(2);
        try {
            Callable<Reply> action=()->request("POST","/api/transactions/"+tx+"/verify-otp","john_customer",Map.of("code",code),null);
            var futures=pool.invokeAll(List.of(action,action));for(var result:futures)assertEquals(200,result.get().status());
        } finally {pool.shutdownNow();}
        money(before.subtract(new BigDecimal("7")),balance(account));money(dest.add(new BigDecimal("7")),balance(other));
        assertEquals(1,id("select count(*) from audit_log where entity_id=? and action='TRANSFER_SUCCESS'",tx));
    }

    @Test @Order(10) void concurrentOverdraftIsPrevented() throws Exception {
        BigDecimal original=balance(account);db.update("update account set balance=10 where account_id=?",account);
        int first=transfer("8.00"),secondTx=transfer("8.00");String one=otp(first),two=otp(secondTx);
        ExecutorService pool=Executors.newFixedThreadPool(2);
        try {
            var futures=pool.invokeAll(List.<Callable<Reply>>of(()->request("POST","/api/transactions/"+first+"/verify-otp","john_customer",Map.of("code",one),null),()->request("POST","/api/transactions/"+secondTx+"/verify-otp","john_customer",Map.of("code",two),null)));
            List<Integer> statuses=new ArrayList<>();for(var f:futures)statuses.add(f.get().status());Collections.sort(statuses);assertEquals(List.of(200,409),statuses);money(new BigDecimal("2"),balance(account));
        } finally {pool.shutdownNow();db.update("update account set balance=? where account_id=?",original,account);}
    }

    @Test @Order(11) void downstreamDatabaseFailureRollsBackPostingAndOtp() throws Exception {
        int tx=transfer("9.00");String code=otp(tx);BigDecimal from=balance(account),to=balance(other);
        db.execute("create function qa_reject_notification() returns trigger language plpgsql as $$ begin if NEW.event_type='TRANSFER_SUCCESS' then raise exception 'QA rollback injection'; end if; return NEW; end $$");
        db.execute("create trigger qa_reject_notification before insert on notification for each row execute function qa_reject_notification()");
        try {
            verify(tx,code,500);money(from,balance(account));money(to,balance(other));
            assertEquals("PENDING",db.queryForObject("select status from transaction_record where transaction_id=?",String.class,tx));
            assertFalse(db.queryForObject("select verified from otp where transaction_id=?",Boolean.class,tx));
            assertEquals(0,id("select count(*) from audit_log where entity_id=? and action='TRANSFER_SUCCESS'",tx));
        } finally {db.execute("drop trigger qa_reject_notification on notification");db.execute("drop function qa_reject_notification()");}
        verify(tx,code,200);money(from.subtract(new BigDecimal("9")),balance(account));
    }

    @Test @Order(12) void beneficiaryCrudAndOwnership() throws Exception {
        Map<String,Object> body=Map.of("name","QA beneficiary","accountNumber","1000000002","bankName","SERENDIB","relationship","Self");
        JsonNode b=call("POST","/api/beneficiaries","john_customer",body,null,200);int bid=b.get("beneficiaryId").asInt();
        call("POST","/api/beneficiaries","john_customer",body,null,409);get("/api/beneficiaries/"+bid,"john_customer");
        call("GET","/api/beneficiaries/"+bid,"jane_customer",null,null,404);
        call("PATCH","/api/beneficiaries/"+bid,"john_customer",Map.of("name","QA updated","accountNumber","1000000002","bankName","SERENDIB"),null,200);
        call("DELETE","/api/beneficiaries/"+bid,"jane_customer",null,null,404);call("DELETE","/api/beneficiaries/"+bid,"john_customer",null,null,200);
        assertFalse(db.queryForObject("select active from beneficiary where beneficiary_id=?",Boolean.class,bid));
        call("PATCH","/api/beneficiaries/"+bid,"john_customer",body,null,409);
    }

    @Test @Order(13) void loanInformationRecommendationApprovalAndCancellation() throws Exception {
        JsonNode loan=call("POST","/api/loans","john_customer",Map.of("loanType","EDUCATION","amount","5000.00","information","QA application"),null,200);int lid=loan.get("loanId").asInt();Map<String,String> reason=Map.of("reason","QA decision");
        call("GET","/api/loans/"+lid,"jane_customer",null,null,404);call("POST","/api/manager/loans/"+lid+"/approve","branch_manager",reason,null,409);
        call("POST","/api/employee/loans/"+lid+"/review","bank_employee",reason,null,200);
        call("POST","/api/employee/loans/"+lid+"/request-information","bank_employee",reason,null,200);
        call("POST","/api/loans/"+lid+"/information","john_customer",Map.of("reason","Extra information"),null,200);
        call("POST","/api/employee/loans/"+lid+"/recommend","bank_employee",reason,null,200);
        assertEquals("APPROVED",call("POST","/api/manager/loans/"+lid+"/approve","branch_manager",reason,null,200).get("status").asText());
        assertEquals(6,id("select count(*) from loan_decision where loan_id=?",lid));
        call("PUT","/api/loans/"+lid+"/cancel","john_customer",null,null,409);
        loan=call("POST","/api/loans","john_customer",Map.of("loanType","HOME","amount","1000.00","information","Cancel fixture"),null,200);
        call("PUT","/api/loans/"+loan.get("loanId").asInt()+"/cancel","john_customer",null,null,200);
    }

    @Test @Order(14) void cardLifecycleAndOwnership() throws Exception {
        JsonNode card=call("POST","/api/cards","john_customer",Map.of("accountId",second,"cardType","DEBIT"),null,200);int cid=card.get("cardId").asInt();
        call("POST","/api/cards","john_customer",Map.of("accountId",second,"cardType","DEBIT"),null,409);
        call("PUT","/api/cards/"+cid+"/activate","john_customer",null,null,409);
        call("GET","/api/cards/"+cid,"jane_customer",null,null,404);
        card=call("PUT","/api/employee/cards/"+cid+"/issue","bank_employee",null,null,200);assertTrue(card.get("cardNumber").asText().startsWith("SIM ****"));
        for(String action:List.of("activate","block","unblock","cancel"))call("PUT","/api/cards/"+cid+"/"+action,"john_customer",null,null,200);
        call("PUT","/api/cards/"+cid+"/activate","john_customer",null,null,409);
    }

    @Test @Order(15) void feedbackModerationPrivateDataAndPublicReviews() throws Exception {
        JsonNode review=call("POST","/api/feedback","john_customer",Map.of("feedbackType","REVIEW","subject","QA review "+run,"message","Helpful service","rating",5),null,200);int rid=review.get("feedbackId").asInt();
        call("GET","/api/feedback/"+rid,"jane_customer",null,null,404);
        call("PATCH","/api/feedback/"+rid,"john_customer",Map.of("feedbackType","REVIEW","subject","QA review "+run,"message","Updated review","rating",4),null,200);
        for(String action:List.of("review","approve"))call("PUT","/api/employee/feedback/"+rid+"/"+action,"bank_employee",Map.of("reason","QA approved"),null,200);
        call("PUT","/api/employee/feedback/"+rid+"/resolve","bank_employee",Map.of("reason","Must reject"),null,409);
        JsonNode complaint=call("POST","/api/feedback","john_customer",Map.of("feedbackType","COMPLAINT","subject","Private "+run,"message","Private details"),null,200);int fid=complaint.get("feedbackId").asInt();
        for(String action:List.of("review","approve","resolve","close"))call("PUT","/api/employee/feedback/"+fid+"/"+action,"bank_employee",Map.of("reason","QA handled"),null,200);
        JsonNode publicReviews=get("/api/reviews",null);boolean found=false;
        for(JsonNode item:publicReviews.get("content")){assertNotEquals(fid,item.get("feedbackId").asInt());assertFalse(item.has("customer"));if(item.get("feedbackId").asInt()==rid)found=true;}
        assertTrue(found);assertTrue(get("/api/reviews/summary",null).get("totalReviews").asInt()>0);
    }

    @Test @Order(16) void auditAndAssistantIsolation() throws Exception {
        assertTrue(get("/api/admin/audit-logs","system_admin").get("totalElements").asInt()>0);
        get("/api/admin/audit-logs?from=2020-01-01&to=2099-01-01","system_admin");
        call("GET","/api/admin/audit-logs","john_customer",null,null,403);
        BigDecimal before=balance(account);int janeBefore=get("/api/assistant/messages","jane_customer").get("totalElements").asInt();
        JsonNode answer=call("POST","/api/assistant/messages","john_customer",Map.of("question","Please transfer money and approve my loan"),null,200);assertFalse(answer.get("response").asText().isBlank());
        assertTrue(get("/api/assistant/messages","john_customer").get("totalElements").asInt()>0);
        assertEquals(janeBefore,get("/api/assistant/messages","jane_customer").get("totalElements").asInt());money(before,balance(account));
    }

    @Test @Order(17) void adminLastAdminProtectionAndSessionRevocation() throws Exception {
        int admin=id("select user_id from users where username='system_admin'");
        call("PATCH","/api/admin/users/"+admin+"/status","system_admin",Map.of("status","DISABLED"),null,409);
        String name="qa_staff_"+run;JsonNode staff=call("POST","/api/admin/users/staff","system_admin",Map.of("username",name,"email",name+"@example.invalid","password","QaPassword!2026","role","Employee","department","QA","position","Tester"),null,200);int uid=staff.get("userId").asInt();
        JsonNode login=call("POST","/auth/login",null,Map.of("username",name,"password","QaPassword!2026"),null,200);tokens.put(name,login.get("token").asText());
        call("PATCH","/api/admin/users/"+uid+"/role","system_admin",Map.of("role","Manager"),null,200);call("GET","/auth/me",name,null,null,401);
        call("PATCH","/api/admin/users/"+uid+"/status","system_admin",Map.of("status","DISABLED"),null,200);
        call("POST","/auth/login",null,Map.of("username",name,"password","QaPassword!2026"),null,401);
    }

    @Test @Order(18) void httpRateLimitAndSafeErrors() throws Exception {
        for(int i=0;i<10;i++)call("POST","/auth/login",null,Map.of("username","unknown_"+run,"password","invalid"),null,401);
        assertEquals("RATE_LIMITED",call("POST","/auth/login",null,Map.of("username","unknown_"+run,"password","invalid"),null,429).get("code").asText());
        call("POST","/api/transfers","john_customer",Map.of(),key(),400);
        call("GET","/api/accounts/2147483647","john_customer",null,null,404);
        get("/api/admin/users?search=%27%20OR%201%3D1--","system_admin");
    }

    @Test @Order(19) void cancelledClosureKeyCanBeReplayedAfterNewClosure() throws Exception {
        JsonNode fd=deposit(key());int fid=fd.get("fixedDepositId").asInt(),opening=fd.get("openingTransactionId").asInt();verify(opening,otp(opening),200);
        db.update("update fixed_deposit set start_date=current_date-interval '3 months',maturity_date=current_date where fixed_deposit_id=?",fid);maturity.matureDueDeposits();
        String oldKey=key();fd=call("PUT","/api/fixed-deposits/"+fid+"/close","john_customer",null,oldKey,200);int oldTx=fd.get("closingTransactionId").asInt();
        call("POST","/api/transactions/"+oldTx+"/cancel","john_customer",null,null,200);
        fd=call("PUT","/api/fixed-deposits/"+fid+"/close","john_customer",null,key(),200);int newer=fd.get("closingTransactionId").asInt();
        int count=id("select count(*) from transaction_record");
        call("PUT","/api/fixed-deposits/"+fid+"/close","john_customer",null,oldKey,200);
        assertEquals(count,id("select count(*) from transaction_record"));
        verify(newer,otp(newer),200);
    }

    @Test @Order(20) void pendingExpirySynchronizesBillAndDepositWithoutMoneyMovement() throws Exception {
        BigDecimal before=balance(account);JsonNode fd=deposit(key());int fid=fd.get("fixedDepositId").asInt(),tx=fd.get("openingTransactionId").asInt();
        JsonNode bill=call("POST","/api/bill-payments","john_customer",Map.of("accountId",account,"billType","INTERNET","referenceNumber","QA-expire","amount","3.00"),key(),200);int bid=bill.get("paymentId").asInt(),billTx=bill.get("transactionId").asInt();
        db.update("update transaction_record set authorization_expires_at=current_timestamp-interval '1 day' where transaction_id in (?,?)",tx,billTx);
        expiry.expireDueRequests();
        assertEquals("CANCELLED",get("/api/fixed-deposits/"+fid,"john_customer").get("status").asText());
        assertEquals("FAILED",get("/api/bill-payments/"+bid,"john_customer").get("status").asText());
        assertEquals("FAILED",get("/api/transactions/"+tx,"john_customer").get("status").asText());money(before,balance(account));
    }

    @Test @Order(21) void competingInitiationWithSameKeyCreatesOneAuthorization() throws Exception {
        String sameKey=key();Map<String,Object> payload=Map.of("accountId",account,"beneficiaryId",beneficiary,"amount","2.00");BigDecimal before=balance(account);
        ExecutorService pool=Executors.newFixedThreadPool(2);
        try {
            Callable<Reply> action=()->request("POST","/api/transfers","john_customer",payload,sameKey);
            var futures=pool.invokeAll(List.of(action,action));boolean success=false;
            for(var f:futures){int status=f.get().status();assertTrue(status==200||status==409);success|=status==200;}assertTrue(success);
        } finally {pool.shutdownNow();}
        assertEquals(1,id("select count(*) from transaction_record where initiated_by=? and idempotency_key=?",john,sameKey));
        int tx=id("select transaction_id from transaction_record where initiated_by=? and idempotency_key=?",john,sameKey);
        call("POST","/api/transfers","john_customer",Map.of("accountId",account,"beneficiaryId",beneficiary,"amount","3.00"),sameKey,409);
        money(before,balance(account));call("POST","/api/transactions/"+tx+"/cancel","john_customer",null,null,200);
    }

    @Test @Order(22) void cardExpiryRejectsReactivationAndLoanRejectionIsFinal() throws Exception {
        JsonNode card=call("POST","/api/cards","john_customer",Map.of("accountId",account,"cardType","DEBIT"),null,200);int cid=card.get("cardId").asInt();
        call("PUT","/api/employee/cards/"+cid+"/issue","system_admin",null,null,200);
        db.update("update card set expiry_date=current_date-1 where card_id=?",cid);cardExpiry.expireCards();
        assertEquals("EXPIRED",get("/api/cards/"+cid,"john_customer").get("status").asText());
        call("PUT","/api/cards/"+cid+"/activate","john_customer",null,null,409);
        JsonNode loan=call("POST","/api/loans","john_customer",Map.of("loanType","PERSONAL","amount","1000.00","information","Reject fixture"),null,200);int lid=loan.get("loanId").asInt();Map<String,String> reason=Map.of("reason","QA rejected");
        call("POST","/api/employee/loans/"+lid+"/review","bank_employee",reason,null,200);
        call("POST","/api/employee/loans/"+lid+"/recommend","bank_employee",reason,null,200);
        call("POST","/api/manager/loans/"+lid+"/reject","branch_manager",reason,null,200);
        assertEquals("REJECTED",get("/api/loans/"+lid,"john_customer").get("status").asText());
        call("POST","/api/manager/loans/"+lid+"/approve","branch_manager",reason,null,409);
    }

    @Test @Order(23) void directObjectsAndInputErrorsCannotBypassOwnership() throws Exception {
        call("POST","/api/cards","john_customer",Map.of("accountId",other,"cardType","DEBIT"),null,404);
        call("POST","/api/bill-payments","john_customer",Map.of("accountId",other,"billType","WATER","referenceNumber","QA-own","amount","1.00"),key(),404);
        call("POST","/api/transfers","john_customer",Map.of("accountId",other,"beneficiaryId",beneficiary,"amount","1.00"),key(),404);
        call("POST","/api/transfers","john_customer",Map.of("accountId",account,"beneficiaryId",beneficiary,"amount","-1.00"),key(),400);
        call("POST","/api/transfers","john_customer",Map.of("accountId",account,"beneficiaryId",beneficiary,"amount","1.00"),null,400);
        call("POST","/api/feedback","john_customer",Map.of("feedbackType","REVIEW","subject","Missing rating","message","Fixture"),null,409);
        call("POST","/api/feedback","john_customer",Map.of("feedbackType","REVIEW","subject","Bad rating","message","Fixture","rating",6),null,400);
    }
}
