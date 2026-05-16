let _drawLocked = false;

// ============================================================
//  RETOUR ARRIÈRE — snapshot avant tirage
// ============================================================
let _drawSnapshot = null;

function _saveDrawSnapshot() {
  const serializeCI = ci => ({ cardDef: ci.cardDef, currentFace: ci.currentFace });
  _drawSnapshot = {
    deck:       gameState.deck.map(serializeCI),
    play:       gameState.play.map(serializeCI),
    stayInPlay: (gameState.stayInPlay || []).map(serializeCI),
    staging:   JSON.parse(JSON.stringify(gameState.staging.map(e => ({
                 ...e,
                 cardInstance: serializeCI(e.cardInstance),
                 sacrificeCardInstance: e.sacrificeCardInstance ? serializeCI(e.sacrificeCardInstance) : undefined,
               })))),
    discard:   gameState.discard.map(serializeCI),
    resources: { ...gameState.resources },
    fame:      gameState.fame,
    turn:      gameState.turn,
    bandits:   JSON.parse(JSON.stringify(gameState.bandits)),
    turnStarted: gameState.turnStarted,
    cardStateMap: { ...cardStateMap },
    choiceNeeded: [...choiceNeeded],
  };
}

function undoDraw() {
  if (!_drawSnapshot) return;
  const snap = _drawSnapshot;
  _drawSnapshot = null;
  cardStateMap = { ...snap.cardStateMap };
  choiceNeeded = new Set(snap.choiceNeeded);
  const rehydrate = list => list.map(s => ({ cardDef: s.cardDef, currentFace: s.currentFace }));
  gameState.deck      = rehydrate(snap.deck);
  gameState.play      = rehydrate(snap.play);
  gameState.stayInPlay = rehydrate(snap.stayInPlay || []);
  gameState.discard   = rehydrate(snap.discard);
  gameState.staging   = snap.staging.map(e => ({
    ...e,
    cardInstance: { cardDef: e.cardInstance.cardDef, currentFace: e.cardInstance.currentFace },
    sacrificeCardInstance: e.sacrificeCardInstance
      ? { cardDef: e.sacrificeCardInstance.cardDef, currentFace: e.sacrificeCardInstance.currentFace }
      : undefined,
  }));
  gameState.resources = { ...snap.resources };
  gameState.fame      = snap.fame;
  gameState.turn      = snap.turn;
  gameState.bandits   = JSON.parse(JSON.stringify(snap.bandits));
  gameState.turnStarted = snap.turnStarted;
  addLog('↩ Tirage annulé — les cartes sont retournées dans la pioche.', true);
  updateUI();
}

function drawCards(n) {
  //if (_drawLocked) return;
  if (gameState.deck.length === 0) { addLog('La pioche est vide !'); return; }
  _saveDrawSnapshot();
  if (gameState.turnStarted && gameState.staging.length === 0) clearResources();
  gameState.turnStarted = true;
  const toDraw = Math.min(n, gameState.deck.length);

  // Capturer la position de la pioche AVANT updateUI
  const deckEl = document.querySelector('#deckVisual .card-front');
  const deckRect = deckEl ? deckEl.getBoundingClientRect() : null;

  // Mémoriser les numéros des cartes déjà en jeu (pour les animations)
  const existingPlayNums = new Set(gameState.play.map(ci => ci.cardDef.numero));
  const existingStayInPlayNums = new Set((gameState.stayInPlay || []).map(ci => ci.cardDef.numero));
  window._dealExistingPlayNums = existingPlayNums;
  window._dealExistingStayInPlayNums = existingStayInPlayNums;

  // Si une carte or fait partie du même tirage que le bandit, elle est bloquée
  // automatiquement et prioritairement — sans modal de choix.
  const _eruptionWasActiveBeforeDraw = gameState.eruptionActive;
  const _banditQueue = [];
  const _banditsToPlace = [];
  const _blockedInQueue = new Set();
  const newCardNums = new Set(); // numéros des cartes tirées dans CE tirage

  const _cardsToPlayTemp = []; // Temporarily hold cards for play area
  const _cardsToStayInPlayTemp = []; // Temporarily hold cards for stayInPlay area

  for (let i = 0; i < toDraw; i++) {
    const card = gameState.deck.shift();

    // Spécificité pour la carte #90 (Bijoux) : devient permanente quand elle est tirée
    if (card.cardDef.numero === 90) {
      if (!gameState.permanent.some(c => c.cardDef.numero === 90)) {
        // Présenter la carte avant de l'ajouter aux permanentes
        _showBijouxPresentationModal(card);
        addLog(`✨ <span class="log-card">${getFaceData(card).nom}</span> est tirée !`, true);
      } else {
        // Déjà permanente, mais dans la pioche (anormal). On la joue normalement.
        gameState.play.push(card);
        _cardsToPlayTemp.push(card);
        newCardNums.add(card.cardDef.numero);
      }
    } else if (!isBandit(card)) {
      newCardNums.add(card.cardDef.numero);
      // ── Effet Passif "Reste en jeu" : la carte va directement dans stayInPlay ──
      if (isStayInPlay(getFaceData(card))) {
        _cardsToStayInPlayTemp.push(card);
      } else {
        gameState.play.push(card);
        _cardsToPlayTemp.push(card);
      }
    } else {
      gameState.play.push(card);
      _cardsToPlayTemp.push(card);
      _banditsToPlace.push(card);
    }
  }

  _cardsToStayInPlayTemp.forEach(card => {
    if (!gameState.stayInPlay) gameState.stayInPlay = [];
    // Éviter les doublons (la carte peut déjà y être d'un tour précédent)
    if (!gameState.stayInPlay.some(c => c.cardDef.numero === card.cardDef.numero)) {
      gameState.stayInPlay.push(card);
      addLog(`🏚️ <span class="log-card">${getFaceData(card).nom}</span> — entre en jeu et reste jusqu'à la fin de la manche.`, true);
    }
  });

  _banditsToPlace.forEach(card => {
    const banditNum = card.cardDef.numero;
    const newGold = gameState.play
      .filter(c => !isBandit(c) && producesGold(c) &&
                   newCardNums.has(c.cardDef.numero) &&
                   !gameState.bandits.some(b => b.blockedNum === c.cardDef.numero) &&
                   !_blockedInQueue.has(c.cardDef.numero));

    gameState.bandits.push({ banditNum, blockedNum: null, pendingChoice: true });

    if (newGold.length === 0) {
      // Aucun nouveau terrain or -> on ne fait rien
      _banditQueue.push({ banditNum, goldCards: [] });
    } else if (newGold.length === 1) {
      // 1 seul nouveau terrain or -> on bloque automatiquement
      _blockedInQueue.add(newGold[0].cardDef.numero);
      _banditQueue.push({ banditNum, goldCards: newGold, autoBlock: newGold[0] });
    } else {
      // 2 terrains ou plus -> choix parmi les nouveaux terrains
      _banditQueue.push({ banditNum, goldCards: newGold });
    }
  });

  addLog(`📜 Vous jouez ${toDraw} carte${toDraw > 1 ? 's' : ''}.`);
  
  // ── Éruption Volcanique (carte 28) ───────────────────────────
  // Si l'éruption était active AVANT ce tirage (pas tirée dans ce lot),
  // chercher un terrain parmi les nouvelles cartes
  if (_eruptionWasActiveBeforeDraw) {
    setTimeout(() => _resolveEruption(newCardNums, true), 50);
  }
  // Si la carte 28 vient d'être tirée dans ce lot, activer pour le prochain tirage
  if (newCardNums.has(28)) {
    const ci28 = gameState.play.find(c => c.cardDef.numero === 28);
    if (ci28 && getFaceData(ci28).face === 1 || (ci28 && ci28.currentFace === 1)) {
      gameState.eruptionActive = true;
      addLog(`🌋 <span class="log-card">Éruption Volcanique</span> entre en jeu — le prochain terrain tiré sera détruit !`, true);
    }
  }

  processPendingFaceChoices();
  updateUI();
  window._dealExistingPlayNums = null;
  window._dealExistingStayInPlayNums = null;

  // Masquer les nouvelles cartes pour l'animation
  const playAreaHide = document.getElementById('playArea');
  if (playAreaHide) {
    Array.from(playAreaHide.querySelectorAll('.card-wrapper[data-card-num]'))
      .filter(w => !existingPlayNums.has(parseInt(w.dataset.cardNum)))
      .forEach(w => { const c = w.querySelector('.card'); if (c) c.style.visibility = 'hidden'; });
  }

  // Masquer les nouvelles cartes "Reste en jeu" pour l'animation
  const heldAreaEl = document.getElementById('heldArea');
  if (heldAreaEl) {
    _cardsToStayInPlayTemp.forEach(card => {
      const wrapper = heldAreaEl.querySelector(`.card-wrapper[data-held-num="${card.cardDef.numero}"]`);
      if (wrapper) {
        const c = wrapper.querySelector('.card');
        if (c) c.style.visibility = 'hidden';
      }
    });
  }

  requestAnimationFrame(() => {
    // Animer les cartes vers la zone de jeu
    applyDealAnimations(existingPlayNums, deckRect);

    // Animer les cartes "Reste en jeu" vers la zone de retenue
    if (_cardsToStayInPlayTemp.length > 0 && deckRect) {
      const newHeldWrappers = _cardsToStayInPlayTemp.map(card =>
        heldAreaEl ? heldAreaEl.querySelector(`.card-wrapper[data-held-num="${card.cardDef.numero}"]`) : null
      ).filter(Boolean);
      applyHeldDealAnimations(newHeldWrappers, deckRect);
    }

    // Résoudre les bandits après la fin des animations
    if (!pendingFaceChoice && _banditQueue.length > 0) {
      // Calculer le délai maximum pour toutes les animations de distribution
      const maxPlayAnimDelay = (_cardsToPlayTemp.length > 0) ? (_cardsToPlayTemp.length - 1) * 220 + 1000 : 0;
      const maxHeldAnimDelay = (_cardsToStayInPlayTemp.length > 0) ? (_cardsToStayInPlayTemp.length - 1) * 220 + 1000 : 0;
      const totalAnimDelay = Math.max(maxPlayAnimDelay, maxHeldAnimDelay) + 100; // Ajouter une petite marge

      setTimeout(() => _resolveBanditQueue(_banditQueue), totalAnimDelay);
    }
  });
}

function clearResources() {
  gameState.resources = { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, marchandise:0 };
}

// Si une carte était en retainedCards et a été temporairement déplacée dans play[]
// pour une activation via modal, la remettre dans retainedCards si le modal est annulé.
function _restoreRetainedIfNeeded(playIndex) {
  if (playIndex == null || window._pendingRetainedActivateNum == null) return;
  const cardNum = window._pendingRetainedActivateNum;
  window._pendingRetainedActivateNum = null;
  const idx = gameState.play.findIndex(c => c.cardDef.numero === cardNum);
  if (idx >= 0) {
    const [ci] = gameState.play.splice(idx, 1);
    if (!gameState.retainedCards) gameState.retainedCards = [];
    gameState.retainedCards.push(ci);
    updateUI();
  }
}

function isStayInPlay(faceData) {
  if (!faceData.effet) return false;
  const effets = Array.isArray(faceData.effet) ? faceData.effet : [faceData.effet];
  return effets.some(e => e.type === 'Reste en jeu');
}

// Une carte nécessite un choix de face si :
// - elle a exactement 2 faces
// - aucune face n'est un Bandit (type Ennemi, nom Bandit)
// - la face 1 n'a PAS de promotion/promotions (sinon c'est un upgrade classique)
function isChoiceCard(cardDef) {
  if (cardDef.faces.length !== 2) return false;
  // Exclure les cartes Bandit
  if (cardDef.faces.some(f => f.type === 'Ennemi' && f.nom === 'Bandit')) return false;
  const face1 = cardDef.faces[0];
  return !face1.promotion && (!face1.promotions || face1.promotions.length === 0);
}

// ============================================================
//  FACE CHOICE — modal de choix de face pour les cartes alternatives
// ============================================================
let pendingFaceChoice = null; // { playIndex } — index dans play[] en attente de choix

function processPendingFaceChoices() {
  // Chercher les nouvelles cartes en jeu qui nécessitent un choix non encore fait
  for (let i = 0; i < gameState.play.length; i++) {
    const ci = gameState.play[i];
    if (choiceNeeded.has(ci.cardDef.numero)) {
      // Cette carte n'a pas encore eu son choix fait → ouvrir le modal
      pendingFaceChoice = i;
      showFaceChoiceModal(i);
      return; // traiter un à la fois (le modal est synchrone via interaction)
    }
  }
}

function showFaceChoiceModal(playIndex) {
  const ci = gameState.play[playIndex];
  updateUI(); // afficher la carte d'abord

  window._faceChoicePending = { playIndex, selectedFace: null };

  const typeColors = { Personne:'#3a5a8a', Terrain:'#2d5a27', Bâtiment:'#7a6a5a', Ennemi:'#6a0a0a' };

  let html = `
  <p style="margin-bottom:16px;font-family:'Crimson Text',serif;font-size:1rem;text-align:center;">
    Cette carte a <strong>deux identités possibles</strong>. Cliquez sur une carte pour voir son détail
    et la sélectionner, puis confirmez.
  </p>
  <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;" id="faceChoiceCards">`;

  ci.cardDef.faces.forEach(f => {
    const hasRes = f.ressources && f.ressources.length > 0;
    const resHTML = hasRes ? f.ressources.map(r => {
      const types = Array.isArray(r.type) ? r.type : [r.type];
      return types.map(t => `${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}`).join(' ');
    }).join(' · ') : '';
    const hasEffect = !!f.effet;
    const effectLabel = hasEffect
      ? (Array.isArray(f.effet) ? f.effet.map(e => e.type).join('/') : f.effet.type)
      : '';
    const bgColor = typeColors[f.type] || '#444';

    html += `
      <button
        id="faceChoiceBtn_${f.face}"
        onclick="selectFaceChoice(${playIndex}, ${f.face})"
        class="face-choice-btn"
        style="position:relative;">
        <div class="face-choice-emoji">${getCardEmoji(f.type, f.nom)}</div>
        <div class="face-choice-type" style="background:${bgColor};">${f.type}</div>
        <div class="face-choice-name">${f.nom}</div>
        ${resHTML ? `<div class="face-choice-res">⚒ ${resHTML}</div>` : ''}
        ${hasEffect ? `<div class="face-choice-effect">${effectLabel === 'Activable' ? '🟢' : effectLabel === 'Passif' ? '🔵' : '⚡'} Effet ${effectLabel}</div>` : ''}
        ${f.victoire ? `<div class="face-choice-fame">★ ${f.victoire} Gloire</div>` : ''}
        <div id="faceChoiceCheck_${f.face}" style="
          display:none;position:absolute;top:8px;right:8px;
          background:#44cc44;border-radius:50%;width:22px;height:22px;
          font-size:0.75rem;line-height:22px;text-align:center;color:#fff;
          box-shadow:0 0 8px rgba(68,204,68,0.6);">✓</div>
      </button>`;
  });

  html += `</div>

  <!-- Zone de détail inline — se remplit au clic sur une carte -->
  <div id="faceChoiceDetail" style="
    margin-top:18px;
    background:rgba(0,0,0,0.25);
    border:1px solid rgba(200,150,12,0.2);
    border-radius:10px;
    padding:16px 18px;
    min-height:60px;
    transition:opacity 0.15s;">
    <div style="font-family:'Crimson Text',serif;font-style:italic;color:#555;text-align:center;font-size:0.85rem;padding:8px 0;">
      ↑ Cliquez sur une identité pour afficher son détail
    </div>
  </div>

  <div style="margin-top:18px;text-align:center;">
    <p style="font-size:0.78rem;color:#aa8866;font-style:italic;margin-bottom:14px;">
      ⚠️ Ce choix est permanent et ne pourra pas être modifié.
    </p>
    <button id="btnConfirmFaceChoice" onclick="confirmFaceChoice()" disabled style="
      font-family:'Cinzel',serif;font-weight:700;font-size:0.82rem;letter-spacing:1.5px;
      text-transform:uppercase;padding:12px 36px;border-radius:8px;cursor:not-allowed;
      background:rgba(0,0,0,0.4);border:2px solid #444;color:#666;
      transition:all 0.25s;">
      ⚜ Confirmer l'identité
    </button>
  </div>`;

  $('#faceChoiceCardName').text(`#${ci.cardDef.numero} — Choisissez une identité`);
  $('#faceChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('faceChoiceModal')).show();
}

// Sélectionne une face, met à jour le visuel ET affiche le détail inline
function selectFaceChoice(playIndex, chosenFace) {
  const ci = gameState.play[playIndex];
  if (!ci) return;
  window._faceChoicePending = { playIndex, selectedFace: chosenFace };

  // Mettre à jour le visuel des boutons carte
  ci.cardDef.faces.forEach(f => {
    const btn   = document.getElementById(`faceChoiceBtn_${f.face}`);
    const check = document.getElementById(`faceChoiceCheck_${f.face}`);
    if (!btn || !check) return;
    const isSelected = f.face === chosenFace;
    btn.style.borderColor = isSelected ? '#f0c040' : 'var(--border-ornate)';
    btn.style.boxShadow   = isSelected ? '0 0 20px rgba(200,150,12,0.55), 0 8px 24px rgba(0,0,0,0.4)' : '';
    btn.style.transform   = isSelected ? 'translateY(-6px) scale(1.04)' : '';
    check.style.display   = isSelected ? 'block' : 'none';
  });

  // Afficher le détail de la face dans la zone inline
  const detailEl = document.getElementById('faceChoiceDetail');
  if (detailEl) {
    const face = ci.cardDef.faces.find(f => f.face === chosenFace);
    const typeColors = { Personne:'#3a5a8a', Terrain:'#2d5a27', Bâtiment:'#7a6a5a', Ennemi:'#6a0a0a' };
    const typeBg = typeColors[face.type] || '#5a5040';

    const header = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(200,150,12,0.2);">
      <div style="font-size:2.2rem;line-height:1;">${getCardEmoji(face.type, face.nom)}</div>
      <div>
        <div style="font-family:'Cinzel',serif;font-size:0.48rem;color:#888;letter-spacing:2px;margin-bottom:2px;">FACE ${chosenFace}</div>
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.9rem;color:var(--gold-light);">${face.nom}</div>
        <span style="display:inline-block;background:${typeBg};color:#fff;font-family:'Cinzel',serif;font-size:0.46rem;padding:1px 7px;border-radius:4px;margin-top:3px;">${face.type}</span>
        ${(() => {
          const victoryValue = getVictoryValue(face.victoire);
          const victoryLabel = victoryValue !== null
            ? `${victoryValue > 0 ? '+' : ''}${victoryValue}`
            : getVictoryLabel(face.victoire);
          if (!victoryLabel) return '';
          return `<span style="display:inline-block;margin-left:6px;background:${victoryValue < 0 ? '#8b0000' : 'rgba(200,150,12,0.25)'};border:1px solid ${victoryValue < 0 ? '#cc3333' : 'rgba(200,150,12,0.4)'};color:${victoryValue < 0 ? '#ffaaaa' : '#f0c040'};font-family:'Cinzel',serif;font-size:0.5rem;font-weight:700;padding:1px 6px;border-radius:8px;">${victoryValue !== null ? (victoryValue >= 0 ? '⭐' : '💀') : '✨'} ${victoryLabel}</span>`;
        })()}
      </div>
    </div>`;

    detailEl.style.opacity = '0';
    setTimeout(() => {
      detailEl.innerHTML = header + _renderDiscoveredFaceDetail(ci.cardDef, chosenFace);
      detailEl.style.opacity = '1';
    }, 120);
  }

  // Activer le bouton de confirmation
  const confirmBtn = document.getElementById('btnConfirmFaceChoice');
  if (confirmBtn) {
    const fd = ci.cardDef.faces.find(f => f.face === chosenFace);
    confirmBtn.disabled = false;
    confirmBtn.style.cursor      = 'pointer';
    confirmBtn.style.background  = 'linear-gradient(135deg,#7a4a08,#c8960c,#7a4a08)';
    confirmBtn.style.borderColor = '#f0c040';
    confirmBtn.style.color       = '#1a0e04';
    confirmBtn.style.boxShadow   = '0 4px 16px rgba(200,150,12,0.4)';
    confirmBtn.textContent       = `⚜ Confirmer : ${fd ? fd.nom : '?'}`;
  }
}

function confirmFaceChoice() {
  if (document.activeElement) document.activeElement.blur();
  const pending = window._faceChoicePending;
  if (!pending || pending.selectedFace === null) return;
  const { playIndex, selectedFace } = pending;
  window._faceChoicePending = null;

  bootstrap.Modal.getInstance(document.getElementById('faceChoiceModal'))?.hide();

  const ci = gameState.play[playIndex];
  if (!ci) return;

  // Appliquer le choix de manière définitive
  ci.currentFace = selectedFace;
  cardStateMap[ci.cardDef.numero] = selectedFace;
  choiceNeeded.delete(ci.cardDef.numero); // ne plus jamais demander pour cette carte

  const fd = getFaceData(ci);
  addLog(`👤 <span class="log-card">${fd.nom}</span> — identité choisie définitivement.`, true);

  pendingFaceChoice = null;

  // Vérifier s'il y a d'autres cartes en attente de choix
  processPendingFaceChoices();
  // Puis vérifier les bandits
  processPendingBandits();
  updateUI();
}

// ============================================================
//  EFFETS ACTIVABLES
// ============================================================
// Retourne la raison pour laquelle un effet activable ne peut pas être utilisé,
// ou null si l'effet est activable.
function getActivationFailureReason(cardInstance) {
  const fd = getFaceData(cardInstance);
  if (!fd.effet) return null; // Pas d'effet
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  const act = effets.find(e => e.type === 'Activable');
  if (!act) return null; // Pas d'effet activable

  // Vérifier si l'effet à usage unique a déjà été utilisé
  if (act.usage_unique) {
    if (!gameState.usedOneTimeEffects) gameState.usedOneTimeEffects = [];
    const effectId = `${cardInstance.cardDef.numero}_${cardInstance.currentFace}`;
    if (gameState.usedOneTimeEffects.includes(effectId)) {
      return 'used_one_time';
    }
  }

  const confirmed = getConfirmedResources();
  const costOk = (act.cout || []).every(c => (confirmed[normalizeRes(c.type)] || 0) >= c.quantite);
  if (!costOk) return 'insufficient_resources';

  // Si l'effet nécessite un sacrifice, vérifier qu'une autre carte est disponible en jeu
  if (act.defausse) {
    const playIdx = gameState.play.indexOf(cardInstance);
    const allies = gameState.play.filter((ci, i) => i !== playIdx && getFaceData(ci).type !== 'Ennemi');
    if (allies.length === 0) return 'no_sacrifice_target';
  }
  // Si l'effet nécessite un Terrain, vérifier qu'il y en a au moins un en jeu
  const hasTerrainRes = (act.ressources || []).some(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.some(t => t === 'Terrain');
  });
  if (hasTerrainRes) {
    const allPlayCards = [
      ...gameState.play,
      ...(gameState.retainedCards || []),
      ...(gameState.stayInPlay || [])
    ];
    const terrains = allPlayCards.filter(ci => ci !== cardInstance && getFaceData(ci).type === 'Terrain');
    if (terrains.length === 0) return 'no_terrain_target';
  }
  // Si l'effet est une conversion, vérifier qu'un Bandit est en jeu
  if (act.conversion) {
    const bandits = gameState.play.filter(ci => getFaceData(ci).type === 'Ennemi' && getFaceData(ci).nom === 'Bandit');
    if (bandits.length === 0) return 'no_bandit_target';
  }
  // Si l'effet recrute un Terrain depuis la défausse, vérifier qu'il y en a un
  if (act.recruteTerrain) {
    const terrainsDefausse = gameState.discard.filter(ci => getFaceData(ci).type === 'Terrain');
    if (terrainsDefausse.length === 0) return 'no_discard_terrain';
  }
  // Si l'effet découvre des cartes, vérifier si toutes les cibles sont déjà dans le royaume.
  if (act.cartes && act.cartes.length > 0) {
    const alreadyInKingdom = new Set([
      ...gameState.deck, ...gameState.play, ...gameState.discard,
      ...gameState.permanent, ...(gameState.retainedCards || []),
      ...(gameState.stayInPlay || []), ...(gameState.destroyed || []),
      ...gameState.box
    ].map(ci => ci.cardDef.numero));
    const allTargetsOwned = act.cartes.every(num => alreadyInKingdom.has(num));
    if (allTargetsOwned) return 'all_targets_discovered';
  }
  return null; // Peut être activé
}

// Vérifie si une carte a un effet Activable et si son coût est payable
function hasActivableEffect(cardInstance) {
  const fd = getFaceData(cardInstance);
  if (!fd.effet) return false;
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  return effets.some(e => e.type === 'Activable');
}

function canActivateEffect(cardInstance) {
  return getActivationFailureReason(cardInstance) === null;
}

// Active l'effet activable : met en staging une action 'activate'
// Gère les effets avec ou sans coût, avec ou sans promotion forcée, avec ou sans sacrifice
function stageActivateEffect(cardNum) {
  const playIndex = _playIdxByNum(cardNum);
  if (playIndex < 0) return;
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  const act = effets.find(e => e.type === 'Activable');
  if (!act) return;

  const confirmed = getConfirmedResources();
  for (const c of (act.cout || [])) {
    if ((confirmed[normalizeRes(c.type)] || 0) < c.quantite) {
      addLog(`💰 Ressources insuffisantes pour activer <span class="log-card">${fd.nom}</span>. Coût: ${formatCost(act.cout)}`);
      return;
    }
  }

  // Effet Hôtel de Ville : chercher un Terrain dans la défausse et le jouer
  if (act.recruteTerrain) {
    const terrainsDefausse = gameState.discard.filter(ci => getFaceData(ci).type === 'Terrain');
    if (terrainsDefausse.length === 0) {
      addLog(`❌ Aucun Terrain dans la défausse pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showRecruteTerrainModal(playIndex, act, terrainsDefausse);
    return true;
  }

  // Effet de conversion (Missionnaire) : choisir un Bandit en jeu
  if (act.conversion) {
    const bandits = gameState.play.filter(ci => getFaceData(ci).type === 'Ennemi' && getFaceData(ci).nom === 'Bandit');
    if (bandits.length === 0) {
      addLog(`❌ Aucun Bandit en jeu pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showConversionModal(playIndex, act, bandits);
    return true;
  }

  // Effet avec défausse alliée : ouvre un modal pour choisir la carte à défausser
  if (act.defausse) {
    const candidates = gameState.play.filter((ci, i) => i !== playIndex && getFaceData(ci).type !== 'Ennemi');
    if (candidates.length === 0) {
      addLog(`❌ Aucune carte alliée disponible à défausser pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showSacrificeModal(playIndex, act, candidates);
    return true;
  }

  // Effet Exploitant : ressources de type "Terrain" → choisir un Terrain en jeu
  const hasTerrainResource = (act.ressources || []).some(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.some(t => t === 'Terrain');
  });
  if (hasTerrainResource) {
    const allPlayCards = [
      ...gameState.play,
      ...(gameState.retainedCards || []),
      ...(gameState.stayInPlay || [])
    ];
    const terrains = allPlayCards.filter(ci => 
      ci !== cardInstance && 
      getFaceData(ci).type === 'Terrain' && 
      !gameState.bandits.some(b => b.blockedNum === ci.cardDef.numero)
    );
    if (terrains.length === 0) {
      addLog(`❌ Aucun Terrain en jeu pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showTerrainChoiceModal(playIndex, act, terrains);
    return true;
  }

  // Effet Domestique : ressources au choix parmi plusieurs types (ex: [Or, Bois, Pierre])
  const hasMultiTypeResource = (act.ressources || []).some(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.length > 1;
  });
  if (hasMultiTypeResource) {
    showResourceChoiceModal(playIndex, act);
    return true;
  }

  // Effet avec cartes : afficher la carte obtenue puis défausser la source et l'ajouter en défausse (ex: Chapelle)
  if (act.cartes && act.cartes.length > 0) {
    _doActivateWithCards(playIndex, act);
    return true;
  }

  _doStageActivate(playIndex, act);

  return false;
}

// Activation d'un effet qui ajoute une carte (ex: Chapelle → Cathédrale #103)
function _doActivateWithCards(playIndex, act) {
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);

  // Trouver la/les cartes à obtenir dans ALL_CARDS ou CARDS_TO_DISCOVER
  const allPool = [
    ...ALL_CARDS,
    ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : [])
  ];
  const targetCards = act.cartes.map(num => allPool.find(c => c.numero === num)).filter(Boolean);

  // Vérifier si la carte cible est déjà dans le royaume
  const alreadyInKingdom = new Set([
    ...gameState.deck, ...gameState.play, ...gameState.discard,
    ...gameState.permanent, ...(gameState.retainedCards || []),
    ...(gameState.stayInPlay || []), ...(gameState.destroyed || []),
    ...gameState.box
  ].map(ci => ci.cardDef.numero));

  const alreadyOwnedTarget = targetCards.find(c => alreadyInKingdom.has(c.numero));

  if (alreadyOwnedTarget) {
    const targetFace = getFaceData({ cardDef: alreadyOwnedTarget, currentFace: 1 });
    addLog(`🔔 L'effet de <span class="log-card">${fd.nom}</span> ne peut être activé car la carte <span class="log-card">${targetFace.nom}</span> est déjà dans votre royaume.`, true);

    $('#sacrificeChoiceTitle').html(`❌ Effet non disponible`);
    let html = `<div style="text-align:center; padding: 10px;">
                  <p style="font-family:'Crimson Text',serif;font-size:1rem;line-height:1.6;color:#f5e6c8;">
                    L'effet de <span class="log-card">${fd.nom}</span> ne peut pas être utilisé.
                  </p>
                  <p style="font-family:'Crimson Text',serif;font-size:0.9rem;line-height:1.5;color:#c8b89a;">
                    La carte <span class="log-card">${targetFace.nom}</span> que cet effet permet de découvrir est déjà dans votre royaume.
                  </p>
                  <button onclick="bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide()" class="btn" style="margin-top: 16px; background:rgba(80,50,10,0.4); border:1px solid #7a5a20; color:#c8a050; font-family:'Cinzel',serif; font-size:0.75rem; letter-spacing:1px; padding:8px 24px;">
                    Fermer
                  </button>
                </div>`;
    $('#sacrificeChoiceBody').html(html);
    new bootstrap.Modal(document.getElementById('sacrificeChoiceModal')).show();
    return;
  }

  // Débiter le coût immédiatement
  for (const c of (act.cout || [])) {
    const key = normalizeRes(c.type);
    gameState.resources[key] = (gameState.resources[key] || 0) - c.quantite;
  }
    // Afficher un modal de présentation puis défausser
  window._pendingCardGrant = { playIndex, cardInstance, targetCards };
  _showCardGrantModal(targetCards, fd.nom);
}

function _showCardGrantModal(targetCards, sourceName) {
  const typeColors = {
    Personne: '#2a4a7a', Terrain: '#1e4a1a', Bâtiment: '#5a4a3a',
    Ennemi: '#5a0a0a', Evènement: '#3a2a5a', Maritime: '#0a3a5a'
  };

  const cardsHTML = targetCards.map(cardDef => {
    const face = cardDef.faces[0];
    const bgType = typeColors[face.type] || '#3a3a3a';
    const resHTML = (face.ressources || []).length
      ? face.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return types.map(t => `<span class="resource-pip" style="font-size:0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;">${RESOURCE_ICONS[normalizeRes(t)] || t} ×${r.quantite}</span>`).join('');
        }).join('')
      : '';
    const victoryValue = getVictoryValue(face.victoire);
    const victoryLabel = victoryValue !== null
      ? `${victoryValue > 0 ? '+' : ''}${victoryValue} Gloire`
      : getVictoryLabel(face.victoire) ? `${getVictoryLabel(face.victoire)} Gloire` : '';
    const fameHTML = victoryLabel ? `<div style="font-size:0.8rem;color:#f0c040;margin-top:6px;">★ ${victoryLabel}</div>` : '';
    const effetHTML = face.effet
      ? `<div style="font-size:0.72rem;color:#bbeebb;margin-top:6px;">🔵 ${face.effet.type}${face.effet.description ? ' — ' + face.effet.description : ''}</div>`
      : '';

    return `<div style="
        background:linear-gradient(160deg,#1e160a,#120e06);
        border:2px solid var(--border-ornate);border-radius:10px;
        padding:20px 18px;text-align:center;
        box-shadow:0 4px 24px rgba(0,0,0,0.6);max-width:280px;margin:0 auto;">
      <div style="font-size:0.6rem;color:#777;font-family:'Cinzel',serif;letter-spacing:1px;margin-bottom:6px;">#${cardDef.numero}</div>
      <div style="font-size:3rem;margin-bottom:10px;">${getCardEmoji(face.type, face.nom)}</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:1rem;color:var(--gold-light);margin-bottom:6px;">${face.nom}</div>
      <div style="display:inline-block;background:${bgType};border-radius:4px;padding:2px 12px;font-size:0.62rem;font-family:'Cinzel',serif;color:#fff;letter-spacing:1px;margin-bottom:12px;">${face.type}</div>
      <div style="font-size:0.8rem;color:#c8b89a;line-height:1.5;margin-bottom:10px;font-style:italic;">${face.description || ''}</div>
      <div>${resHTML}</div>
      ${fameHTML}${effetHTML}
    </div>`;
  }).join('');

  document.getElementById('cardGrantBody').innerHTML = `
    <p style="text-align:center;font-family:'Crimson Text',serif;font-size:0.95rem;color:#f5e6c8;margin-bottom:18px;line-height:1.5;">
      La <strong>${sourceName}</strong> attire la grâce divine.<br>
      <em style="font-size:0.85rem;color:#aaa;">Cette carte rejoint votre défausse.</em>
    </p>
    ${cardsHTML}`;

  new bootstrap.Modal(document.getElementById('cardGrantModal')).show();
}

function confirmCardGrant() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('cardGrantModal'))?.hide();
  const { playIndex, cardInstance, targetCards } = window._pendingCardGrant || {};
  window._pendingCardGrant = null;
  if (!cardInstance) return;

  // Clean up the pending retained flag, since the action is now confirmed.
  if (window._pendingRetainedActivateNum) {
    window._pendingRetainedActivateNum = null;
  }

  const fd = getFaceData(cardInstance);

  // Si l'effet est à usage unique, le marquer comme utilisé
  const effets = Array.isArray(fd.effet) ? fd.effet : (fd.effet ? [fd.effet] : []);
  const act = effets.find(e => e.type === 'Activable');
  if (act && act.usage_unique) {
    if (!gameState.usedOneTimeEffects) gameState.usedOneTimeEffects = [];
    const effectId = `${cardInstance.cardDef.numero}_${cardInstance.currentFace}`;
    if (!gameState.usedOneTimeEffects.includes(effectId)) {
      gameState.usedOneTimeEffects.push(effectId);
    }
  }

  // Retirer la carte source du jeu et la mettre en défausse
  _playRemove(_playIdxByNum(cardInstance.cardDef.numero));

  // Spécificité pour la Forge #18 : elle est réinitialisée à sa face 1
  if (cardInstance.cardDef.numero === 18) {
    _animateForgeReset(cardInstance, fd.nom, targetCards);
  } else {
    gameState.discard.push(cardInstance);
    // Créer les nouvelles instances et les ajouter en défausse
    targetCards.forEach(cardDef => {
      const newInst = createCardInstance(cardDef);
      gameState.discard.push(newInst);
      addLog(`⛪ <span class="log-card">${fd.nom}</span> — <span class="log-card">${getFaceData(newInst).nom}</span> (#${cardDef.numero}) rejoint la défausse !`, true);
    });
    updateUI();
  }
}

function cancelCardGrant() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('cardGrantModal'))?.hide();
  const { playIndex, cardInstance } = window._pendingCardGrant || {};
  window._pendingCardGrant = null;
  if (!cardInstance) return;

  // Rembourser le coût de l'activation
  const fd = getFaceData(cardInstance);
  const effets = Array.isArray(fd.effet) ? fd.effet : (fd.effet ? [fd.effet] : []);
  const act = effets.find(e => e.type === 'Activable');
  if (act && act.cout) {
    for (const c of act.cout) {
      const key = normalizeRes(c.type);
      gameState.resources[key] = (gameState.resources[key] || 0) + c.quantite;
    }
    addLog(`↩️ Action annulée, coût remboursé.`);
  }

  _restoreRetainedIfNeeded(playIndex);
  updateUI();
}

function showSacrificeModal(playIndex, act, candidates) {
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);

  const resourcesGained = {};
  (act.ressources || []).forEach(r => {
    const key = normalizeRes(Array.isArray(r.type) ? r.type[0] : r.type);
    resourcesGained[key] = (resourcesGained[key] || 0) + r.quantite;
  });
  const resStr = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`).join(' ');

  // Titre dynamique
  $('#sacrificeChoiceTitle').text(`🤝 ${fd.nom} — Choisir une carte à défausser`);

  let html = '';

  // Description de l'effet si disponible
  if (act.description) {
    html += `<p style="font-style:italic;color:#c8b070;font-family:'Crimson Text',serif;font-size:0.88rem;
      border-left:3px solid #c8960c;padding-left:10px;margin-bottom:14px;line-height:1.4;">
      ${act.description}
    </p>`;
  }

  html += `<p style="margin-bottom:12px;font-size:0.9rem;">
    Choisissez une carte <strong>alliée</strong> à défausser pour gagner <strong>${resStr}</strong> :
  </p>`;

  candidates.forEach((ci, idx) => {
    const f = getFaceData(ci);
    const actualIdx = gameState.play.indexOf(ci);
    const emoji = getCardEmoji(f.type, f.nom);
    const resInfo = f.ressources && f.ressources.length
      ? f.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return `${r.quantite}${RESOURCE_ICONS[normalizeRes(types[0])]||types[0]}`;
        }).join(' ')
      : '—';
    html += `<button onclick="confirmSacrifice(${playIndex}, ${actualIdx})" class="sacrifice-choice-btn">
      <span class="sacrifice-emoji">${emoji}</span>
      <span class="sacrifice-info">
        <strong>${f.nom}</strong>
        <span class="sacrifice-type">${f.type}</span>
        <span class="sacrifice-res">${resInfo}</span>
      </span>
    </button>`;
  });

  // Bouton annuler
  html += `<button onclick="cancelSacrificeModal()" class="btn btn-sm"
    style="margin-top:14px;display:block;width:100%;background:rgba(80,50,10,0.4);
    border:1px solid #7a5a20;color:#c8a050;font-family:'Cinzel',serif;font-size:0.75rem;
    letter-spacing:1px;padding:6px;">
    ✕ Fermer
  </button>`;

  window._pendingSacrificePlayIndex = playIndex;
  window._pendingSacrificeAct = act;
  $('#sacrificeChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('sacrificeChoiceModal')).show();
}

function cancelSacrificeModal() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();
  const playIndex = window._pendingSacrificePlayIndex;
  window._pendingSacrificePlayIndex = null;
  window._pendingSacrificeAct = null;

  const fromRetained = !!window._pendingRetainedActivateNum;
  if (fromRetained) {
    window._pendingRetainedActivateNum = null;
  }

  _restoreRetainedIfNeeded(playIndex);
}

function confirmSacrifice(plainesPlayIndex, sacrificePlayIndex) {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();

  const act = window._pendingSacrificeAct;
  window._pendingSacrificePlayIndex = null;
  window._pendingSacrificeAct = null;

  const fromRetained = !!window._pendingRetainedActivateNum;
  if (fromRetained) {
    window._pendingRetainedActivateNum = null;
  }

  const plainesCard  = gameState.play[plainesPlayIndex];
  const sacrificeCard = gameState.play[sacrificePlayIndex];
  const sacrificeName = getFaceData(sacrificeCard).nom;

  // Retirer les deux cartes du jeu dans le bon ordre (grand index en premier)
  const idxs = [plainesPlayIndex, sacrificePlayIndex].sort((a, b) => b - a);
  idxs.forEach(i => _playRemove(i));

  // La carte sacrifice est placée en staging (pas encore défaussée)
  // Elle sera défaussée à la confirmation, ou remise en jeu si on annule les Plaines

  const resourcesGained = {};
  (act.ressources || []).forEach(r => {
    const key = normalizeRes(Array.isArray(r.type) ? r.type[0] : r.type);
    resourcesGained[key] = (resourcesGained[key] || 0) + r.quantite;
  });

  // Ajouter les ressources du sticker de la carte activante (la Plaine)
  const activatingStickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(plainesCard.cardDef.numero) : {};
  Object.entries(activatingStickerBonus).forEach(([key, bonus]) => {
    if (bonus > 0 && gameState.resources[key] !== undefined) {
      resourcesGained[key] = (resourcesGained[key] || 0) + bonus;
    }
  });

  const plainesName = getFaceData(plainesCard).nom;
  const resStr = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`).join(' ');

  gameState.staging.push({
    cardInstance: plainesCard,
    action: 'activate',
    resourcesGained,
    fameGained: 0,
    newFace: null,
    cout: act.cout || [],
    sacrificeCardInstance: sacrificeCard,   // stocké ici, défaussé à la confirmation
    fromRetainedCards: fromRetained
  });

  addLog(`🟢 <span class="log-card">${plainesName}</span> + <span class="log-card">${sacrificeName}</span> — en attente de confirmation (${resStr}).`);
  updateUI();
}

// ── EXPLOITANT : choisir un Terrain en jeu pour copier sa production ──
function showTerrainChoiceModal(playIndex, act, terrains) {
  const cardInstance = gameState.play[playIndex];

  let html = `<p style="margin-bottom:12px;">Choisissez un <strong>Terrain</strong> dont vous voulez copier la production :</p><div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">`;

  terrains.forEach(ci => {
    const f = getFaceData(ci);
    const cardNum = ci.cardDef.numero;
    const emoji = getCardEmoji(f.type, f.nom);

    const resInfo = (f.ressources || []).length
      ? f.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return `+${r.quantite}${RESOURCE_ICONS[normalizeRes(types[0])] || types[0]}`;
        }).join(' ')
      : '(aucune production)';

    // Sticker resources
    let stickerResHTML = '';
    if (typeof getStickerResourceBonusForCard === 'function') {
        const stickerBonus = getStickerResourceBonusForCard(cardNum);
        const bonusEntries = Object.entries(stickerBonus).filter(([, bonus]) => bonus > 0);
        if (bonusEntries.length > 0) {
            const stickerResInfo = bonusEntries.map(([key, bonus]) => `+${bonus}${RESOURCE_ICONS[key] || key}`).join(' ');
            stickerResHTML = `<div style="font-size: 0.6rem; color: #88bbff; background: rgba(74,122,170,0.2); padding: 1px 5px; border-radius: 4px; margin-top: 4px;">🏷️ ${stickerResInfo}</div>`;
        }
    }

    html += `<button onclick="confirmTerrainChoice(${playIndex}, ${cardNum})" 
        style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; background: rgba(80,150,40,0.15); border: 2px solid #4a9a2a; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: center;"
        onmouseover="this.style.borderColor='#88dd44'; this.style.transform='translateY(-2px)';"
        onmouseout="this.style.borderColor='#4a9a2a'; this.style.transform='none';">
      <div style="font-size: 1.8rem; line-height: 1;">${emoji}</div>
      <div style="font-family: 'Cinzel', serif; font-size: 0.7rem; font-weight: 700; line-height: 1.2;">${f.nom}</div>
      <div style="font-size: 0.6rem; color: #888;">#${cardNum}</div>
      <div style="font-size: 0.65rem; color: #ccffaa; font-weight: 600;">${resInfo}</div>
      <div style="min-height: 20px; display: flex; align-items: center; justify-content: center;">
        ${stickerResHTML}
      </div>
    </button>`;
  });

  html += `</div>`;

  html += `<button onclick="cancelTerrainChoiceModal()" class="btn btn-sm"
    style="margin-top:14px;display:block;width:100%;background:rgba(80,50,10,0.4);
    border:1px solid #7a5a20;color:#c8a050;font-family:'Cinzel',serif;font-size:0.75rem;
    letter-spacing:1px;padding:6px;">
    ✕ Fermer
  </button>`;

  window._pendingTerrainPlayIndex = playIndex;
  window._pendingTerrainAct = act;
  $('#terrainChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('terrainChoiceModal')).show();
}

function cancelTerrainChoiceModal() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('terrainChoiceModal'))?.hide();
  const playIndex = window._pendingTerrainPlayIndex;
  window._pendingTerrainPlayIndex = null;
  window._pendingTerrainAct = null;
  _restoreRetainedIfNeeded(playIndex);
}

function confirmTerrainChoice(exploitantPlayIndex, terrainCardNum) {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('terrainChoiceModal'))?.hide();
  window._pendingTerrainPlayIndex = null;
  window._pendingTerrainAct = null;

  const fromRetained = !!window._pendingRetainedActivateNum;
  if (fromRetained) {
    window._pendingRetainedActivateNum = null;
  }

  const exploitantCard = gameState.play[exploitantPlayIndex];
  const allPlayCards = [
    ...gameState.play,
    ...(gameState.retainedCards || []),
    ...(gameState.stayInPlay || [])
  ];
  const terrainCard    = allPlayCards.find(c => c.cardDef.numero === terrainCardNum);
  if (!terrainCard) return;
  const terrainFace    = getFaceData(terrainCard);
  const exploitantName = getFaceData(exploitantCard).nom;

  // Copier la production réelle du terrain (pas ses effets)
  const resourcesGained = {};
  // D'abord, les ressources de base de la carte copiée
  (terrainFace.ressources || []).forEach(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    const key = normalizeRes(types[0]); // L'exploitant ne copie que le premier type en cas de choix
    if (key) {
      resourcesGained[key] = (resourcesGained[key] || 0) + r.quantite;
    }
  });

  // Ensuite, ajouter les bonus des stickers de la carte copiée
  const stickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(terrainCard.cardDef.numero) : {};
  Object.entries(stickerBonus).forEach(([key, bonus]) => {
    if (bonus > 0) {
      resourcesGained[key] = (resourcesGained[key] || 0) + bonus;
    }
  });

  // Ajouter les ressources du sticker de la carte activante (ex: Plaine avec sticker)
  const activatingStickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(exploitantCard.cardDef.numero) : {};
  Object.entries(activatingStickerBonus).forEach(([key, bonus]) => {
    if (bonus > 0 && gameState.resources[key] !== undefined) {
      resourcesGained[key] = (resourcesGained[key] || 0) + bonus;
    }
  });

  // Retirer l'Exploitant du jeu (le terrain reste en jeu)
  _playRemove(exploitantPlayIndex);

  const resStr = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`).join(' ') || '(rien)';

  gameState.staging.push({
    cardInstance: exploitantCard,
    action: 'activate',
    resourcesGained,
    fameGained: 0,
    newFace: null,
    cout: [],
    terrainName: terrainFace.nom,
    fromRetainedCards: fromRetained
  });

  addLog(`🟢 <span class="log-card">${exploitantName}</span> exploite <span class="log-card">${terrainFace.nom}</span> — ${resStr} en attente.`);
  updateUI();
}

// ── HÔTEL DE VILLE : recruter un Terrain depuis la défausse ──
function showRecruteTerrainModal(playIndex, act, terrains) {
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);

  let html = `
    <p style="font-style:italic;color:#c8b070;font-family:'Crimson Text',serif;font-size:0.88rem;
       border-left:3px solid #c8960c;padding-left:10px;margin-bottom:16px;line-height:1.4;">
      ${act.description}
    </p>
    <p style="margin-bottom:12px;font-size:0.9rem;">Choisissez un <strong>Terrain</strong> dans votre défausse :</p>`;

  terrains.forEach((ci, idx) => {
    const f = getFaceData(ci);
    const discardIdx = gameState.discard.indexOf(ci);
    const emoji = getCardEmoji(f.type, f.nom);
    const resInfo = (f.ressources || []).length
      ? f.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return `${r.quantite}${RESOURCE_ICONS[normalizeRes(types[0])] || types[0]}`;
        }).join(' ')
      : '(aucune production)';
    const promos = f.promotions ? f.promotions : (f.promotion ? [f.promotion] : []);
    const promoStr = promos.length ? ` · ▲ ${promos.length} promo.` : '';
    html += `<button onclick="confirmRecruteTerrain(${playIndex}, ${discardIdx})" class="sacrifice-choice-btn">
      <span class="sacrifice-emoji">${emoji}</span>
      <span class="sacrifice-info">
        <strong>${f.nom}</strong> <span style="font-size:0.65rem;color:#888;">#${ci.cardDef.numero}</span>
        <span class="sacrifice-type">Terrain</span>
        <span class="sacrifice-res">${resInfo}${promoStr}</span>
      </span>
    </button>`;
  });

  html += `<button onclick="cancelRecruteTerrainModal()" class="btn btn-sm"
    style="margin-top:14px;display:block;width:100%;background:rgba(80,50,10,0.4);
    border:1px solid #7a5a20;color:#c8a050;font-family:'Cinzel',serif;font-size:0.75rem;
    letter-spacing:1px;padding:6px;">
    ✕ Annuler
  </button>`;

  window._pendingRecrutePlayIndex = playIndex;
  $('#recruteTerrainBody').html(html);
  new bootstrap.Modal(document.getElementById('recruteTerrainModal')).show();
}

function cancelRecruteTerrainModal() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('recruteTerrainModal'))?.hide();
  const playIndex = window._pendingRecrutePlayIndex;
  window._pendingRecrutePlayIndex = null;
  _restoreRetainedIfNeeded(playIndex);
}

function confirmRecruteTerrain(hotelPlayIndex, discardIdx) {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('recruteTerrainModal'))?.hide();
  window._pendingRecrutePlayIndex = null;

  // Clean up the pending retained flag, since the action is now confirmed.
  if (window._pendingRetainedActivateNum) {
    window._pendingRetainedActivateNum = null;
  }

  const hotelCard   = gameState.play[hotelPlayIndex];
  const terrainCard = gameState.discard[discardIdx];
  if (!hotelCard || !terrainCard) return;

  const hotelName   = getFaceData(hotelCard).nom;
  const terrainName = getFaceData(terrainCard).nom;

  // Défausser l'Hôtel de Ville
  _playRemove(hotelPlayIndex);
  gameState.discard.push(hotelCard);

  // Retirer le Terrain de la défausse et le placer en jeu
  gameState.discard.splice(discardIdx, 1);
  if (isStayInPlay(getFaceData(terrainCard))) {
    if (!gameState.stayInPlay) gameState.stayInPlay = [];
    gameState.stayInPlay.push(terrainCard);
  } else {
    gameState.play.push(terrainCard);
  }

  addLog(`🏛 <span class="log-card">${hotelName}</span> — défaussée pour recruter <span class="log-card">${terrainName}</span> depuis la défausse.`, true);
  updateUI();
}

// ── DOMESTIQUE : choisir 1 ressource parmi plusieurs types ──
function showResourceChoiceModal(playIndex, act) {
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);

  // Collecter tous les types disponibles au choix
  const choices = [];
  (act.ressources || []).forEach(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    types.forEach(t => {
      if (!choices.find(c => c.type === t)) choices.push({ type: t, quantite: r.quantite });
    });
  });

  let html = `<p style="margin-bottom:14px;">Choisissez <strong>1 ressource</strong> à obtenir :</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">`;
  choices.forEach((c, i) => {
    const icon = RESOURCE_ICONS[normalizeRes(c.type)] || c.type;
    html += `<button id="resChoiceBtn_${i}" onclick="selectResourceChoice(${i})" class="bandit-reward-btn" style="min-width:80px;font-size:1rem;">
      ${icon}<br><span style="font-size:0.65rem;">${c.type}</span>
    </button>`;
  });
  html += '</div>';

  html += `
  <div style="text-align:center;margin-top:18px;display:flex;gap:10px;justify-content:center;">
    <button onclick="cancelResourceChoiceModal()" class="btn"
      style="font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:1px;
      background:rgba(60,40,20,0.6);border:1px solid rgba(139,105,20,0.4);
      color:var(--stone-light);padding:8px 18px;border-radius:6px;cursor:pointer;">
      ✕ Fermer
    </button>
    <button id="btnConfirmResourceChoice" onclick="confirmResourceChoice()" disabled style="
      font-family:'Cinzel',serif;font-weight:700;font-size:0.72rem;letter-spacing:1px;
      background:rgba(0,0,0,0.4);border:2px solid #444;color:#666;
      padding:8px 22px;border-radius:6px;cursor:not-allowed;transition:all 0.2s;">
      ✔ Valider
    </button>
  </div>`;

  window._pendingResourceChoices = choices;
  window._pendingResourcePlayIndex = playIndex;
  window._pendingResourceAct = act;
  window._pendingResourceChoiceIdx = null;
  $('#resourceChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('resourceChoiceModal')).show();
}

function selectResourceChoice(idx) {
  window._pendingResourceChoiceIdx = idx;
  const choices = window._pendingResourceChoices || [];
  choices.forEach((c, i) => {
    const btn = document.getElementById(`resChoiceBtn_${i}`);
    if (btn) {
      if (i === idx) btn.classList.add('selected');
      else btn.classList.remove('selected');
    }
  });
  const confirmBtn = document.getElementById('btnConfirmResourceChoice');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.style.background = 'linear-gradient(135deg,#1a5a1a,#0e3a0e)';
    confirmBtn.style.borderColor = '#44cc44';
    confirmBtn.style.color = '#aaffaa';
  }
}

function cancelResourceChoiceModal() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('resourceChoiceModal'))?.hide();
  const playIndex = window._pendingResourcePlayIndex;
  window._pendingResourceChoices   = null;
  window._pendingResourcePlayIndex = null;
  window._pendingResourceAct       = null;
  window._pendingResourceChoiceIdx = null;
  _restoreRetainedIfNeeded(playIndex);
}

function confirmResourceChoice() {
  if (document.activeElement) document.activeElement.blur();
  const choiceIdx = window._pendingResourceChoiceIdx;
  if (choiceIdx == null) return;
  bootstrap.Modal.getInstance(document.getElementById('resourceChoiceModal'))?.hide();

  const choices = window._pendingResourceChoices || [];
  const act     = window._pendingResourceAct;
  const playIndex = window._pendingResourcePlayIndex;

  window._pendingResourceChoices   = null;
  window._pendingResourcePlayIndex = null;
  window._pendingResourceAct       = null;
  window._pendingResourceChoiceIdx = null;

  const fromRetained = !!window._pendingRetainedActivateNum;
  if (fromRetained) {
    window._pendingRetainedActivateNum = null;
  }

  const chosen = choices[choiceIdx];
  if (!chosen) return;

  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);
  const key = normalizeRes(chosen.type);
  const resourcesGained = { [key]: chosen.quantite };

  // Ajouter les ressources du sticker de la carte activante
  const activatingStickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(cardInstance.cardDef.numero) : {};
  Object.entries(activatingStickerBonus).forEach(([k, bonus]) => {
    if (bonus > 0 && gameState.resources[k] !== undefined) {
      resourcesGained[k] = (resourcesGained[k] || 0) + bonus;
    }
  });

  _playRemove(playIndex);
  const resStr = `+${chosen.quantite}${RESOURCE_ICONS[key]||chosen.type}`;

  gameState.staging.push({
    cardInstance,
    action: 'activate',
    resourcesGained,
    fameGained: 0,
    newFace: null,
    cout: act.cout || [],
    fromRetainedCards: fromRetained
  });

  addLog(`🟢 <span class="log-card">${fd.nom}</span> — ${resStr} en attente de confirmation.`);
  updateUI();
}

function _doStageActivate(playIndex, act) {
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);

  // Ressources gagnées par l'effet
  const resourcesGained = {};
  (act.ressources || []).forEach(r => {
    const key = normalizeRes(Array.isArray(r.type) ? r.type[0] : r.type);
    resourcesGained[key] = (resourcesGained[key] || 0) + r.quantite;
  });

  // Ajouter les ressources du sticker de la carte activante
  const activatingStickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(cardInstance.cardDef.numero) : {};
  Object.entries(activatingStickerBonus).forEach(([key, bonus]) => {
    if (bonus > 0 && gameState.resources[key] !== undefined) {
      resourcesGained[key] = (resourcesGained[key] || 0) + bonus;
    }
  });

  // Promotion forcée incluse dans l'effet (ex: Forêt → Coupe Rase)
  const newFace = act.promotion ? act.promotion.face : null;

  _playRemove(playIndex);
  gameState.staging.push({
    cardInstance,
    action: 'activate',
    resourcesGained,
    fameGained: 0,
    newFace,
    cout: act.cout || []
  });

  const resStr = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`).join(' ');
  const coutStr = act.cout && act.cout.length ? `coût: ${formatCost(act.cout)} → ` : 'gratuit → ';
  const promoStr = newFace ? ` + promo face ${newFace}` : '';
  addLog(`🟢 <span class="log-card">${fd.nom}</span> — activation en attente (${coutStr}${resStr}${promoStr}).`);
  updateUI();
}

// ============================================================
//  EFFETS DE DESTRUCTION
// ============================================================

// Vérifie si une carte en jeu a un effet Destruction activable manuellement
function hasDestructionEffect(cardInstance) {
  const fd = getFaceData(cardInstance);
  if (!fd.effet) return false;
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  return effets.some(e => e.type === 'Destruction' && e.cartes && e.cartes.length > 0);
}

// Déclenché par le bouton "💥 Sacrifier" sur la carte en jeu
function triggerDestructionEffect(cardNum) {
  const playIndex = _playIdxByNum(cardNum);

  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  const destr = effets.find(e => e.type === 'Destruction');
  if (!destr) return;

  const targetNums = destr.cartes || [];

  const cardEl = document.querySelector(`.card-wrapper[data-card-num="${cardInstance.cardDef.numero}"]`);
  const sacrificedRect = document.querySelector('#sacrificedVisual .card-front')?.getBoundingClientRect();

  const afterSacrificeAnimation = () => {
    // L'animation est terminée, la carte peut être ajoutée à gameState.destroyed
    if (!gameState.destroyed) gameState.destroyed = [];
    gameState.destroyed.push(cardInstance);
    addLog(`💥 <span class="log-card">${fd.nom}</span> — sacrifiée !`, true);
    updateUI(); // Met à jour l'affichage (compteurs, carte du dessus de la pile)

    // Continuer avec la logique de découverte
    _processDestructionDiscovery(cardInstance, fd, targetNums);
  };

  // Retirer la carte de gameState.play immédiatement pour empêcher un double-clic
  _playRemove(playIndex);
  // ATTENTION: Ne SURTOUT PAS appeler updateUI() ici, sinon cardEl est retiré du DOM
  // et l'événement de fin d'animation (transitionend) ne se déclenchera jamais !

  if (cardEl && sacrificedRect) {
    _animateCardsToDiscard([cardEl], sacrificedRect, afterSacrificeAnimation);
  } else {
    afterSacrificeAnimation(); // Pas d'animation, procéder directement
  }

  // Logique de découverte (déplacée dans une fonction imbriquée pour la clarté)
  function _processDestructionDiscovery(sacrificedCardInstance, sacrificedFaceData, targetNums) {
  // Chercher les candidats à découvrir :
  // 1. Dans gameState.box (cartes non encore découvertes de la manche courante)
  // 2. Dans CARDS_TO_DISCOVER (pool global, avant qu'elles soient ajoutées à la box)
  if (!gameState.discoveredByEffect) gameState.discoveredByEffect = new Set();

  // Construire un pool combiné dédupliqué (box en priorité, puis CARDS_TO_DISCOVER)
  const boxNums = new Set(gameState.box.map(c => c.cardDef ? c.cardDef.numero : c.numero));
  const allPool = [
    // Cartes dans la box (instances ou defs)
    ...gameState.box
      .filter(c => targetNums.includes(c.cardDef ? c.cardDef.numero : c.numero))
      .map(c => c.cardDef || c),
    // Cartes dans CARDS_TO_DISCOVER pas encore dans la box
    ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : [])
      .filter(c => targetNums.includes(c.numero) && !boxNums.has(c.numero)),
  ];

  // Exclure les cartes déjà découvertes par effet ET déjà dans le royaume
  const alreadyInKingdom = new Set([
    ...gameState.deck, ...gameState.play,
    ...gameState.discard, ...gameState.permanent,
    ...(gameState.retainedCards || []),
  ].map(ci => ci.cardDef.numero));

  const discoverCandidates = allPool.filter(cardDef =>
    !gameState.discoveredByEffect.has(cardDef.numero) &&
    !alreadyInKingdom.has(cardDef.numero)
  );

  if (discoverCandidates.length > 0) {
    // Retirer les candidats de la box si ils y sont (ils vont être découverts)
    gameState.box = gameState.box.filter(c => {
      const num = c.cardDef ? c.cardDef.numero : c.numero;
      return !discoverCandidates.some(d => d.numero === num);
    });
    _showDiscoverByEffectModal(discoverCandidates, fd.nom);
  } else {
    // Toutes les cibles sont déjà dans le royaume → les défausser
    const available = [];
    ['play', 'discard', 'deck'].forEach(zone => {
      gameState[zone].forEach(ci => {
        if (targetNums.includes(ci.cardDef.numero))
          available.push({ zone, ci });
      });
    });

    if (available.length === 0) {
      addLog(`📦 Aucune carte cible (#${targetNums.join(', #')}) disponible.`);
    } else if (available.length === 1) {
      moveToDiscard(available[0]);
      addLog(`🎯 <span class="log-card">${getFaceData(available[0].ci).nom}</span> — défaussée.`, true);
    } else {
      window._destructionTargets = available;
      showDestructionChoiceModal(available);
    }
  }
  updateUI();
  }
}

// Appelé après une promotion si la nouvelle face a un effet Destruction automatique
// (conservé pour compatibilité mais ne s'applique plus aux cartes avec choix manuel)
function applyDestructionEffect(cardInstance) {
  // Les cartes avec effet Destruction ont maintenant un bouton manuel —
  // cette fonction ne s'exécute plus automatiquement après promotion
  // (les cartes #5-8 face 4 utilisent triggerDestructionEffect via le bouton)
}

function _discoverByEffect(cardDef) {
  if (!gameState.discoveredByEffect) gameState.discoveredByEffect = new Set();
  gameState.discoveredByEffect.add(cardDef.numero);

  // Si la carte était encore dans la box (pas retirée en amont), la retirer maintenant
  // et ajuster nextDiscoverIndex si nécessaire
  const boxIdx = gameState.box.findIndex(c => (c.cardDef ? c.cardDef.numero : c.numero) === cardDef.numero);
  if (boxIdx >= 0) {
    gameState.box.splice(boxIdx, 1);
    if (boxIdx < gameState.nextDiscoverIndex) {
      gameState.nextDiscoverIndex = Math.max(0, gameState.nextDiscoverIndex - 1);
    }
  }

  const newInstance = createCardInstance(cardDef);
  gameState.discard.push(newInstance);
  if (!ALL_CARDS.find(c => c.numero === cardDef.numero)) {
    ALL_CARDS.push(cardDef);
  }
  const face = getFaceData(newInstance);
  addLog(`✨ <span class="log-card">${face.nom}</span> (#${cardDef.numero}) — découverte et ajoutée à votre défausse !`, true);
  updateUI();
}

function _showDiscoverByEffectModal(candidates, sourceName) {
  const typeColors = { Personne:'#2a4a7a', Terrain:'#1e4a1a', Bâtiment:'#5a4a3a', Batiment:'#5a4a3a', Ennemi:'#5a0a0a' };

  const html = candidates.map((cardDef, i) => {
    const face = cardDef.faces[0];
    const bg = typeColors[face.type] || '#3a3a3a';
    const resHTML = (face.ressources || []).map(r => {
      const types = Array.isArray(r.type) ? r.type : [r.type];
      return types.map(t => `<span class="resource-pip" style="font-size:0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
    }).join('');
    const victoryValue = getVictoryValue(face.victoire);
    const victoryLabel = victoryValue !== null
      ? `${victoryValue > 0 ? '+' : ''}${victoryValue} Gloire`
      : getVictoryLabel(face.victoire) ? `${getVictoryLabel(face.victoire)} Gloire` : '';
    const fameHTML = victoryLabel ? `<div style="font-size:0.7rem;color:#f0c040;margin-top:4px;">★ ${victoryLabel}</div>` : '';
    const facesTotal = cardDef.faces.length;

    return `<button onclick="confirmDiscoverByEffect(${i})" style="
        width:100%;text-align:left;background:linear-gradient(135deg,#1a1408,#0e0e06);
        border:2px solid ${bg};border-radius:10px;padding:12px 14px;margin-bottom:10px;
        cursor:pointer;display:flex;align-items:center;gap:14px;transition:border-color 0.2s;
      " onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='${bg}'">
      <div style="
        min-width:38px;text-align:center;
        background:rgba(0,0,0,0.4);border:1px solid ${bg};border-radius:6px;
        padding:4px 2px;font-family:'Cinzel',serif;color:var(--gold);font-size:0.65rem;font-weight:700;">
        #${cardDef.numero}
      </div>
      <div style="font-size:2rem;">${getCardEmoji(face.type, face.nom)}</div>
      <div style="flex:1;">
        <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--gold-light);font-size:0.85rem;">${face.nom}</div>
        <div style="display:inline-block;background:${bg};border-radius:3px;padding:1px 8px;font-size:0.55rem;font-family:'Cinzel',serif;color:#fff;margin:4px 0;">${face.type}</div>
        <div>${resHTML}</div>
        ${fameHTML}
        <div style="font-size:0.6rem;color:#888;margin-top:3px;">${facesTotal} face${facesTotal>1?'s':''} · ajoutée à la défausse</div>
      </div>
    </button>`;
  }).join('');

  $('#discoverByEffectTitle').text(`✨ Découverte — ${sourceName}`);
  $('#discoverByEffectSubtitle').text(
    candidates.length === 1
      ? 'Cette carte sera ajoutée à votre défausse :'
      : 'Choisissez UNE carte à découvrir et ajouter à votre défausse :'
  );
  $('#discoverByEffectBody').html(html);
  window._discoverByEffectCandidates = candidates;
  new bootstrap.Modal(document.getElementById('discoverByEffectModal')).show();
}

function confirmDiscoverByEffect(idx) {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('discoverByEffectModal'))?.hide();
  const candidates = window._discoverByEffectCandidates || [];
  window._discoverByEffectCandidates = null;
  if (candidates[idx]) _discoverByEffect(candidates[idx]);
}

// ============================================================
//  BANDIT LOGIC
// ============================================================

// Une carte produit-elle de l'Or ?
function producesGold(cardInstance) {
  const fd = getFaceData(cardInstance);
  if (!fd.ressources) return false;
  return fd.ressources.some(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.some(t => normalizeRes(t) === 'Or');
  });
}

// ============================================================
//  BANDITS — numéros stables (cardDef.numero) au lieu d'indices play[]
//  Structure : { banditNum, blockedNum|null, pendingChoice? }
// ============================================================

// La carte à playIndex est-elle bloquée par un bandit ?
function isBlockedByBandit(playIndex) {
  const ci = gameState.play[playIndex];
  if (!ci) return false;
  return gameState.bandits.some(b => b.blockedNum === ci.cardDef.numero);
}

// Après le tirage (animations terminées), résout les bandits un par un
// Résout une file de bandits séquentiellement après les animations.
// Chaque entrée : { banditNum, goldCards[] } pré-calculés au moment du tirage.
function _resolveBanditQueue(queue) {
  if (!queue || queue.length === 0) return;
  const { banditNum, goldCards, autoBlock } = queue[0];
  const rest = queue.slice(1);
  const next = () => { if (rest.length > 0) setTimeout(() => _resolveBanditQueue(rest), 400); };

  const entry = gameState.bandits.find(b => b.banditNum === banditNum);
  if (!entry) { next(); return; }

  if (goldCards.length === 0) {
    // Aucune carte or disponible
    entry.blockedNum = null;
    entry.pendingChoice = false;
    addLog(`🗡️ <span class="log-card">Bandit</span> joué — aucune carte à bloquer.`);
    updateUI();
    next();
  } else if (autoBlock) {
    // Carte or tirée dans le même tirage → blocage automatique prioritaire, sans choix
    entry.blockedNum = autoBlock.cardDef.numero;
    entry.pendingChoice = false;
    addLog(`🗡️ <span class="log-card">Bandit</span> bloque <span class="log-card">${getFaceData(autoBlock).nom}</span> — tirée ensemble !`, true);
    showBanditBlockedNotice(getFaceData(autoBlock).nom);
    updateUI();
    next();
  } else if (goldCards.length === 1) {
    // Une seule cible → blocage automatique
    entry.blockedNum = goldCards[0].cardDef.numero;
    entry.pendingChoice = false;
    addLog(`🗡️ <span class="log-card">Bandit</span> bloque <span class="log-card">${getFaceData(goldCards[0]).nom}</span> !`, true);
    showBanditBlockedNotice(getFaceData(goldCards[0]).nom);
    updateUI();
    next();
  } else {
    // Plusieurs cibles existantes → modal de choix
    showBanditChoiceModal(banditNum, goldCards, rest);
  }
}

// Fallback : utilisé après résolution d'un pendingFaceChoice (sans file pré-calculée)
function processPendingBandits() {
  const unregistered = gameState.play.filter(ci =>
    isBandit(ci) && !gameState.bandits.some(b => b.banditNum === ci.cardDef.numero)
  );
  if (unregistered.length === 0) return;

  const queue = unregistered.map(banditCi => {
    const banditNum = banditCi.cardDef.numero;
    // Le malus de gloire est appliqué à la découverte (confirmNewCards)
    const malusGloire = (gameState.banditMalus && gameState.banditMalus[banditNum]) || 0;
    gameState.bandits.push({ banditNum, blockedNum: null, pendingChoice: false, malusGloire });
    const goldCards = gameState.play.filter(c =>
      c !== banditCi && !isBandit(c) && producesGold(c) &&
      !gameState.bandits.some(b => b.blockedNum === c.cardDef.numero)
    );
    return { banditNum, goldCards };
  });
  _resolveBanditQueue(queue);
}

// Retire le bandit (et son blocage) quand une carte quitte play[].
// Appeler avec le numéro de carte AVANT le splice.
function updateBanditIndices(cardNum) {
  if (cardNum == null) return;
  gameState.bandits = gameState.bandits.filter(b => b.banditNum !== cardNum);
  gameState.bandits.forEach(b => { if (b.blockedNum === cardNum) b.blockedNum = null; });
}

// Helper : retire play[idx] et nettoie les bandits en une seule opération
function _playRemove(idx) {
  const num = gameState.play[idx]?.cardDef.numero;
  updateBanditIndices(num);
  gameState.play.splice(idx, 1);
}

function showBanditBlockedNotice(targetName) {
  addLog(`🔒 <span class="log-card">${targetName}</span> est bloquée — production d'Or impossible.`);
}

// Modal de choix : goldCards est un tableau de cardInstances
// rest = file des bandits suivants à résoudre après ce choix
function showBanditChoiceModal(banditNum, goldCards, rest) {
  window._banditChoiceRest = rest || [];
  let html = `
    <p style="margin-bottom:16px;font-size:0.9rem;text-align:center;line-height:1.5;">
      Le <strong style="color:#ff6666;">Bandit</strong> doit bloquer une de vos cartes produisant de l'Or.<br>
      <em style="font-size:0.8rem;color:#aaa;">Choisissez la carte à bloquer :</em>
    </p>`;
  goldCards.forEach(ci => {
    const fd = getFaceData(ci);
    const goldRes = (fd.ressources || []).filter(r => {
      const types = Array.isArray(r.type) ? r.type : [r.type];
      return types.map(t => normalizeRes(t)).includes("Or");
    });
    const goldAmount = goldRes.reduce((s, r) => s + (r.quantite || 1), 0);
    html += `
      <button onclick="assignBanditBlock(${banditNum}, ${ci.cardDef.numero})" class="bandit-choice-btn">
        <span style="font-size:1.4rem;margin-right:10px;">${getCardEmoji(fd.type, fd.nom)}</span>
        <span>
          <strong style="font-size:0.9rem;">${fd.nom}</strong>
          <span style="display:block;font-size:0.72rem;color:#ffaa88;margin-top:2px;">
            💰 ${goldAmount} Or — ${fd.type}
          </span>
        </span>
      </button>`;
  });
  $('#banditChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('banditChoiceModal')).show();
}

// Appelé quand le joueur choisit la carte à bloquer
function assignBanditBlock(banditNum, targetCardNum) {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('banditChoiceModal'))?.hide();
  const entry = gameState.bandits.find(b => b.banditNum === banditNum);
  if (entry) {
    entry.blockedNum = targetCardNum;
    entry.pendingChoice = false;
    const targetIdx = _playIdxByNum(targetCardNum);
    const targetName = targetIdx >= 0 ? getFaceData(gameState.play[targetIdx]).nom : `#${targetCardNum}`;
    addLog(`🗡️ <span class="log-card">Bandit</span> bloque <span class="log-card">${targetName}</span> !`, true);
    showBanditBlockedNotice(targetName);
  }
  updateUI();
  const rest = window._banditChoiceRest || [];
  window._banditChoiceRest = [];
  if (rest.length > 0) setTimeout(() => _resolveBanditQueue(rest), 400);
}

// Vaincre le bandit : coûte 1 Épée, détruit le bandit, gagne 2 ressources au choix
function defeatBandit(cardNum) {
  const projected = getProjectedResources();
  if ((projected['Epée'] || 0) < 1) {
    addLog(`❌ Pas d'épée disponible pour vaincre le Bandit.`);
    return;
  }
  showBanditRewardModal(cardNum);
}

let pendingBanditDefeat = null; // stocke maintenant le numéro de carte

function showBanditRewardModal(banditNum) {
  pendingBanditDefeat = banditNum;
  window._banditRewardChoices = [];
  _renderBanditRewardModal();
  new bootstrap.Modal(document.getElementById('banditRewardModal')).show();
}

function _renderBanditRewardModal() {
  const resources = ['Or', 'Bois', 'Pierre', 'Métal'];
  const choices = window._banditRewardChoices || [];

  let html = `<p style="margin-bottom:12px;">Choisissez <strong>2 ressources</strong> à gagner en vainquant le Bandit :<br><small style="color:#aaa;">(Cliquez deux fois sur la même ressource pour la choisir en double)</small></p>`;
  html += `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">`;
  resources.forEach(r => {
    const count = choices.filter(c => c === r).length;
    const isSelected = count > 0;
    const badge = count === 2 ? ` <span style="background:#f0c040;color:#1a0a00;border-radius:50%;padding:0 5px;font-size:0.7rem;font-weight:bold;">×2</span>` : '';
    html += `<button onclick="selectBanditReward('${r}')" class="bandit-reward-btn${isSelected ? ' selected' : ''}" id="reward-${r}">
      ${RESOURCE_ICONS[r]} ${r}${badge}
    </button>`;
  });
  html += `</div>`;

  // Sélection avec boutons de désélection individuels
  if (choices.length > 0) {
    html += `<div style="margin-top:12px;text-align:center;">
      <div style="font-family:'Cinzel',serif;font-size:0.75rem;color:#aaa;margin-bottom:6px;">Sélection :</div>
      <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">`;
    choices.forEach((r, i) => {
      html += `<span style="background:rgba(240,192,64,0.15);border:1px solid #f0c040;border-radius:12px;padding:3px 10px;font-size:0.8rem;color:#f0c040;display:flex;align-items:center;gap:4px;">
        ${RESOURCE_ICONS[r]} ${r}
        <button onclick="removeBanditReward(${i})" style="background:none;border:none;color:#cc4444;cursor:pointer;font-size:0.9rem;padding:0;line-height:1;" title="Retirer">✕</button>
      </span>`;
    });
    html += `</div></div>`;
  } else {
    html += `<div style="margin-top:12px;min-height:30px;text-align:center;font-family:'Cinzel',serif;font-size:0.75rem;color:#666;">Aucune ressource sélectionnée</div>`;
  }

  html += `<button onclick="confirmBanditDefeat()" class="btn btn-success btn-sm" style="margin-top:12px;display:block;margin-left:auto;margin-right:auto;" id="btnConfirmDefeat" ${choices.length < 2 ? 'disabled' : ''}>✔ Confirmer</button>`;
  $('#banditRewardBody').html(html);
}

function selectBanditReward(resource) {
  if (!window._banditRewardChoices) window._banditRewardChoices = [];
  const choices = window._banditRewardChoices;
  if (choices.length < 2) {
    choices.push(resource);
  }
  _renderBanditRewardModal();
}

function removeBanditReward(index) {
  if (!window._banditRewardChoices) return;
  window._banditRewardChoices.splice(index, 1);
  _renderBanditRewardModal();
}

function confirmBanditDefeat() {
  // Blur the currently focused element to prevent it from retaining focus
  // while its ancestor (the modal) is being hidden.
  if (document.activeElement) {
    document.activeElement.blur();
  }
  
  bootstrap.Modal.getInstance(document.getElementById('banditRewardModal'))?.hide();
  const choices = window._banditRewardChoices || [];
  if (choices.length < 2 || pendingBanditDefeat === null) return;

  const banditNum = pendingBanditDefeat;
  pendingBanditDefeat = null;

  // 1. Trouver la carte et son élément DOM
  const banditPlayIndex = _playIdxByNum(banditNum);
  let banditCard = null;
  let banditCardEl = null;
  let sourceZone = '';

  if (banditPlayIndex >= 0) {
    banditCard = gameState.play[banditPlayIndex];
    banditCardEl = document.querySelector(`.card-wrapper[data-card-num="${banditNum}"]`);
    sourceZone = 'play';
  } else {
    const retIdx = (gameState.retainedCards || []).findIndex(c => c.cardDef.numero === banditNum);
    if (retIdx >= 0) {
      banditCard = gameState.retainedCards[retIdx];
      banditCardEl = document.querySelector(`.card-wrapper[data-held-num="${banditNum}"]`);
      sourceZone = 'retained';
    }
  }

  if (!banditCard) return; // introuvable

  // 2. Définir la logique à exécuter après l'animation
  const afterAnimation = () => {
    // Dépenser 1 Épée et créditer les ressources choisies
    gameState.resources['Epée'] = Math.max(0, (gameState.resources['Epée'] || 0) - 1);
    choices.forEach(r => { gameState.resources[r] = (gameState.resources[r] || 0) + 1; });

    // Placer le bandit dans les cartes détruites/sacrifiées
    if (!gameState.destroyed) gameState.destroyed = [];
    gameState.destroyed.push(banditCard);

    const resParts = choices.map(r => `${RESOURCE_ICONS[r]} ${r}`).join(' + ');
    addLog(`⚔️ <span class="log-card">Bandit</span> vaincu ! -1⚔️ +${resParts}`, true);
    updateUI();
  };

  // 3. Retirer la carte du gameState AVANT l'animation
  if (sourceZone === 'play') {
    _playRemove(banditPlayIndex);
  } else if (sourceZone === 'retained') {
    const retIdx = (gameState.retainedCards || []).findIndex(c => c.cardDef.numero === banditNum);
    if (retIdx >= 0) gameState.retainedCards.splice(retIdx, 1);
    // Nettoyer manuellement bandits[] et retained[]
    updateBanditIndices(banditNum);
    if (gameState.retained) {
      const rIdx = gameState.retained.indexOf(banditNum);
      if (rIdx >= 0) gameState.retained.splice(rIdx, 1);
    }
  }

  // 4. Lancer l'animation vers la pile des sacrifiées
  const sacrificedRect = document.querySelector('#sacrificedVisual .card-front')?.getBoundingClientRect();
  if (banditCardEl && sacrificedRect) {
    // Ne pas appeler updateUI() ici, car ça retirerait l'élément du DOM avant l'animation.
    // L'animation se chargera de retirer l'élément.
    _animateCardsToDiscard([banditCardEl], sacrificedRect, afterAnimation);
  } else {
    // Pas d'animation possible, exécuter directement
    afterAnimation();
  }
}

/**
 * Animates a list of card elements to the discard pile.
 * @param {HTMLElement[]} cardElements - Array of DOM elements for the cards to animate.
 * @param {DOMRect} discardRect - The bounding rectangle of the discard pile (target position).
 * @param {Function} callback - Function to call after all animations are complete.
 */
function _animateCardsToDiscard(cardElements, discardRect, callback) {
  if (!cardElements || cardElements.length === 0 || !discardRect) {
    if (callback) callback();
    return;
  }

  let animationsCompleted = 0;
  const totalAnimations = cardElements.length;

  cardElements.forEach((cardEl, index) => {
    const startRect = cardEl.getBoundingClientRect();

    // Calculate the translation needed to move the card from its current position
    // to the center of the discard pile.
    const dx = discardRect.left + discardRect.width / 2 - (startRect.left + startRect.width / 2);
    const dy = discardRect.top + discardRect.height / 2 - (startRect.top + startRect.height / 2);

    cardEl.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
    cardEl.style.zIndex = 1000; // Bring to front during animation

    setTimeout(() => {
      cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(0.2) rotate(${Math.random() * 360}deg)`;
      cardEl.style.opacity = '0';
    }, index * 50); // Stagger animations slightly

    cardEl.addEventListener('transitionend', function onTransitionEnd() {
      cardEl.removeEventListener('transitionend', onTransitionEnd);
      cardEl.remove(); // Remove the card element from DOM after animation
      animationsCompleted++;
      if (animationsCompleted === totalAnimations) { if (callback) callback(); }
    });
  });
}
function moveToDiscard(target) {
  const arr = gameState[target.zone];
  const actualIdx = arr.indexOf(target.ci);
  if (actualIdx >= 0) arr.splice(actualIdx, 1);
  gameState.discard.push(target.ci);
}

function showDestructionChoiceModal(available) {
  let html = `<p style="margin-bottom:14px;">Choisissez une carte à mettre en <strong>défausse</strong> :</p>`;
  available.forEach((t, i) => {
    const f = getFaceData(t.ci);
    const zoneLabel = { play:'En jeu', discard:'Défausse', deck:'Pioche' }[t.zone];
    html += `<button onclick="confirmDestructionChoice(${i})" class="bandit-choice-btn">
      ${getCardEmoji(f.type, f.nom)} <strong>${f.nom}</strong>
      <span style="font-size:0.75rem;opacity:0.7;"> — #${t.ci.cardDef.numero} (${zoneLabel})</span>
    </button>`;
  });
  window._destructionTargets = available;
  $('#destructionChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('destructionChoiceModal')).show();
}

function confirmDestructionChoice(idx) {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('destructionChoiceModal'))?.hide();
  const target = (window._destructionTargets || [])[idx];
  if (!target) return;
  moveToDiscard(target);
  addLog(`🎯 <span class="log-card">${getFaceData(target.ci).nom}</span> (#${target.ci.cardDef.numero}) — défaussée.`, true);
  window._destructionTargets = null;
  updateUI();
}

// ============================================================
//  ANIMATION RÉVÉLATION — Conversion du Missionnaire
// ============================================================

function _showConversionReveal(banditCard, face2, act, missionaireName) {
  const face1 = banditCard.cardDef.faces.find(f => f.face === 1) || banditCard.cardDef.faces[0];

  // Remplir la face avant (Bandit)
  document.getElementById('convFrontSerial').textContent = `#${banditCard.cardDef.numero}`;
  document.getElementById('convFrontEmoji').innerHTML    = getCardEmoji(face1.type, face1.nom);
  document.getElementById('convFrontName').textContent   = face1.nom;
  document.getElementById('convFrontDesc').textContent   = face1.description || '';

  // Remplir la face arrière (nouvelle identité)
  const face2Data = face2 || { nom: '?', type: 'Personne', description: '' };
  document.getElementById('convBackSerial').textContent  = `#${banditCard.cardDef.numero}`;
  document.getElementById('convBackEmoji').innerHTML     = getCardEmoji(face2Data.type, face2Data.nom);
  document.getElementById('convBackName').textContent    = face2Data.nom;
  document.getElementById('convBackType').textContent    = face2Data.type || 'Personne';
  document.getElementById('convBackDesc').textContent    = face2Data.description || '';

  // Ressources de la nouvelle face
  const resHTML = (face2Data.ressources || []).map(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.map(t => `${RESOURCE_ICONS[normalizeRes(t)] || t} ×${r.quantite}`).join(' ');
  }).join('  ');
  document.getElementById('convBackRes').textContent = resHTML;

  // Sous-titre et coût
  document.getElementById('convRevealSubtitle').innerHTML =
    `<strong style="color:#f0c040;">${missionaireName}</strong> répand la foi...<br>
     <em style="font-size:0.85rem;color:#aaa;">${face1.nom} devient ${face2Data.nom}</em>`;

  const costParts = (act.cout || []).map(c =>
    `${c.quantite} ${RESOURCE_ICONS[normalizeRes(c.type)] || c.type}`
  );
  document.getElementById('convRevealCost').innerHTML = costParts.length
    ? `💸 Coût débité : ${costParts.join(' + ')}`
    : '';

  // Réinitialiser le flip et les boutons
  const flipCard = document.getElementById('convFlipCard');
  flipCard.classList.remove('is-flipped');
  flipCard.querySelectorAll('.conv-glow-ring').forEach(el => el.remove());
  document.getElementById('convBtnConvert').style.display = '';
  document.getElementById('convBtnClose').style.display   = 'none';

  // Ouvrir le modal — le joueur clique "Convertir" pour déclencher le flip
  const modal = new bootstrap.Modal(document.getElementById('conversionRevealModal'));
  modal.show();
}

function triggerConversionFlip() {
  const flipCard = document.getElementById('convFlipCard');
  const btnConvert = document.getElementById('convBtnConvert');
  const btnClose   = document.getElementById('convBtnClose');

  // Déclencher le flip
  flipCard.classList.add('is-flipped');
  btnConvert.style.display = 'none';

  // Ajouter l'anneau lumineux après le flip
  setTimeout(() => {
    const ring = document.createElement('div');
    ring.className = 'conv-glow-ring';
    flipCard.querySelector('.conv-flip-back .conv-card-inner').appendChild(ring);
    // Afficher le bouton de fermeture avec une apparition douce
    btnClose.style.display = '';
    btnClose.style.opacity = '0';
    btnClose.style.transition = 'opacity 0.4s';
    requestAnimationFrame(() => { btnClose.style.opacity = '1'; });
  }, 850);
}

function closeConversionReveal() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('conversionRevealModal'))?.hide();
  const { missionaireCard, banditCard, face2Name } = window._pendingConversionDiscard || {};
  window._pendingConversionDiscard = null;
  if (missionaireCard) gameState.discard.push(missionaireCard);
  if (banditCard)      gameState.discard.push(banditCard);
  if (banditCard) addLog(`🕊️ <span class="log-card">${face2Name}</span> & Missionnaire — défaussés.`, true);
  updateUI();
}

// ============================================================
//  CONVERSION (Missionnaire) — convertit un Bandit en face 2
// ============================================================

function showConversionModal(missionairePlayIndex, act, bandits) {
 // Titre spécifique au Missionnaire (réutilise la modale de sacrifice)
  $('#sacrificeChoiceTitle').html(`✝️ Missionnaire — Choisir un Bandit à convertir`);

  let html = `<p style="margin-bottom:12px;font-family:'Crimson Text',serif;font-size:0.9rem;color:#f5e6c8;">
    Choisissez un <strong>Bandit</strong> à convertir :<br>
    <small style="color:#aaa;">Il sera promu en face 2, puis défaussé avec le Missionnaire.</small>
  </p><div style="display:flex;flex-direction:column;gap:8px;">`;

  bandits.forEach(ci => {
    const f = getFaceData(ci);
    const face2 = ci.cardDef.faces.find(f2 => f2.face === 2);
    const face2Name = face2 ? face2.nom : '?';
    html += `<button onclick="selectConversionTarget(${ci.cardDef.numero})" class="sacrifice-choice-btn" id="convTargetBtn_${ci.cardDef.numero}">
      <span class="sacrifice-emoji">✝️</span>
      <span class="sacrifice-info">
        <strong>${f.nom}</strong> #${ci.cardDef.numero}
        <span class="sacrifice-type" style="color:#aaa;">→ devient <strong style="color:#f0c040;">${face2Name}</strong></span>
      </span>
    </button>`;
  });

  html += `</div>`;

  // Boutons d'action
  html += `<div style="text-align:center;margin-top:18px;display:flex;gap:10px;justify-content:center;">
    <button onclick="cancelConversionModal()" class="btn"
      style="font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:1px;
      background:rgba(60,40,20,0.6);border:1px solid rgba(139,105,20,0.4);
      color:var(--stone-light);padding:8px 18px;border-radius:6px;cursor:pointer;">
      ✕ Annuler
    </button>
    <button id="btnConfirmConversion" onclick="confirmConversion()" disabled style="
      font-family:'Cinzel',serif;font-weight:700;font-size:0.72rem;letter-spacing:1px;
      background:rgba(0,0,0,0.4);border:2px solid #444;color:#666;
      padding:8px 22px;border-radius:6px;cursor:not-allowed;transition:all 0.2s;">
      ✝️ Convertir
    </button>
  </div>`;

  window._pendingConversion = { missionairePlayIndex, act, bandits };
  window._pendingConversion.selectedBanditNum = null; // Initialiser la sélection
  $('#sacrificeChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('sacrificeChoiceModal')).show();
}

// Sélectionne un Bandit cible dans la modale de conversion
function selectConversionTarget(banditNum) {
  const { bandits } = window._pendingConversion;
  window._pendingConversion.selectedBanditNum = banditNum;

  // Mettre à jour le style des boutons
  bandits.forEach(ci => {
    const btn = document.getElementById(`convTargetBtn_${ci.cardDef.numero}`);
    if (btn) {
      const isSelected = ci.cardDef.numero === banditNum;
      btn.style.borderColor = isSelected ? '#f0c040' : 'var(--border-ornate)';
      btn.style.boxShadow   = isSelected ? '0 0 12px rgba(200,150,12,0.4)' : 'none';
      btn.style.background  = isSelected ? 'linear-gradient(135deg,#1a1408,#0e0e06)' : 'rgba(0,0,0,0.2)';
      // Ajouter une coche visuelle
      let checkmark = btn.querySelector('.conversion-checkmark');
      if (!checkmark) {
        checkmark = document.createElement('div');
        checkmark.className = 'conversion-checkmark';
        btn.appendChild(checkmark);
      }
      checkmark.style.display = isSelected ? 'block' : 'none';
    }
  });

  // Activer le bouton de confirmation
  const confirmBtn = document.getElementById('btnConfirmConversion');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.style.cursor      = 'pointer';
    confirmBtn.style.background  = 'linear-gradient(135deg,#5a3a08,#c8960c,#5a3a08)';
    confirmBtn.style.borderColor = '#f0c040';
    confirmBtn.style.color       = '#1a0e04';
  }
}

function cancelConversionModal() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();
  const { missionairePlayIndex } = window._pendingConversion || {};
  window._pendingConversion = null;
  // Remettre le Missionnaire en jeu si l'annulation est possible
  // (la carte a été temporairement retirée de play[] par stageActivateEffect)
  _restoreRetainedIfNeeded(missionairePlayIndex);
}

function confirmConversion() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();

  const { missionairePlayIndex, act, selectedBanditNum } = window._pendingConversion || {};
  window._pendingConversion = null;

  // Clean up the pending retained flag, since the action is now confirmed.
  if (window._pendingRetainedActivateNum) {
    window._pendingRetainedActivateNum = null;
  }

  if (selectedBanditNum === null) return; // Aucun bandit sélectionné

  const banditPlayIndex = _playIdxByNum(selectedBanditNum);
  const missionaireCard = gameState.play[missionairePlayIndex];
  const banditCard      = gameState.play[banditPlayIndex];
  if (!missionaireCard || !banditCard) return;

  // Débiter le coût immédiatement
  for (const c of (act.cout || [])) {
    const key = normalizeRes(c.type);
    gameState.resources[key] = (gameState.resources[key] || 0) - c.quantite;
  }

  // Promouvoir le Bandit en face 2
  const face2 = banditCard.cardDef.faces.find(f2 => f2.face === 2);
  const face2Name = face2 ? face2.nom : 'face 2';
  banditCard.currentFace = 2;

  // Retirer les deux cartes du jeu maintenant (avant l'animation)
  const idxs = [missionairePlayIndex, banditPlayIndex].sort((a, b) => b - a);
  idxs.forEach(i => _playRemove(i));
  gameState.bandits = (gameState.bandits || []).filter(b => b.banditNum !== banditCard.cardDef.numero);

  // Stocker pour la fermeture du modal
  window._pendingConversionDiscard = { missionaireCard, banditCard, face2Name };

  const missionaireName = getFaceData(missionaireCard).nom;
  addLog(`✝️ <span class="log-card">${missionaireName}</span> convertit <span class="log-card">${getFaceData(banditCard).nom}</span> → <span class="log-card">${face2Name}</span>`, true);

  updateUI();
  _showConversionReveal(banditCard, face2, act, missionaireName);
}

// ============================================================
//  ÉRUPTION VOLCANIQUE (carte 28) — Effet Force
// ============================================================

// Appelé après chaque tirage de cartes pour vérifier si l'effet d'éruption
// doit se déclencher sur les nouveaux terrains (tirés hors du tirage initial).
// - newCardNums : Set des numéros de cartes tirées dans CE tirage
// - eruptionCardNum : numéro de la carte 28 dans ce même tirage (ou null)
function _resolveEruption(newCardNums, eruptionWasAlreadyActive) {
  if (!eruptionWasAlreadyActive) return; // L'éruption n'était pas active avant ce tirage

  // Règle ajoutée : l'éruption ne se déclenche que si la carte #28 est toujours
  // en jeu (sur sa face 1) au moment du tirage. Si elle a été défaussée ou
  // retournée entre temps, l'effet est annulé.
  const eruptionCard = gameState.play.find(c => c.cardDef.numero === 28);
  const isEruptionStillInPlayAndActive = eruptionCard && (eruptionCard.currentFace || 1) === 1;

  if (!isEruptionStillInPlayAndActive) {
    if (gameState.eruptionActive) {
      // Nettoyage : si la carte n'est plus là, l'état global doit être mis à jour.
      gameState.eruptionActive = false;
    }
    return;
  }

  // Chercher les terrains tirés dans CE lot (candidats à destruction)
  const newTerrains = gameState.play.filter(ci => {
    if (!newCardNums.has(ci.cardDef.numero)) return false;
    const fd = getFaceData(ci);
    const isPermanent = gameState.permanent.some(p => p.cardDef.numero === ci.cardDef.numero);
    return !isPermanent && (fd.type === 'Terrain' || fd.type === 'Bâtiment' || fd.type === 'Batiment')
      ? fd.type === 'Terrain' // uniquement les vrais Terrains (bannière verte)
      : false;
  }).filter(ci => {
    // Exclure la carte 28 elle-même si elle vient d'être tirée dans CE lot
    return ci.cardDef.numero !== 28;
  });

  if (newTerrains.length === 0) return; // Pas de terrain → pas d'effet

  if (newTerrains.length === 1) {
    // Auto-destruction
    _applyEruptionDestruction(newTerrains[0]);
  } else {
    // Plusieurs terrains → choix du joueur
    _showEruptionChoiceModal(newTerrains);
  }
}

// Applique la destruction d'un terrain par l'éruption
function _applyEruptionDestruction(terrainCI) {
  const fd = getFaceData(terrainCI);
  const terrainName = fd.nom;

  window._pendingEruptionTerrain = terrainCI;
  const eruptionCardWrapper = document.querySelector('.card-wrapper[data-card-num="28"]');
  if (eruptionCardWrapper) {
    eruptionCardWrapper.classList.add('card-wrapper-eruption-shake');
  }
  document.getElementById('eruptionExplainConfirm').style.display = 'none';
  document.getElementById('eruptionExplainBody').innerHTML = `
    <div id="eruptionModalAnimation" style="display:flex;flex-direction:column;align-items:center;gap:12px;">
      <img id="eruptionStageImg" src="img/volcan-1.png" alt="Volcan en éruption" style="width:150px;height:auto;border-radius:12px;box-shadow:0 0 28px rgba(255,120,0,0.85);">
      <div id="eruptionStageText" style="font-family:'Crimson Text',serif;color:#ffe5b0;font-size:0.95rem;text-align:center;line-height:1.4;max-width:260px;min-height:6.5em;"></div>
      <div id="eruptionStageHint" class="eruption-stage-hint"></div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('eruptionExplainModal')).show();
  startEruptionExplainAnimation();
}

function startEruptionExplainAnimation() {
  const stageImg = document.getElementById('eruptionStageImg');
  const stageText = document.getElementById('eruptionStageText');
  const stageHint = document.getElementById('eruptionStageHint');
  if (!stageImg || !stageText || !stageHint) return;

  const stepTexts = [
    'Le volcan à l\'air sagement paisible… mais une tension inquiétante se fait sentir.',
    'Soudain un grondement se fait entendre, des fissures chauffent la roche.',
    'Une colonne de cendres s’élance, l’air devient suffocant.',
    'La lave ruisselle, menaçant d’engloutir votre terrain.',
    'Des explosions secouent le cratère, des éclairs de feu déchirent la fumée.'
  ];

  let step = 0;
  let waitingForKey = false;
  let finalRevealAfterKey = false;
  let keyHandler = null;

  function typeText(text, callback) {
    stageText.textContent = '';
    let idx = 0;

    function nextChar() {
      if (idx < text.length) {
        stageText.textContent += text[idx++];
        setTimeout(nextChar, 32);
      } else {
        callback?.();
      }
    }

    nextChar();
  }

  function showHint(message) {
    stageHint.textContent = message;
  }

  function cleanup() {
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  function proceed() {
    if (step < stepTexts.length) {
      stageImg.src = `img/volcan-${step + 1}.png`;
      stageImg.alt = `Volcan en éruption étape ${step + 1}`;
      waitingForKey = false;
      finalRevealAfterKey = false;
      showHint('');
      const isLastStep = step === stepTexts.length - 1;
      typeText(stepTexts[step], () => {
        if (isLastStep) {
          finalRevealAfterKey = true;
          showHint('Appuyez sur une touche pour continuer.');
          waitingForKey = true;
        } else {
          showHint('Appuyez sur une touche pour continuer.');
          waitingForKey = true;
        }
      });
      step += 1;
    } else {
      cleanup();
      showEruptionRevealStep();
    }
  }

  keyHandler = (event) => {
    if (!waitingForKey) return;
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) return;
    event.preventDefault();
    waitingForKey = false;

    if (finalRevealAfterKey) {
      finalRevealAfterKey = false;
      cleanup();
      showEruptionRevealStep();
      return;
    }

    proceed();
  };

  document.addEventListener('keydown', keyHandler);
  proceed();
}

function showEruptionRevealStep() {
  const terrainCI = window._pendingEruptionTerrain;
  if (!terrainCI) return;

  const fd = getFaceData(terrainCI);
  const terrainName = fd.nom;
  const terrainType = fd.type;
  const terrainEmoji = getCardEmoji(fd.type, fd.nom);
  const cendresFace = gameState.play.find(ci => ci.cardDef.numero === 28)?.cardDef.faces.find(f => f.nom === 'Cendres volcaniques');
  const cendresName = cendresFace ? cendresFace.nom : 'Cendres volcaniques';
  const cendresEmoji = cendresFace ? getCardEmoji(cendresFace.type, cendresFace.nom) : '🌋';

  document.getElementById('eruptionExplainBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;align-items:center;">
      <div style="font-family:'Cinzel',serif;color:#ffebc0;font-size:1rem;text-align:center;max-width:300px;">
        Votre terrain ne semble pus qu'un lointain souvenir. Des <strong>${cendresName}</strong> le recouvrent maintenant.
      </div>
      <div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center;align-items:center;">
        <div class="eruption-modal-flip" id="eruptionModalFlip">
          <div class="eruption-modal-flip-inner" id="eruptionModalFlipInner">
            <div class="eruption-modal-flip-face eruption-modal-flip-front">
              <div style="font-size:2rem;">${terrainEmoji}</div>
              <div style="font-family:'Cinzel',serif;font-size:0.95rem;color:#ffe5b0;margin-top:10px;">${terrainName}</div>
              <div style="font-size:0.78rem;color:#d8b070;margin-top:6px;">${terrainType}</div>
              <div style="font-size:0.78rem;color:#ffc680;margin-top:6px;">Terrain détruit</div>
            </div>
            <div class="eruption-modal-flip-face eruption-modal-flip-back">
              <div style="font-size:2rem;">${cendresEmoji}</div>
              <div style="font-family:'Cinzel',serif;font-size:0.95rem;color:#ffe5b0;margin-top:10px;">${cendresName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const confirmBtn = document.getElementById('eruptionExplainConfirm');
  if (confirmBtn) {
    confirmBtn.style.display = 'inline-block';
    confirmBtn.textContent = 'Terminer';
    confirmBtn.disabled = true;
  }

  setTimeout(() => {
    const flipInner = document.getElementById('eruptionModalFlipInner');
    if (flipInner) {
      flipInner.classList.add('eruption-modal-flip-active');
    }
    if (confirmBtn) {
      confirmBtn.disabled = false;
    }
  }, 2000);
}

function confirmEruptionExplain() {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('eruptionExplainModal'))?.hide();
  const terrainCI = window._pendingEruptionTerrain;
  window._pendingEruptionTerrain = null;
  if (!terrainCI) return;

  const fd = getFaceData(terrainCI);
  const terrainName = fd.nom;

  const tIdx = _playIdxByNum(terrainCI.cardDef.numero);
  if (tIdx >= 0) _playRemove(tIdx);

  if (!gameState.destroyed) gameState.destroyed = [];
  gameState.destroyed.push(terrainCI);

  addLog(`🌋 <span class="log-card">Éruption Volcanique</span> détruit <span class="log-card">${terrainName}</span> — les cendres enrichissent la terre…`, true);

  const eruption28 = gameState.play.find(ci => ci.cardDef.numero === 28);
  if (eruption28) {
    eruption28.currentFace = 3;
    cardStateMap[28] = 3;
    const newFd = getFaceData(eruption28);
    addLog(`🌋 <span class="log-card">Éruption Volcanique</span> → <span class="log-card">${newFd.nom}</span>`, true);
    gameState.eruptionActive = false;
  }

  const eruptionCardWrapper = document.querySelector('.card-wrapper[data-card-num="28"]');
  if (eruptionCardWrapper) {
    eruptionCardWrapper.classList.remove('card-wrapper-eruption-shake');
  }

  updateUI();
}

// Modal de choix quand plusieurs terrains sont tirés simultanément
function _showEruptionChoiceModal(candidates) {
  let html = `
    <div style="
      background:rgba(200,60,0,0.12);border:1px solid rgba(200,80,0,0.4);
      border-radius:8px;padding:10px 14px;margin-bottom:16px;
      font-family:'Crimson Text',serif;font-size:0.92rem;color:#ffcc88;line-height:1.5;">
      <strong style="font-family:'Cinzel',serif;font-size:0.7rem;color:#ff8844;letter-spacing:1px;">
        ⚠ CAS PARTICULIER
      </strong><br>
      Plusieurs terrains ont été tirés simultanément. Puisque les cartes sont jouées en même temps,
      vous choisissez lequel est détruit par l'éruption.
    </div>
    <p style="margin-bottom:14px;font-family:'Crimson Text',serif;font-size:0.9rem;color:#f5e6c8;">
      Choisissez le <strong>Terrain</strong> à détruire :
    </p>
    <div style="display:flex;flex-direction:column;gap:8px;">`;

  candidates.forEach((ci, i) => {
    const f = getFaceData(ci);
    const resStr = (f.ressources || []).map(r => {
      const types = Array.isArray(r.type) ? r.type : [r.type];
      return `${r.quantite}${RESOURCE_ICONS[normalizeRes(types[0])] || types[0]}`;
    }).join(' ');
    const typeColors = { Terrain:'#2d5a27' };
    const bg = typeColors[f.type] || '#2d5a27';

    html += `
      <button onclick="_confirmEruptionChoice(${i})" style="
        width:100%;text-align:left;
        background:linear-gradient(135deg,#1a1008,#0e0e06);
        border:2px solid ${bg};border-radius:10px;padding:10px 14px;
        cursor:pointer;display:flex;align-items:center;gap:12px;
        transition:all 0.2s;">
        <div style="font-size:1.8rem;">${getCardEmoji(f.type, f.nom)}</div>
        <div style="flex:1;">
          <div style="font-family:'Cinzel',serif;font-weight:700;color:#f5e6c8;font-size:0.82rem;">${f.nom}</div>
          <div style="font-size:0.6rem;color:#888;">#${ci.cardDef.numero} · ${f.type}</div>
          ${resStr ? `<div style="font-size:0.65rem;color:#c8960c;margin-top:2px;">${resStr}</div>` : ''}
        </div>
        <div style="font-size:1.2rem;">🌋</div>
      </button>`;
  });

  html += `</div>`;

  window._eruptionChoiceCandidates = candidates;

  // Réutiliser le modal sacrificeChoiceModal
  $('#sacrificeChoiceTitle').html(`🌋 Éruption Volcanique — Choisir un Terrain à détruire`);
  $('#sacrificeChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('sacrificeChoiceModal')).show();
}

function _confirmEruptionChoice(idx) {
  if (document.activeElement) document.activeElement.blur();
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();
  const candidates = window._eruptionChoiceCandidates || [];
  window._eruptionChoiceCandidates = null;
  if (!candidates[idx]) return;
  _applyEruptionDestruction(candidates[idx]);
}     