// T019: Tarih Yardımcı Fonksiyonları
export class DateUtils {
  /**
   * Tarihi YYYY-MM-DD formatına çevirir
   */
  static toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * YYYY-MM-DD string'ini Date objesine çevirir
   */
  static fromDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Bugünün tarihini YYYY-MM-DD formatında döner
   */
  static today(): string {
    return this.toDateString(new Date());
  }

  /**
   * İki tarih arasındaki gün farkını hesaplar
   */
  static daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  }

  /**
   * Verilen tarihin haftanın hangi günü olduğunu döner (0 = Pazar, 6 = Cumartesi)
   */
  static getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  /**
   * Verilen tarihin başlangıcını (00:00:00) döner
   */
  static startOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Verilen tarihin sonunu (23:59:59) döner
   */
  static endOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  /**
   * Haftanın başlangıç tarihini (Pazartesi) döner
   */
  static startOfWeek(date: Date): Date {
    const newDate = new Date(date);
    const day = newDate.getDay();
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    newDate.setDate(diff);
    return this.startOfDay(newDate);
  }

  /**
   * Haftanın bitiş tarihini (Pazar) döner
   */
  static endOfWeek(date: Date): Date {
    const start = this.startOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return this.endOfDay(end);
  }

  /**
   * Ayın başlangıç tarihini döner
   */
  static startOfMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setDate(1);
    return this.startOfDay(newDate);
  }

  /**
   * Ayın bitiş tarihini döner
   */
  static endOfMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    newDate.setDate(0);
    return this.endOfDay(newDate);
  }

  /**
   * Tarihi okunabilir formata çevirir (örn: "21 Ekim 2025")
   */
  static formatReadable(date: Date): string {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}
