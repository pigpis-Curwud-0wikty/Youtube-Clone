import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { Auth } from '../../services/auth'

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-form">
      <h2>Create Account</h2>
      <form (ngSubmit)="onSubmit()" #registerForm="ngForm" *ngIf="!showVerification">
        <label>
          Channel Name
          <input [(ngModel)]="channelName" name="channelName" required />
        </label>
        <label>
          Email
          <input [(ngModel)]="email" name="email" type="email" required />
        </label>
        <label>
          Phone
          <input [(ngModel)]="phone" name="phone" type="tel" required />
        </label>
        <label>
          Password
          <input [(ngModel)]="password" name="password" type="password" required />
        </label>
        <label>
          Channel Logo
          <input type="file" (change)="onFileSelected($event)" accept="image/*" required />
          <img *ngIf="logoPreview" [src]="logoPreview" class="logo-preview" />
        </label>
        <button type="submit" [disabled]="loading">{{ loading ? 'Creating...' : 'Sign Up' }}</button>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p class="success" *ngIf="success">{{ success }}</p>
      </form>
      
      <div class="verification" *ngIf="showVerification">
        <h3>Verify Your Email</h3>
        <p>We sent a verification code to {{ email }}</p>
        <form (ngSubmit)="onVerify()">
          <label>
            Verification Code
            <input [(ngModel)]="verificationCode" name="verificationCode" required />
          </label>
          <button type="submit" [disabled]="loading">{{ loading ? 'Verifying...' : 'Verify' }}</button>
          <p class="error" *ngIf="error">{{ error }}</p>
          <p class="success" *ngIf="success">{{ success }}</p>
        </form>
      </div>
      
      <p class="auth-footer">
        Already have an account? <a [routerLink]="['/login']">Sign in</a>
      </p>
    </div>
  `,
  styles: ``,
})
export class Register {
  channelName = ''
  email = ''
  phone = ''
  password = ''
  logoFile: File | null = null
  logoPreview: string | null = null
  error = ''
  success = ''
  loading = false
  showVerification = false
  verificationCode = ''

  constructor(private auth: Auth, private router: Router) {}

  onFileSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      this.logoFile = file
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  onSubmit() {
    if (!this.channelName || !this.email || !this.phone || !this.password || !this.logoFile) {
      this.error = 'Please fill in all fields'
      return
    }

    this.loading = true
    this.error = ''
    this.success = ''

    const formData = new FormData()
    formData.append('ChannelName', this.channelName)
    formData.append('email', this.email)
    formData.append('phone', this.phone)
    formData.append('password', this.password)
    formData.append('logoUrl', this.logoFile)

    this.auth.signup(formData).subscribe({
      next: (res) => {
        this.loading = false
        this.success = res.message || 'Account created! Please verify your email.'
        this.showVerification = true
      },
      error: (err) => {
        this.loading = false
        this.error = err || 'Registration failed'
      }
    })
  }

  onVerify() {
    if (!this.verificationCode) {
      this.error = 'Please enter verification code'
      return
    }

    this.loading = true
    this.error = ''
    this.success = ''

    this.auth.verifyEmail(this.email, this.verificationCode).subscribe({
      next: (res) => {
        this.loading = false
        this.success = res.message || 'Email verified! Redirecting to login...'
        setTimeout(() => {
          this.router.navigate(['/login'])
        }, 2000)
      },
      error: (err) => {
        this.loading = false
        this.error = err || 'Verification failed'
      }
    })
  }
}
