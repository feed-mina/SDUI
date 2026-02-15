package com.domain.demo_backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 작성날짜: 2026.01.11
 * RedisConfig 설정 이후 레디스 테스트 실행
 */

@SpringBootTest
public class RedisTest {
    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Test
    void redisConnectionTest() {
        // 1. 저장할 데이터 정의
        String key = "test:connection";
        String value = "Good!";

        // 2. 실행: 레디스에 저장했다가 다시 조회하기
        // opsForValue() 는 단순한 문자열 (String) 작업을 의미
        redisTemplate.opsForValue().set(key, value);
        String result = redisTemplate.opsForValue().get(key);

        // 3. 검증: 내가 넣은 값과 꺼낸 값이 같은지 확인
        assertThat(result).isEqualTo(value);

        // 4. 테스트 종료 : 레디스 데이터 지우기
        redisTemplate.delete(key);
    }

}
