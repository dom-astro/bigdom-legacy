// ============================================================
//  CONFIRMER LE TOUR : applique toutes les actions du staging
// ============================================================
function confirmTurn() {
  _drawSnapshot = null;
  if (gameState.staging.length === 0) { endTurn(); return; }

  const hasUpgrade = gameState.staging.some(e => e.action === 'upgrade');

  gameState.staging.forEach(entry => {
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
      gameState.discard.push(cardInstance);
      if (isStayInPlay(newFaceData)) {
        addLog(`🔼 <span class="log-card">${oldName}</span> → <span class="log-card">${newFaceData.nom}</span> — promue et défaussée !`, true);
      } else {
        addLog(`🔼 <span class="log-card">${oldName}</span> → <span class="log-card">${newFaceData.nom}</span> — promue !`, true);
      }
    }
  });

  gameState.staging = [];

  if (hasUpgrade) {
    addLog('— Tour terminé par promotion —');
    endTurn();
  } else {
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
  gameState.staging.forEach(entry => gameState.play.push(entry.cardInstance));
  gameState.staging = [];

  [...gameState.play].forEach(c => {
    if (isStayInPlay(getFaceData(c))) {
      if (!gameState.permanent.find(p => p.cardDef.numero === c.cardDef.numero))
        gameState.permanent.push(c);
    } else {
      gameState.discard.push(c);
    }
  });
  gameState.play = [];

  gameState.bandits = [];
  gameState.armeeCaseCeTour  = false;
  gameState.tresorCaseCeTour = false;
  gameState.exportCaseCeTour = false;
  clearResources();
  gameState.turnStarted = false;
  gameState.turn++;
  addLog(`— Fin du Tour ${gameState.turn - 1} —`);
  if (gameState.deck.length === 0) {
    addLog(`🔚 Pioche vide. Fin de la Manche ${gameState.round}. Cliquez "Nouvelle Manche".`, true);
  } else {
    drawCards(4);
  }
  updateUI();
}

// Données en attente pendant l'inspection des nouvelles cartes
// (utilisé conjointement avec _showNewCardsModal / confirmNewCards et game-heritage.js)
let _pendingNewRound = null;

// ──────────────────────────────────────────────────────────────────────────────
//  NOTE : Les systèmes Héritage (cartes 23-27), Armée (carte 25) et Rétention
//  (cartes 82-83) sont gérés dans game-heritage.js.
// ──────────────────────────────────────────────────────────────────────────────

function newRound() {
  gameState.staging.forEach(e => gameState.play.push(e.cardInstance));
  gameState.staging = [];
  gameState.bandits = [];
  gameState.armeeCaseCeTour  = false;
  gameState.tresorCaseCeTour = false;
  gameState.exportCaseCeTour = false;

  // ── Rétention (cartes 82/83) ─────────────────────────────────────────────
  const retainedCards = gameState.retainedCards || [];
  if (retainedCards.length > 0) {
    addLog(`🕊️ ${retainedCards.map(ci => `<span class="log-card">${getFaceData(ci).nom}</span>`).join(', ')} — défaussée${retainedCards.length > 1 ? 's' : ''} en fin de manche.`, true);
  }
  gameState.retained = [];
  gameState.retainedCards = [];

  gameState.play.forEach(c => gameState.discard.push(c));
  gameState.play = [];

  // ── Cartes "Reste en jeu" (Muraille, etc.) ──────────────────────────────
  const sipCards = gameState.stayInPlay || [];
  gameState.stayInPlay = [];

  // Séparer permanentes normales / Héritage (level-1)
  const heritagePerms = gameState.permanent.filter(ci => ci.cardDef._level1);
  const normalPerms   = gameState.permanent.filter(ci => !ci.cardDef._level1);

  const allCards = [...gameState.deck, ...gameState.discard, ...normalPerms, ...sipCards, ...retainedCards];
  if (sipCards.length > 0) {
    addLog(`🏚️ ${sipCards.map(c => `<span class="log-card">${getFaceData(c).nom}</span>`).join(', ')} — remélangée${sipCards.length > 1 ? 's' : ''} dans la pioche.`);
  }
  gameState.permanent = [...heritagePerms];
  gameState.discard = []; gameState.deck = [];
  clearResources();
  updateUI();

  // ── HÉRITAGE : se déclenche à la fin de la manche 7 ─────────────────────
  if (gameState.round === 7 && !gameState._heritageTriggered) {
    gameState._heritageTriggered = true;

    const alreadyInBox = new Set(gameState.box.map(c => c.cardDef ? c.cardDef.numero : c.numero));
    const phase2 = (typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : [])
      .filter(c => !alreadyInBox.has(c.numero))
      .sort((a, b) => a.numero - b.numero)
      .map(card => createCardInstance(card));
    if (phase2.length > 0) {
      gameState.box = [...gameState.box, ...phase2];
      addLog(`📦 Nouvelles terres à explorer — ${phase2.length} cartes d'aventure débloquées.`, true);
    }

    addLog(`📜 La manche 7 s'achève. La voie de l'Héritage s'ouvre...`, true);
    _showHeritageRuleModal(allCards); // défini dans game-heritage.js
    return;
  }

  const discovered = discoverNextCards(2);

  if (discovered.length === 0) {
    addLog(`📦 Toutes les cartes ont été découvertes.`);
    _finalizeNewRound(allCards, []);
    drawCards(4);
    return;
  }

  _pendingNewRound = { allCards, discovered };
  _showNewCardsModal(discovered);
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
            `<span class="resource-pip">${RESOURCE_ICONS[normalizeRes(t)] || t} ×${r.quantite}</span>`
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

    const fameHTML = (face.victoire !== undefined && face.victoire !== 0)
      ? `<div style="font-size:0.7rem;color:#f0c040;margin-top:4px;">★ ${face.victoire > 0 ? '+' : ''}${face.victoire} Gloire</div>`
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
    if (card.cardDef.numero === 70) { gameState.gameOver = true; addLog(`🏆 Carte #70 ! Dernière Manche !`, true); }
  });
  if (!discovered.length) addLog(`📦 Toutes les cartes ont été découvertes.`);

  allCards.forEach(c => { cardStateMap[c.cardDef.numero] = c.currentFace; });
  let newDeck = allCards.map(c => createCardInstance(c.cardDef));
  shuffleDeck(newDeck);

  gameState.deck = newDeck;
  gameState.turn = 1; gameState.round++; gameState.turnStarted = false;
  addLog(`🔄 Manche ${gameState.round} commence ! Pioche : ${newDeck.length} cartes.`, true);
  updateUI();
}

function discoverNextCards(n) {
  const out = [];
  for (let i = 0; i < n && gameState.nextDiscoverIndex < gameState.box.length; i++) {
    const item = gameState.box[gameState.nextDiscoverIndex++];
    out.push(item && item.cardDef ? item : createCardInstance(item));
  }
  return out;
}