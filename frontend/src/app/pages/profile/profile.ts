import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { Auth, UserProfile } from '../../services/auth'

@Component({
  selector: 'app-profile',
  standalone: false,
  template: `
    <div class="profile-container">
      <div class="profile-header" *ngIf="profile">
        <div class="profile-banner">
          <div class="banner-gradient"></div>
        </div>
        <div class="profile-info">
          <div class="avatar-wrapper">
            <img [src]="profile.logoUrl" [alt]="profile.ChannelName" class="profile-avatar" />
            <div class="avatar-ring"></div>
          </div>
          <div class="profile-details">
            <h1 class="channel-name">{{ profile.ChannelName }}</h1>
            <p class="channel-email">{{ profile.email }}</p>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">{{ profile.subscriber }}</span>
                <span class="stat-label">Subscribers</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ profile.stats.totalVideos }}</span>
                <span class="stat-label">Videos</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ formatNumber(profile.stats.totalViews) }}</span>
                <span class="stat-label">Total Views</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ formatNumber(profile.stats.totalLikes) }}</span>
                <span class="stat-label">Total Likes</span>
              </div>
            </div>
            <div class="profile-meta">
              <span class="meta-item">📱 {{ profile.phone }}</span>
              <span class="meta-item">📅 Joined {{ formatDate(profile.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-content">
        <div class="content-section">
          <h2 class="section-title">Recent Videos</h2>
          <div class="videos-grid" *ngIf="profile && profile.recentVideos.length > 0">
            <div class="video-card" *ngFor="let video of profile.recentVideos" (click)="openVideo(video._id)">
              <div class="video-thumbnail">
                <img [src]="video.thumbnailUrl" [alt]="video.title" />
                <div class="video-overlay">
                  <span class="video-views">👁 {{ formatNumber(video.views) }}</span>
                  <span class="video-likes">👍 {{ formatNumber(video.likes) }}</span>
                </div>
              </div>
              <div class="video-info">
                <h3 class="video-title">{{ video.title }}</h3>
                <p class="video-date">{{ formatDate(video.createdAt) }}</p>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="profile && profile.recentVideos.length === 0">
            <p>No videos uploaded yet</p>
            <button class="upload-btn" (click)="goToUpload()">Upload Your First Video</button>
          </div>
        </div>

        <div class="content-section">
          <h2 class="section-title">Quick Actions</h2>
          <div class="actions-grid">
            <button class="action-card" (click)="goToMyVideos()">
              <span class="action-icon">📹</span>
              <span class="action-text">My Videos</span>
            </button>
            <button class="action-card" (click)="goToUpload()">
              <span class="action-icon">⬆️</span>
              <span class="action-text">Upload Video</span>
            </button>
            <button class="action-card" (click)="goToAllVideos()">
              <span class="action-icon">🎬</span>
              <span class="action-text">Browse Videos</span>
            </button>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadProfile()">Retry</button>
      </div>
    </div>
  `,
  styles: ``
})
export class Profile implements OnInit {
  profile: UserProfile | null = null
  loading = false
  error = ''

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.loadProfile()
  }

  loadProfile() {
    this.loading = true
    this.error = ''
    this.auth.getProfile().subscribe({
      next: (data) => {
        this.profile = data
        this.loading = false
      },
      error: (err) => {
        this.error = err || 'Failed to load profile'
        this.loading = false
      }
    })
  }

  openVideo(videoId: string) {
    this.router.navigate(['/watch', videoId])
  }

  goToMyVideos() {
    this.router.navigate(['/my-videos'])
  }

  goToUpload() {
    this.router.navigate(['/my-videos'])
  }

  goToAllVideos() {
    this.router.navigate(['/videos'])
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
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

