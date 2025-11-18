import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { VideoList } from './pages/video-list/video-list';
import { VideoPlayer } from './pages/video-player/video-player';
import { authGuard } from './guards/auth-guard';

const routes: Routes = [
  { path: '', redirectTo: 'videos', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'videos', component: VideoList, canActivate: [authGuard] },
  { path: 'watch/:id', component: VideoPlayer, canActivate: [authGuard] },
  { path: '**', redirectTo: 'videos' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
