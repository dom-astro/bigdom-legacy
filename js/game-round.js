// ============================================================
//  CONFIRMER LE TOUR : applique toutes les actions du staging
// ============================================================

function _processSingleStagedAction(entry) {
  const { cardInstance, action, resourcesGained, fameGained, newFace, cout } = entry;
  const oldName = getFaceData(cardInstance).nom;

  if (action === 'produce') {
    Object.entries(resourcesGained).forEach(([k, v]) => { gameState.resources[k] += v; });
    gameState.discard.push(cardInstance);
    addLog(`✅ <span class="log-card">${oldName}</span> — production appliquée.`);

  } else if (action === 'activate') {
    (cout || []).forEach(c => { gameState.resources[normalizeRes(c.type)] -= c.quantite; });
    Object.entries(resourcesGained).forEach(([k, v]) => { gameState.resources[k] += v; });
    const resStr = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`).join(' ');
    if (newFace) {
      cardInstance.currentFace = newFace;
      cardStateMap[cardInstance.cardDef.numero] = newFace;
      const newFaceData = getFaceData(cardInstance);
      gameState.discard.push(cardInstance);
      addLog(`🟢 <span class="log-card">${oldName}</span> abattue → <span class="log-card">${newFaceData.nom}</span> + ${resStr}`, true);
    } else {
      gameState.discard.push(cardInstance);
      if (entry.sacrificeCardInstance) {
        if (!gameState.destroyed) gameState.destroyed = [];
        gameState.destroyed.push(entry.sacrificeCardInstance);
        const sacrificeName = getFaceData(entry.sacrificeCardInstance).nom;
        addLog(`✅ <span class="log-card">${oldName}</span> + <span class="log-card">${sacrificeName}</span> sacrifiée — effet activé. ${resStr}`);
      } else {
        addLog(`✅ <span class="log-card">${oldName}</span> — effet activé et défaussée. ${resStr}`);
      }
    }

  } else if (action === 'upgrade') {
    if (cout) cout.forEach(c => { gameState.resources[normalizeRes(c.type)] -= c.quantite; });
    cardInstance.currentFace = newFace;
    cardStateMap[cardInstance.cardDef.numero] = newFace;
    if (fameGained) { gameState.fame += fameGained; addLog(`⭐ Gloire +${fameGained} (Total: ${gameState.fame})`, true); }
    const newFaceData = getFaceData(cardInstance);
    applyDestructionEffect(cardInstance);
    if (isStayInPlay(newFaceData)) {
      if (!gameState.stayInPlay) gameState.stayInPlay = [];
      gameState.stayInPlay.push(cardInstance);
      addLog(`🔼 <span class="log-card">${oldName}</span> → <span class="log-card">${newFaceData.nom}</span> — rejoint la zone de retenue !`, true);
    } else {
      gameState.discard.push(cardInstance);
      addLog(`🔼 <span class="log-card">${oldName}</span> → <span class="log-card">${newFaceData.nom}</span> — promue !`, true);
    }
  }
}

function confirmStagedActions() {
  _drawSnapshot = null;
  if (gameState.staging.length === 0) {
    endTurn();
    return;
  }

  const upgradeIndex = gameState.staging.findIndex(e => e.action === 'upgrade');

  if (upgradeIndex !== -1) {
    const upgradeEntry = gameState.staging[upgradeIndex];
    const allStagedEntries = [...gameState.staging];

    const afterAnimationCallback = () => {
      allStagedEntries.forEach(_processSingleStagedAction);
      gameState.staging = [];
      addLog('— Tour terminé par promotion —', true);
      endTurn();
    };

    _animatePromotion(upgradeEntry, upgradeIndex, afterAnimationCallback);
  } else {
    const stagedCount = gameState.staging.length;
    gameState.staging.forEach(_processSingleStagedAction);
    gameState.staging = [];
    addLog(`✅ ${stagedCount} action${stagedCount > 1 ? 's' : ''} confirmée${stagedCount > 1 ? 's' : ''}.`);
    updateUI();
  }
}

// ============================================================
//  FIN DE TOUR / NOUVELLE MANCHE
// ============================================================

function confirmEndTurn() {
  new bootstrap.Modal(document.getElementById('confirmEndTurnModal')).show();
}

function confirmNewRound() {
  const hasCardsLeft = gameState.play.length > 0 || gameState.deck.length > 0;
  if (!hasCardsLeft) { newRound(); return; }
  const playCount = gameState.play.length;
  const deckCount = gameState.deck.length;
  let html = '';
  if (playCount > 0)
    html += `<p>🃏 <strong>${playCount}</strong> carte${playCount>1?'s':''} en jeu seront défaussées.</p>`;
  if (deckCount > 0)
    html += `<p>📦 <strong>${deckCount}</strong> carte${deckCount>1?'s':''} dans la pioche seront perdues.</p>`;
  $('#confirmNewRoundDetails').html(html);
  new bootstrap.Modal(document.getElementById('confirmNewRoundModal')).show();
}

function endTurn() {
  const cardsToAnimate = [];
  // Collect DOM elements for cards that will be discarded
  // We need to do this BEFORE gameState.play is modified and updateUI() is called
  gameState.play.forEach(c => {
    if (!isStayInPlay(getFaceData(c))) { // Only animate cards that are actually discarded
      const cardEl = document.querySelector(`.card-wrapper[data-card-num="${c.cardDef.numero}"]`);
      if (cardEl) {
        cardsToAnimate.push(cardEl);
      }
    }
  });

  gameState.staging.forEach(entry => gameState.play.push(entry.cardInstance)); // Move staged cards back to play temporarily for animation capture
  gameState.staging = [];

  [...gameState.play].forEach(c => {
    if (isStayInPlay(getFaceData(c))) {
      if (!gameState.stayInPlay) gameState.stayInPlay = [];
      if (!gameState.stayInPlay.find(p => p.cardDef.numero === c.cardDef.numero))
        gameState.stayInPlay.push(c);
    } else {
      gameState.discard.push(c);
    }
  });

  gameState.bandits = [];
  // Vérifier si la carte 28 quitte le jeu (pas de staging) → désactiver l'éruption
  if (gameState.eruptionActive) {
    const still28InPlay = gameState.play.some(ci => ci.cardDef.numero === 28 && ci.currentFace === 1)
      || gameState.staging.some(e => e.cardInstance.cardDef.numero === 28 && e.cardInstance.currentFace === 1);
    if (!still28InPlay) gameState.eruptionActive = false;
  }
  gameState.armeeCaseCeTour  = false;
  gameState.tresorCaseCeTour = false;
  gameState.exportCaseCeTour = false;
  gameState.bijouxCaseCeTour = false;
  clearResources();
  gameState.turnStarted = false;
  gameState.turn++;
  addLog(`— Fin du Tour ${gameState.turn - 1} —`);

  const discardRect = document.querySelector('#discardVisual .card-front')?.getBoundingClientRect();

  const afterAnimation = () => {
    gameState.play = []; // Clear play area after animation
    updateUI(); // Update UI after animation
    if (gameState.deck.length === 0) { addLog(`🔚 Pioche vide. Fin de la Manche ${gameState.turn - 1}. Cliquez "Nouvelle Manche".`, true); }
    else { drawCards(4); }
  };

  if (cardsToAnimate.length > 0 && discardRect) { _animateCardsToDiscard(cardsToAnimate, discardRect, afterAnimation); }
  else { afterAnimation(); } // No animation, just update UI and continue
}

// Données en attente pendant l'inspection des nouvelles cartes
// (utilisé conjointement avec _showNewCardsModal / confirmNewCards et game-heritage.js)
let _pendingNewRound = null;
let _pendingRound9Choice = null;

// ──────────────────────────────────────────────────────────────────────────────
//  NOTE : Les systèmes Héritage (cartes 23-27), Armée (carte 25) et Rétention
//  (cartes 82-83) sont gérés dans game-heritage.js.
// ──────────────────────────────────────────────────────────────────────────────

function newRound() {
  const cardsToAnimate = [];
  // Collect DOM elements for cards that will be discarded
  // We need to do this BEFORE gameState.play is modified and updateUI() is called
  gameState.play.forEach(c => {
    const cardEl = document.querySelector(`.card-wrapper[data-card-num="${c.cardDef.numero}"]`);
    if (cardEl) {
      cardsToAnimate.push(cardEl);
    }
  });

  gameState.staging.forEach(e => gameState.play.push(e.cardInstance)); // Move staged cards back to play temporarily for animation capture
  gameState.staging = [];
  gameState.bandits = [];
  gameState.armeeCaseCeTour  = false;
  gameState.tresorCaseCeTour = false;
  gameState.exportCaseCeTour = false;
  gameState.bijouxCaseCeTour = false;

  // ── Rétention (cartes 82/83) ─────────────────────────────────────────────
  const retainedCards = gameState.retainedCards || [];
  if (retainedCards.length > 0) {
    addLog(`🕊️ ${retainedCards.map(ci => `<span class="log-card">${getFaceData(ci).nom}</span>`).join(', ')} — défaussée${retainedCards.length > 1 ? 's' : ''} en fin de manche.`, true);
  }
  gameState.retained = [];
  gameState.retainedCards = [];

  gameState.play.forEach(c => gameState.discard.push(c));

  // ── Cartes "Reste en jeu" (Muraille, etc.) ──────────────────────────────
  const sipCards = gameState.stayInPlay || [];
  gameState.stayInPlay = [];

  // Rassembler toutes les cartes non-permanentes pour former la nouvelle pioche.
  const allCards = [...gameState.deck, ...gameState.discard, ...sipCards, ...retainedCards];
  if (sipCards.length > 0) {
    addLog(`🏚️ ${sipCards.map(c => `<span class="log-card">${getFaceData(c).nom}</span>`).join(', ')} — remélangée${sipCards.length > 1 ? 's' : ''} dans la pioche.`);
  }
  // Les cartes dans gameState.permanent restent en place et ne sont pas remélangées.
  gameState.discard = []; gameState.deck = [];
  clearResources();

  const discardRect = document.querySelector('#discardVisual .card-front')?.getBoundingClientRect();

  const afterAnimation = () => {
    gameState.play = []; // Clear play area after animation
    updateUI(); // Update UI after animation

    // ── HÉRITAGE : se déclenche à la fin de la manche 7 ─────────────────────
    if (gameState.round === 7 && !gameState._heritageTriggered) {
      gameState._heritageTriggered = true;

      // Les CARDS_TO_DISCOVER ne rejoignent PAS la box automatiquement.
      // Elles ne sont accessibles que via des actions de jeu (effet Destruction, etc.).
      // La box reste donc inchangée après la manche 7.

      addLog(`📜 La manche 7 s'achève. La voie de l'Héritage s'ouvre...`, true);
      _showHeritageRuleModal(allCards); // défini dans game-heritage.js
      return;
    }

    // ── CHOIX MANCHE 9 : se déclenche à la fin de la manche 8 ────────────────
    if (gameState.round === 8 && !gameState._round9ChoiceTriggered) {
      gameState._round9ChoiceTriggered = true;
      addLog(`📜 La manche 8 s'achève. Un choix décisif vous attend...`, true);
      _showRound9ChoiceModal(allCards);
      return;
    }

    // ── Découverte de 2 cartes héritage par manche (à partir de la manche 8) ──
    const discovered = discoverNextCards(2);

    // Fin de partie : toutes les cartes héritage (28+) ont été révélées
    if (discovered.length === 0 && gameState._heritageTriggered) {
      const heritageCardNums = _getHeritageCardNums();
      const allRevealed = _allHeritageCardsRevealed(heritageCardNums);
      if (allRevealed) {
        addLog(`🏆 Toutes les cartes Héritage ont été révélées — Dernière Manche !`, true);
        gameState.gameOver = true;
      } else {
        addLog(`📦 Toutes les cartes ont été découvertes.`);
      }
      _finalizeNewRound(allCards, []);
      drawCards(4);
      return;
    }

    if (discovered.length === 0) {
      addLog(`📦 Toutes les cartes ont été découvertes.`);
      _finalizeNewRound(allCards, []);
      drawCards(4);
      return;
    }

    _pendingNewRound = { allCards, discovered };
    _showNewCardsModal(discovered);
    drawCards(4);
  };

  if (cardsToAnimate.length > 0 && discardRect) { _animateCardsToDiscard(cardsToAnimate, discardRect, afterAnimation); }
  else { afterAnimation(); } // No animation, just update UI and continue
}

// ============================================================
//  MODAL CHOIX MANCHE 9
// ============================================================

function _showRound9ChoiceModal(allCards) {
  const choiceCardNums = [31, 32, 33, 34];
  // Les cartes de choix sont définies dans LEGACY_CARDS et ne sont pas encore dans le royaume.
  const choiceCardDefs = (typeof LEGACY_CARDS !== 'undefined')
    ? choiceCardNums.map(num => LEGACY_CARDS.find(c => c.numero === num)).filter(Boolean)
    : [];

  if (choiceCardDefs.length < 4) {
    console.error("Cartes de choix pour la manche 9 (31-34) non trouvées. Annulation du choix.");
    addLog("⚠️ Erreur : les cartes de choix pour la manche 9 n'ont pas pu être chargées.", true);
    _finalizeNewRound(allCards, []);
    drawCards(4);
    return;
  }

  const choiceCards = choiceCardDefs.map(def => createCardInstance(def));
  _pendingRound9Choice = { allCards, choiceCards, selected: [] };

  const typeColors = {
    Personne: '#2a4a7a', Terrain: '#1e4a1a', Bâtiment: '#5a4a3a',
    Ennemi: '#5a0a0a', Evènement: '#3a2a5a', Maritime: '#0a3a5a'
  };

  const cardsHTML = choiceCards.map(card => {
    const face = getFaceData(card);
    const resHTML = (face.ressources && face.ressources.length)
      ? face.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return types.map(t =>
            `<span class="resource-pip" style="font-size:0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;">${RESOURCE_ICONS[normalizeRes(t)] || t} ×${r.quantite}</span>`
          ).join('');
        }).join('')
      : `<span style="color:#666;font-size:0.65rem;font-style:italic;">Aucune production</span>`;

    const effets = face.effet ? (Array.isArray(face.effet) ? face.effet : [face.effet]) : [];
    const effectHTML = effets.map(e => {
      const ico = { Activable: '🟢', Passif: '🔵', Destruction: '🔴' }[e.type] || '⚡';
      return `<div style="font-size:0.65rem;color:#bbeebb;margin-top:3px;">${ico} ${e.type}${e.description ? ' — ' + e.description : ''}</div>`;
    }).join('');

    const promos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
    const promoHTML = promos.length
      ? `<div style="font-size:0.65rem;color:#f0c040;margin-top:5px;">▲ ${promos.length} promotion${promos.length > 1 ? 's' : ''}</div>`
      : '';

    const victoryValue = getVictoryValue(face.victoire);
    const fameHTML = victoryValue !== null
      ? `<div style="font-size:0.7rem;color:#f0c040;margin-top:4px;">★ ${victoryValue > 0 ? '+' : ''}${victoryValue} Gloire</div>`
      : '';

    const totalFaces = card.cardDef.faces.length;
    const facesHTML = totalFaces > 1
      ? `<div style="font-size:0.6rem;color:#888;margin-top:4px;">${totalFaces} faces au total</div>`
      : '';

    const bgType = typeColors[face.type] || '#3a3a3a';
    const isChoiceC = isChoiceCard(card.cardDef);

    return `<div class="r9-choice-card" role="button" tabindex="0" data-card-num="${card.cardDef.numero}" onclick="_handleRound9CardSelection(${card.cardDef.numero})">
      <div class="r9-card-id">#${card.cardDef.numero}</div>
      ${isChoiceC ? `<div class="r9-choice-badge">⚖️ Double identité</div>` : ''}
      <div class="r9-choice-emoji">${getCardEmoji(face.type, face.nom)}</div>
      <div class="r9-card-name">${isChoiceC ? '⚖️ Identité à choisir' : face.nom}</div>
      <div class="r9-card-type">${face.type}</div>
      <div class="r9-card-section">${resHTML}</div>
      ${fameHTML}${effectHTML}${promoHTML}${facesHTML}
      <button type="button" class="r9-inspect-btn" onclick="event.stopPropagation(); showRound9ChoiceCardDetail(${card.cardDef.numero});">Inspecter</button>
    </div>`;
  }).join('');

  const introText = `À l'aube de la manche 9, un choix crucial s'impose. Quatre voies s'offrent à vous, mais vous ne pouvez en suivre que deux.<br><em style="font-size:0.85rem;color:#aaa;">Choisissez 2 cartes à ajouter à votre pioche. Les 2 autres seront détruites.</em>`;

  document.getElementById('round9ChoiceModalBody').innerHTML = `
    <div class="round9-choice-intro">
      <p>${introText}</p>
      <div class="round9-choice-hint">Sélectionnez <strong>2 cartes</strong> à ajouter à votre pioche. Les deux autres seront détruites.</div>
    </div>
    <div class="r9-choice-grid">${cardsHTML}</div>`;

  const confirmBtn = document.getElementById('confirmRound9ChoiceBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '✔ Confirmer (0/2)';
  }
  new bootstrap.Modal(document.getElementById('round9ChoiceModal')).show();
}

function showRound9ChoiceCardDetail(cardNum) {
  if (!_pendingRound9Choice) return;
  const cardInstance = _pendingRound9Choice.choiceCards.find(c => c.cardDef.numero === cardNum);
  if (!cardInstance) return;

  const choiceModalEl = document.getElementById('round9ChoiceModal');
  if (choiceModalEl) {
    const choiceModalInstance = bootstrap.Modal.getInstance(choiceModalEl);
    if (choiceModalInstance) {
      choiceModalInstance.hide();
      window._reopenRound9ChoiceAfterInspect = true;
    }
  }

  const cardModalEl = document.getElementById('cardModal');
  if (cardModalEl) {
    const reopenHandler = () => {
      if (window._reopenRound9ChoiceAfterInspect) {
        window._reopenRound9ChoiceAfterInspect = false;
        const choiceModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('round9ChoiceModal'));
        choiceModal.show();
      }
      cardModalEl.removeEventListener('hidden.bs.modal', reopenHandler);
    };
    cardModalEl.addEventListener('hidden.bs.modal', reopenHandler);
  }

  openCardModal(cardInstance, 'preview');
}

function _handleRound9CardSelection(cardNum) {
  if (!_pendingRound9Choice) return;

  const { selected } = _pendingRound9Choice;
  const index = selected.indexOf(cardNum);

  if (index > -1) {
    selected.splice(index, 1); // Deselect
  } else if (selected.length < 2) {
    selected.push(cardNum); // Select
  }

  document.querySelectorAll('.r9-choice-card').forEach(el => {
    const num = parseInt(el.dataset.cardNum, 10);
    const isSelected = _pendingRound9Choice.selected.includes(num);
    el.classList.toggle('selected', isSelected);
    el.style.borderColor = isSelected ? 'var(--gold)' : 'var(--border-ornate)';
    el.style.boxShadow = isSelected ? '0 4px 24px rgba(200,150,12,0.4)' : '0 4px 18px rgba(0,0,0,0.5)';
  });

  const confirmBtn = document.getElementById('confirmRound9ChoiceBtn');
  if (confirmBtn) {
    confirmBtn.disabled = selected.length !== 2;
    confirmBtn.textContent = `✔ Confirmer (${selected.length}/2)`;
  }
}

function confirmRound9Choice() {
  const modalEl = document.getElementById('round9ChoiceModal');
  bootstrap.Modal.getInstance(modalEl)?.hide();
  if (!_pendingRound9Choice) return;
  const { allCards, choiceCards, selected } = _pendingRound9Choice;
  _pendingRound9Choice = null;

  const keptCards = choiceCards.filter(c => selected.includes(c.cardDef.numero));
  const destroyedCards = choiceCards.filter(c => !selected.includes(c.cardDef.numero));

  // Ajouter les définitions des cartes gardées à ALL_CARDS si elles n'y sont pas déjà.
  // Elles sont également placées en défausse pour former la nouvelle pioche.
  keptCards.forEach(cardInstance => {
    if (!ALL_CARDS.find(c => c.numero === cardInstance.cardDef.numero)) {
      ALL_CARDS.push(cardInstance.cardDef);
    }
    gameState.discard.push(cardInstance);
  });
  if (!gameState.destroyed) gameState.destroyed = [];
  destroyedCards.forEach(card => {
    gameState.destroyed.push(card);
    addLog(`🔥 <span class="log-card">${getFaceData(card).nom}</span> (#${card.cardDef.numero}) a été détruite.`, true);
  });

  addLog(`📜 Choix de la manche 9 effectué.`, true);
  _finalizeNewRound(allCards, []);
  drawCards(4);
}

// ============================================================
//  MODAL NOUVELLES CARTES
// ============================================================

function _showNewCardsModal(discovered) {
  const typeColors = {
    Personne: '#2a4a7a', Terrain: '#1e4a1a', Bâtiment: '#5a4a3a',
    Ennemi: '#5a0a0a', Evènement: '#3a2a5a', Maritime: '#0a3a5a'
  };

  const cardsHTML = discovered.map(card => {
    const face = getFaceData(card);

    const resHTML = (face.ressources && face.ressources.length)
      ? face.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return types.map(t =>
            `<span class="resource-pip" style="font-size:0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;">${RESOURCE_ICONS[normalizeRes(t)] || t} ×${r.quantite}</span>`
          ).join('');
        }).join('')
      : `<span style="color:#666;font-size:0.65rem;font-style:italic;">Aucune production</span>`;

    const effets = face.effet ? (Array.isArray(face.effet) ? face.effet : [face.effet]) : [];
    const effectHTML = effets.map(e => {
      const ico = { Activable: '🟢', Passif: '🔵', Destruction: '🔴' }[e.type] || '⚡';
      return `<div style="font-size:0.65rem;color:#bbeebb;margin-top:3px;">${ico} ${e.type}${e.description ? ' — ' + e.description : ''}</div>`;
    }).join('');

    const promos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
    const promoHTML = promos.length
      ? `<div style="font-size:0.65rem;color:#f0c040;margin-top:5px;">▲ ${promos.length} promotion${promos.length > 1 ? 's' : ''}</div>`
      : '';

    const victoryValue = getVictoryValue(face.victoire);
    const victoryLabel = victoryValue !== null
      ? `${victoryValue > 0 ? '+' : ''}${victoryValue} Gloire`
      : getVictoryLabel(face.victoire) ? `${getVictoryLabel(face.victoire)} Gloire` : '';
    const fameHTML = victoryLabel
      ? `<div style="font-size:0.7rem;color:#f0c040;margin-top:4px;">★ ${victoryLabel}</div>`
      : '';

    const totalFaces = card.cardDef.faces.length;
    const facesHTML = totalFaces > 1
      ? `<div style="font-size:0.6rem;color:#888;margin-top:4px;">${totalFaces} faces au total</div>`
      : '';

    const bgType = typeColors[face.type] || '#3a3a3a';
    const isChoiceC = isChoiceCard(card.cardDef);

    return `<div
        onclick="showDiscoveredCardModal(${card.cardDef.numero})"
        onmouseover="this.style.borderColor='var(--gold)';this.style.boxShadow='0 4px 24px rgba(200,150,12,0.4)'"
        onmouseout="this.style.borderColor='var(--border-ornate)';this.style.boxShadow='0 4px 18px rgba(0,0,0,0.5)'"
        style="flex:1;min-width:170px;max-width:230px;background:linear-gradient(160deg,#1e160a,#120e06);border:2px solid var(--border-ornate);border-radius:10px;padding:18px 14px;text-align:center;box-shadow:0 4px 18px rgba(0,0,0,0.5);cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s;">
      <div style="font-size:0.58rem;color:#777;font-family:'Cinzel',serif;letter-spacing:1px;margin-bottom:6px;">#${card.cardDef.numero}</div>
      ${isChoiceC ? `<div style="display:inline-block;background:rgba(180,120,0,0.25);border:1px solid rgba(200,150,12,0.5);border-radius:8px;padding:2px 8px;font-family:'Cinzel',serif;font-size:0.5rem;color:#f0c040;letter-spacing:1px;margin-bottom:6px;">⚖️ Double identité</div>` : ''}
      <div style="font-size:2.6rem;margin-bottom:8px;">${getCardEmoji(face.type, face.nom)}</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.85rem;color:var(--gold-light);margin-bottom:6px;">${isChoiceC ? '⚖️ Identité à choisir' : face.nom}</div>
      <div style="display:inline-block;background:${bgType};border-radius:4px;padding:1px 10px;font-size:0.58rem;font-family:'Cinzel',serif;color:#fff;letter-spacing:1px;margin-bottom:12px;">${face.type}</div>
      <div style="margin-bottom:4px;">${resHTML}</div>
      ${fameHTML}${effectHTML}${promoHTML}${facesHTML}
      <div style="margin-top:10px;padding:4px 10px;background:rgba(200,150,12,0.1);border:1px solid rgba(200,150,12,0.25);border-radius:6px;font-family:'Cinzel',serif;font-size:0.54rem;color:var(--gold-light);letter-spacing:1px;">🔍 Examiner</div>
    </div>`;
  }).join('');

  const isPhase1 = !gameState._heritageTriggered;
  const introText = isPhase1
    ? `Ces deux cartes rejoignent votre royaume.<br><em style="font-size:0.85rem;color:#aaa;">Inspectez-les avant qu'elles soient mélangées dans la pioche.</em>`
    : `Deux nouvelles contrées s'ouvrent à vous.<br><em style="font-size:0.85rem;color:#aaa;">Ces cartes d'aventure enrichissent votre royaume.</em>`;

  document.getElementById('newCardsModalBody').innerHTML = `
    <p style="text-align:center;font-family:'Crimson Text',serif;font-size:0.95rem;
       color:#f5e6c8;margin-bottom:18px;line-height:1.5;">
      ${introText}
    </p>
    <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;">${cardsHTML}</div>`;

  new bootstrap.Modal(document.getElementById('newCardsModal')).show();
}

function confirmNewCards() {
  const modalEl = document.getElementById('newCardsModal');
  bootstrap.Modal.getInstance(modalEl)?.hide();
  if (!_pendingNewRound) return;
  const { allCards, discovered } = _pendingNewRound;
  _pendingNewRound = null;
  _drawLocked = true;
  setTimeout(() => { _drawLocked = false; }, 600);

  discovered.forEach(card => {
    const face = getFaceData(card);
    if (face.type === 'Ennemi' && face.nom === 'Bandit' && face.victoire !== undefined && face.victoire < 0) {
      gameState.fame = (gameState.fame || 0) + face.victoire;
      if (!gameState.banditMalus) gameState.banditMalus = {};
      gameState.banditMalus[card.cardDef.numero] = face.victoire;
      addLog(`💀 <span class="log-card">Bandit</span> découvert — Gloire ${face.victoire} (Total : ${gameState.fame})`, true);
    }
  });

  _finalizeNewRound(allCards, discovered);
  drawCards(4);
}

function _finalizeNewRound(allCards, discovered) {
  discovered.forEach(card => {
    allCards.push(card);
    addLog(`🔍 Découverte : <span class="log-card">${getFaceData(card).nom}</span> (#${card.cardDef.numero})`, true);

    // Fin de partie : dernière carte héritage dévoilée
    if (gameState._heritageTriggered) {
      const heritageNums = _getHeritageCardNums();
      if (heritageNums.has(card.cardDef.numero)) {
        const kingdomNums = new Set(allCards.map(c => c.cardDef.numero));
        const allCovered = [...heritageNums].every(n => kingdomNums.has(n));
        if (allCovered) {
          gameState.gameOver = true;
          addLog(`🏆 Dernière carte Héritage révélée (#${card.cardDef.numero}) — Dernière Manche !`, true);
        }
      }
    }
  });
  if (!discovered.length) addLog(`📦 Toutes les cartes ont été découvertes.`);

  const deckSource = [...allCards, ...gameState.discard];
  deckSource.forEach(c => { cardStateMap[c.cardDef.numero] = c.currentFace; });
  let newDeck = deckSource.map(c => createCardInstance(c.cardDef));
  shuffleDeck(newDeck);

  gameState.deck = newDeck;
  gameState.discard = [];
  gameState.turn = 1; gameState.round++; gameState.turnStarted = false;
  addLog(`🔄 Manche ${gameState.round} commence ! Pioche : ${newDeck.length} cartes.`, true);
  updateUI();
  if (typeof saveRoundSnapshot === 'function') saveRoundSnapshot();
}

function discoverNextCards(n) {
  const out = [];
  for (let i = 0; i < n && gameState.nextDiscoverIndex < gameState.box.length; i++) {
    const item = gameState.box[gameState.nextDiscoverIndex++];
    out.push(item && item.cardDef ? item : createCardInstance(item));
  }
  return out;
}

// ============================================================
//  HELPERS FIN DE PARTIE HÉRITAGE
// ============================================================

// Retourne l'ensemble des numéros de cartes qui constituent la voie héritage.
// = toutes les cartes de LEGACY_CARDS ayant des faces (cartes jouables : 24-27, 28, 29…)
// La carte 23 est une règle sans faces jouables — elle n'est pas comptée.
function _getHeritageCardNums() {
  const nums = new Set();
  if (typeof LEGACY_CARDS === 'undefined') return nums;
  LEGACY_CARDS.forEach(c => {
    if (c.faces && c.faces.length > 0) nums.add(c.numero);
  });
  return nums;
}

// Vérifie si toutes les cartes héritage jouables sont présentes dans le royaume
// (deck + play + discard + permanent + stayInPlay + retainedCards + staging + destroyed)
function _allHeritageCardsRevealed(heritageNums) {
  const everywhere = new Set([
    ...gameState.deck,
    ...gameState.play,
    ...gameState.discard,
    ...gameState.permanent,
    ...(gameState.stayInPlay || []),
    ...(gameState.retainedCards || []),
    ...(gameState.staging || []).map(e => e.cardInstance),
    ...(gameState.destroyed || []),
  ].map(ci => ci.cardDef.numero));
  return [...heritageNums].every(n => everywhere.has(n));
}

// ============================================================
//  INJECTION CARTES HÉRITAGE DANS LA PIOCHE (appelé depuis game-heritage.js)
// ============================================================

// Injecte les cartes héritage jouables (28, 29, …) dans la pioche existante
// après les avoir mélangées avec les cartes déjà présentes.
// Appelé par _continueNewRoundAfterHeritage() dans game-heritage.js.
function _injectHeritageCardsIntoDeck(allCards) {
  // Cartes héritage jouables = celles qui ont des faces dans LEGACY_CARDS
  // (hors cartes déjà dans le royaume)
  const alreadyKnown = new Set([
    ...gameState.deck, ...gameState.play, ...gameState.discard,
    ...(gameState.stayInPlay || []), ...(gameState.retainedCards || []),
    ...gameState.permanent, ...(gameState.destroyed || []),
  ].map(ci => ci.cardDef.numero));

  const toInject = [];
  if (typeof LEGACY_CARDS !== 'undefined') {
    LEGACY_CARDS.forEach(cardData => {
      if (!cardData.faces || cardData.faces.length === 0) return; // carte règle sans faces
      if (alreadyKnown.has(cardData.numero)) return;             // déjà dans le royaume

      // Exclure les cartes de choix de la manche 9, qui ont un mécanisme d'introduction spécial.
      const round9ChoiceCards = [31, 32, 33, 34];
      if (round9ChoiceCards.includes(cardData.numero)) return;

      // S'assurer que la carte est dans ALL_CARDS pour les résolutions ultérieures
      if (!ALL_CARDS.find(c => c.numero === cardData.numero)) {
        // Construire un cardDef minimal compatible avec getFaceData
        const cardDef = {
          numero: cardData.numero,
          nom: cardData.nom || `Carte #${cardData.numero}`,
          type: cardData.type || 'Evènement',
          faces: cardData.faces,
        };
        ALL_CARDS.push(cardDef);
        cardStateMap[cardData.numero] = 1;
        toInject.push(createCardInstance(cardDef));
      } else {
        const existing = ALL_CARDS.find(c => c.numero === cardData.numero);
        toInject.push(createCardInstance(existing));
      }
    });
  }

  if (toInject.length === 0) return;

  // Mélanger les cartes à injecter avec le deck existant (allCards = futur deck)
  toInject.forEach(ci => {
    allCards.push(ci);
    addLog(`📜 <span class="log-card">${getFaceData(ci).nom}</span> (#${ci.cardDef.numero}) — rejoint la pioche (Héritage) !`, true);
  });
  addLog(`📜 ${toInject.length} carte${toInject.length > 1 ? 's' : ''} Héritage mélangée${toInject.length > 1 ? 's' : ''} dans la pioche.`, true);
}