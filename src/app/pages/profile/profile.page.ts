import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar,
  IonAlert, IonSpinner, IonInput, IonButton
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth';
import { GlobalTaskService } from '../../services/global-task/global-task';
import { Comment } from '../../models/comment.model';
import { environment } from 'src/environments/environment';
import { AlertController } from '@ionic/angular/standalone';
import { ChangeDetectorRef } from '@angular/core';


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

  savedComments: { comment: Comment; taskId: string; taskTitle: string }[] = [];
  savedCommentsLoading = false;
  myComments: { comment: Comment; taskId: string; taskTitle: string }[] = [];
  myCommentsLoading = false;
  editingCommentId: string | null = null;
  editingText = '';
  myCommentsLimit = 5;
  savedCommentsLimit = 5;

get myCommentsVisible() {
  return this.myComments.slice(0, this.myCommentsLimit);
}

get savedCommentsVisible() {
  return this.savedComments.slice(0, this.savedCommentsLimit);
}

showMoreMy() { this.myCommentsLimit += 5; }
showLessMy() { this.myCommentsLimit = 5; }
showMoreSaved() { this.savedCommentsLimit += 5; }
showLessSaved() { this.savedCommentsLimit = 5; }

  private apiKey = environment.firebaseConfig.apiKey;

  constructor(
    private router: Router,
    private authService: AuthService,
    private globalTaskService: GlobalTaskService,
    private http: HttpClient,
    private alertCtrl: AlertController,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userName = this.authService.getUserName();
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userInitial = this.userName.charAt(0).toUpperCase();
  }

  ionViewWillEnter() {
    this.loadSavedComments();
     this.loadMyComments();
  }

loadMyComments() {
  const userId = this.authService.getUserId();
  if (!userId) return;
  this.myCommentsLoading = true;
  this.globalTaskService.getMyComments(userId).subscribe({
    next: (comments) => {
      this.myComments = comments;
      this.myCommentsLoading = false;
    },
    error: () => { this.myCommentsLoading = false; }
  });
}
  loadSavedComments() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.savedCommentsLoading = true;
    this.globalTaskService.getSavedComments(userId).subscribe({
      next: (comments) => {
        this.savedComments = comments;
        this.savedCommentsLoading = false;
      },
      error: () => { this.savedCommentsLoading = false; }
    });
  }
startEdit(item: { comment: Comment; taskId: string; taskTitle: string }) {
  this.editingCommentId = item.comment.id;
  this.editingText = item.comment.text;
}

cancelEdit() {
  this.editingCommentId = null;
  this.editingText = '';
}

saveEdit(item: { comment: Comment; taskId: string; taskTitle: string }) {
  if (!this.editingText.trim() || this.editingText === item.comment.text) {
    this.cancelEdit();
    return;
  }
  this.globalTaskService.editComment(item.taskId, item.comment.id, this.editingText.trim()).subscribe({
    next: () => {
      item.comment.text = this.editingText.trim();
      this.cancelEdit();
    },
    error: () => {}
  });
}
  removeSavedComment(item: { comment: Comment; taskId: string; taskTitle: string }) {
    const userId = this.authService.getUserId();
    this.globalTaskService.unsaveComment(userId, item.comment.id, item.taskId).subscribe({
      next: () => {
        this.savedComments = this.savedComments.filter(
          s => s.comment.id !== item.comment.id
        );
         this.cdr.detectChanges()
      },
      error: () => {}
    });
  }

  async deleteMyComment(item: { comment: Comment; taskId: string; taskTitle: string }) {
  const alert = await this.alertCtrl.create({
    header: 'Obriši komentar',
    message: 'Komentar će biti obrisan i kod svih koji su ga sačuvali.',
    buttons: [
      { text: 'Otkaži', role: 'cancel' },
      {
        text: 'Obriši',
        role: 'destructive',
        handler: () => {
          const userId = this.authService.getUserId();
          this.globalTaskService.deleteComment(
            item.taskId, item.comment.id, userId
          ).subscribe({
            next: () => {
              this.myComments = this.myComments.filter(
                c => c.comment.id !== item.comment.id
              );
               this.cdr.detectChanges();
            },
            error: () => {}
          });
        }
      }
    ],
    cssClass: 'custom-alert'
  });
  await alert.present();
}

  goToGlobalTasks() { this.router.navigate(['/global-tasks']); }


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
        this.userEmail, this.currentPassword, this.newEmail
      );
      this.userEmail = updatedEmail;
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