import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar,
  IonSpinner, IonTextarea, IonButton,
  AlertController
} from '@ionic/angular/standalone';
import { GlobalTaskService } from '../../services/global-task/global-task';
import { AuthService } from '../../services/auth/auth';
import { GlobalTask } from '../../models/global-task.model';
import { Comment } from '../../models/comment.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-global-task-detail',
  templateUrl: './global-task-detail.page.html',
  styleUrls: ['./global-task-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar,
    IonSpinner, IonTextarea, IonButton
  ]
})
export class GlobalTaskDetailPage {

  task: GlobalTask | null = null;
  comments: Comment[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMsg = '';
  successMsg = '';

  newCommentText = '';
  editingCommentId: string | null = null;
  editingText = '';

  savedCommentIds: Set<string> = new Set();

  private taskId = '';
  private userId = '';
  private userName = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private globalTaskService: GlobalTaskService,
    private authService: AuthService,
    private alertCtrl: AlertController,
     private cdr: ChangeDetectorRef
  ) {}

  ionViewWillEnter() {
    this.taskId = this.route.snapshot.params['id'];
    this.userId = this.authService.getUserId();
    this.userName = this.authService.getUserName();
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.errorMsg = '';

    this.globalTaskService.getGlobalTask(this.taskId).subscribe({
      next: (task) => { this.task = task; },
      error: () => { this.errorMsg = 'Greška pri učitavanju zadatka.'; }
    });

    this.globalTaskService.getComments(this.taskId).subscribe({
      next: (comments) => {
        this.comments = comments.sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Greška pri učitavanju komentara.';
      }
    });

    this.globalTaskService.getSavedCommentRefs(this.userId).subscribe({
      next: (refs) => {
        this.savedCommentIds = refs ? new Set(Object.keys(refs)) : new Set();
      },
      error: () => { this.savedCommentIds = new Set(); }
    });
  }


  submitComment() {
    if (!this.newCommentText.trim()) return;

    this.isSubmitting = true;
    this.errorMsg = '';

    const comment: Omit<Comment, 'id'> = {
      userId: this.userId,
      userName: this.userName,
      text: this.newCommentText.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.globalTaskService.addComment(this.taskId, comment).subscribe({
      next: (res) => {
        const newComment: Comment = { ...comment, id: res.name };
        this.comments.unshift(newComment);
        this.newCommentText = '';
        this.isSubmitting = false;
        this.showSuccess('Komentar dodat!');
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMsg = 'Greška pri dodavanju komentara.';
      }
    });
  }


  startEdit(comment: Comment) {
    this.editingCommentId = comment.id;
    this.editingText = comment.text;
  }

  cancelEdit() {
    this.editingCommentId = null;
    this.editingText = '';
  }

  saveEdit(comment: Comment) {
    if (!this.editingText.trim() || this.editingText === comment.text) {
      this.cancelEdit();
      return;
    }

    this.globalTaskService.editComment(this.taskId, comment.id, this.editingText.trim()).subscribe({
      next: () => {
        comment.text = this.editingText.trim();
        this.cancelEdit();
        this.showSuccess('Komentar izmenjen!');
      },
      error: () => { this.errorMsg = 'Greška pri izmeni komentara.'; }
    });
  }


async deleteComment(comment: Comment) {
  const alert = await this.alertCtrl.create({
    header: 'Obriši komentar',
    message: 'Komentar će biti obrisan i kod svih koji su ga sačuvali.',
    buttons: [
      { text: 'Otkaži', role: 'cancel' },
      {
        text: 'Obriši',
        role: 'destructive',
        handler: () => {
          this.globalTaskService.deleteComment(
            this.taskId, comment.id, comment.userId
          ).subscribe({
            next: () => {
              this.comments = this.comments.filter(c => c.id !== comment.id);
              this.savedCommentIds.delete(comment.id);
              this.showSuccess('Komentar obrisan.');
              this.cdr.detectChanges();
            },
            error: () => { this.errorMsg = 'Greška pri brisanju.'; }
          });
          return true; 
        }
      }
    ],
    cssClass: 'custom-alert'
  });
  await alert.present();
}


  toggleSaveComment(comment: Comment) {
    if (this.savedCommentIds.has(comment.id)) {
      this.globalTaskService.unsaveComment(this.userId, comment.id, this.taskId).subscribe({
        next: () => {
          this.savedCommentIds.delete(comment.id);
          this.showSuccess('Uklonjeno iz sačuvanih.');
        },
        error: () => { this.errorMsg = 'Greška pri uklanjanju.'; }
      });
    } else {
      this.globalTaskService.saveComment(this.userId, comment.id, this.taskId).subscribe({
        next: () => {
          this.savedCommentIds.add(comment.id);
          this.showSuccess('Komentar sačuvan!');
        },
        error: () => { this.errorMsg = 'Greška pri čuvanju.'; }
      });
    }
  }


  isSaved(commentId: string): boolean {
    return this.savedCommentIds.has(commentId);
  }

  isMyComment(comment: Comment): boolean {
    return comment.userId === this.userId;
  }

  isEditing(commentId: string): boolean {
    return this.editingCommentId === commentId;
  }

  private showSuccess(msg: string) {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 2500);
  }

  goBack() { this.router.navigate(['/global-tasks']); }
}
