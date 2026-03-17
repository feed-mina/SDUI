-- V37: AI_INTERVIEW_CONFIG 한국어 전환
-- AI 면접은 한국어 전용 (memo 기준)
-- 2026-03-16

UPDATE query_master
SET query_text = 'SELECT
  ''🎤 답변 녹음''                                                              AS mic_btn_label,
  ''답변 제출''                                                                  AS submit_btn_label,
  ''면접 종료''                                                                  AS end_btn_label,
  ''안녕하세요! AI 면접관입니다. 이력서를 입력하고 면접을 시작해주세요.''            AS welcome_message,
  ''이력서 내용을 여기에 붙여넣으세요...'' || chr(10) || chr(10) || ''예) 이름, 경력, 프로젝트, 기술 스택 등'' AS resume_placeholder,
  ''면접 시작하기''                                                               AS start_btn_label,
  ''ko''                                                                        AS language,
  ''PREMIUM''                                                                   AS required_tier,
  ''면접 기능은 프리미엄 멤버십이 필요합니다.''                                    AS upgrade_message'
WHERE sql_key = 'AI_INTERVIEW_CONFIG';

DO $$ BEGIN RAISE NOTICE 'V37 완료 - AI_INTERVIEW_CONFIG 한국어 전환'; END $$;
