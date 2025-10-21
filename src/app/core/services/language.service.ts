import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Language, SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../models/language.model';
import { AuthService } from './auth.service';

/**
 * Internal state interface for LanguageService
 */
interface LanguageServiceState {
  currentLanguage: SupportedLanguageCode;
  isChanging: boolean;
  lastError: Error | null;
}

/**
 * LanguageService
 * Centralized service for managing application language (i18n)
 * Wraps ngx-translate and handles Firestore persistence
 *
 * @Injectable providedIn: 'root' (singleton)
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  // Dependencies (inject pattern in constructor for constitution compliance)
  private translateService: TranslateService;
  private firestore: Firestore;
  private authService: AuthService;

  // State management (BehaviorSubject pattern)
  private stateSubject: BehaviorSubject<LanguageServiceState>;

  // Public observables
  public readonly currentLanguage$: Observable<SupportedLanguageCode>;
  public readonly isChanging$: Observable<boolean>;
  public readonly lastError$: Observable<Error | null>;

  // Readonly property
  public readonly availableLanguages: readonly Language[] = SUPPORTED_LANGUAGES;

  constructor() {
    // Inject dependencies
    this.translateService = inject(TranslateService);
    this.firestore = inject(Firestore);
    this.authService = inject(AuthService);

    // Initialize state
    this.stateSubject = new BehaviorSubject<LanguageServiceState>({
      currentLanguage: 'tr',
      isChanging: false,
      lastError: null
    });

    // Create public observables from state
    this.currentLanguage$ = new Observable(subscriber => {
      this.stateSubject.subscribe(state => subscriber.next(state.currentLanguage));
    });

    this.isChanging$ = new Observable(subscriber => {
      this.stateSubject.subscribe(state => subscriber.next(state.isChanging));
    });

    this.lastError$ = new Observable(subscriber => {
      this.stateSubject.subscribe(state => subscriber.next(state.lastError));
    });
  }

  /**
   * Initialize language from Firestore settings or browser detection
   * Called via APP_INITIALIZER during app bootstrap
   */
  async initializeLanguage(): Promise<void> {
    try {
      // Wait for auth to initialize
      await firstValueFrom(
        this.authService.authInitialized$.pipe(
          filter(initialized => initialized)
        )
      );

      // Check if user is authenticated
      const user = this.authService.getCurrentUser();

      let languageCode: SupportedLanguageCode = 'tr'; // default

      if (user) {
        // Authenticated user: load from Firestore
        try {
          const settingsRef = doc(this.firestore, `users/${user.uid}/settings/preferences`);
          const snapshot = await getDoc(settingsRef);

          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data['language']) {
              languageCode = data['language'] as SupportedLanguageCode;
            } else {
              // No language preference saved, detect browser language
              languageCode = this.detectBrowserLanguage();
            }
          } else {
            // No settings document, use browser detection
            languageCode = this.detectBrowserLanguage();
          }
        } catch (error) {
          console.warn('Failed to load language from Firestore, using browser detection', error);
          languageCode = this.detectBrowserLanguage();
        }
      } else {
        // No user: use browser detection
        languageCode = this.detectBrowserLanguage();
      }

      // Set language in TranslateService
      await this.translateService.use(languageCode).toPromise();

      // Update state
      this.updateState({ currentLanguage: languageCode });
    } catch (error) {
      console.error('Language initialization failed, falling back to Turkish', error);
      // Fallback to Turkish
      await this.translateService.use('tr').toPromise();
      this.updateState({ currentLanguage: 'tr' });
    }
  }

  /**
   * Change current language
   * Updates TranslateService and persists to Firestore
   */
  async changeLanguage(languageCode: SupportedLanguageCode): Promise<void> {
    // Set loading state
    this.updateState({ isChanging: true, lastError: null });

    try {
      // Update TranslateService (UI updates immediately)
      await this.translateService.use(languageCode).toPromise();

      // Update state
      this.updateState({ currentLanguage: languageCode });

      // Persist to Firestore (best-effort, don't fail if this errors)
      try {
        const user = await this.authService.getCurrentUser();
        if (user) {
          const settingsRef = doc(this.firestore, `users/${user.uid}/settings/preferences`);
          await setDoc(settingsRef, { language: languageCode }, { merge: true });
        }
      } catch (persistError) {
        console.warn('Failed to persist language preference to Firestore', persistError);
        // Don't throw - UI language changed successfully
      }

      // Clear loading state
      this.updateState({ isChanging: false });
    } catch (error) {
      console.error('Language change failed', error);
      this.updateState({
        isChanging: false,
        lastError: error as Error
      });
      throw error; // Propagate to caller
    }
  }

  /**
   * Detect browser language and map to supported language
   * @returns Supported language code (fallback to 'en' for unsupported languages)
   */
  detectBrowserLanguage(): SupportedLanguageCode {
    const browserLang = navigator.language;
    const langCode = browserLang.substring(0, 2).toLowerCase();

    // Map to supported language
    if (langCode === 'tr') {
      return 'tr';
    }

    // Default fallback for all other languages (including 'en')
    return 'en';
  }

  /**
   * Internal method to update state
   */
  private updateState(partial: Partial<LanguageServiceState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      ...partial
    });
  }
}
