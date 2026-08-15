/* ============================================================
   MOBILE-OPTIMIZED SCRIPT: PROTECTION & TOUCH PLAYER
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

  if (!video) return;

  // Security: Prevent Context Menu (Right Click / Tap & Hold on Mobile)
  [videoFrame, shield, playOverlay].forEach(el => {
    if (el) {
      el.addEventListener('contextmenu', e => e.preventDefault());
      el.addEventListener('touchstart', e => {
        // Prevent long press save image/video dialog on iOS/Android
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

  playOverlay.addEventListener('click', togglePlay);
  shield.addEventListener('click', togglePlay);
  playPauseBtn.addEventListener('click', togglePlay);

  // Mute / Unmute
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

  // Format Time Helper
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  video.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(video.duration || 0);
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${pct}%`;
    currentTimeEl.textContent = formatTime(video.currentTime);
  });

  // Touch & Click Seeking
  function handleSeek(e) {
    const rect = progressWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
  }

  progressWrapper.addEventListener('click', handleSeek);
  progressWrapper.addEventListener('touchstart', handleSeek, { passive: true });

  // Fullscreen Engine (Supports iOS Safari & Android Chrome)
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (videoFrame.requestFullscreen) {
        videoFrame.requestFullscreen();
      } else if (videoFrame.webkitRequestFullscreen) {
        videoFrame.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        /* iOS Safari Native Video Fullscreen Fallback */
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

  // Reset UI when Video Ends
  video.addEventListener('ended', () => {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    playOverlay.classList.remove('fade-out');
    progressBar.style.width = '0%';
  });
});
