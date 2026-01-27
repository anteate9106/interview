-- 2차 서류전형 질문지 테이블 생성
CREATE TABLE IF NOT EXISTS second_round_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  hint_text TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_number)
);

-- 2차 서류전형 답변 테이블 생성
CREATE TABLE IF NOT EXISTS second_round_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id TEXT NOT NULL,
  applicant_name TEXT,
  applicant_email TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(applicant_id)
);

-- 2차 서류전형 안내문 테이블 생성
CREATE TABLE IF NOT EXISTS second_round_intro (
  id TEXT PRIMARY KEY DEFAULT 'second_round_intro',
  intro_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2차 서류전형 안내문 초기 데이터 삽입
INSERT INTO second_round_intro (id, intro_text)
VALUES (
  'second_round_intro',
  '축하합니다! 1차 서류전형에 합격하셨습니다.

2차 서류전형을 위해 아래 질문에 답변해주시기 바랍니다.
모든 항목을 성실하게 작성해주세요.'
)
ON CONFLICT (id) DO NOTHING;

-- 2차 서류전형 사이드바 정보 테이블 생성
CREATE TABLE IF NOT EXISTS second_round_sidebar_info (
  id TEXT PRIMARY KEY DEFAULT 'second_round_sidebar_info',
  revision_guide_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  application_status_label TEXT NOT NULL DEFAULT '지원 현황',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2차 서류전형 사이드바 정보 초기 데이터 삽입
INSERT INTO second_round_sidebar_info (id, revision_guide_items, application_status_label)
VALUES (
  'second_round_sidebar_info',
  ARRAY[
    '이메일은 변경할 수 없습니다',
    '제출 전까지만 수정 가능합니다',
    '제출 완료 시 수정 불가',
    '변경사항은 즉시 반영됩니다',
    '신중하게 작성해주세요'
  ],
  '지원 현황'
)
ON CONFLICT (id) DO NOTHING;
