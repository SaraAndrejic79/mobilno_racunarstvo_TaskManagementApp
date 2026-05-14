import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar,
  IonAlert, IonSpinner, IonInput, IonButton
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth/auth';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar,
    IonAlert, IonSpinner, IonInput, IonButton
  ]
})
export class ProfilePage implements OnInit {

  userName = '';
  userEmail = '';
  userInitial = '';

  showLogoutAlert = false;
  alertButtons = [
    { text: 'Otkaži', role: 'cancel' },
    { text: 'Odjavi se', role: 'confirm', handler: () => this.confirmLogout() }
  ];

  resetSent = false;
  resetLoading = false;
  resetError = '';

  showEditEmail = false;
  newEmail = '';
  emailLoading = false;
  emailError = '';

  showEditName = false;
  newName = '';
  nameLoading = false;
  nameError = '';

  needsReauth = false;
  currentPassword = '';
  reauthLoading = false;
  reauthError = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userName = this.authService.getUserName();
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userInitial = this.userName.charAt(0).toUpperCase();
  }


  toggleEditEmail() {
    this.showEditEmail = !this.showEditEmail;
    this.newEmail = this.userEmail;
    this.emailError = '';
  }

  async updateEmail() {
    if (!this.newEmail || this.newEmail === this.userEmail) return;
    this.emailError = '';
    this.needsReauth = true;
  }

  async reauthenticateAndSave() {
    if (!this.currentPassword) {
      this.reauthError = 'Lozinka je obavezna.';
      return;
    }

    this.reauthLoading = true;
    this.reauthError = '';

    try {
      const updatedEmail = await this.authService.reauthenticateAndSave(
        this.userEmail,
        this.currentPassword,
        this.newEmail
      );

      this.userEmail = updatedEmail;
      this.userInitial = this.userName.charAt(0).toUpperCase();
      this.needsReauth = false;
      this.showEditEmail = false;
      this.currentPassword = '';
      this.reauthLoading = false;

      alert('Email uspešno promenjen na: ' + updatedEmail);

    } catch (err: any) {
      this.reauthLoading = false;
      this.reauthError = err.message || 'Greška pri promeni emaila.';
    }
  }


  toggleEditName() {
    this.showEditName = !this.showEditName;
    this.newName = this.userName;
    this.nameError = '';
  }

  async updateName() {
    if (!this.newName || this.newName.trim() === this.userName) return;

    this.nameLoading = true;
    this.nameError = '';

    try {
      const updatedName = await this.authService.updateUserName(this.newName.trim());
      this.userName = updatedName;
      this.userInitial = this.userName.charAt(0).toUpperCase();
      localStorage.setItem('userName', updatedName);
      this.showEditName = false;
      this.nameLoading = false;
    } catch (err: any) {
      this.nameLoading = false;
      this.nameError = err.message || 'Greška pri ažuriranju imena.';
    }
  }


  async sendPasswordReset() {
    this.resetLoading = true;
    this.resetError = '';
    this.resetSent = false;

    try {
      await this.authService.sendPasswordReset(this.userEmail);
      this.resetLoading = false;
      this.resetSent = true;
    } catch (err: any) {
      this.resetLoading = false;
      this.resetError = err.message || 'Greška pri slanju.';
    }
  }


  logout() { this.showLogoutAlert = true; }

  confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goBack() { this.router.navigate(['/dashboard']); }
}