-- V32: AI_ENGLISH_CHAT_PAGE 정식 버전 업그레이드 (V2 고도화 버전 적용)
-- 기존 V1 메타데이터 삭제 및 V2(AI_ENGLISH_CHAT_PAGE2) 메타데이터를 AI_ENGLISH_CHAT_PAGE로 전환
-- 2026-03-15

-- 1. 기존 AI_ENGLISH_CHAT_PAGE 메타데이터 삭제 (V1)
DELETE FROM ui_metadata WHERE screen_id = 'AI_ENGLISH_CHAT_PAGE';

-- 2. AI_ENGLISH_CHAT_PAGE2 메타데이터의 screen_id를 AI_ENGLISH_CHAT_PAGE로 변경
UPDATE ui_metadata 
SET screen_id = 'AI_ENGLISH_CHAT_PAGE' 
WHERE screen_id = 'AI_ENGLISH_CHAT_PAGE2';

-- 3. 마이크 버튼 활성화 재확인 (V31 소급 적용)
UPDATE ui_metadata
SET is_readonly = false
WHERE screen_id = 'AI_ENGLISH_CHAT_PAGE' AND component_type = 'AI_CHAT_V2';

DO $$ BEGIN RAISE NOTICE 'V32 완료 - V2 고도화 버전을 AI_ENGLISH_CHAT_PAGE로 정식 승격'; END $$;
