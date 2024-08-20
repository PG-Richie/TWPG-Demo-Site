document.addEventListener('DOMContentLoaded', () => {
  let utterance;
  let isPlaying = false;
  let progressBarInterval;
  let startTime;
  let totalDuration;
  let isDragging = false;
  let currentSpeechTime = 0;

  const playButton = document.querySelector('.toggle-play');
  const volumeButton = document.querySelector('.volume-button');
  const progressBar = document.querySelector('.timeline');
  const progressFill = document.querySelector('.progress');
  const currentTimeDisplay = document.querySelector('.current');
  const totalTimeDisplay = document.querySelector('.length');

  function playArticle() {
      if (!isPlaying) {
          const article = document.querySelector('#main .inner section').innerText;
          utterance = new SpeechSynthesisUtterance(article);

          // Simple language detection based on content
          utterance.lang = /[^\u0000-\u00ff]/.test(article) ? 'zh-TW' : 'en-US';

          // Start speaking
          speechSynthesis.speak(utterance);
          isPlaying = true;

          // Toggle buttons
          playButton.classList.add('playing');
          playButton.classList.remove('play');
          volumeButton.classList.remove('paused');

          // Start the progress bar
          startTime = new Date().getTime();
          totalDuration = article.length / 15 * 1000; // Estimate duration based on text length
          startProgressBar();

          // Update time display and progress
          utterance.onstart = () => {
              totalTimeDisplay.textContent = formatTime(totalDuration);
              currentSpeechTime = 0; // Reset current speech time
          };

          utterance.onend = () => {
              isPlaying = false;
              playButton.classList.add('play');
              playButton.classList.remove('playing');
              volumeButton.classList.add('paused');
              resetProgressBar();
          };
      }
  }

  function pauseArticle() {
      if (isPlaying) {
          speechSynthesis.pause();
          isPlaying = false;

          // Toggle buttons
          playButton.classList.add('play');
          playButton.classList.remove('playing');
          volumeButton.classList.add('paused');
      }
  }

  function resumeArticle() {
      if (!isPlaying) {
          speechSynthesis.resume();
          isPlaying = true;

          // Toggle buttons
          playButton.classList.add('playing');
          playButton.classList.remove('play');
          volumeButton.classList.remove('paused');

          // Continue the progress bar
          startTime = new Date().getTime() - currentSpeechTime;
          startProgressBar();
      }
  }

  function startProgressBar() {
      progressBarInterval = setInterval(() => {
          if (!isPlaying) return;

          const elapsedTime = new Date().getTime() - startTime;
          currentSpeechTime = elapsedTime;
          const progressPercentage = Math.min(100, (elapsedTime / totalDuration) * 100);
          progressFill.style.width = progressPercentage + '%';
          currentTimeDisplay.textContent = formatTime(elapsedTime);
      }, 1000);
  }

  function resetProgressBar() {
      clearInterval(progressBarInterval);
      progressFill.style.width = '0%';
      currentTimeDisplay.textContent = '0:00';
  }

  function formatTime(ms) {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function setProgressFromEvent(event) {
      const progressBarRect = progressBar.getBoundingClientRect();
      const clickPosition = event.clientX - progressBarRect.left;
      const progressPercentage = (clickPosition / progressBarRect.width) * 100;
      progressFill.style.width = Math.min(100, Math.max(0, progressPercentage)) + '%';
      
      // Calculate new playback position
      const newPlaybackTime = (progressPercentage / 100) * totalDuration;
      startTime = new Date().getTime() - newPlaybackTime;
      
      // Update time display
      currentTimeDisplay.textContent = formatTime(newPlaybackTime);
      
      // Sync speech synthesis
      if (isPlaying) {
          pauseArticle();
          utterance.onend = null; // Prevent resetting on end of speech
          speechSynthesis.cancel();
          playArticle();
      }
  }

  // Event listeners for progress bar interaction
  progressBar.addEventListener('mousedown', (event) => {
      isDragging = true;
      setProgressFromEvent(event);
  });
  progressBar.addEventListener('mouseup', (event) => {
      isDragging = false;
      setProgressFromEvent(event);
  });
  progressBar.addEventListener('mousemove', (event) => {
      if (isDragging) {
          setProgressFromEvent(event);
      }
  });

  // Event listeners for play/pause buttons
  playButton.addEventListener('click', () => {
      if (isPlaying) {
          pauseArticle();
      } else {
          playArticle();
      }
  });

  volumeButton.addEventListener('click', () => {
      if (isPlaying) {
          pauseArticle();
      } else {
          resumeArticle();
      }
  });

  // Stop the audio and reset the playback state when the page is refreshed
  window.addEventListener('beforeunload', () => {
      if (isPlaying) {
          speechSynthesis.cancel();
          isPlaying = false;
          resetProgressBar();
          playButton.classList.add('play');
          playButton.classList.remove('playing');
          volumeButton.classList.add('paused');
      }
  });
});
