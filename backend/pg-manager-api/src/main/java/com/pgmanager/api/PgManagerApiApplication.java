package com.pgmanager.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PgManagerApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PgManagerApiApplication.class, args);
    }

}
