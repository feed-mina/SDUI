-- V26: AI 채팅 화면 메타데이터 + query_master 시드
-- 2026-03-13
-- 추가 화면: AI_ENGLISH_CHAT_PAGE, AI_KOREAN_CHAT_PAGE
-- AIChatComponent는 query_master 설정값(data prop)을 DATA_SOURCE 패턴으로 수신
-- ─────────────────────────────────────────────────────────
-- query_master: AI 영어 대화 설정값
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
SELECT 'AI_ENGLISH_CHAT_CONFIG',
  'SELECT
          ''🎤 녹음 시작''                                                            AS mic_btn_label,
          ''답변완료''                                                                 AS submit_btn_label,
          ''대화 종료''                                                                AS end_btn_label,
          ''Hello! I''''m your English conversation partner. What would you like to practice today?'' AS welcome_message,
          ''en''                                                                       AS language,
          ''PREMIUM''                                                                  AS required_tier,
          ''음성 대화 기능은 프리미엄 멤버십이 필요합니다.''                            AS upgrade_message',
  'SINGLE',
  'AI 영어 대화 화면 설정값',
  'Y',
  3600,
  'ROLE_USER'
WHERE NOT EXISTS (
    SELECT 1
    FROM query_master
    WHERE sql_key = 'AI_ENGLISH_CHAT_CONFIG'
  );
-- ─────────────────────────────────────────────────────────
-- query_master: AI 한국어 대화 설정값
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
SELECT 'AI_KOREAN_CHAT_CONFIG',
  'SELECT
          ''🎤 녹음 시작''                                                            AS mic_btn_label,
          ''답변완료''                                                                 AS submit_btn_label,
          ''대화 종료''                                                                AS end_btn_label,
          ''안녕하세요! 한국어 대화 연습을 도와드리겠습니다. 무엇을 연습하고 싶으신가요?'' AS welcome_message,
          ''ko''                                                                       AS language,
          ''PREMIUM''                                                                  AS required_tier,
          ''음성 대화 기능은 프리미엄 멤버십이 필요합니다.''                            AS upgrade_message',
  'SINGLE',
  'AI 한국어 대화 화면 설정값',
  'Y',
  3600,
  'ROLE_USER'
WHERE NOT EXISTS (
    SELECT 1
    FROM query_master
    WHERE sql_key = 'AI_KOREAN_CHAT_CONFIG'
  );
-- ─────────────────────────────────────────────────────────
-- ui_metadata: AI_ENGLISH_CHAT_PAGE
-- 구조: DATA_SOURCE(설정 자동로딩) + AI_CHAT(컴포넌트)
-- ─────────────────────────────────────────────────────────
-- 루트 GROUP 컨테이너
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
    'AI_ENGLISH_CHAT_PAGE',
    'ai_en_root',
    'GROUP',
    NULL,
    '',
    'ai-page-root',
    'COLUMN',
    'ROLE_USER',
    1
  );
-- DATA_SOURCE: query_master 자동 호출 → pageData['ai_en_config'] 에 설정값 저장
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
    'AI_ENGLISH_CHAT_PAGE',
    'ai_en_config',
    'DATA_SOURCE',
    'ai_en_root',
    '',
    'AUTO_FETCH',
    'AI_ENGLISH_CHAT_CONFIG',
    'ROLE_USER',
    2
  );
-- AI_CHAT 컴포넌트 (ref_data_id → pageData['ai_en_config'] 수신)
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
    'AI_ENGLISH_CHAT_PAGE',
    'ai_en_chat',
    'AI_CHAT',
    'ai_en_root',
    'AI 영어 대화',
    'AI_CHAT_EN',
    'ai_en_config',
    'ai-chat-en',
    'ROLE_USER',
    3
  );
-- ─────────────────────────────────────────────────────────
-- ui_metadata: AI_KOREAN_CHAT_PAGE
-- ─────────────────────────────────────────────────────────
-- 루트 GROUP 컨테이너
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
    'AI_KOREAN_CHAT_PAGE',
    'ai_ko_root',
    'GROUP',
    NULL,
    '',
    'ai-page-root',
    'COLUMN',
    'ROLE_USER',
    1
  );
-- DATA_SOURCE: query_master 자동 호출 → pageData['ai_ko_config'] 에 설정값 저장
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
    'AI_KOREAN_CHAT_PAGE',
    'ai_ko_config',
    'DATA_SOURCE',
    'ai_ko_root',
    '',
    'AUTO_FETCH',
    'AI_KOREAN_CHAT_CONFIG',
    'ROLE_USER',
    2
  );
-- AI_CHAT 컴포넌트 (ref_data_id → pageData['ai_ko_config'] 수신)
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
    'AI_KOREAN_CHAT_PAGE',
    'ai_ko_chat',
    'AI_CHAT',
    'ai_ko_root',
    'AI 한국어 대화',
    'AI_CHAT_KO',
    'ai_ko_config',
    'ai-chat-ko',
    'ROLE_USER',
    3
  );
DO $$ BEGIN RAISE NOTICE 'V26 완료 - AI_ENGLISH_CHAT_PAGE, AI_KOREAN_CHAT_PAGE 등록';
END $$;