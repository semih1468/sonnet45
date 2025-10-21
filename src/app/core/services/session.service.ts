// T052: Session Service - Pomodoro oturumlarını yönetme
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Session, SessionStatus } from '../models/session.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // T053: Yeni session oluştur
  async createSession(taskId?: string): Promise<string> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const sessionsRef = collection(this.firestore, `users/${user.uid}/sessions`);

    const newSession: Omit<Session, 'id'> = {
      userId: user.uid,
      taskId: taskId || null,
      startTime: serverTimestamp() as Timestamp,
      endTime: null,
      duration: 0,
      status: 'active',
      completedAt: null,
      notes: null
    };

    const docRef = await addDoc(sessionsRef, newSession);
    return docRef.id;
  }

  // T053: Session'ı tamamla
  async completeSession(sessionId: string, duration: number, notes?: string): Promise<void> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const sessionRef = doc(this.firestore, `users/${user.uid}/sessions/${sessionId}`);

    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      duration: duration,
      status: 'completed' as SessionStatus,
      completedAt: serverTimestamp(),
      notes: notes || null
    });
  }

  // T053: Session'ı iptal et
  async cancelSession(sessionId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const sessionRef = doc(this.firestore, `users/${user.uid}/sessions/${sessionId}`);

    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      status: 'cancelled' as SessionStatus
    });
  }

  // T054: Bugünün sessionlarını getir
  async getTodaySessions(): Promise<Session[]> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsRef = collection(this.firestore, `users/${user.uid}/sessions`);
    const q = query(
      sessionsRef,
      where('startTime', '>=', Timestamp.fromDate(today)),
      where('status', '==', 'completed'),
      orderBy('startTime', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
  }

  // T054: Son N session'ı getir
  async getRecentSessions(limitCount: number = 10): Promise<Session[]> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const sessionsRef = collection(this.firestore, `users/${user.uid}/sessions`);
    const q = query(
      sessionsRef,
      where('status', '==', 'completed'),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
  }

  // T054: Belirli bir task için sessionları getir
  async getSessionsByTask(taskId: string): Promise<Session[]> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const sessionsRef = collection(this.firestore, `users/${user.uid}/sessions`);
    const q = query(
      sessionsRef,
      where('taskId', '==', taskId),
      where('status', '==', 'completed'),
      orderBy('startTime', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
  }

  // Tarih aralığına göre sessionları getir
  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const sessionsRef = collection(this.firestore, `users/${user.uid}/sessions`);
    const q = query(
      sessionsRef,
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      where('status', '==', 'completed'),
      orderBy('startTime', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
  }
}
