# Run & Setup Guide for Teammates

## Backend Restart Requirement
Whenever you pull new changes from git (especially route, controller, or security changes), **you must restart the backend server**.
If a stale Java process remains running on port 8081, 8089, or 8099, new endpoints such as `GET /api/customers/me/spending-summary` will return `404 Not Found`.

### Steps to Clean & Restart Backend:
1. Stop any running backend processes or kill Java processes running on port 8081/8089/8099:
   ```bash
   # On Windows PowerShell:
   Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
2. Rebuild and run unit/integration tests:
   ```bash
   ./mvnw clean test
   ```
3. Start the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

### API Route Verification (via curl):
- **Unauthenticated** (`GET /api/customers/me/spending-summary`): Expect `401 Unauthorized`
- **Employee/Staff Token** (`GET /api/customers/me/spending-summary`): Expect `403 Forbidden`
- **Customer Token** (`GET /api/customers/me/spending-summary`): Expect `200 OK` JSON response
