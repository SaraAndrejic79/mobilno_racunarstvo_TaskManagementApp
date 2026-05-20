import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonSpinner } from '@ionic/angular/standalone';
import { GlobalTaskService } from '../../services/global-task/global-task';
import { GlobalTask } from '../../models/global-task.model';

@Component({
  selector: 'app-global-tasks',
  templateUrl: './global-tasks.page.html',
  styleUrls: ['./global-tasks.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonSpinner]
})
export class GlobalTasksPage {

  globalTasks: GlobalTask[] = [];
  isLoading = false;
  errorMsg = '';

  constructor(
    private router: Router,
    private globalTaskService: GlobalTaskService
  ) {}

  ionViewWillEnter() {
    this.isLoading = true;
    this.errorMsg = '';
    this.globalTaskService.getGlobalTasks().subscribe({
      next: (tasks) => {
        this.globalTasks = tasks;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Greška pri učitavanju. Proveri internet konekciju.';
      }
    });
  }

  goToDetail(task: GlobalTask) {
    this.router.navigate(['/global-task', task.id]);
  }

  goBack() { this.router.navigate(['/dashboard']); }
}
