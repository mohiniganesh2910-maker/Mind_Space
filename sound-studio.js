'use strict';
(() => {
  const soundCatalog = [
    { id: 'forest', label: 'Forest ambience', group: 'Nature ambience', src: 'assets/sounds/forest-ambience.mp3', fav: false },
    { id: 'birdsong', label: 'Birds singing in the forest', group: 'Nature ambience', src: 'assets/sounds/birds-in-forest.mp3', fav: false },
    { id: 'wind', label: 'Wind blowing through trees', group: 'Nature ambience', src: 'assets/sounds/wind-through-trees.mp3', fav: false },
    { id: 'rain', label: 'Rain and thunder', group: 'Nature ambience', src: 'assets/sounds/rain-and-thunder.mp3', fav: false },
    { id: 'rain-soft', label: 'Gentle rainfall', group: 'Nature ambience', src: 'assets/sounds/gentle-rainfall.mp3', fav: false },
    { id: 'ocean', label: 'Gentle ocean waves', group: 'Nature ambience', src: 'assets/sounds/ocean-waves.mp3', fav: false },
    { id: 'river', label: 'Calm flowing river', group: 'Nature ambience', src: 'assets/sounds/river-flowing.mp3', fav: false },
    { id: 'waterfall', label: 'Waterfall ambience', group: 'Nature ambience', src: 'assets/sounds/waterfall.mp3', fav: false },
    { id: 'trees', label: 'Birds and distant frogs', group: 'Nature ambience', src: 'assets/sounds/birds-and-distant-frogs.mp3', fav: false },
    { id: 'crickets', label: 'Nighttime crickets', group: 'Nature ambience', src: 'assets/sounds/crickets.mp3', fav: false },
    { id: 'dawn', label: 'Forest birds at dawn', group: 'Nature ambience', src: 'assets/sounds/birds-in-forest.mp3', fav: false },
    { id: 'thunder', label: 'Thunderstorm with rain', group: 'Nature ambience', src: 'assets/sounds/thunderstorm-with-rain.mp3', fav: false },
    { id: 'campfire', label: 'Campfire crackling', group: 'Nature ambience', src: 'assets/sounds/campfire-crackling.mp3', fav: false },
    { id: 'garden', label: 'Peaceful garden ambience', group: 'Nature ambience', src: 'assets/sounds/birds-and-distant-frogs.mp3', fav: false },
  ];

  const presets = [
    { id: 'morning-forest', label: 'Morning Forest', sounds: ['birdsong', 'wind', 'forest'] },
    { id: 'rainy-evening', label: 'Rainy Evening', sounds: ['rain-soft', 'thunder', 'forest'] },
    { id: 'deep-focus', label: 'Deep Focus', sounds: ['forest', 'rain-soft'] },
    { id: 'ocean-calm', label: 'Ocean Calm', sounds: ['ocean', 'wind'] },
    { id: 'sleepy-night', label: 'Sleepy Night', sounds: ['crickets', 'dawn', 'garden'] },
    { id: 'peaceful-garden', label: 'Peaceful Garden', sounds: ['birdsong', 'garden', 'wind'] }
  ];

  const state = {
    context: null,
    masterGain: null,
    active: new Set(),
    favorites: [],
    recent: [],
    customMixes: [],
    muted: false,
    masterVolume: 0.72,
    sleepTimer: null,
    audioNodes: new Map(),
    chirpTimers: new Map(),
    soundVolume: {}
  };

  const soundList = document.getElementById('sound-list');
  const presetList = document.getElementById('preset-list');
  const favoriteList = document.getElementById('favorite-sounds');
  const recentList = document.getElementById('recent-sounds');
  const soundStatus = document.getElementById('sound-status');
  const activeCount = document.getElementById('active-count');
  const playingState = document.getElementById('playing-state');
  const mixName = document.getElementById('mix-name');

  function readStudioPrefs() {
    try {
      const raw = localStorage.getItem('mindspace:sound-studio');
      if (!raw) {
        state.favorites = [];
        state.recent = [];
        state.customMixes = [];
        return;
      }
      const parsed = JSON.parse(raw);
      state.favorites = Array.isArray(parsed.favorites) ? parsed.favorites : [];
      state.recent = Array.isArray(parsed.recent) ? parsed.recent.slice(0, 5) : [];
      state.customMixes = Array.isArray(parsed.customMixes) ? parsed.customMixes : [];
    } catch {
      state.favorites = [];
      state.recent = [];
      state.customMixes = [];
    }
  }

  function saveStudioPrefs() {
    try {
      localStorage.setItem('mindspace:sound-studio', JSON.stringify({
        favorites: state.favorites,
        recent: state.recent,
        customMixes: state.customMixes
      }));
    } catch {
      setStatus('Your sound choices could not be saved in this browser.');
    }
  }

  function setStatus(message) {
    soundStatus.textContent = message;
  }

  function updateSummary() {
    const count = state.active.size;
    activeCount.textContent = String(count);
    playingState.textContent = count ? `${count} layer${count === 1 ? '' : 's'} active` : 'Ready for your next layer';
  }

  function getSoundById(id) {
    return soundCatalog.find(sound => sound.id === id) || null;
  }

  function recordRecent(id) {
    if (!id) return;
    state.recent = [id, ...state.recent.filter(entry => entry !== id)].slice(0, 5);
    saveStudioPrefs();
    renderRecent();
  }

  function renderRecent() {
    if (!recentList) return;
    recentList.innerHTML = '';
    if (!state.recent.length) {
      recentList.innerHTML = '<p class="empty">No recent sounds yet.</p>';
      return;
    }
    state.recent.forEach(id => {
      const sound = getSoundById(id);
      if (!sound) return;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'mini-chip';
      item.textContent = sound.label;
      item.addEventListener('click', () => toggleSound(id, true));
      recentList.appendChild(item);
    });
  }

  function renderFavorites() {
    if (!favoriteList) return;
    favoriteList.innerHTML = '';
    if (!state.favorites.length) {
      favoriteList.innerHTML = '<p class="empty">Tap the star on any sound to favourite it.</p>';
      return;
    }
    const uniqueFavorites = [...new Set(state.favorites)];
    uniqueFavorites.forEach(id => {
      const sound = getSoundById(id);
      if (!sound) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mini-chip';
      chip.textContent = sound.label;
      chip.addEventListener('click', () => toggleSound(id, true));
      favoriteList.appendChild(chip);
    });
  }

  function buildPresetButtons() {
    presetList.innerHTML = '';
    presets.forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary preset-button';
      button.textContent = preset.label;
      button.addEventListener('click', () => applyPreset(preset));
      presetList.appendChild(button);
    });
  }

  function buildSoundCards() {
    soundList.innerHTML = '';
    const groups = [...new Set(soundCatalog.map(sound => sound.group))];
    groups.forEach(group => {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'sound-group-head';
      groupLabel.textContent = group;
      soundList.appendChild(groupLabel);

      soundCatalog.filter(sound => sound.group === group).forEach(sound => {
        const card = document.createElement('article');
        card.className = 'sound-card';
        card.dataset.soundId = sound.id;

        const titleRow = document.createElement('div');
        titleRow.className = 'sound-card-head';

        const label = document.createElement('div');
        label.className = 'sound-label';
        label.innerHTML = `<strong>${sound.label}</strong><small>${group}</small>`;

        const toggleWrap = document.createElement('div');
        toggleWrap.className = 'sound-toggle-row';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary small-button';
        button.textContent = state.active.has(sound.id) ? 'On' : 'Off';
        button.setAttribute('aria-pressed', String(state.active.has(sound.id)));
        button.addEventListener('click', () => toggleSound(sound.id));

        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'star-toggle';
        star.setAttribute('aria-label', state.favorites.includes(sound.id) ? 'Remove favourite' : 'Add favourite');
        star.textContent = state.favorites.includes(sound.id) ? '★' : '☆';
        star.addEventListener('click', () => toggleFavorite(sound.id));

        toggleWrap.appendChild(button);
        toggleWrap.appendChild(star);
        titleRow.appendChild(label);
        titleRow.appendChild(toggleWrap);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.step = '1';
        slider.value = String(state.soundVolume[sound.id] ?? 72);
        slider.addEventListener('input', event => {
          state.soundVolume[sound.id] = Number(event.target.value);
          if (state.active.has(sound.id)) {
            updateSoundVolume(sound.id, Number(event.target.value));
          }
        });

        card.appendChild(titleRow);
        card.appendChild(slider);
        soundList.appendChild(card);
      });
    });
  }

  function ensureAudioContext() {
    if (!state.context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        setStatus('This browser does not support the audio mixer.');
        return null;
      }
      const context = new AudioCtor();
      const masterGain = context.createGain();
      masterGain.gain.value = state.masterVolume;
      masterGain.connect(context.destination);
      state.context = context;
      state.masterGain = masterGain;
    }
    if (state.context.state === 'suspended') {
      state.context.resume();
    }
    return state.context;
  }

  function buildNoiseBuffer(context, duration = 2.4) {
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * 0.75;
    }
    return buffer;
  }

  function createNoiseLayer(soundId, config) {
    const context = ensureAudioContext();
    if (!context || !state.masterGain) return null;

    const source = context.createBufferSource();
    source.buffer = buildNoiseBuffer(context, config.duration || 3);
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = config.filterType || 'lowpass';
    filter.frequency.value = config.frequency || 1800;
    filter.Q.value = config.q || 0.1;

    const gain = context.createGain();
    const currentVolume = (state.soundVolume[soundId] ?? 72) / 100;
    gain.gain.value = config.baseGain || 0.0001;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(state.masterGain);
    source.start();

    state.audioNodes.set(soundId, { source, filter, gain, type: 'noise' });
    updateSoundVolume(soundId, currentVolume * 100);
    return source;
  }

  function triggerChirp(frequency, duration = 0.4, gainAmount = 0.05, type = 'triangle') {
    const context = ensureAudioContext();
    if (!context || !state.masterGain) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainAmount, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(state.masterGain);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  function scheduleChirpLoop(soundId, config) {
    const interval = config.interval || 1800;
    const timer = setInterval(() => {
      if (!state.active.has(soundId)) {
        clearInterval(timer);
        state.chirpTimers.delete(soundId);
        return;
      }
      const frequency = config.frequency ?? 2200;
      triggerChirp(frequency + (Math.random() * 300 - 150), config.duration || 0.32, config.gain || 0.045, config.type || 'triangle');
    }, interval);
    state.chirpTimers.set(soundId, timer);
  }

  function updateSoundVolume(soundId, relativeValue) {
    const node = state.audioNodes.get(soundId);
    if (!node) return;
    const volume = state.muted ? 0 : (relativeValue / 100) * state.masterVolume;
    if (node.type === 'recording') {
      node.source.volume = volume;
      return;
    }
    if (!node.gain || !state.context) return;
    node.gain.gain.setTargetAtTime(volume * (node.type === 'noise' ? 0.34 : 1), state.context.currentTime, 0.25);
  }

  function stopSound(soundId) {
    const node = state.audioNodes.get(soundId);
    if (node) {
      if (node.type === 'recording') {
        node.source.pause();
        node.source.currentTime = 0;
        state.audioNodes.delete(soundId);
      } else if (node.gain && state.context) {
        node.gain.gain.setTargetAtTime(0.0001, state.context.currentTime, 0.18);
        setTimeout(() => {
          try { node.source.stop(); } catch {} 
          state.audioNodes.delete(soundId);
        }, 180);
      } else {
        state.audioNodes.delete(soundId);
      }
    }
    const timer = state.chirpTimers.get(soundId);
    if (timer) {
      clearInterval(timer);
      state.chirpTimers.delete(soundId);
    }
  }

  function soundProfile(soundId) {
    const profiles = {
      forest: { type: 'noise', filterType: 'lowpass', frequency: 550, gain: 0.18, duration: 3 },
      birdsong: { type: 'chirp', interval: 1800, frequency: 2400, duration: 0.3, gain: 0.06 },
      wind: { type: 'noise', filterType: 'bandpass', frequency: 1100, gain: 0.16, duration: 3 },
      rain: { type: 'noise', filterType: 'highpass', frequency: 1500, gain: 0.14, duration: 2.5 },
      'rain-soft': { type: 'noise', filterType: 'highpass', frequency: 800, gain: 0.09, duration: 3 },
      ocean: { type: 'noise', filterType: 'lowpass', frequency: 700, gain: 0.18, duration: 4 },
      river: { type: 'noise', filterType: 'bandpass', frequency: 900, gain: 0.12, duration: 3 },
      waterfall: { type: 'noise', filterType: 'lowpass', frequency: 500, gain: 0.2, duration: 4 },
      trees: { type: 'noise', filterType: 'bandpass', frequency: 1000, gain: 0.15, duration: 3.5 },
      crickets: { type: 'chirp', interval: 2600, frequency: 3000, duration: 0.18, gain: 0.04 },
      dawn: { type: 'noise', filterType: 'lowpass', frequency: 700, gain: 0.14, duration: 4 },
      thunder: { type: 'noise', filterType: 'lowpass', frequency: 250, gain: 0.1, duration: 2 },
      campfire: { type: 'noise', filterType: 'lowpass', frequency: 390, gain: 0.14, duration: 3 },
      garden: { type: 'noise', filterType: 'bandpass', frequency: 900, gain: 0.11, duration: 3 },
    };
    return profiles[soundId] || { type: 'noise', filterType: 'lowpass', frequency: 600, gain: 0.12, duration: 3 };
  }

  function applyPreset(preset) {
    const activeSet = new Set(preset.sounds);
    state.active.clear();
    state.audioNodes.forEach((node, soundId) => {
      if (state.active.has(soundId)) return;
      stopSound(soundId);
    });
    preset.sounds.forEach(soundId => {
      state.active.add(soundId);
      const volume = state.soundVolume[soundId] ?? 72;
      startSound(soundId, volume);
      recordRecent(soundId);
    });
    renderSoundCards();
    updateSummary();
    setStatus(`${preset.label} is playing.`);
  }

  function toggleSound(soundId, forceOn) {
    const shouldActivate = typeof forceOn === 'boolean' ? forceOn : !state.active.has(soundId);
    if (shouldActivate) {
      startSound(soundId, state.soundVolume[soundId] ?? 72);
      state.active.add(soundId);
      recordRecent(soundId);
      setStatus(`${getSoundById(soundId)?.label || 'Sound'} added to your mix.`);
    } else {
      state.active.delete(soundId);
      stopSound(soundId);
      setStatus(`${getSoundById(soundId)?.label || 'Sound'} muted.`);
    }
    renderSoundCards();
    updateSummary();
  }

  function startSound(soundId, volume = 72) {
    const sound = getSoundById(soundId);
    if (sound?.src) {
      const existing = state.audioNodes.get(soundId);
      if (existing) {
        state.soundVolume[soundId] = volume;
        updateSoundVolume(soundId, volume);
        return;
      }
      const source = new Audio(sound.src);
      source.loop = true;
      source.preload = 'none';
      state.soundVolume[soundId] = volume;
      state.audioNodes.set(soundId, { source, type: 'recording' });
      updateSoundVolume(soundId, volume);
      source.play().catch(error => {
        if (state.audioNodes.get(soundId)?.source !== source) return;
        state.audioNodes.delete(soundId);
        state.active.delete(soundId);
        renderSoundCards();
        updateSummary();
        setStatus(`Could not play ${sound.label}: ${error.message}`);
      });
      return;
    }

    const profile = soundProfile(soundId);
    const context = ensureAudioContext();
    if (!context) return;

    state.soundVolume[soundId] = volume;
    if (profile.type === 'noise') {
      const existing = state.audioNodes.get(soundId);
      if (existing) {
        updateSoundVolume(soundId, volume);
        return;
      }
      createNoiseLayer(soundId, profile);
      updateSoundVolume(soundId, volume);
      return;
    }

    if (profile.type === 'chirp') {
      const existing = state.audioNodes.get(soundId);
      if (existing) {
        updateSoundVolume(soundId, volume);
        return;
      }
      state.audioNodes.set(soundId, { source: null, filter: null, gain: null, type: 'chirp' });
      scheduleChirpLoop(soundId, profile);
      updateSoundVolume(soundId, volume);
    }
  }

  function toggleFavorite(soundId) {
    const current = state.favorites.includes(soundId);
    state.favorites = current ? state.favorites.filter(id => id !== soundId) : [...new Set([soundId, ...state.favorites])];
    saveStudioPrefs();
    renderFavorites();
    renderSoundCards();
    setStatus(current ? 'Removed from favourites.' : 'Added to favourites.');
  }

  function saveCustomMix() {
    const value = (mixName.value || '').trim();
    if (!value) {
      setStatus('Name your custom mix before saving it.');
      return;
    }
    const mix = {
      name: value,
      sounds: [...state.active],
      createdAt: new Date().toISOString()
    };
    state.customMixes = [mix, ...state.customMixes.filter(item => item.name !== value)].slice(0, 6);
    saveStudioPrefs();
    setStatus(`Saved custom mix: ${value}.`);
    mixName.value = '';
  }

  function stopAll() {
    state.active.clear();
    state.audioNodes.forEach((value, soundId) => {
      if (value.type === 'recording') {
        value.source.pause();
        value.source.currentTime = 0;
      } else if (value.source) {
        try { value.source.stop(); } catch {} 
      }
      state.audioNodes.delete(soundId);
    });
    state.chirpTimers.forEach((timer) => clearInterval(timer));
    state.chirpTimers.clear();
    renderSoundCards();
    updateSummary();
    setStatus('All sounds stopped.');
  }

  function toggleMute() {
    state.muted = !state.muted;
    const button = document.getElementById('mute-toggle');
    if (button) {
      button.textContent = state.muted ? 'Unmute' : 'Mute';
    }
    state.audioNodes.forEach((node, soundId) => {
      updateSoundVolume(soundId, state.soundVolume[soundId] ?? 72);
    });
    setStatus(state.muted ? 'All audio is muted.' : 'Audio has been restored.');
  }

  function setMasterVolume(nextValue) {
    const value = Number(nextValue);
    state.masterVolume = value / 100;
    if (state.masterGain) {
      state.masterGain.gain.setTargetAtTime(state.muted ? 0 : state.masterVolume, state.context.currentTime, 0.2);
    }
    state.audioNodes.forEach((node, soundId) => {
      updateSoundVolume(soundId, state.soundVolume[soundId] ?? 72);
    });
  }

  function setSleepTimer(minutes) {
    if (state.sleepTimer) {
      clearTimeout(state.sleepTimer);
      state.sleepTimer = null;
    }
    const value = Number(minutes);
    if (!value) {
      setStatus('Sleep timer turned off.');
      return;
    }
    const milliseconds = value * 60 * 1000;
    state.sleepTimer = setTimeout(() => {
      stopAll();
      setStatus(`Sleep timer complete after ${value} minutes.`);
    }, milliseconds);
    setStatus(`Sleep timer set for ${value} minutes.`);
  }

  function playAll() {
    const available = [...new Set(soundCatalog.map(sound => sound.id).filter(id => !state.active.has(id)))];
    if (!available.length) {
      setStatus('All sounds are already active.');
      return;
    }
    available.slice(0, 3).forEach(id => toggleSound(id, true));
    setStatus('A few calming layers are now playing.');
  }

  function pauseAll() {
    state.active.forEach(soundId => {
      state.active.delete(soundId);
      stopSound(soundId);
    });
    renderSoundCards();
    updateSummary();
    setStatus('The mixer has been paused.');
  }

  function renderSoundCards() {
    buildSoundCards();
    updateSummary();
  }

  function setupEvents() {
    document.getElementById('play-all').addEventListener('click', playAll);
    document.getElementById('pause-all').addEventListener('click', pauseAll);
    document.getElementById('stop-all').addEventListener('click', stopAll);
    document.getElementById('mute-toggle').addEventListener('click', toggleMute);
    document.getElementById('save-mix').addEventListener('click', saveCustomMix);
    document.getElementById('sleep-timer').addEventListener('change', event => setSleepTimer(event.target.value));
    document.getElementById('master-volume').addEventListener('input', event => setMasterVolume(event.target.value));
  }

  readStudioPrefs();
  buildPresetButtons();
  renderFavorites();
  renderRecent();
  renderSoundCards();
  setupEvents();
})();
