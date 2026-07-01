package com.rpulse.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling turns on Spring's built-in timer so that, later, the alarm
// engine can run itself on a schedule (checking readings every so often) rather
// than only when someone opens a screen.
@SpringBootApplication
@EnableScheduling
public class RpulseBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(RpulseBackendApplication.class, args);
    }
}
