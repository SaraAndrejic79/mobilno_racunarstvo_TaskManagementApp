import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, user, updateProfile, updateEmail, 
  reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  user$ = user(this.auth);

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

  async updateUserName(newName: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Nije ulogovan');
    await updateProfile(user, { displayName: newName });
    localStorage.setItem('userName', newName);
  }

async updateUserEmail(newEmail: string, currentPassword: string) {
  try {
    const user = this.auth.currentUser;
    if (!user || !user.email) throw new Error('Korisnik nije pronađen');

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updateEmail(user, newEmail);
    localStorage.setItem('userEmail', newEmail);
    
  } catch (error: any) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
     throw new Error('Trenutna lozinka nije ispravna.');
    }
   if (error.code === 'auth/email-already-in-use') {
     throw new Error('Taj email već koristi drugi nalog.');
    }
   if (error.code === 'auth/invalid-email') {
    throw new Error('Email adresa nije ispravna.');
    }
    throw error;
  }
}

  getUserId(): string {
    return this.auth.currentUser?.uid || localStorage.getItem('userId') || '';
  }

  getToken(): Promise<string> {
  return this.auth.currentUser?.getIdToken() || Promise.resolve('');
}
  getUserName(): string {
    return this.auth.currentUser?.displayName || localStorage.getItem('userName') || 'Korisnik';
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser || !!localStorage.getItem('userId');
  }
}