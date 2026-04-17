import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, updateProfile } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //Ovo je instanca Firebase Auth servisa u klijentskoj aplikaciji, koja omogućava komunikaciju sa Firebase autentifikacionim serverom
  private auth = inject(Auth);

  //$ znači → ovo je Observable, tj tok podataka  koji u realnom vremenu prati stanje autentifikacije korisnika unutar aplikacije.
  //user$ -automatski reaguje kad se desi:login ,logout ,refresh stranice 
  user$ = user(this.auth);

  constructor() {}

  //async kaže: “Ova funkcija radi sa asinhronim operacijama (koje traju neko vreme),uvek vraća Promise= obećanje da ćeš dobiti rezultat u budućnosti
  //Promise se ne vraća kasnije — on se vrati odmah, ali se kasnije “popuni” rezultatom
  //treba nam Zato što Firebase operacije: createUserWithEmailAndPassword(...) NE završavaju odmah šalje se zahtev serveru 🌐čeka se odgovor
  async register(email: string, pass: string, name: string) {
   //await znači:“Sačekaj da se ovo završi, pa tek onda nastavi”
    const credential = await createUserWithEmailAndPassword(this.auth, email, pass);
    //rucno dodavanje imena jer fireabse pravi samo sa email,pass,username
    return updateProfile(credential.user, { displayName: name });
  }

  login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  logout() {
    //ovde await nije potreban jer nemaš šta da radiš POSLE logout-a
    return signOut(this.auth);
  }

  getUserId() {
    return this.auth.currentUser?.uid || null;
  }

  isLoggedIn() {
    //!! Pretvara u boolean: vrednost	rezultat
          //user obj	true
          //null	false
    return !!this.auth.currentUser;
  }
}