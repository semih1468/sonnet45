# Tasks: Çoklu Dil Desteği (i18n)

**Input**: Design documents from `/specs/002-i18n-language-support/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/language-service.contract.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and i18n framework setup

- [ ] T001 Install @ngx-translate/core and @ngx-translate/http-loader dependencies via npm
- [ ] T002 Register locale data for tr-TR and en-US in src/app/app.config.ts
- [ ] T003 Configure TranslateModule with HttpLoader in src/app/app.config.ts
- [ ] T004 [P] Create assets/i18n/ directory structure
- [ ] T005 Hot reload validation: Run ng serve and verify compilation succeeds

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Create Language interface and SUPPORTED_LANGUAGES constant in src/app/core/models/language.model.ts
- [ ] T007 [P] Create SupportedLanguageCode type and TranslationKeyPrefix enum in src/app/core/models/language.model.ts
- [ ] T008 [P] Extend Settings interface with optional language field in src/app/core/models/settings.model.ts
- [ ] T009 [P] Create TranslationFile interface in src/app/core/models/language.model.ts
- [ ] T010 Hot reload validation: Run ng serve and verify no type errors

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Ayarlardan Dil Seçimi (Priority: P1) 🎯 MVP

**Goal**: Kullanıcı ayarlar sayfasından dil seçebilir, seçim Firestore'da saklanır ve uygulama yeniden başlatılınca korunur

**Independent Test**:
1. Ayarlar sayfasını aç
2. Dil seçiciden "English" seç
3. Sayfa anında İngilizceye geçmeli
4. Tarayıcıyı yenile → Dil İngilizce kalmalı

### Implementation for User Story 1

- [ ] T011 [US1] Create LanguageService skeleton with injectable decorator in src/app/core/services/language.service.ts
- [ ] T012 [US1] Implement currentLanguage$ BehaviorSubject and observable in src/app/core/services/language.service.ts
- [ ] T013 [US1] Implement isChanging$ BehaviorSubject and observable in src/app/core/services/language.service.ts
- [ ] T014 [US1] Implement lastError$ BehaviorSubject and observable in src/app/core/services/language.service.ts
- [ ] T015 [US1] Add availableLanguages readonly property (SUPPORTED_LANGUAGES) in src/app/core/services/language.service.ts
- [ ] T016 [US1] Inject TranslateService, SettingsService, AuthService in LanguageService constructor in src/app/core/services/language.service.ts
- [ ] T017 [US1] Implement detectBrowserLanguage() method with navigator.language logic in src/app/core/services/language.service.ts
- [ ] T018 [US1] Implement initializeLanguage() method with Firestore load and browser detection in src/app/core/services/language.service.ts
- [ ] T019 [US1] Implement changeLanguage() method with TranslateService.use() and Firestore persistence in src/app/core/services/language.service.ts
- [ ] T020 [US1] Add APP_INITIALIZER factory function for language initialization in src/app/app.config.ts
- [ ] T021 [US1] Register LanguageService with APP_INITIALIZER in providers array in src/app/app.config.ts
- [ ] T022 [US1] Extend SettingsService with updateLanguage() method in src/app/core/services/settings.service.ts
- [ ] T023 [US1] Extend SettingsService getSettings() to include language field mapping in src/app/core/services/settings.service.ts
- [ ] T024 [US1] Import TranslatePipe in SettingsComponent standalone imports in src/app/features/settings/settings.component.ts
- [ ] T025 [US1] Inject LanguageService in SettingsComponent constructor in src/app/features/settings/settings.component.ts
- [ ] T026 [US1] Create currentLang$ observable property from languageService.currentLanguage$ in src/app/features/settings/settings.component.ts
- [ ] T027 [US1] Create isChangingLanguage$ observable property from languageService.isChanging$ in src/app/features/settings/settings.component.ts
- [ ] T028 [US1] Create languages property from languageService.availableLanguages in src/app/features/settings/settings.component.ts
- [ ] T029 [US1] Implement onLanguageChange() method with try-catch and error handling in src/app/features/settings/settings.component.ts
- [ ] T030 [US1] Add language selector section in settings template with dark mode classes in src/app/features/settings/settings.component.html
- [ ] T031 [US1] Add select dropdown with @for loop over languages in src/app/features/settings/settings.component.html
- [ ] T032 [US1] Bind select value to currentLang$ with async pipe in src/app/features/settings/settings.component.html
- [ ] T033 [US1] Add (change) event handler calling onLanguageChange() in src/app/features/settings/settings.component.html
- [ ] T034 [US1] Add disabled attribute bound to isChangingLanguage$ with async pipe in src/app/features/settings/settings.component.html
- [ ] T035 [US1] Add ARIA label for accessibility in language selector in src/app/features/settings/settings.component.html
- [ ] T036 [US1] Add loading indicator shown when isChangingLanguage$ is true in src/app/features/settings/settings.component.html
- [ ] T037 [US1] Hot reload validation: Test language switch in settings page and verify no console errors

**Checkpoint**: At this point, User Story 1 should be fully functional - dil seçimi çalışıyor, Firestore'a kaydediliyor, persist ediliyor

---

## Phase 4: User Story 2 - Tüm UI Metinlerinin Çevirisi (Priority: P2)

**Goal**: Tüm uygulama metinleri (auth, home, tasks, history, statistics, settings, hata mesajları) Türkçe ve İngilizce çevrilir

**Independent Test**:
1. Dil İngilizceye çevir
2. Tüm sayfalarda gezin (auth, home, tasks, history, statistics, settings)
3. Tüm buton, label, placeholder, hata mesajlarının İngilizce olduğunu doğrula

### Translation File Creation

- [ ] T038 [P] [US2] Create initial tr.json with common translations (common.save, common.cancel, common.delete, etc.) in assets/i18n/tr.json
- [ ] T039 [P] [US2] Create initial en.json with common translations in assets/i18n/en.json
- [ ] T040 [P] [US2] Add auth module translations (auth.login.*, auth.register.*, auth.forgotPassword.*) to assets/i18n/tr.json
- [ ] T041 [P] [US2] Add auth module translations to assets/i18n/en.json
- [ ] T042 [P] [US2] Add home module translations (home.welcome, home.quickActions.*, etc.) to assets/i18n/tr.json
- [ ] T043 [P] [US2] Add home module translations to assets/i18n/en.json
- [ ] T044 [P] [US2] Add tasks module translations (tasks.title, tasks.create.*, tasks.list.*, etc.) to assets/i18n/tr.json
- [ ] T045 [P] [US2] Add tasks module translations to assets/i18n/en.json
- [ ] T046 [P] [US2] Add history module translations (history.title, history.filter.*, etc.) to assets/i18n/tr.json
- [ ] T047 [P] [US2] Add history module translations to assets/i18n/en.json
- [ ] T048 [P] [US2] Add statistics module translations (statistics.title, statistics.charts.*, etc.) to assets/i18n/tr.json
- [ ] T049 [P] [US2] Add statistics module translations to assets/i18n/en.json
- [ ] T050 [P] [US2] Add settings module translations (settings.title, settings.theme.*, settings.language.*, etc.) to assets/i18n/tr.json
- [ ] T051 [P] [US2] Add settings module translations to assets/i18n/en.json
- [ ] T052 [P] [US2] Add error messages translations (errors.auth.*, errors.firebase.*, errors.validation.*) to assets/i18n/tr.json
- [ ] T053 [P] [US2] Add error messages translations to assets/i18n/en.json
- [ ] T054 [P] [US2] Add success messages translations (success.saved, success.deleted, etc.) to assets/i18n/tr.json
- [ ] T055 [P] [US2] Add success messages translations to assets/i18n/en.json

### Component Template Conversion

- [ ] T056 [US2] Import TranslatePipe in AuthLoginComponent and convert template strings in src/app/features/auth/login/login.component.ts and .html
- [ ] T057 [US2] Import TranslatePipe in AuthRegisterComponent and convert template strings in src/app/features/auth/register/register.component.ts and .html
- [ ] T058 [US2] Import TranslatePipe in HomeComponent and convert template strings in src/app/features/home/home.component.ts and .html
- [ ] T059 [US2] Import TranslatePipe in TasksComponent and convert template strings in src/app/features/tasks/tasks.component.ts and .html
- [ ] T060 [US2] Import TranslatePipe in HistoryComponent and convert template strings in src/app/features/history/history.component.ts and .html
- [ ] T061 [US2] Import TranslatePipe in StatisticsComponent and convert template strings in src/app/features/statistics/statistics.component.ts and .html
- [ ] T062 [US2] Update SettingsComponent template to use translate pipe for all existing UI strings in src/app/features/settings/settings.component.html
- [ ] T063 [US2] Import TranslateService in shared components and convert programmatic strings in src/app/shared/
- [ ] T064 [US2] Convert error messages in AuthService to use TranslateService.get() in src/app/core/services/auth.service.ts
- [ ] T065 [US2] Convert error messages in TaskService to use TranslateService.get() in src/app/core/services/task.service.ts
- [ ] T066 [US2] Convert error messages in StatisticsService to use TranslateService.get() in src/app/core/services/statistics.service.ts
- [ ] T067 [US2] Hot reload validation: Navigate to all pages and verify translations display correctly

**Checkpoint**: All user stories 1 and 2 should now work - dil seçimi + tüm UI metinleri çevrilmiş

---

## Phase 5: User Story 3 - Tarayıcı Dil Tercihi Algılama (Priority: P3)

**Goal**: Yeni kullanıcı ilk kez uygulamaya girdiğinde tarayıcı dilini algıla ve otomatik olarak uygula

**Independent Test**:
1. Yeni bir kullanıcı kaydı oluştur (veya mevcut kullanıcı settings.language'ı sil)
2. Tarayıcı dilini İngilizce yap
3. Uygulamayı aç
4. Varsayılan dilin İngilizce olduğunu doğrula

### Implementation for User Story 3

- [ ] T068 [US3] Verify detectBrowserLanguage() implementation handles all cases (tr-TR → tr, en-US → en, fr-FR → en fallback) in src/app/core/services/language.service.ts
- [ ] T069 [US3] Update initializeLanguage() to call detectBrowserLanguage() when settings.language is undefined in src/app/core/services/language.service.ts
- [ ] T070 [US3] Test browser detection with different navigator.language values (manual browser settings test)
- [ ] T071 [US3] Hot reload validation: Test with cleared Firestore settings and different browser languages

**Checkpoint**: All user stories (1, 2, 3) should now be independently functional - full i18n feature complete

---

## Phase 6: Testing & Polish

**Purpose**: Quality assurance and cross-cutting improvements

- [ ] T072 [P] Create LanguageService unit tests in src/app/core/services/language.service.spec.ts
- [ ] T073 [P] Test initializeLanguage() with authenticated user and Firestore settings in src/app/core/services/language.service.spec.ts
- [ ] T074 [P] Test initializeLanguage() with new user and browser detection in src/app/core/services/language.service.spec.ts
- [ ] T075 [P] Test changeLanguage() success flow with TranslateService and Firestore mocks in src/app/core/services/language.service.spec.ts
- [ ] T076 [P] Test changeLanguage() error handling (network failure, Firestore error) in src/app/core/services/language.service.spec.ts
- [ ] T077 [P] Test detectBrowserLanguage() with various navigator.language values in src/app/core/services/language.service.spec.ts
- [ ] T078 [P] Test observable state changes (currentLanguage$, isChanging$, lastError$) in src/app/core/services/language.service.spec.ts
- [ ] T079 [P] Create integration test for language persistence in Firestore in tests/integration/language-persistence.spec.ts
- [ ] T080 [P] Verify no missing translation keys (console warnings check) across all pages
- [ ] T081 [P] Verify dark mode compatibility with language selector UI
- [ ] T082 [P] Verify accessibility (keyboard navigation, ARIA labels) in language selector
- [ ] T083 Run quickstart.md validation guide end-to-end
- [ ] T084 Performance test: Verify changeLanguage() completes in <500ms (SC-002 requirement)
- [ ] T085 Performance test: Verify app initialization with language load is <500ms (SC-002 requirement)
- [ ] T086 Update CLAUDE.md if any new patterns or technologies were added during implementation
- [ ] T087 Final hot reload validation: ng serve running, test all features, no errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - Or if multiple developers: US1, US2, US3 can be worked in parallel after foundational
- **Testing & Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (requires LanguageService and TranslateModule setup) - Uses translation infrastructure from US1
- **User Story 3 (P3)**: Depends on US1 (extends initializeLanguage() logic) - Uses LanguageService from US1

### Within Each User Story

**US1 (Ayarlardan Dil Seçimi)**:
- T011-T019 (LanguageService implementation) → T020-T023 (integration) → T024-T037 (UI)

**US2 (UI Çevirileri)**:
- T038-T055 (translation files) can all run in parallel
- T056-T067 (component conversion) can run in parallel with file creation
- Must wait for US1 TranslateModule setup to be complete

**US3 (Tarayıcı Algılama)**:
- T068-T071 sequential (extends US1 LanguageService)

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 sequential (npm + config), T004 parallel
- **Phase 2**: T006-T009 all parallel (different model files)
- **Phase 3 (US1)**: T011-T015 sequential (same service file), T024-T028 sequential (same component)
- **Phase 4 (US2)**: T038-T055 all parallel (translation files), T056-T067 all parallel (different components)
- **Phase 6**: T072-T082 all parallel (different test files)

---

## Implementation Strategy

### MVP First (User Story 1 + US2 Auth Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Dil seçimi)
4. Complete US2 T038-T041 + T056-T057 (Sadece Auth sayfası çevirisi)
5. **STOP and VALIDATE**: Dil seçimi + Login/Register çevirileri çalışıyor mu?
6. Deploy/demo minimal working i18n

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Language switching works ✅
3. Add User Story 2 (all pages) → Test independently → All UI translated ✅
4. Add User Story 3 → Test independently → Browser detection works ✅
5. Each story adds value without breaking previous stories

### Sequential (Recommended for Solo Developer)

1. Setup → Foundational → US1 → US2 → US3 → Testing & Polish
2. Validate hot reload after each task
3. Test each user story checkpoint before proceeding

---

## Hot Reload Validation Checklist

After **EVERY** task that modifies code:

1. ✅ **Terminal Check**: ng serve compilation successful? No errors?
2. ✅ **Browser Console**: No runtime errors or warnings?
3. ✅ **Functionality Test**:
   - Settings → Select English → All visible UI updates?
   - Navigate to different pages → Translations persist?
4. ✅ **Dark Mode Test**: Language selector readable in dark mode?
5. ✅ **TypeScript Check**: No type errors shown in IDE?

**Kritik Validation Points**:
- After T005 (Setup complete)
- After T010 (Foundational complete)
- After T037 (US1 complete)
- After T067 (US2 complete)
- After T071 (US3 complete)
- After T087 (Final validation)

---

## Notes

- [P] tasks = different files, can run in parallel
- [US#] label maps task to specific user story for traceability
- Each user story should be independently testable
- Commit after each logical group (e.g., after each service implementation, after each component conversion)
- Stop at any checkpoint to validate story independently
- Translation keys use flat structure: `"auth.login.submit"` not nested objects
- All UI strings must have both tr.json and en.json entries
- Missing translations fall back to English (SC-006 compliance)
- Performance target: <500ms for language change (SC-002)
- Offline support: Firestore persistence cache ensures language preference survives offline mode

---

**Task Count**: 87 tasks total
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 5 tasks (BLOCKING)
- Phase 3 (US1): 27 tasks
- Phase 4 (US2): 30 tasks
- Phase 5 (US3): 4 tasks
- Phase 6 (Testing & Polish): 16 tasks

**Estimated Effort**: ~15-20 hours for solo developer (sequential), ~8-10 hours with 2 developers (parallel US1 + US2)

**Constitution Compliance**: ✅ All 5 principles validated in plan.md

**Next Command**: `/speckit.implement` (to begin task execution) or manual task execution starting with T001
