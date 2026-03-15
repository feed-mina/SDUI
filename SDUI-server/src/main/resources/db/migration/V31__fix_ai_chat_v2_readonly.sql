-- V31: AI_ENGLISH_CHAT_PAGE2 V2 마이크 버튼 활성화
-- V30에서 is_readonly 기본값(TRUE)이 그대로 적용되어 마이크 버튼이 비활성화됨
-- V27과 동일한 방식으로 수정
-- 2026-03-14

UPDATE ui_metadata
SET is_readonly = false
WHERE component_id = 'ai_en2_chat';

DO $$ BEGIN RAISE NOTICE 'V31 완료 - ai_en2_chat is_readonly = false 수정 (마이크 버튼 활성화)'; END $$;
