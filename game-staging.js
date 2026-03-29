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
  // Bonus des autocollants Héritage (carte #24 / Export)
  if (typeof getStickerResourceBonusForCard === 'function') {
    const stickerBonus = getStickerResourceBonusForCard(cardInstance.cardDef.numero);
    Object.entries(stickerBonus).forEach(([k, v]) => {
      if (gameState.resources[k] !== undefined)
        resourcesGained[k] = (resourcesGained[k]||0) + v;
    });
  }

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

    // Construire le contenu du tooltip parchemin
    let tooltipLines = [];
    if (targetFace && targetFace.description) {
      tooltipLines.push(`<em>${targetFace.description}</em>`);
    }
    if (targetFace && targetFace.ressources && targetFace.ressources.length) {
      const resStr = targetFace.ressources.map(r => {
        const types = Array.isArray(r.type) ? r.type : [r.type];
        return types.map(t => `${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}`).join(' ');
      }).join(' · ');
      tooltipLines.push(`<span class="promo-tooltip-res">⚒ ${resStr}</span>`);
    }
    if (targetFace && targetFace.effet) {
      const effets = Array.isArray(targetFace.effet) ? targetFace.effet : [targetFace.effet];
      effets.forEach(e => {
        const ico = e.type === 'Activable' ? '🟢' : e.type === 'Passif' ? '🔵' : e.type === 'Destruction' ? '🔴' : '⚡';
        const defLabel = e.defausse === true ? ' · Défausse' : e.defausse === false ? ' · Réutilisable' : '';
        tooltipLines.push(`<span class="promo-tooltip-effect">${ico} <strong>${e.type}</strong>${defLabel}${e.description ? ' — ' + e.description : ''}</span>`);
      });
    }
    const tooltipHTML = tooltipLines.length
      ? `<div class="promo-tooltip">${tooltipLines.join('<hr class="promo-tooltip-sep">')}</div>`
      : '';

    html += `<div class="promo-btn-wrap">
      <button onclick="selectPromoChoice(${playIndex}, ${i})" class="bandit-choice-btn promo-choice-btn">
        ${emoji} <strong>${targetFace ? targetFace.nom : '?'}</strong>
        <span style="font-size:0.75rem;opacity:0.8;"> — Coût: ${coutStr}${fame}</span>
      </button>
      ${tooltipHTML}
    </div>`;
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
//  STAY-IN-PLAY — actions depuis la zone "Reste en jeu"
// ============================================================

// Staging production depuis stayInPlay (la carte reste dans stayInPlay après confirmation)
function stageProduceStayCard(cardNum) {
  if (!gameState.stayInPlay) return;
  const ci = gameState.stayInPlay.find(c => c.cardDef.numero === cardNum);
  if (!ci) return;
  const faceData = getFaceData(ci);

  if (!faceData.ressources || faceData.ressources.length === 0) {
    addLog(`❌ <span class="log-card">${faceData.nom}</span> n'a pas de production.`);
    return;
  }

  const resourcesGained = {};
  faceData.ressources.forEach(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    const key = normalizeRes(types[0]);
    if (key && gameState.resources[key] !== undefined)
      resourcesGained[key] = (resourcesGained[key]||0) + r.quantite;
  });
  if (typeof getStickerResourceBonusForCard === 'function') {
    const stickerBonus = getStickerResourceBonusForCard(ci.cardDef.numero);
    Object.entries(stickerBonus).forEach(([k, v]) => {
      if (gameState.resources[k] !== undefined)
        resourcesGained[k] = (resourcesGained[k]||0) + v;
    });
  }

  // Retirer de stayInPlay pour le staging — sera défaussée après (la carte perd son statut)
  gameState.stayInPlay = gameState.stayInPlay.filter(c => c.cardDef.numero !== cardNum);
  gameState.staging.push({ cardInstance: ci, action: 'produce', resourcesGained, fameGained: 0, newFace: null, cout: null, fromStayInPlay: true });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> — production en attente (quitte la zone).`);
  updateUI();
}

// Staging promotion depuis stayInPlay
function stageUpgradeStayCard(cardNum) {
  if (!gameState.stayInPlay) return;
  const ci = gameState.stayInPlay.find(c => c.cardDef.numero === cardNum);
  if (!ci) return;
  const faceData = getFaceData(ci);

  if (gameState.staging.some(e => e.action === 'upgrade')) {
    addLog(`❌ Vous ne pouvez promouvoir qu'une seule carte par tour.`);
    return;
  }

  const allPromos = faceData.promotions ? faceData.promotions : (faceData.promotion ? [faceData.promotion] : []);
  if (allPromos.length === 0) {
    addLog(`❌ <span class="log-card">${faceData.nom}</span> ne peut pas être promue.`);
    return;
  }

  const projected = getProjectedResources();
  const affordablePromos = allPromos.filter(promo =>
    (promo.cout || []).every(c => (projected[normalizeRes(c.type)] || 0) >= c.quantite)
  );

  if (affordablePromos.length === 0) {
    const costs = allPromos.map(p => formatCost(p.cout || [])).join(' ou ');
    addLog(`💰 Ressources insuffisantes pour promouvoir <span class="log-card">${faceData.nom}</span>. Coût: ${costs}`);
    return;
  }

  gameState.stayInPlay = gameState.stayInPlay.filter(c => c.cardDef.numero !== cardNum);

  // Simuler _doStageUpgrade avec la carte issue de stayInPlay
  const promo = affordablePromos[0];
  const cout = promo.cout || [];
  const newFace = promo.face;
  const newFaceData = ci.cardDef.faces.find(f => f.face === newFace);
  const fameGained = newFaceData && newFaceData.victoire ? newFaceData.victoire : 0;
  gameState.staging.push({ cardInstance: ci, action: 'upgrade', resourcesGained: {}, fameGained, newFace, cout, fromStayInPlay: true });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> → <span class="log-card">${newFaceData ? newFaceData.nom : '?'}</span> — promotion en attente.`);
  updateUI();
}

// Annulation : remet la carte dans stayInPlay si elle en venait
function cancelStagingStay(stagingIndex) {
  const entry = gameState.staging[stagingIndex];
  if (!entry) return;
  if (entry.fromRetainedCards) {
    gameState.staging.splice(stagingIndex, 1);
    if (!gameState.retainedCards) gameState.retainedCards = [];
    gameState.retainedCards.push(entry.cardInstance);
    addLog(`↩ <span class="log-card">${getFaceData(entry.cardInstance).nom}</span> — action annulée, retour en zone retenue.`);
    updateUI();
  } else if (entry.fromStayInPlay) {
    gameState.staging.splice(stagingIndex, 1);
    if (!gameState.stayInPlay) gameState.stayInPlay = [];
    gameState.stayInPlay.push(entry.cardInstance);
    addLog(`↩ <span class="log-card">${getFaceData(entry.cardInstance).nom}</span> — action annulée, retour en zone reste en jeu.`);
    updateUI();
  } else {
    cancelStaging(stagingIndex);
  }
}

// ============================================================
//  RETAINED CARDS — actions depuis la zone "Cartes Retenues"
// ============================================================

function stageProduceRetainedCard(cardNum) {
  if (!gameState.retainedCards) return;
  const ci = gameState.retainedCards.find(c => c.cardDef.numero === cardNum);
  if (!ci) return;
  const faceData = getFaceData(ci);

  if (!faceData.ressources || faceData.ressources.length === 0) {
    addLog(`❌ <span class="log-card">${faceData.nom}</span> n'a pas de production.`);
    return;
  }

  const resourcesGained = {};
  faceData.ressources.forEach(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    const key = normalizeRes(types[0]);
    if (key && gameState.resources[key] !== undefined)
      resourcesGained[key] = (resourcesGained[key]||0) + r.quantite;
  });
  if (typeof getStickerResourceBonusForCard === 'function') {
    const stickerBonus = getStickerResourceBonusForCard(ci.cardDef.numero);
    Object.entries(stickerBonus).forEach(([k, v]) => {
      if (gameState.resources[k] !== undefined)
        resourcesGained[k] = (resourcesGained[k]||0) + v;
    });
  }

  gameState.retainedCards = gameState.retainedCards.filter(c => c.cardDef.numero !== cardNum);
  gameState.staging.push({ cardInstance: ci, action: 'produce', resourcesGained, fameGained: 0, newFace: null, cout: null, fromRetainedCards: true });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> — production en attente.`);
  updateUI();
}

function stageUpgradeRetainedCard(cardNum) {
  if (!gameState.retainedCards) return;
  const ci = gameState.retainedCards.find(c => c.cardDef.numero === cardNum);
  if (!ci) return;
  const faceData = getFaceData(ci);

  if (gameState.staging.some(e => e.action === 'upgrade')) {
    addLog(`❌ Vous ne pouvez promouvoir qu'une seule carte par tour.`);
    return;
  }

  const allPromos = faceData.promotions ? faceData.promotions : (faceData.promotion ? [faceData.promotion] : []);
  if (allPromos.length === 0) {
    addLog(`❌ <span class="log-card">${faceData.nom}</span> ne peut pas être promue.`);
    return;
  }

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
    _doStageUpgradeRetained(ci, affordablePromos[0]);
  } else {
    // Plusieurs promotions payables : placer temporairement dans play[] pour réutiliser showPromoChoiceModal
    gameState.retainedCards = gameState.retainedCards.filter(c => c.cardDef.numero !== cardNum);
    gameState.play.push(ci);
    const playIdx = gameState.play.length - 1;
    // Marquer pour que _doStageUpgrade sache d'où elle vient
    window._pendingRetainedUpgradeNum = cardNum;
    showPromoChoiceModal(playIdx, affordablePromos);
  }
}

function _doStageUpgradeRetained(ci, promo) {
  const faceData = getFaceData(ci);
  const cout = promo.cout || [];
  const newFace = promo.face;
  const newFaceData = ci.cardDef.faces.find(f => f.face === newFace);
  const fameGained = newFaceData && newFaceData.victoire ? newFaceData.victoire : 0;

  gameState.retainedCards = (gameState.retainedCards || []).filter(c => c.cardDef.numero !== ci.cardDef.numero);
  gameState.staging.push({ cardInstance: ci, action: 'upgrade', resourcesGained: {}, fameGained, newFace, cout, fromRetainedCards: true });
  addLog(`⏳ <span class="log-card">${faceData.nom}</span> → <span class="log-card">${newFaceData ? newFaceData.nom : '?'}</span> — promotion en attente.`);
  updateUI();
}

function stageActivateRetainedEffect(cardNum) {
  if (!gameState.retainedCards) return;
  const ci = gameState.retainedCards.find(c => c.cardDef.numero === cardNum);
  if (!ci) return;

  // Déplacer temporairement la carte dans play[] pour réutiliser stageActivateEffect
  gameState.retainedCards = gameState.retainedCards.filter(c => c.cardDef.numero !== cardNum);
  gameState.play.push(ci);

  // Mémoriser le numéro pour marquer l'entrée de staging après coup
  window._pendingRetainedActivateNum = cardNum;
  stageActivateEffect(cardNum);

  // Si stageActivateEffect a bien mis la carte en staging, marquer fromRetainedCards
  const stagingEntry = gameState.staging.find(e => e.cardInstance.cardDef.numero === cardNum);
  if (stagingEntry) {
    stagingEntry.fromRetainedCards = true;
  } else {
    // L'activation a échoué ou ouvert un modal — si la carte est revenue dans play[], la remettre en retainedCards
    const playIdx = gameState.play.findIndex(c => c.cardDef.numero === cardNum);
    if (playIdx >= 0) {
      gameState.play.splice(playIdx, 1);
      if (!gameState.retainedCards) gameState.retainedCards = [];
      gameState.retainedCards.push(ci);
    }
    window._pendingRetainedActivateNum = null;
  }
}