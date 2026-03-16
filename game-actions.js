let _drawLocked = false;

// ============================================================
//  RETOUR ARRIÈRE — snapshot avant tirage
// ============================================================
let _drawSnapshot = null;

function _saveDrawSnapshot() {
  const serializeCI = ci => ({ cardDef: ci.cardDef, currentFace: ci.currentFace });
  _drawSnapshot = {
    deck:      gameState.deck.map(serializeCI),
    play:      gameState.play.map(serializeCI),
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
  const existingNums = new Set(gameState.play.map(ci => ci.cardDef.numero));
  window._dealExistingNums = existingNums;

  // Règle : les cartes normales sont placées EN PREMIER, les bandits EN DERNIER.
  // Si une carte or fait partie du même tirage que le bandit, elle est bloquée
  // automatiquement et prioritairement — sans modal de choix.
  const _banditQueue = [];
  const _banditsToPlace = [];
  const newCardNums = new Set(); // numéros des cartes tirées dans CE tirage

  for (let i = 0; i < toDraw; i++) {
    const card = gameState.deck.shift();
    if (!isBandit(card)) {
      newCardNums.add(card.cardDef.numero);
      gameState.play.push(card);
    } else {
      _banditsToPlace.push(card);
    }
  }

  _banditsToPlace.forEach(card => {
    const banditNum = card.cardDef.numero;
    const allGold = gameState.play
      .filter(c => !isBandit(c) && producesGold(c) &&
                   !gameState.bandits.some(b => b.blockedNum === c.cardDef.numero));

    // Cartes or tirées dans CE tirage → blocage automatique prioritaire
    const newGold = allGold.filter(c => newCardNums.has(c.cardDef.numero));
    // Cartes or déjà en jeu avant ce tirage → choix seulement si aucune nouvelle carte or
    const oldGold = allGold.filter(c => !newCardNums.has(c.cardDef.numero));

    gameState.bandits.push({ banditNum, blockedNum: null, pendingChoice: true });

    /*if (newGold.length > 0) {
      // Bloquer automatiquement la (première) carte or du même tirage
      _banditQueue.push({ banditNum, goldCards: newGold, autoBlock: newGold[0] });
    } else {
      // Pas de nouvelle carte or → comportement classique sur les anciennes
      _banditQueue.push({ banditNum, goldCards: oldGold });
    }*/
      _banditQueue.push({ banditNum, goldCards: newGold });
    gameState.play.push(card);
  });

  addLog(`📜 Vous jouez ${toDraw} carte${toDraw > 1 ? 's' : ''}.`);
  processPendingFaceChoices();
  updateUI();
  window._dealExistingNums = null;

  // Masquer les nouvelles cartes pour l'animation
  const playAreaHide = document.getElementById('playArea');
  if (playAreaHide) {
    Array.from(playAreaHide.querySelectorAll('.card-wrapper[data-card-num]'))
      .filter(w => !existingNums.has(parseInt(w.dataset.cardNum)))
      .forEach(w => { const c = w.querySelector('.card'); if (c) c.style.visibility = 'hidden'; });
  }

  requestAnimationFrame(() => {
    applyDealAnimations(existingNums, deckRect);
    // Résoudre les bandits après la fin des animations
    if (!pendingFaceChoice && _banditQueue.length > 0) {
      const animDelay = (toDraw - 1) * 220 + 1100;
      setTimeout(() => _resolveBanditQueue(_banditQueue), animDelay);
    }
  });
}

function applyDealAnimations(existingNums, deckRect) {
  const playArea = document.getElementById('playArea');
  if (!playArea) return;

  const newWrappers = Array.from(playArea.querySelectorAll('.card-wrapper[data-card-num]'))
    .filter(w => !existingNums.has(parseInt(w.dataset.cardNum)));

  newWrappers.forEach((wrapper, i) => {
    const cardEl = wrapper.querySelector('.card');
    if (!cardEl) return;

    let dx = -320, dy = -200, rot = -22;
    if (deckRect) {
      const cardRect = cardEl.getBoundingClientRect();
      const cardCx = cardRect.left + cardRect.width  / 2;
      const cardCy = cardRect.top  + cardRect.height / 2;
      const deckCx = deckRect.left + deckRect.width  / 2;
      const deckCy = deckRect.top  + deckRect.height / 2;
      dx = deckCx - cardCx;
      dy = deckCy - cardCy;
      rot = -20 - (i * 4);
    }

    // Rendre visible et lancer l'animation
    cardEl.style.visibility = 'visible';
    cardEl.style.setProperty('--deal-dx',  `${dx}px`);
    cardEl.style.setProperty('--deal-dy',  `${dy}px`);
    cardEl.style.setProperty('--deal-rot', `${rot}deg`);
    cardEl.style.animationDelay    = `${i * 220}ms`;
    cardEl.style.animationDuration = '1s';

    cardEl.classList.remove('card-enter');
    void cardEl.offsetWidth;
    cardEl.classList.add('card-enter');

    // Retirer card-enter après la fin de l'animation pour libérer le hover
    const totalDuration = (i * 220 + 1000) + 50; // delay + duration + marge
    setTimeout(() => {
      cardEl.classList.remove('card-enter');
      cardEl.style.animationDelay    = '';
      cardEl.style.animationDuration = '';
    }, totalDuration);
  });
}

function clearResources() {
  gameState.resources = { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 };
}

function isStayInPlay(faceData) {
  if (!faceData.effet) return false;
  const effets = Array.isArray(faceData.effet) ? faceData.effet : [faceData.effet];
  return effets.some(e => e.type === 'Passif' && e.description === 'Reste en jeu');
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

  let html = `<p style="margin-bottom:14px;font-family:'Crimson Text',serif;font-size:1rem;">
    Cette carte a <strong>deux identités possibles</strong>. Choisissez celle qu'elle sera
    <em>définitivement</em> pour le reste de la partie.
  </p>
  <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">`;

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

    const typeColors = { Personne:'#3a5a8a', Terrain:'#2d5a27', Bâtiment:'#7a6a5a', Ennemi:'#6a0a0a' };
    const bgColor = typeColors[f.type] || '#444';

    html += `
      <button onclick="confirmFaceChoice(${playIndex}, ${f.face})" class="face-choice-btn">
        <div class="face-choice-emoji">${getCardEmoji(f.type, f.nom)}</div>
        <div class="face-choice-type" style="background:${bgColor};">${f.type}</div>
        <div class="face-choice-name">${f.nom}</div>
        ${resHTML ? `<div class="face-choice-res">⚒ ${resHTML}</div>` : ''}
        ${hasEffect ? `<div class="face-choice-effect">${effectLabel === 'Activable' ? '🟢' : effectLabel === 'Passif' ? '🔵' : '⚡'} Effet ${effectLabel}</div>` : ''}
        ${f.victoire ? `<div class="face-choice-fame">★ ${f.victoire} Gloire</div>` : ''}
      </button>`;
  });

  html += `</div>`;
  html += `<p style="margin-top:14px;font-size:0.78rem;color:#aa8866;font-style:italic;text-align:center;">
    ⚠️ Ce choix est permanent et ne pourra pas être modifié.</p>`;

  $('#faceChoiceCardName').text(`#${ci.cardDef.numero} — Choisissez une identité`);
  $('#faceChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('faceChoiceModal')).show();
}

function confirmFaceChoice(playIndex, chosenFace) {
  bootstrap.Modal.getInstance(document.getElementById('faceChoiceModal'))?.hide();

  const ci = gameState.play[playIndex];
  if (!ci) return;

  // Appliquer le choix de manière définitive
  ci.currentFace = chosenFace;
  cardStateMap[ci.cardDef.numero] = chosenFace;
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

// Vérifie si une carte a un effet Activable et si son coût est payable
function hasActivableEffect(cardInstance) {
  const fd = getFaceData(cardInstance);
  if (!fd.effet) return false;
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  return effets.some(e => e.type === 'Activable');
}

function canActivateEffect(cardInstance) {
  const fd = getFaceData(cardInstance);
  if (!fd.effet) return false;
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  const act = effets.find(e => e.type === 'Activable');
  if (!act) return false;
  const projected = getProjectedResources();
  const costOk = (act.cout || []).every(c => (projected[normalizeRes(c.type)] || 0) >= c.quantite);
  if (!costOk) return false;
  // Si l'effet nécessite un sacrifice, vérifier qu'une autre carte est disponible en jeu
  if (act.defausse) {
    const playIdx = gameState.play.indexOf(cardInstance);
    const allies = gameState.play.filter((ci, i) => i !== playIdx && getFaceData(ci).type !== 'Ennemi');
    if (allies.length === 0) return false;
  }
  // Si l'effet nécessite un Terrain, vérifier qu'il y en a au moins un en jeu
  const hasTerrainRes = (act.ressources || []).some(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.some(t => t === 'Terrain');
  });
  if (hasTerrainRes) {
    const playIdx = gameState.play.indexOf(cardInstance);
    const terrains = gameState.play.filter((ci, i) => i !== playIdx && getFaceData(ci).type === 'Terrain');
    if (terrains.length === 0) return false;
  }
  // Si l'effet est une conversion, vérifier qu'un Bandit est en jeu
  if (act.conversion) {
    const bandits = gameState.play.filter(ci => getFaceData(ci).type === 'Ennemi' && getFaceData(ci).nom === 'Bandit');
    if (bandits.length === 0) return false;
  }
  return true;
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

  const projected = getProjectedResources();
  for (const c of (act.cout || [])) {
    if ((projected[normalizeRes(c.type)] || 0) < c.quantite) {
      addLog(`💰 Ressources insuffisantes pour activer <span class="log-card">${fd.nom}</span>. Coût: ${formatCost(act.cout)}`);
      return;
    }
  }

  // Effet de conversion (Missionnaire) : choisir un Bandit en jeu
  if (act.conversion) {
    const bandits = gameState.play.filter(ci => getFaceData(ci).type === 'Ennemi' && getFaceData(ci).nom === 'Bandit');
    if (bandits.length === 0) {
      addLog(`❌ Aucun Bandit en jeu pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showConversionModal(playIndex, act, bandits);
    return;
  }

  // Effet avec défausse alliée : ouvre un modal pour choisir la carte à défausser
  if (act.defausse) {
    const candidates = gameState.play.filter((ci, i) => i !== playIndex && getFaceData(ci).type !== 'Ennemi');
    if (candidates.length === 0) {
      addLog(`❌ Aucune carte alliée disponible à défausser pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showSacrificeModal(playIndex, act, candidates);
    return;
  }

  // Effet Exploitant : ressources de type "Terrain" → choisir un Terrain en jeu
  const hasTerrainResource = (act.ressources || []).some(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.some(t => t === 'Terrain');
  });
  if (hasTerrainResource) {
    const terrains = gameState.play.filter((ci, i) => i !== playIndex && getFaceData(ci).type === 'Terrain' && !isBlockedByBandit(i));
    if (terrains.length === 0) {
      addLog(`❌ Aucun Terrain en jeu pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showTerrainChoiceModal(playIndex, act, terrains);
    return;
  }

  // Effet Domestique : ressources au choix parmi plusieurs types (ex: [Or, Bois, Pierre])
  const hasMultiTypeResource = (act.ressources || []).some(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.length > 1;
  });
  if (hasMultiTypeResource) {
    showResourceChoiceModal(playIndex, act);
    return;
  }

  // Effet avec cartes : afficher la carte obtenue puis défausser la source et l'ajouter en défausse
  if (act.cartes && act.cartes.length > 0) {
    _doActivateWithCards(playIndex, act);
    return;
  }

  _doStageActivate(playIndex, act);
}

// Activation d'un effet qui ajoute une carte (ex: Chapelle → Cathédrale #103)
function _doActivateWithCards(playIndex, act) {
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);

  // Débiter le coût immédiatement
  for (const c of (act.cout || [])) {
    const key = normalizeRes(c.type);
    gameState.resources[key] = (gameState.resources[key] || 0) - c.quantite;
  }

  // Trouver la/les cartes à obtenir dans ALL_CARDS ou CARDS_TO_DISCOVER
  const allPool = [
    ...ALL_CARDS,
    ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : [])
  ];
  const targetCards = act.cartes.map(num => allPool.find(c => c.numero === num)).filter(Boolean);

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
          return types.map(t => `<span class="resource-pip">${RESOURCE_ICONS[normalizeRes(t)] || t} ×${r.quantite}</span>`).join('');
        }).join('')
      : '';
    const fameHTML = face.victoire ? `<div style="font-size:0.8rem;color:#f0c040;margin-top:6px;">★ +${face.victoire} Gloire</div>` : '';
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
  bootstrap.Modal.getInstance(document.getElementById('cardGrantModal'))?.hide();
  const { playIndex, cardInstance, targetCards } = window._pendingCardGrant || {};
  window._pendingCardGrant = null;
  if (!cardInstance) return;

  const fd = getFaceData(cardInstance);

  // Retirer la carte source du jeu et la mettre en défausse
  _playRemove(_playIdxByNum(cardInstance.cardDef.numero));
  gameState.discard.push(cardInstance);

  // Créer les nouvelles instances et les ajouter en défausse
  targetCards.forEach(cardDef => {
    const newInst = createCardInstance(cardDef);
    gameState.discard.push(newInst);
    addLog(`⛪ <span class="log-card">${fd.nom}</span> — <span class="log-card">${getFaceData(newInst).nom}</span> (#${cardDef.numero}) rejoint la défausse !`, true);
  });

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
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();
  window._pendingSacrificePlayIndex = null;
  window._pendingSacrificeAct = null;
}

function confirmSacrifice(plainesPlayIndex, sacrificePlayIndex) {
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();

  const act = window._pendingSacrificeAct;
  window._pendingSacrificePlayIndex = null;
  window._pendingSacrificeAct = null;

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

  const plainesName = getFaceData(plainesCard).nom;
  const resStr = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`).join(' ');

  gameState.staging.push({
    cardInstance: plainesCard,
    action: 'activate',
    resourcesGained,
    fameGained: 0,
    newFace: null,
    cout: act.cout || [],
    sacrificeCardInstance: sacrificeCard   // stocké ici, défaussé à la confirmation
  });

  addLog(`🟢 <span class="log-card">${plainesName}</span> + <span class="log-card">${sacrificeName}</span> — en attente de confirmation (${resStr}).`);
  updateUI();
}

// ── EXPLOITANT : choisir un Terrain en jeu pour copier sa production ──
function showTerrainChoiceModal(playIndex, act, terrains) {
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);

  let html = `<p style="margin-bottom:12px;">Choisissez un <strong>Terrain</strong> dont vous voulez copier la production :</p>`;
  terrains.forEach(ci => {
    const f = getFaceData(ci);
    const actualIdx = gameState.play.indexOf(ci);
    const emoji = getCardEmoji(f.type, f.nom);
    const resInfo = (f.ressources || []).length
      ? f.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return `+${r.quantite}${RESOURCE_ICONS[normalizeRes(types[0])] || types[0]}`;
        }).join(' ')
      : '(aucune production)';
    html += `<button onclick="confirmTerrainChoice(${playIndex}, ${actualIdx})" class="sacrifice-choice-btn">
      <span class="sacrifice-emoji">${emoji}</span>
      <span class="sacrifice-info">
        <strong>${f.nom}</strong>
        <span class="sacrifice-type">${f.type}</span>
        <span class="sacrifice-res">${resInfo}</span>
      </span>
    </button>`;
  });

  window._pendingTerrainPlayIndex = playIndex;
  window._pendingTerrainAct = act;
  $('#terrainChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('terrainChoiceModal')).show();
}

function confirmTerrainChoice(exploitantPlayIndex, terrainPlayIndex) {
  bootstrap.Modal.getInstance(document.getElementById('terrainChoiceModal'))?.hide();
  window._pendingTerrainPlayIndex = null;
  window._pendingTerrainAct = null;

  const exploitantCard = gameState.play[exploitantPlayIndex];
  const terrainCard    = gameState.play[terrainPlayIndex];
  const terrainFace    = getFaceData(terrainCard);
  const exploitantName = getFaceData(exploitantCard).nom;

  // Copier la production réelle du terrain (pas ses effets)
  const resourcesGained = {};
  (terrainFace.ressources || []).forEach(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    const key = normalizeRes(types[0]);
    if (key) resourcesGained[key] = (resourcesGained[key] || 0) + r.quantite;
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
    terrainName: terrainFace.nom
  });

  addLog(`🟢 <span class="log-card">${exploitantName}</span> exploite <span class="log-card">${terrainFace.nom}</span> — ${resStr} en attente.`);
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
    html += `<button onclick="confirmResourceChoice(${playIndex}, ${i})" class="bandit-reward-btn" style="min-width:80px;font-size:1rem;">
      ${icon}<br><span style="font-size:0.65rem;">${c.type}</span>
    </button>`;
  });
  html += '</div>';

  window._pendingResourceChoices = choices;
  window._pendingResourcePlayIndex = playIndex;
  window._pendingResourceAct = act;
  $('#resourceChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('resourceChoiceModal')).show();
}

function confirmResourceChoice(playIndex, choiceIdx) {
  bootstrap.Modal.getInstance(document.getElementById('resourceChoiceModal'))?.hide();
  const choices = window._pendingResourceChoices || [];
  const act     = window._pendingResourceAct;
  window._pendingResourceChoices   = null;
  window._pendingResourcePlayIndex = null;
  window._pendingResourceAct       = null;

  const chosen = choices[choiceIdx];
  if (!chosen) return;

  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);
  const key = normalizeRes(chosen.type);
  const resourcesGained = { [key]: chosen.quantite };

  _playRemove(playIndex);
  const resStr = `+${chosen.quantite}${RESOURCE_ICONS[key]||chosen.type}`;

  gameState.staging.push({
    cardInstance,
    action: 'activate',
    resourcesGained,
    fameGained: 0,
    newFace: null,
    cout: act.cout || []
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
  if (playIndex < 0) return;
  const cardInstance = gameState.play[playIndex];
  const fd = getFaceData(cardInstance);
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  const destr = effets.find(e => e.type === 'Destruction');
  if (!destr) return;

  const targetNums = destr.cartes;

  // Retirer la carte du jeu (sacrifiée → détruite)
  _playRemove(playIndex);
  if (!gameState.destroyed) gameState.destroyed = [];
  gameState.destroyed.push(cardInstance);
  addLog(`💥 <span class="log-card">${fd.nom}</span> — sacrifiée !`, true);

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
      return types.map(t => `<span class="resource-pip">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
    }).join('');
    const fameHTML = face.victoire ? `<div style="font-size:0.7rem;color:#f0c040;margin-top:4px;">★ ${face.victoire} Gloire</div>` : '';
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
  bootstrap.Modal.getInstance(document.getElementById('discoverByEffectModal'))?.hide();
  const candidates = window._discoverByEffectCandidates || [];
  window._discoverByEffectCandidates = null;
  if (candidates[idx]) _discoverByEffect(candidates[idx]);
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
  document.getElementById('convFrontEmoji').textContent  = getCardEmoji(face1.type, face1.nom);
  document.getElementById('convFrontName').textContent   = face1.nom;
  document.getElementById('convFrontDesc').textContent   = face1.description || '';

  // Remplir la face arrière (nouvelle identité)
  const face2Data = face2 || { nom: '?', type: 'Personne', description: '' };
  document.getElementById('convBackSerial').textContent  = `#${banditCard.cardDef.numero}`;
  document.getElementById('convBackEmoji').textContent   = getCardEmoji(face2Data.type, face2Data.nom);
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
  window._pendingConversion = { missionairePlayIndex, act };

  let html = `<p style="margin-bottom:12px;">
    Choisissez un <strong>Bandit</strong> à convertir :<br>
    <small style="color:#aaa;">Il sera promu en face 2, puis défaussé avec le Missionnaire.</small>
  </p><div style="display:flex;flex-direction:column;gap:8px;">`;

  bandits.forEach(ci => {
    const f = getFaceData(ci);
    const face2 = ci.cardDef.faces.find(f2 => f2.face === 2);
    const face2Name = face2 ? face2.nom : '?';
    const actualIdx = gameState.play.indexOf(ci);
    html += `<button onclick="confirmConversion(${actualIdx})" class="sacrifice-choice-btn">
      <span class="sacrifice-emoji">✝️</span>
      <span class="sacrifice-info">
        <strong>${f.nom}</strong> #${ci.cardDef.numero}
        <span class="sacrifice-type" style="color:#aaa;">→ devient <strong style="color:#f0c040;">${face2Name}</strong></span>
      </span>
    </button>`;
  });

  html += `</div>`;
  $('#sacrificeChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('sacrificeChoiceModal')).show();
}

function confirmConversion(banditPlayIndex) {
  bootstrap.Modal.getInstance(document.getElementById('sacrificeChoiceModal'))?.hide();

  const { missionairePlayIndex, act } = window._pendingConversion || {};
  window._pendingConversion = null;

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