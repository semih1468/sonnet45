// T097: Task Service - Görev yönetimi servisi
import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore;
  private authService: AuthService;

  constructor() {
    this.firestore = inject(Firestore);
    this.authService = inject(AuthService);
  }

  // T098: Yeni görev oluştur
  async createTask(taskDto: CreateTaskDto): Promise<string> {
    const user = this.authService.getCurrentUser();
    console.log('createTask - Current user:', user);
    if (!user) {
      throw new Error('Kullanıcı giriş yapmamış');
    }

    const path = `users/${user.uid}/tasks`;
    console.log('createTask - Firestore path:', path);
    const tasksRef = collection(this.firestore, path);
    const newTask: Omit<Task, 'id'> = {
      userId: user.uid,
      title: taskDto.title,
      description: taskDto.description || null,
      status: 'active',
      priority: taskDto.priority || 'medium',
      estimatedPomodoros: taskDto.estimatedPomodoros || 1,
      completedPomodoros: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      completedAt: null,
      dueDate: taskDto.dueDate ? Timestamp.fromDate(taskDto.dueDate) : null,
      tags: taskDto.tags || []
    };

    console.log('createTask - Creating task:', newTask);
    const docRef = await addDoc(tasksRef, newTask);
    console.log('createTask - Task created with ID:', docRef.id);
    return docRef.id;
  }

  // T099: Görevi güncelle
  async updateTask(taskId: string, updateDto: UpdateTaskDto): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Kullanıcı giriş yapmamış');
    }

    const taskRef = doc(this.firestore, `users/${user.uid}/tasks/${taskId}`);

    const updateData: any = {
      ...updateDto,
      updatedAt: serverTimestamp()
    };

    // Status completed olarak değiştiriliyorsa completedAt ekle
    if (updateDto.status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }

    // DueDate varsa Timestamp'e çevir
    if (updateDto.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updateDto.dueDate);
    }

    await updateDoc(taskRef, updateData);
  }

  // T100: Görevi sil
  async deleteTask(taskId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Kullanıcı giriş yapmamış');
    }

    const taskRef = doc(this.firestore, `users/${user.uid}/tasks/${taskId}`);
    await deleteDoc(taskRef);
  }

  // T101: Kullanıcının aktif görevlerini getir
  async getActiveTasks(): Promise<Task[]> {
    const user = this.authService.getCurrentUser();
    console.log('getActiveTasks - Current user:', user);
    if (!user) {
      console.log('getActiveTasks - No user logged in');
      return [];
    }

    const path = `users/${user.uid}/tasks`;
    console.log('getActiveTasks - Firestore path:', path);
    const tasksRef = collection(this.firestore, path);
    const q = query(
      tasksRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    console.log('getActiveTasks - Executing query...');
    const querySnapshot = await getDocs(q);
    console.log('getActiveTasks - Query result, docs count:', querySnapshot.docs.length);
    const tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));

    console.log('getActiveTasks - Tasks before sorting:', tasks);

    // Client-side priority sorting
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }

  // T102: Tamamlanmış görevleri getir
  async getCompletedTasks(): Promise<Task[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    const tasksRef = collection(this.firestore, `users/${user.uid}/tasks`);
    const q = query(
      tasksRef,
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }

  // T103: Tüm görevleri getir
  async getAllTasks(): Promise<Task[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    const tasksRef = collection(this.firestore, `users/${user.uid}/tasks`);
    const q = query(
      tasksRef,
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }

  // T104: Görevin pomodoro sayısını artır
  async incrementTaskPomodoro(taskId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const taskRef = doc(this.firestore, `users/${user.uid}/tasks/${taskId}`);

    // Mevcut task'ı getir
    const tasksRef = collection(this.firestore, `users/${user.uid}/tasks`);
    const q = query(tasksRef);
    const querySnapshot = await getDocs(q);

    const taskDoc = querySnapshot.docs.find(d => d.id === taskId);
    if (!taskDoc) return;

    const task = taskDoc.data() as Task;
    const newCount = (task.completedPomodoros || 0) + 1;

    await updateDoc(taskRef, {
      completedPomodoros: newCount,
      updatedAt: serverTimestamp()
    });
  }

  // Priority badge color
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Priority text
  getPriorityText(priority: string): string {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  }
}
