// Screen Wake Lock Manager with Fallback for iOS / WebViews
// Prevents the screen from turning off, dimming, or sleeping during Focus Sessions & Exams

type WakeLockListener = (isActive: boolean) => void;

class ScreenWakeLockManager {
  private sentinel: any = null;
  private activeTags: Set<string> = new Set();
  private listeners: Set<WakeLockListener> = new Set();
  private isRequestPending: boolean = false;
  private fallbackVideo: HTMLVideoElement | null = null;
  private isNativeSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isNativeSupported = 'wakeLock' in navigator && typeof (navigator as any).wakeLock?.request === 'function';
      
      // Auto re-acquire lock when tab / window becomes visible again
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.activeTags.size > 0) {
          this.acquireNativeLock();
        }
      });

      // User interaction listener to re-try acquisition if browser blocked background request
      const handleUserGesture = () => {
        if (this.activeTags.size > 0 && !this.sentinel) {
          this.acquireNativeLock();
        }
      };

      window.addEventListener('click', handleUserGesture, { passive: true });
      window.addEventListener('touchstart', handleUserGesture, { passive: true });
    }
  }

  public isSupported(): boolean {
    return this.isNativeSupported;
  }

  public isLocked(): boolean {
    return this.activeTags.size > 0;
  }

  public getActiveTags(): string[] {
    return Array.from(this.activeTags);
  }

  public subscribe(listener: WakeLockListener): () => void {
    this.listeners.add(listener);
    listener(this.isLocked());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const locked = this.isLocked();
    this.listeners.forEach((fn) => {
      try {
        fn(locked);
      } catch (e) {
        console.error('Wake lock listener error:', e);
      }
    });
  }

  // Request wake lock for a specific module/session (e.g. 'pomodoro', 'exam', 'app-wide')
  public async requestLock(tag: string = 'default'): Promise<boolean> {
    this.activeTags.add(tag);
    this.notify();
    return this.acquireNativeLock();
  }

  // Release wake lock for a specific tag
  public async releaseLock(tag: string = 'default'): Promise<void> {
    this.activeTags.delete(tag);
    this.notify();

    if (this.activeTags.size === 0) {
      await this.releaseNativeLock();
    }
  }

  // Internal: Acquire native wake lock
  private async acquireNativeLock(): Promise<boolean> {
    if (typeof window === 'undefined' || this.isRequestPending) return false;

    if (this.isNativeSupported) {
      try {
        this.isRequestPending = true;
        if (this.sentinel && !this.sentinel.released) {
          this.isRequestPending = false;
          return true;
        }

        const lock = await (navigator as any).wakeLock.request('screen');
        this.sentinel = lock;

        lock.addEventListener('release', () => {
          this.sentinel = null;
          // If we still have active tags and tab is visible, try re-acquiring
          if (this.activeTags.size > 0 && typeof document !== 'undefined' && document.visibilityState === 'visible') {
            this.acquireNativeLock();
          }
        });

        this.isRequestPending = false;
        return true;
      } catch (err: any) {
        this.isRequestPending = false;
        console.warn('Native Screen Wake Lock request not permitted or failed, falling back:', err?.message || err);
        this.startFallbackKeepAwake();
        return false;
      }
    } else {
      this.startFallbackKeepAwake();
      return true;
    }
  }

  // Internal: Release native lock & fallback
  private async releaseNativeLock(): Promise<void> {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (e) {}
      this.sentinel = null;
    }
    this.stopFallbackKeepAwake();
  }

  // Fallback for browsers/webviews (e.g. older Safari or iframe constraints)
  private startFallbackKeepAwake() {
    if (typeof document === 'undefined') return;
    try {
      if (!this.fallbackVideo) {
        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.muted = true;
        video.style.position = 'fixed';
        video.style.bottom = '0';
        video.style.right = '0';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.001';
        video.style.pointerEvents = 'none';
        video.style.zIndex = '-9999';

        // 1-frame blank WebM/MP4 data URI
        video.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAAhmcmVlAAAANG1kYXQAAAGWAQAADGgCAAAAGFBYk1vdmlvbiBWSURFTyAAAAAAMQADAAAAG21vb3YAAABsbXZoZAAAAAB2u2VsdrtlbQAAA+gAAAPoAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAJdHJhawAAAFx0a2hkAAAACHa7ZW22u2VtAAAAAQAAAAAAAAPoAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACNlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAPsAAAAAAAEAAAAAAAZtZGlhAAAAIG1kaGQAAAAAdrtlbba7ZW0AAAPoAAAD6AAAAAAAAAAYaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAGUbWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcadmVmAAAAAhtldGEAAAAIZGxycjAAAAA=';
        
        document.body.appendChild(video);
        this.fallbackVideo = video;
      }
      
      const playPromise = this.fallbackVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback autoplay restriction
        });
      }
    } catch (e) {
      // Fallback ignore
    }
  }

  private stopFallbackKeepAwake() {
    if (this.fallbackVideo) {
      try {
        this.fallbackVideo.pause();
        if (this.fallbackVideo.parentNode) {
          this.fallbackVideo.parentNode.removeChild(this.fallbackVideo);
        }
      } catch (e) {}
      this.fallbackVideo = null;
    }
  }
}

export const wakeLockManager = new ScreenWakeLockManager();
