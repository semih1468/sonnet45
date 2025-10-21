import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-how-to-use',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './how-to-use.html',
  styleUrl: './how-to-use.scss',
  standalone: true
})
export class HowToUseComponent {
  steps = [
    { number: 1, icon: 'clock', key: 'step1' },
    { number: 2, icon: 'play', key: 'step2' },
    { number: 3, icon: 'coffee', key: 'step3' },
    { number: 4, icon: 'refresh', key: 'step4' }
  ];

  benefits = [
    { icon: 'lightning', key: 'benefit1' },
    { icon: 'target', key: 'benefit2' },
    { icon: 'brain', key: 'benefit3' },
    { icon: 'fire', key: 'benefit4' }
  ];

  tips = [
    { key: 'tip1' },
    { key: 'tip2' },
    { key: 'tip3' },
    { key: 'tip4' }
  ];
}