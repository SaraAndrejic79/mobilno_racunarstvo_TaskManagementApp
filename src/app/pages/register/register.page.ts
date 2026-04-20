import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth/auth';
import { ChangeDetectorRef } from '@angular/core';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  //uzimaš dva inputa iz forme:
  const passwordControl = control.get('password');
  const confirmPasswordControl = control.get('confirmPassword');

  if (!passwordControl || !confirmPasswordControl) return null;

  const pw = passwordControl.value;
  const cpw = confirmPasswordControl.value;

  if (!pw || !cpw) return null;

  if (pw !== cpw) {
    confirmPasswordControl.setErrors({ mismatch: true });
    return { mismatch: true };
  } else {
    if (confirmPasswordControl.hasError('mismatch')) {
      confirmPasswordControl.setErrors(null);
    }
    return null;
  }
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  //znači da je komponenta (ili direktiva/pipe) samostalna i NE mora da bude deklarisana u NgModule-u.
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonButton, IonInput, IonSpinner
  ]
})
export class RegisterPage {
  registerForm: FormGroup;
  isLoading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private router: Router,private authService: AuthService,private cdr: ChangeDetectorRef) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch }); //jedno pravilo koje važi za celu grupu.
  }

 onRegister() {
  if (this.registerForm.invalid) return;
  this.isLoading = true;
  this.errorMsg = '';
  //forsira Angular da odmah osveži UI
  this.cdr.detectChanges();

  const { name, email, password } = this.registerForm.value;

  this.authService.register(email, password, name)
    .then(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/dashboard']);
    })
    .catch(() => {
      this.isLoading = false;
      this.errorMsg = 'Registracija nije uspela.';
      this.cdr.detectChanges();
    });
}


  goToLogin() {
    this.router.navigate(['/login']);
  }
}
