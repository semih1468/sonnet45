// T022: Date Format Pipe - Tarihi okunabilir formata çevirir
import { Pipe, PipeTransform } from '@angular/core';
import { DateUtils } from '../utils/date.utils';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(date: Date | string, format: 'readable' | 'short' = 'readable'): string {
    if (!date) {
      return '';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    if (format === 'readable') {
      return DateUtils.formatReadable(dateObj);
    } else {
      return DateUtils.toDateString(dateObj);
    }
  }
}
