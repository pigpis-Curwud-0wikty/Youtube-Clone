import { Component, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Video, VideoItem } from '../../services/video'
import { CommentService, Comment } from '../../services/comment'
import { Auth, UserData } from '../../services/auth'

declare const Hls: any

@Component({
  selector: 'app-video-player',
  standalone: false,
  template: `
    <div class="player-wrapper">
      <div class="video-container">
        <div class="main-content">
          <video #player controls width="100%" height="auto" [poster]="video?.thumbnailUrl"></video>
          
          <div class="video-info">
            <h1 class="video-title">{{ video?.title }}</h1>
            <div class="video-meta-bar">
              <div class="channel-section">
                <img [src]="video?.user?.logoUrl" class="channel-avatar" *ngIf="video?.user" />
                <div class="channel-details" *ngIf="video?.user">
                  <h3 class="channel-name">{{ video?.user?.ChannelName }}</h3>
                  <p class="subscriber-count" *ngIf="video?.user?.subscriber">{{ video?.user?.subscriber }} subscribers</p>
                </div>
                <button class="subscribe-btn" *ngIf="video?.user && video && currentUser?._id !== video.user_id" (click)="onSubscribe()">
                  {{ isSubscribed ? 'Subscribed' : 'Subscribe' }}
                </button>
              </div>
              
              <div class="action-buttons">
                <button class="action-btn like-btn" (click)="onLike()" [class.active]="isLiked">
                  👍 {{ video?.likes?.length || 0 }}
                </button>
                <button class="action-btn dislike-btn" (click)="onDislike()" [class.active]="isDisliked">
                  👎
                </button>
              </div>
            </div>
            
            <div class="video-description">
              <p>{{ video?.description }}</p>
              <div class="video-stats">
                <span *ngIf="video?.views">👁 {{ video?.views }} views</span>
                <span *ngIf="video?.createdAt">{{ formatDate(video?.createdAt) }}</span>
                <span *ngIf="video?.category">Category: {{ video?.category }}</span>
              </div>
              <div class="tags" *ngIf="(video?.tags?.length ?? 0) > 0">
                <span class="tag" *ngFor="let tag of (video?.tags || [])">#{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="comments-section">
            <h2>{{ comments.length }} Comments</h2>
            
            <div class="comment-form" *ngIf="isAuthenticated">
              <img [src]="currentUser?.logoUrl" class="comment-avatar" />
              <form (ngSubmit)="onAddComment()" class="comment-input-form">
                <input 
                  [(ngModel)]="newComment" 
                  name="newComment" 
                  placeholder="Add a comment..." 
                  class="comment-input"
                />
                <button type="submit" [disabled]="!newComment.trim() || postingComment">Post</button>
              </form>
            </div>
            
            <div class="comments-list">
              <div class="comment" *ngFor="let comment of comments">
                <img [src]="comment.user_id.logoUrl" class="comment-avatar" />
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.user_id.ChannelName }}</span>
                    <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.commentText }}</p>
                  <div class="comment-actions" *ngIf="isAuthenticated && currentUser?._id === comment.user_id._id">
                    <button class="edit-btn" (click)="startEdit(comment)">Edit</button>
                    <button class="delete-btn" (click)="onDeleteComment(comment._id)">Delete</button>
                  </div>
                  <div class="edit-form" *ngIf="editingCommentId === comment._id">
                    <input [(ngModel)]="editCommentText" class="edit-input" />
                    <button (click)="onUpdateComment(comment._id)">Save</button>
                    <button (click)="cancelEdit()">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="no-comments" *ngIf="comments.length === 0">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="loading" *ngIf="loading">Loading video...</div>
      <div class="error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styles: ``,
})
export class VideoPlayer implements OnInit, OnDestroy {
  @ViewChild('player', { static: true }) playerRef!: ElementRef<HTMLVideoElement>
  video?: VideoItem
  comments: Comment[] = []
  loading = false
  error = ''
  isAuthenticated = false
  currentUser: UserData | null = null
  isLiked = false
  isDisliked = false
  isSubscribed = false
  newComment = ''
  postingComment = false
  editingCommentId: string | null = null
  editCommentText = ''
  private hls?: any

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private videoSvc: Video,
    private commentSvc: CommentService,
    private auth: Auth
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || ''
    this.isAuthenticated = this.auth.isAuthenticated()
    this.currentUser = this.auth.getUserData()
    
    this.loadVideo(id)
    this.loadComments(id)
  }

  loadVideo(id: string) {
    this.loading = true
    this.error = ''
    this.videoSvc.getById(id).subscribe({
      next: (video) => {
        this.video = video
        this.loading = false
        this.checkLikeStatus()
        this.checkSubscribeStatus()
        setTimeout(() => this.setupVideo(), 100)
      },
      error: (err) => {
        this.error = err || 'Failed to load video'
        this.loading = false
      }
    })
  }

  loadComments(videoId: string) {
    this.commentSvc.getByVideo(videoId).subscribe({
      next: (res) => {
        this.comments = res.comments || []
      },
      error: (err) => {
        console.error('Failed to load comments:', err)
      }
    })
  }

  setupVideo() {
    const el = this.playerRef.nativeElement
    if (!this.video || !el) return
    
    el.src = this.video.videoUrl
    el.load()
  }

  checkLikeStatus() {
    if (!this.video || !this.currentUser) return
    this.isLiked = this.video.likes?.includes(this.currentUser._id) || false
    this.isDisliked = this.video.dislikes?.includes(this.currentUser._id) || false
  }

  checkSubscribeStatus() {
    if (!this.video || !this.currentUser) return
    this.isSubscribed = this.currentUser.subscribedChannels?.includes(this.video.user_id) || false
  }

  onLike() {
    if (!this.video || !this.isAuthenticated) {
      this.router.navigate(['/login'])
      return
    }
    
    this.videoSvc.like(this.video._id).subscribe({
      next: () => {
        this.loadVideo(this.video!._id)
      },
      error: (err) => {
        console.error('Failed to like:', err)
      }
    })
  }

  onDislike() {
    if (!this.video || !this.isAuthenticated) {
      this.router.navigate(['/login'])
      return
    }
    
    this.videoSvc.dislike(this.video._id).subscribe({
      next: () => {
        this.loadVideo(this.video!._id)
      },
      error: (err) => {
        console.error('Failed to dislike:', err)
      }
    })
  }

  onSubscribe() {
    if (!this.video || !this.isAuthenticated) {
      this.router.navigate(['/login'])
      return
    }
    
    this.auth.subscribe(this.video.user_id).subscribe({
      next: () => {
        this.isSubscribed = true
        // Reload user data
        const authData = localStorage.getItem('yt_clone_token')
        if (authData) {
          this.currentUser = JSON.parse(authData).user
        }
      },
      error: (err) => {
        console.error('Failed to subscribe:', err)
      }
    })
  }

  onAddComment() {
    if (!this.video || !this.newComment.trim() || !this.isAuthenticated) return
    
    this.postingComment = true
    this.commentSvc.add(this.video._id, this.newComment).subscribe({
      next: () => {
        this.newComment = ''
        this.postingComment = false
        this.loadComments(this.video!._id)
      },
      error: (err) => {
        this.postingComment = false
        console.error('Failed to add comment:', err)
      }
    })
  }

  startEdit(comment: Comment) {
    this.editingCommentId = comment._id
    this.editCommentText = comment.commentText
  }

  cancelEdit() {
    this.editingCommentId = null
    this.editCommentText = ''
  }

  onUpdateComment(commentId: string) {
    if (!this.editCommentText.trim()) return
    
    this.commentSvc.update(commentId, this.editCommentText).subscribe({
      next: () => {
        this.cancelEdit()
        this.loadComments(this.video!._id)
      },
      error: (err) => {
        console.error('Failed to update comment:', err)
      }
    })
  }

  onDeleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    this.commentSvc.delete(commentId).subscribe({
      next: () => {
        this.loadComments(this.video!._id)
      },
      error: (err) => {
        console.error('Failed to delete comment:', err)
      }
    })
  }

  formatDate(date: string | undefined): string {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  ngOnDestroy() {
    if (this.hls) {
      this.hls.destroy()
    }
  }
}
