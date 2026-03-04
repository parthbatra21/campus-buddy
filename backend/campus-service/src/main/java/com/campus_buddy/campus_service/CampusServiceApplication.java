package com.campus_buddy.campus_service;

import com.campus_buddy.campus_service.model.Facility;
import com.campus_buddy.campus_service.repository.FacilityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CampusServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CampusServiceApplication.class, args);
	}

    @Bean
    public CommandLineRunner loadFacilityData(FacilityRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Facility auditorium = new Facility();
                auditorium.setName("Main Auditorium");
                auditorium.setDescription("Large hall suitable for major events, guest lectures, and cultural fests.");
                auditorium.setCapacity(500);
                repository.save(auditorium);

                Facility seminarHall = new Facility();
                seminarHall.setName("CS Seminar Hall");
                seminarHall.setDescription("Equipped with projector and smart board. Ideal for department meetings and workshops.");
                seminarHall.setCapacity(100);
                repository.save(seminarHall);

                Facility tennisCourt = new Facility();
                tennisCourt.setName("Outdoor Tennis Court");
                tennisCourt.setDescription("Synthetic hard court. Must bring own rackets and balls.");
                tennisCourt.setCapacity(4);
                repository.save(tennisCourt);
                
                Facility ground = new Facility();
                ground.setName("Main Sports Ground");
                ground.setDescription("Large open ground for cricket, football, or athletics.");
                ground.setCapacity(200);
                repository.save(ground);

                System.out.println("Facility database seeded!");
            }
        };
    }
}
