import { CanActivateFn, Router } from '@angular/router'
import { inject } from '@angular/core'
import { PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Auth } from '../services/auth'

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth)
  const router = inject(Router)
  const platformId = inject(PLATFORM_ID)
  const isBrowser = isPlatformBrowser(platformId)

  // On the server, allow rendering to avoid SSR redirect loops
  if (!isBrowser) {
    return true
  }

  if (auth.isAuthenticated()) {
    return true
  }
  // On the browser, redirect unauthenticated users to login
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
}
