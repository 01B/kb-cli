---
tags: [kb-rules]
tldr: "LLM이 KB를 어떻게 검색/기록/참조할지 정의하는 팀 공통 규칙"
updated: {{date}}
---

## KB 검색 규칙
- 도메인 지식 질문(비즈니스 룰, 시스템 동작, 아키텍처)은 코드 탐색 전에 KB를 먼저 확인할 것
- KB는 가이드, 코드가 source of truth. 코드 동작에 대한 답변 시 관련 코드도 가볍게 확인할 것
- KB와 코드가 불일치하면 코드 기준 답변 + 불일치 보고 + KB 업데이트 제안
- KB 절대 경로는 이 세션에 자동 로딩된 KB 경로 설정을 참조할 것
- 검색 시 인덱스에서 관련 노트를 특정할 것
  - kb-index.json 또는 .kb-index.local.json에서 tags/tldr을 Grep으로 키워드 검색
  - 인덱스가 작으면(50항목 이하) 전체 읽기도 가능
  - 두 인덱스의 항목을 합집합(Union)으로 병합하여 검색
- 인덱스의 tags, tldr로 관련성을 판단하고, 필요한 노트만 전체 읽기
- 검색 결과가 많으면 현재 repo 관련 노트를 먼저 확인하되, 다른 repo의 노트도 관련 있으면 포함할 것

## KB 기록 규칙
- 코딩/분석 중 새로운 비즈니스 룰, 코드 패턴, 장애 원인을 발견하면 KB에 기록 제안
- 기록 전에 반드시 KB 내 관련 노트를 먼저 검색할 것 (중복 방지)
- 유사한 노트가 있으면 새로 만들지 말고 기존 노트에 추가할 것
- 저장 전 사용자에게 경로/파일명을 보여주고 확인받을 것
- 폴더 선택 기준:
  - 비즈니스 룰 → rules/
  - 코드 분석 → analysis/
  - 의사결정 → decisions/
  - 장애 대응 → troubleshoot/
  - 확실하지 않으면 → drafts/
- frontmatter 필수: tags, tldr, created, updated
- 태그 네이밍: 네임스페이스는 `/`로 구분 (예: `repo/gmkt-dc-api`, `tech/redis`, `domain/coupon`)
- 템플릿(templates/)의 형식을 따를 것
- 노트를 생성/수정/이동한 직후, rebuild-index.sh를 실행하여 로컬 인덱스(.kb-index.local.json)를 최신화할 것

## KB 갭 인식
- KB 검색 결과 관련 노트가 없으면 사용자에게 알릴 것
- 코딩 중 해당 주제에 대한 정보를 파악하게 되면 KB 기록을 제안할 것
- 사용자가 "KB에서 찾아줘" 또는 "KB에 기록해줘"라고 말하면 해당 동작을 즉시 수행할 것

## KB 신뢰도
- global/: 전사 규칙, 최우선 적용
- rules/, decisions/: 팀 검증됨, 신뢰 가능
- analysis/, troubleshoot/: 분석 결과, 대체로 신뢰 가능
- drafts/: 미검증, 참고만
- archive/: 비활성, 최신 정보가 아닐 수 있음

## KB 도메인 용어
- 코딩/분석 중 도메인 특화 용어(비즈니스 용어, 약어, 내부 명칭)를 발견하면 KB에 정의를 기록할 것
- 기록 전 기존 용어집(있다면)을 먼저 확인하여 중복/모순을 방지할 것

## KB 보안
- KB에 credential, 접속 정보, API 키를 절대 포함하지 말 것

## KB 예외 처리
- git commit/push 시 pre-commit hook이 실패하면 재시도하지 말 것
- hook 실패 원인(민감정보 포함, frontmatter 누락 등)을 사용자에게 보고하고 수정 지시를 기다릴 것
