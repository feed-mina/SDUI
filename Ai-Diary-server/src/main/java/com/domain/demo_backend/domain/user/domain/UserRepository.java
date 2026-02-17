package com.domain.demo_backend.domain.user.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 여기서 JPA가 쿼리를 만든다 !
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByuserId(String userId);

    Optional<User> findByUserSqno(Long userSqno);

    // 2026.01.11 update 관련ㄹ 메서드들은 더티 체킹을 사용한다.
    // 2026.01.11 insert 대신 기본 제공되는 save()를 사용하면 된다.

    // 2026.01.11 탈퇴유저 확인
    Optional<User> findByEmailAndDelYn(String email, String delYn);

}
