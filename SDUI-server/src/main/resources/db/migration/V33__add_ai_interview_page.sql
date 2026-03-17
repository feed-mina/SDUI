-- V33: AI_INTERVIEW_PAGE 등록
-- AI 면접 인터뷰 버전 전용 화면
-- 2026-03-15

-- ───────────────
-- query_master
-- ───────────────
INSERT INTO query_master (
    sql_key,
    query_text,
    return_type,
    description,
    use_redis_yn,
    redis_ttl_sec,
    required_role
  )
SELECT 'AI_INTERVIEW_CONFIG',
  'SELECT
          ''👔 Start Assessment''                                                       AS mic_btn_label,
          ''Submit Response''                                                           AS submit_btn_label,
          ''End Interview''                                                            AS end_btn_label,
          ''Welcome to your professional AI Interview session. Please click the button below to start your assessment.'' AS welcome_message,
          ''en''                                                                       AS language,
          ''PREMIUM''                                                                  AS required_tier,
          ''Interview assessment requires a PREMIUM membership.''                        AS upgrade_message',
  'SINGLE',
  'AI 면접 인터뷰 설정값',
  'Y',
  3600,
  'ROLE_USER'
WHERE NOT EXISTS (
    SELECT 1
    FROM query_master
    WHERE sql_key = 'AI_INTERVIEW_CONFIG'
  );

-- ───────────────
-- ui_metadata
-- ───────────────
INSERT INTO ui_metadata (
    screen_id,
    component_id,
    component_type,
    parent_group_id,
    label_text,
    css_class,
    group_direction,
    allowed_roles,
    sort_order
  )
VALUES (
    'AI_INTERVIEW_PAGE',
    'ai_interview_root',
    'GROUP',
    NULL,
    '',
    'ai-page-root',
    'COLUMN',
    'ROLE_USER',
    1
  );

INSERT INTO ui_metadata (
    screen_id,
    component_id,
    component_type,
    parent_group_id,
    label_text,
    action_type,
    data_sql_key,
    allowed_roles,
    sort_order
  )
VALUES (
    'AI_INTERVIEW_PAGE',
    'ai_interview_config',
    'DATA_SOURCE',
    'ai_interview_root',
    '',
    'AUTO_FETCH',
    'AI_INTERVIEW_CONFIG',
    'ROLE_USER',
    2
  );

INSERT INTO ui_metadata (
    screen_id,
    component_id,
    component_type,
    parent_group_id,
    label_text,
    action_type,
    ref_data_id,
    css_class,
    is_readonly,
    allowed_roles,
    sort_order
  )
VALUES (
    'AI_INTERVIEW_PAGE',
    'ai_interview_field',
    'AI_INTERVIEW',
    'ai_interview_root',
    'AI Interview Specialist',
    'AI_INTERVIEW_EN',
    'ai_interview_config',
    'ai-interview-en',
    false,
    'ROLE_USER',
    3
  );

DO $$ BEGIN RAISE NOTICE 'V33 완료 - AI_INTERVIEW_PAGE 등록'; END $$;
