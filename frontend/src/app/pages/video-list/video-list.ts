import { Component, OnInit } from '@angular/core'
import { Video, VideoItem } from '../../services/video'
import { Router } from '@angular/router'

@Component({
  selector: 'app-video-list',
  standalone: false,
  template: `
    <div class="video-list-container">
      <div class="header">
        <h1>Videos</h1>
        <button class="upload-btn" *ngIf="isAuthenticated" (click)="showUpload = true">Upload Video</button>
      </div>
      
      <div class="upload-form" *ngIf="showUpload">
        <h3>Upload New Video</h3>
        <form (ngSubmit)="onUpload()">
          <label>
            Title
            <input [(ngModel)]="uploadData.title" name="title" required />
          </label>
          <label>
            Description
            <textarea [(ngModel)]="uploadData.description" name="description" required></textarea>
          </label>
          <label>
            Category
            <input [(ngModel)]="uploadData.category" name="category" />
          </label>
          <label>
            Tags (comma separated)
            <input [(ngModel)]="uploadData.tags" name="tags" />
          </label>
          <label>
            Video File
            <input type="file" (change)="onVideoSelected($event)" accept="video/*" required />
          </label>
          <label>
            Thumbnail
            <input type="file" (change)="onThumbnailSelected($event)" accept="image/*" required />
            <img *ngIf="thumbnailPreview" [src]="thumbnailPreview" class="thumbnail-preview" />
          </label>
          <div class="form-actions">
            <button type="submit" [disabled]="uploading">{{ uploading ? 'Uploading...' : 'Upload' }}</button>
            <button type="button" (click)="showUpload = false">Cancel</button>
          </div>
          <p class="error" *ngIf="uploadError">{{ uploadError }}</p>
          <p class="success" *ngIf="uploadSuccess">{{ uploadSuccess }}</p>
        </form>
      </div>

      <div class="loading" *ngIf="loading">Loading videos...</div>
      <div class="error" *ngIf="error">{{ error }}</div>
      
      <div class="grid" *ngIf="!loading && !error">
        <div class="card" *ngFor="let v of videos" (click)="open(v)">
          <div class="thumbnail-wrapper">
            <img [src]="v.thumbnailUrl" alt="{{v.title}}" />
            <span class="duration" *ngIf="v.views">👁 {{ v.views }}</span>
          </div>
          <div class="card-content">
            <div class="channel-info" *ngIf="v.user">
              <img [src]="v.user.logoUrl" class="channel-logo" />
              <div class="video-info">
                <h3 class="video-title">{{ v.title }}</h3>
                <p class="channel-name">{{ v.user.ChannelName }}</p>
                <p class="video-meta">
                  <span *ngIf="v.likes && v.likes.length > 0">👍 {{ v.likes.length }}</span>
                  <span *ngIf="v.createdAt">{{ formatDate(v.createdAt) }}</span>
                </p>
              </div>
            </div>
            <div class="video-info" *ngIf="!v.user">
              <h3 class="video-title">{{ v.title }}</h3>
              <p class="video-description">{{ v.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="empty" *ngIf="!loading && !error && videos.length === 0">
        <p>No videos available. Be the first to upload!</p>
      </div>
    </div>
  `,
  styles: ``,
})
export class VideoList implements OnInit {
  videos: VideoItem[] = []
  loading = false
  error = ''
  isAuthenticated = false
  
  showUpload = false
  uploading = false
  uploadError = ''
  uploadSuccess = ''
  uploadData = {
    title: '',
    description: '',
    category: '',
    tags: ''
  }
  videoFile: File | null = null
  thumbnailFile: File | null = null
  thumbnailPreview: string | null = null

  constructor(private video: Video, private router: Router) {
    // Check authentication status
    const authData = localStorage.getItem('yt_clone_token')
    this.isAuthenticated = !!authData
  }

  ngOnInit() {
    this.loadVideos()
  }

  loadVideos() {
    this.loading = true
    this.error = ''
    this.video.getAll().subscribe({
      next: (videos) => {
        this.videos = videos
        this.loading = false
      },
      error: (err) => {
        this.error = err || 'Failed to load videos'
        this.loading = false
      }
    })
  }

  open(v: VideoItem) {
    this.router.navigate(['/watch', v._id])
  }

  onVideoSelected(event: any) {
    this.videoFile = event.target.files[0]
  }

  onThumbnailSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      this.thumbnailFile = file
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.thumbnailPreview = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  onUpload() {
    if (!this.uploadData.title || !this.uploadData.description || !this.videoFile || !this.thumbnailFile) {
      this.uploadError = 'Please fill in all required fields'
      return
    }

    this.uploading = true
    this.uploadError = ''
    this.uploadSuccess = ''

    const formData = new FormData()
    formData.append('title', this.uploadData.title)
    formData.append('description', this.uploadData.description)
    formData.append('category', this.uploadData.category)
    formData.append('tags', this.uploadData.tags)
    formData.append('video', this.videoFile)
    formData.append('thumbnail', this.thumbnailFile)

    this.video.upload(formData).subscribe({
      next: (res) => {
        this.uploading = false
        this.uploadSuccess = res.message || 'Video uploaded successfully!'
        this.showUpload = false
        this.uploadData = { title: '', description: '', category: '', tags: '' }
        this.videoFile = null
        this.thumbnailFile = null
        this.thumbnailPreview = null
        setTimeout(() => {
          this.loadVideos()
        }, 1000)
      },
      error: (err) => {
        this.uploading = false
        this.uploadError = err || 'Failed to upload video'
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
}
