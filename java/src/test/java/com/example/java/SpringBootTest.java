package com.example.java;

import com.example.java.cnn.MnistLoader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringBootTest implements CommandLineRunner {
    @Autowired
    private MnistLoader mnistLoader;
    public static void main(String[] args) {
        SpringApplication.run(SpringBootTest.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        JavaApplicationTests javaApplicationTests = new JavaApplicationTests();
        javaApplicationTests.setMnistLoader(mnistLoader);
        javaApplicationTests.mnist2();
    }

}
