package com.domain.demo_backend.util;

import com.domain.demo_backend.domain.Location.dto.LocationRequest;
import com.domain.demo_backend.domain.Location.service.LocationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
@SpringBootTest
public class LocationServiceRedisTest {
    @Autowired
private LocationService locationService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @AfterEach
    void tearDown() {
        // 테스트 완료 후 레디스 데이터 초기화
        redisTemplate.delete("worker:locations");
        redisTemplate.delete("worker:info:12345");
    }

    @Test
    @DisplayName("아주머니의 위치와 상태가 레디스에 정확히 저장되어야 한다")
    void updateWorkerLocationTest() {
        // 1. 테스트 데이터 준비
        LocationRequest request = new LocationRequest();
        request.setUserSqno("12345");
        request.setLat(37.5665);
        request.setLng(126.9780);
        request.setStatus("NORMAL");

        // 2. 서비스 로직 실행
        locationService.updateWorkerLocation(request);

        // 3. GEO 데이터 검증
        List<Point> points = redisTemplate.opsForGeo().position("worker:locations", "12345");
        assertThat(points).isNotEmpty();
        assertThat(points.get(0).getY()).isEqualTo(37.5665);
        assertThat(points.get(0).getX()).isEqualTo(126.9780);

        // 4. Hash 데이터 검증
        Map<Object, Object> info = redisTemplate.opsForHash().entries("worker:info:12345");
        assertThat(info.get("status")).isEqualTo("NORMAL");
    }
}
