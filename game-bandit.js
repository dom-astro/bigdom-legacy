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
  bootstrap.Modal.getInstance(document.getElementById('banditRewardModal'))?.hide();
  const choices = window._banditRewardChoices || [];
  if (choices.length < 2 || pendingBanditDefeat === null) return;

  const banditNum = pendingBanditDefeat;
  pendingBanditDefeat = null;

  // Chercher le bandit dans play[] en priorité, puis dans retainedCards[]
  const banditPlayIndex = _playIndexOf(banditNum);
  let banditCard = null;

  if (banditPlayIndex >= 0) {
    // Bandit en zone de jeu — _playRemove nettoie aussi bandits[]
    banditCard = gameState.play[banditPlayIndex];
    _playRemove(banditPlayIndex);
  } else {
    // Bandit dans la zone de retenue
    const retIdx = (gameState.retainedCards || []).findIndex(c => c.cardDef.numero === banditNum);
    if (retIdx < 0) return; // introuvable nulle part
    banditCard = gameState.retainedCards[retIdx];
    gameState.retainedCards.splice(retIdx, 1);
    // Nettoyer manuellement bandits[] et retained[] (normalement géré par _playRemove)
    updateBanditIndices(banditNum);
    if (gameState.retained) {
      const rIdx = gameState.retained.indexOf(banditNum);
      if (rIdx >= 0) gameState.retained.splice(rIdx, 1);
    }
  }

  // Dépenser 1 Épée et créditer les ressources choisies
  gameState.resources['Epée'] = Math.max(0, gameState.resources['Epée'] - 1);
  choices.forEach(r => { gameState.resources[r] = (gameState.resources[r] || 0) + 1; });

  // Placer le bandit dans les cartes détruites/sacrifiées
  if (!gameState.destroyed) gameState.destroyed = [];
  gameState.destroyed.push(banditCard);

  const resParts = choices.map(r => `${RESOURCE_ICONS[r]} ${r}`).join(' + ');
  addLog(`⚔️ <span class="log-card">Bandit</span> vaincu ! -1⚔️ +${resParts}`, true);
  updateUI();
}