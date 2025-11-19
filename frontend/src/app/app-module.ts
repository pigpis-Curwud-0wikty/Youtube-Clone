import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core'
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { FormsModule } from '@angular/forms'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'

import { AppRoutingModule } from './app-routing-module'
import { App } from './app'
import { Navbar } from './components/navbar/navbar'
import { Login } from './pages/login/login'
import { Register } from './pages/register/register'
import { VideoList } from './pages/video-list/video-list'
import { VideoPlayer } from './pages/video-player/video-player'
import { Profile } from './pages/profile/profile'
import { AuthInterceptor } from './interceptors/auth.interceptor'

@NgModule({
  declarations: [App, Navbar, Login, Register, VideoList, VideoPlayer, Profile],
  imports: [BrowserModule, AppRoutingModule, FormsModule, HttpClientModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [App],
})
export class AppModule {}
