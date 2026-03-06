-- V1: Baseline Schema (main 브랜치 기반 - diary 테이블)
-- 이 마이그레이션은 baseline-on-migrate=true로 인해 실제로 실행되지 않습니다.
-- 기존 DB의 초기 상태를 기록하기 위한 문서 목적입니다.

-- 기존 스키마:
-- - diary 테이블 (diary_id, content, date, user_sqno 등)
-- - users 테이블 (user_sqno, email, password, role 등)
-- - ui_metadata 테이블 (DIARY_LIST, DIARY_WRITE, DIARY_DETAIL 스크린)
-- - query_master 테이블 (GET_DIARY_LIST, GET_DIARY_BY_ID 쿼리)
-- - refresh_token 테이블 (user_sqno, refresh_token, expiration)
-- - goal_settings 테이블 (id, user_sqno, target_time, status 등)

-- Baseline 버전: 0
-- 다음 마이그레이션부터 실제 변경사항이 적용됩니다.
