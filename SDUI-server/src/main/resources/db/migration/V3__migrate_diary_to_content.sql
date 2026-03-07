-- V3: diary → content 데이터 마이그레이션
-- diary 테이블의 모든 데이터를 content 테이블로 복사합니다.

-- diary_backup에 전체 데이터 백업
INSERT INTO diary_backup
SELECT * FROM diary
WHERE EXISTS (SELECT 1 FROM diary LIMIT 1);

-- diary → content 데이터 복사
INSERT INTO content (
    content_id, content, date, del_dt, del_yn,
    content_status, content_type, email, emotion,
    frst_reg_ip, last_updt_dt, last_updt_ip,
    reg_dt, role_nm, selected_times, title,
    updt_dt, user_id, user_sqno, daily_slots,
    day_tag1, day_tag2, day_tag3, frst_dt,
    frst_rgst_usps_sqno, last_updt_usps_sqno, role_cd
)
SELECT
    diary_id, content, date, del_dt, del_yn,
    diary_status, diary_type, email, emotion,
    frst_reg_ip, last_updt_dt, last_updt_ip,
    reg_dt, role_nm, selected_times, title,
    updt_dt, user_id, user_sqno, daily_slots,
    day_tag1, day_tag2, day_tag3, frst_dt,
    frst_rgst_usps_sqno, last_updt_usps_sqno, role_cd
FROM diary
WHERE NOT EXISTS (
    SELECT 1 FROM content WHERE content_id = diary.diary_id
) AND EXISTS (SELECT 1 FROM diary LIMIT 1);

-- 시퀀스 동기화 (content 테이블의 최대값 + 1로 설정)
SELECT setval('content_content_id_seq', (SELECT COALESCE(MAX(content_id), 0) + 1 FROM content), false);

-- 검증: 데이터 개수 확인
DO $$
DECLARE
    diary_count INTEGER;
    content_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO diary_count FROM diary;
    SELECT COUNT(*) INTO content_count FROM content;
    SELECT COUNT(*) INTO backup_count FROM diary_backup;

    RAISE NOTICE 'Migration V3 완료 - diary: %, content: %, backup: %', diary_count, content_count, backup_count;

    IF diary_count > 0 AND content_count = 0 THEN
        RAISE EXCEPTION '데이터 마이그레이션 실패: diary에 데이터가 있지만 content에 복사되지 않았습니다.';
    END IF;
END $$;
