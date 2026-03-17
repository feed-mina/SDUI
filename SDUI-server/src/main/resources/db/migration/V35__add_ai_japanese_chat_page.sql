-- V34: AI_JAPANESE_CHAT_PAGE 등록
-- AI 일본어 회화 전용 화면
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
SELECT 'AI_JAPANESE_CHAT_CONFIG',
  'SELECT
          ''🎤 録음 시작''                                                            AS mic_btn_label,
          ''Submit''                                                                   AS submit_btn_label,
          ''대화 종료''                                                                AS end_btn_label,
          ''こんにちは！日本語の練習をお手伝いします。今日はどんなことを話したいですか？'' AS welcome_message,
          ''ja''                                                                       AS language,
          ''PREMIUM''                                                                  AS required_tier,
          ''음성 대화 기능은 프리미엄 멤버십이 필요합니다.''                            AS upgrade_message',
  'SINGLE',
  'AI 일본어 대화 화면 설정값',
  'Y',
  3600,
  'ROLE_USER'
WHERE NOT EXISTS (
    SELECT 1
    FROM query_master
    WHERE sql_key = 'AI_JAPANESE_CHAT_CONFIG'
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
    'AI_JAPANESE_CHAT_PAGE',
    'ai_ja_root',
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
    'AI_JAPANESE_CHAT_PAGE',
    'ai_ja_config',
    'DATA_SOURCE',
    'ai_ja_root',
    '',
    'AUTO_FETCH',
    'AI_JAPANESE_CHAT_CONFIG',
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
    system_prompt_template,
    allowed_roles,
    sort_order
  )
VALUES (
    'AI_JAPANESE_CHAT_PAGE',
    'ai_ja_chat',
    'AI_CHAT_V2',
    'ai_ja_root',
    'AI Japanese Tutor',
    'AI_CHAT_JA',
    'ai_ja_config',
    'ai-japanese-theme',
    'You are a friendly and professional Japanese tutor. help the user improve their Japanese through natural conversation.
IMPORTANT: You MUST respond ONLY in valid JSON format: { "en": "Japanese response (written in kanji/kana)", "ko": "한국어 번역" }. 
Do not include any other text outside the JSON.',
    'ROLE_USER',
    3
  );

DO $$ BEGIN RAISE NOTICE 'V34 완료 - AI_JAPANESE_CHAT_PAGE 등록'; END $$;
