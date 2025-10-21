// T105: Tasks Component - Görev yönetimi sayfası
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { Task, CreateTaskDto, TaskPriority } from '../../core/models/task.model';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
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
  viewMode: 'active' | 'completed' | 'all' = 'active';

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
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
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
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
    if (this.taskForm.invalid) return;

    try {
      const taskDto: CreateTaskDto = {
        ...this.taskForm.value,
        dueDate: this.taskForm.value.dueDate ? new Date(this.taskForm.value.dueDate) : undefined
      };

      await this.taskService.createTask(taskDto);
      this.toggleAddForm();
      await this.loadTasks();
    } catch (error) {
      console.error('Görev oluşturulurken hata:', error);
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

  async deleteTask(taskId: string) {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;

    try {
      await this.taskService.deleteTask(taskId);
      await this.loadTasks();
    } catch (error) {
      console.error('Görev silinirken hata:', error);
    }
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

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return dueDate < new Date();
  }
}
