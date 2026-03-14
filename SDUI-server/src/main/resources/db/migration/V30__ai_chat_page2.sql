-- V30: AI_ENGLISH_CHAT_PAGE2 — V2 테스트용 화면
-- 기존 AI_ENGLISH_CHAT_PAGE는 그대로 유지
-- 이 화면은 AIChatComponentV2 (AI_CHAT_V2) + /api/ai/v2/chat/stream 사용
-- 2026-03-14

-- is_readonly 기본값이 TRUE이므로 명시적으로 false 설정 (V27과 동일한 수정)
-- 이것이 없으면 마이크 버튼이 비활성화됨

-- ─────────────────────────────────────────────────────────
-- query_master: AI 영어 대화 V2 설정값 (기존 설정 재사용도 가능하나 독립 키로 생성)
-- ─────────────────────────────────────────────────────────
INSERT INTO query_master (
    sql_key,
    query_text,
    return_type,
    description,
    use_redis_yn,
    redis_ttl_sec,
    required_role
  )
SELECT 'AI_ENGLISH_CHAT_CONFIG_V2',
  'SELECT
          ''🎤 Start Recording''                                                       AS mic_btn_label,
          ''Submit''                                                                   AS submit_btn_label,
          ''End Chat''                                                                 AS end_btn_label,
          ''Hello! I''''m your English conversation partner (V2 Test). What would you like to practice today?'' AS welcome_message,
          ''en''                                                                       AS language,
          ''PREMIUM''                                                                  AS required_tier,
          ''Voice conversation requires a PREMIUM membership.''                        AS upgrade_message',
  'SINGLE',
  'AI 영어 대화 V2 테스트용 화면 설정값',
  'Y',
  3600,
  'ROLE_USER'
WHERE NOT EXISTS (
    SELECT 1
    FROM query_master
    WHERE sql_key = 'AI_ENGLISH_CHAT_CONFIG_V2'
  );

-- ─────────────────────────────────────────────────────────
-- ui_metadata: AI_ENGLISH_CHAT_PAGE2
-- ─────────────────────────────────────────────────────────
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
    'AI_ENGLISH_CHAT_PAGE2',
    'ai_en2_root',
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
    'AI_ENGLISH_CHAT_PAGE2',
    'ai_en2_config',
    'DATA_SOURCE',
    'ai_en2_root',
    '',
    'AUTO_FETCH',
    'AI_ENGLISH_CHAT_CONFIG_V2',
    'ROLE_USER',
    2
  );

-- AI_CHAT_V2 컴포넌트 등록
INSERT INTO ui_metadata (
    screen_id,
    component_id,
    component_type,
    parent_group_id,
    label_text,
    action_type,
    ref_data_id,
    css_class,
    allowed_roles,
    sort_order
  )
VALUES (
    'AI_ENGLISH_CHAT_PAGE2',
    'ai_en2_chat',
    'AI_CHAT_V2',
    'ai_en2_root',
    'AI 영어 대화 V2',
    'AI_CHAT_EN',
    'ai_en2_config',
    'ai-chat-en',
    'ROLE_USER',
    3
  );

DO $$ BEGIN RAISE NOTICE 'V30 완료 - AI_ENGLISH_CHAT_PAGE2 (V2 테스트) 등록'; END $$;
