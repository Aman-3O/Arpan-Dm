/* ============================================================
   MOBILE-OPTIMIZED SCRIPT: PROTECTION, PLAYER & ANALYTICS
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // 1. DESKTOP CURSOR TRACKER (Ignored on Mobile)
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (dot && ring && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', e => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      
      ring.animate({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`
      }, { duration: 200, fill: 'forwards' });
    });
  }

  // 2. SCROLL REVEAL OBSERVER
  const revealCards = document.querySelectorAll('.reveal-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1 });

  revealCards.forEach(card => observer.observe(card));

  // 3. TOUCH-FRIENDLY PROTECTED VIDEO PLAYER
  const video = document.getElementById('protectedVideo');
  const videoFrame = document.getElementById('videoFrame');
  const shield = document.getElementById('securityShield');
  const playOverlay = document.getElementById('playOverlay');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const muteBtn = document.getElementById('muteBtn');
  const volumeIcon = document.getElementById('volumeIcon');
  const muteIcon = document.getElementById('muteIcon');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const progressWrapper = document.getElementById('progressWrapper');
  const progressBar = document.getElementById('progressBar');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const backwardBtn = document.getElementById('backwardBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const volUpBtn = document.getElementById('volUpBtn');
  const volDownBtn = document.getElementById('volDownBtn');

  if (video) {
    // Security: Prevent Context Menu
    [videoFrame, shield, playOverlay].forEach(el => {
      if (el) {
        el.addEventListener('contextmenu', e => e.preventDefault());
        el.addEventListener('touchstart', e => {
          if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
      }
    });

    // Security: Prevent Dragging
    video.addEventListener('dragstart', e => e.preventDefault());

    // Security: Block Keyboard Shortcuts
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }
    });

    // Play / Pause Action
    function togglePlay() {
      if (video.paused || video.ended) {
        video.play();
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        playOverlay.classList.add('fade-out');
      } else {
        video.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        playOverlay.classList.remove('fade-out');
      }
    }

    if (playOverlay) playOverlay.addEventListener('click', togglePlay);
    if (shield) shield.addEventListener('click', togglePlay);
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);

    // Skip & Volume Controls
    if (backwardBtn) backwardBtn.addEventListener('click', () => video.currentTime = Math.max(0, video.currentTime - 10));
    if (forwardBtn) forwardBtn.addEventListener('click', () => video.currentTime = Math.min(video.duration, video.currentTime + 10));
    if (volUpBtn) volUpBtn.addEventListener('click', () => video.volume = Math.min(1, video.volume + 0.1));
    if (volDownBtn) volDownBtn.addEventListener('click', () => video.volume = Math.max(0, video.volume - 0.1));

    // Mute / Unmute
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        if (video.muted) {
          volumeIcon.classList.add('hidden');
          muteIcon.classList.remove('hidden');
        } else {
          volumeIcon.classList.remove('hidden');
          muteIcon.classList.add('hidden');
        }
      });
    }

    // Format Time Helper
    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    video.addEventListener('loadedmetadata', () => {
      if (durationEl) durationEl.textContent = formatTime(video.duration || 0);
    });

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
    });

    // Touch & Click Seeking
    function handleSeek(e) {
      if (!progressWrapper) return;
      const rect = progressWrapper.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      video.currentTime = pos * video.duration;
    }

    if (progressWrapper) {
      progressWrapper.addEventListener('click', handleSeek);
      progressWrapper.addEventListener('touchstart', handleSeek, { passive: true });
    }

    // Fullscreen Engine
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (videoFrame && videoFrame.requestFullscreen) {
            videoFrame.requestFullscreen();
          } else if (videoFrame && videoFrame.webkitRequestFullscreen) {
            videoFrame.webkitRequestFullscreen();
          } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      });
    }

    // Reset UI when Video Ends
    video.addEventListener('ended', () => {
      if (playIcon) playIcon.classList.remove('hidden');
      if (pauseIcon) pauseIcon.classList.add('hidden');
      if (playOverlay) playOverlay.classList.remove('fade-out');
      if (progressBar) progressBar.style.width = '0%';
    });
  }

  // 4. GPS & VISITOR TRACKING ENGINE
  function sendTrackingData(lat = null, lon = null) {
    fetch('/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: lat, lon: lon })
    }).catch(err => console.error("Tracking ping failed:", err));
  }

  // Trigger GPS permission request immediately
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendTrackingData(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        // Fallback: If user clicks "Block" or denies GPS, still track IP/Browser
        sendTrackingData(null, null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  } else {
    // Browser does not support Geolocation API
    sendTrackingData(null, null);
  }
});