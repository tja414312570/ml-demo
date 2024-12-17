package com.example.java;

import ai.djl.ndarray.NDManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TestConfiguration {

    @Bean
    public NDManager ndManager(){
        return  NDManager.newBaseManager();
    }
}
