package com.campus_buddy.bff_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.context.annotation.Bean;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.EnableAsync;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@SpringBootApplication
@EnableAsync
@Controller
public class BffServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BffServiceApplication.class, args);
	}

	@GetMapping("/")
	public String index() {
		return "forward:/index.html";
	}

	@Bean
	public ObjectMapper objectMapper() {
		return new ObjectMapper();
	}

}
