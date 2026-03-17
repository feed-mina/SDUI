-- V38: AI_INTERVIEW_PAGE label_text 한국어 전환
-- 'AI Interview Specialist' → 'AI 면접관'
-- 2026-03-16

UPDATE ui_metadata
SET label_text = 'AI 면접관'
WHERE component_id = 'ai_interview_field'
  AND screen_id = 'AI_INTERVIEW_PAGE';

DO $$ BEGIN RAISE NOTICE 'V38 완료 - AI_INTERVIEW_PAGE label_text 한국어 전환'; END $$;
