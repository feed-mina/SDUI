package com.domain.demo_backend.domain.membership.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    boolean existsByName(String name);
}
