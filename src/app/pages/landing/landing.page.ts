import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { GlobalTaskService } from '../../services/global-task/global-task';
import { GlobalTask } from '../../models/global-task.model';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonSpinner]
})
export class LandingPage implements OnInit {

  globalTasks: GlobalTask[] = [];
  isLoading = false;

  constructor(
    private router: Router,
    private globalTaskService: GlobalTaskService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.globalTaskService.getGlobalTasks().subscribe({
      next: (tasks) => {
        this.globalTasks = tasks;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToRegister() { this.router.navigate(['/register']); }
}