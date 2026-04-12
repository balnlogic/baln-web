# TypeScript 안전성 규칙 (baln-web)

> 근거: 금융 웹에서 타입 불일치는 런타임 오류로 이어져 잘못된 금융 데이터를 표시할 수 있으며, `tsc` 에러는 반드시 배포 전 0개를 유지해야 한다.

- [ ] `npx tsc --noEmit` 에러가 0개인가? (커밋 전 반드시 확인)
- [ ] `any` 타입을 새로 추가하지 않았는가? (부득이한 경우 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 주석 필수)
- [ ] 외부 금융 API 응답에 타입 가드 또는 `as` 캐스팅이 있는가? (예: `(data as ApiResponse).amount`)
- [ ] `useEffect` 의존성 배열이 완전한가? (누락된 deps가 없는가)
- [ ] 금액/숫자 관련 타입이 `number`로 명확하게 정의되어 있고 `string | number` 유니온을 피하는가?
- [ ] API 응답 인터페이스가 실제 서버 응답 스키마와 일치하는가?
- [ ] 선택적 프로퍼티(`?`)가 실제로 없을 수 있는 경우에만 사용하는가? (불필요한 optional 남용 금지)
- [ ] `strict` 모드가 `tsconfig.json`에 활성화되어 있는가?
