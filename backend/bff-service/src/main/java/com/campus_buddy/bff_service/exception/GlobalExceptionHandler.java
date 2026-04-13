package com.campus_buddy.bff_service.exception;
 
 import org.springframework.http.HttpStatus;
 import org.springframework.http.ResponseEntity;
 import org.springframework.web.bind.annotation.ControllerAdvice;
 import org.springframework.web.bind.annotation.ExceptionHandler;
 import org.springframework.web.client.HttpStatusCodeException;
 
 import java.util.HashMap;
 import java.util.Map;
 
 @ControllerAdvice
 public class GlobalExceptionHandler {
 
     @ExceptionHandler(HttpStatusCodeException.class)
     public ResponseEntity<Object> handleHttpStatusCodeException(HttpStatusCodeException ex) {
         Map<String, Object> body = new HashMap<>();
         body.put("error", "Upstream Service Error");
         body.put("message", ex.getResponseBodyAsString());
         body.put("status", ex.getStatusCode().value());
         
         return new ResponseEntity<>(body, ex.getStatusCode());
     }
 
     @ExceptionHandler(Exception.class)
     public ResponseEntity<Object> handleGeneralException(Exception ex) {
         Map<String, Object> body = new HashMap<>();
         body.put("error", "BFF Internal Error");
         body.put("message", ex.getMessage());
         
         return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
     }
 }
