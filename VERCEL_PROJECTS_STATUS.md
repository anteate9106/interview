# 📦 Vercel 프로젝트 상태 리포트

**확인일**: 2026-01-23

---

## 🔍 현재 상황

Vercel 대시보드에 **2개의 인터뷰 프로젝트**가 있습니다:

### 1. **interview-f5bn** ✅ (현재 사용 중)
- **프로젝트 ID**: `prj_DoXgxvzyQIVZPcKOnSJi4vFN8gBS`
- **배포 URL**: https://interview-f5bn.vercel.app
- **GitHub 저장소**: `anteate9106/interview`
- **최신 커밋**: `fix: 지원자 페이지 텍스트 색상 검정색으로 변경`
- **최근 배포**: 3분 전
- **상태**: ✅ 활성화, 최신 변경사항 반영됨

### 2. **interview** ⚠️ (오래된 프로젝트)
- **배포 URL**: `interview-one-inky.vercel.app`
- **GitHub 저장소**: `anteate9106/interview` (동일)
- **최신 커밋**: `feat: 채용공고 표시 방식 카드형 → 리스트형 변경`
- **최근 배포**: 1월 14일
- **상태**: ⚠️ 오래된 버전, 업데이트되지 않음

---

## ✅ 현재 연결된 프로젝트

**로컬 프로젝트는 `interview-f5bn`과 연결되어 있습니다.**

확인 방법:
```bash
cat .vercel/project.json
```

결과:
```json
{
  "projectId": "prj_DoXgxvzyQIVZPcKOnSJi4vFN8gBS",
  "orgId": "team_3XsMLiDbTzMlPdxA4SHTtYGM",
  "projectName": "interview-f5bn"
}
```

---

## 🤔 왜 2개가 있는가?

### 가능한 이유:
1. **초기 프로젝트 생성**: 처음에 `interview` 프로젝트를 만들었을 수 있음
2. **프로젝트 재생성**: 나중에 `interview-f5bn` 프로젝트를 새로 만들었을 수 있음
3. **프로젝트 이름 변경**: Vercel에서 프로젝트 이름을 변경하면서 새 프로젝트가 생성되었을 수 있음
4. **테스트/스테이징**: 의도적으로 다른 환경으로 만들었을 수 있음

### 중요한 점:
- **두 프로젝트 모두 같은 GitHub 저장소에 연결**되어 있음
- 하지만 **`interview` 프로젝트는 자동 배포가 업데이트되지 않음**
- **`interview-f5bn`만 최신 변경사항을 반영**하고 있음

---

## 🎯 권장 사항

### 옵션 1: 오래된 프로젝트 삭제 (권장)
오래된 `interview` 프로젝트를 삭제하여 혼란을 방지:

1. Vercel 대시보드 접속
2. `interview` 프로젝트 선택
3. Settings → General → Delete Project

### 옵션 2: 오래된 프로젝트 유지
- 스테이징 환경으로 사용
- 또는 백업 목적으로 유지

### 옵션 3: 오래된 프로젝트 재연동
`interview` 프로젝트도 최신 GitHub 저장소와 자동 배포되도록 재설정

---

## ✅ 현재 작업 프로젝트

**현재 사용 중인 프로젝트: `interview-f5bn`**

- ✅ 로컬 프로젝트와 연결됨
- ✅ GitHub 자동 배포 활성화
- ✅ 최신 변경사항 반영
- ✅ 배포 URL: https://interview-f5bn.vercel.app

---

## 📝 요약

| 항목 | interview-f5bn | interview |
|------|----------------|-----------|
| 상태 | ✅ 활성 (현재 사용) | ⚠️ 비활성 (오래됨) |
| 최신 배포 | 3분 전 | 1월 14일 |
| GitHub 연동 | ✅ 활성 | ⚠️ 비활성 |
| 권장 조치 | 계속 사용 | 삭제 또는 무시 |

**결론**: 현재는 **`interview-f5bn` 프로젝트만 사용**하고 있으며, 오래된 `interview` 프로젝트는 삭제하거나 무시해도 됩니다.
