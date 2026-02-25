// ============================================================
//  CARD DATA from JSON files
// ============================================================

let ALL_CARDS = BEGIN_CARDS;

// ============================================================
//  GAME STATE
// ============================================================
const RESOURCE_ICONS = { Or:'🪙', Bois:'🪵', Pierre:'🪨', Métal:'⚙️', Epée:'⚔️', Troc:'🛒' };
const TYPE_ICONS = { Terrain:'🌿', Bâtiment:'🏰', Personne:'👤', Evènement:'🎉', Ennemi:'💀', Maritime:'⚓' };

// cardStateMap conserve la face actuelle de chaque carte entre les manches
let cardStateMap = {};
// choiceNeeded : set des numéros de cartes dont la face doit être choisie au 1er jeu
// Une carte nécessite un choix si : elle a exactement 2 faces ET la face 1 n'a pas de promotion
// (ce sont des alternatives, pas des étapes d'upgrade)
let choiceNeeded = new Set();

let gameState = {
  deck: [],
  play: [],       // cartes en zone de jeu active
  staging: [],    // zone temporaire : actions en attente de confirmation
                  // { cardInstance, action:'produce'|'upgrade', resourcesGained, fameGained, newFace, cout }
  discard: [],
  permanent: [],
  box: [],
  nextDiscoverIndex: 0,
  resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 },
  fame: 0,
  round: 1,
  turn: 1,
  turnStarted: false,
  gameOver: false,
  // Bandits actifs : { banditPlayIndex, blockedPlayIndex|null }
  // blockedPlayIndex = null si aucune carte Or disponible au moment du jeu
  bandits: [],
};

function initGame() {
  cardStateMap = {};
  choiceNeeded = new Set();
  const startCards = ALL_CARDS.filter(c => c.numero >= 1 && c.numero <= 10);
  const boxCards = ALL_CARDS.filter(c => c.numero > 10).sort((a, b) => a.numero - b.numero);
  ALL_CARDS.forEach(c => {
    cardStateMap[c.numero] = 1;
    if (isChoiceCard(c)) choiceNeeded.add(c.numero);
  });

  let deck = startCards.map(card => createCardInstance(card));
  shuffleDeck(deck);

  gameState = {
    deck, play: [], staging: [], discard: [], permanent: [],
    box: boxCards, nextDiscoverIndex: 0,
    resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 },
    fame: 0, round: 1, turn: 1, turnStarted: false, gameOver: false,
    bandits: [],
  };

  updateUI();
  addLog('⚜ Que votre royaume prospère ! La partie commence.', true);
  addLog(`📦 ${gameState.deck.length} cartes en main | ${gameState.box.length} cartes à découvrir.`);
}

function createCardInstance(cardDef) {
  return { cardDef, currentFace: cardStateMap[cardDef.numero] || 1 };
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// ============================================================
//  PIOCHE
// ============================================================
function drawCards(n) {
  if (gameState.deck.length === 0) { addLog('La pioche est vide !'); return; }
  if (gameState.turnStarted && gameState.staging.length === 0) clearResources();
  gameState.turnStarted = true;
  const toDraw = Math.min(n, gameState.deck.length);
  for (let i = 0; i < toDraw; i++) gameState.play.push(gameState.deck.shift());
  addLog(`📜 Vous jouez ${toDraw} carte${toDraw > 1 ? 's' : ''}.`);
  // Choix de face en premier (bloquant), puis bandits
  processPendingFaceChoices();
  if (!pendingFaceChoice) processPendingBandits();
  updateUI();
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

// Est-ce un Bandit (carte Ennemi de nom "Bandit") ?
function isBandit(cardInstance) {
  const fd = getFaceData(cardInstance);
  return fd.type === 'Ennemi' && fd.nom === 'Bandit';
}

// Est-ce que cette carte en jeu est actuellement bloquée par un bandit ?
function isBlockedByBandit(playIndex) {
  return gameState.bandits.some(b => b.blockedPlayIndex === playIndex);
}

// Après chaque pioche, cherche les bandits non encore assignés et ouvre le modal de choix
function processPendingBandits() {
  gameState.play.forEach((ci, idx) => {
    if (!isBandit(ci)) return;
    // Ce bandit a-t-il déjà une entrée dans bandits[] ?
    const existing = gameState.bandits.find(b => b.banditPlayIndex === idx);
    if (!existing) {
      // Nouveau bandit : chercher des cartes amies qui produisent de l'Or (dans play[], hors bandits)
      const goldCards = gameState.play
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) => i !== idx && !isBandit(c) && producesGold(c) && !isBlockedByBandit(i));

      if (goldCards.length === 0) {
        // Aucune cible : effet ignoré
        gameState.bandits.push({ banditPlayIndex: idx, blockedPlayIndex: null });
        addLog(`🗡️ <span class="log-card">Bandit</span> joué — aucune carte à bloquer.`);
      } else if (goldCards.length === 1) {
        // Une seule cible : bloquer automatiquement
        const target = goldCards[0];
        gameState.bandits.push({ banditPlayIndex: idx, blockedPlayIndex: target.i });
        addLog(`🗡️ <span class="log-card">Bandit</span> bloque <span class="log-card">${getFaceData(target.c).nom}</span> !`, true);
        updateUI(); // mettre à jour avant le modal
        showBanditBlockedNotice(getFaceData(target.c).nom);
      } else {
        // Plusieurs cibles : joueur doit choisir
        gameState.bandits.push({ banditPlayIndex: idx, blockedPlayIndex: null, pendingChoice: true });
        updateUI();
        showBanditChoiceModal(idx, goldCards);
      }
    }
  });
}

// Met à jour les index des bandits quand une carte est retirée de play[]
function updateBanditIndices(removedIndex) {
  gameState.bandits = gameState.bandits.map(b => {
    const nb = { ...b };
    if (nb.banditPlayIndex === removedIndex) return null; // ce bandit est retiré
    if (nb.banditPlayIndex > removedIndex) nb.banditPlayIndex--;
    if (nb.blockedPlayIndex !== null && nb.blockedPlayIndex === removedIndex) nb.blockedPlayIndex = null;
    else if (nb.blockedPlayIndex !== null && nb.blockedPlayIndex > removedIndex) nb.blockedPlayIndex--;
    return nb;
  }).filter(Boolean);
}

function showBanditBlockedNotice(targetName) {
  // Simple log enrichi, pas de modal supplémentaire
  addLog(`🔒 <span class="log-card">${targetName}</span> est bloquée et ne peut pas produire de l'Or.`);
}

// Modal de choix : le joueur choisit quelle carte bloquer
function showBanditChoiceModal(banditPlayIndex, goldCards) {
  let html = `<p style="margin-bottom:12px;">Le <strong>Bandit</strong> doit bloquer une de vos cartes qui produit de l'Or. Choisissez :</p>`;
  goldCards.forEach(({ c, i }) => {
    const fd = getFaceData(c);
    html += `
      <button onclick="assignBanditBlock(${banditPlayIndex}, ${i})" class="bandit-choice-btn">
        ${getCardEmoji(fd.type, fd.nom)} <strong>${fd.nom}</strong>
        <span style="font-size:0.75rem;opacity:0.8;"> — #${c.cardDef.numero}</span>
      </button>`;
  });
  $('#banditChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('banditChoiceModal')).show();
}

// Appelé quand le joueur choisit la carte à bloquer
function assignBanditBlock(banditPlayIndex, targetPlayIndex) {
  bootstrap.Modal.getInstance(document.getElementById('banditChoiceModal'))?.hide();
  const entry = gameState.bandits.find(b => b.banditPlayIndex === banditPlayIndex);
  if (entry) {
    entry.blockedPlayIndex = targetPlayIndex;
    entry.pendingChoice = false;
    const targetName = getFaceData(gameState.play[targetPlayIndex]).nom;
    addLog(`🗡️ <span class="log-card">Bandit</span> bloque <span class="log-card">${targetName}</span> !`, true);
  }
  updateUI();
}

// Vaincre le bandit : coûte 1 Épée, détruit le bandit, gagne 2 ressources au choix
function defeatBandit(banditPlayIndex) {
  const projected = getProjectedResources();
  if ((projected['Epée'] || 0) < 1) {
    addLog(`❌ Pas d'épée disponible pour vaincre le Bandit.`);
    return;
  }
  // Ouvrir modal de choix des 2 ressources
  showBanditRewardModal(banditPlayIndex);
}

let pendingBanditDefeat = null;

function showBanditRewardModal(banditPlayIndex) {
  pendingBanditDefeat = banditPlayIndex;
  const resources = ['Or', 'Bois', 'Pierre', 'Métal'];
  let html = `<p style="margin-bottom:12px;">Choisissez <strong>2 ressources</strong> à gagner en vainquant le Bandit :</p>`;
  html += `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">`;
  resources.forEach(r => {
    html += `<button onclick="selectBanditReward('${r}')" class="bandit-reward-btn" id="reward-${r}">
      ${RESOURCE_ICONS[r]} ${r}
    </button>`;
  });
  html += `</div>`;
  html += `<div id="banditRewardSelected" style="margin-top:12px;min-height:30px;text-align:center;font-family:'Cinzel',serif;font-size:0.8rem;color:#f0c040;"></div>`;
  html += `<button onclick="confirmBanditDefeat()" class="btn btn-success btn-sm" style="margin-top:8px;display:block;margin-left:auto;margin-right:auto;" id="btnConfirmDefeat" disabled>✔ Confirmer</button>`;
  $('#banditRewardBody').html(html);
  new bootstrap.Modal(document.getElementById('banditRewardModal')).show();
  window._banditRewardChoices = [];
}

function selectBanditReward(resource) {
  if (!window._banditRewardChoices) window._banditRewardChoices = [];
  const choices = window._banditRewardChoices;

  const idx = choices.indexOf(resource);
  if (idx >= 0) {
    choices.splice(idx, 1);
    $(`#reward-${resource}`).removeClass('selected');
  } else if (choices.length < 2) {
    choices.push(resource);
    $(`#reward-${resource}`).addClass('selected');
  }

  const parts = choices.map(r => `${RESOURCE_ICONS[r]} ${r}`).join(' + ');
  $('#banditRewardSelected').html(choices.length ? `Sélection : ${parts}` : '');
  $('#btnConfirmDefeat').prop('disabled', choices.length < 2);
}

function confirmBanditDefeat() {
  bootstrap.Modal.getInstance(document.getElementById('banditRewardModal'))?.hide();
  const choices = window._banditRewardChoices || [];
  if (choices.length < 2 || pendingBanditDefeat === null) return;

  const banditPlayIndex = pendingBanditDefeat;
  pendingBanditDefeat = null;

  // Dépenser 1 Épée
  gameState.resources['Epée'] = Math.max(0, gameState.resources['Epée'] - 1);

  // Gagner les 2 ressources choisies
  choices.forEach(r => { gameState.resources[r] = (gameState.resources[r] || 0) + 1; });

  // Retirer le bandit de play[] et des bandits[]
  const banditCard = gameState.play[banditPlayIndex];
  gameState.play.splice(banditPlayIndex, 1);
  updateBanditIndices(banditPlayIndex);
  gameState.discard.push(banditCard); // détruit (on met en défausse pour simplifier)

  const resParts = choices.map(r => `${RESOURCE_ICONS[r]} ${r}`).join(' + ');
  addLog(`⚔️ <span class="log-card">Bandit</span> vaincu ! -1⚔️ +${resParts}`, true);
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
  if (act.sacrifice) {
    const playIdx = gameState.play.indexOf(cardInstance);
    const others = gameState.play.filter((_, i) => i !== playIdx);
    if (others.length === 0) return false;
  }
  return true;
}

// Active l'effet activable : met en staging une action 'activate'
// Gère les effets avec ou sans coût, avec ou sans promotion forcée, avec ou sans sacrifice
function stageActivateEffect(playIndex) {
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

  // Effet avec sacrifice : ouvre un modal pour choisir la carte à défausser
  if (act.sacrifice) {
    // Les cartes candidats = toutes les cartes en jeu SAUF celle-ci
    const candidates = gameState.play.filter((_, i) => i !== playIndex);
    if (candidates.length === 0) {
      addLog(`❌ Aucune carte disponible à sacrifier pour activer <span class="log-card">${fd.nom}</span>.`);
      return;
    }
    showSacrificeModal(playIndex, act, candidates);
    return;
  }

  _doStageActivate(playIndex, act);
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

  let html = `<p style="margin-bottom:12px;">
    Choisissez une carte à <strong>défausser</strong> en échange de <strong>${resStr}</strong> :
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

  window._pendingSacrificePlayIndex = playIndex;
  window._pendingSacrificeAct = act;
  $('#sacrificeChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('sacrificeChoiceModal')).show();
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
  idxs.forEach(i => gameState.play.splice(i, 1));

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

  gameState.play.splice(playIndex, 1);
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

// Effet Destruction : la carte elle-même est détruite (retirée du jeu).
// Le joueur choisit ensuite parmi les cartes listées celle à mettre en défausse.
// Appelé après la promotion, on passe cardInstance (déjà dans discard à ce stade).
let pendingDestructionChoiceCard = null; // la carte Mine détruite

function applyDestructionEffect(cardInstance) {
  const fd = getFaceData(cardInstance);
  if (!fd.effet) return;
  const effets = Array.isArray(fd.effet) ? fd.effet : [fd.effet];
  const destr = effets.find(e => e.type === 'Destruction');
  if (!destr || !destr.cartes || destr.cartes.length === 0) return;

  const targetNums = destr.cartes; // ex: [84, 85]

  // Trouver les cartes cibles disponibles dans toutes les zones
  const available = [];
  ['play', 'discard', 'deck'].forEach(zone => {
    gameState[zone].forEach((ci, i) => {
      if (targetNums.includes(ci.cardDef.numero))
        available.push({ zone, index: i, ci });
    });
  });

  // Retirer définitivement la carte Mine du jeu (elle était dans discard après promotion)
  // On la retire de la défausse pour "destruction"
  const mineIdx = gameState.discard.indexOf(cardInstance);
  if (mineIdx >= 0) gameState.discard.splice(mineIdx, 1);
  addLog(`💥 <span class="log-card">${fd.nom}</span> — détruite par son propre effet !`, true);

  if (available.length === 0) {
    addLog(`🔴 Aucune carte cible (#${targetNums.join(', #')}) trouvée — effet ignoré.`);
    return;
  }

  if (available.length === 1) {
    // Une seule option : défausser automatiquement
    moveToDiscard(available[0]);
    addLog(`🎯 <span class="log-card">${getFaceData(available[0].ci).nom}</span> — mise en défausse par effet Destruction.`, true);
  } else {
    // Plusieurs options : le joueur choisit
    pendingDestructionChoiceCard = cardInstance;
    updateUI();
    showDestructionChoiceModal(available);
  }
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
  addLog(`🎯 <span class="log-card">${getFaceData(target.ci).nom}</span> (#${target.ci.cardDef.numero}) — défaussée par effet Destruction.`, true);
  window._destructionTargets = null;
  updateUI();
}

// ============================================================
//  STAGING — mise en attente sans application immédiate
// ============================================================

// Calcule les ressources disponibles en tenant compte du staging
function getProjectedResources() {
  const proj = { ...gameState.resources };
  gameState.staging.forEach(entry => {
    if (entry.action === 'produce') {
      Object.entries(entry.resourcesGained).forEach(([k, v]) => { proj[k] = (proj[k]||0) + v; });
    } else if (entry.action === 'activate') {
      // Déduire le coût de l'activation
      (entry.cout || []).forEach(c => {
        const key = normalizeRes(c.type);
        proj[key] = (proj[key]||0) - c.quantite;
      });
      // Ajouter les ressources gagnées
      Object.entries(entry.resourcesGained).forEach(([k, v]) => { proj[k] = (proj[k]||0) + v; });
    } else if (entry.action === 'upgrade' && entry.cout) {
      entry.cout.forEach(c => {
        const key = normalizeRes(c.type);
        proj[key] = (proj[key]||0) - c.quantite;
      });
    }
  });
  return proj;
}

// Met une carte en staging pour production (sans défausser ni donner les ressources)
function stageProduceCard(playIndex) {
  const cardInstance = gameState.play[playIndex];
  const faceData = getFaceData(cardInstance);

  if (!faceData.ressources || faceData.ressources.length === 0) {
    addLog(`❌ <span class="log-card">${faceData.nom}</span> n'a pas de production.`);
    return;
  }

  // Vérifier si cette carte est bloquée par un bandit pour la production d'Or
  if (isBlockedByBandit(playIndex)) {
    addLog(`🗡️ <span class="log-card">${faceData.nom}</span> est bloquée par un Bandit — impossible de produire de l'Or !`);
    return;
  }

  const resourcesGained = {};
  faceData.ressources.forEach(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    const key = normalizeRes(types[0]);
    if (key && gameState.resources[key] !== undefined)
      resourcesGained[key] = (resourcesGained[key]||0) + r.quantite;
  });

  gameState.play.splice(playIndex, 1);
  gameState.staging.push({ cardInstance, action: 'produce', resourcesGained, fameGained: 0, newFace: null, cout: null });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> — production en attente.`);
  updateUI();
}

// Met une carte en staging pour promotion (vérifie coût projeté, sans l'appliquer)
// Si plusieurs promotions sont disponibles, ouvre un modal de choix
function stageUpgradeCard(playIndex) {
  const cardInstance = gameState.play[playIndex];
  const faceData = getFaceData(cardInstance);

  // Collecter toutes les promotions disponibles
  const allPromos = faceData.promotions
    ? faceData.promotions
    : faceData.promotion ? [faceData.promotion] : [];

  if (allPromos.length === 0) {
    addLog(`❌ <span class="log-card">${faceData.nom}</span> ne peut pas être promue.`);
    return;
  }

  // Filtrer les promos dont on peut payer le coût
  const projected = getProjectedResources();
  const affordablePromos = allPromos.filter(promo =>
    (promo.cout || []).every(c => (projected[normalizeRes(c.type)] || 0) >= c.quantite)
  );

  if (affordablePromos.length === 0) {
    const costs = allPromos.map(p => formatCost(p.cout || [])).join(' ou ');
    addLog(`💰 Ressources insuffisantes pour promouvoir <span class="log-card">${faceData.nom}</span>. Coût: ${costs}`);
    return;
  }

  if (affordablePromos.length === 1) {
    // Une seule promotion payable : on l'applique directement
    _doStageUpgrade(playIndex, affordablePromos[0]);
  } else {
    // Plusieurs promos payables : le joueur choisit
    showPromoChoiceModal(playIndex, affordablePromos);
  }
}

function showPromoChoiceModal(playIndex, promos) {
  const cardInstance = gameState.play[playIndex];
  const faceData = getFaceData(cardInstance);
  let html = `<p style="margin-bottom:12px;">Choisissez la promotion pour <strong>${faceData.nom}</strong> :</p>`;
  promos.forEach((promo, i) => {
    const targetFace = cardInstance.cardDef.faces.find(f => f.face === promo.face);
    const coutStr = formatCost(promo.cout || []);
    const emoji = targetFace ? getCardEmoji(targetFace.type, targetFace.nom) : '📄';
    const fame = targetFace && targetFace.victoire ? ` ⭐+${targetFace.victoire}` : '';
    html += `<button onclick="selectPromoChoice(${playIndex}, ${i})" class="bandit-choice-btn">
      ${emoji} <strong>${targetFace ? targetFace.nom : '?'}</strong>
      <span style="font-size:0.75rem;opacity:0.8;"> — Coût: ${coutStr}${fame}</span>
    </button>`;
  });
  window._pendingPromos = promos;
  $('#promoChoiceBody').html(html);
  new bootstrap.Modal(document.getElementById('promoChoiceModal')).show();
}

function selectPromoChoice(playIndex, promoIdx) {
  bootstrap.Modal.getInstance(document.getElementById('promoChoiceModal'))?.hide();
  const promo = (window._pendingPromos || [])[promoIdx];
  if (!promo) return;
  window._pendingPromos = null;
  _doStageUpgrade(playIndex, promo);
}

function _doStageUpgrade(playIndex, promo) {
  const cardInstance = gameState.play[playIndex];
  const faceData = getFaceData(cardInstance);
  const cout = promo.cout || [];
  const newFace = promo.face;
  const newFaceData = cardInstance.cardDef.faces.find(f => f.face === newFace);
  const fameGained = newFaceData && newFaceData.victoire ? newFaceData.victoire : 0;

  gameState.play.splice(playIndex, 1);
  gameState.staging.push({ cardInstance, action: 'upgrade', resourcesGained: {}, fameGained, newFace, cout });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> → <span class="log-card">${newFaceData ? newFaceData.nom : '?'}</span> — promotion en attente.`);
  updateUI();
}

// Annule une entrée en staging et remet la/les carte(s) dans play
function cancelStaging(stagingIndex) {
  const entry = gameState.staging[stagingIndex];
  gameState.staging.splice(stagingIndex, 1);
  gameState.play.push(entry.cardInstance);
  let msg = `↩ <span class="log-card">${getFaceData(entry.cardInstance).nom}</span> — action annulée.`;
  // Si l'activation avait un sacrifice, remettre la carte sacrifiée en jeu également
  if (entry.sacrificeCardInstance) {
    gameState.play.push(entry.sacrificeCardInstance);
    msg += ` <span class="log-card">${getFaceData(entry.sacrificeCardInstance).nom}</span> récupérée.`;
  }
  addLog(msg);
  updateUI();
}

// ============================================================
//  CONFIRMER LE TOUR : applique toutes les actions du staging
// ============================================================
function confirmTurn() {
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
      // Déduire le coût
      (cout || []).forEach(c => { gameState.resources[normalizeRes(c.type)] -= c.quantite; });
      // Appliquer les ressources gagnées
      Object.entries(resourcesGained).forEach(([k, v]) => { gameState.resources[k] += v; });
      const resStr = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`).join(' ');
      if (newFace) {
        // Promotion forcée par l'effet (ex: Forêt → Coupe Rase)
        cardInstance.currentFace = newFace;
        cardStateMap[cardInstance.cardDef.numero] = newFace;
        const newFaceData = getFaceData(cardInstance);
        gameState.discard.push(cardInstance);
        addLog(`🟢 <span class="log-card">${oldName}</span> abattue → <span class="log-card">${newFaceData.nom}</span> + ${resStr}`, true);
      } else {
        // Activation simple : carte défaussée, plus utilisable ce tour
        gameState.discard.push(cardInstance);
        // Si une carte avait été mise en staging comme sacrifice, la défausser maintenant
        if (entry.sacrificeCardInstance) {
          gameState.discard.push(entry.sacrificeCardInstance);
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
      // Appliquer l'effet de destruction de la nouvelle face si applicable
      applyDestructionEffect(cardInstance);
      if (isStayInPlay(newFaceData)) {
        gameState.permanent.push(cardInstance);
        addLog(`🏛 <span class="log-card">${oldName}</span> → <span class="log-card">${newFaceData.nom}</span> — permanente !`, true);
      } else {
        gameState.discard.push(cardInstance);
        addLog(`🔼 <span class="log-card">${oldName}</span> → <span class="log-card">${newFaceData.nom}</span> — promue !`, true);
      }
    }
  });

  gameState.staging = [];

  // Règle d'or #4 : une promotion termine le tour
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
function endTurn() {
  // Remettre les cartes en staging dans play (si on passe sans confirmer)
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
  gameState.bandits = []; // Les bandits sont défaussés en fin de tour
  clearResources();
  gameState.turnStarted = false;
  gameState.turn++;
  addLog(`— Fin du Tour ${gameState.turn - 1} —`);
  if (gameState.deck.length === 0)
    addLog(`🔚 Pioche vide. Fin de la Manche ${gameState.round}. Cliquez "Nouvelle Manche".`, true);
  updateUI();
}

function newRound() {
  gameState.staging.forEach(e => gameState.play.push(e.cardInstance));
  gameState.staging = [];
  gameState.bandits = [];
  gameState.play.forEach(c => gameState.discard.push(c));
  gameState.play = [];

  const allCards = [...gameState.deck, ...gameState.discard, ...gameState.permanent];
  gameState.permanent = []; gameState.discard = []; gameState.deck = [];
  clearResources();

  const discovered = discoverNextCards(2);
  discovered.forEach(card => {
    allCards.push(card);
    addLog(`🔍 Découverte: <span class="log-card">${getFaceData(card).nom}</span> (#${card.cardDef.numero})`, true);
    if (card.cardDef.numero === 70) { gameState.gameOver = true; addLog(`🏆 Carte #70 ! Dernière Manche !`, true); }
  });
  if (!discovered.length) addLog(`📦 Toutes les cartes ont été découvertes.`);

  allCards.forEach(c => { cardStateMap[c.cardDef.numero] = c.currentFace; });
  let newDeck = allCards.map(c => createCardInstance(c.cardDef));
  shuffleDeck(newDeck);
  gameState.deck = newDeck;
  gameState.turn = 1; gameState.round++; gameState.turnStarted = false;
  addLog(`🔄 Manche ${gameState.round} commence ! Pioche: ${newDeck.length} cartes.`, true);
  updateUI();
}

function discoverNextCards(n) {
  const out = [];
  for (let i = 0; i < n && gameState.nextDiscoverIndex < gameState.box.length; i++)
    out.push(createCardInstance(gameState.box[gameState.nextDiscoverIndex++]));
  return out;
}

// ============================================================
//  HELPERS
// ============================================================
function getFaceData(ci) {
  return ci.cardDef.faces.find(f => f.face === ci.currentFace) || ci.cardDef.faces[0];
}
function getFaceName(cardDef, faceNum) {
  const f = cardDef.faces.find(f => f.face === faceNum); return f ? f.nom : '?';
}
function normalizeRes(t) {
  const val = Array.isArray(t) ? t[0] : t;
  return { Or:'Or', Bois:'Bois', Pierre:'Pierre', Métal:'Métal', Metal:'Métal', Epée:'Epée', Troc:'Troc' }[val] || val;
}
function formatCost(cout) {
  if (!cout || !cout.length) return 'Gratuit';
  return cout.map(c => `${c.quantite}${RESOURCE_ICONS[normalizeRes(c.type)]||c.type}`).join(' + ');
}
function getCardEmoji(type, nom) {
  return ({
    'Herbes Sauvages':'🌾','Plaines':'🌿','Terres cultivées':'🚜','Grange':'🏚️',
    'Montagnes Lointaines':'⛰️','Zone Rocheuse':'🪨','Carrière':'⛏️','Mine Peu Profonde':'🪝',
    'Forêt':'🌲','Coupe Rase':'🪓','Cabane de Bûcheron':'🏡','Puit Sacré':'⛲',
    'Quartier Général':'⚑','Hôtel de Ville':'🏛️','Donjon':'🏰','Château':'🏯',
    'Commerçante':'👩‍💼','Bazar':'🏪','Marché':'🛍️','Festival':'🎪',
    'Jungle':'🌴','Arbres Géants':'🌳','Jungle Profonde':'🏕️','Cabane dans les Arbres':'🛖',
    'Rivière':'🏞️','Pont':'🌉','Pont de Pierre':'🗿','Explorateurs':'🧭',
    'Exploitant':'⚒️','Domestique':'🧹','Bandit':'🗡️','Travailleur':'👷',
    'Colinne':'⛰️','Chapelle':'⛪','Eglise':'⛪','Cathédrale':'🕍',
    'Forge':'🔨','Armurerie':'⚔️','Muraille':'🏯','Falaises de l\'Est':'🏔️',
    'Marais':'🌊','Marais Amenagés':'🌿','Jardin du Marais':'🌺','Arbres à Fruits Exotiques':'🍎',
    'Lac':'🏊','MChalet du Pêcheur':'🏠','Bateau de Pêche':'⛵','Phare':'🗼',
  }[nom]) || TYPE_ICONS[type] || '📄';
}

// ============================================================
//  RENDER — cartes en jeu
// ============================================================
function buildCardFrontHTML(cardInstance, playIndex) {
  const face = getFaceData(cardInstance);
  const promo = face.promotions ? face.promotions[0] : face.promotion;
  const hasUpgrade = !!(face.promotion || (face.promotions && face.promotions.length > 0));
  const hasResources = face.ressources && face.ressources.length > 0;
  const isEnemy = face.type === 'Ennemi';
  const banditCard = isBandit(cardInstance);
  const blocked = isBlockedByBandit(playIndex);
  const totalFaces = cardInstance.cardDef.faces.length;
  const progressPct = ((cardInstance.currentFace - 1) / Math.max(1, totalFaces - 1)) * 100;

  const resHTML = hasResources ? face.ressources.map(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.map(t => {
      const isGoldBlocked = blocked && normalizeRes(t) === 'Or';
      return `<span class="resource-pip${isGoldBlocked ? ' res-blocked' : ''}">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}${isGoldBlocked ? ' 🚫' : ''}</span>`;
    }).join('');
  }).join('') : '';

  const effectIcon = face.effet
    ? (Array.isArray(face.effet) ? '⚡'
      : face.effet.type==='Activable' ? '🟢'
      : face.effet.type==='Passif' ? '🔵'
      : face.effet.type==='Destruction' ? '🔴' : '⚡') : '';

  const projected = getProjectedResources();
  // Support multiple promotions
  const allPromos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  const canUpgrade = hasUpgrade && allPromos.some(p => (p.cout||[]).every(c => (projected[normalizeRes(c.type)]||0) >= c.quantite));
  const canDefeat = banditCard && (projected['Epée'] || 0) >= 1;

  // Styles selon état
  let cardBg, cardBorder, nameColor, extraOverlay = '';
  if (banditCard) {
    cardBg = 'linear-gradient(160deg,#3a1010,#2a0808)';
    cardBorder = '#cc3333';
    nameColor = '#ffaaaa';
  } else if (blocked) {
    cardBg = 'linear-gradient(160deg,#2a2010,#1a1408)';
    cardBorder = '#996600';
    nameColor = '#cc9940';
    extraOverlay = `<div class="card-blocked-overlay">🔒 BLOQUÉE</div>`;
  } else {
    cardBg = 'linear-gradient(160deg,var(--parchment),var(--parchment-dark))';
    cardBorder = 'var(--border-ornate)';
    nameColor = 'var(--ink)';
  }

  // Boutons d'action
  const hasActivable = hasActivableEffect(cardInstance);
  const canActivate = hasActivable && canActivateEffect(cardInstance);
  const actionBtns = [];
  if (banditCard) {
    if (canDefeat) {
      actionBtns.push(`<button class="card-action-btn btn-defeat-bandit" onclick="event.stopPropagation();defeatBandit(${playIndex})">⚔️ Vaincre (1⚔️)</button>`);
    } else {
      actionBtns.push(`<button class="card-action-btn btn-defeat-bandit btn-upgrade-disabled" disabled title="Besoin d'1 Épée">⚔️ Vaincre</button>`);
    }
  } else if (!blocked) {
    if (hasResources) actionBtns.push(`<button class="card-action-btn btn-discard-action" onclick="event.stopPropagation();stageProduceCard(${playIndex})">⚒ Prod.</button>`);
    if (hasActivable) actionBtns.push(`<button class="card-action-btn btn-activate-action${canActivate?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageActivateEffect(${playIndex})" title="Effet activable">🟢 Activer</button>`);
    if (hasUpgrade) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgrade?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeCard(${playIndex})">▲ Prom.</button>`);
  } else {
    // Carte bloquée : seule la promotion est possible (pas la production)
    if (hasUpgrade) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgrade?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeCard(${playIndex})">▲ Prom.</button>`);
  }

  return `
    <div class="card-wrapper${blocked ? ' card-wrapper-blocked' : ''}${banditCard ? ' card-wrapper-bandit' : ''}">
      <div class="card card-front card-enter" onclick="openCardModal(${playIndex},'play')"
           style="cursor:pointer;background:${cardBg};border-color:${cardBorder};">
        ${face.victoire!==undefined ? `<div class="card-victory" style="${face.victoire<0?'background:var(--crimson)':''}">${face.victoire>0?'★':''}${face.victoire}</div>` : ''}
        <div class="card-serial">#${cardInstance.cardDef.numero} <span style="font-size:0.38rem;opacity:0.6;">${cardInstance.currentFace}/${totalFaces}</span></div>
        <div class="card-name" style="color:${nameColor}">${face.nom}</div>
        <span class="card-type-badge type-${(face.type||'').replace('â','a').replace('è','e')}">${face.type}</span>
        <div class="card-img-area">${getCardEmoji(face.type, face.nom)}</div>
        ${extraOverlay}
        <div class="card-resources">${resHTML}</div>
        ${effectIcon ? `<div class="card-effect-indicator">${effectIcon}</div>` : ''}
        ${hasUpgrade && !banditCard ? `<div class="card-upgrade-hint${canUpgrade?' can-upgrade':''}">▲ ${allPromos.map(p => formatCost(p.cout||[])).join(' | ')}</div>` : ''}
        <div class="card-progress"><div style="width:${progressPct}%;height:100%;background:var(--gold);border-radius:0 0 0 8px;"></div></div>
      </div>
      <div class="card-actions">
        ${actionBtns.join('')}
      </div>
    </div>`;
}

// ============================================================
//  RENDER — cartes en staging
// ============================================================
function buildStagingCardHTML(entry, stagingIndex) {
  const { cardInstance, action, resourcesGained, fameGained, newFace } = entry;
  const face = getFaceData(cardInstance);
  const isUpgrade = action === 'upgrade';

  const isActivate = action === 'activate';

  let actionSummary = '';
  if (isUpgrade) {
    const nfd = cardInstance.cardDef.faces.find(f => f.face === newFace);
    actionSummary = `→ ${nfd ? nfd.nom : '?'}${fameGained ? `  ⭐+${fameGained}` : ''}`;
  } else if (isActivate) {
    const resParts = Object.entries(resourcesGained).map(([k,v]) => `+${v}${RESOURCE_ICONS[k]||k}`);
    const coutParts = (entry.cout||[]).map(c => `-${c.quantite}${RESOURCE_ICONS[normalizeRes(c.type)]||c.type}`);
    const promoStr = entry.newFace ? ` → face ${entry.newFace}` : '';
    actionSummary = ([...coutParts, ...resParts].join('  ') || '—') + promoStr;
  } else {
    const parts = Object.entries(resourcesGained).map(([k,v]) => `+${v} ${RESOURCE_ICONS[k]||k}`);
    actionSummary = parts.length ? parts.join('  ') : '—';
  }

  const accentColor = isUpgrade ? '#44dd44' : isActivate ? '#44ccff' : '#f0c040';
  const bgTop = isUpgrade ? '#1a3a1a' : isActivate ? '#0a2a3a' : '#2a2608';
  const label = isUpgrade ? '▲ PROMOTION' : isActivate ? '🟢 ACTIVATION' : '⚒ PRODUCTION';

  // Carte sacrifice associée (si présente)
  let sacrificeHTML = '';
  if (entry.sacrificeCardInstance) {
    const sf = getFaceData(entry.sacrificeCardInstance);
    const sfEmoji = getCardEmoji(sf.type, sf.nom);
    sacrificeHTML = `
    <div class="staging-card-wrapper staging-sacrifice-wrapper" title="Carte sacrifiée — ne peut pas être annulée seule">
      <div class="staging-card staging-sacrifice-card" style="border-color:#cc440040;background:linear-gradient(160deg,#2a0a0a,#0e0808);">
        <div class="staging-label" style="color:#ff8888;">🔥 SACRIFICE</div>
        <div class="staging-emoji">${sfEmoji}</div>
        <div class="staging-name">${sf.nom}</div>
        <div class="staging-summary" style="color:#ff8888;font-size:0.48rem;">lié aux Plaines</div>
      </div>
    </div>`;
  }

  return `
    ${sacrificeHTML}
    <div class="staging-card-wrapper">
      <div class="staging-card" style="border-color:${accentColor}40;background:linear-gradient(160deg,${bgTop},#0e0e08);">
        <div class="staging-label" style="color:${accentColor};">${label}</div>
        <div class="staging-emoji">${getCardEmoji(face.type, face.nom)}</div>
        <div class="staging-name">${face.nom}</div>
        <div class="staging-summary" style="color:${accentColor};">${actionSummary}</div>
        <button class="staging-cancel" onclick="cancelStaging(${stagingIndex})">✕ Annuler</button>
      </div>
    </div>`;
}

// ============================================================
//  RENDER — permanentes
// ============================================================
function buildPermanentCardHTML(cardInstance) {
  const face = getFaceData(cardInstance);
  const resHTML = (face.ressources||[]).map(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.map(t => `<span class="resource-pip" style="font-size:0.5rem;">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
  }).join('');
  return `
    <div class="card-wrapper">
      <div class="card-front card-permanent" title="Carte permanente">
        ${face.victoire ? `<div class="card-victory">★${face.victoire}</div>` : ''}
        <div class="card-serial" style="font-size:0.45rem;">#${cardInstance.cardDef.numero}</div>
        <div class="card-name" style="font-size:0.52rem;">${face.nom}</div>
        <span class="card-type-badge type-Batiment" style="font-size:0.42rem;">${face.type}</span>
        <div class="card-img-area" style="font-size:1.3rem;flex:1;">${getCardEmoji(face.type, face.nom)}</div>
        <div class="card-resources">${resHTML}</div>
        <div style="text-align:center;font-size:0.42rem;color:#6a9adf;font-family:'Cinzel',serif;margin-top:2px;">🔵 PERMANENT</div>
      </div>
    </div>`;
}

function buildDiscardTopHTML(cardInstance) {
  const face = getFaceData(cardInstance);
  return `
    <div class="card-front" style="cursor:pointer;width:130px;height:185px;border-radius:10px;border:2px solid var(--border-ornate);background:linear-gradient(160deg,var(--parchment),var(--parchment-dark));padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;">
      <div style="font-family:'Cinzel',serif;font-size:0.55rem;color:var(--stone);">#${cardInstance.cardDef.numero}</div>
      <div style="font-family:'Cinzel',serif;font-size:0.6rem;font-weight:600;color:var(--ink);text-align:center;">${face.nom}</div>
      <div style="font-size:2rem;margin:4px 0;">${getCardEmoji(face.type, face.nom)}</div>
      <div style="font-style:italic;font-size:0.5rem;color:var(--stone);">${face.type}</div>
    </div>`;
}

// ============================================================
//  UPDATE UI
// ============================================================
function updateUI() {
  // Ressources avec prévisualisation du staging
  const projected = getProjectedResources();
  Object.entries(gameState.resources).forEach(([key, val]) => {
    const id = 'res-' + key.toLowerCase().replace('é','e').replace('è','e');
    const $el = $(`#${id}`); if (!$el.length) return;
    const diff = (projected[key]||0) - val;
    if (diff > 0) $el.html(`${val} <span class="res-preview res-plus">+${diff}</span>`);
    else if (diff < 0) $el.html(`${val} <span class="res-preview res-minus">${diff}</span>`);
    else $el.text(val);
  });

  // Pioche
  const deckCount = gameState.deck.length;
  $('#deckCount').text(`${deckCount} carte${deckCount!==1?'s':''}`);
  $('#statDeck').text(deckCount);
  deckCount===0 ? $('#deckVisual').hide() : $('#deckVisual').show();

  // Boîte
  const rem = gameState.box.length - gameState.nextDiscoverIndex;
  $('#boxCount').text(`📦 ${rem} à découvrir`);
  const nx = gameState.box[gameState.nextDiscoverIndex];
  const nx2 = gameState.box[gameState.nextDiscoverIndex+1];
  $('#nextDiscoverInfo').text(nx ? `Prochaine: #${nx.numero}${nx2?` & #${nx2.numero}`:''}` : 'Boîte vide');

  // Permanentes
  const $perm = $('#permanentArea');
  if ($perm.length)
    $perm.html(gameState.permanent.length===0
      ? '<div style="font-family:\'Cinzel\',serif;font-size:0.55rem;color:rgba(200,150,12,0.25);text-align:center;padding:8px;">Aucune carte permanente</div>'
      : gameState.permanent.map(c => buildPermanentCardHTML(c)).join(''));

  // Zone de jeu
  const $play = $('#playArea');
  $play.html(gameState.play.length===0
    ? '<div class="play-area-empty"><span class="empty-icon">🏰</span><span class="empty-text">Zone de Jeu<br>Piochez des cartes pour commencer</span></div>'
    : gameState.play.map((c,i) => buildCardFrontHTML(c,i)).join(''));
  $('#statPlay').text(gameState.play.length + gameState.staging.length);

  // Zone de staging
  const hasStagingCards = gameState.staging.length > 0;
  $('#stagingZone').toggle(hasStagingCards);
  if (hasStagingCards) {
    $('#stagingArea').html(gameState.staging.map((e,i) => buildStagingCardHTML(e,i)).join(''));

    // Label du bouton confirmer
    const proj = getProjectedResources();
    const resParts = [];
    Object.entries(proj).forEach(([k,v]) => {
      const diff = v - gameState.resources[k];
      if (diff > 0) resParts.push(`+${diff}${RESOURCE_ICONS[k]||k}`);
    });
    const hasUpgrade = gameState.staging.some(e => e.action==='upgrade');
    const hasActivate = gameState.staging.some(e => e.action==='activate');
    const totalFame = gameState.staging.reduce((s,e) => s+(e.fameGained||0), 0);
    let lbl = hasUpgrade ? '✔ Confirmer & Fin de Tour' : hasActivate ? '✔ Confirmer les Actions' : '✔ Confirmer les Productions';
    if (resParts.length) lbl += `  (${resParts.join(' ')})`;
    if (totalFame > 0) lbl += `  ⭐+${totalFame}`;
    $('#btnConfirm').text(lbl);
  }

  // Défausse
  const dc = gameState.discard.length;
  $('#discardCount').text(`${dc} carte${dc!==1?'s':''}`);
  $('#statDiscard').text(dc);
  if (dc===0) { $('#discardVisual').hide(); $('#discardEmpty').show(); }
  else { $('#discardEmpty').hide(); $('#discardVisual').show(); $('#topDiscardCard').html(buildDiscardTopHTML(gameState.discard[dc-1])); }

  // Stats
  $('#statTurn').text(gameState.turn);
  $('#statRound').text(gameState.round);
  $('#fameScore').text(gameState.fame);
  const total = gameState.deck.length + gameState.play.length + gameState.discard.length + gameState.permanent.length + gameState.staging.length;
  if ($('#statKingdom').length) $('#statKingdom').text(total);

  if (gameState.gameOver)
    $('#roundBadge').text(`⚔ DERNIÈRE MANCHE — Tour ${gameState.turn}`).css('color','#ff8888');
  else
    $('#roundBadge').text(`Manche ${gameState.round} — Tour ${gameState.turn}`).css('color','');

  $('#btnDraw,#btnAdvance').prop('disabled', gameState.deck.length===0).css('opacity', gameState.deck.length===0?0.5:1);
}

function addLog(msg, important=false) {
  $('#gameLog').prepend(`<div class="${important?'log-entry log-important':'log-entry'}">${msg}</div>`);
}

// ============================================================
//  MODAL
// ============================================================
let modalCardIndex = null;
let modalCardZone = 'play';

function openCardModal(index, zone) {
  modalCardIndex = index; modalCardZone = zone||'play';
  const cardInstance = zone==='staging' ? gameState.staging[index].cardInstance : gameState.play[index];
  const face = getFaceData(cardInstance);

  $('#modalCardName').text(`${getCardEmoji(face.type,face.nom)} ${face.nom}`);
  let body = `<p><strong>Type:</strong> ${face.type} &nbsp;|&nbsp; <strong>#${cardInstance.cardDef.numero}</strong></p>`;
  if (face.ressources && face.ressources.length) {
    const rs = face.ressources.map(r => { const t=Array.isArray(r.type)?r.type:[r.type]; return t.map(x=>`${r.quantite}× ${RESOURCE_ICONS[normalizeRes(x)]||x} ${x}`).join(', '); }).join('; ');
    body += `<p><strong>Production:</strong> ${rs}</p>`;
  }
  if (face.victoire!==undefined) body += `<p><strong>${face.victoire>=0?'⭐':'💀'} Gloire:</strong> ${face.victoire}</p>`;
  if (face.effet) {
    const efs = Array.isArray(face.effet)?face.effet:[face.effet];
    efs.forEach(e => {
      body += `<p><strong>Effet (${e.type}):</strong> ${e.description||''}`;
      if (e.ressources) body += ' '+e.ressources.map(x=>`${x.quantite}× ${RESOURCE_ICONS[normalizeRes(Array.isArray(x.type)?x.type[0]:x.type)]||x.type}`).join(', ');
      if (e.cout) body += ` (Coût: ${formatCost(e.cout)})`;
      body += '</p>';
    });
  }
  const allModalPromos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  if (allModalPromos.length > 0) {
    allModalPromos.forEach(promo => {
      const nfd = cardInstance.cardDef.faces.find(f=>f.face===promo.face);
      body += `<p><strong>Promotion →</strong> <em>${nfd?nfd.nom:'?'}</em> — Coût: ${formatCost(promo.cout||[])}</p>`;
    });
  }
  const saved = cardStateMap[cardInstance.cardDef.numero]||1;
  body += `<hr><p style="font-size:0.8rem;color:#666;"><strong>Progression:</strong><br>`;
  cardInstance.cardDef.faces.forEach(f => {
    const ic = f.face===cardInstance.currentFace; const rch = f.face<=saved;
    body += `<span style="${ic?'font-weight:bold;':rch?'color:#666;':'color:#aaa;'}">${ic?'▶ ':rch?'✓ ':'🔒 '}Face ${f.face}: <em>${f.nom}</em>${ic?' (actuelle)':''}</span><br>`;
  });
  body += '</p>';

  $('#modalCardBody').html(body);
  const inPlay = zone!=='staging';
  const hasModalUpgrade = !!(face.promotion || (face.promotions && face.promotions.length > 0));
  $('#modalProduceBtn').toggle(inPlay && !!(face.ressources&&face.ressources.length));
  $('#modalUpgradeBtn').toggle(inPlay && hasModalUpgrade);
  new bootstrap.Modal(document.getElementById('cardModal')).show();
}

function produceFromModal() {
  if (modalCardIndex!==null) { bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide(); stageProduceCard(modalCardIndex); modalCardIndex=null; }
}
function upgradeFromModal() {
  if (modalCardIndex!==null) { bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide(); stageUpgradeCard(modalCardIndex); modalCardIndex=null; }
}

function showDiscardPile() {
  const $g = $('#discardPileGrid'); $g.empty();
  [...gameState.discard].reverse().forEach(ci => {
    const f = getFaceData(ci);
    $g.append(`<div style="text-align:center;"><div style="width:100px;height:145px;border-radius:8px;background:linear-gradient(160deg,var(--parchment),var(--parchment-dark));border:2px solid var(--border-ornate);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px;">
      <div style="font-family:'Cinzel',serif;font-size:0.5rem;color:var(--stone);">#${ci.cardDef.numero} F${ci.currentFace}</div>
      <div style="font-family:'Cinzel',serif;font-size:0.55rem;font-weight:600;color:var(--ink);text-align:center;">${f.nom}</div>
      <div style="font-size:1.5rem;margin:2px 0;">${getCardEmoji(f.type,f.nom)}</div>
      <div style="font-style:italic;font-size:0.45rem;color:var(--stone);">${f.type}</div>
      ${f.victoire?`<div style="font-size:0.5rem;color:var(--gold);">★${f.victoire}</div>`:''}
    </div></div>`);
  });
  new bootstrap.Modal(document.getElementById('discardModal')).show();
}

// ============================================================
//  INIT
// ============================================================
$(document).ready(function() { initGame(); });
