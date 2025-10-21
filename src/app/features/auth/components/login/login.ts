// T030: Login Component
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, ErrorMessageComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor() {
    // T041: Reactive form validasyonu
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // T045: Giriş yapmış kullanıcıyı home'a yönlendir
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.router.navigate(['/home']);
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email, password);
      // T045: Başarılı girişte home sayfasına yönlendir
      // Auth state güncellenene kadar bekle
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 100);
    } catch (error: any) {
      // T043: Kullanıcı dostu hata mesajı
      this.errorMessage = error.message;
      this.isLoading = false;
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
