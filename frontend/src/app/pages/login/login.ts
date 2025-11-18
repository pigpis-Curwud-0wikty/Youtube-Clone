import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Auth } from '../../services/auth'

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="auth-form">
      <h2>Sign In</h2>
      <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
        <label>
          Email
          <input [(ngModel)]="email" name="email" type="email" required />
        </label>
        <label>
          Password
          <input [(ngModel)]="password" name="password" type="password" required />
        </label>
        <button type="submit" [disabled]="loading">{{ loading ? 'Signing in...' : 'Sign In' }}</button>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p class="success" *ngIf="success">{{ success }}</p>
      </form>
      <p class="auth-links">
        <a (click)="showForgotPassword = true" class="link">Forgot password?</a>
      </p>
      <div class="forgot-password" *ngIf="showForgotPassword">
        <h3>Reset Password</h3>
        <form (ngSubmit)="onForgotPassword()">
          <label>
            Email
            <input [(ngModel)]="resetEmail" name="resetEmail" type="email" required />
          </label>
          <button type="submit" [disabled]="loading">Send OTP</button>
        </form>
        <div *ngIf="otpSent">
          <label>
            Enter OTP
            <input [(ngModel)]="otp" name="otp" />
          </label>
          <label>
            New Password
            <input [(ngModel)]="newPassword" name="newPassword" type="password" />
          </label>
          <button (click)="onResetPassword()" [disabled]="loading">Reset Password</button>
        </div>
      </div>
      <p class="auth-footer">
        Don't have an account? <a [routerLink]="['/register']">Sign up</a>
      </p>
    </div>
  `,
  styles: ``,
})
export class Login {
  email = ''
  password = ''
  error = ''
  success = ''
  loading = false
  private returnUrl = '/videos'
  
  showForgotPassword = false
  resetEmail = ''
  otp = ''
  newPassword = ''
  otpSent = false

  constructor(private auth: Auth, private router: Router, private route: ActivatedRoute) {
    const ru = this.route.snapshot.queryParamMap.get('returnUrl')
    this.returnUrl = ru || this.returnUrl
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields'
      return
    }
    
    this.loading = true
    this.error = ''
    this.success = ''
    
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false
        this.success = 'Login successful!'
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl)
        }, 500)
      },
      error: (err) => {
        this.loading = false
        this.error = err || 'Invalid credentials'
      }
    })
  }

  onForgotPassword() {
    if (!this.resetEmail) return
    this.loading = true
    this.auth.forgotPassword(this.resetEmail).subscribe({
      next: () => {
        this.loading = false
        this.otpSent = true
        this.success = 'OTP sent to your email'
      },
      error: (err) => {
        this.loading = false
        this.error = err || 'Failed to send OTP'
      }
    })
  }

  onResetPassword() {
    if (!this.resetEmail || !this.otp || !this.newPassword) {
      this.error = 'Please fill in all fields'
      return
    }
    this.loading = true
    this.auth.resetPassword(this.resetEmail, this.otp, this.newPassword).subscribe({
      next: () => {
        this.loading = false
        this.success = 'Password reset successfully! Please login.'
        this.showForgotPassword = false
        this.otpSent = false
      },
      error: (err) => {
        this.loading = false
        this.error = err || 'Failed to reset password'
      }
    })
  }
}
