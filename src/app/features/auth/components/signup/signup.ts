// T033: Signup Component
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, ErrorMessageComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  standalone: true
})
export class SignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor() {
    // T042: Reactive form validasyonu
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
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
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    // Şifre eşleşmesi kontrolü
    if (this.signupForm.value.password !== this.signupForm.value.confirmPassword) {
      this.errorMessage = 'Şifreler eşleşmiyor';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.signupForm.value;

    try {
      await this.authService.signup(email, password);
      // T045: Başarılı kayıtta home sayfasına yönlendir
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
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }

  get fullName() {
    return this.signupForm.get('fullName');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
