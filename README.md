# GitHub Cost Center API Toolkit

GitHub Enterprise Cloud의 Cost Center(비용 센터) API를 문서화하고, 테스트하고, 대량의 사용자를 CSV로 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

### API 문서
- Cost Center 관련 3가지 API(비용 센터 리소스 추가, 리소스 제거, 전체 조회)에 대한 상세 문서 제공
- 엔드포인트, 파라미터, 응답 예시 등을 확인할 수 있습니다

### API 테스트
- Postman과 유사한 인터페이스로 실제 API 호출을 직접 테스트
- GitHub Token과 파라미터를 입력하여 실시간 응답 확인

### 대량 CSV 작업
- CSV 파일(name, email)을 업로드하여 이메일 기반으로 GitHub 사용자명 조회
- 조회된 사용자를 Cost Center에 일괄 추가 또는 삭제
- 500명 이상의 대량 사용자 관리 가능

## 기술 스택

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Radix UI (shadcn/ui)
- Phosphor Icons

## 로컬 실행 방법

### 사전 요구 사항

- Node.js 18 이상
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

### 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

## 사용 방법

### 인증 토큰 준비

API를 사용하려면 다음 권한이 있는 GitHub Personal Access Token이 필요합니다:
- `manage_billing:enterprise` (Classic Token)
- 또는 Fine-grained Token의 해당 권한

### API 테스트 탭

1. GitHub Token과 Enterprise Slug를 입력합니다
2. 테스트할 API 엔드포인트를 선택합니다
3. 필요한 파라미터를 입력한 후 요청을 실행합니다
4. 응답 결과(상태 코드, 본문, 헤더)를 확인합니다

### 대량 CSV 작업 탭

1. 인증 정보를 입력합니다
2. Cost Center 목록을 불러와 대상을 선택합니다
3. name, email 컬럼이 포함된 CSV 파일을 업로드합니다
4. 1단계: 이메일로 GitHub 사용자명을 조회합니다
5. 2단계: 조회된 사용자를 Cost Center에 추가/삭제합니다
6. 결과를 CSV로 다운로드할 수 있습니다

## 라이선스

MIT License
