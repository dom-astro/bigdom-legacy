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