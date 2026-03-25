-- V38: GET_CONTENT_DETAIL, UPDATE_CONTENT_DETAIL 쿼리에 is_private 필드 추가
-- 원인: V23에서 정의된 GET_CONTENT_DETAIL SELECT에 is_private가 빠져 있어
--       CONTENT_DETAIL / CONTENT_MODIFY 화면의 "나만 보기" 체크박스가 항상 unchecked 상태였음

-- 1. GET_CONTENT_DETAIL: is_private 컬럼 SELECT에 추가
UPDATE query_master
SET query_text =
  'SELECT d.content_id, d.user_id, d.title, d.content, d.date, d.emotion,
          d.day_tag1, d.day_tag2, d.day_tag3, d.content_status, d.role_nm,
          d.selected_times, d.daily_slots, d.reg_dt, d.is_private
     FROM content d
    WHERE d.content_id = CAST(:contentId AS BIGINT)
      AND d.del_yn = ''N'''
WHERE sql_key = 'GET_CONTENT_DETAIL';

-- 2. UPDATE_CONTENT_DETAIL: is_private 저장 포함
UPDATE query_master
SET query_text =
  'UPDATE content
      SET title           = :title,
          content         = :content,
          emotion         = CAST(:emotion AS INTEGER),
          selected_times  = CAST(:selected_times AS jsonb),
          daily_slots     = CAST(:daily_slots AS jsonb),
          day_tag1        = :day_tag1,
          day_tag2        = :day_tag2,
          day_tag3        = :day_tag3,
          is_private      = CAST(:is_private AS BOOLEAN)
    WHERE content_id      = CAST(:content_id AS BIGINT)
      AND user_sqno       = :userSqno'
WHERE sql_key = 'UPDATE_CONTENT_DETAIL';
