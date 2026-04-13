package com.campus_buddy.auth_service.config;
 
 import com.campus_buddy.auth_service.model.Role;
 import com.campus_buddy.auth_service.model.User;
 import com.campus_buddy.auth_service.repository.UserRepository;
 import lombok.RequiredArgsConstructor;
 import org.springframework.boot.CommandLineRunner;
 import org.springframework.security.crypto.password.PasswordEncoder;
 import org.springframework.stereotype.Component;
 
 @Component
 @RequiredArgsConstructor
 public class DataInitializer implements CommandLineRunner {
 
     private final UserRepository userRepository;
     private final PasswordEncoder passwordEncoder;
 
     @Override
     public void run(String... args) {
         // Create Default Student
         if (!userRepository.existsByEmail("student@campus.com")) {
             User student = User.builder()
                     .studentId("S12345")
                     .email("student@campus.com")
                     .passwordHash(passwordEncoder.encode("password"))
                     .role(Role.STUDENT)
                     .build();
             userRepository.save(student);
         }
 
         // Create Default Faculty
         if (!userRepository.existsByEmail("faculty@campus.com")) {
             User faculty = User.builder()
                     .studentId("F98765")
                     .email("faculty@campus.com")
                     .passwordHash(passwordEncoder.encode("password"))
                     .role(Role.FACULTY)
                     .build();
             userRepository.save(faculty);
         }
     }
 }
