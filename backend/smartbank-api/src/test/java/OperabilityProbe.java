import com.smartbank.smartbank_api.SmartbankApiApplication;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.security.JwtService;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.server.context.WebServerApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;

class OperabilityProbe {
    public static void main(String[] args) throws Exception {
        try (var context = SpringApplication.run(SmartbankApiApplication.class,
                "--server.address=127.0.0.1", "--server.port=0", "--debug=false",
                "--logging.level.root=ERROR", "--logging.level.org.springframework=ERROR",
                "--spring.main.banner-mode=off", "--spring.jpa.show-sql=false",
                "--spring.datasource.hikari.connection-init-sql=SET default_transaction_read_only=on")) {
            int port = ((WebServerApplicationContext) context).getWebServer().getPort();
            String base = "http://127.0.0.1:" + port;
            var jdbc = context.getBean(JdbcTemplate.class);
            var mapper = context.getBean(ObjectMapper.class);
            String username = jdbc.queryForObject("SELECT username FROM users ORDER BY user_id LIMIT 1", String.class);
            System.out.println("AUDIT database_read_only="
                    + jdbc.queryForObject("SHOW default_transaction_read_only", String.class));
            var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
            String encodedUsername = mapper.writeValueAsString(username);
            String token = null;
            for (String password : new String[] { ",\"password\":\"audit-deliberately-wrong-password\"", "" }) {
                var request = HttpRequest.newBuilder(URI.create(base + "/auth/login"))
                        .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("{\"username\":" + encodedUsername + password + "}"))
                        .build();
                var response = client.send(request, HttpResponse.BodyHandlers.ofString());
                var body = mapper.readTree(response.body());
                System.out.println("AUDIT login_" + (password.isEmpty() ? "omitted" : "wrong")
                        + "_password status=" + response.statusCode() + " token_present=" + body.has("token"));
                if (body.has("token"))
                    token = body.get("token").asString();
            }
            if (token != null) {
                var response = client.send(HttpRequest.newBuilder(URI.create(base + "/customer/audit-probe"))
                        .timeout(Duration.ofSeconds(10)).header("Authorization", "Bearer " + token).GET().build(),
                        HttpResponse.BodyHandlers.discarding());
                System.out.println("AUDIT bearer_protected_path status=" + response.statusCode());
            }
            var user = new User();
            user.setPasswordHash("audit-placeholder");
            System.out.println("AUDIT user_serialization_exposes_passwordHash="
                    + mapper.readTree(mapper.writeValueAsString(user)).has("passwordHash"));
            var jwt = context.getBean(JwtService.class);
            System.out.println("AUDIT fresh_jwt_valid=" + jwt.validateToken(jwt.generateToken("audit"), "audit"));
            try {
                jwt.validateToken("malformed-token", "audit");
                System.out.println("AUDIT malformed_jwt=no_exception");
            } catch (Exception e) {
                System.out.println("AUDIT malformed_jwt=" + e.getClass().getSimpleName());
            }
            System.out.println("AUDIT complete");
        }
    }
}
