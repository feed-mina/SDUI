package com.domain.demo_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"spring.sql.init.mode=never"})
class DemoBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
