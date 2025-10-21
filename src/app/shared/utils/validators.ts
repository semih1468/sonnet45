// T020: Custom Validators
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Sürenin belirtilen aralıkta olup olmadığını kontrol eder (saniye cinsinden)
   */
  static durationRange(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null; // Don't validate empty values
      }

      const numValue = Number(value);

      if (isNaN(numValue)) {
        return { invalidNumber: true };
      }

      if (numValue < min) {
        return { minDuration: { min, actual: numValue } };
      }

      if (numValue > max) {
        return { maxDuration: { max, actual: numValue } };
      }

      return null;
    };
  }

  /**
   * String'in boşluk karakterlerinden oluşmadığını kontrol eder
   */
  static notOnlyWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined) {
        return null;
      }

      if (typeof value === 'string' && value.trim().length === 0) {
        return { onlyWhitespace: true };
      }

      return null;
    };
  }

  /**
   * Pozitif sayı kontrolü
   */
  static positiveNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null;
      }

      const numValue = Number(value);

      if (isNaN(numValue)) {
        return { invalidNumber: true };
      }

      if (numValue <= 0) {
        return { notPositive: true };
      }

      return null;
    };
  }

  /**
   * Görev başlığı validasyonu (1-200 karakter, boşluk olamaz)
   */
  static taskTitle(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return { required: true };
      }

      const trimmed = value.trim();

      if (trimmed.length === 0) {
        return { onlyWhitespace: true };
      }

      if (trimmed.length < 1 || trimmed.length > 200) {
        return { invalidLength: { min: 1, max: 200, actual: trimmed.length } };
      }

      return null;
    };
  }
}
