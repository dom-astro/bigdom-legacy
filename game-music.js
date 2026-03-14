// ============================================================
//  MUSIQUE MÉDIÉVALE — Web Audio API (synthèse pure)
// ============================================================

const _Music = (() => {
  let ctx = null, masterGain = null;
  let _playing = false;
  let _scheduledNodes = [];
  let _loopTimeout = null;

  // Gamme pentatonique de Ré dorien (médiévale)
  // D3 E3 F3 A3 C4 D4 E4 F4 A4 C5 D5
  const BASE = 146.83; // D3
  const SCALE = [0,2,3,7,10, 12,14,15,19,22, 24]; // demi-tons
  const freq = (step, oct=0) => BASE * Math.pow(2, (SCALE[step % SCALE.length] + Math.floor(step/SCALE.length)*12 + oct*12) / 12);

  // Motifs mélodiques (indices dans la gamme)
  const MOTIFS = [
    [0,2,3,5,3,2,0,  -1, 0,3,2,0,3,5],
    [5,3,2,0,2,3,5,   3, 5,7,5,3,2,0],
    [0,0,2,3,0,3,5,   3, 2,0,2,3,5,7],
    [7,5,3,2,3,5,3,   0, 2,3,5,3,2,0],
  ];

  // Bourdon grave (drone)
  const DRONE_FREQS = [BASE * 0.5, BASE, BASE * 1.5]; // D2, D3, A3

  function _initCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }

  // Crée un oscillateur avec enveloppe ADSR et le planifie
  function _note(frequency, startTime, duration, type='triangle', volume=0.4, vibrato=false) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    if (vibrato) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5.5;
      lfoGain.gain.value = frequency * 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + duration + 0.1);
      _scheduledNodes.push(lfo, lfoGain);
    }

    // Enveloppe douce (luth / flûte)
    const att = 0.04, dec = 0.08, sus = volume * 0.65, rel = duration * 0.35;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + att);
    gain.gain.linearRampToValueAtTime(sus, startTime + att + dec);
    gain.gain.setValueAtTime(sus, startTime + duration - rel);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    _scheduledNodes.push(osc, gain);
  }

  // Accord de luth pincé (arpège rapide)
  function _luthChord(rootFreq, startTime, dur) {
    const intervals = [1, 1.25, 1.5, 2]; // unisson, tierce, quinte, octave
    intervals.forEach((ratio, i) => {
      _note(rootFreq * ratio, startTime + i * 0.04, dur - i * 0.04, 'triangle', 0.28);
    });
  }

  // Bourdon continu (cornemuse / vielle)
  function _drone(startTime, duration) {
    DRONE_FREQS.forEach((f, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;

      // Filtre passe-bas pour adoucir la scie
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 600;
      filt.Q.value = 0.8;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.09 : 0.05, startTime + 1.5);
      gain.gain.setValueAtTime(i === 0 ? 0.09 : 0.05, startTime + duration - 1.5);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration);
      _scheduledNodes.push(osc, filt, gain);
    });
  }

  // Compose et planifie une phrase musicale complète (~32 secondes)
  function _schedulePhrase(startTime) {
    const BPM   = 58; // tempo lent et méditatif
    const BEAT  = 60 / BPM;
    const BAR   = BEAT * 4;

    // Choisir un motif aléatoire
    const motif = MOTIFS[Math.floor(Math.random() * MOTIFS.length)];
    const oct   = Math.random() < 0.3 ? 1 : 0; // variation octave

    // Bourdon sur toute la phrase (8 mesures)
    _drone(startTime, BAR * 8 + 1);

    // Mélodie flûte (sin doux) — notes du motif
    motif.forEach((step, i) => {
      if (step < 0) return; // pause
      const t   = startTime + i * BEAT * 1.8;
      const dur = BEAT * (Math.random() < 0.3 ? 1.6 : 0.9);
      _note(freq(step, oct), t, dur, 'sine', 0.38, true);
    });

    // Contrepoint luth — accords toutes les 2 mesures
    for (let bar = 0; bar < 8; bar += 2) {
      const t    = startTime + bar * BAR + BEAT * 0.5;
      const root = freq(bar % 4 === 0 ? 0 : 3, -1);
      _luthChord(root, t, BEAT * 1.4);
      _luthChord(root * (bar % 4 === 0 ? 1 : 1.125), t + BAR, BEAT * 1.2);
    }

    // Réponse mélodique (registre aigu, triangle)
    const reply = [3,5,3,2,0,2,3];
    reply.forEach((step, i) => {
      const t = startTime + (BAR * 4) + i * BEAT * 2;
      _note(freq(step, oct + 1), t, BEAT * 1.5, 'triangle', 0.22, true);
    });

    return startTime + BAR * 8; // retourne l'heure de fin
  }

  // Boucle principale
  function _loop() {
    if (!_playing) return;
    const phraseEnd = _schedulePhrase(ctx.currentTime + 0.1);
    const gap = (phraseEnd - ctx.currentTime) * 1000 - 800; // relancer 0.8s avant la fin
    _loopTimeout = setTimeout(_loop, Math.max(gap, 1000));
  }

  function _stopAllNodes() {
    _scheduledNodes.forEach(n => { try { n.stop ? n.stop(ctx.currentTime) : n.disconnect(); } catch(e){} });
    _scheduledNodes = [];
    if (_loopTimeout) { clearTimeout(_loopTimeout); _loopTimeout = null; }
  }

  return {
    isPlaying: () => _playing,

    start() {
      _initCtx();
      if (ctx.state === 'suspended') ctx.resume();
      _playing = true;
      _loop();
      _updateMusicBtn();
    },

    stop() {
      _playing = false;
      _stopAllNodes();
      // Fade out master
      if (masterGain) {
        masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        setTimeout(() => { if (!_playing && masterGain) masterGain.gain.setValueAtTime(0.18, ctx.currentTime); }, 1300);
      }
      _updateMusicBtn();
    },

    toggle() {
      _playing ? this.stop() : this.start();
    },
  };
})();

function toggleMusic() {
  _Music.toggle();
}

function _updateMusicBtn() {
  const on = _Music.isPlaying();
  $('#btnMusicIcon').text(on ? '🎵' : '🔇');
  $('#btnMusicLabel').text(on ? 'Musique : ON' : 'Musique : OFF');
}

function toggleMusic() {
  _Music.toggle();
}
