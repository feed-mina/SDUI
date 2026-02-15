package com.domain.demo_backend;

import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.domain.user.domain.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("유저 저장 및 조회 테스트")
    void saveAndFindTest() {
        // 1. Given : 저장할 데이터 준비
        User user = User.builder()
                .userId("testUser")
                .email("test@example.com")
                .password("5678")
                .build();

        // 2. When : 실제 DB에 저장
        User savedUser = userRepository.save(user);

        // 3. Then : 잘 저장되었는지 검증
        Optional<User> foundUser = userRepository.findByEmail("test@example.com");

        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUserId()).isEqualTo("testUser");
        System.out.println("@@@@@ 저장된 사용자 번호: " + savedUser.getUserSqno());

    }
}
