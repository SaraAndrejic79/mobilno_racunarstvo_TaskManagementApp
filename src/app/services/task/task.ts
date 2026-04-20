import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Task } from '../../models/task.model';
import { AuthService } from '../auth/auth';

@Injectable({ providedIn: 'root' })
export class TaskService {

  private dbUrl = 'https://taskly-app-61296-default-rtdb.firebaseio.com';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getUserUrl(): string {
    return `${this.dbUrl}/users/${this.auth.getUserId()}`;
  }

  addTask(task: Omit<Task, 'id'>): Observable<any> {
    return this.http.post(`${this.getUserUrl()}/tasks.json`, task);
  }

  getTasks(): Observable<Task[]> {
 
      return this.http.get<{[key: string]: Task}>(`${this.getUserUrl()}/tasks.json`).pipe(
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({
          ...data[key], 
          id: key
        }));
      })
    );
  }


  updateTask(taskId: string, task: Partial<Task>): Observable<any> {
    return this.http.patch(`${this.getUserUrl()}/tasks/${taskId}.json`, task);
  }

  deleteTask(taskId: string): Observable<any> {
    return this.http.delete(`${this.getUserUrl()}/tasks/${taskId}.json`);
  }

  toggleTask(taskId: string, completed: boolean): Observable<any> {
    return this.http.patch(`${this.getUserUrl()}/tasks/${taskId}.json`, { completed });
  }

  getTaskById(taskId: string): Observable<any> {
  return this.http.get(`${this.getUserUrl()}/tasks/${taskId}.json`);
}
}

