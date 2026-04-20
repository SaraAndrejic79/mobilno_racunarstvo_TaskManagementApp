import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, user, updateProfile, updateEmail, 
  reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  //Ovo je instanca Firebase Auth servisa u klijentskoj aplikaciji, koja omogućava komunikaciju sa Firebase autentifikacionim serverom
  private auth = inject(Auth);

   //$ znači → ovo je Observable, tj tok podataka  koji u realnom vremenu prati stanje autentifikacije korisnika unutar aplikacije.
  //user$ -automatski reaguje kad se desi:login ,logout ,refresh stranice 
  //user je predefinisan objekat (model podataka) unutar Firebase sistema. Kada se neko uspešno prijavi, Firebase kreira taj objekat
  user$ = user(this.auth);

  constructor() {}

   //async kaže: “Ova funkcija radi sa asinhronim operacijama (koje traju neko vreme),uvek vraća Promise= obećanje da ćeš dobiti rezultat u budućnosti
  //Promise se ne vraća kasnije — on se vrati odmah, ali se kasnije “popuni” rezultatom
  //treba nam Zato što Firebase operacije: createUserWithEmailAndPassword(...) NE završavaju odmah šalje se zahtev serveru 🌐čeka se odgovor
  async register(email: string, pass: string, name: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, pass);
    await updateProfile(credential.user, { displayName: name });
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', credential.user.uid);
    return credential;
  }

  async login(email: string, pass: string) {
       //await znači:“Sačekaj da se ovo završi, pa tek onda nastavi”
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
    localStorage.removeItem('token');
  }

  async updateUserName(newName: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Nije ulogovan');
    await updateProfile(user, { displayName: newName });
    localStorage.setItem('userName', newName);
  }

  async updateUserEmail(newEmail: string, currentPassword: string) {
    const user = this.auth.currentUser;
    if (!user || !user.email) throw new Error('Nije ulogovan');

    // Reautentifikacija
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Izmena emaila
    await updateEmail(user, newEmail);
    localStorage.setItem('userEmail', newEmail);
  }

  getUserId(): string {
    return this.auth.currentUser?.uid || localStorage.getItem('userId') || '';
  }

  getUserName(): string {
    return this.auth.currentUser?.displayName || localStorage.getItem('userName') || 'Korisnik';
  }
//getIdToken()? U Firebase SDK-u, ova metoda ne vraća samo običan string  ona je aktivna.
//Proverava da li je trenutni token (ključ) i dalje važeći.
//Ako je istekao, ona sama kontaktira Firebase server u pozadini, osveži ga i donese novi.
//Pošto taj proces (razgovor sa serverom) traje, ona ne može odmah da ti da string, već ti daje Promise (obećanje da će ti dati string čim ga dobije).
  
getToken(): Promise<string> {
                                      //ako nemamo korisnika, vrati prazno obećanje da ne bi vratio undefined.
    return this.auth.currentUser?.getIdToken() || Promise.resolve('');
  }

  isLoggedIn(): boolean {
    //!! Pretvara u boolean: vrednost	rezultat
          //user obj	true
          //null	false
    return !!this.auth.currentUser || !!localStorage.getItem('userId');
  }
}