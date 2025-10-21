// T105: Tasks Component - Görev yönetimi sayfası
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { Task, CreateTaskDto, TaskPriority } from '../../core/models/task.model';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
  standalone: true
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private fb = inject(FormBuilder);

  tasks: Task[] = [];
  isLoading = true;
  showAddForm = false;
  showEditForm = false;
  editingTask: Task | null = null;
  selectedTaskMenu: Task | null = null;
  viewMode: 'active' | 'completed' | 'all' = 'active';

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    priority: ['medium'],
    estimatedPomodoros: [1, [Validators.min(1)]],
    dueDate: [null],
    tags: [[]]
  });

  async ngOnInit() {
    await this.loadTasks();
  }

  async loadTasks() {
    this.isLoading = true;

    try {
      console.log('Tasklar yükleniyor, viewMode:', this.viewMode);
      switch (this.viewMode) {
        case 'active':
          this.tasks = await this.taskService.getActiveTasks();
          break;
        case 'completed':
          this.tasks = await this.taskService.getCompletedTasks();
          break;
        case 'all':
          this.tasks = await this.taskService.getAllTasks();
          break;
      }
      console.log('Yüklenen task sayısı:', this.tasks.length, this.tasks);
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
      alert('Görevler yüklenirken hata: ' + (error as any).message);
    } finally {
      this.isLoading = false;
    }
  }

  async changeViewMode(mode: 'active' | 'completed' | 'all') {
    this.viewMode = mode;
    await this.loadTasks();
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.taskForm.reset({
        priority: 'medium',
        estimatedPomodoros: 1
      });
    }
  }

  async onSubmit() {
    if (this.taskForm.invalid) {
      console.log('Form geçersiz:', this.taskForm.errors);
      return;
    }

    try {
      const taskDto: CreateTaskDto = {
        ...this.taskForm.value,
        dueDate: this.taskForm.value.dueDate ? new Date(this.taskForm.value.dueDate) : undefined
      };

      console.log('Task oluşturuluyor:', taskDto);
      const taskId = await this.taskService.createTask(taskDto);
      console.log('Task başarıyla oluşturuldu, ID:', taskId);
      this.toggleAddForm();
      await this.loadTasks();
      console.log('Yüklenen tasklar:', this.tasks);
    } catch (error) {
      console.error('Görev oluşturulurken hata:', error);
      alert('Görev oluşturulurken hata: ' + (error as any).message);
    }
  }

  async markAsCompleted(taskId: string) {
    try {
      await this.taskService.updateTask(taskId, { status: 'completed' });
      await this.loadTasks();
    } catch (error) {
      console.error('Görev tamamlanırken hata:', error);
    }
  }

  toggleTaskMenu(task: Task) {
    this.selectedTaskMenu = this.selectedTaskMenu?.id === task.id ? null : task;
  }

  editTask(task: Task) {
    this.editingTask = task;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      estimatedPomodoros: task.estimatedPomodoros,
      dueDate: task.dueDate ? this.formatDateForInput(task.dueDate) : null,
      tags: task.tags || []
    });
    this.showEditForm = true;
    this.selectedTaskMenu = null;
  }

  async deleteTask(task: Task) {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;

    try {
      await this.taskService.deleteTask(task.id);
      await this.loadTasks();
      this.selectedTaskMenu = null;
    } catch (error) {
      console.error('Görev silinirken hata:', error);
    }
  }

  formatDateForInput(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  getProgressPercentage(task: Task): number {
    if (task.estimatedPomodoros === 0) return 0;
    return Math.min(100, Math.round((task.completedPomodoros / task.estimatedPomodoros) * 100));
  }

  getPriorityColor(priority: string): string {
    return this.taskService.getPriorityColor(priority);
  }

  getPriorityText(priority: string): string {
    return this.taskService.getPriorityText(priority);
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  async toggleTaskStatus(task: Task) {
    try {
      const newStatus = task.status === 'completed' ? 'active' : 'completed';
      await this.taskService.updateTask(task.id, { status: newStatus });
      await this.loadTasks();
    } catch (error) {
      console.error('Görev durumu değiştirilirken hata:', error);
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return dueDate < new Date();
  }
}
