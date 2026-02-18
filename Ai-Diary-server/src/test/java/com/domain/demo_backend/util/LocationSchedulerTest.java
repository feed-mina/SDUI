package com.domain.demo_backend.util;

import com.domain.demo_backend.global.common.util.LocationScheduler;
import jakarta.inject.Qualifier;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationSchedulerTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private GeoOperations<String, Object> geoOperations;

    @Mock
    private ZSetOperations<String, Object> zSetOperations;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private LocationScheduler locationScheduler;

    @Test
    @DisplayName("스케줄러 실행 시 Redis 위치 정보가 DB로 Bulk Insert 되는지 확인")
    void testTransferLocationLogsToDb(@Qualifier("redisObjectTemplate") RedisTemplate<String, Object> redisTemplate) {

        this.redisTemplate = redisTemplate;
        // Given
        String userSqno = "12345";
        Set<Object> members = Set.of(userSqno);
        Point point = new Point(127.0, 37.0);

        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(zSetOperations.range(anyString(), anyLong(), anyLong())).thenReturn(members);

        when(redisTemplate.opsForGeo()).thenReturn(geoOperations);
        when(geoOperations.position(anyString(), any())).thenReturn(List.of(point));

        // When
        locationScheduler.transferLocationLogsToDb();

        // Then
        // batchUpdate가 호출되었는지 검증
        verify(jdbcTemplate, times(1)).batchUpdate(anyString(), anyList());
    }
}