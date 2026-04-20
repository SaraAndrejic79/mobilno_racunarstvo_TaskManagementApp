import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../auth/auth';
import { Category } from '../../models/category.model';


@Injectable({ providedIn: 'root' })
export class CategoryService {

  private dbUrl = 'https://taskly-app-61296-default-rtdb.firebaseio.com';

  constructor(private http: HttpClient, private auth: AuthService) {}
//Funkcija getUserUrl() u tvom kodu je pomoćna funkcija (tzv. helper). Njen jedini posao je da "izgradi" tačnu adresu (putanju) do mesta u bazi gde se nalaze podaci trenutno ulogovanog korisnika.
  private getUserUrl(): string {
    //Ti "dolari" (${...}) su deo nečega što se u JavaScriptu/TypeScriptu zove Template Literals (ili Template Strings).
    //To način da spojiš običan tekst sa podacima iz tvojih promenljivih.
    return `${this.dbUrl}/users/${this.auth.getUserId()}`;
  }
  //any znači da Observable može da emituje bilo koji tip podatka.
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
          ...data[key],//: Ovo se zove Spread operator. On uzima sve iz originalnog objekta (ime i boju).
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