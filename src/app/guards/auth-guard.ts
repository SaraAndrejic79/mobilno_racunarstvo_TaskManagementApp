import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const authGuard: CanActivateFn = () => {  
  // CanActivateFn -Ova varijabla nije bilo kakva funkcija, već specijalna funkcija "Ja odlučujem da li ova ruta može da se aktivira"
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};