-- V34: ui_metadata 테이블에 system_prompt_template 컬럼 추가
-- AI 페르소나별 시스템 프롬프트 주입을 위함
-- 2026-03-16

ALTER TABLE ui_metadata ADD COLUMN IF NOT EXISTS system_prompt_template TEXT;

COMMENT ON COLUMN ui_metadata.system_prompt_template IS 'AI 채팅/면접 컴포넌트용 시스템 프롬프트 템플릿';

DO $$ BEGIN RAISE NOTICE 'V34 완료 - system_prompt_template 컬럼 추가'; END $$;
