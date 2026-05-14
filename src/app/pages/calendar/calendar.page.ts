import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonSpinner,
  AlertController
} from '@ionic/angular/standalone';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task/task';
import { TaskCardComponent } from '../../components/task-card/task-card.component';

interface CalendarDay {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  hasCompleted: boolean;
  hasPending: boolean;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonSpinner,
    TaskCardComponent
  ]
})
export class CalendarPage  {

  isLoading = false;
  errorMsg = '';
  allTasks: Task[] = [];
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  dayLabels = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

  get monthLabel() {
    return `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }

  get selectedDayTasks() {
    return this.selectedDay?.tasks || [];
  }

  constructor(
    private router: Router,
    private taskService: TaskService,
    private alertCtrl: AlertController
  ) {}

  ionViewWillEnter() { this.loadTasks(); }

  loadTasks() {
    this.isLoading = true;
    this.errorMsg = '';
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.buildCalendar();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Greška pri učitavanju.';
      }
    });
  }

  buildCalendar() {
    this.calendarDays = [];
    const today = new Date().toISOString().split('T')[0];

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    //Ako staviš 0 kao dan, JavaScript će te vratiti jedan dan unazad od prvog dana sledećeg meseca.
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    for (let i = 0; i < startDow; i++) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - (startDow - i));
      const dateStr = d.toISOString().split('T')[0];
      this.calendarDays.push(this.makeDay(d.getDate(), dateStr, false, today));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(this.currentYear, this.currentMonth, i);
      const dateStr = d.toISOString().split('T')[0];
      this.calendarDays.push(this.makeDay(i, dateStr, true, today));
    }

    while (this.calendarDays.length < 42) {
      const last = this.calendarDays[this.calendarDays.length - 1];
      const d = new Date(last.date);
      d.setDate(d.getDate() + 1);
      const dateStr = d.toISOString().split('T')[0];
      this.calendarDays.push(this.makeDay(d.getDate(), dateStr, false, today));
    }

    if (this.selectedDay) {
      const refreshed = this.calendarDays.find(d => d.date === this.selectedDay!.date);
      this.selectedDay = refreshed || null;
    }
  }

  makeDay(dayNum: number, dateStr: string, isCurrentMonth: boolean, today: string): CalendarDay {
    const tasks = this.allTasks.filter(t => t.dueDate === dateStr);
    return {
      date: dateStr,
      dayNum,
      isCurrentMonth,
      isToday: dateStr === today,
      tasks,
      hasCompleted: tasks.some(t => t.completed),
      hasPending: tasks.some(t => !t.completed)
    };
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = this.selectedDay?.date === day.date ? null : day;
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.selectedDay = null;
    this.buildCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.selectedDay = null;
    this.buildCalendar();
  }

  editTask(task: Task) {
    this.router.navigate(['/add-task', task.id], { queryParams: { from: '/calendar' } });
  }

  viewTask(task: Task) {
    this.router.navigate(['/add-task', task.id], { queryParams: { mode: 'view', from: '/calendar' } });
  }

  toggleTask(task: Task) {
    this.taskService.toggleTask(task.id, !task.completed).subscribe({
      next: () => {
        task.completed = !task.completed;
        this.buildCalendar();
      },
      error: () => {
        this.errorMsg = 'Greška pri ažuriranju. Proveri internet konekciju.';
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }

  async deleteTask(task: Task) {
    const alert = await this.alertCtrl.create({
      header: 'Obriši zadatak',
      message: `Jesi li siguran/na da želiš da obrišeš "${task.name}"?`,
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        {
          text: 'Obriši',
          role: 'destructive',
          handler: () => {
            this.taskService.deleteTask(task.id).subscribe({
              next: () => {
                this.allTasks = this.allTasks.filter(t => t.id !== task.id);
                this.buildCalendar();
              },
              error: () => {
                this.errorMsg = 'Greška pri brisanju. Proveri internet konekciju.';
                setTimeout(() => this.errorMsg = '', 3000);
              }
            });
          }
        }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  goBack() { this.router.navigate(['/dashboard']); }
}