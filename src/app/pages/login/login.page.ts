import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth/auth';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonButton, IonInput, IonSpinner
  ]
})
export class LoginPage {
  loginForm: FormGroup;
  isLoading = false;
  errorMsg = '';
  constructor(private fb: FormBuilder, private router: Router,private authService: AuthService,private cdr: ChangeDetectorRef) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

 onLogin() {
  if (this.loginForm.invalid) return;
  this.isLoading = true;
  this.errorMsg = '';
  this.cdr.detectChanges();

  const { email, password } = this.loginForm.value;

  this.authService.login(email, password)
    .then(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/dashboard']);
    })
    .catch(() => {
      this.isLoading = false;
      this.errorMsg = 'Pogrešan email ili lozinka.';
      this.cdr.detectChanges();
    });
}
  goToRegister() {
    this.router.navigate(['/register']);
  }
}