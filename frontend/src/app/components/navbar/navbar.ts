import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { Auth, UserData } from '../../services/auth'

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <nav class="navbar">
      <div class="navbar-left">
        <a class="brand" [routerLink]="['/videos']">
          <span class="brand-icon">▶</span>
          <span class="brand-text">YouTube Clone</span>
        </a>
      </div>
      
      <div class="navbar-center">
        <div class="search-bar">
          <input type="text" placeholder="Search..." [(ngModel)]="searchQuery" (keyup.enter)="onSearch()" />
          <button (click)="onSearch()">🔍</button>
        </div>
      </div>
      
      <div class="navbar-right">
        <ng-container *ngIf="isLoggedIn(); else guest">
          <div class="user-menu">
            <img [src]="userData?.logoUrl" class="user-avatar" (click)="showMenu = !showMenu" />
            <div class="dropdown-menu" *ngIf="showMenu">
              <div class="user-info">
                <img [src]="userData?.logoUrl" class="dropdown-avatar" />
                <div>
                  <p class="user-name">{{ userData?.ChannelName }}</p>
                  <p class="user-email">{{ userData?.email }}</p>
                </div>
              </div>
              <div class="menu-divider"></div>
              <a [routerLink]="['/profile']" (click)="showMenu = false">My Profile</a>
              <a [routerLink]="['/my-videos']" (click)="showMenu = false">My Videos</a>
              <button (click)="logout()">Sign Out</button>
            </div>
          </div>
        </ng-container>
        <ng-template #guest>
          <a class="nav-link" [routerLink]="['/login']">Sign In</a>
        </ng-template>
      </div>
    </nav>
  `,
  styles: ``,
})
export class Navbar implements OnInit {
  isLoggedIn(): boolean {
    return this.auth.isAuthenticated()
  }
  
  userData: UserData | null = null
  showMenu = false
  searchQuery = ''

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.userData = this.auth.getUserData()
  }

  logout() {
    this.auth.logout()
    this.showMenu = false
    this.router.navigate(['/login'])
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      // Navigate to search or filter videos
      this.router.navigate(['/videos'], { queryParams: { search: this.searchQuery } })
    }
  }
}
