-- V27: AI 채팅 컴포넌트 is_readonly 기본값 수정 + 마이크 버튼 활성화
-- is_readonly 컬럼 기본값이 TRUE여서 AudioRecorder의 마이크 버튼이 비활성화되는 문제 수정

UPDATE ui_metadata
SET is_readonly = false
WHERE component_id IN ('ai_en_chat', 'ai_ko_chat');

DO $$ BEGIN RAISE NOTICE 'V27 완료 - AI 채팅 컴포넌트 is_readonly = false 수정'; END $$;
