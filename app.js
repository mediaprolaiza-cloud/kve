class CloudinaryVideoPlayerApp {
    constructor() {
        this.videoPlayer = null;
        this.deferredPrompt = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.initVideoPlayer();
        this.initPWA();
        this.updateOnlineStatus();
        
        // Load default video
        this.loadVideo('https://res.cloudinary.com/demo/video/upload/sample.mp4');
    }
    
    bindEvents() {
        // Load video button
        document.getElementById('loadVideo').addEventListener('click', () => {
            const url = document.getElementById('videoUrl').value;
            if (url) {
                this.loadVideo(url);
            }
        });
        
        // Sample video buttons
        document.querySelectorAll('.sample-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                document.getElementById('videoUrl').value = url;
                this.loadVideo(url);
            });
        });
        
        // Enter key in input field
        document.getElementById('videoUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loadVideo').click();
            }
        });
        
        // Install button
        document.getElementById('installBtn').addEventListener('click', () => {
            this.installPWA();
        });
        
        // Online/offline status
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
    }
    
    initVideoPlayer() {
        // Initialize Cloudinary Video Player
        const cld = cloudinary.Cloudinary.new({ cloud_name: 'demo' });
        
        this.videoPlayer = cld.videoPlayer('cloudinary-video-player', {
            autoplay: true,
            muted: false,
            controls: true,
            transformation: { quality: 'auto' }
        });
        
        // Add player event listeners
        this.videoPlayer.on('play', () => {
            document.getElementById('videoStatus').textContent = 'Playing';
            document.getElementById('videoStatus').style.color = '#10b981';
        });
        
        this.videoPlayer.on('pause', () => {
            document.getElementById('videoStatus').textContent = 'Paused';
            document.getElementById('videoStatus').style.color = '#f59e0b';
        });
        
        this.videoPlayer.on('ended', () => {
            document.getElementById('videoStatus').textContent = 'Ended';
            document.getElementById('videoStatus').style.color = '#ef4444';
        });
        
        this.videoPlayer.on('error', () => {
            document.getElementById('videoStatus').textContent = 'Error';
            document.getElementById('videoStatus').style.color = '#ef4444';
        });
    }
    
    loadVideo(url) {
        try {
            document.getElementById('videoStatus').textContent = 'Loading...';
            document.getElementById('videoStatus').style.color = '#3b82f6';
            
            // Update video source display
            document.getElementById('videoSource').textContent = 
                url.includes('cloudinary.com') ? 'Cloudinary' : 'External URL';
            
            // Extract public ID from Cloudinary URL
            if (url.includes('cloudinary.com')) {
                const matches = url.match(/upload\/(.+)/);
                if (matches && matches[1]) {
                    const publicId = matches[1].replace(/\.[^/.]+$/, "");
                    this.videoPlayer.source(publicId);
                } else {
                    // If can't extract public ID, use URL directly
                    this.videoPlayer.source({ sourceTypes: ['mp4'], source: url });
                }
            } else {
                // For non-Cloudinary URLs
                this.videoPlayer.source({ sourceTypes: ['mp4'], source: url });
            }
            
            console.log('Video loaded:', url);
        } catch (error) {
            console.error('Error loading video:', error);
            document.getElementById('videoStatus').textContent = 'Error loading video';
            document.getElementById('videoStatus').style.color = '#ef4444';
        }
    }
    
    initPWA() {
        // Check if PWA is installable
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'block';
            document.getElementById('pwaStatus').textContent = 'Installable';
            document.getElementById('pwaStatus').style.color = '#10b981';
        });
        
        // Check if already installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            document.getElementById('installBtn').style.display = 'none';
            document.getElementById('pwaStatus').textContent = 'Installed';
            document.getElementById('pwaStatus').style.color = '#10b981';
        });
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    }
    
    async installPWA() {
        if (!this.deferredPrompt) {
            alert('PWA installation is not available or already installed');
            return;
        }
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            document.getElementById('installBtn').style.display = 'none';
        } else {
            console.log('User dismissed the install prompt');
        }
        
        this.deferredPrompt = null;
    }
    
    updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const statusElement = document.getElementById('offlineStatus');
        
        if (isOnline) {
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> Online';
            statusElement.className = 'offline-indicator';
            statusElement.style.color = '';
        } else {
            statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
            statusElement.className = 'offline-indicator offline';
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CloudinaryVideoPlayerApp();
});