import { Component } from '@angular/core';
//AbstractControl → predstavlja jedno polje ili celu formu
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth/auth';
import { ChangeDetectorRef } from '@angular/core';
//2. Custom validator (passwordMatch)
//(control: AbstractControl), ti kažeš: "Ovdje će ući nešto što je deo Angular forme (bilo to jedno polje ili cela grupa), i ja želim da imam moć da iz njega izvlačim podatke."
//control: AbstractControl: Iako se zove control, ovde se zapravo prosleđuje cela tvoja FormGroup (grupa koja sadrži i password i confirmPassword).
//ValidationErrors | null:
   //Ako vrati null — Angular smatra da je sve u redu (validno).
   //Ako vrati { mismatch: true } — Angular smatra da je forma neispravna i taj objekat dodaje u listu grešaka

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  // 1. Izvuci cele KONTROLE, a ne samo .value
  const passwordControl = control.get('password');
  const confirmPasswordControl = control.get('confirmPassword');

  if (!passwordControl || !confirmPasswordControl) return null;

  const pw = passwordControl.value;
  const cpw = confirmPasswordControl.value;

  // Ako su polja prazna, ne radi ništa (Validators.required će to rešiti)
  if (!pw || !cpw) return null;

  if (pw !== cpw) {
    // 2. Postavi grešku na samu kontrolu "confirmPassword"
    confirmPasswordControl.setErrors({ mismatch: true });
    return { mismatch: true };
  } else {
    // 3. Ako se poklapaju, obavezno očisti grešku 'mismatch' sa kontrole
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
      this.errorMsg = 'Registracija nije uspela. Email možda već postoji.';
      this.cdr.detectChanges();
    });
}


  goToLogin() {
    this.router.navigate(['/login']);
  }
}