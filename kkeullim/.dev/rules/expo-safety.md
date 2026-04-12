# Expo 안전성 규칙 (kkeullim)

> 근거: Expo SDK 55에서 deprecated된 API를 사용하면 런타임 경고 또는 빌드 실패가 발생하며, EAS 빌드 사용 시 비용 및 CI 의존성이 생긴다.

- [ ] `eas build`, `eas submit`, `eas update` 명령을 절대 사용하지 않는가? (로컬 빌드만 허용: `expo run:ios`)
- [ ] `expo-constants`에서 deprecated된 `Constants.manifest` 대신 `Constants.expoConfig`를 사용하는가?
- [ ] `@react-native-async-storage/async-storage`를 `expo-secure-store` 대신 민감 데이터에 사용하지 않는가?
- [ ] `expo-permissions` 대신 각 기능별 전용 권한 모듈 (`expo-camera`, `expo-location` 등)을 사용하는가?
- [ ] `expo-modules-core`의 네이티브 모듈 import 경로가 SDK 55 기준인가?
- [ ] `app.json`의 `sdkVersion`이 `"55.0.0"`으로 고정되어 있는가?
- [ ] iOS 빌드 전 `npx expo prebuild --clean`으로 네이티브 코드를 재생성했는가?
- [ ] `package.json`의 peer dependency 경고가 없는가? (`npx expo install --check`로 확인)
