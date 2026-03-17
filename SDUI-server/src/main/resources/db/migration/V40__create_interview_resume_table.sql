-- V40: AI 면접 이력서 업로드 추적 테이블
-- 파일은 S3에 저장되며, 이 테이블은 업로드 이력 및 만료 관리를 위한 메타데이터만 보관

CREATE TABLE IF NOT EXISTS interview_resume (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    file_key    VARCHAR(512) NOT NULL,          -- S3 object key (e.g. resume/{userId}/{uuid}.pdf)
    file_type   VARCHAR(20)  NOT NULL,          -- 'image' | 'pdf'
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP    NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_interview_resume_user_id ON interview_resume (user_id);
CREATE INDEX IF NOT EXISTS idx_interview_resume_expires_at ON interview_resume (expires_at);
