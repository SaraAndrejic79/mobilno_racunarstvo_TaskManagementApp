import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar,
  IonFab, IonFabButton, IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Task } from '../../models/task.model';
import { TaskCardComponent } from '../../components/task-card/task-card.component';
import { TaskService } from '../../services/task/task';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar,
    IonFab, IonFabButton, IonIcon, IonSpinner,
    TaskCardComponent
  ]
})
export class DashboardPage implements OnInit {

  todayDate = '';
  userName = '';
  isLoading = false;
  userInitial = '';
  allTasks: Task[] = [];
  todayTasks: Task[] = [];
  upcomingTasks: Task[] = [];

  get completedCount() { return this.todayTasks.filter(t => t.completed).length; }
  get totalCount() { return this.todayTasks.length; }
  get progressPercent() {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }
  get inProgressCount() { return this.todayTasks.filter(t => !t.completed).length; }
  get overdueCount() {
    const today = this.getTodayStr();
    return this.allTasks.filter(t => t.dueDate < today && !t.completed).length;
  }
  get weekCount() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); 
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const start = startOfWeek.toISOString().split('T')[0];
  const end = endOfWeek.toISOString().split('T')[0];

  return this.allTasks.filter(t => t.dueDate >= start && t.dueDate <= end).length;
}

  constructor(
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService
  ) {
    addIcons({ add });
  }

  ngOnInit() {
    this.todayDate = new Date().toLocaleDateString('sr-Latn', {
     //Da bi pisalo "ponedeljak", a ne samo "pon". 
      weekday: 'long', day: 'numeric', month: 'long'
    });
    this.loadTasks();
    this.updateUserData()

  }

  ionViewWillEnter() {
    this.loadTasks();
    this.updateUserData()
  }

  updateUserData() {
  this.userName = this.authService.getUserName().split(" ")[0] ;
  this.userInitial = this.userName ? this.userName.charAt(0).toUpperCase() : '?';
}
  loadTasks() {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.filterTasks();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  filterTasks() {
  const today = this.getTodayStr();
  this.todayTasks = this.allTasks.filter(t => t.dueDate === today);
  this.upcomingTasks = this.allTasks
    .filter(t => t.dueDate >= today && !t.completed) 
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
}

editTask(task: Task) {
  this.router.navigate(['/add-task', task.id]);
}

toggleTask(task: Task) {
  this.taskService.toggleTask(task.id, !task.completed).subscribe({
    next: () => {
      task.completed = !task.completed;
      this.filterTasks(); 
    }
  });
}

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.allTasks = this.allTasks.filter(t => t.id !== task.id);
        this.filterTasks();
      }
    });
  }

  isToday(dateStr: string): boolean {
    return dateStr === this.getTodayStr();
  }

  formatDate(dateStr: string): string {
    if (dateStr === this.getTodayStr()) return 'Danas';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Sutra';
    const d = new Date(dateStr);
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' });
  }

 goToTasks(filter: string = 'Sve') {
  this.router.navigate(['/tasks'], { queryParams: { filter } });
}

goToAddTask() { 
  this.router.navigate(['/add-task']); 
}
goToProfile() { this.router.navigate(['/profile']); }

  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }
  goToStats() { this.router.navigate(['/stats']); }
  goToCalendar() { this.router.navigate(['/calendar']); }
  goToWeekTasks() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  this.router.navigate(['/tasks'], { 
    queryParams: { 
      filter: 'Nedelja',
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    } 
  });
}
}