import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  imports: [CommonModule],
  templateUrl: './error-message.html',
  styleUrl: './error-message.scss',
  standalone: true
})
export class ErrorMessageComponent {
  @Input() message: string = '';
  @Input() show: boolean = false;
}
