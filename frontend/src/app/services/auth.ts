import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, tap, catchError, throwError } from 'rxjs'

export interface LoginResponse {
  _id: string
  ChannelName: string
  email: string
  phone: string
  logoId: string
  logoUrl: string
  token: string
  subscriber?: number
  subscribedChannels?: string[]
}

export interface UserData {
  _id: string
  ChannelName: string
  email: string
  phone: string
  logoUrl: string
  token: string
  subscriber?: number
  subscribedChannels?: string[]
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly KEY = 'yt_clone_token'
  private readonly isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  private readonly base = 'http://localhost:8000/api/v1/user'

  constructor(private http: HttpClient) {}

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false
    return !!localStorage.getItem(this.KEY)
  }

  getToken(): string | null {
    if (!this.isBrowser) return null
    const raw = localStorage.getItem(this.KEY)
    return raw ? JSON.parse(raw).token : null
  }

  getUserData(): UserData | null {
    if (!this.isBrowser) return null
    const raw = localStorage.getItem(this.KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.user || null
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { email, password }).pipe(
      tap((res) => {
        if (this.isBrowser) {
          localStorage.setItem(this.KEY, JSON.stringify({ 
            token: res.token, 
            user: {
              _id: res._id,
              ChannelName: res.ChannelName,
              email: res.email,
              phone: res.phone,
              logoUrl: res.logoUrl,
              subscriber: res.subscriber,
              subscribedChannels: res.subscribedChannels
            }
          }))
        }
      }),
      catchError((error) => {
        return throwError(() => error.error?.message || 'Login failed')
      })
    )
  }

  signup(form: FormData): Observable<{ message: string; userId: string }> {
    return this.http.post<{ message: string; userId: string }>(`${this.base}/signup`, form).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Signup failed')
      })
    )
  }

  verifyEmail(email: string, code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/verify-email`, { email, code })
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/forgot-password`, { email })
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reset-password`, { email, otp, newPassword })
  }

  updateProfile(form: FormData): Observable<{ message: string; updatedUser: any }> {
    return this.http.put<{ message: string; updatedUser: any }>(`${this.base}/update-profile`, form)
  }

  subscribe(channelId: string): Observable<{ message: string; data: any }> {
    return this.http.post<{ message: string; data: any }>(`${this.base}/subscribe`, { ChannelId: channelId })
  }

  getProfile(): Observable<UserProfile> {
    const token = this.getToken()
    let headers = new HttpHeaders()
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`)
    }
    return this.http.get<UserProfile>(`${this.base}/profile`, { headers }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to fetch profile')
      })
    )
  }

  logout(): void {
    if (!this.isBrowser) return
    localStorage.removeItem(this.KEY)
  }
}

export interface UserProfile {
  _id: string
  ChannelName: string
  email: string
  phone: string
  logoUrl: string
  subscriber: number
  subscribedChannels: string[]
  createdAt: string
  stats: {
    totalVideos: number
    totalViews: number
    totalLikes: number
  }
  recentVideos: Array<{
    _id: string
    title: string
    thumbnailUrl: string
    views: number
    likes: number
    createdAt: string
  }>
}
