// ============================================================
//  RENDER — cartes en jeu
// ============================================================
function buildCardFrontHTML(cardInstance, playIndex) {
  const face = getFaceData(cardInstance);
  const hasUpgrade = !!(face.promotion || (face.promotions && face.promotions.length > 0));
  const hasResources = face.ressources && face.ressources.length > 0;
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
  const allPromos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  const upgradeAlreadyStaged = gameState.staging.some(e => e.action === 'upgrade');
  const canUpgrade = hasUpgrade && !upgradeAlreadyStaged && allPromos.some(p => (p.cout||[]).every(c => (projected[normalizeRes(c.type)]||0) >= c.quantite));
  const canDefeat = banditCard && (projected['Epée'] || 0) >= 1;

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

  const hasActivable = hasActivableEffect(cardInstance);
  const canActivate = hasActivable && canActivateEffect(cardInstance);
  const hasDestruction = hasDestructionEffect(cardInstance);
  const hasRetention = _hasRetentionEffect(cardInstance);
  const isAlreadyRetained = (gameState.retainedCards || []).some(c => c.cardDef.numero === cardInstance.cardDef.numero);
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
        ${hasUpgrade && !banditCard ? `<div class="card-upgrade-hint${canUpgrade?' can-upgrade':''}">▲ ${allPromos.map(p => formatCostHint(p.cout||[])).join(' | ')}</div>` : ''}
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

  let sacrificeHTML = '';
  if (entry.sacrificeCardInstance) {
    const sf = getFaceData(entry.sacrificeCardInstance);
    sacrificeHTML = `
    <div class="staging-card-wrapper staging-sacrifice-wrapper" title="Carte sacrifiée — ne peut pas être annulée seule">
      <div class="staging-card staging-sacrifice-card" style="border-color:#cc440040;background:linear-gradient(160deg,#2a0a0a,#0e0808);">
        <div class="staging-label" style="color:#ff8888;">🔥 SACRIFICE</div>
        <div class="staging-emoji">${getCardEmoji(sf.type, sf.nom)}</div>
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
  if (cardInstance.cardDef._level1) {
    const rawCard = cardInstance.cardDef._level1;

    // Rendu spécial carte 25 — Armée
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
          <div class="card-front card-permanent" style="border-color:#cc4444;background:linear-gradient(160deg,#1a0a0a,#0e0606);">
            <div class="card-serial" style="font-size:0.45rem;color:#ff8888;">#25</div>
            <div class="card-name" style="font-size:0.5rem;color:#ffaaaa;">${nomAffiche}</div>
            <span class="card-type-badge" style="font-size:0.38rem;background:#7a1a1a;">Progression</span>
            <div style="font-size:1.4rem;margin:4px 0;">⚔️</div>
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

    // Rendu générique Héritage
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
    const facesHTML = rawCard.faces
      ? `<div style="font-size:0.38rem;color:#6a9adf;text-align:center;margin-top:2px;">${rawCard.faces.length} niveaux</div>`
      : '';

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

// ============================================================
//  RENDER — cartes retenues (zone rétention carte 83)
// ============================================================
function buildRetainedCardHTML(cardInstance) {
  const face = getFaceData(cardInstance);
  const cardNum = cardInstance.cardDef.numero;
  const totalFaces = cardInstance.cardDef.faces.length;
  const progressPct = ((cardInstance.currentFace - 1) / Math.max(1, totalFaces - 1)) * 100;

  const resHTML = (face.ressources||[]).map(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.map(t => `<span class="resource-pip" style="font-size:0.48rem;">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
  }).join('');

  const projected = getProjectedResources();
  const allPromos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  const upgradeAlreadyStaged = gameState.staging.some(e => e.action === 'upgrade');
  const canUpgrade = allPromos.length > 0 && !upgradeAlreadyStaged &&
    allPromos.some(p => (p.cout||[]).every(c => (projected[normalizeRes(c.type)]||0) >= c.quantite));

  const hasActivable = hasActivableEffect(cardInstance);
  const canActivate  = hasActivable && canActivateEffect(cardInstance);
  const hasResources = face.ressources && face.ressources.length > 0;

  const actionBtns = [];
  if (hasResources) actionBtns.push(`<button class="card-action-btn btn-discard-action" onclick="event.stopPropagation();stageProduceRetainedCard(${cardNum})" title="Produire (défausse la carte retenue)">⚒ Prod.</button>`);
  if (hasActivable)  actionBtns.push(`<button class="card-action-btn btn-activate-action${canActivate?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageActivateRetainedEffect(${cardNum})" title="Effet activable">🟢 Activer</button>`);
  if (allPromos.length > 0) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgrade?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeRetainedCard(${cardNum})" title="Promouvoir">▲ Prom.</button>`);

  return `
    <div class="card-wrapper card-wrapper-retained" data-retained-num="${cardNum}">
      <div class="card card-front card-retained" onclick="openCardModal(${cardNum},'retained')"
           style="cursor:pointer;background:linear-gradient(160deg,#1a1a2a,#0e0e1e);border-color:#8866cc;">
        ${face.victoire!==undefined ? `<div class="card-victory" style="background:#553399;">${face.victoire>0?'★':''}${face.victoire}</div>` : ''}
        <div class="card-serial" style="color:#b088ee;">#${cardNum} <span style="font-size:0.38rem;opacity:0.6;">${cardInstance.currentFace}/${totalFaces}</span></div>
        <div class="card-name" style="color:#d0aaff;">${face.nom}</div>
        <span class="card-type-badge" style="background:#553399;font-size:0.42rem;">${face.type}</span>
        <div class="card-img-area">${getCardEmoji(face.type, face.nom)}</div>
        <div class="card-resources">${resHTML}</div>
        ${allPromos.length > 0 ? `<div class="card-upgrade-hint${canUpgrade?' can-upgrade':''}">▲ ${allPromos.map(p => formatCostHint(p.cout||[])).join(' | ')}</div>` : ''}
        <div class="card-progress"><div style="width:${progressPct}%;height:100%;background:#8866cc;border-radius:0 0 0 8px;"></div></div>
        <div style="text-align:center;font-size:0.42rem;color:#b088ee;font-family:'Cinzel',serif;margin-top:2px;">🕊️ RETENUE</div>
      </div>
      <div class="card-actions">
        ${actionBtns.join('')}
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
  const projected = getProjectedResources();
  Object.entries(gameState.resources).forEach(([key, val]) => {
    const id = 'res-' + key.toLowerCase().replace('é','e').replace('è','e');
    const $el = $(`#${id}`); if (!$el.length) return;
    const diff = (projected[key]||0) - val;
    if (diff > 0) $el.html(`${val} <span class="res-preview res-plus">+${diff}</span>`);
    else if (diff < 0) $el.html(`${val} <span class="res-preview res-minus">${diff}</span>`);
    else $el.text(val);
  });

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
      ? `<div class="card-upgrade-hint" style="font-size:0.38rem;">▲ ${topPromos.map(p => formatCostHint(p.cout||[])).join(' | ')}</div>`
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

  const rem = gameState.box.length - gameState.nextDiscoverIndex;
  $('#boxCount').text(`📦 ${rem} à découvrir`);
  const nx = gameState.box[gameState.nextDiscoverIndex];
  const nx2 = gameState.box[gameState.nextDiscoverIndex+1];
  $('#nextDiscoverInfo').text(nx ? `Prochaine: #${nx.cardDef ? nx.cardDef.numero : nx.numero}${nx2?` & #${nx2.cardDef ? nx2.cardDef.numero : nx2.numero}`:''}` : 'Boîte vide');

  const $perm = $('#permanentArea');
  if ($perm.length)
    $perm.html(gameState.permanent.length===0
      ? '<div style="font-family:\'Cinzel\',serif;font-size:0.55rem;color:rgba(200,150,12,0.25);text-align:center;padding:8px;">Aucune carte permanente</div>'
      : gameState.permanent.map(c => buildPermanentCardHTML(c)).join(''));

  // ── Zone cartes retenues (carte 83) ──
  const retained = gameState.retainedCards || [];
  const $retCol  = $('#retainedColumn');
  const $retDiv  = $('#retainedDivider');
  const $retArea = $('#retainedArea');
  if ($retCol.length) {
    if (retained.length > 0) {
      $retCol.show(); $retDiv.show();
      $retArea.html(retained.map(c => buildRetainedCardHTML(c)).join(''));
    } else {
      $retCol.hide(); $retDiv.hide();
    }
  }

  const $play = $('#playArea');
  $play.html(gameState.play.length===0
    ? '<div class="play-area-empty"><span class="empty-icon">🏰</span><span class="empty-text">Zone de Jeu<br>Piochez des cartes pour commencer</span></div>'
    : gameState.play.map((c,i) => buildCardFrontHTML(c,i)).join(''));
  $('#statPlay').text(gameState.play.length + gameState.staging.length);

  const hasStagingCards = gameState.staging.length > 0;
  $('#stagingZone').toggle(hasStagingCards);
  if (hasStagingCards) {
    $('#stagingArea').html(gameState.staging.map((e,i) => buildStagingCardHTML(e,i)).join(''));

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

  const dc = gameState.discard.length;
  $('#discardCount').text(`${dc} carte${dc!==1?'s':''}`);
  $('#statDiscard').text(dc);
  if (dc===0) { $('#discardVisual').hide(); $('#discardEmpty').show(); }
  else { $('#discardEmpty').hide(); $('#discardVisual').show(); $('#topDiscardCard').html(buildDiscardTopHTML(gameState.discard[dc-1])); }

  $('#statTurn').text(gameState.turn);
  $('#statRound').text(gameState.round);
  $('#fameScore').text(gameState.fame);
  const total = gameState.deck.length + gameState.play.length + gameState.discard.length + gameState.permanent.length + gameState.staging.length;
  if ($('#statKingdom').length) $('#statKingdom').text(total);

  if (gameState.gameOver)
    $('#roundBadge').text(`⚔ DERNIÈRE MANCHE — Tour ${gameState.turn}`).css('color','#ff8888');
  else
    $('#roundBadge').text(`Manche ${gameState.round} — Tour ${gameState.turn}`).css('color','');

  if (gameState.kingdomName) _updateKingdomNameUI(gameState.kingdomName);

  const canDraw    = gameState.deck.length > 0 && !gameState.turnStarted;
  const canAdvance = gameState.deck.length > 0 && gameState.turnStarted;
  const canPioche  = canDraw || canAdvance;

  $('#btnDraw')
    .prop('disabled', !canPioche)
    .css('opacity', canPioche ? 1 : 0.4)
    .text('⚡ Avancer (+2 cartes)')
    .attr('onclick',  'drawCards(2)');
  $('#btnAdvance').hide();

  const canUndo = !!_drawSnapshot && gameState.staging.length === 0;
  $('#btnUndo').toggle(canUndo).prop('disabled', !canUndo);

  const canPass = gameState.play.length > 0 || gameState.staging.length > 0;
  $('#btnPass').prop('disabled', !canPass).css('opacity', canPass ? 1 : 0.4)
    .attr('title', canPass ? '' : 'Aucune carte à jouer');

  _autosave();
}

function addLog(msg, important=false) {
  $('#gameLog').prepend(`<div class="${important?'log-entry log-important':'log-entry'}">${msg}</div>`);
}

// ============================================================
//  MODAL — détail d'une carte
// ============================================================
let modalCardIndex = null;
let modalCardZone = 'play';

function openCardModal(indexOrNum, zone) {
  modalCardZone = zone || 'play';
  let cardInstance;
  if (zone === 'staging') {
    modalCardIndex = indexOrNum;
    cardInstance = gameState.staging[indexOrNum].cardInstance;
  } else if (zone === 'retained') {
    modalCardIndex = indexOrNum;
    cardInstance = (gameState.retainedCards || []).find(c => c.cardDef.numero === indexOrNum);
    if (!cardInstance) return;
  } else {
    modalCardIndex = indexOrNum;
    const idx = _playIdxByNum(indexOrNum);
    cardInstance = idx >= 0 ? gameState.play[idx] : null;
    if (!cardInstance) return;
  }
  const face = getFaceData(cardInstance);

  $('#modalCardName').text(`${getCardEmoji(face.type,face.nom)} ${face.nom}`);
  let body = `<p><strong>Type:</strong> ${face.type} &nbsp;|&nbsp; <strong>#${cardInstance.cardDef.numero}</strong></p>`;
  if (face.description) {
    body += `<p style="font-style:italic;color:var(--stone,#888);font-size:0.88rem;border-left:3px solid var(--gold,#c8a00c);padding-left:10px;margin:6px 0 10px;">${face.description}</p>`;
  }
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
  const inPlay = zone !== 'staging';
  const isRetained = zone === 'retained';
  const hasModalUpgrade = !!(face.promotion || (face.promotions && face.promotions.length > 0));
  const hasModalActivable = inPlay && hasActivableEffect(cardInstance);
  const canModalActivate = hasModalActivable && canActivateEffect(cardInstance);
  $('#modalProduceBtn')
    .toggle(inPlay && !!(face.ressources && face.ressources.length))
    .off('click').on('click', () => {
      bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
      if (isRetained) stageProduceRetainedCard(modalCardIndex);
      else stageProduceCard(modalCardIndex);
      modalCardIndex = null;
    });
  $('#modalUpgradeBtn')
    .toggle(inPlay && hasModalUpgrade)
    .off('click').on('click', () => {
      bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
      if (isRetained) stageUpgradeRetainedCard(modalCardIndex);
      else stageUpgradeCard(modalCardIndex);
      modalCardIndex = null;
    });
  $('#modalActivateBtn')
    .toggle(hasModalActivable)
    .prop('disabled', !canModalActivate)
    .css('opacity', canModalActivate ? 1 : 0.5)
    .attr('title', canModalActivate ? '' : 'Ressources insuffisantes ou conditions non remplies')
    .off('click').on('click', () => {
      bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
      if (isRetained) stageActivateRetainedEffect(modalCardIndex);
      else stageActivateEffect(modalCardIndex);
      modalCardIndex = null;
    });
  new bootstrap.Modal(document.getElementById('cardModal')).show();
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