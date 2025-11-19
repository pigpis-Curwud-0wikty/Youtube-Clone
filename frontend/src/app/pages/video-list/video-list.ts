import { Component, OnInit, OnDestroy } from '@angular/core'
import { Video, VideoItem } from '../../services/video'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router'
import { filter, Subscription } from 'rxjs'

@Component({
  selector: 'app-video-list',
  standalone: false,
  template: `
    <div class="video-list-container">
      <div class="header">
        <h1>
          <span *ngIf="isMyVideos">My Videos</span>
          <span *ngIf="!isMyVideos && isSearching">Search Results{{ searchQuery ? ' for "' + searchQuery + '"' : '' }}</span>
          <span *ngIf="!isMyVideos && !isSearching">Videos</span>
        </h1>
        <div class="header-actions">
          <button class="profile-btn" *ngIf="isAuthenticated && isMyVideos" (click)="goToProfile()">👤 My Profile</button>
          <button class="upload-btn" *ngIf="isAuthenticated" (click)="showUpload = true">Upload Video</button>
        </div>
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

      <div class="update-form" *ngIf="showUpdate">
        <h3>Update Video</h3>
        <form (ngSubmit)="onUpdate()">
          <label>
            Title
            <input [(ngModel)]="updateData.title" name="updateTitle" required />
          </label>
          <label>
            Description
            <textarea [(ngModel)]="updateData.description" name="updateDescription" required></textarea>
          </label>
          <label>
            Category
            <input [(ngModel)]="updateData.category" name="updateCategory" />
          </label>
          <label>
            Tags (comma separated)
            <input [(ngModel)]="updateData.tags" name="updateTags" />
          </label>
          <label>
            Thumbnail (optional - leave empty to keep current)
            <input type="file" (change)="onUpdateThumbnailSelected($event)" accept="image/*" />
            <img *ngIf="updateThumbnailPreview" [src]="updateThumbnailPreview" class="thumbnail-preview" />
            <img *ngIf="!updateThumbnailPreview && updateData.currentThumbnail" [src]="updateData.currentThumbnail" class="thumbnail-preview" />
          </label>
          <div class="form-actions">
            <button type="submit" [disabled]="updating">{{ updating ? 'Updating...' : 'Update' }}</button>
            <button type="button" (click)="cancelUpdate()">Cancel</button>
          </div>
          <p class="error" *ngIf="updateError">{{ updateError }}</p>
          <p class="success" *ngIf="updateSuccess">{{ updateSuccess }}</p>
        </form>
      </div>

      <div class="loading" *ngIf="loading">Loading videos...</div>
      <div class="error" *ngIf="error">{{ error }}</div>
      
      <div class="grid" *ngIf="!loading && !error">
        <div class="card" *ngFor="let v of videos">
          <div class="thumbnail-wrapper" (click)="open(v)">
            <img [src]="v.thumbnailUrl" alt="{{v.title}}" />
            <span class="duration" *ngIf="v.views">👁 {{ v.views }}</span>
          </div>
          <div class="card-content" (click)="open(v)">
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
          <div class="card-actions" *ngIf="isMyVideos" (click)="$event.stopPropagation()">
            <button class="update-btn" (click)="startEdit(v)">✏️ Update</button>
            <button class="delete-btn" (click)="onDelete(v._id)">🗑️ Delete</button>
          </div>
        </div>
      </div>
      
      <div class="empty" *ngIf="!loading && !error && videos.length === 0">
        <p *ngIf="isMyVideos">You haven't uploaded any videos yet. Upload your first video!</p>
        <p *ngIf="!isMyVideos && isSearching">No videos found for "{{ searchQuery }}". Try a different search term.</p>
        <p *ngIf="!isMyVideos && !isSearching">No videos available. Be the first to upload!</p>
      </div>
    </div>
  `,
  styles: ``,
})
export class VideoList implements OnInit, OnDestroy {
  videos: VideoItem[] = []
  loading = false
  error = ''
  isAuthenticated = false
  isMyVideos = false
  searchQuery = ''
  isSearching = false
  private routeSubscription?: Subscription
  private queryParamsSubscription?: Subscription
  
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

  showUpdate = false
  updating = false
  updateError = ''
  updateSuccess = ''
  updateData = {
    videoId: '',
    title: '',
    description: '',
    category: '',
    tags: '',
    currentThumbnail: ''
  }
  updateThumbnailFile: File | null = null
  updateThumbnailPreview: string | null = null

  constructor(
    private video: Video, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Check authentication status
    const authData = localStorage.getItem('yt_clone_token')
    this.isAuthenticated = !!authData
  }

  ngOnInit() {
    // Initial load
    this.updateRouteAndSearch()
    
    // Listen for route changes (only NavigationEnd to avoid multiple calls)
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateRouteAndSearch()
      })
  }

  updateRouteAndSearch() {
    // Check if we're on the my-videos route
    this.updateRouteState()
    
    // Unsubscribe from previous query params subscription if exists
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe()
    }
    
    // Get current query params immediately
    const currentParams = this.route.snapshot.queryParams
    this.searchQuery = currentParams['search'] || ''
    this.isSearching = !!this.searchQuery
    
    // Load videos immediately with current params
    this.loadVideos()
    
    // Subscribe to future query param changes
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || ''
      this.isSearching = !!this.searchQuery
      this.loadVideos()
    })
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe()
    }
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe()
    }
  }

  updateRouteState() {
    this.isMyVideos = this.router.url.includes('/my-videos')
  }

  loadVideos() {
    this.loading = true
    this.error = ''
    
    // Determine which API to call based on route and search query
    let videoObservable
    
    if (this.isMyVideos) {
      // Always load user's videos for my-videos route
      videoObservable = this.video.getMyVideos()
    } else if (this.isSearching && this.searchQuery.trim()) {
      // Search videos if there's a search query
      videoObservable = this.video.search(this.searchQuery)
    } else {
      // Load all videos by default
      videoObservable = this.video.getAll()
    }
    
    videoObservable.subscribe({
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

  goToProfile() {
    this.router.navigate(['/profile'])
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

  startEdit(video: VideoItem) {
    this.updateData = {
      videoId: video._id,
      title: video.title,
      description: video.description,
      category: video.category || '',
      tags: video.tags ? video.tags.join(', ') : '',
      currentThumbnail: video.thumbnailUrl
    }
    this.updateThumbnailFile = null
    this.updateThumbnailPreview = null
    this.updateError = ''
    this.updateSuccess = ''
    this.showUpdate = true
  }

  cancelUpdate() {
    this.showUpdate = false
    this.updateData = {
      videoId: '',
      title: '',
      description: '',
      category: '',
      tags: '',
      currentThumbnail: ''
    }
    this.updateThumbnailFile = null
    this.updateThumbnailPreview = null
    this.updateError = ''
    this.updateSuccess = ''
  }

  onUpdateThumbnailSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      this.updateThumbnailFile = file
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.updateThumbnailPreview = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  onUpdate() {
    if (!this.updateData.title || !this.updateData.description) {
      this.updateError = 'Title and description are required'
      return
    }

    this.updating = true
    this.updateError = ''
    this.updateSuccess = ''

    const formData = new FormData()
    formData.append('title', this.updateData.title)
    formData.append('description', this.updateData.description)
    formData.append('category', this.updateData.category)
    formData.append('tags', this.updateData.tags)
    
    if (this.updateThumbnailFile) {
      formData.append('thumbnail', this.updateThumbnailFile)
    }

    this.video.update(this.updateData.videoId, formData).subscribe({
      next: (res) => {
        this.updating = false
        this.updateSuccess = res.message || 'Video updated successfully!'
        this.showUpdate = false
        setTimeout(() => {
          this.loadVideos()
        }, 1000)
      },
      error: (err) => {
        this.updating = false
        this.updateError = err || 'Failed to update video'
      }
    })
  }

  onDelete(videoId: string) {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    this.video.delete(videoId).subscribe({
      next: () => {
        this.loadVideos()
      },
      error: (err) => {
        this.error = err || 'Failed to delete video'
        setTimeout(() => {
          this.error = ''
        }, 3000)
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
