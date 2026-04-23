import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar,
  IonFab, IonFabButton, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task/task';
import { CategoryService } from '../../services/category/category';
import { Category } from '../../models/category.model';
import { TaskCardComponent } from '../../components/task-card/task-card.component';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar,
    IonFab, IonFabButton, IonIcon, IonSpinner,
    TaskCardComponent
  ]
})
export class TasksPage implements OnInit {

  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  categories: Category[] = [];
  isLoading = false;

  selectedFilter: string = 'Sve';
  selectedCategory: string = 'Sve';
  filters = ['Sve', 'Danas', 'Završeni', 'Zakasneli', 'Nedelja'];
  weekStart = '';
  weekEnd = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private taskService: TaskService,
    private categoryService: CategoryService
  ) {
    addIcons({ add });
    this.calcWeekRange();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['filter']) this.selectedFilter = params['filter'];
      if (params['start']) this.weekStart = params['start'];
      if (params['end']) this.weekEnd = params['end'];
    });
  }

  ionViewWillEnter() {
    this.route.queryParams.subscribe(params => {
      if (params['filter']) this.selectedFilter = params['filter'];
      if (params['start']) this.weekStart = params['start'];
      if (params['end']) this.weekEnd = params['end'];
    });
    this.loadData();
  }

  calcWeekRange() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    this.weekStart = start.toISOString().split('T')[0];
    this.weekEnd = end.toISOString().split('T')[0];
  }

  loadData() {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });

    this.categoryService.getCategories().subscribe({
      next: (cats) => { this.categories = cats; }
    });
  }

  selectFilter(filter: string) {
    this.selectedFilter = filter;
    if (filter === 'Nedelja') this.calcWeekRange();
    this.applyFilter();
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.applyFilter();
  }

  applyFilter() {
    const today = new Date().toISOString().split('T')[0];
    let tasks = [...this.allTasks];

    switch (this.selectedFilter) {
      case 'Danas':
        tasks = tasks.filter(t => t.dueDate === today && !t.completed);
        break;
      case 'Predstojeći':
        tasks = tasks.filter(t => t.dueDate >= today && !t.completed);
        break;
      case 'Završeni':
        tasks = tasks.filter(t => t.completed);
        break;
      case 'Zakasneli':
        tasks = tasks.filter(t => t.dueDate < today && !t.completed);
        break;
      case 'Nedelja':
        tasks = tasks.filter(t => t.dueDate >= this.weekStart && t.dueDate <= this.weekEnd);
        break;
      case 'Sve':
      break;
    }

    if (this.selectedCategory !== 'Sve') {
      tasks = tasks.filter(t => t.category === this.selectedCategory);
    }

    this.filteredTasks = tasks;
  }

  toggleTask(task: Task) {
    this.taskService.toggleTask(task.id, !task.completed).subscribe({
      next: () => {
        task.completed = !task.completed;
        this.applyFilter();
      }
    });
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.allTasks = this.allTasks.filter(t => t.id !== task.id);
        this.applyFilter();
      }
    });
  }

  editTask(task: Task) {
  this.router.navigate(['/add-task', task.id]);
}
viewTask(task: Task) {
  this.router.navigate(['/add-task', task.id], { queryParams: { mode: 'view' } });
}

  goToAddTask() { this.router.navigate(['/add-task']); }
  goBack() { this.router.navigate(['/dashboard']); }
}