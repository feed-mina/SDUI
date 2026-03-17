-- V36: AI 일본어 회화 페이지 읽기 전용 해제 (활성화)
-- 2026-03-16

UPDATE ui_metadata 
SET is_readonly = false 
WHERE screen_id = 'AI_JAPANESE_CHAT_PAGE' 
  AND component_id = 'ai_ja_chat';

DO $$ BEGIN RAISE NOTICE 'V36 완료 - AI_JAPANESE_CHAT_PAGE 활성화'; END $$;
