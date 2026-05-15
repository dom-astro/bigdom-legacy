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