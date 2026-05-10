import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../auth/auth';
import { Category } from '../../models/category.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {

  private dbUrl = environment.firebaseConfig.databaseURL;

  constructor(private http: HttpClient, private auth: AuthService) {}
  
  private getUserUrl(): string {
    return `${this.dbUrl}/users/${this.auth.getUserId()}`;
  }
              
  addCategory(category: Omit<Category, 'id'>): Observable<any> {
    return this.http.post(`${this.getUserUrl()}/categories.json`, category);
  }

  getCategories(): Observable<Category[]> {
    //očekujem da Firebase vrati objekat gde su:ključevi = string (id-evi) vrednosti = Task objekti”
                  //znaci kod autocomplete
    return this.http.get<{[key: string]: Category}>(`${this.getUserUrl()}/categories.json`).pipe(
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({
          ...data[key],
           id: key
        }));
      })
    );
  }

  updateCategory(categoryId: string, category: Partial<Category>): Observable<any> {
    return this.http.patch(`${this.getUserUrl()}/categories/${categoryId}.json`, category);
  }

  deleteCategory(categoryId: string): Observable<any> {
    return this.http.delete(`${this.getUserUrl()}/categories/${categoryId}.json`);
  }
}