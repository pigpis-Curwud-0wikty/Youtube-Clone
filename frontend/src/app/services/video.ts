import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, catchError, throwError } from 'rxjs'
import { Auth } from './auth'

export interface VideoItem {
  _id: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  user_id: string
  category?: string
  tags?: string[]
  likes?: string[]
  dislikes?: string[]
  views?: number
  createdAt?: string
  updatedAt?: string
  user?: {
    ChannelName: string
    logoUrl: string
    subscriber?: number
    subscribedChannels?: string[]
  }
}

@Injectable({ providedIn: 'root' })
export class Video {
  private readonly base = 'http://localhost:8000/api/v1/video'

  constructor(private http: HttpClient, private auth: Auth) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken()
    let headers = new HttpHeaders()
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  }

  // Get all videos
  getAll(): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${this.base}/all`).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to fetch videos')
      })
    )
  }

  // Get video by ID
  getById(id: string): Observable<VideoItem> {
    return this.http.get<VideoItem>(`${this.base}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to fetch video')
      })
    )
  }

  // Get my videos
  getMyVideos(): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${this.base}/my-videoes`, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to fetch your videos')
      })
    )
  }

  // Upload video
  upload(formData: FormData): Observable<{ message: string; video: VideoItem }> {
    return this.http.post<{ message: string; video: VideoItem }>(`${this.base}/upload`, formData, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to upload video')
      })
    )
  }

  // Update video
  update(id: string, formData: FormData): Observable<{ message: string; video: VideoItem }> {
    return this.http.put<{ message: string; video: VideoItem }>(`${this.base}/update/${id}`, formData, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to update video')
      })
    )
  }

  // Delete video
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/delete/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to delete video')
      })
    )
  }

  // Like video
  like(videoId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/like`, { videoId }, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to like video')
      })
    )
  }

  // Dislike video
  dislike(videoId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/dislike`, { videoId }, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to dislike video')
      })
    )
  }

  // Get videos by tag
  getByTag(tag: string): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${this.base}/tags/${tag}`).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to fetch videos by tag')
      })
    )
  }

  // Get videos by category
  getByCategory(category: string): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${this.base}/category/${category}`).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to fetch videos by category')
      })
    )
  }

  // Search videos by query (tags, title, description, words, letters)
  search(query: string): Observable<VideoItem[]> {
    const encodedQuery = encodeURIComponent(query.trim())
    return this.http.get<VideoItem[]>(`${this.base}/search?q=${encodedQuery}`).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to search videos')
      })
    )
  }
}
