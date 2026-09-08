# 서버 채점 검증 — 2026-09-08

대상: `../hidden-picture-game-backend`의 현재 코드와 플레이어의 답변 전송 형식.

## 검증 방법과 결과

- 서버 소스를 `.server-validation.local/backend`에 복사하여 검증했다. 원본 서버 저장소는 변경하지 않았다.
- 검증용 JDK 17과 Gradle 8.14.3을 사용했다. Spring 통합 테스트는 H2, 채점 단위 테스트는 모의 저장소를 사용했다.
- 기존 테스트 3개와 추가 테스트 21개, 총 24개 실행: 실패 0개, 오류 0개.
- 추가 테스트에는 현재 결함을 재현하는 테스트도 포함된다. 테스트 통과가 모든 동작의 정상 여부를 의미하지는 않는다.
- HTTP 검증은 MockMvc를 사용했다. 배포된 서버·운영 DB와의 실제 브라우저 통합 테스트는 수행하지 않았다.

## 정상 확인

- 서버 `ErrorArea.contains`는 이미지 전체를 1로 보는 비율 좌표를 사용한다. 수정된 프론트엔드의 좌표 형식과 일치한다.
- 정답 사각형 내부와 네 모서리는 정답, 사각형 바로 바깥과 영역 밖 이미지 모서리는 오답으로 판정한다.
- 오류가 있는 사진에서 ‘오류 없음’ 선택은 오답이다.
- 오류가 없는 사진에서 ‘오류 없음’ 선택은 정답이고, 사진 클릭은 오답이다.
- `(0.7, 0.35)` 좌표가 HTTP 요청 역직렬화, 서버 채점, 저장 및 응답 과정에서 유지된다.
- HTTP 통합 테스트에서 5개 답변의 정답 수 3개, 정답률 0.6과 개별 정오답을 확인했다.

## 확인된 결함

1. **시간 초과가 정답으로 집계될 수 있음**
   - `GameScreen.tsx`의 시간 초과와 ‘오류 없음’ 버튼이 모두 `submitAnswer(null)`을 호출한다.
   - 둘 다 `hasError: false`, 좌표 없음으로 전송되며 `AnswerRequest`에는 시간 초과 구분 필드가 없다.
   - 서버 `GameService.isCorrect`는 오류가 없는 사진이면 이를 정답으로 처리한다. 단위 테스트와 HTTP 통합 테스트에서 재현했다.
   - `GameResultMapper`의 사용자 선택 표시 역시 ‘오류 없음’으로 생성된다.
   - 수정 방향: 시간 초과를 별도 답변 상태로 전송·저장하고, 항상 오답으로 채점하며 결과에도 시간 초과로 표시한다.

2. **게임 진행 중 문제 비활성화 시 올바른 답도 오답 처리됨**
   - `GameService.submit`은 제출 시점에 활성 상태인 문제만 조회한다.
   - 출제 후 비활성화된 문제는 조회 결과에 없어 정답 좌표를 제출해도 오답이 된다. 모의 저장소 테스트에서 재현했다.
   - 수정 방향: 세션에 출제 문제와 정답 데이터를 고정하여 해당 기준으로 채점한다.

3. **같은 문제의 중복 답변이 중복 집계됨**
   - `GameService.submit`은 문제 ID 중복 여부를 검사하지 않고 모든 답변을 집계한다.
   - 같은 정답을 두 번 전달하면 정답 답변이 두 건 저장되는 것을 재현했다.
   - 수정 방향: 세션의 출제 목록과 제출 목록을 대조하여 중복·누락·출제되지 않은 문제를 검증한다.

## 로컬 검증 자료

- [Gradle 테스트 보고서](../.server-validation.local/backend/build/reports/tests/test/index.html)
- [추가 채점 테스트](../.server-validation.local/backend/src/test/java/com/infectioncontrol/detective/service/GameScoringVerificationTests.java)
- [HTTP 통합 테스트](../.server-validation.local/backend/src/test/java/com/infectioncontrol/detective/controller/GameControllerTests.java)

`.server-validation.local`은 Git 제외 대상인 로컬 검증 폴더다. 이번 작업은 검증이며, 위 결함의 서비스 코드 수정은 포함하지 않는다.
