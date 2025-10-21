// T028: AuthService Interface ve Implementation
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
  UserCredential
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private authInitializedSubject = new BehaviorSubject<boolean>(false);
  public authInitialized$ = this.authInitializedSubject.asObservable();

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          createdAt: new Date(firebaseUser.metadata.creationTime!),
          lastLoginAt: new Date()
        };
        this.userSubject.next(user);
      } else {
        this.userSubject.next(null);
      }
      // Mark auth as initialized after first state change
      if (!this.authInitializedSubject.value) {
        this.authInitializedSubject.next(true);
      }
    });
  }

  // T037: Signup metodu
  async signup(email: string, password: string): Promise<UserCredential> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);

      // Firestore'da user dokümantı oluştur
      const userRef = doc(this.firestore, `users/${credential.user.uid}`);
      await setDoc(userRef, {
        email: credential.user.email,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      return credential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // T038: Login metodu
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);

      // lastLoginAt'i güncelle
      const userRef = doc(this.firestore, `users/${credential.user.uid}`);
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      return credential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // T039: Logout metodu
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.userSubject.next(null);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // T040: Mevcut kullanıcıyı getir
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  // T043: Firebase hata kodlarını kullanıcı dostu mesajlara çevir
  private handleAuthError(error: any): Error {
    let message = 'Bir hata oluştu';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Bu e-posta adresi zaten kullanımda';
        break;
      case 'auth/invalid-email':
        message = 'Geçersiz e-posta adresi';
        break;
      case 'auth/operation-not-allowed':
        message = 'İşlem şu anda kullanılamıyor';
        break;
      case 'auth/weak-password':
        message = 'Şifre en az 6 karakter olmalıdır';
        break;
      case 'auth/user-disabled':
        message = 'Bu hesap devre dışı bırakılmış';
        break;
      case 'auth/user-not-found':
        message = 'Kullanıcı bulunamadı';
        break;
      case 'auth/wrong-password':
        message = 'Hatalı şifre';
        break;
      case 'auth/invalid-credential':
        message = 'E-posta veya şifre hatalı';
        break;
      case 'auth/network-request-failed':
        message = 'İnternet bağlantınızı kontrol edin';
        break;
      default:
        message = error.message || 'Beklenmeyen bir hata oluştu';
    }

    return new Error(message);
  }
}
