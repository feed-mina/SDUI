-- V28: memberships 테이블 생성 + 시드 데이터
-- 2026-03-13

CREATE TABLE IF NOT EXISTS memberships (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    can_learn     BOOLEAN NOT NULL DEFAULT FALSE,
    can_converse  BOOLEAN NOT NULL DEFAULT FALSE,
    can_analyze   BOOLEAN NOT NULL DEFAULT FALSE,
    duration_days INTEGER NOT NULL,
    price_cents   INTEGER NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 기본 멤버십 2종 시드
INSERT INTO memberships (name, can_learn, can_converse, can_analyze, duration_days, price_cents, description)
VALUES
  ('베이직',   TRUE,  FALSE, FALSE, 30, 129000, 'AI 학습 기능만 이용 가능한 기본 멤버십'),
  ('프리미엄', TRUE,  TRUE,  TRUE,  30, 219000, 'AI 학습 + 음성 대화 + 분석 모두 이용 가능')
ON CONFLICT (name) DO NOTHING;

DO $$ BEGIN RAISE NOTICE 'V28 완료 - memberships 테이블 생성 + 시드'; END $$;
