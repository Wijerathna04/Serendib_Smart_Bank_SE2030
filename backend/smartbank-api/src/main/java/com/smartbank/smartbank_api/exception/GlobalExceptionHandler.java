package com.smartbank.smartbank_api.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    public record ApiError(String code, String message, Map<String, String> fieldErrors, Instant timestamp) {}

    private ResponseEntity<ApiError> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new ApiError(code, message, Map.of(), Instant.now()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION_FAILED", "Please correct the highlighted fields", fields, Instant.now()));
    }

    private static final Set<String> CONFLICT_CODES = Set.of(
            "IDEMPOTENCY_CONFLICT", "INACTIVE_ACCOUNT", "ACCOUNT_LOCKED",
            "ACCOUNT_CLOSED", "ACCOUNT_FROZEN", "CONCURRENT_CHANGE", "DATA_CONFLICT"
    );

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiError> business(BusinessRuleException e) {
        String code = e.getCode() != null ? e.getCode() : "BUSINESS_RULE_VIOLATION";
        HttpStatus status;
        if ("RATE_LIMITED".equalsIgnoreCase(code)) {
            status = HttpStatus.TOO_MANY_REQUESTS;
        } else if (code.toUpperCase(Locale.ROOT).startsWith("DUPLICATE_") || CONFLICT_CODES.contains(code.toUpperCase(Locale.ROOT))) {
            status = HttpStatus.CONFLICT;
        } else {
            status = HttpStatus.BAD_REQUEST;
        }
        return error(status, code, e.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> missing(ResourceNotFoundException e) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> credentials(BadCredentialsException e) {
        return error(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> denied(AccessDeniedException e) {
        return error(HttpStatus.FORBIDDEN, "FORBIDDEN", "Your role cannot perform this operation");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> duplicate(DataIntegrityViolationException e, HttpServletRequest request) {
        Throwable cause = e.getMostSpecificCause();
        String rootMsg = cause != null ? cause.getMessage() : e.getMessage();
        log.warn("Data integrity violation at {} {}: {}", request.getMethod(), request.getRequestURI(), rootMsg);
        String lowerMsg = rootMsg != null ? rootMsg.toLowerCase(Locale.ROOT) : "";
        if (lowerMsg.contains("value too long")) {
            return error(HttpStatus.BAD_REQUEST, "VALUE_TOO_LONG", "A submitted value or file is too large: " + rootMsg);
        }
        if (lowerMsg.contains("null value") || lowerMsg.contains("not-null") || lowerMsg.contains("cannot be null")) {
            return error(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Required field is missing or cannot be null: " + rootMsg);
        }
        return error(HttpStatus.CONFLICT, "DATA_CONFLICT", rootMsg != null ? rootMsg : "Data integrity violation occurred");
    }

    @ExceptionHandler({OptimisticLockingFailureException.class, PessimisticLockingFailureException.class})
    public ResponseEntity<ApiError> concurrent(Exception e) {
        log.warn("Concurrent modification lock failure: {}", e.getMessage());
        return error(HttpStatus.CONFLICT, "CONCURRENT_CHANGE", "This record was changed by someone else. Refresh and try again.");
    }

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class, MissingRequestHeaderException.class})
    public ResponseEntity<ApiError> invalid(Exception e) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Request values or required headers are invalid");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> route(NoResourceFoundException e, HttpServletRequest request) {
        log.warn("Resource not found: {} {}", request.getMethod(), request.getRequestURI());
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", "Endpoint not found: " + request.getMethod() + " " + request.getRequestURI());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> method(HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        log.warn("Method not supported: {} {}", request.getMethod(), request.getRequestURI());
        return error(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "Endpoint not found: " + request.getMethod() + " " + request.getRequestURI());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> mediaType(HttpMediaTypeNotSupportedException e, HttpServletRequest request) {
        log.warn("Media type not supported: {} {} - {}", request.getMethod(), request.getRequestURI(), e.getContentType());
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "Unsupported media type: " + e.getContentType());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> payloadTooLarge(MaxUploadSizeExceededException e) {
        log.warn("Max upload size exceeded: {}", e.getMessage());
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE", "Request payload exceeds the maximum allowed size.");
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiError> upstream(org.springframework.web.server.ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(new ApiError("SERVICE_UNAVAILABLE", "Exchange rates are temporarily unavailable", Map.of(), Instant.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception e) {
        log.error("Unhandled request failure type: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "The operation could not be completed. Please try again later.");
    }
}
