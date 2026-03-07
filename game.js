// ============================================================
//  CARD DATA from JSON files
// ============================================================

let ALL_CARDS = [
  ...BEGIN_CARDS,
  ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : []),
];

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
  // Bandits actifs : { banditNum, blockedNum|null }
  // banditNum/blockedNum = numéros stables (cardDef.numero), pas des indices play[]
  bandits: [],
};

// Générateur de noms de royaumes : combinaison d'un mot français + caractéristique en vieux français
const _KN_BASE = [
  // [nom, genre] — m=masculin, f=féminin, voyelle=true si commence par voyelle
  ['Royaume',     'm'], ['Duché',      'm'], ['Comté',      'm'],
  ['Fief',        'm'], ['Domaine',    'm'], ['Manoir',     'm'],
  ['Bourg',       'm'], ['Val',        'm'], ['Clos',       'm'],
  ['Marché',      'm'], ['Seigneurie', 'f'], ['Marche',     'f'],
  ['Cour',        'f'], ['Terre',      'f'],
];
const _KN_ATTR_M = [
  // Vieux français — formes masculines
  'Vaillant', 'Hardi', 'Preux', 'Franc', 'Ardent', 'Fier',
  'Loial', 'Isnel', 'Apert', 'Beau', 'Fort', 'Cler',
  'Noble', 'Riche', 'Sage', 'Droit', 'Vif', 'Hautain',
];
const _KN_ATTR_F = [
  // Vieux français — formes féminines
  'Vaillante', 'Hardie', 'Preste', 'Franche', 'Ardente', 'Fière',
  'Loiale', 'Isnelle', 'Aperte', 'Belle', 'Forte', 'Clare',
  'Noble', 'Riche', 'Sage', 'Droite', 'Vive', 'Hautaine',
];

function _generateKingdomName() {
  const [base, genre] = _KN_BASE[Math.floor(Math.random() * _KN_BASE.length)];
  const attrs = genre === 'm' ? _KN_ATTR_M : _KN_ATTR_F;
  const attr   = attrs[Math.floor(Math.random() * attrs.length)];

  // Article défini selon le genre
  const art = genre === 'm'
    ? (base.match(/^[AEIOUH]/i) ? 'L\'' : 'Le ')
    : (base.match(/^[AEIOUH]/i) ? 'L\'' : 'La ');

  // Préposition "de/d'" selon la première lettre de l'attribut
  const prep = attr.match(/^[AEIOUH]/i) ? 'd\'' : 'de ';

  const roll = Math.random();
  if (roll < 0.35) {
    // "Le Val Hardi" / "La Cour Noble"
    return `${art}${base} ${attr}`;
  } else if (roll < 0.65) {
    // "Duché de Franc" / "Seigneurie d'Ardente"
    return `${base} ${prep}${attr}`;
  } else {
    // "Val Preux" / "Terre Vive"  (direct, sans article)
    return `${base} ${attr}`;
  }
}

// Pool de noms pré-générés (renouvelé à chaque partie)
const KINGDOM_NAMES = Array.from({ length: 30 }, _generateKingdomName);

function initGame() {
  // Afficher d'abord le modal de choix du nom de royaume
  _showKingdomNameModal();
}

function _showKingdomNameModal() {
  const suggestion = _generateKingdomName();
  const input = document.getElementById('kingdomNameInput');
  if (input) {
    input.value = suggestion;
    input.select();
  }
  // Générer une nouvelle suggestion dans le bouton dé
  document.getElementById('kingdomSuggestion').textContent = suggestion;

  const modal = new bootstrap.Modal(document.getElementById('kingdomNameModal'), {
    backdrop: 'static', keyboard: false
  });
  modal.show();

  // Focus sur l'input après ouverture
  document.getElementById('kingdomNameModal').addEventListener('shown.bs.modal', function handler() {
    document.getElementById('kingdomNameModal').removeEventListener('shown.bs.modal', handler);
    const inp = document.getElementById('kingdomNameInput');
    if (inp) { inp.focus(); inp.select(); }
  });
}

function rollKingdomName() {
  const suggestion = _generateKingdomName();
  const input = document.getElementById('kingdomNameInput');
  if (input) { input.value = suggestion; input.focus(); input.select(); }
  document.getElementById('kingdomSuggestion').textContent = suggestion;
}

function confirmKingdomName() {
  const raw  = (document.getElementById('kingdomNameInput')?.value || '').trim();
  const name = raw || 'Valdermoor';
  bootstrap.Modal.getInstance(document.getElementById('kingdomNameModal'))?.hide();
  _startGameWithName(name);
}

function _startGameWithName(name) {
  cardStateMap = {};
  choiceNeeded = new Set();

  // Deck de départ : cartes 1–10
  const startCards = ALL_CARDS.filter(c => c.numero >= 1 && c.numero <= 10);
  // Box phase 1 : cartes 11–22, découvertes 2 par 2 à chaque manche
  const boxCards = ALL_CARDS.filter(c => c.numero >= 11 && c.numero <= 22)
    .sort((a, b) => a.numero - b.numero);

  ALL_CARDS.forEach(c => {
    cardStateMap[c.numero] = 1;
    if (isChoiceCard(c)) choiceNeeded.add(c.numero);
  });

  let deck = startCards.map(card => createCardInstance(card));
  shuffleDeck(deck);

  gameState = {
    deck, play: [], staging: [], discard: [], permanent: [], destroyed: [],
    retained: [],
    box: boxCards, nextDiscoverIndex: 0,
    resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 },
    fame: 0, round: 1, turn: 1, turnStarted: false, gameOver: false,
    bandits: [], _heritageTriggered: false,
    kingdomName: name,
  };

  // Mettre à jour le nom dans le header
  _updateKingdomNameUI(name);
  updateUI();
  addLog(`⚜ Que le Royaume de <strong>${name}</strong> prospère ! La partie commence.`, true);
  addLog(`📦 ${gameState.deck.length} cartes en pioche | ${gameState.box.length} cartes à découvrir (11–22).`);
}

function _updateKingdomNameUI(name) {
  const el = document.getElementById('kingdomNameDisplay');
  if (el) el.textContent = `Royaume de ${name}`;
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
let _drawLocked = false;

function drawCards(n) {
  if (_drawLocked) return;
  if (gameState.deck.length === 0) { addLog('La pioche est vide !'); return; }
  if (gameState.turnStarted && gameState.staging.length === 0) clearResources();
  gameState.turnStarted = true;
  const toDraw = Math.min(n, gameState.deck.length);

  // Capturer la position de la pioche AVANT updateUI
  const deckEl = document.querySelector('#deckVisual .card-front');
  const deckRect = deckEl ? deckEl.getBoundingClientRect() : null;

  // Mémoriser les numéros des cartes déjà en jeu (pour les animations)
  const existingNums = new Set(gameState.play.map(ci => ci.cardDef.numero));
  window._dealExistingNums = existingNums;

  // Tirer les cartes une par une et pré-calculer les cibles bandit dans l'ordre
  // Règle : quand un bandit est joué, il choisit parmi les cartes déjà en jeu À CE MOMENT
  const _banditQueue = []; // { banditNum, goldCards[] } à résoudre après animations
  for (let i = 0; i < toDraw; i++) {
    const card = gameState.deck.shift();
    if (isBandit(card)) {
      const banditNum = card.cardDef.numero;
      const alreadyBlocking = gameState.bandits.some(b => b.blockedNum != null);
      if (alreadyBlocking) {
        // Un blocage actif : ce bandit n'a pas de cible
        gameState.bandits.push({ banditNum, blockedNum: null });
        _banditQueue.push({ banditNum, goldCards: [] });
      } else {
        // Candidats = cartes déjà en jeu AVANT cette carte (play[] avant ce push)
        const goldCards = gameState.play
          .filter(c => !isBandit(c) && producesGold(c) &&
                       !gameState.bandits.some(b => b.blockedNum === c.cardDef.numero));
        gameState.bandits.push({ banditNum, blockedNum: null, pendingChoice: goldCards.length > 0 });
        _banditQueue.push({ banditNum, goldCards });
      }
    }
    gameState.play.push(card);
  }

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

function isBandit(cardInstance) {
  const fd = getFaceData(cardInstance);
  return fd.type === 'Ennemi' && fd.nom === 'Bandit';
}

// Résout l'index dans play[] à partir d'un numéro de carte (retourne -1 si absent)
function _playIndexOf(cardNum) {
  return gameState.play.findIndex(ci => ci.cardDef.numero === cardNum);
}
// Alias court
const _playIdxByNum = _playIndexOf;

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
  const { banditNum, goldCards } = queue[0];
  const rest = queue.slice(1);
  const next = () => { if (rest.length > 0) setTimeout(() => _resolveBanditQueue(rest), 400); };

  const entry = gameState.bandits.find(b => b.banditNum === banditNum);
  if (!entry) { next(); return; }

  if (goldCards.length === 0) {
    entry.blockedNum = null;
    entry.pendingChoice = false;
    addLog(`🗡️ <span class="log-card">Bandit</span> joué — aucune carte à bloquer.`);
    next();
  } else if (goldCards.length === 1) {
    entry.blockedNum = goldCards[0].cardDef.numero;
    entry.pendingChoice = false;
    addLog(`🗡️ <span class="log-card">Bandit</span> bloque <span class="log-card">${getFaceData(goldCards[0]).nom}</span> !`, true);
    showBanditBlockedNotice(getFaceData(goldCards[0]).nom);
    updateUI();
    next();
  } else {
    // Plusieurs cibles → modal de choix ; on passe rest pour continuer après le choix
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
    gameState.bandits.push({ banditNum, blockedNum: null, pendingChoice: false });
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
  bootstrap.Modal.getInstance(document.getElementById('banditChoiceModal'))?.hide();
  const entry = gameState.bandits.find(b => b.banditNum === banditNum);
  if (entry) {
    entry.blockedNum = targetCardNum;
    entry.pendingChoice = false;
    const targetIdx = _playIndexOf(targetCardNum);
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

  const banditNum = pendingBanditDefeat;
  pendingBanditDefeat = null;

  // Résoudre l'index à partir du numéro (stable)
  const banditPlayIndex = _playIndexOf(banditNum);
  if (banditPlayIndex < 0) return;

  // Dépenser 1 Épée
  gameState.resources['Epée'] = Math.max(0, gameState.resources['Epée'] - 1);
  choices.forEach(r => { gameState.resources[r] = (gameState.resources[r] || 0) + 1; });

  // Retirer le bandit de play[] et de bandits[]
  const banditCard = gameState.play[banditPlayIndex];
  _playRemove(banditPlayIndex);
  if (!gameState.destroyed) gameState.destroyed = [];
  gameState.destroyed.push(banditCard); // vaincu et détruit

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

  // Effet avec sacrifice : ouvre un modal pour choisir la carte à défausser
  if (act.sacrifice) {
    const candidates = gameState.play.filter((_, i) => i !== playIndex);
    if (candidates.length === 0) {
      addLog(`❌ Aucune carte disponible à sacrifier pour activer <span class="log-card">${fd.nom}</span>.`);
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

  // Chercher les candidats dans le pool de découverte par effet
  const discoverCandidates = (typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : [])
    .filter(cardDef =>
      targetNums.includes(cardDef.numero) &&
      !(gameState.discoveredByEffect && gameState.discoveredByEffect.has(cardDef.numero))
    );

  if (discoverCandidates.length > 0) {
    // Toujours passer par le modal pour que le joueur confirme son choix
    _showDiscoverByEffectModal(discoverCandidates, fd.nom);
  } else {
    // Cibler une carte existante du royaume pour la défausser
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

  $('#discoverByEffectTitle').text(`✨ Sacrifice — ${sourceName}`);
  $('#discoverByEffectSubtitle').text(
    candidates.length === 1
      ? 'Cette carte sera ajoutée à votre défausse :'
      : 'Choisissez la carte à ajouter à votre défausse :'
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
function stageProduceCard(cardNum) {
  const playIndex = _playIdxByNum(cardNum);
  if (playIndex < 0) return;
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

  _playRemove(playIndex);
  gameState.staging.push({ cardInstance, action: 'produce', resourcesGained, fameGained: 0, newFace: null, cout: null });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> — production en attente.`);
  updateUI();
}

// Met une carte en staging pour promotion (vérifie coût projeté, sans l'appliquer)
// Si plusieurs promotions sont disponibles, ouvre un modal de choix
function stageUpgradeCard(cardNum) {
  const playIndex = _playIdxByNum(cardNum);
  if (playIndex < 0) return;
  const cardInstance = gameState.play[playIndex];
  const faceData = getFaceData(cardInstance);

  // Règle : une seule promotion par tour
  if (gameState.staging.some(e => e.action === 'upgrade')) {
    addLog(`❌ Vous ne pouvez promouvoir qu'une seule carte par tour.`);
    return;
  }

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

  _playRemove(playIndex);
  gameState.staging.push({ cardInstance, action: 'upgrade', resourcesGained: {}, fameGained, newFace, cout });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> → <span class="log-card">${newFaceData ? newFaceData.nom : '?'}</span> — promotion en attente.`);
  updateUI();
}

// Annule une entrée en staging et remet la/les carte(s) dans play
function cancelStaging(stagingIndex) {
  const entry = gameState.staging[stagingIndex];
  gameState.staging.splice(stagingIndex, 1);
  gameState.play.push(entry.cardInstance);
  const cardName = getFaceData(entry.cardInstance).nom;
  let msg = `↩ <span class="log-card">${cardName}</span> — action annulée.`;

  // Pour une activation avec coût/gain : préciser ce qui est restitué/retiré
  if (entry.action === 'activate') {
    const coutParts = (entry.cout || []).map(c =>
      `+${c.quantite}${RESOURCE_ICONS[normalizeRes(c.type)]||c.type}`
    );
    const gainParts = Object.entries(entry.resourcesGained).map(([k,v]) =>
      `-${v}${RESOURCE_ICONS[k]||k}`
    );
    const all = [...coutParts, ...gainParts];
    if (all.length) msg += ` (${all.join(' ')})`;
  }

  // Si l'activation avait un sacrifice, remettre la carte sacrifiée en jeu également
  if (entry.sacrificeCardInstance) {
    gameState.play.push(entry.sacrificeCardInstance);
    msg += ` — <span class="log-card">${getFaceData(entry.sacrificeCardInstance).nom}</span> récupérée.`;
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
        // Si une carte avait été mise en staging comme sacrifice, la détruire
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
// Demande confirmation avant de passer le tour — modal stylisé
function confirmEndTurn() {
  new bootstrap.Modal(document.getElementById('confirmEndTurnModal')).show();
}

// Demande confirmation avant nouvelle manche — modal stylisé
function confirmNewRound() {
  const hasCardsLeft = gameState.play.length > 0 || gameState.deck.length > 0;
  if (!hasCardsLeft) {
    newRound();
    return;
  }
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
  if (gameState.deck.length === 0) {
    addLog(`🔚 Pioche vide. Fin de la Manche ${gameState.round}. Cliquez "Nouvelle Manche".`, true);
  } else {
    drawCards(4);
  }
  updateUI();
}

// Données en attente pendant l'inspection des nouvelles cartes
let _pendingNewRound = null;

// ============================================================
//  HÉRITAGE — Cartes level-1 (23-27)
// ============================================================

// Convertit une carte level-1 en cardInstance compatible avec le système
function _buildLevel1CardInstance(cardData) {
  // Créer un cardDef compatible avec getFaceData (faces obligatoires)
  let faces;
  if (cardData.faces) {
    // Progression (25, 26, 27) — faces minimalistes
    faces = cardData.faces.map(f => ({
      face: f.face,
      nom: `${cardData.nom} (Niv. ${f.face})`,
      type: cardData.type,
      description: cardData.description || '',
      ressources: [],
    }));
  } else if (cardData.effet) {
    // Parchemin (24) avec effets permanents
    faces = [{
      face: 1,
      nom: cardData.nom,
      type: cardData.type || 'Parchemin',
      description: cardData.description || '',
      ressources: [],
      effet: { type: 'Passif', description: 'Reste en jeu', ...{} },
    }];
  } else {
    faces = [{
      face: 1,
      nom: cardData.nom || `Carte #${cardData.numero}`,
      type: cardData.type || 'Règle',
      description: cardData.description || '',
      ressources: [],
    }];
  }
  const cardDef = { numero: cardData.numero, nom: cardData.nom, type: cardData.type, faces, _level1: cardData };
  cardStateMap[cardDef.numero] = 1;
  return { cardDef, currentFace: 1 };
}

// Affiche le modal de la Règle Héritage (carte #23)
function _showHeritageRuleModal(allCards) {
  const rule23 = LEVEL1_CARDS.find(c => c.numero === 23);
  if (!rule23) { _continueNewRoundAfterHeritage(allCards); return; }

  const desc = rule23.description || '';
  const html = `
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-size:3rem;margin-bottom:8px;">📜</div>
      <div style="font-family:'Cinzel',serif;font-size:0.65rem;color:var(--stone);letter-spacing:2px;margin-bottom:4px;">CARTE #23 — RÈGLE</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:1.1rem;color:var(--gold-light);margin-bottom:12px;">L'Héritage du Royaume</div>
    </div>
    <div style="
      background:linear-gradient(160deg,#1a1208,#100e06);
      border:1px solid var(--border-ornate);
      border-radius:10px;padding:20px 22px;
      font-family:'Crimson Text',serif;font-size:0.95rem;
      color:var(--parchment);line-height:1.7;
      white-space:pre-wrap;">
${desc.trim()}
    </div>
    <p style="text-align:center;margin-top:16px;font-family:'Crimson Text',serif;font-size:0.8rem;color:#aa8866;font-style:italic;">
      ⚠️ Une fois engagé dans la voie de l'Héritage, le jeu ne peut plus être réinitialisé.
    </p>`;

  document.getElementById('heritageRuleBody').innerHTML = html;
  window._heritageAllCards = allCards;
  new bootstrap.Modal(document.getElementById('heritageRuleModal')).show();
}

// File d'inspection des cartes 24-27 : { allCards, queue: [cardData,...], currentIndex }
let _heritageInspectState = null;

// Appelé quand le joueur clique "J'ai lu la règle" dans le modal #23
// Lance l'inspection une par une des cartes 24-27
function confirmHeritageRule() {
  bootstrap.Modal.getInstance(document.getElementById('heritageRuleModal'))?.hide();
  const allCards = window._heritageAllCards;
  window._heritageAllCards = null;

  const queue = [24, 25, 26, 27]
    .map(num => LEVEL1_CARDS.find(c => c.numero === num))
    .filter(Boolean);

  _heritageInspectState = { allCards, queue, currentIndex: 0 };
  _showNextHeritageCard();
}

// Affiche la carte courante de la file d'inspection
function _showNextHeritageCard() {
  const state = _heritageInspectState;
  if (!state || state.currentIndex >= state.queue.length) {
    // Toutes les cartes inspectées → continuer le jeu
    _heritageInspectState = null;
    _continueNewRoundAfterHeritage(state ? state.allCards : []);
    return;
  }

  const cardData = state.queue[state.currentIndex];
  const isLast   = state.currentIndex === state.queue.length - 1;
  const progress = `${state.currentIndex + 1} / ${state.queue.length}`;

  // Icônes et couleurs selon le type
  const typeIcons  = { Parchemin: '📜', Progression: '📈', Règle: '⚖️' };
  const typeColors = { Parchemin: '#c8960c', Progression: '#4a8abf', Règle: '#9a6abf' };
  const emoji      = typeIcons[cardData.type]  || '📜';
  const color      = typeColors[cardData.type] || '#c8960c';

  // Effets permanents (carte 24 — Parchemin)
  let effetHTML = '';
  if (cardData.effet && Array.isArray(cardData.effet)) {
    effetHTML = `
      <div style="margin-top:16px;">
        <div style="font-family:'Cinzel',serif;font-size:0.65rem;color:${color};letter-spacing:2px;margin-bottom:8px;">EFFETS PERMANENTS</div>
        ${cardData.effet.map(e => `
          <div style="
            background:rgba(0,0,0,0.3);border-left:3px solid ${color};
            border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:8px;
            font-family:'Crimson Text',serif;font-size:0.9rem;color:var(--parchment);line-height:1.5;">
            ✦ ${e.description || e.type}
          </div>`).join('')}
      </div>`;
  }

  // Niveaux (cartes Progression 25-27)
  let facesHTML = '';
  if (cardData.faces && cardData.faces.length) {
    facesHTML = `
      <div style="margin-top:16px;">
        <div style="font-family:'Cinzel',serif;font-size:0.65rem;color:${color};letter-spacing:2px;margin-bottom:8px;">NIVEAUX DE PROGRESSION</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          ${cardData.faces.map(f => `
            <div style="
              background:rgba(0,0,0,0.3);border:1px solid ${color}55;
              border-radius:8px;padding:10px 18px;text-align:center;
              font-family:'Cinzel',serif;font-size:0.75rem;color:#f5e6c8;">
              <div style="font-size:1.4rem;margin-bottom:4px;">🔒</div>
              Niveau ${f.face}
            </div>`).join('')}
        </div>
        <p style="font-family:'Crimson Text',serif;font-size:0.78rem;color:#888;font-style:italic;text-align:center;margin-top:10px;">
          Ces niveaux se débloquent au fil des manches de la voie Héritage.
        </p>
      </div>`;
  }

  const bodyHTML = `
    <!-- Barre de progression -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <div style="flex:1;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${((state.currentIndex)/state.queue.length)*100}%;background:${color};border-radius:2px;transition:width 0.4s;"></div>
      </div>
      <div style="font-family:'Cinzel',serif;font-size:0.6rem;color:#888;white-space:nowrap;">${progress}</div>
    </div>

    <!-- En-tête carte -->
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:3.5rem;margin-bottom:8px;filter:drop-shadow(0 0 10px ${color}88);">${emoji}</div>
      <div style="font-family:'Cinzel',serif;font-size:0.58rem;color:#666;letter-spacing:2px;margin-bottom:4px;">CARTE #${cardData.numero} — ${cardData.type.toUpperCase()}</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:1.2rem;color:${color};margin-bottom:6px;">${cardData.nom || '#' + cardData.numero}</div>
      <div style="display:inline-block;background:${color}22;border:1px solid ${color}55;border-radius:20px;padding:3px 14px;font-family:'Crimson Text',serif;font-size:0.75rem;color:${color};">
        ${cardData.type}
      </div>
    </div>

    ${effetHTML}
    ${facesHTML}

    <div style="text-align:center;margin-top:18px;font-family:'Crimson Text',serif;font-size:0.78rem;color:#aa8866;font-style:italic;">
      Cette carte rejoindra vos <strong>Permanentes</strong> dès que vous cliquerez sur le bouton ci-dessous.
    </div>`;

  document.getElementById('heritageInspectBody').innerHTML = bodyHTML;

  // Bouton : libellé dynamique
  const btnLabel = isLast
    ? `⚜ Ajouter aux permanentes & Continuer`
    : `⚜ Ajouter aux permanentes & Carte suivante →`;
  document.getElementById('heritageInspectBtn').textContent = btnLabel;

  // Titre du modal
  document.getElementById('heritageInspectTitle').textContent =
    `Carte #${cardData.numero} — ${cardData.nom || cardData.type}`;

  new bootstrap.Modal(document.getElementById('heritageInspectModal')).show();
}

// Le joueur confirme l'inspection de la carte courante
function confirmHeritageInspect() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('heritageInspectModal'));
  modal?.hide();

  const state = _heritageInspectState;
  if (!state) return;

  const cardData = state.queue[state.currentIndex];

  // Ajouter la carte en permanente immédiatement
  const ci = _buildLevel1CardInstance(cardData);
  if (!ALL_CARDS.find(c => c.numero === cardData.numero)) ALL_CARDS.push(ci.cardDef);
  gameState.permanent.push(ci);
  addLog(`🏛 <span class="log-card">${cardData.nom || '#' + cardData.numero}</span> — ajoutée aux permanentes (Héritage) !`, true);
  updateUI();

  state.currentIndex++;

  // Attendre que le modal soit fermé avant d'ouvrir le suivant
  document.getElementById('heritageInspectModal').addEventListener('hidden.bs.modal', function handler() {
    document.getElementById('heritageInspectModal').removeEventListener('hidden.bs.modal', handler);
    _showNextHeritageCard();
  });
}

function _continueNewRoundAfterHeritage(allCards) {
  const discovered = discoverNextCards(2);
  if (discovered.length === 0) {
    addLog(`📦 Toutes les cartes ont été découvertes.`);
    _finalizeNewRound(allCards, []);
    return;
  }
  _pendingNewRound = { allCards, discovered };
  _showNewCardsModal(discovered);
}

// ============================================================
//  CARTE 25 — ARMÉE / GRANDE ARMÉE
// ============================================================

// État de progression de la carte 25 (persisté dans gameState)
// gameState.armeeProgress = { face: 1|2, casesMarquees: 0 }

function _getArmeeCard() {
  return gameState.permanent.find(ci => ci.cardDef.numero === 25) || null;
}

function _getArmeeData(face) {
  const raw = LEVEL1_CARDS.find(c => c.numero === 25);
  if (!raw || !raw.faces) return null;
  return raw.faces.find(f => f.face === face) || null;
}

function _getArmeeProgress() {
  if (!gameState.armeeProgress) gameState.armeeProgress = { face: 1, casesMarquees: 0 };
  return gameState.armeeProgress;
}

// Ouvre le modal d'investissement pour la carte Armée
function openArmeeModal() {
  const prog = _getArmeeProgress();
  const faceData = _getArmeeData(prog.face);
  if (!faceData) return;

  const cases       = faceData.cases || [];
  const nextIndex   = prog.casesMarquees; // prochain slot à marquer (0-based)
  const nextCase    = cases[nextIndex];
  const projected   = getProjectedResources();
  const epeesDispo  = projected['Epée'] || 0;

  const nomCarte    = prog.face === 1 ? '⚔️ Armée' : '⚔️ Grande Armée';
  const glBonus     = faceData.gloire_bonus || 0;
  const glorieActuelle = glBonus + (nextIndex > 0 ? cases[nextIndex - 1].gloire : 0);

  // Construction HTML des cases
  let casesHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:16px 0;">';
  cases.forEach((c, i) => {
    const marked  = i < prog.casesMarquees;
    const isCurrent = i === nextIndex;
    const locked  = i > nextIndex;
    let bg, border, textColor;
    if (marked)       { bg = 'linear-gradient(135deg,#3a5a1a,#5a8a2a)'; border = '#8acc44'; textColor = '#ccff88'; }
    else if (isCurrent) { bg = 'linear-gradient(135deg,#3a3010,#7a6020)'; border = '#f0c040'; textColor = '#f0c040'; }
    else               { bg = 'rgba(0,0,0,0.3)'; border = '#444'; textColor = '#666'; }

    const icon = marked ? '✓' : isCurrent ? '▶' : '🔒';
    const isPromote = c.promotion;
    casesHTML += `
      <div style="
        background:${bg};border:2px solid ${border};border-radius:8px;
        padding:8px 10px;text-align:center;min-width:58px;
        opacity:${locked ? 0.4 : 1};">
        <div style="font-size:0.6rem;color:${textColor};font-family:'Cinzel',serif;">${icon} Case ${c.index}</div>
        <div style="font-size:0.7rem;color:#fff;margin:3px 0;">${c.cout_epee}⚔️</div>
        ${isPromote
          ? '<div style="font-size:0.65rem;color:#f0c040;">🔱 Promo</div>'
          : `<div style="font-size:0.75rem;color:#f0c040;font-weight:bold;">★${c.gloire}</div>`}
      </div>`;
  });
  casesHTML += '</div>';

  const canMark  = nextCase && epeesDispo >= nextCase.cout_epee;
  const allDone  = nextIndex >= cases.length;

  let actionHTML = '';
  if (allDone) {
    actionHTML = `<p style="text-align:center;font-family:'Cinzel',serif;font-size:0.8rem;color:#8acc44;">✅ Toutes les cases sont marquées !</p>`;
  } else {
    actionHTML = `
      <div style="
        background:rgba(0,0,0,0.3);border:1px solid ${canMark ? '#f0c040' : '#444'};
        border-radius:10px;padding:14px;text-align:center;margin-top:8px;">
        <div style="font-family:'Cinzel',serif;font-size:0.75rem;color:#aaa;margin-bottom:6px;">Prochaine case</div>
        <div style="font-size:1.1rem;color:#fff;margin-bottom:4px;">
          Coût : <strong style="color:#f5c842;">${nextCase.cout_epee} ⚔️</strong>
        </div>
        <div style="font-size:0.9rem;color:#f0c040;">
          ${nextCase.promotion ? '🔱 Promotion → Grande Armée + découverte #135' : `Gain : ★ ${nextCase.gloire} gloire`}
        </div>
        <div style="font-size:0.75rem;color:${canMark ? '#aaffaa' : '#ff8888'};margin-top:6px;">
          ${canMark ? `✅ Vous avez ${epeesDispo}⚔️ — vous pouvez marquer` : `❌ Il vous faut ${nextCase.cout_epee}⚔️ (vous avez ${epeesDispo})`}
        </div>
      </div>
      <div style="text-align:center;margin-top:14px;">
        <button onclick="confirmArmeeCase()" ${canMark ? '' : 'disabled'} style="
          font-family:'Cinzel',serif;font-weight:700;font-size:0.8rem;
          letter-spacing:1px;text-transform:uppercase;
          background:${canMark ? 'linear-gradient(135deg,#5a3a08,#c8960c,#5a3a08)' : 'rgba(0,0,0,0.4)'};
          border:2px solid ${canMark ? '#f0c040' : '#444'};
          color:${canMark ? '#1a0e04' : '#666'};
          padding:10px 28px;border-radius:6px;cursor:${canMark ? 'pointer' : 'not-allowed'};
          transition:all 0.2s;">
          ⚔️ Marquer la case ${nextCase.index}
        </button>
      </div>`;
  }

  const body = `
    <div style="text-align:center;margin-bottom:10px;">
      <div style="font-size:0.6rem;font-family:'Cinzel',serif;color:#888;letter-spacing:2px;">CARTE #25 — PERMANENTE</div>
      <div style="font-size:0.75rem;font-family:'Cinzel',serif;color:#aaa;margin-top:4px;font-style:italic;">${faceData.description}</div>
    </div>
    <div style="text-align:center;font-family:'Cinzel',serif;font-size:0.75rem;color:#f0c040;margin-bottom:4px;">
      Gloire actuelle de la carte : <strong>★ ${glorieActuelle}</strong>
      ${glBonus ? `<span style="color:#aaa;font-size:0.65rem;"> (bonus ${glBonus} + case)</span>` : ''}
    </div>
    ${casesHTML}
    ${actionHTML}`;

  document.getElementById('armeeModalTitle').textContent = nomCarte;
  document.getElementById('armeeModalBody').innerHTML = body;
  new bootstrap.Modal(document.getElementById('armeeModal')).show();
}

// Confirme le marquage de la prochaine case
function confirmArmeeCase() {
  bootstrap.Modal.getInstance(document.getElementById('armeeModal'))?.hide();

  const prog     = _getArmeeProgress();
  const faceData = _getArmeeData(prog.face);
  if (!faceData) return;
  const cases    = faceData.cases || [];
  const nextCase = cases[prog.casesMarquees];
  if (!nextCase) return;

  // Dépenser les épées
  gameState.resources['Epée'] = Math.max(0, (gameState.resources['Epée'] || 0) - nextCase.cout_epee);

  prog.casesMarquees++;

  if (nextCase.promotion) {
    // Dernière case face 1 → promotion vers Grande Armée
    prog.face = 2;
    prog.casesMarquees = 0;
    addLog(`🔱 <span class="log-card">Armée</span> → <span class="log-card">Grande Armée</span> ! -${nextCase.cout_epee}⚔️`, true);

    // Découvrir la carte #135 si elle existe
    if (nextCase.decouverte) {
      const discovered = (typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : [])
        .find(c => c.numero === nextCase.decouverte);
      if (discovered) {
        _discoverByEffect(discovered);
        addLog(`🗺️ État Vassal (#${nextCase.decouverte}) — découvert !`, true);
      } else {
        addLog(`📦 Carte #${nextCase.decouverte} (État Vassal) introuvable dans la boîte.`);
      }
    }
  } else {
    const gloire = nextCase.gloire;
    const bonus  = faceData.gloire_bonus || 0;
    const total  = bonus + gloire;
    addLog(`⚔️ <span class="log-card">${faceData.nom}</span> — case ${nextCase.index} marquée ! -${nextCase.cout_epee}⚔️ ★${total} gloire`, true);
  }

  // Mise à jour de la gloire effective de la carte (recalcul à chaque fois)
  _updateArmeeGloire();
  updateUI();
}

// Recalcule et applique la gloire de la carte Armée dans gameState.fame
// La gloire Armée remplace l'ancienne valeur Armée (on la traque séparément)
function _updateArmeeGloire() {
  const prog     = _getArmeeProgress();
  const faceData = _getArmeeData(prog.face);
  if (!faceData) return;
  const cases    = faceData.cases || [];
  const bonus    = faceData.gloire_bonus || 0;

  // Gloire de la dernière case marquée
  const lastMarked = prog.casesMarquees > 0 ? cases[prog.casesMarquees - 1] : null;
  const newGloire  = bonus + (lastMarked && !lastMarked.promotion ? lastMarked.gloire : 0);

  // Différentiel par rapport à la valeur précédente
  const prev = gameState.armeeGloirePrev || 0;
  const diff = newGloire - prev;
  if (diff !== 0) {
    gameState.fame = Math.max(0, (gameState.fame || 0) + diff);
    gameState.armeeGloirePrev = newGloire;
    if (diff > 0) addLog(`⭐ Gloire Armée +${diff} → Total : ${gameState.fame}`, true);
  }
}

// ============================================================
//  RÉTENTION (cartes 82 & 83 — Autel / Sanctuaire / Oratoire / Temple)
// ============================================================

function _hasRetentionEffect(cardInstance) {
  const fd = getFaceData(cardInstance);
  const effets = Array.isArray(fd.effet) ? fd.effet : (fd.effet ? [fd.effet] : []);
  return effets.some(e => e.type === 'Retention');
}

function _getRetentionCount(cardInstance) {
  const fd = getFaceData(cardInstance);
  const effets = Array.isArray(fd.effet) ? fd.effet : (fd.effet ? [fd.effet] : []);
  const eff = effets.find(e => e.type === 'Retention');
  return eff ? (eff.retenir || 1) : 0;
}

// Déclenché par le bouton 🕊️ sur la carte
function triggerRetentionEffect(cardNum) {
  const playIndex = _playIdxByNum(cardNum);
  if (playIndex < 0) return;
  const cardInstance = gameState.play[playIndex];
  if (!cardInstance) return;
  const fd = getFaceData(cardInstance);
  const count = _getRetentionCount(cardInstance);

  // Retirer la carte du jeu (sacrifiée)
  _playRemove(playIndex);
  if (!gameState.destroyed) gameState.destroyed = [];
  gameState.destroyed.push(cardInstance);
  addLog(`🕊️ <span class="log-card">${fd.nom}</span> — défaussée pour retenir ${count} carte${count>1?'s':''}.`, true);

  // Ouvrir le modal de sélection des cartes à retenir
  _showRetentionModal(count);
  updateUI();
}

function _showRetentionModal(count) {
  const eligible = gameState.play.filter(ci => {
    const retained = gameState.retained || [];
    return !retained.includes(ci.cardDef.numero);
  });

  if (eligible.length === 0) {
    addLog(`🕊️ Aucune carte en jeu à retenir.`);
    return;
  }

  const already = (gameState.retained || []).length;
  const toSelect = Math.min(count, eligible.length);

  let html = `
    <p style="font-family:'Crimson Text',serif;font-size:0.9rem;color:#f5e6c8;text-align:center;margin:0 0 14px;">
      Choisissez <strong style="color:#f0c040;">${toSelect}</strong> carte${toSelect>1?'s':''} à conserver pour la prochaine manche.
    </p>
    <div id="retentionCardList" style="display:flex;flex-direction:column;gap:8px;">`;

  eligible.forEach((ci, i) => {
    const face = getFaceData(ci);
    const typeColors = { Personne:'#2a4a7a', Terrain:'#1e4a1a', Bâtiment:'#5a4a3a', Batiment:'#5a4a3a', Ennemi:'#5a0a0a' };
    const bg = typeColors[face.type] || '#3a3a3a';
    html += `
      <button id="retBtn_${i}" onclick="toggleRetentionCard(${i}, ${toSelect})" style="
          width:100%;text-align:left;background:linear-gradient(135deg,#1a1408,#0e0e06);
          border:2px solid ${bg};border-radius:10px;padding:10px 14px;
          cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.2s;"
        data-cardnum="${ci.cardDef.numero}">
        <div style="min-width:34px;text-align:center;background:rgba(0,0,0,0.4);border:1px solid ${bg};border-radius:5px;padding:3px 2px;font-family:'Cinzel',serif;color:var(--gold);font-size:0.6rem;">#${ci.cardDef.numero}</div>
        <div style="font-size:1.8rem;">${getCardEmoji(face.type, face.nom)}</div>
        <div style="flex:1;">
          <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--gold-light);font-size:0.82rem;">${face.nom}</div>
          <div style="font-size:0.6rem;color:#888;">${face.type}</div>
        </div>
        <div id="retCheck_${i}" style="font-size:1.4rem;opacity:0;">✅</div>
      </button>`;
  });

  html += `</div>
    <div style="text-align:center;margin-top:16px;">
      <button id="retConfirmBtn" onclick="confirmRetentionSelection()" disabled style="
        font-family:'Cinzel',serif;font-weight:700;font-size:0.75rem;letter-spacing:1px;
        background:rgba(0,0,0,0.4);border:2px solid #444;color:#666;
        padding:10px 26px;border-radius:6px;cursor:not-allowed;">
        ✓ Confirmer (0 / ${toSelect})
      </button>
    </div>`;

  document.getElementById('retentionModalBody').innerHTML = html;
  window._retentionToSelect = toSelect;
  window._retentionSelected = [];
  new bootstrap.Modal(document.getElementById('retentionModal')).show();
}

function toggleRetentionCard(idx, max) {
  const btn = document.getElementById(`retBtn_${idx}`);
  const check = document.getElementById(`retCheck_${idx}`);
  if (!btn || !check) return;

  const cardNum = parseInt(btn.dataset.cardnum);
  const sel = window._retentionSelected || [];
  const pos = sel.indexOf(cardNum);

  if (pos >= 0) {
    // Désélectionner
    sel.splice(pos, 1);
    btn.style.borderColor = btn.style.borderColor; // reset géré en dessous
    btn.style.background = 'linear-gradient(135deg,#1a1408,#0e0e06)';
    check.style.opacity = '0';
  } else if (sel.length < max) {
    // Sélectionner
    sel.push(cardNum);
    btn.style.background = 'linear-gradient(135deg,#0a2a0a,#1a4a1a)';
    btn.style.borderColor = '#4acc44';
    check.style.opacity = '1';
  }

  window._retentionSelected = sel;
  const confirmBtn = document.getElementById('retConfirmBtn');
  const ready = sel.length === max;
  confirmBtn.disabled = !ready;
  confirmBtn.style.background = ready ? 'linear-gradient(135deg,#1e4a1a,#3a8a2a)' : 'rgba(0,0,0,0.4)';
  confirmBtn.style.borderColor = ready ? '#4acc44' : '#444';
  confirmBtn.style.color = ready ? '#ccffcc' : '#666';
  confirmBtn.style.cursor = ready ? 'pointer' : 'not-allowed';
  confirmBtn.textContent = `✓ Confirmer (${sel.length} / ${max})`;
}

function confirmRetentionSelection() {
  bootstrap.Modal.getInstance(document.getElementById('retentionModal'))?.hide();
  const selected = window._retentionSelected || [];
  window._retentionSelected = [];
  if (!gameState.retained) gameState.retained = [];
  selected.forEach(n => { if (!gameState.retained.includes(n)) gameState.retained.push(n); });
  const names = selected.map(n => {
    const ci = gameState.play.find(c => c.cardDef.numero === n);
    return ci ? `<span class="log-card">${getFaceData(ci).nom}</span>` : `#${n}`;
  });
  addLog(`🕊️ Retenues : ${names.join(', ')} — resteront en jeu à la prochaine manche.`, true);
  updateUI();
}

function newRound() {
  gameState.staging.forEach(e => gameState.play.push(e.cardInstance));
  gameState.staging = [];
  gameState.bandits = [];

  // ── Rétention (cartes 82/83) : extraire les cartes retenues avant la défausse ──
  const retainedNums = new Set(gameState.retained || []);
  const retainedCards = [];
  const playToDiscard = [];
  gameState.play.forEach(ci => {
    if (retainedNums.has(ci.cardDef.numero)) {
      retainedCards.push(ci);
    } else {
      playToDiscard.push(ci);
    }
  });
  if (retainedCards.length > 0) {
    addLog(`🕊️ ${retainedCards.map(ci => `<span class="log-card">${getFaceData(ci).nom}</span>`).join(', ')} — retenue${retainedCards.length > 1 ? 's' : ''} pour la prochaine manche.`, true);
  }
  gameState.retained = []; // réinitialiser pour la prochaine manche
  gameState._retainedForNextRound = retainedCards; // transmis à _finalizeNewRound
  playToDiscard.forEach(c => gameState.discard.push(c));
  gameState.play = [];

  // Séparer les permanentes normales des permanentes Héritage (level-1)
  const heritagePerms = gameState.permanent.filter(ci => ci.cardDef._level1);
  const normalPerms   = gameState.permanent.filter(ci => !ci.cardDef._level1);

  const allCards = [...gameState.deck, ...gameState.discard, ...normalPerms];
  gameState.permanent = [...heritagePerms]; // Les cartes Héritage restent permanentes !
  gameState.discard = []; gameState.deck = [];
  clearResources();
  updateUI();

  // ── HÉRITAGE : détecter la manche à 22 cartes ──
  // allCards contient les cartes du royaume actuel (sans les permanentes level-1 déjà exclues)
  // On compte uniquement les cartes numérotées 1-22 pour détecter le seuil
  const stdCards = allCards.filter(ci => ci.cardDef.numero <= 22);
  if (stdCards.length === 22 && !gameState._heritageTriggered) {
    gameState._heritageTriggered = true;

    // Phase 2 : ajouter les cartes d'aventure à la box (après l'Héritage)
    const alreadyInBox = new Set(gameState.box.map(c => c.numero));
    const phase2 = (typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : [])
      .filter(c => !alreadyInBox.has(c.numero))
      .sort((a, b) => a.numero - b.numero);
    if (phase2.length > 0) {
      gameState.box = [...gameState.box, ...phase2];
      addLog(`📦 Nouvelles terres à explorer — ${phase2.length} cartes d'aventure débloquées.`, true);
    }

    addLog(`📜 La manche des <strong>22 cartes</strong> s'achève. Une nouvelle règle est révélée...`, true);
    _showHeritageRuleModal(allCards);
    return;
  }

  // Découvrir 2 cartes depuis la box (phase 1 : 11-22 / phase 2 après Héritage : CARDS_TO_DISCOVER)
  const discovered = discoverNextCards(2);

  if (discovered.length === 0) {
    addLog(`📦 Toutes les cartes ont été découvertes.`);
    _finalizeNewRound(allCards, []);
    return;
  }

  _pendingNewRound = { allCards, discovered };
  _showNewCardsModal(discovered);
}

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

    return `<div style="
        flex:1;min-width:170px;max-width:230px;
        background:linear-gradient(160deg,#1e160a,#120e06);
        border:2px solid var(--border-ornate);border-radius:10px;
        padding:18px 14px;text-align:center;
        box-shadow:0 4px 18px rgba(0,0,0,0.5);">
      <div style="font-size:0.58rem;color:#777;font-family:'Cinzel',serif;letter-spacing:1px;margin-bottom:6px;">#${card.cardDef.numero}</div>
      <div style="font-size:2.6rem;margin-bottom:8px;">${getCardEmoji(face.type, face.nom)}</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.85rem;color:var(--gold-light);margin-bottom:6px;">${face.nom}</div>
      <div style="display:inline-block;background:${bgType};border-radius:4px;padding:1px 10px;font-size:0.58rem;font-family:'Cinzel',serif;color:#fff;letter-spacing:1px;margin-bottom:12px;">${face.type}</div>
      <div style="margin-bottom:4px;">${resHTML}</div>
      ${fameHTML}${effectHTML}${promoHTML}${facesHTML}
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
  _finalizeNewRound(allCards, discovered);
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

  // Placer les cartes retenues directement en jeu (déjà hors du deck)
  const retainedCards = gameState._retainedForNextRound || [];
  gameState._retainedForNextRound = [];
  gameState.deck = newDeck;
  if (retainedCards.length > 0) {
    gameState.play = retainedCards;
    gameState.turnStarted = true; // le tour est déjà commencé avec les cartes retenues
    addLog(`🕊️ ${retainedCards.map(ci => `<span class="log-card">${getFaceData(ci).nom}</span>`).join(', ')} — en jeu dès le début de la manche.`, true);
  }

  gameState.turn = 1; gameState.round++; gameState.turnStarted = retainedCards.length > 0;
  addLog(`🔄 Manche ${gameState.round} commence ! Pioche : ${newDeck.length} cartes.`, true);
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
  const upgradeAlreadyStaged = gameState.staging.some(e => e.action === 'upgrade');
  const canUpgrade = hasUpgrade && !upgradeAlreadyStaged && allPromos.some(p => (p.cout||[]).every(c => (projected[normalizeRes(c.type)]||0) >= c.quantite));
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
  const hasDestruction = hasDestructionEffect(cardInstance);
  const hasRetention = _hasRetentionEffect(cardInstance);
  const isAlreadyRetained = (gameState.retained || []).includes(cardInstance.cardDef.numero);
  const actionBtns = [];
  if (banditCard) {
    if (canDefeat) {
      actionBtns.push(`<button class="card-action-btn btn-defeat-bandit" onclick="event.stopPropagation();defeatBandit(${cardInstance.cardDef.numero})">⚔️ Vaincre (1⚔️)</button>`);
    } else {
      actionBtns.push(`<button class="card-action-btn btn-defeat-bandit btn-upgrade-disabled" disabled title="Besoin d'1 Épée">⚔️ Vaincre</button>`);
    }
  } else if (!blocked) {
    if (hasResources) actionBtns.push(`<button class="card-action-btn btn-discard-action" onclick="event.stopPropagation();stageProduceCard(${cardInstance.cardDef.numero})">⚒ Prod.</button>`);
    if (hasActivable) actionBtns.push(`<button class="card-action-btn btn-activate-action${canActivate?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageActivateEffect(${cardInstance.cardDef.numero})" title="Effet activable">🟢 Activer</button>`);
    if (hasDestruction) actionBtns.push(`<button class="card-action-btn btn-destroy-action" onclick="event.stopPropagation();triggerDestructionEffect(${cardInstance.cardDef.numero})" title="Sacrifier cette carte pour découvrir une autre">💥 Sacrifier</button>`);
    if (hasRetention) actionBtns.push(`<button class="card-action-btn btn-retention-action${isAlreadyRetained?' btn-retention-active':''}" onclick="event.stopPropagation();triggerRetentionEffect(${cardInstance.cardDef.numero})" title="Défausser pour retenir des cartes au prochain tour">🕊️ ${isAlreadyRetained?'Annuler':'Retenir'}</button>`);
    if (hasUpgrade) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgrade?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeCard(${cardInstance.cardDef.numero})" title="${upgradeAlreadyStaged ? 'Une promotion a déjà été jouée ce tour' : 'Promouvoir cette carte'}">▲ Prom.</button>`);
  } else {
    // Carte bloquée : seule la promotion est possible
    if (hasUpgrade) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgrade?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeCard(${cardInstance.cardDef.numero})" title="${upgradeAlreadyStaged ? 'Une promotion a déjà été jouée ce tour' : 'Promouvoir cette carte'}">▲ Prom.</button>`);
  }

  return `
    <div class="card-wrapper${blocked ? ' card-wrapper-blocked' : ''}${banditCard ? ' card-wrapper-bandit' : ''}" data-card-num="${cardInstance.cardDef.numero}">
      <div class="card card-front" onclick="openCardModal(${cardInstance.cardDef.numero},'play')"
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
    const terrainStr = entry.terrainName ? `⚑ ${entry.terrainName}` : '';
    actionSummary = (terrainStr ? terrainStr + '<br>' : '') + ([...coutParts, ...resParts].join('  ') || '—') + promoStr;
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
  // Rendu spécial pour les cartes Héritage (level-1)
  if (cardInstance.cardDef._level1) {
    const rawCard = cardInstance.cardDef._level1;

    // ── Rendu spécial carte 25 — Armée ──────────────────────
    if (rawCard.numero === 25) {
      const prog      = _getArmeeProgress();
      const faceData  = _getArmeeData(prog.face);
      const cases     = faceData?.cases || [];
      const total     = cases.length;
      const marked    = prog.casesMarquees;
      const bonus     = faceData?.gloire_bonus || 0;
      const lastCase  = marked > 0 ? cases[marked - 1] : null;
      const gloire    = bonus + (lastCase && !lastCase.promotion ? lastCase.gloire : 0);
      const pct       = total > 0 ? Math.round((marked / total) * 100) : 0;
      const nomAffiche = prog.face === 2 ? 'Grande Armée' : 'Armée';
      const projected = getProjectedResources();
      const epees     = projected['Epée'] || 0;
      const nextCase  = cases[marked];
      const canMark   = nextCase && epees >= nextCase.cout_epee;
      const allDone   = marked >= total;

      return `
        <div class="card-wrapper" style="cursor:pointer;" onclick="openArmeeModal()" title="Cliquer pour investir des Épées">
          <div class="card-front card-permanent" style="
            border-color:#cc4444;
            background:linear-gradient(160deg,#1a0a0a,#0e0606);">
            <div class="card-serial" style="font-size:0.45rem;color:#ff8888;">#25</div>
            <div class="card-name" style="font-size:0.5rem;color:#ffaaaa;">${nomAffiche}</div>
            <span class="card-type-badge" style="font-size:0.38rem;background:#7a1a1a;">Progression</span>
            <div style="font-size:1.4rem;margin:4px 0;">⚔️</div>
            <!-- Barre de progression -->
            <div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin:2px 0;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#cc4444,#ff6666);border-radius:3px;transition:width 0.4s;"></div>
            </div>
            <div style="font-size:0.38rem;color:#ff8888;text-align:center;margin:1px 0;">${marked}/${total} cases</div>
            ${gloire > 0 ? `<div style="font-size:0.48rem;color:#f0c040;text-align:center;">★ ${gloire}</div>` : ''}
            ${allDone
              ? '<div style="font-size:0.35rem;color:#8acc44;text-align:center;margin-top:1px;">✅ Complet</div>'
              : canMark
                ? `<div style="font-size:0.35rem;color:#f0c040;text-align:center;margin-top:1px;">▶ ${nextCase.cout_epee}⚔️ dispo</div>`
                : `<div style="font-size:0.35rem;color:#888;text-align:center;margin-top:1px;">🔒 ${nextCase?.cout_epee || '?'}⚔️ requis</div>`
            }
            <div style="text-align:center;font-size:0.35rem;color:#cc4444;font-family:'Cinzel',serif;margin-top:2px;">⚜ HÉRITAGE</div>
          </div>
        </div>`;
    }

    // ── Rendu générique Héritage ─────────────────────────────
    const typeIcons = { Parchemin:'📜', Progression:'📈', Règle:'⚖️' };
    const typeColors = { Parchemin:'#7a5a0a', Progression:'#3a5a8a', Règle:'#5a3a7a' };
    const emoji = typeIcons[rawCard.type] || '📜';
    const color = typeColors[rawCard.type] || '#7a5a0a';

    let effetHTML = '';
    if (rawCard.effet && Array.isArray(rawCard.effet)) {
      effetHTML = rawCard.effet.map(e =>
        `<div style="font-size:0.38rem;color:#c8960c;margin-top:1px;text-align:center;line-height:1.3;">${e.description || e.type}</div>`
      ).join('');
    }
    let facesHTML = '';
    if (rawCard.faces) {
      facesHTML = `<div style="font-size:0.38rem;color:#6a9adf;text-align:center;margin-top:2px;">${rawCard.faces.length} niveaux</div>`;
    }

    return `
      <div class="card-wrapper">
        <div class="card-front card-permanent" title="Carte Héritage — reste en jeu définitivement"
             style="border-color:${color};background:linear-gradient(160deg,#1a1008,#0e0a04);">
          <div class="card-serial" style="font-size:0.45rem;color:#c8960c;">#${rawCard.numero}</div>
          <div class="card-name" style="font-size:0.5rem;color:#f0c040;">${rawCard.nom || '#' + rawCard.numero}</div>
          <span class="card-type-badge" style="font-size:0.38rem;background:${color};">${rawCard.type}</span>
          <div class="card-img-area" style="font-size:1.3rem;flex:1;">${emoji}</div>
          ${effetHTML}
          ${facesHTML}
          <div style="text-align:center;font-size:0.38rem;color:#c8960c;font-family:'Cinzel',serif;margin-top:2px;">⚜ HÉRITAGE</div>
        </div>
      </div>`;
  }

  // Rendu normal
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
  if (deckCount === 0) {
    $('#deckVisual').hide();
  } else {
    $('#deckVisual').show();
    const topCard = gameState.deck[0];
    const topFace = getFaceData(topCard);
    const topResHTML = (topFace.ressources && topFace.ressources.length)
      ? topFace.ressources.map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return types.map(t => `<span class="resource-pip">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
        }).join('')
      : '';
    const topPromos = topFace.promotions ? topFace.promotions : (topFace.promotion ? [topFace.promotion] : []);
    const topUpgradeHTML = topPromos.length
      ? `<div class="card-upgrade-hint" style="font-size:0.38rem;">▲ ${topPromos.map(p => formatCost(p.cout||[])).join(' | ')}</div>`
      : '';
    const topFameHTML = (topFace.victoire !== undefined && topFace.victoire !== 0)
      ? `<div class="card-victory" style="${topFace.victoire < 0 ? 'background:var(--crimson)' : ''}">${topFace.victoire > 0 ? '★' : ''}${topFace.victoire}</div>`
      : '';
    const totalTopFaces = topCard.cardDef.faces.length;
    $('#topDeckCard').html(`
      ${topFameHTML}
      <div class="card-serial">#${topCard.cardDef.numero} <span style="font-size:0.38rem;opacity:0.6;">${topCard.currentFace}/${totalTopFaces}</span></div>
      <div class="card-name">${topFace.nom}</div>
      <span class="card-type-badge type-${(topFace.type||'').replace('â','a').replace('è','e')}">${topFace.type}</span>
      <div class="card-img-area">${getCardEmoji(topFace.type, topFace.nom)}</div>
      <div class="card-resources">${topResHTML}</div>
      ${topUpgradeHTML}
    `);
  }

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

  // Nom du royaume
  if (gameState.kingdomName) _updateKingdomNameUI(gameState.kingdomName);

  // Jouer : actif uniquement si pioche non vide ET tour pas encore commencé
  const canDraw    = gameState.deck.length > 0 && !gameState.turnStarted;
  const canAdvance = gameState.deck.length > 0 && gameState.turnStarted;
  const canPioche  = canDraw || canAdvance;

  // Un seul bouton pioche — label et action changent selon l'état du tour
  $('#btnDraw')
    .prop('disabled', !canPioche)
    .css('opacity', canPioche ? 1 : 0.4)
    .text('⚡ Avancer (+2 cartes)')
    .attr('onclick',  'drawCards(2)') ;
  $('#btnAdvance').hide(); // masqué — remplacé par le comportement dynamique de btnDraw

  // Passer le tour : désactivé si aucune carte en jeu/staging à traiter
  const canPass = gameState.play.length > 0 || gameState.staging.length > 0;
  $('#btnPass').prop('disabled', !canPass).css('opacity', canPass ? 1 : 0.4)
    .attr('title', canPass ? '' : 'Aucune carte à jouer');

  // Sauvegarde automatique en session
  _autosave();
}

function addLog(msg, important=false) {
  $('#gameLog').prepend(`<div class="${important?'log-entry log-important':'log-entry'}">${msg}</div>`);
}

// ============================================================
//  MODAL
// ============================================================
let modalCardIndex = null;
let modalCardZone = 'play';

function openCardModal(indexOrNum, zone) {
  modalCardZone = zone || 'play';
  let cardInstance;
  if (zone === 'staging') {
    modalCardIndex = indexOrNum; // index réel pour staging
    cardInstance = gameState.staging[indexOrNum].cardInstance;
  } else {
    // pour play, indexOrNum est un numéro de carte stable
    modalCardIndex = indexOrNum;
    const idx = _playIdxByNum(indexOrNum);
    cardInstance = idx >= 0 ? gameState.play[idx] : null;
    if (!cardInstance) return;
  }
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
  if (modalCardIndex !== null) {
    bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
    stageProduceCard(modalCardIndex); // modalCardIndex est maintenant un numéro
    modalCardIndex = null;
  }
}
function upgradeFromModal() {
  if (modalCardIndex !== null) {
    bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
    stageUpgradeCard(modalCardIndex); // modalCardIndex est maintenant un numéro
    modalCardIndex = null;
  }
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
//  EXPORT / IMPORT DE PARTIE
// ============================================================

// ── Clé localStorage ────────────────────────────────────────
const SESSION_KEY = 'bigdom-autosave';

// ── Sérialisation partagée (utilisée par exportGame ET _autosave) ─
function _buildSaveObject() {
  // Filtre les entrées invalides avant de sérialiser
  const serializeCards = (list) =>
    (list || [])
      .filter(ci => ci && ci.cardDef && ci.cardDef.numero != null)
      .map(ci => ({ n: ci.cardDef.numero, f: ci.currentFace || 1 }));

  // Rendu lisible d'une carte
  const readableCard = (ci) => {
    if (!ci || !ci.cardDef) return null;
    const face = getFaceData(ci);
    return {
      numero:      ci.cardDef.numero,
      face_active: ci.currentFace || 1,
      nom:  face?.nom  || ci.cardDef.nom  || `Carte #${ci.cardDef.numero}`,
      type: face?.type || ci.cardDef.type || '—',
    };
  };
  const readableList = (list) =>
    (list || []).map(readableCard).filter(Boolean);

  // Rendu lisible du staging
  const readableStaging = (list) =>
    (list || []).filter(e => e && e.cardInstance && e.cardInstance.cardDef).map(e => {
      const face = getFaceData(e.cardInstance);
      const res  = Object.entries(e.resourcesGained || {})
        .filter(([,v]) => v > 0)
        .map(([k,v]) => `+${v} ${k}`).join(', ');
      return {
        numero:    e.cardInstance.cardDef.numero,
        face_active: e.cardInstance.currentFace || 1,
        nom:       face?.nom || `Carte #${e.cardInstance.cardDef.numero}`,
        type:      face?.type || '—',
        action:    e.action,
        ressources_attendues: res || '—',
        fame_attendu: e.fameGained || 0,
        promotion_vers_face: e.newFace || null,
        sacrifice: (e.sacrificeCardInstance && e.sacrificeCardInstance.cardDef)
          ? readableCard(e.sacrificeCardInstance)
          : null,
      };
    });

  const now     = new Date();
  const kingdom = gameState.kingdomName || 'Inconnu';

  return {
    meta: {
      version:      2,
      date:         now.toISOString(),
      date_lisible: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`,
      nom_fichier:  `${kingdom} — Manche ${gameState.round} Tour ${gameState.turn}`,
    },
    royaume: {
      nom:    kingdom,
      gloire: gameState.fame,
      manche: gameState.round,
      tour:   gameState.turn,
    },
    ressources: { ...gameState.resources },
    zones: {
      en_jeu: {
        label:  'Cartes dans la zone de jeu',
        nombre: gameState.play.length,
        cartes: readableList(gameState.play),
      },
      en_attente: {
        label:  'Cartes en attente de confirmation (staging)',
        nombre: gameState.staging.length,
        cartes: readableStaging(gameState.staging),
      },
      permanentes: {
        label:  'Cartes permanentes',
        nombre: gameState.permanent.length,
        cartes: readableList(gameState.permanent),
      },
      defaussees: {
        label:  'Cartes défaussées',
        nombre: gameState.discard.length,
        cartes: readableList(gameState.discard),
      },
      detruites: {
        label:  'Cartes détruites / sacrifiées',
        nombre: (gameState.destroyed || []).length,
        cartes: readableList(gameState.destroyed || []),
      },
      pioche: {
        label:  'Cartes en pioche (ordre non garanti)',
        nombre: gameState.deck.length,
        cartes: readableList(gameState.deck),
      },
    },
    _tech: {
      v: 1,
      turnStarted:        gameState.turnStarted,
      gameOver:           gameState.gameOver,
      _heritageTriggered: gameState._heritageTriggered || false,
      armeeProgress:      gameState.armeeProgress || { face:1, casesMarquees:0 },
      armeeGloirePrev:    gameState.armeeGloirePrev || 0,
      retained:           gameState.retained || [],
      nextDiscoverIndex:  gameState.nextDiscoverIndex,
      cardStateMap:       cardStateMap,
      choiceNeeded:       [...choiceNeeded],
      deck:               serializeCards(gameState.deck),
      play:               serializeCards(gameState.play),
      discard:            serializeCards(gameState.discard),
      permanent:          serializeCards(gameState.permanent),
      destroyed:          serializeCards(gameState.destroyed || []),
      box:                serializeCards(gameState.box),
      staging: (gameState.staging || [])
        .filter(e => e && e.cardInstance && e.cardInstance.cardDef)
        .map(e => ({
          n: e.cardInstance.cardDef.numero,
          f: e.cardInstance.currentFace || 1,
          action: e.action,
          resourcesGained: e.resourcesGained,
          fameGained: e.fameGained,
          newFace: e.newFace,
          cout: e.cout,
          sacN: e.sacrificeCardInstance?.cardDef?.numero ?? null,
          sacF: e.sacrificeCardInstance?.currentFace    ?? null,
        })),
      bandits: (gameState.bandits || []).map(b => ({
        bN:  b.banditNum,
        blN: b.blockedNum ?? null,
      })),
    },
  };
}

// ── Sauvegarde automatique silencieuse en localStorage ──────
function _autosave() {
  if (!gameState.kingdomName) return; // partie pas encore nommée
  try {
    const save = _buildSaveObject();
    localStorage.setItem(SESSION_KEY, JSON.stringify(save));
  } catch (e) {
    // localStorage peut être saturé ou désactivé — on ignore silencieusement
    console.warn('Autosave localStorage échoué :', e);
  }
}

// ── Restauration de la session au chargement de la page ───────
function _restoreAutosave() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const save = JSON.parse(raw);
    if (!save || !save._tech) return false;
    _applyImport(save);
    addLog(`🔄 Session restaurée automatiquement — <strong>${gameState.kingdomName}</strong>.`, true);
    return true;
  } catch (e) {
    console.warn('Restauration session échouée :', e);
    return false;
  }
}

function confirmRestartGame() {
  new bootstrap.Modal(document.getElementById('restartModal')).show();
}

function doRestartGame() {
  bootstrap.Modal.getInstance(document.getElementById('restartModal'))?.hide();

  // Effacer la sauvegarde locale
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}

  // Réinitialiser complètement toutes les variables globales
  cardStateMap = {};
  choiceNeeded = new Set();
  ALL_CARDS = [
    ...BEGIN_CARDS,
    ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : []),
  ];

  // Remettre gameState à zéro immédiatement (vide l'UI pendant le modal de nom)
  gameState = {
    deck: [], play: [], staging: [], discard: [], permanent: [], destroyed: [],
    retained: [], box: [], nextDiscoverIndex: 0,
    resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 },
    fame: 0, round: 1, turn: 1, turnStarted: false, gameOver: false,
    bandits: [], _heritageTriggered: false, kingdomName: '',
  };

  // Vider le log
  $('#gameLog').empty();

  updateUI();

  // Relancer le modal de nom de royaume
  initGame();
}

function exportGame() {
  const save = _buildSaveObject();

  // ── Téléchargement ────────────────────────────────────────
  const kingdom  = gameState.kingdomName || 'royaume';
  const slug     = kingdom.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
                          .replace(/[^a-zA-Z0-9 ]/g,'').trim()
                          .replace(/\s+/g,'-').toLowerCase();
  const filename = `${slug}-m${gameState.round}-t${gameState.turn}.json`;

  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  addLog(`💾 Partie sauvegardée — <strong>${kingdom}</strong>, Manche ${gameState.round} Tour ${gameState.turn}.`, true);
}

function importGame() {
  const input  = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        _applyImport(JSON.parse(ev.target.result));
      } catch (err) {
        alert('❌ Fichier invalide ou corrompu.\n' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function _resolveCard(ref) {
  const cardDef = ALL_CARDS.find(c => c.numero === ref.n);
  if (!cardDef) { console.warn(`Carte #${ref.n} introuvable`); return null; }
  return { cardDef, currentFace: ref.f || 1 };
}

function _applyImport(raw) {
  // Compatibilité : format v2 (nouveau) porte les données techniques dans raw._tech
  // Format v1 (ancien) les porte à la racine
  const isV2 = raw && raw._tech && raw.meta;
  const save  = isV2 ? raw._tech  : raw;
  const meta  = isV2 ? raw.meta   : raw;
  const info  = isV2 ? raw.royaume: raw;

  if (!save || save.v !== 1) {
    alert('❌ Format de sauvegarde non reconnu.'); return;
  }

  cardStateMap = {};
  Object.entries(save.cardStateMap || {}).forEach(([k, v]) => {
    cardStateMap[parseInt(k)] = v;
  });
  choiceNeeded = new Set((save.choiceNeeded || []).map(Number));

  const resolve = (list) => (list || []).map(_resolveCard).filter(Boolean);
  const play = resolve(save.play);

  const staging = (save.staging || []).map(e => {
    const ci = _resolveCard({ n: e.n, f: e.f });
    if (!ci) return null;
    const entry = {
      cardInstance: ci,
      action: e.action,
      resourcesGained: e.resourcesGained || {},
      fameGained: e.fameGained || 0,
      newFace: e.newFace || null,
      cout: e.cout || [],
    };
    if (e.sacN) {
      const sc = _resolveCard({ n: e.sacN, f: e.sacF || 1 });
      if (sc) entry.sacrificeCardInstance = sc;
    }
    return entry;
  }).filter(Boolean);

  const bandits = (save.bandits || [])
    .filter(b => b.bN != null && play.some(ci => ci.cardDef.numero === b.bN))
    .map(b => ({
      banditNum:  b.bN,
      blockedNum: b.blN ?? null,
    }));

  gameState = {
    deck:      resolve(save.deck),
    play,
    staging,
    discard:   resolve(save.discard),
    permanent: resolve(save.permanent),
    destroyed: resolve(save.destroyed || []),
    box:       resolve(save.box),
    nextDiscoverIndex: save.nextDiscoverIndex || 0,
    resources: { ...(isV2 ? raw.ressources : save.resources) },
    fame:        (isV2 ? info.gloire  : save.fame)   || 0,
    round:       (isV2 ? info.manche  : save.round)  || 1,
    turn:        (isV2 ? info.tour    : save.turn)   || 1,
    turnStarted: save.turnStarted || false,
    gameOver:    save.gameOver    || false,
    _heritageTriggered: save._heritageTriggered || false,
    armeeProgress:      save.armeeProgress      || { face:1, casesMarquees:0 },
    armeeGloirePrev:    save.armeeGloirePrev     || 0,
    retained:           save.retained            || [],
    kingdomName: (isV2 ? info.nom : save.kingdomName) || 'Valdermoor',
    bandits,
  };

  $('#gameLog').empty();
  const dateRaw = isV2 ? raw.meta.date : save.date;
  const d = new Date(dateRaw);
  const dateLabel = isNaN(d.getTime()) ? ''
    : ` (${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })})`;
  addLog(`📂 Partie chargée${dateLabel}.`, true);
  addLog(`⚜ <strong>${gameState.kingdomName}</strong> — Manche ${gameState.round}, Tour ${gameState.turn} — ${gameState.deck.length} cartes en pioche.`);
  updateUI();
}


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

// ============================================================
//  INIT
// ============================================================
$(document).ready(function() {
  // Si une session existe, la restaurer silencieusement
  if (!_restoreAutosave()) {
    // Sinon, démarrer une nouvelle partie
    initGame();
  }
});