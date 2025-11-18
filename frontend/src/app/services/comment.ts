import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, catchError, throwError } from 'rxjs'
import { Auth } from './auth'

export interface Comment {
  _id: string
  video_id: string
  user_id: {
    _id: string
    ChannelName: string
    logoUrl: string
  }
  commentText: string
  createdAt: string
  updatedAt: string
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly base = 'http://localhost:8000/api/v1/comment'

  constructor(private http: HttpClient, private auth: Auth) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken()
    let headers = new HttpHeaders()
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  }

  // Get comments for a video
  getByVideo(videoId: string): Observable<{ comments: Comment[] }> {
    return this.http.get<{ comments: Comment[] }>(`${this.base}/comment/${videoId}`).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to fetch comments')
      })
    )
  }

  // Add new comment
  add(videoId: string, commentText: string): Observable<{ message: string; comment: Comment }> {
    return this.http.post<{ message: string; comment: Comment }>(
      `${this.base}/new`,
      { video_id: videoId, commentText },
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to add comment')
      })
    )
  }

  // Update comment
  update(commentId: string, commentText: string): Observable<{ message: string; comment: Comment }> {
    return this.http.put<{ message: string; comment: Comment }>(
      `${this.base}/${commentId}`,
      { commentText },
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to update comment')
      })
    )
  }

  // Delete comment
  delete(commentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${commentId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        return throwError(() => error.error?.message || 'Failed to delete comment')
      })
    )
  }
}

