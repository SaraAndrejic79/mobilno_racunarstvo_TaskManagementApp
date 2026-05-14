import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, user, updateProfile } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);
  user$ = user(this.auth);

  private apiKey = environment.firebaseConfig.apiKey;


  constructor() {}

  async register(email: string, pass: string, name: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, pass);
    await updateProfile(credential.user, { displayName: name });
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', credential.user.uid);
    return credential;
  }

  async login(email: string, pass: string) {
    const credential = await signInWithEmailAndPassword(this.auth, email, pass);
    const name = credential.user.displayName || email.split('@')[0];
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', credential.user.uid);
    return credential;
  }

  async logout() {
    await signOut(this.auth);
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
  }

   async updateUserName(newName: string): Promise<string> {
    const token = await this.getToken();
    if (!token) throw new Error('Nije ulogovan');

    return new Promise((resolve, reject) => {
      this.http.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${this.apiKey}`,
        { idToken: token, displayName: newName, returnSecureToken: true }
      ).subscribe({
        next: (res: any) => {
          localStorage.setItem('userName', res.displayName);
          resolve(res.displayName);
        },
        error: () => reject(new Error('Greška pri ažuriranju imena.'))
      });
    });
  }

 
  async reauthenticateAndSave(email: string, password: string, newEmail: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`,
        { email, password, returnSecureToken: true }
      ).subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.idToken);
          // Korak 2 — odmah šaljemo zahtev za promenu emaila
          this.finishEmailUpdate(res.idToken, newEmail)
            .then(resolve)
            .catch(reject);
        },
        error: () => reject(new Error('Pogrešna lozinka.'))
      });
    });
  }


  async finishEmailUpdate(token: string, newEmail: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${this.apiKey}`,
        { idToken: token, email: newEmail, returnSecureToken: true }
      ).subscribe({
        next: (res: any) => {
          localStorage.setItem('userEmail', res.email);
          if (res.idToken) localStorage.setItem('token', res.idToken);
          resolve(res.email);
        },
        error: (err) => {
          const msg = err.error?.error?.message;
          if (msg === 'EMAIL_EXISTS') {
            reject(new Error('Ovaj email već koristi drugi korisnik.'));
          } else {
            reject(new Error('Greška pri promeni emaila: ' + msg));
          }
        }
      });
    });
  }

  sendPasswordReset(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
        { requestType: 'PASSWORD_RESET', email }
      ).subscribe({
        next: () => resolve(),
        error: () => reject(new Error('Greška pri slanju. Pokušaj ponovo.'))
      });
    });
  }

  getUserId(): string {
    return this.auth.currentUser?.uid || localStorage.getItem('userId') || '';
  }

  getUserName(): string {
    return this.auth.currentUser?.displayName || localStorage.getItem('userName') || 'Korisnik';
  }

  getToken(): Promise<string> {
    return this.auth.currentUser?.getIdToken() || Promise.resolve('');
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser || !!localStorage.getItem('userId');
  }
}