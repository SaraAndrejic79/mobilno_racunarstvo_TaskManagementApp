import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar,
  IonAlert, IonSpinner, IonInput, IonButton
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,FormsModule,
    IonContent, IonHeader, IonToolbar,
    IonAlert, IonSpinner, IonInput, IonButton
  ]
})
export class ProfilePage implements OnInit {

  userName = '';
  userEmail = '';
  userInitial = '';

  showLogoutAlert = false;
  resetSent = false;
  resetLoading = false;
  resetError = '';

  showEditEmail = false;
newEmail = '';
emailLoading = false;
emailSuccess = false;
emailError = '';

showEditName = false;
newName = '';
nameLoading = false;
nameError = '';

needsReauth = false;
currentPassword = '';
reauthLoading = false;
reauthError = '';

  private apiKey = 'AIzaSyDOlSOZHke07_qfc2Dytrc_BeuoLk7lC5c';

  alertButtons = [
    { text: 'Otkaži', role: 'cancel' },
    { text: 'Odjavi se', role: 'confirm', handler: () => this.confirmLogout() }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.userName = this.authService.getUserName();
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userInitial = this.userName.charAt(0).toUpperCase();
  }


toggleEditEmail() {
  this.showEditEmail = !this.showEditEmail;
  this.newEmail = this.userEmail;
  this.emailSuccess = false;
  this.emailError = '';
}

async updateEmail() {
  console.log('--- Funkcija updateEmail je pozvana ---');
  console.log('Novi email:', this.newEmail);
  
  if (!this.newEmail || this.newEmail === this.userEmail) {
    console.log('Email je isti kao trenutni ili prazan.');
    return;
  }
  
  this.emailError = '';
  this.needsReauth = true; 
  console.log('needsReauth postavljen na true');
}
async reauthenticateAndSave() {
  if (!this.currentPassword) {
    this.reauthError = 'Lozinka je obavezna.';
    return;
  }

  this.reauthLoading = true;
  this.reauthError = '';

  // KORAK 1: Ponovna prijava (Login) da dobijemo svež token
  this.http.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`, {
    email: this.userEmail,
    password: this.currentPassword,
    returnSecureToken: true
  }).subscribe({
    next: (res: any) => {
      const freshToken = res.idToken;
      localStorage.setItem('token', freshToken); // Čuvamo svež token

      // KORAK 2: Sad kad imamo "vruć" token, šaljemo zahtev za promenu emaila
      this.finishEmailUpdate(freshToken);
    },
    error: (err) => {
      this.reauthLoading = false;
      this.reauthError = 'Pogrešna lozinka.';
    }
  });
}

// 3. Pomoćna funkcija koja konačno šalje zahtev Google-u
finishEmailUpdate(token: string) {
  // Koristimo 'accounts:update' umesto 'sendOobCode'
  this.http.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${this.apiKey}`,
    { 
      idToken: token, 
      email: this.newEmail, 
      returnSecureToken: true 
    }
  ).subscribe({
    next: (res: any) => {
      this.reauthLoading = false;
      this.needsReauth = false;
      this.showEditEmail = false;
      this.currentPassword = '';

      // Odmah ažuriramo podatke u aplikaciji
      this.userEmail = res.email;
      localStorage.setItem('userEmail', res.email);
      if (res.idToken) localStorage.setItem('token', res.idToken);

      alert('Uspeh! Email je odmah promenjen na: ' + res.email);
    },
    error: (err) => {
      this.reauthLoading = false;
      const msg = err.error?.error?.message;
      
      if (msg === 'EMAIL_EXISTS') {
        this.reauthError = 'Ovaj email već koristi drugi korisnik.';
      } else {
        this.reauthError = 'Greška: ' + msg;
      }
    }
  });
}
toggleEditName() {
  this.showEditName = !this.showEditName;
  this.newName = this.userName;
  this.nameError = '';
}

async updateName() { // Dodaj 'async' ovde
  if (!this.newName || this.newName.trim() === this.userName) return;
  
  this.nameLoading = true;
  this.nameError = '';

  try {
    // Čekamo da se Promise razreši i dobijemo pravi string tokena
    const token = await this.authService.getToken(); 

    const body = {
      idToken: token,
      displayName: this.newName,
      returnSecureToken: true
    };

    this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${this.apiKey}`,
      body
    ).subscribe({
      next: (res: any) => {
        this.nameLoading = false;
        this.userName = res.displayName;
        this.userInitial = this.userName.charAt(0).toUpperCase();
        localStorage.setItem('userName', res.displayName);
        this.showEditName = false;
      },
      error: (err) => {
        this.nameLoading = false;
        this.nameError = 'Greška pri ažuriranju.';
      }
    });
  } catch (error) {
    this.nameLoading = false;
    this.nameError = 'Neuspešno dobavljanje tokena.';
  }
}
  sendPasswordReset() {
    this.resetLoading = true;
    this.resetError = '';
    this.resetSent = false;

    this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      { requestType: 'PASSWORD_RESET', email: this.userEmail }
    ).subscribe({
      next: () => {
        this.resetLoading = false;
        this.resetSent = true;
      },
      error: () => {
        this.resetLoading = false;
        this.resetError = 'Greška pri slanju. Pokušaj ponovo.';
      }
    });
  }

  logout() { this.showLogoutAlert = true; }

  confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goBack() { this.router.navigate(['/dashboard']); }
}
