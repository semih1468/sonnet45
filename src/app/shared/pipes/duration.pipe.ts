import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(value: number): string {
    if (!value && value !== 0) return '';

    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;

    if (hours > 0) {
      return `${hours}s ${minutes}dk`;
    } else if (minutes > 0) {
      return `${minutes}dk ${seconds}sn`;
    } else {
      return `${seconds}sn`;
    }
  }
}