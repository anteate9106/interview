# 🔧 Vercel 배포 캐시 문제 해결 가이드

**작성일**: 2026-01-23

---

## 📋 문제 상황

로컬에서는 `index.html` 페이지가 정상적으로 수정되지만, Vercel 배포 사이트에서는 변경사항이 반영되지 않는 문제가 발생했습니다.

---

## ✅ 적용된 해결 방법

### 1. HTML 메타 태그에 캐시 방지 추가

`index.html`에 다음 메타 태그를 추가했습니다:

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### 2. Vercel 설정에 캐시 방지 헤더 추가

`vercel.json`에 캐시 방지 헤더를 추가했습니다:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*\\.(js|css|html))",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## 🔄 추가 해결 방법

### 방법 1: 브라우저 강력 새로고침

1. **Chrome/Edge**: `Ctrl + Shift + R` (Windows) 또는 `Cmd + Shift + R` (Mac)
2. **Firefox**: `Ctrl + F5` (Windows) 또는 `Cmd + Shift + R` (Mac)
3. **Safari**: `Cmd + Option + R`

### 방법 2: 브라우저 캐시 삭제

1. 브라우저 개발자 도구 열기 (F12)
2. 네트워크 탭에서 "Disable cache" 체크
3. 페이지 새로고침

### 방법 3: 시크릿/프라이빗 모드에서 확인

시크릿 모드에서 사이트를 열어 캐시 없이 확인할 수 있습니다.

### 방법 4: Vercel 대시보드에서 재배포

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Deployments 탭에서 최신 배포 선택
4. "Redeploy" 버튼 클릭

### 방법 5: URL에 버전 파라미터 추가 (임시)

개발 중에는 URL에 버전 파라미터를 추가하여 캐시를 우회할 수 있습니다:

```
https://interview-f5bn.vercel.app/?v=1.0.1
```

---

## 📊 배포 확인 방법

### 1. 배포 상태 확인

```bash
# 최신 커밋 확인
git log --oneline -1

# 배포된 사이트의 HTML 확인
curl -s https://interview-f5bn.vercel.app | head -20
```

### 2. 파일 버전 확인

배포된 JavaScript 파일에 최신 코드가 포함되어 있는지 확인:

```bash
curl -s https://interview-f5bn.vercel.app/app.js | grep "selectApplicant"
```

### 3. Vercel 배포 로그 확인

Vercel 대시보드에서 배포 로그를 확인하여 빌드가 성공적으로 완료되었는지 확인합니다.

---

## ⚠️ 주의사항

1. **캐시 방지 헤더는 성능에 영향을 줄 수 있습니다**
   - 프로덕션 환경에서는 적절한 캐시 전략을 사용하는 것이 좋습니다
   - 개발 중에만 사용하거나, 특정 파일에만 적용하는 것을 권장합니다

2. **Vercel의 CDN 캐시**
   - Vercel은 자체 CDN을 사용하므로, 변경사항이 즉시 반영되지 않을 수 있습니다
   - 보통 몇 분 내에 반영되지만, 최대 5-10분이 걸릴 수 있습니다

3. **브라우저 캐시**
   - 사용자의 브라우저 캐시도 영향을 줄 수 있습니다
   - 강력 새로고침을 권장합니다

---

## 🎯 권장 사항

### 개발 환경
- 캐시 방지 헤더 사용 (현재 적용됨)
- 브라우저 개발자 도구에서 "Disable cache" 활성화

### 프로덕션 환경
- 적절한 캐시 전략 사용 (예: 정적 파일은 캐시, HTML은 짧은 캐시)
- 파일 버전 관리 (예: `app.js?v=1.0.1`)
- 빌드 시 해시 추가 (예: `app.abc123.js`)

---

## ✅ 현재 상태

- ✅ HTML 메타 태그 추가 완료
- ✅ Vercel 캐시 방지 헤더 추가 완료
- ✅ GitHub에 푸시 완료
- ⏳ Vercel 자동 배포 진행 중

---

**참고**: 배포가 완료되면 브라우저를 강력 새로고침(Ctrl+Shift+R)하여 변경사항을 확인하세요.
