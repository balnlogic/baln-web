# Supabase 안전성 규칙 (kkeullim)

> 근거: 데이팅앱 특성상 사용자 개인정보가 집중되어 있고, RLS 누락 시 전체 사용자 데이터가 노출될 수 있다.

- [ ] 모든 테이블에 RLS(Row Level Security) 정책이 활성화되어 있는가?
- [ ] `supabase` 클라이언트를 클라이언트 사이드에서 초기화할 때 `anon key`만 사용하는가? (`service_role` key는 서버/Edge Function 전용)
- [ ] Supabase 대시보드에서 직접 테이블 스키마를 수정하지 않는가? (마이그레이션 파일을 통해서만 변경)
- [ ] Edge Function 배포 후 `supabase functions list`로 실제 배포 확인을 했는가?
- [ ] 사용자 매치 데이터(`matches` 테이블)에 상대방이 자기 매치 정보만 볼 수 있는 RLS가 적용되어 있는가?
- [ ] 프로필 이미지 Storage 버킷에 인증된 사용자만 업로드 가능한 정책이 있는가?
- [ ] `simulate-activity` Edge Function의 cron 실행 로그를 주기적으로 확인하는가?
- [ ] `.env` 또는 `app.config.js`에 Supabase URL/키가 있고 `.gitignore`에 포함되어 있는가?
