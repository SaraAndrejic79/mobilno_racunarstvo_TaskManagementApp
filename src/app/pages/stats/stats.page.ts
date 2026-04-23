import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonSpinner
} from '@ionic/angular/standalone';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task/task';

interface DayStat {
  label: string;
  date: string;
  total: number;
  completed: number;
  height: number;
}

interface CategoryStat {
  name: string;
  color: string;
  total: number;
  completed: number;
  percent: number;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonSpinner]
})
export class StatsPage implements OnInit {

  isLoading = false;
  allTasks: Task[] = [];
  weekLabel = '';
  weekOffset = 0;
  dayStats: DayStat[] = [];
  categoryStats: CategoryStat[] = [];
  weekTasks: Task[] = [];
  weekStart = '';
  weekEnd = '';

  constructor(private router: Router, private taskService: TaskService) {}

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }
 
  get completedCount() { return this.weekTasks.filter(t => t.completed).length; }
  get totalCount() { return this.weekTasks.length; }

  get overdueCount() {
    const today = new Date().toISOString().split('T')[0];
    return this.weekTasks.filter(t => !t.completed && t.dueDate < today).length;
  }
  get completedPercent() {
  if (this.totalCount === 0) return 0;
  return Math.round((this.completedCount / this.totalCount) * 100);
}

get missedPercent() {
  if (this.totalCount === 0) return 0;
  return Math.round((this.overdueCount / this.totalCount) * 100);
}

get skippedPercent() {
  if (this.totalCount === 0) return 0;
  return Math.max(0, 100 - this.completedPercent - this.missedPercent);
}

get streak() {
  let count = 0;
  const today = new Date();
  let continueChecking = true;
  let i = 0;

  while (continueChecking) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayTasks = this.allTasks.filter(t => t.dueDate === dateStr);

    if (dayTasks.length === 0) {
      // Ako nema taskova, idemo na sledeći dan (unazad)
      i++;
      // Sigurnosna kočnica - da ne idemo u beskonačnost ako je baza prazna
      if (i > 365) break; 
      continue;
    }

    if (dayTasks.every(t => t.completed)) {
      count++;
      i++;
    } else {
      // Čim nađemo dan sa nezavršenim taskom, prekidamo sve
      continueChecking = false;
    }
    
    // Druga sigurnosna kočnica (npr. ne proveravaj dalje od godinu dana)
    if (i > 365) break;
  }
  return count;
}

 

  loadData() {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.calcWeek();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  calcWeek() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1 + (this.weekOffset * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    this.weekStart = start.toISOString().split('T')[0];
    this.weekEnd = end.toISOString().split('T')[0];

    const startLabel = start.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' });
    const endLabel = end.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' });
    this.weekLabel = `${startLabel} — ${endLabel}`;

    this.weekTasks = this.allTasks.filter(t => t.dueDate >= this.weekStart && t.dueDate <= this.weekEnd);

    this.calcDayStats(start);
    this.calcCategoryStats();
  }

  calcDayStats(weekStart: Date) {
    const dayLabels = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
    this.dayStats = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = this.allTasks.filter(t => t.dueDate === dateStr);
      const completed = dayTasks.filter(t => t.completed).length;
      const total = dayTasks.length;
      //izračunavaš procenat uspešnosti i pretvaraš ga u piksele (visinu):
      const height = total > 0 ? Math.max(8, Math.round((completed / total) * 60)) : 4;

      this.dayStats.push({
        label: dayLabels[i],
        date: dateStr,
        total,
        completed,
        height
      });
    }
  }

  calcCategoryStats() {
    const catMap: { [key: string]: CategoryStat } = {};

    this.weekTasks.forEach(task => {
      //ako kat ne postoji vec u mapi dodajes je
      if (!catMap[task.category]) {
        catMap[task.category] = {
          name: task.category,
          color: task.categoryColor,
          total: 0,
          completed: 0,
          percent: 0
        };
      }
      catMap[task.category].total++;
      if (task.completed) catMap[task.category].completed++;
    });
//pretvaranje u niz zbog ui prikaza *nfFor
    this.categoryStats = Object.values(catMap).map(cat => ({
      ...cat,
      percent: cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0
    }));
  }

  prevWeek() {
    this.weekOffset--;
    this.calcWeek();
  }

  nextWeek() {
    if (this.weekOffset < 0) {
      this.weekOffset++;
      this.calcWeek();
    }
  }

  isCurrentWeek(): boolean {
    return this.weekOffset === 0;
  }

  isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split('T')[0];
  }

  goBack() { this.router.navigate(['/dashboard']); }
}