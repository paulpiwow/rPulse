package com.rpulse.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=none",
        // This context boots with no schema (Flyway off), so keep the ~10s background alarm
        // evaluation from firing during startup and logging a spurious "table not found".
        "rpulse.alarm.evaluate-interval-ms=3600000"
})
class RpulseBackendApplicationTests {

    @Test
    void contextLoads() {
    }
}
