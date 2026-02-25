--
-- PostgreSQL database dump
--

\restrict WR8vlbuscsJlN3DakPAdJHxZLD1dOmIfTxNb06EhfIOuNgKVYl0J567k1Yu6LgY

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: query_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.query_master (
    sql_key character varying(100) NOT NULL,
    query_text text NOT NULL,
    return_type character varying(20),
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    required_params character varying(255),
    param_mapping jsonb,
    use_redis_yn character(1) DEFAULT 'N'::bpchar,
    redis_ttl_sec integer DEFAULT 3600
);


ALTER TABLE public.query_master OWNER TO postgres;

--
-- Name: ui_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ui_metadata (
    ui_id bigint NOT NULL,
    screen_id character varying(50) NOT NULL,
    component_id character varying(50) NOT NULL,
    label_text character varying(100) NOT NULL,
    component_type character varying(20) NOT NULL,
    sort_order integer NOT NULL,
    is_required boolean DEFAULT false,
    is_readonly boolean DEFAULT true,
    default_value text,
    placeholder text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    css_class character varying(100),
    inline_style text,
    action_type character varying(50),
    action_url character varying(255),
    data_sql_key character varying(100),
    data_api_url character varying(255),
    data_params character varying(50),
    ref_data_id character varying(100),
    group_id character varying(50) DEFAULT NULL::character varying,
    group_direction character varying(10) DEFAULT 'COLUMN'::character varying,
    submit_group_id character varying(50) DEFAULT NULL::character varying,
    submit_group_order integer,
    submit_group_separator character varying(5) DEFAULT NULL::character varying,
    parent_group_id character varying(50) DEFAULT NULL::character varying,
    is_visible character varying(50) DEFAULT true,
    component_props jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.ui_metadata OWNER TO postgres;

--
-- Name: TABLE ui_metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ui_metadata IS '화면 항목 구성을 위한 메타데이터 테이블';


--
-- Name: COLUMN ui_metadata.ui_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.ui_id IS '화면 식별 코드';


--
-- Name: COLUMN ui_metadata.screen_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.screen_id IS '화면 구분 코드 (예: DIARY_WRITE)';


--
-- Name: COLUMN ui_metadata.component_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.component_id IS 'DB에 저장될 필드명 (예: title)';


--
-- Name: COLUMN ui_metadata.label_text; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.label_text IS '사용자에게 보여줄 이름 (예: 제목)';


--
-- Name: COLUMN ui_metadata.component_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.component_type IS '입력 도구 종류 (TEXT, TEXTAREA, SELECT, DATE)';


--
-- Name: COLUMN ui_metadata.sort_order; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.sort_order IS '화면 표시 순서';


--
-- Name: COLUMN ui_metadata.is_required; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.is_required IS '필수 입력 여부';


--
-- Name: COLUMN ui_metadata.is_readonly; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ui_metadata.is_readonly IS '입력 가능 여부(상세 화면은 Y, 작성화면은 N)';


--
-- Name: ui_metadata_ui_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ui_metadata_ui_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ui_metadata_ui_id_seq OWNER TO postgres;

--
-- Name: ui_metadata_ui_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ui_metadata_ui_id_seq OWNED BY public.ui_metadata.ui_id;


--
-- Name: ui_metadata ui_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ui_metadata ALTER COLUMN ui_id SET DEFAULT nextval('public.ui_metadata_ui_id_seq'::regclass);


--
-- Data for Name: query_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.query_master (sql_key, query_text, return_type, description, created_at, updated_at, required_params, param_mapping, use_redis_yn, redis_ttl_sec) FROM stdin;
FIND_WITHDRAW_USER	SELECT user_sqno AS "userSqno", user_id AS "userId", email FROM users\r\n      WHERE email = :email AND del_yn = 'Y' AND withdraw_at > NOW() - INTERVAL '7 days'	SINGLE	7일 이내 탈퇴한 회원 조회	2026-01-14 23:11:41.459645	2026-01-14 23:11:41.459645	\N	\N	N	3600
INSERT_DIARY	INSERT INTO diary (\n    user_sqno, user_id, title, content, emotion, \n    selected_times, daily_slots, day_tag1, day_tag2, day_tag3, \n    reg_dt\n) VALUES (\n    :userSqno, :userId, :title, :content, CAST(:emotion AS INTEGER), \n    CAST(:selected_times AS jsonb), CAST(:daily_slots AS jsonb), :day_tag1, :day_tag2, :day_tag3, \n    NOW()\n)	COMMAND	신규 일기 작성 (JSONB 타입 및 day_tag 반영)	2026-01-14 23:11:41.459645	2026-02-24 12:03:18.343963	title,content	\N	N	3600
GET_USER_GOAL_TIME	SELECT target_time AS "targetTime"\r\n                  FROM goal_settings\r\n                  WHERE user_sqno = :userSqno\r\n                    AND status IS NULL\r\n                    AND target_time >= CURRENT_DATE  -- ★ 수정됨: 오늘 0시 이후 데이터는 다 가져옴\r\n                  ORDER BY target_time ASC\r\n                  LIMIT 1	SINGLE	메인 화면용: 가장 가까운 미래 목표 1건 조회	2026-01-26 06:54:52.464448	2026-01-31 07:42:39.286013	\N	\N	Y	3600
UPDATE_DIARY_DELETE	UPDATE diary\r\n      SET del_yn = 'Y',\r\n          del_dt = NOW(),\r\n          last_updt_ip = :lastUpdtIp,\r\n          last_updt_usps_sqno = :lastUpdtUspsSqno\r\n      WHERE diary_id = ANY(:diaryIdList)\r\n      AND (:userSqno IS NULL OR user_sqno = :userSqno)	COMMAND	선택한 일기 일괄 삭제 처리 (본인 확인 포함)	2026-01-14 23:10:06.713005	2026-01-14 23:10:06.713005	diaryIdList	\N	N	3600
GET_USER_GOAL_LIST	SELECT target_time AS "targetTime"\r\n                  FROM goal_settings\r\n                  WHERE user_sqno = :userSqno\r\n                    AND status IS NULL\r\n                    AND target_time >= CURRENT_DATE  -- ★ 수정됨\r\n                  ORDER BY target_time ASC\r\n                  LIMIT 3 OFFSET 1	MULTI	팝업 리스트용: 메인 목표 이후의 다음 3건 조회	2026-01-31 07:42:53.704614	2026-01-31 07:42:53.704614	\N	\N	Y	3600
UPDATE_GOAL_RESULT	UPDATE goal_settings\r\n                  SET status = :status, recorded_time = :recordedTime\r\n                  WHERE id = (\r\n                      SELECT id\r\n                      FROM goal_settings\r\n                      WHERE user_sqno = :userSqno\r\n                        AND status IS NULL\r\n                        AND target_time >= CURRENT_DATE -- ★ 수정됨\r\n                      ORDER BY target_time ASC\r\n                      LIMIT 1\r\n                  )	COMMAND	가장 가까운 미완료 목표의 도착 결과(성공/실패) 업데이트	2026-01-31 11:25:20.344869	2026-01-31 11:25:20.344869	\N	\N	N	0
INSERT_USER	INSERT INTO users (user_id, password, hashed_password, email, phone, nickname, role, username, created_at, updated_at, social_type)\r\n      VALUES (:userId, :password, :hashedPassword, :email, :phone, COALESCE(:nickname, :userId), :role, :username, NOW(), NOW(), :socialType)	COMMAND	신규 회원 가입 (닉네임 없을 시 아이디로 대체)	2026-01-14 23:10:06.713005	2026-01-14 23:10:06.713005	userId,password,email	{"email": "body.email", "userId": "body.userId", "password": "body.password"}	N	3600
COUNT_DIARY_LIST	SELECT COUNT(*) AS total_count FROM diary d WHERE d.del_yn = 'N' AND (:userId IS NULL OR :userId = '' OR d.user_id = :userId)	SINGLE	전체 일기 개수 조회	2026-01-14 23:11:41.459645	2026-01-14 23:11:41.459645	\N	\N	N	3600
GET_MEMBER_DIARY_LIST	SELECT diary_id AS "diary_id", title AS "title", content AS "content", reg_dt AS "reg_dt", img_url AS "img_url", user_id AS "user_id" FROM diary WHERE user_sqno = :userSqno AND del_yn = 'N' ORDER BY reg_dt DESC LIMIT :pageSize OFFSET :offset	MULTI	로그인한 사용자의 일기 목록 조회	2026-01-14 12:34:04.730293	2026-01-19 23:58:14.413347	\N	{"offset": "params.offset", "pageSize": "params.pageSize", "userSqno": "session.userSqno"}	Y	600
GET_DIARY_LIST_PAGE	SELECT d.diary_id AS "diary_id", d.user_sqno AS "user_sqno", d.title AS "title", d.date AS "date", d.emotion AS "emotion", d.day_tag1 AS "tag1", d.day_tag2 AS "tag2", d.day_tag3 AS "tag3", d.diary_status AS "diary_status", d.reg_dt AS "reg_dt", CASE WHEN u.del_yn = 'Y' THEN CONCAT('del_', d.user_id) ELSE d.user_id END AS "user_id" FROM diary d LEFT JOIN users u ON d.user_sqno = u.user_sqno WHERE d.del_yn = 'N' AND (NULLIF(CAST(:filterId AS VARCHAR), '') IS NULL OR d.user_id = CAST(:filterId AS VARCHAR)) ORDER BY d.reg_dt DESC LIMIT CAST(COALESCE(NULLIF(CAST(:pageSize AS VARCHAR), ''), '5') AS INTEGER) OFFSET CAST(COALESCE(NULLIF(CAST(:offset AS VARCHAR), ''), '0') AS INTEGER)	MULTI	일기 목록 페이징 조회	2026-01-14 23:10:06.713005	2026-02-22 08:54:56.671104	\N	{"offset": "params.offset", "userId": "params.userId", "pageSize": "params.pageSize"}	Y	300
GET_DIARY_DETAIL	SELECT d.diary_id, d.user_id, d.title, d.content, d.date, d.emotion, d.day_tag1, d.day_tag2, d.day_tag3, d.diary_status, d.role_nm, d.selected_times, d.daily_slots, d.reg_dt \n                  FROM diary d \n                  WHERE d.diary_id = CAST(:diaryId AS BIGINT) AND d.del_yn = 'N'	SINGLE	일기 상세 정보 조회 (JSON 데이터 포함)	2026-02-22 09:18:35.850523	2026-02-22 09:18:35.850523	\N	\N	N	3600
UPDATE_DIARY_DETAIL	UPDATE diary \nSET title = :title, \n    content = :content, \n    emotion = CAST(:emotion AS INTEGER), \n    selected_times = CAST(:selected_times AS jsonb), \n    daily_slots = CAST(:daily_slots AS jsonb), \n    day_tag1 = :day_tag1, \n    day_tag2 = :day_tag2, \n    day_tag3 = :day_tag3\nWHERE diary_id = CAST(:diary_id AS BIGINT) \n  AND user_sqno = :userSqno	COMMAND	일기 내용 수정 쿼리	2026-02-22 20:52:05.840824	2026-02-24 12:12:53.080293	\N	\N	N	3600
\.


--
-- Data for Name: ui_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ui_metadata (ui_id, screen_id, component_id, label_text, component_type, sort_order, is_required, is_readonly, default_value, placeholder, created_at, css_class, inline_style, action_type, action_url, data_sql_key, data_api_url, data_params, ref_data_id, group_id, group_direction, submit_group_id, submit_group_order, submit_group_separator, parent_group_id, is_visible, component_props) FROM stdin;
709	DIARY_WRITE	DAYTAG_SUB_GROUP	하루해쉬태그그룹	GROUP	40	f	f	\N	\N	2026-01-23 22:01:08.909154	write_sub_group	\N	\N	\N	\N	\N	\N	\N	DAYTAG_SUB_GROUP	ROW	\N	\N	\N	DIARYWRITE_SECTION	true	{}
283	MAIN_PAGE	LOGIN_LEFT_CONTENT	로그인 왼쪽 영역	GROUP	10	f	t	\N	\N	2026-02-22 19:39:59.124085	card-left-area	\N	\N	\N	\N	\N	\N	\N	LOGIN_LEFT_CONTENT	COLUMN	\N	\N	\N	MAIN_LOGIN_CARD	true	{}
284	MAIN_PAGE	TUTORIAL_LEFT_CONTENT	튜토리얼 왼쪽 영역	GROUP	10	f	t	\N	\N	2026-02-22 19:39:59.124085	card-left-area	\N	\N	\N	\N	\N	\N	\N	TUTORIAL_LEFT_CONTENT	COLUMN	\N	\N	\N	MAIN_TUTORIAL_CARD	true	{}
301	MAIN_PAGE	main_header_img	dino_diary.png	IMAGE	1	f	f	\N	\N	2026-01-14 06:52:12.260807	diaryImg	\N	\N	\N	\N	\N	\N	\N	 	COLUMN	\N	\N	\N	MAIN_TOP_CARD	true	{}
715	DIARY_WRITE	title_dayTag2	하루태그2	TEXT	81	f	f	\N	\N	2026-01-23 22:10:02.955892	diary-label	\N	\N	\N	\N	\N	\N	\N	GROUP_TAG_ROW2	COLUMN	\N	\N	\N	GROUP_TAG_ROW2	true	{}
1010	REGISTER_PAGE	INFO_SECTION	기본 정보 영역	SECTION	1	f	t	\N	\N	2026-02-21 17:33:38.324058	INFO_SECTION	\N	\N	\N	\N	\N	\N	\N	INFO_SECTION	vertical	\N	\N	\N	REG_CONTAINER	true	{"gap": "15px"}
1022	REGISTER_PAGE	reg_zipcode	우편번호	INPUT	1	t	t	\N	\N	2026-02-21 17:33:38.324058	reg_zipcode	\N	\N	\N	\N	\N	\N	zipCode	\N	COLUMN	\N	\N	\N	ADDR_SEARCH_ROW	true	{}
718	DIARY_WRITE	title_dayTag3	하루태그3	TEXT	91	f	f	\N	\N	2026-01-23 22:10:02.955892	diary-label	\N	\N	\N	\N	\N	\N	\N	GROUP_TAG_ROW3	COLUMN	\N	\N	\N	GROUP_TAG_ROW3	true	{}
1020	REGISTER_PAGE	ADDR_SECTION	주소 정보 영역	SECTION	2	f	t	\N	\N	2026-02-21 17:33:38.324058	mt-30	\N	\N	\N	\N	\N	\N	\N	ADDR_SECTION	COLUMN	\N	\N	\N	REG_CONTAINER	true	{}
1030	REGISTER_PAGE	ACTION_SECTION	버튼 영역	SECTION	3	f	t	\N	\N	2026-02-21 17:33:38.324058	mt-40	\N	\N	\N	\N	\N	\N	\N	ACTION_SECTION	COLUMN	\N	\N	\N	REG_CONTAINER	true	{}
850	DIARY_DETAIL	DETAIL_SECTION		GROUP	1	f	f	\N	\N	2026-02-21 18:50:04.313187	write_section1	\N	\N	\N	\N	\N	\N	\N	DETAIL_SECTION	COLUMN	\N	\N	\N	\N	true	{}
1011	REGISTER_PAGE	reg_email	이메일	INPUT	1	t	f	\N	example@email.com	2026-02-21 17:33:38.324058	reg_email	\N	\N	\N	\N	\N	\N	email	\N	COLUMN	\N	\N	\N	INFO_SECTION	true	{}
1024	REGISTER_PAGE	reg_road_addr	도로명 주소	INPUT	2	f	t	\N	\N	2026-02-21 17:33:38.324058	reg_road_addr	\N	\N	\N	\N	\N	\N	roadAddress	\N	COLUMN	\N	\N	\N	ADDR_SECTION	true	{}
1012	REGISTER_PAGE	reg_pw	비밀번호	INPUT	2	t	f	\N	\N	2026-02-21 17:33:38.324058	reg_pw	\N	\N	\N	\N	\N	\N	password	\N	COLUMN	\N	\N	\N	INFO_SECTION	true	{"type": "password"}
1033	DIARY_DETAIL	diary_detail_source	상세 데이터 소스	DATA_SOURCE	0	f	t	\N	\N	2026-02-22 09:18:35.850523	diary_detail_source	\N	AUTO_FETCH	\N	GET_DIARY_DETAIL	/api/execute/GET_DIARY_DETAIL	\N	\N	\N	COLUMN	\N	\N	\N	\N	false	{}
1000	REGISTER_PAGE	REG_CONTAINER	회원가입 메인 컨테이너	CONTAINER	1	f	t	\N	\N	2026-02-21 17:33:38.324058	REG_CONTAINER	\N	\N	\N	\N	\N	\N	\N	REG_CONTAINER	COLUMN	\N	\N	\N	\N	true	{}
1021	REGISTER_PAGE	ADDR_SEARCH_ROW	우편번호 검색줄	ROW	1	f	t	\N	\N	2026-02-21 17:33:38.324058	ADDR_SEARCH_ROW	\N	\N	\N	\N	\N	\N	\N	ADDR_SEARCH_ROW	horizontal	\N	\N	\N	ADDR_SECTION	true	{}
706	DIARY_WRITE	EMOTION_SUB_GROUP	감정 입력 그룹	GROUP	60	f	f	\N	\N	2026-01-23 21:17:18.186064	write_sub_group	\N	\N	\N	\N	\N	\N	\N	EMOTION_SUB_GROUP	COLUMN	\N	\N	\N	DIARYWRITE_SECTION	true	{}
1013	REGISTER_PAGE	reg_phone	핸드폰 번호	INPUT	3	f	f	\N	010-0000-0000	2026-02-21 17:33:38.324058	reg_phone	\N	\N	\N	\N	\N	\N	phone	\N	COLUMN	\N	\N	\N	INFO_SECTION	true	{}
281	MAIN_PAGE	login_card_title	로그인 하러가기	TEXT	5	f	t	\N	\N	2026-02-22 19:39:59.124085	card-title	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	LOGIN_LEFT_CONTENT	false	{}
280	MAIN_PAGE	top_card_title	오늘의 약속 시간은 언제인가요?	TEXT	5	f	t	\N	\N	2026-02-22 19:39:59.124085	card-title	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	TOP_LEFT_CONTENT	false	{}
282	MAIN_PAGE	tutorial_card_title	튜토리얼 보기	TEXT	5	f	t	\N	\N	2026-02-22 19:39:59.124085	card-title	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	TUTORIAL_LEFT_CONTENT	false	{}
851	DIARY_DETAIL	label_diaryTitle	제목	TEXT	20	f	f	\N	\N	2026-02-21 18:50:04.313187	diary-label	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
858	DIARY_DETAIL	DAYTAG_SUB_GROUP		GROUP	40	f	f	\N	\N	2026-02-21 18:50:04.313187	write_sub_group	\N	\N	\N	\N	\N	\N	\N	DAYTAG_SUB_GROUP	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
856	DIARY_DETAIL	EMOTION_SUB_GROUP		GROUP	60	f	f	\N	\N	2026-02-21 18:50:04.313187	write_sub_group	\N	\N	\N	\N	\N	\N	\N	EMOTION_SUB_GROUP	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
862	DIARY_DETAIL	go_list_btn	목록으로 돌아가기	BUTTON	71	f	f	\N	\N	2026-02-21 18:50:04.313187	go_list_btn	\N	ROUTE	/view/DIARY_LIST	\N	\N	\N	\N	DIARYWRITE_BTN_GROUP	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
200	SIDE_MENU	menu_main	메인페이지	MENU_ITEM	1	f	f	\N	\N	2026-01-13 03:13:37.484183	menu_main	\N	LINK	/view/MAIN_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	\N	true	{}
1113	DIARY_MODIFY	go_modify_btn	수정하기	BUTTON	70	f	f	\N	\N	2026-02-23 10:16:54.957794	diary-btn-primary	\N	LINK	/view/MAIN_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	DIARYWRITE_BTN_GROUP	false	{}
1114	DIARY_MODIFY	go_list_btn	수정 완료	BUTTON	71	f	f	\N	\N	2026-02-23 10:16:54.957794	save-button	\N	SUBMIT	/api/execute/UPDATE_DIARY_DETAIL	UPDATE_DIARY_DETAIL	\N	\N	\N	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1032	REGISTER_PAGE	email_verify_modal	회원 정보 입력	MODAL	99	f	t	\N	\N	2026-02-24 23:26:50.70224	\N	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	ROOT	true	{"content": "인증 메일을 전송했습니다. 인증을 완료하신 후 이 페이지로 돌아와 확인 버튼을 눌러주세요.", "button_text": "확인"}
201	SIDE_MENU	menu_tutorial	튜토리얼	MENU_ITEM	2	f	f	\N	\N	2026-01-13 03:13:41.983994	menu_tutorial	\N	LINK	/view/TUTORIAL_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	\N	true	{}
1031	REGISTER_PAGE	reg_submit	회원 가입 완료	BUTTON	1	f	f	\N	\N	2026-02-21 17:33:38.324058	reg_submit	\N	REGISTER_SUBMIT	/api/auth/register	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	ACTION_SECTION	true	{"variant": "primary", "fullWidth": true}
1023	REGISTER_PAGE	reg_addr_btn	주소 찾기	BUTTON	2	f	f	\N	\N	2026-02-21 17:33:38.324058	reg_addr_btn	\N	OPEN_POSTCODE	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	ADDR_SEARCH_ROW	true	{}
1025	REGISTER_PAGE	reg_detail_addr	상세 주소	INPUT	3	f	f	\N	나머지 주소를 입력하세요	2026-02-21 17:33:38.324058	reg_detail_addr	\N	\N	\N	\N	\N	\N	detailAddress	\N	COLUMN	\N	\N	\N	ADDR_SECTION	true	{}
1200	VERIFY_CODE_PAGE	VERIFY_CONTAINER	이메일 인증	CONTAINER	1	f	t	\N	\N	2026-02-24 16:44:46.38388	verify-container	\N	\N	\N	\N	\N	\N	\N	VERIFY_CONTAINER	COLUMN	\N	\N	\N	\N	true	{}
310	MAIN_PAGE	MAIN_TOP_CARD	메인탑카드	GROUP	20	f	t	\N	\N	2026-02-22 18:13:25.54212	main-card-item top-full	\N	\N	\N	\N	\N	\N	\N	MAIN_TOP_CARD	COLUMN	\N	\N	\N	MAIN_SECTION	true	{}
311	MAIN_PAGE	MAIN_LOGIN_CARD	로그인카드	GROUP	30	f	t	\N	\N	2026-02-22 18:13:25.54212	main-card-item sub-half	\N	\N	\N	\N	\N	\N	\N	MAIN_LOGIN_CARD	COLUMN	\N	\N	\N	MAIN_SECTION	true	{}
312	MAIN_PAGE	MAIN_TUTORIAL_CARD	튜토리얼카드	GROUP	40	f	t	\N	\N	2026-02-22 18:13:25.54212	main-card-item sub-half	\N	\N	\N	\N	\N	\N	\N	MAIN_TUTORIAL_CARD	COLUMN	\N	\N	\N	MAIN_SECTION	true	{}
1201	VERIFY_CODE_PAGE	reg_email	가입 이메일	INPUT	1	f	t	\N	가입하신 이메일입니다	2026-02-24 16:44:46.38388	verify-input-readonly	\N	\N	\N	\N	\N	\N	email	\N	COLUMN	\N	\N	\N	VERIFY_CONTAINER	true	{}
1202	VERIFY_CODE_PAGE	reg_code	인증 번호	INPUT	2	f	f	\N	메일로 발송된 6자리 번호를 입력하세요	2026-02-24 16:44:46.38388	verify-input-active	\N	\N	\N	\N	\N	\N	code	\N	COLUMN	\N	\N	\N	VERIFY_CONTAINER	true	{}
905	SET_TIME_PAGE	save_time_btn	저장하기	BUTTON	6	f	f	\N	\N	2026-01-26 12:32:23.775178	save-button	\N	SUBMIT	/api/goalTime/save	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	SET_TIME_SECTION	true	{}
906	SET_TIME_PAGE	back_btn	취소	BUTTON	7	f	f	\N	\N	2026-01-26 12:32:28.91547	cancel-button	\N	NAVIGATE	/view/MAIN_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	SET_TIME_SECTION	true	{}
854	DIARY_DETAIL	sleep_time_select	수면 시간	TIME_SELECT	10	f	t	\N	\N	2026-02-21 18:50:04.313187	time-select-wrapper	\N	\N	\N	\N	\N	\N	selected_times	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
852	DIARY_DETAIL	diaryTitle	제목	INPUT	21	f	t	\N	\N	2026-02-21 18:50:04.313187	diaryInput	\N	\N	\N	\N	\N	\N	title	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
853	DIARY_DETAIL	diaryContent		TEXTAREA	30	f	t	\N	\N	2026-02-21 18:50:04.313187	diaryTextarea	\N	\N	\N	\N	\N	\N	content	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
855	DIARY_DETAIL	daily_routine_section	일과 기록	TIME_SLOT_RECORD	50	f	t	\N	\N	2026-02-21 18:50:04.313187	time-slot-container	\N	\N	\N	\N	\N	\N	daily_slots	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1203	VERIFY_CODE_PAGE	verify_submit	인증 완료	BUTTON	3	f	f	\N	\N	2026-02-24 16:44:46.38388	verify-submit-btn	\N	VERIFY_CODE	/api/auth/verify-code	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	VERIFY_CONTAINER	true	{}
1204	VERIFY_CODE_PAGE	resend_btn	인증 번호 재발송	LINK	4	f	f	\N	\N	2026-02-24 16:44:46.38388	resend-link	\N	RESEND_CODE	/api/auth/resend-code	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	VERIFY_CONTAINER	true	{}
857	DIARY_DETAIL	diaryEmotion	오늘의 감정	EMOTION_SELECT	52	f	t	\N	\N	2026-02-21 18:50:04.313187	emotionSelect	\N	\N	\N	\N	\N	\N	emotion	\N	COLUMN	\N	\N	\N	EMOTION_SUB_GROUP	true	{}
859	DIARY_DETAIL	dayTag1	태그 1	INPUT	72	f	t	\N	\N	2026-02-21 18:50:04.313187	diaryInput	\N	\N	\N	\N	\N	\N	day_tag1	\N	COLUMN	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
860	DIARY_DETAIL	dayTag2	태그 2	INPUT	82	f	t	\N	\N	2026-02-21 18:50:04.313187	diaryInput	\N	\N	\N	\N	\N	\N	day_tag2	\N	COLUMN	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
861	DIARY_DETAIL	dayTag3	태그 3	INPUT	92	f	t	\N	\N	2026-02-21 18:50:04.313187	diaryInput	\N	\N	\N	\N	\N	\N	day_tag3	\N	COLUMN	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
863	DIARY_DETAIL	go_modify_btn	수정하기	BUTTON	93	f	f	\N	\N	2026-02-22 20:47:11.801275	go_modify_btn	\N	ROUTE_MODIFY	/view/DIARY_MODIFY	\N	\N	\N	\N	DIARYWRITE_BTN_GROUP	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
500	RECORD_TIME_COMPONENT	MAIN_CLOCK_SECTION	지각방지 섹션	GROUP	1	f	t	\N	\N	2026-01-26 06:54:14.013873	time-record-container	\N	\N	\N	\N	\N	\N	\N	MAIN_CLOCK_SECTION	COLUMN	\N	\N	\N	\N	true	{}
502	RECORD_TIME_COMPONENT	ACTIVE_INFO_GROUP	실시간 정보 그룹	GROUP	2	f	t	\N	\N	2026-01-26 06:54:24.681945	active-display-row	\N	\N	\N	\N	\N	\N	\N	ACTIVE_INFO_GROUP	ROW	\N	\N	\N	MAIN_CLOCK_SECTION	false	{}
300	MAIN_PAGE	MAIN_SECTION	메인 전체 섹션	GROUP	0	f	t	\N	\N	2026-01-17 14:37:18.986831	main-responsive-grid	\N	\N	\N	\N	\N	\N	\N	MAIN_SECTION	COLUMN	\N	\N	\N	\N	true	{}
320	MAIN_PAGE	TOP_LEFT_CONTENT	왼쪽	GROUP	10	f	t	\N	\N	2026-02-22 19:02:28.175262	card-left-area	\N	\N	\N	\N	\N	\N	\N	TOP_LEFT_CONTENT	COLUMN	\N	\N	\N	MAIN_TOP_CARD	true	{}
903	SET_TIME_PAGE	targetTime	목표 시간	DATETIME_PICKER	4	t	f	\N	목표시간 입력 yyyy-MM-dd HH:mm:ss	2026-01-31 14:25:53.841138	targetTime	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	SET_TIME_SECTION	true	{}
702	DIARY_WRITE	diaryTitle	제목	INPUT	21	f	f	\N	제목을 입력하세요	2026-01-22 06:39:44.17085	diaryInput	\N	\N	\N	\N	\N	\N	title	\N	COLUMN	\N	\N	\N	DIARYWRITE_SECTION	true	{}
405	LOGIN_PAGE	PW_SUB_GROUP	비밀번호 섹션	GROUP	5	f	t	\N	\N	2026-01-17 10:20:06.873916	PW_SUB_GROUP	\N	\N	\N	\N	\N	\N	\N	PW_SUB_GROUP	COLUMN	\N	\N	\N	LOGIN_SECTION	true	{}
410	LOGIN_PAGE	SNS_SECTION	SNS 로그인	GROUP	10	f	t	\N	\N	2026-01-17 08:02:00.186332	SNS_SECTION	\N	\N	\N	\N	\N	\N	\N	SNS_SECTION	COLUMN	\N	\N	\N	\N	true	{}
609	DIARY_LIST	diary_total_count	전체 개수 조회	DATA_SOURCE	99	f	t	\N	\N	2026-01-20 03:16:29.470008	diary_total_count	\N	AUTO_FETCH	\N	COUNT_DIARY_LIST	/api/execute/COUNT_DIARY_LIST	{}	\N	\N	COLUMN	\N	\N	\N	LIST_SECTION	true	{}
713	DIARY_WRITE	day_tag1	태그 1	INPUT	72	f	f	\N	#tag1	2026-01-23 22:01:08.909154	diaryInput	\N	\N	\N	\N	\N	\N	day_tag1	GROUP_TAGS_ONELINE	ROW	\N	\N	\N	GROUP_TAGS_ONELINE	true	{}
716	DIARY_WRITE	day_tag2	태그 2	INPUT	82	f	f	\N	#tag2	2026-01-23 22:10:02.955892	diaryInput	\N	\N	\N	\N	\N	\N	day_tag2	GROUP_TAGS_ONELINE	ROW	\N	\N	\N	GROUP_TAGS_ONELINE	true	{}
719	DIARY_WRITE	day_tag3	태그 3	INPUT	92	f	f	\N	#tag3	2026-01-23 22:10:02.955892	diaryInput	\N	\N	\N	\N	\N	\N	day_tag3	GROUP_TAGS_ONELINE	ROW	\N	\N	\N	GROUP_TAGS_ONELINE	true	{}
705	DIARY_WRITE	daily_slots	오늘의 흐름	TIME_SLOT_RECORD	50	f	f	\N	\N	2026-02-18 11:39:34.194682	daily_routine_section	\N	\N	\N	\N	\N	\N	daily_slots	\N	COLUMN	\N	\N	\N	DIARYWRITE_SECTION	true	{"title": "나의 하루 기록", "description": "아침, 점심, 저녁 기록", "placeholders": {"lunch": "점심 식사 이후", "evening": "마무리", "morning": "기상 직후 "}}
900	SET_TIME_PAGE	SET_TIME_SECTION	시간 설정 전체 섹션	GROUP	1	f	f	\N	\N	2026-01-26 12:31:57.674292	SET_TIME_SECTION	\N	\N	\N	\N	\N	\N	\N	SET_TIME_SECTION	COLUMN	\N	\N	\N	\N	true	{}
904	SET_TIME_PAGE	messageInput	오늘의 메모	INPUT	5	t	f	\N	오늘의 각오 한마디	2026-01-26 12:32:18.602056	time-input	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	SET_TIME_SECTION	true	{}
1102	DIARY_MODIFY	label_diaryTitle	제목	TEXT	20	f	f	\N	\N	2026-02-23 10:16:54.957794	diary-label	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1103	DIARY_MODIFY	diaryTitle	제목	INPUT	21	f	f	\N	\N	2026-02-23 10:16:54.957794	diaryInput	\N	\N	\N	\N	\N	\N	title	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1109	DIARY_MODIFY	DAYTAG_SUB_GROUP		GROUP	40	f	f	\N	\N	2026-02-23 10:16:54.957794	write_sub_group	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1107	DIARY_MODIFY	EMOTION_SUB_GROUP		GROUP	60	f	f	\N	\N	2026-02-23 10:16:54.957794	write_sub_group	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1104	DIARY_MODIFY	content		TEXTAREA	30	f	f	\N	\N	2026-02-23 10:16:54.957794	diaryTextarea	\N	\N	\N	\N	\N	\N	content	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1108	DIARY_MODIFY	emotion	오늘의 감정	EMOTION_SELECT	52	f	f	\N	\N	2026-02-23 10:16:54.957794	emotionSelect	\N	\N	\N	\N	\N	\N	emotion	\N	COLUMN	\N	\N	\N	EMOTION_SUB_GROUP	true	{}
1110	DIARY_MODIFY	day_tag1	태그 1	INPUT	72	f	f	\N	\N	2026-02-23 10:16:54.957794	diaryInput	\N	\N	\N	\N	\N	\N	day_tag1	\N	COLUMN	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
1111	DIARY_MODIFY	day_tag2	태그 2	INPUT	82	f	f	\N	\N	2026-02-23 10:16:54.957794	diaryInput	\N	\N	\N	\N	\N	\N	day_tag2	\N	COLUMN	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
1112	DIARY_MODIFY	day_tag3	태그 3	INPUT	92	f	f	\N	\N	2026-02-23 10:16:54.957794	diaryInput	\N	\N	\N	\N	\N	\N	day_tag3	\N	COLUMN	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
1105	DIARY_MODIFY	selected_times	수면 시간	TIME_SELECT	10	f	f	\N	\N	2026-02-23 10:16:54.957794	time-select-wrapper	\N	\N	\N	\N	\N	\N	selected_times	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
1106	DIARY_MODIFY	daily_slots	일과 기록	TIME_SLOT_RECORD	50	f	f	\N	\N	2026-02-23 10:16:54.957794	time-slot-container	\N	\N	\N	\N	\N	\N	daily_slots	\N	COLUMN	\N	\N	\N	DETAIL_SECTION	true	{}
901	SET_TIME_PAGE	set_time_title	퇴근/약속 목표 시간 설정	TEXT	2	f	t	\N	\N	2026-01-26 12:32:05.163861	page-title	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	SET_TIME_SECTION	true	{}
902	SET_TIME_PAGE	set_time_desc	오늘의 목표 시간을 선택해 주세요.	TEXT	3	f	t	\N	\N	2026-01-26 12:32:10.688515	page-desc	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	SET_TIME_SECTION	true	{}
1100	DIARY_MODIFY	diary_detail_source	상세 데이터 소스	DATA_SOURCE	0	f	t	\N	\N	2026-02-23 10:16:54.957794	diary_detail_source	\N	AUTO_FETCH	\N	GET_DIARY_DETAIL	\N	\N	\N	\N	COLUMN	\N	\N	\N	\N	false	{}
1101	DIARY_MODIFY	DETAIL_SECTION		GROUP	1	f	f	\N	\N	2026-02-23 10:16:54.957794	write_section1	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	\N	true	{}
406	LOGIN_PAGE	label_pw	Password	TEXT	6	f	t	\N	\N	2026-01-17 04:58:38.911604	label_pw	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	PW_SUB_GROUP	false	{}
402	LOGIN_PAGE	label_email	Email	TEXT	2	f	t	\N	\N	2026-01-17 04:58:49.78615	label_email	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	EMAIL_SUB_GROUP	false	{}
703	DIARY_WRITE	content	내용	TEXTAREA	30	f	f	\N	내용을 입력하세요	2026-01-22 06:39:58.895244	diaryTextarea	\N	\N	\N	\N	\N	\N	content	\N	COLUMN	\N	\N	\N	DIARYWRITE_SECTION	true	{}
704	DIARY_WRITE	selected_times	수면 시간 기록	TIME_SELECT	10	f	f	\N	\N	2026-02-17 11:22:24.682063	sleep_time_select	\N	\N	\N	\N	\N	\N	selected_times	\N	COLUMN	\N	\N	\N	DIARYWRITE_SECTION	true	{"endHour": 24, "startHour": 0, "slidesPerView": 6}
302	MAIN_PAGE	main_illust_img	diary_body.png	IMAGE	1	f	t	\N	\N	2026-01-14 06:52:17.379511	diaryImg	\N	\N	\N	\N	\N	\N	\N	 	COLUMN	\N	\N	\N	MAIN_TOP_CARD	true	{}
306	MAIN_PAGE	view_diary_list_btn	일기 보러가기	BUTTON	20	f	f	\N	\N	2026-01-18 00:12:24.454526	diary-nav1	\N	LINK	/view/DIARY_LIST	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	TOP_LEFT_CONTENT	true	{}
305	MAIN_PAGE	go_diary_btn	일기 작성하기	BUTTON	30	f	f	\N	\N	2026-01-14 10:07:48.424413	diary-nav1	\N	LINK	/view/DIARY_WRITE	GET_MEMBER_DIARY_LIST	/api/common/fetch-data	\N	\N	 	COLUMN	\N	\N	\N	TOP_LEFT_CONTENT	true	{}
303	MAIN_PAGE	go_login_btn	로그인 하러가기	BUTTON	20	f	f	\N	\N	2026-01-17 14:31:17.619384	diary-btn-primary	\N	LINK	/view/LOGIN_PAGE	\N	\N	\N	\N	 	COLUMN	\N	\N	\N	LOGIN_LEFT_CONTENT	true	{}
304	MAIN_PAGE	go_tutorial_btn	튜토리얼 보기	BUTTON	20	f	f	\N	\N	2026-01-17 14:31:21.489734	diary-btn-secondary	\N	LINK	/view/TUTORIAL_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	TUTORIAL_LEFT_CONTENT	true	{}
411	LOGIN_PAGE	kakao_login_btn	Login with Kakao	SNS_BUTTON	11	f	f	\N	\N	2026-01-13 03:13:18.890374	kakao-button	\N	LINK	https://kauth.kakao.com/oauth/authorize?client_id=2d22c7fa1d59eb77a5162a3948a0b6fe&redirect_uri=http://localhost:8080/api/kakao/callback&response_type=code	\N	\N	\N	\N	SNS_GROUP	COLUMN	\N	\N	\N	SNS_SECTION	true	{}
103	GLOBAL_HEADER	header_general_logout	로그아웃	BUTTON	13	f	t	\N	\N	2026-02-16 13:56:32.593884	logout_button	\N	LOGOUT	/api/auth/logout	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	HEADER_SECTION	true	{}
104	GLOBAL_HEADER	header_kakao_logout	카카오 로그아웃	SNS_BUTTON	14	f	t	\N	\N	2026-02-16 13:56:38.530441	kakao_logout_button	\N	KAKAO_LOGOUT	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	HEADER_SECTION	true	{}
400	LOGIN_PAGE	LOGIN_SECTION	로그인 섹션	GROUP	0	f	t	\N	\N	2026-01-17 08:08:24.637217	LOGIN_SECTION	\N	\N	\N	\N	\N	\N	\N	LOGIN_SECTION	COLUMN	\N	\N	\N	\N	true	{}
401	LOGIN_PAGE	EMAIL_SUB_GROUP	이메일 입력 그룹	GROUP	1	f	t	\N	\N	2026-01-17 08:02:04.332134	EMAIL_SUB_GROUP	\N	\N	\N	\N	\N	\N	\N	EMAIL_SUB_GROUP	ROW	\N	\N	\N	LOGIN_SECTION	true	{}
403	LOGIN_PAGE	user_email	Email	INPUT	3	t	f	\N	아이디 입력	2026-01-13 03:12:12.706028	login_form-input	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	EMAIL_SUB_GROUP	true	{}
404	LOGIN_PAGE	user_email_domain	@	EMAIL_SELECT	4	t	t	\N	\N	2026-01-17 04:32:18.542272	user_email_domain	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	EMAIL_SUB_GROUP	true	{}
407	LOGIN_PAGE	user_pw	Password	PASSWORD	7	t	f	\N	비밀번호를 입력하세요	2026-01-13 03:12:18.54615	login_form-input	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	PW_SUB_GROUP	true	{}
408	LOGIN_PAGE	pw_toggle_btn	보이기	BUTTON	8	f	t	\N	\N	2026-01-17 04:58:34.801551	pw_toggle_btn	\N	TOGGLE_PW	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	PW_SUB_GROUP	true	{}
409	LOGIN_PAGE	login_btn	로그인	BUTTON	9	f	f	\N	\N	2026-01-13 03:12:22.419475	login_form_button	\N	SUBMIT	/api/auth/login	\N	/api/auth/login	\N	\N	LOGIN_BTN_GROUP	COLUMN	\N	\N	\N	LOGIN_SECTION	true	{}
501	RECORD_TIME_COMPONENT	no_goal_msg	오늘의 약속 시간은 언제인가요?	TEXT	1	f	t	\N	\N	2026-01-26 12:03:21.48682	no-goal-container	\N	NAVIGATE	/view/SET_TIME_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	MAIN_CLOCK_SECTION	true	{}
100	GLOBAL_HEADER	HEADER_SECTION	메뉴 수정	GROUP	0	f	t	\N	\N	2026-02-16 13:56:25.750512	HEADER_SECTION	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	\N	true	{}
101	GLOBAL_HEADER	header_logo	JustSaying	LINK	1	f	t	\N	\N	2026-02-16 13:56:49.840582	header_logo	\N	ROUTE	/view/MAIN_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	HEADER_SECTION	true	{}
102	GLOBAL_HEADER	header_login_btn	로그인	LINK	12	f	t	\N	\N	2026-02-16 14:42:13.687615	header_login_btn	\N	ROUTE	/view/LOGIN_PAGE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	HEADER_SECTION	true	{}
412	LOGIN_PAGE	join_btn	회원가입	BUTTON	12	f	f	\N	\N	2026-01-13 03:13:23.080997	signup-nav	\N	LINK	/view/REGISTER_PAGE	\N	\N	\N	\N	JOIN_GROUP	COLUMN	\N	\N	\N	LOGIN_SECTION	true	{}
701	DIARY_WRITE	label_diaryTitle	제목	TEXT	20	f	f	\N	\N	2026-01-23 20:37:02.741491	diary-label	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	DIARYWRITE_SECTION	true	{}
712	DIARY_WRITE	title_dayTag1	하루태그1	TEXT	71	f	f	\N	\N	2026-01-23 22:10:02.955892	diary-label	\N	\N	\N	\N	\N	\N	\N	GROUP_TAG_ROW1	COLUMN	\N	\N	\N	GROUP_TAG_ROW1	true	{}
503	RECORD_TIME_COMPONENT	remainTimeCountdown	남은 시간	COUNTDOWN	1	f	t	\N	\N	2026-01-26 06:54:29.835625	countdown-timer	\N	\N	\N	\N	/api/time/remain	\N	\N	\N	COLUMN	\N	\N	\N	ACTIVE_INFO_GROUP	true	{}
504	RECORD_TIME_COMPONENT	ACTION_BTN_GROUP	버튼 그룹	GROUP	2	f	t	\N	\N	2026-01-26 06:54:34.518264	action-button-box	\N	\N	\N	\N	\N	\N	\N	ACTION_BTN_GROUP	COLUMN	\N	\N	\N	ACTIVE_INFO_GROUP	true	{}
505	RECORD_TIME_COMPONENT	arrival_btn	도착 완료	BUTTON	1	f	t	\N	\N	2026-01-26 06:54:40.956846	arrival-button	\N	SUBMIT	/api/arrival/check	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	ACTION_BTN_GROUP	true	{}
506	RECORD_TIME_COMPONENT	list_more_btn	...	BUTTON	2	f	t	\N	\N	2026-01-26 06:54:45.888398	more-button	\N	TOGGLE_LIST	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	ACTION_BTN_GROUP	true	{}
600	DIARY_LIST	LIST_SECTION	리스트 전체 섹션	GROUP	1	f	t	\N	\N	2026-01-18 00:21:58.578459	LIST_SECTION	\N	\N	\N	\N	\N	\N	\N	LIST_SECTION	COLUMN	\N	\N	\N	\N	true	{}
602	DIARY_LIST	diary_list_source	일기 목록 데이터	DATA_SOURCE	0	f	t	\N	\N	2026-01-18 00:21:35.43999	diary_list_source	\N	AUTO_FETCH	\N	GET_DIARY_LIST_PAGE	/api/execute/GET_DIARY_LIST_PAGE	{"pageSize": 5, "offset": 0, "filterId": ""}	\N	\N	COLUMN	\N	\N	\N	LIST_SECTION	true	{}
603	DIARY_LIST	DIARY_CARD	일기 카드	GROUP	2	f	t	\N	\N	2026-01-18 00:22:11.602885	diary-post	\N	ROUTE_DETAIL	/view/DIARY_DETAIL	\N	\N	\N	diary_list_source	DIARY_CARD	COLUMN	\N	\N	\N	LIST_SECTION	true	{}
604	DIARY_LIST	DIARY_CARD_HEADER	카드 상단 영역	GROUP	1	f	t	\N	\N	2026-02-04 15:31:58.565112	diary-card-header	\N	\N	\N	\N	\N	\N	\N	DIARY_CARD_HEADER	ROW	\N	\N	\N	DIARY_CARD	true	{}
605	DIARY_LIST	TITLE_AUTHOR_GROUP	제목작성자묶음	GROUP	1	f	t	\N	\N	2026-02-15 16:50:42.817815	title-author-wrapper	\N	\N	\N	\N	\N	\N	\N	TITLE_AUTHOR_GROUP	ROW	\N	\N	\N	DIARY_CARD_HEADER	true	{}
606	DIARY_LIST	list_item_title	제목	TEXT	1	f	t	\N	\N	2026-01-18 00:22:34.120928	diaryTitle	\N	\N	\N	\N	\N	\N	title	\N	COLUMN	\N	\N	\N	TITLE_AUTHOR_GROUP	true	{}
607	DIARY_LIST	list_item_date	날짜	TEXT	2	f	t	\N	\N	2026-01-18 00:22:38.322161	diaryDate	\N	\N	\N	\N	\N	\N	reg_dt	\N	COLUMN	\N	\N	\N	DIARY_CARD_HEADER	true	{}
608	DIARY_LIST	list_item_author	작성자	TEXT	2	f	t	\N	\N	2026-01-18 00:22:19.623286	diaryContent	\N	\N	\N	\N	\N	\N	user_id	\N	COLUMN	\N	\N	\N	TITLE_AUTHOR_GROUP	true	{}
610	DIARY_LIST	diary_pagination	페이지네이션	PAGINATION	100	f	t	\N	\N	2026-02-19 16:45:05.2768	diary-pagination	\N	\N	\N	\N	\N	\N	diary_total_count	\N	COLUMN	\N	\N	\N	LIST_SECTION	true	{}
717	DIARY_WRITE	GROUP_TAG_ROW3	태그3행	GROUP	90	f	t	\N	\N	2026-01-24 10:20:53.40285	GROUP_TAG_ROW3	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
700	DIARY_WRITE	DIARYWRITE_SECTION	다이어리쓰기 섹션	GROUP	1	f	f	\N	\N	2026-01-23 21:00:59.185022	write_section1	\N	\N	\N	\N	\N	\N	\N	DIARYWRITE_SECTION	COLUMN	\N	\N	\N	\N	true	{}
707	DIARY_WRITE	label_diaryEmotion	오늘의 감정은?	TEXT	51	f	f	\N	\N	2026-01-23 21:15:20.131199	diary-label	\N	\N	\N	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	EMOTION_SUB_GROUP	true	{}
720	DIARY_WRITE	save_btn	저장하기	BUTTON	70	f	f	\N	\N	2026-01-22 06:40:11.564646	save-button	\N	SUBMIT	/api/execute/INSERT_DIARY	INSERT_DIARY	\N	\N	\N	DIARYWRITE_BTN_GROUP	COLUMN	\N	\N	\N	DIARYWRITE_SECTION	true	{}
710	DIARY_WRITE	GROUP_TAGS_ONELINE	태그한줄그룹	GROUP	61	f	f	\N	\N	2026-01-24 10:50:57.243018	GROUP_TAGS_ONELINE	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
711	DIARY_WRITE	GROUP_TAG_ROW1	태그1행	GROUP	70	f	f	\N	\N	2026-01-24 10:20:53.40285	GROUP_TAG_ROW1	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
714	DIARY_WRITE	GROUP_TAG_ROW2	태그2행	GROUP	80	f	t	\N	\N	2026-01-24 10:20:53.40285	GROUP_TAG_ROW2	\N	\N	\N	\N	\N	\N	\N	\N	ROW	\N	\N	\N	DAYTAG_SUB_GROUP	true	{}
708	DIARY_WRITE	emotion	감정	EMOTION_SELECT	52	f	f	\N	감정값이 필요합니다.	2026-01-23 21:13:13.733535	emotionSelect	\N	\N	\N	\N	\N	\N	emotion	\N	ROW	\N	\N	\N	EMOTION_SUB_GROUP	true	{}
601	DIARY_LIST	go_write_btn	새 일기 쓰기	BUTTON	0	f	f	\N	\N	2026-02-03 04:38:57.542742	write-btn	\N	LINK	/view/DIARY_WRITE	\N	\N	\N	\N	\N	COLUMN	\N	\N	\N	LIST_SECTION	true	{}
\.


--
-- Name: ui_metadata_ui_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ui_metadata_ui_id_seq', 1035, true);


--
-- Name: query_master query_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.query_master
    ADD CONSTRAINT query_master_pkey PRIMARY KEY (sql_key);


--
-- Name: ui_metadata ui_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ui_metadata
    ADD CONSTRAINT ui_metadata_pkey PRIMARY KEY (ui_id);


--
-- Name: query_master trg_query_master_cache; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_query_master_cache AFTER DELETE OR UPDATE ON public.query_master FOR EACH ROW EXECUTE FUNCTION public.notify_cache_eviction();


--
-- Name: ui_metadata trg_ui_metadata_cache; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ui_metadata_cache AFTER DELETE OR UPDATE ON public.ui_metadata FOR EACH ROW EXECUTE FUNCTION public.notify_cache_eviction();


--
-- PostgreSQL database dump complete
--

\unrestrict WR8vlbuscsJlN3DakPAdJHxZLD1dOmIfTxNb06EhfIOuNgKVYl0J567k1Yu6LgY

