// ============================================================
//  GESTIONNAIRE DE CLICS (simple/double)
// ============================================================
const cardClickHandler = {
  timer: null,
  lastCardNum: null,
  clickTimeout: 250, // ms

  handle: function(event, cardNum, zone) {
    event.stopPropagation();

    // Si on clique sur une autre carte, on annule le timer précédent
    if (this.lastCardNum !== cardNum && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.lastCardNum = cardNum;

    if (this.timer) {
      // Double-clic détecté
      clearTimeout(this.timer);
      this.timer = null;
      _handleCardDoubleClick(cardNum, zone);
    } else {
      // Premier clic, on lance un timer
      this.timer = setTimeout(() => {
        _handleCardSingleClick(cardNum, zone);
        this.timer = null;
        this.lastCardNum = null;
      }, this.clickTimeout);
    }
  }
};

function _handleCardSingleClick(cardNum, zone) {
  openCardModal(cardNum, zone);
}

function _handleCardDoubleClick(cardNum, zone) {
  let cardInstance;
  if (zone === 'play') { cardInstance = gameState.play.find(c => c.cardDef.numero === cardNum); }
  else if (zone === 'retained') { cardInstance = (gameState.retainedCards || []).find(c => c.cardDef.numero === cardNum); }
  else if (zone === 'stayInPlay') { cardInstance = (gameState.stayInPlay || []).find(c => c.cardDef.numero === cardNum); }

  if (!cardInstance) return;

  const face = getFaceData(cardInstance);
  const stickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(cardNum) : {};
  const hasStickerBonus = Object.keys(stickerBonus).length > 0;
  const hasResources = (face.ressources && face.ressources.length > 0) || hasStickerBonus;

  if (hasResources) {
    if (zone === 'play') { stageProduceCard(cardNum); }
    else if (zone === 'retained') { stageProduceRetainedCard(cardNum); }
    else if (zone === 'stayInPlay') { stageProduceStayCard(cardNum); }
  }
}

// ============================================================
//  RENDER — UI/UX Helpers
// ============================================================
function buildFaceIndicatorHTML(currentFace, totalFaces, faceStyle) {
  if (totalFaces <= 1) return '';
  let pips = '';
  for (let i = 1; i <= totalFaces; i++) {
    const isActive = i === (currentFace || 1);
    pips += `<span style="opacity:${isActive ? 1 : 0.4}; font-size:${isActive ? '0.55rem' : '0.45rem'}; text-shadow:${isActive ? '0 0 4px currentColor' : 'none'}; transition:all 0.3s;">${isActive ? '✦' : '✧'}</span>`;
  }
  return `<span class="card-id-face" title="Évolution : Niveau ${currentFace || 1} sur ${totalFaces}" style="${faceStyle} display:inline-flex; align-items:center; gap:2px; padding:3px 6px; cursor:help;">${pips}</span>`;
}

// ============================================================
//  RENDER — cartes en jeu
// ============================================================
function buildCardFrontHTML(cardInstance, playIndex) {
  const face = getFaceData(cardInstance);
  const hasUpgrade = !!(face.promotion || (face.promotions && face.promotions.length > 0));
  const stickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(cardInstance.cardDef.numero) : {};
  const hasStickerBonus = Object.keys(stickerBonus).length > 0;
  const hasResources = (face.ressources && face.ressources.length > 0) || hasStickerBonus;
  const banditCard = isBandit(cardInstance);
  const blocked = isBlockedByBandit(playIndex);
  const totalFaces = cardInstance.cardDef.faces.length;
  const progressPct = ((cardInstance.currentFace - 1) / Math.max(1, totalFaces - 1)) * 100;
  const victoryValue = getVictoryValue(face.victoire);
  const victoryBadgeHTML = victoryValue !== null
    ? `<div class="card-victory" style="${victoryValue<0?'background:var(--crimson)':''}">${victoryValue>0?'★':''}${victoryValue}</div>`
    : '';

  const effectIcon = face.effet
    ? (Array.isArray(face.effet) ? '⚡'
      : face.effet.type==='Activable' ? '🟢'
      : face.effet.type==='Passif' ? '🔵'
      : face.effet.type==='Destruction' ? '🔴' : '⚡') : '';

  // Ressources projetées (pour l'affichage des hints)
  const projected = getProjectedResources();
  // Ressources confirmées (pour déterminer les actions réellement disponibles)
  const confirmed = getConfirmedResources();

  const allPromos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  const upgradeAlreadyStaged = gameState.staging.some(e => e.action === 'upgrade');
  const promoCostItems = p => {
    if (!p || !p.cout) return [];
    return Array.isArray(p.cout) ? p.cout : [p.cout];
  };
  // Hint visuel (hint gris/vert sur la carte) : utilise les ressources projetées
  const canUpgrade = hasUpgrade && !upgradeAlreadyStaged && allPromos.some(p => promoCostItems(p).every(c => (projected[normalizeRes(c.type)]||0) >= c.quantite));
  // Disponibilité réelle (bouton actif, surbrillance) : ressources confirmées uniquement
  const canUpgradeConfirmed = hasUpgrade && !upgradeAlreadyStaged && allPromos.some(p => promoCostItems(p).every(c => (confirmed[normalizeRes(c.type)]||0) >= c.quantite));
  const canDefeat = banditCard && (confirmed['Epée'] || 0) >= 1;
  const hasActivable = hasActivableEffect(cardInstance);
  const canActivate = hasActivable && canActivateEffect(cardInstance); // déjà basé sur getConfirmedResources

  let cardBg, cardBorder, nameColor;
  let badgeWrapperStyle = '', numStyle = '', faceStyle = '';
  let pipStyle = '';
  if (banditCard) {
    cardBg = 'linear-gradient(160deg,#3a1010,#2a0808)';
    cardBorder = '#cc3333';
    nameColor = '#ffaaaa';
    badgeWrapperStyle = 'background:rgba(200,150,12,0.15); border:1px solid rgba(200,150,12,0.3); box-shadow:0 2px 4px rgba(0,0,0,0.2);';
    numStyle = 'color:#f0c040;';
    faceStyle = 'background:rgba(200,150,12,0.25); color:#ffe080; border-left:1px solid rgba(200,150,12,0.3);';
    pipStyle = '0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;';
  } else if (blocked) {
    cardBg = 'linear-gradient(160deg,#2a2010,#1a1408)';
    cardBorder = '#996600';
    nameColor = '#cc9940';
    badgeWrapperStyle = 'background:rgba(200,150,12,0.15); border:1px solid rgba(200,150,12,0.3); box-shadow:0 2px 4px rgba(0,0,0,0.2);';
    numStyle = 'color:#f0c040;';
    faceStyle = 'background:rgba(200,150,12,0.25); color:#ffe080; border-left:1px solid rgba(200,150,12,0.3);';
    pipStyle = '0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;';
  } else {
    cardBg = 'linear-gradient(160deg,var(--parchment),var(--parchment-dark))';
    cardBorder = 'var(--border-ornate)';
    nameColor = 'var(--ink)';
    badgeWrapperStyle = 'background:rgba(60,40,10,0.06); border:1px solid rgba(60,40,10,0.15);';
    numStyle = 'color:var(--ink);';
    faceStyle = 'background:rgba(60,40,10,0.08); color:var(--stone); border-left:1px solid rgba(60,40,10,0.15);';
    pipStyle = '0.48rem;background:rgba(60,40,10,0.08);border:1px solid rgba(60,40,10,0.25);color:#4a2a0a;padding:2px 6px;border-radius:6px;font-weight:700;';

    if (canUpgradeConfirmed) {
      cardBorder = '#44ccff'; // Bleu pour la promotion
    } else if (canActivate) {
      cardBorder = '#44dd44'; // Vert pour l'activation
    }
  }

  const resHTML = typeof buildResourcePipsHTML === 'function' ? buildResourcePipsHTML(cardInstance.cardDef.numero, face, blocked, pipStyle) : (hasResources ? face.ressources.map(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.map(t => {
      const isGoldBlocked = blocked && normalizeRes(t) === 'Or';
      return `<span class="resource-pip${isGoldBlocked ? ' res-blocked' : ''}" style="font-size:${pipStyle}">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}${isGoldBlocked ? ' 🚫' : ''}</span>`;
    }).join('');
  }).join('') : '');

  const hasDestruction = hasDestructionEffect(cardInstance);
  const hasRetention = _hasRetentionEffect(cardInstance);
  const isAlreadyRetained = (gameState.retainedCards || []).some(c => c.cardDef.numero === cardInstance.cardDef.numero);

  // Une carte est "actionable" si une action non-production est faisable avec les ressources confirmées
  // (upgrade possible, activation possible, destruction disponible, rétention disponible, bandit à vaincre, etc.)
  const isActionable = !blocked && (
    (banditCard && canDefeat) ||
    (!banditCard && (canUpgradeConfirmed || canActivate || hasDestruction || hasRetention))
  );
  
  let activateBtnTitle = 'Activer l\'effet';
  if (!canActivate) {
    const failureReason = getActivationFailureReason(cardInstance);
    if (failureReason === 'used_one_time') {
      activateBtnTitle = 'Déjà utilisé';
    } else if (failureReason === 'all_targets_discovered') {
      activateBtnTitle = 'Cartes cibles déjà découvertes';
    } else {
      activateBtnTitle = 'Ressources insuffisantes ou conditions non remplies';
    }
  }

  const actionBtns = [];
  if (banditCard) {
    if (canDefeat) {
      actionBtns.push(`<button class="card-action-btn btn-defeat-bandit" onclick="event.stopPropagation();defeatBandit(${cardInstance.cardDef.numero})">⚔️ Vaincre (1⚔️)</button>`);
    } else {
      actionBtns.push(`<button class="card-action-btn btn-defeat-bandit btn-upgrade-disabled" disabled title="Besoin d'1 Épée">⚔️ Vaincre</button>`);
    }
  } else if (!blocked) {
    if (hasResources) actionBtns.push(`<button class="card-action-btn btn-discard-action" onclick="event.stopPropagation();stageProduceCard(${cardInstance.cardDef.numero})">⚒ Prod.</button>`);
    if (hasActivable) actionBtns.push(`<button class="card-action-btn btn-activate-action${canActivate?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageActivateEffect(${cardInstance.cardDef.numero})" title="${activateBtnTitle}">🟢 Activer</button>`);
    if (hasDestruction) actionBtns.push(`<button class="card-action-btn btn-destroy-action" onclick="event.stopPropagation();triggerDestructionEffect(${cardInstance.cardDef.numero})" title="Sacrifier cette carte pour découvrir une autre">💥 Sacrifier</button>`);
    if (hasRetention) actionBtns.push(`<button class="card-action-btn btn-retention-action${isAlreadyRetained?' btn-retention-active':''}" onclick="event.stopPropagation();triggerRetentionEffect(${cardInstance.cardDef.numero})" title="Défausser pour retenir des cartes au prochain tour">🕊️ ${isAlreadyRetained?'Annuler':'Retenir'}</button>`);
    if (hasUpgrade) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgradeConfirmed?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeCard(${cardInstance.cardDef.numero})" title="${upgradeAlreadyStaged ? 'Une promotion a déjà été jouée ce tour' : 'Promouvoir cette carte'}">▲ Prom.</button>`);
  } else {
    if (hasUpgrade) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgradeConfirmed?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeCard(${cardInstance.cardDef.numero})" title="${upgradeAlreadyStaged ? 'Une promotion a déjà été jouée ce tour' : 'Promouvoir cette carte'}">▲ Prom.</button>`);
  }

  const serialHTML = `
    <div class="card-header-info">
      <div class="card-id-badge" style="${badgeWrapperStyle}">
        <span class="card-id-num" style="${numStyle}">#${cardInstance.cardDef.numero}</span>
          ${buildFaceIndicatorHTML(cardInstance.currentFace, totalFaces, faceStyle)}
      </div>
    </div>`;

  return `
    <div class="card-wrapper${blocked ? ' card-wrapper-blocked' : ''}${banditCard ? ' card-wrapper-bandit' : ''}${isActionable ? ' card-wrapper-actionable' : ''}" data-card-num="${cardInstance.cardDef.numero}">
      <div class="card card-front" onclick="cardClickHandler.handle(event, ${cardInstance.cardDef.numero}, 'play')"
           style="cursor:pointer;background:${cardBg};border-color:${cardBorder};">
        ${victoryBadgeHTML}
        ${serialHTML}
        <div class="card-name" style="color:${nameColor}">${face.nom}</div>
        <span class="card-type-badge type-${(face.type||'').replace('â','a').replace('è','e')}">${face.type}</span>
        <div class="card-img-area">${getCardEmoji(face.type, face.nom)}</div>
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

  const accentColor = isUpgrade ? '#44ccff' : isActivate ? '#44dd44' : '#f0c040';
  const bgTop = isUpgrade ? '#0a2a3a' : isActivate ? '#1a3a1a' : '#2a2608';
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

  const mainCardHTML = `
      <div class="staging-card-wrapper">
        <div class="staging-card" style="border-color:${accentColor}40;background:linear-gradient(160deg,${bgTop},#0e0e08);">
          <div class="staging-label" style="color:${accentColor};">${label}</div>
          <div class="staging-emoji">${getCardEmoji(face.type, face.nom)}</div>
          <div class="staging-name">${face.nom}</div>
          <div class="staging-summary" style="color:${accentColor};">${actionSummary}</div>
          <button class="staging-cancel" onclick="cancelStagingStay(${stagingIndex})">✕ Annuler</button>
        </div>
      </div>`;

  // Si sacrifice, grouper les deux cartes ensemble sans espace
  if (sacrificeHTML) {
    return `
    <div class="staging-linked-group">
      ${sacrificeHTML}
      ${mainCardHTML}
    </div>`;
  }

  return mainCardHTML;
}

// ============================================================
//  RENDER — permanentes
// ============================================================
function buildPermanentCardHTML(cardInstance) {
  // Rendu spécial carte 90 — Bijoux
  if (cardInstance.cardDef.numero === 90) {
    const prog      = _getBijouxProgress();
    const faceData  = _getBijouxData();
    const cases     = faceData?.cases || [];
    const total     = cases.length;
    const marked    = prog.casesMarquees;
    const lastCase  = marked > 0 ? cases[marked - 1] : null;
    const gloire    = lastCase ? lastCase.gloire : 0;
    const pct       = total > 0 ? Math.round((marked / total) * 100) : 0;
    const nomAffiche = 'Bijoux';
    const projected  = getProjectedResources();
    const metal      = projected['Métal'] || 0;
    const nextCase   = cases[marked];
    const dejaCoche  = !!gameState.bijouxCaseCeTour;
    const canMark    = !dejaCoche && nextCase && metal >= (nextCase.cout_metal || 0);
    const allDone    = marked >= total;

    return `
      <div class="card-wrapper" style="cursor:pointer;" onclick="openBijouxModal()" title="Cliquer pour forger un bijou et terminer le tour">
        <div class="card-front card-permanent" style="border-color:#607d8b;background:linear-gradient(160deg,#101820,#080c12);">
          <div class="card-header-info" style="margin-bottom:2px;">
            <div class="card-id-badge" style="background:rgba(96,125,139,0.15); border:1px solid rgba(96,125,139,0.3);">
              <span class="card-id-num" style="color:#b0bec5;">#90</span>
            </div>
          </div>
          <div class="card-name" style="font-size:0.5rem;color:#eceff1;">${nomAffiche}</div>
          <span class="card-type-badge" style="font-size:0.38rem;background:#455a64;">Progression</span>
          <div style="font-size:1.4rem;margin:4px 0;text-align:center;"><img src="img/bijoux.png" alt="Bijoux" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;"></div>
          <div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin:2px 0;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#90a4ae,#eceff1);border-radius:3px;transition:width 0.4s;"></div>
          </div>
          <div style="font-size:0.38rem;color:#90a4ae;text-align:center;margin:1px 0;">${marked}/${total} bijoux</div>
          ${gloire > 0 ? `<div style="font-size:0.48rem;color:#f0c040;text-align:center;">★ ${gloire}</div>` : ''}
          ${allDone
            ? '<div style="font-size:0.35rem;color:#8acc44;text-align:center;margin-top:1px;">✅ Complet</div>'
            : dejaCoche
              ? '<div style="font-size:0.35rem;color:#cc8844;text-align:center;margin-top:1px;">⏳ Déjà coché ce tour</div>'
              : canMark
                ? `<div style="font-size:0.35rem;color:#f0c040;text-align:center;margin-top:1px;">▶ ${nextCase.cout_metal} <img src="img/lingot.png" alt="Métal" style="width:1.2em;height:1.2em;vertical-align:-0.15em;object-fit:contain;"> dispo</div>`
                : `<div style="font-size:0.35rem;color:#888;text-align:center;margin-top:1px;">🔒 ${nextCase?.cout_metal || '?'} <img src="img/lingot.png" alt="Métal" style="width:1.2em;height:1.2em;vertical-align:-0.15em;object-fit:contain;"> requis</div>`
          }
          <div style="text-align:center;font-size:0.35rem;color:#607d8b;font-family:'Cinzel',serif;margin-top:2px;">⚜ PERMANENTE</div>
        </div>
      </div>`;
  }

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
      const dejaCoche = !!gameState.armeeCaseCeTour;
      const canMark   = !dejaCoche && nextCase && epees >= (nextCase.cout_epee || 0);
      const allDone   = marked >= total;

      return `
        <div class="card-wrapper" style="cursor:pointer;" onclick="openArmeeModal()" title="Cliquer pour investir des Épées">
          <div class="card-front card-permanent" style="border-color:#cc4444;background:linear-gradient(160deg,#1a0a0a,#0e0606);">
            <div class="card-header-info" style="margin-bottom:2px;">
              <div class="card-id-badge" style="background:rgba(200,50,50,0.15); border:1px solid rgba(200,50,50,0.3);">
                <span class="card-id-num" style="color:#ff8888;">#25</span>
              </div>
            </div>
            <div class="card-name" style="font-size:0.5rem;color:#ffaaaa;">${nomAffiche}</div>
            <span class="card-type-badge" style="font-size:0.38rem;background:#7a1a1a;">Progression</span>
            <div style="font-size:1.4rem;margin:4px 0;text-align:center;">⚔️</div>
            <div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin:2px 0;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#cc4444,#ff6666);border-radius:3px;transition:width 0.4s;"></div>
            </div>
            <div style="font-size:0.38rem;color:#ff8888;text-align:center;margin:1px 0;">${marked}/${total} cases</div>
            ${gloire > 0 ? `<div style="font-size:0.48rem;color:#f0c040;text-align:center;">★ ${gloire}</div>` : ''}
            ${allDone
              ? '<div style="font-size:0.35rem;color:#8acc44;text-align:center;margin-top:1px;">✅ Complet</div>'
              : dejaCoche
                ? '<div style="font-size:0.35rem;color:#cc8844;text-align:center;margin-top:1px;">⏳ Déjà coché ce tour</div>'
                : canMark
                  ? `<div style="font-size:0.35rem;color:#f0c040;text-align:center;margin-top:1px;">▶ ${nextCase.cout_epee}⚔️ dispo</div>`
                  : `<div style="font-size:0.35rem;color:#888;text-align:center;margin-top:1px;">🔒 ${nextCase?.cout_epee || '?'}⚔️ requis</div>`
            }
            <div style="text-align:center;font-size:0.35rem;color:#cc4444;font-family:'Cinzel',serif;margin-top:2px;">⚜ HÉRITAGE</div>
          </div>
        </div>`;
    }

    // Rendu spécial carte 26 — Trésor
    if (rawCard.numero === 26) {
      const prog      = _getTresorProgress();
      const faceData  = _getTresorData(prog.face);
      const cases     = faceData?.cases || [];
      const total     = cases.length;
      const marked    = prog.casesMarquees;
      const bonus     = faceData?.gloire_bonus || 0;
      const lastCase  = marked > 0 ? cases[marked - 1] : null;
      const gloire    = bonus + (lastCase && !lastCase.promotion ? lastCase.gloire : 0);
      const pct       = total > 0 ? Math.round((marked / total) * 100) : 0;
      const nomAffiche = prog.face === 2 ? 'Trésor Étendu' : 'Trésor';
      const projected  = getProjectedResources();
      const or         = projected['Or'] || 0;
      const nextCase   = cases[marked];
      const dejaCoche  = !!gameState.tresorCaseCeTour;
      const canMark    = !dejaCoche && nextCase && or >= (nextCase.cout_or || 0);
      const allDone    = marked >= total;

      return `
        <div class="card-wrapper" style="cursor:pointer;" onclick="openTresorModal()" title="Cliquer pour investir de l'Or">
          <div class="card-front card-permanent" style="border-color:#c8960c;background:linear-gradient(160deg,#1a1408,#0e0a04);">
            <div class="card-header-info" style="margin-bottom:2px;">
              <div class="card-id-badge" style="background:rgba(200,150,12,0.15); border:1px solid rgba(200,150,12,0.3);">
                <span class="card-id-num" style="color:#c8960c;">#26</span>
              </div>
            </div>
            <div class="card-name" style="font-size:0.5rem;color:#f0c040;">${nomAffiche}</div>
            <span class="card-type-badge" style="font-size:0.38rem;background:#7a5a08;">Progression</span>
            <div style="font-size:1.4rem;margin:4px 0;text-align:center;">🪙</div>
            <div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin:2px 0;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#c8960c,#f0c040);border-radius:3px;transition:width 0.4s;"></div>
            </div>
            <div style="font-size:0.38rem;color:#c8960c;text-align:center;margin:1px 0;">${marked}/${total} cases</div>
            ${gloire > 0 ? `<div style="font-size:0.48rem;color:#f0c040;text-align:center;">★ ${gloire}</div>` : ''}
            ${allDone
              ? '<div style="font-size:0.35rem;color:#8acc44;text-align:center;margin-top:1px;">✅ Complet</div>'
              : dejaCoche
                ? '<div style="font-size:0.35rem;color:#cc8844;text-align:center;margin-top:1px;">⏳ Déjà coché ce tour</div>'
                : canMark
                  ? `<div style="font-size:0.35rem;color:#f0c040;text-align:center;margin-top:1px;">▶ ${nextCase.cout_or}🪙 dispo</div>`
                  : `<div style="font-size:0.35rem;color:#888;text-align:center;margin-top:1px;">🔒 ${nextCase?.cout_or || '?'}🪙 requis</div>`
            }
            <div style="text-align:center;font-size:0.35rem;color:#c8960c;font-family:'Cinzel',serif;margin-top:2px;">⚜ HÉRITAGE</div>
          </div>
        </div>`;
    }

    // Rendu spécial carte 27 — Export
    if (rawCard.numero === 27) {
      const prog       = _getExportProgress();
      const allSeuils  = _getAllExportSeuils();
      const maxTotal   = allSeuils[allSeuils.length - 1]?.cout_total || 300;
      const total      = prog.totalDepense;
      const pct        = Math.min(100, Math.round((total / maxTotal) * 100));
      const nomAffiche = 'Export';
      const projected  = getProjectedResources();
      const marc       = projected['marchandise'] || 0;
      const disponibles = _getExportSeuilsDisponibles();
      const nextSeuil  = allSeuils.find(s => total < s.cout_total && !prog.seuilsUtilises.includes(s.index));
      const markersHTML = allSeuils.map(s => {
        const position = Math.min(100, Math.round((s.cout_total / maxTotal) * 100));
        const reached = total >= s.cout_total;
        return `<div style="position:absolute;left:${position}%;top:-2px;width:2px;height:9px;background:${reached ? '#cc88ff' : 'rgba(255,255,255,0.18)'};transform:translateX(-50%);"></div>`;
      }).join('');

      return `
        <div class="card-wrapper" style="cursor:pointer;" onclick="openExportModal()" title="Cliquer pour investir des Marchandises">
          <div class="card-front card-permanent" style="border-color:#8844cc;background:linear-gradient(160deg,#120a1a,#0a0610);">
            <div class="card-header-info" style="margin-bottom:2px;">
              <div class="card-id-badge" style="background:rgba(136,68,204,0.15); border:1px solid rgba(136,68,204,0.3);">
                <span class="card-id-num" style="color:#aa66ff;">#27</span>
              </div>
            </div>
            <div class="card-name" style="font-size:0.5rem;color:#cc88ff;">${nomAffiche}</div>
            <span class="card-type-badge" style="font-size:0.38rem;background:#5a2a8a;">Progression</span>
            <div style="font-size:1.4rem;margin:4px 0;text-align:center;"><img src="img/marchandise.png" alt="Marchandise" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;"></div>
            <div style="position:relative;width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin:2px 0;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#8844cc,#cc44ff);border-radius:3px;transition:width 0.4s;"></div>
              ${markersHTML}
            </div>
            <div style="font-size:0.28rem;color:#888;text-align:center;margin-top:2px;">Seuils: ${allSeuils.map(s => s.cout_total).join(' · ')}</div>
            <div style="font-size:0.38rem;color:#aa66ff;text-align:center;margin:1px 0;">${total}/${maxTotal} <img src="img/marchandise.png" alt="Marchandise" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;"></div>
            ${disponibles.length > 0
              ? `<div style="font-size:0.35rem;color:#aaffaa;text-align:center;margin-top:1px;">🎉 ${disponibles.length} effet${disponibles.length > 1 ? 's' : ''} dispo</div>`
              : marc > 0
                ? `<div style="font-size:0.35rem;color:#cc88ff;text-align:center;margin-top:1px;">▶ ${marc} <img src="img/marchandise.png" alt="Marchandise" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;"> à investir</div>`
                : nextSeuil
                  ? `<div style="font-size:0.35rem;color:#888;text-align:center;margin-top:1px;">🔒 Seuil : ${nextSeuil.cout_total} <img src="img/marchandise.png" alt="Marchandise" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;"></div>`
                  : '<div style="font-size:0.35rem;color:#8acc44;text-align:center;margin-top:1px;">✅ Complet</div>'
            }
            <div style="text-align:center;font-size:0.35rem;color:#8844cc;font-family:'Cinzel',serif;margin-top:2px;">⚜ HÉRITAGE</div>
          </div>
        </div>`;
    }


    // Rendu spécial carte 24 — Terre fertile (Parchemin, effets permanents sticker)
    if (rawCard.numero === 24) {
      const carte24Used = gameState.carte24EffetsUtilises || [];
      const effets      = rawCard.effet || [];
      const totalEffets = effets.length;
      const utilises    = carte24Used.length;
      const color24     = '#c8960c';
      const effetLines  = effets.map((e, i) => {
        const done = carte24Used.includes(i);
        return `<div style="font-size:0.34rem;color:${done ? '#8acc44' : '#f0c040'};text-align:center;margin-top:1px;${done ? 'text-decoration:line-through;opacity:0.7;' : ''}">
          ${done ? '\u2713' : '\u25b6'} ${e.cible || e.type}
        </div>`;
      }).join('');

      return `
        <div class="card-wrapper" style="cursor:pointer;" onclick="ouvrirCarte24Modal()" title="Cliquer pour appliquer les effets permanents">
          <div class="card-front card-permanent" style="border-color:${color24};background:linear-gradient(160deg,#1a1408,#0e0a04);">
            <div class="card-header-info" style="margin-bottom:2px;">
              <div class="card-id-badge" style="background:rgba(200,150,12,0.15); border:1px solid rgba(200,150,12,0.3);">
                <span class="card-id-num" style="color:${color24};">#24</span>
              </div>
            </div>
            <div class="card-name" style="font-size:0.5rem;color:#f0c040;">Terre fertile</div>
            <span class="card-type-badge" style="font-size:0.38rem;background:#7a5a08;">Parchemin</span>
            <div style="font-size:1.4rem;margin:4px 0;text-align:center;">\uD83C\uDF3E</div>
            <div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin:2px 0;">
              <div style="height:100%;width:${Math.round((utilises/Math.max(totalEffets,1))*100)}%;background:linear-gradient(90deg,#c8960c,#f0c040);border-radius:3px;transition:width 0.4s;"></div>
            </div>
            <div style="font-size:0.38rem;color:${color24};text-align:center;margin:1px 0;">${utilises}/${totalEffets} appliqu\xe9s</div>
            ${effetLines}
            <div style="text-align:center;font-size:0.35rem;color:${color24};font-family:'Cinzel',serif;margin-top:2px;">\u26dc H\xc9RITAGE</div>
          </div>
        </div>`;
    }

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
          <div class="card-header-info" style="margin-bottom:2px;">
            <div class="card-id-badge" style="background:rgba(200,150,12,0.15); border:1px solid rgba(200,150,12,0.3);">
              <span class="card-id-num" style="color:#c8960c;">#${rawCard.numero}</span>
            </div>
          </div>
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
  const resHTML = typeof buildResourcePipsHTML === 'function' ? buildResourcePipsHTML(cardInstance.cardDef.numero, face, false, '0.48rem;background:rgba(60,40,10,0.08);border:1px solid rgba(60,40,10,0.25);color:#4a2a0a;padding:2px 6px;border-radius:6px;font-weight:700;') : (face.ressources||[]).map(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.map(t => `<span class="resource-pip" style="font-size:0.48rem;background:rgba(60,40,10,0.08);border:1px solid rgba(60,40,10,0.25);color:#4a2a0a;padding:2px 6px;border-radius:6px;font-weight:700;">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
  }).join('');
  const victoryValue = getVictoryValue(face.victoire);
  const victoryBadge = victoryValue !== null
    ? `<div class="card-victory">★${victoryValue}</div>`
    : (getVictoryLabel(face.victoire) ? `<div class="card-victory">★${getVictoryLabel(face.victoire)}</div>` : '');
  return `
    <div class="card-wrapper">
      <div class="card-front card-permanent" title="Carte permanente">
        ${victoryBadge}
        <div class="card-header-info" style="margin-bottom:2px;">
          <div class="card-id-badge" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);">
            <span class="card-id-num" style="color:white;">#${cardInstance.cardDef.numero}</span>
          </div>
        </div>
        <div class="card-name" style="font-size:0.52rem;">${face.nom}</div>
        <span class="card-type-badge type-Batiment" style="font-size:0.42rem;">${face.type}</span>
        <div class="card-img-area" style="font-size:1.3rem;flex:1;">${getCardEmoji(face.type, face.nom)}</div>
        <div class="card-resources">${resHTML}</div>
        <div style="text-align:center;font-size:0.42rem;color:#6a9adf;font-family:'Cinzel',serif;margin-top:2px;">🔵 PERMANENT</div>
      </div>
    </div>`;
}

// ============================================================
//  RENDER — Zone de Retenue (cartes retenues + cartes "Reste en jeu")
// ============================================================
function buildHeldCardHTML(cardInstance, source) {
  // source : 'retained' | 'stayInPlay'
  const face = getFaceData(cardInstance);
  const cardNum = cardInstance.cardDef.numero;
  const totalFaces = cardInstance.cardDef.faces.length;
  const progressPct = ((cardInstance.currentFace - 1) / Math.max(1, totalFaces - 1)) * 100;

  const isRetained   = source === 'retained';
  const isStayInPlay = source === 'stayInPlay';
  const stickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(cardNum) : {};
  const hasStickerBonus = Object.keys(stickerBonus).length > 0;
  const hasResources = (face.ressources && face.ressources.length > 0) || hasStickerBonus;

  // Palette : dorée chaude pour les deux, badge texte différencié
  const borderColor    = '#c8960c';
  const bgGradient     = 'linear-gradient(160deg,#1a1608,#100e04)';
  const serialColor    = '#e8b840';
  const nameColor      = '#f5d060';
  const badgeBg        = '#7a5a08';
  const progressColor  = '#c8960c';
  const badgeLabel     = isRetained ? '🕊️ RETENUE' : '🏚️ RESTE EN JEU';
  const badgeColor     = isRetained ? '#e8b840' : '#d0a030';

  const resHTML = typeof buildResourcePipsHTML === 'function' ? buildResourcePipsHTML(cardNum, face, false, '0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;') : (face.ressources||[]).map(r => {
    const types = Array.isArray(r.type) ? r.type : [r.type];
    return types.map(t => `<span class="resource-pip" style="font-size:0.48rem;background:rgba(200,150,12,0.15);border:1px solid rgba(200,150,12,0.3);color:#f0c040;padding:2px 6px;border-radius:6px;font-weight:700;">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
  }).join('');

  // Ressources projetées (pour hint visuel) et confirmées (pour disponibilité réelle)
  const projected = getProjectedResources();
  const confirmed = getConfirmedResources();

  const allPromos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  const upgradeAlreadyStaged = gameState.staging.some(e => e.action === 'upgrade');
  // Hint visuel (gris/vert sur la carte) : ressources projetées
  const canUpgrade = allPromos.length > 0 && !upgradeAlreadyStaged &&
    allPromos.some(p => (p.cout||[]).every(c => (projected[normalizeRes(c.type)]||0) >= c.quantite));
  // Disponibilité réelle (bouton actif, surbrillance) : ressources confirmées uniquement
  const canUpgradeConfirmed = allPromos.length > 0 && !upgradeAlreadyStaged &&
    allPromos.some(p => (p.cout||[]).every(c => (confirmed[normalizeRes(c.type)]||0) >= c.quantite));
  const hasActivable = !isBandit(cardInstance) && hasActivableEffect(cardInstance);
  const canActivate  = hasActivable && canActivateEffect(cardInstance); // déjà basé sur getConfirmedResources
  const alreadyStaged = gameState.staging.some(e => e.cardInstance.cardDef.numero === cardNum);
  
  let activateBtnTitle = 'Effet activable';
  if (!canActivate) {
    const failureReason = getActivationFailureReason(cardInstance);
    if (failureReason === 'used_one_time') {
      activateBtnTitle = 'Déjà utilisé';
    } else if (failureReason === 'all_targets_discovered') {
      activateBtnTitle = 'Cartes cibles déjà découvertes';
    } else {
      activateBtnTitle = 'Ressources insuffisantes ou conditions non remplies';
    }
  }

  // Surbrillance : action non-production faisable avec ressources confirmées
  const isBanditCard2 = isBandit(cardInstance);
  const canDefeatHeld = isBanditCard2 && (confirmed['Epée'] || 0) >= 1;
  const isActionable = !alreadyStaged && (
    canDefeatHeld ||
    (!isBanditCard2 && (canUpgradeConfirmed || canActivate))
  );

  const actionBtns = [];
  if (!alreadyStaged) {
    const isBanditCard = isBandit(cardInstance);
    if (isBanditCard) {
      // Bandit dans la zone de retenue : seul le bouton Vaincre est disponible
      const canDefeat = canDefeatHeld;
      actionBtns.push(`<button class="card-action-btn btn-defeat-bandit${canDefeat ? '' : ' btn-upgrade-disabled'}" onclick="event.stopPropagation();defeatBandit(${cardNum})" ${canDefeat ? '' : 'disabled'}>⚔️ Vaincre (1⚔️)</button>`);
    } else if (isRetained) {
      if (hasResources) actionBtns.push(`<button class="card-action-btn btn-discard-action" onclick="event.stopPropagation();stageProduceRetainedCard(${cardNum})">⚒ Prod.</button>`);
      if (hasActivable) actionBtns.push(`<button class="card-action-btn btn-activate-action${canActivate?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageActivateRetainedEffect(${cardNum})" title="${activateBtnTitle}">🟢 Activer</button>`);
      if (allPromos.length > 0) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgradeConfirmed?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeRetainedCard(${cardNum})">▲ Prom.</button>`);
    } else {
      if (hasResources) actionBtns.push(`<button class="card-action-btn btn-discard-action" onclick="event.stopPropagation();stageProduceStayCard(${cardNum})">⚒ Prod.</button>`);
      if (allPromos.length > 0) actionBtns.push(`<button class="card-action-btn btn-upgrade-action${canUpgradeConfirmed?'':' btn-upgrade-disabled'}" onclick="event.stopPropagation();stageUpgradeStayCard(${cardNum})">▲ Prom.</button>`);
    }
  }

  const badgeWrapperStyle = 'background:rgba(200,150,12,0.15); border:1px solid rgba(200,150,12,0.3);';
  const numStyle = 'color:#f0c040;';
  const faceStyle = 'background:rgba(200,150,12,0.25); color:#ffe080; border-left:1px solid rgba(200,150,12,0.3);';
  const victoryValue = getVictoryValue(face.victoire);
  const victoryBadgeHTML = victoryValue !== null
    ? `<div class="card-victory" style="background:${badgeBg};">${victoryValue>0?'★':''}${victoryValue}</div>`
    : '';

  const serialHTML = `
    <div class="card-header-info">
      <div class="card-id-badge" style="${badgeWrapperStyle}">
        <span class="card-id-num" style="${numStyle}">#${cardNum}</span>
        ${buildFaceIndicatorHTML(cardInstance.currentFace, totalFaces, faceStyle)}
      </div>
    </div>`;

  const scientistBonus = getScientistPersonneBonusForCard(cardNum, face);
  const bonusOverlayHTML = scientistBonus > 0 ? `<div class="card-bonus-overlay">🔵 +${scientistBonus} Or</div>` : '';

  return `
    <div class="card-wrapper${isActionable ? ' card-wrapper-actionable' : ''}" data-held-num="${cardNum}" data-held-source="${source}">
      <div class="card card-front" onclick="cardClickHandler.handle(event, ${cardNum}, '${source}')"
           style="cursor:pointer;background:${bgGradient};border-color:${borderColor};">
        ${victoryBadgeHTML}
        ${serialHTML}
        <div class="card-name" style="color:${nameColor};">${face.nom}</div>
        <span class="card-type-badge" style="background:${badgeBg};font-size:0.42rem;">${face.type}</span>
        <div class="card-img-area">${getCardEmoji(face.type, face.nom)}</div>
        ${bonusOverlayHTML}
        <div class="card-resources">${resHTML}</div>
        ${allPromos.length > 0 ? `<div class="card-upgrade-hint${canUpgrade?' can-upgrade':''}">▲ ${allPromos.map(p => formatCostHint(p.cout||[])).join(' | ')}</div>` : ''}
        <div class="card-progress"><div style="width:${progressPct}%;height:100%;background:${progressColor};border-radius:0 0 0 8px;"></div></div>
        <div style="text-align:center;font-size:0.42rem;color:${badgeColor};font-family:'Cinzel',serif;margin-top:2px;">${badgeLabel}</div>
      </div>
      <div class="card-actions">${actionBtns.join('')}</div>
    </div>`;
}

// Alias conservés pour compatibilité avec openCardModal zone detection
function buildStayInPlayCardHTML(ci) { return buildHeldCardHTML(ci, 'stayInPlay'); }
function buildRetainedCardHTML(ci)   { return buildHeldCardHTML(ci, 'retained'); }

function buildDiscardTopHTML(cardInstance) {
  const face = getFaceData(cardInstance);
  const totalFaces = cardInstance.cardDef.faces ? cardInstance.cardDef.faces.length : 1;
  const badgeWrapperStyle = 'background:rgba(60,40,10,0.06); border:1px solid rgba(60,40,10,0.15);';
  const numStyle = 'color:var(--ink);';
  const faceStyle = 'background:rgba(60,40,10,0.08); color:var(--stone); border-left:1px solid rgba(60,40,10,0.15);';
  const serialHTML = `
    <div class="card-header-info" style="margin-bottom:2px;">
      <div class="card-id-badge" style="${badgeWrapperStyle}">
        <span class="card-id-num" style="${numStyle}">#${cardInstance.cardDef.numero}</span>
        ${buildFaceIndicatorHTML(cardInstance.currentFace, totalFaces, faceStyle)}
      </div>
    </div>`;
  return `
    <div class="card-front" style="cursor:pointer;width:130px;height:185px;border-radius:10px;border:2px solid var(--border-ornate);background:linear-gradient(160deg,var(--parchment),var(--parchment-dark));padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;">
      ${serialHTML}
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
    $('#topDeckCard').css('cursor', 'pointer').attr('onclick', 'showDeckPile()');
    const topCard = gameState.deck[0];
    const topFace = getFaceData(topCard);
    const topResHTML = typeof buildResourcePipsHTML === 'function'
      ? buildResourcePipsHTML(topCard.cardDef.numero, topFace, false, '0.48rem;background:rgba(60,40,10,0.08);border:1px solid rgba(60,40,10,0.25);color:#4a2a0a;padding:2px 6px;border-radius:6px;font-weight:700;')
      : ((topFace.ressources && topFace.ressources.length)
        ? topFace.ressources.map(r => {
            const types = Array.isArray(r.type) ? r.type : [r.type];
            return types.map(t => `<span class="resource-pip" style="font-size:0.48rem;background:rgba(60,40,10,0.08);border:1px solid rgba(60,40,10,0.25);color:#4a2a0a;padding:2px 6px;border-radius:6px;font-weight:700;">${RESOURCE_ICONS[normalizeRes(t)]||t} ×${r.quantite}</span>`).join('');
          }).join('')
        : '');
    const topPromos = topFace.promotions ? topFace.promotions : (topFace.promotion ? [topFace.promotion] : []);
    const topUpgradeHTML = topPromos.length
      ? `<div class="card-upgrade-hint" style="font-size:0.38rem;">▲ ${topPromos.map(p => formatCostHint(p.cout||[])).join(' | ')}</div>`
      : '';
    const topVictoryValue = getVictoryValue(topFace.victoire);
    const topFameHTML = topVictoryValue !== null
      ? `<div class="card-victory" style="${topVictoryValue < 0 ? 'background:var(--crimson)' : ''}">${topVictoryValue > 0 ? '★' : ''}${topVictoryValue}</div>`
      : '';
    const totalTopFaces = topCard.cardDef.faces.length;
    const badgeWrapperStyle = 'background:rgba(60,40,10,0.06); border:1px solid rgba(60,40,10,0.15);';
    const numStyle = 'color:var(--ink);';
    const faceStyle = 'background:rgba(60,40,10,0.08); color:var(--stone); border-left:1px solid rgba(60,40,10,0.15);';
    const topSerialHTML = `
      <div class="card-header-info">
        <div class="card-id-badge" style="${badgeWrapperStyle}">
          <span class="card-id-num" style="${numStyle}">#${topCard.cardDef.numero}</span>
            ${buildFaceIndicatorHTML(topCard.currentFace, totalTopFaces, faceStyle)}
        </div>
      </div>`;
    $('#topDeckCard').html(`
      ${topFameHTML}
      ${topSerialHTML}
      <div class="card-name">${topFace.nom}</div>
      <span class="card-type-badge type-${(topFace.type||'').replace('â','a').replace('è','e')}">${topFace.type}</span>
      <div class="card-img-area">${getCardEmoji(topFace.type, topFace.nom)}</div>
      <div class="card-resources">${topResHTML}</div>
      ${topUpgradeHTML}
    `);
  }

  const nx = gameState.box[gameState.nextDiscoverIndex];
  const nx2 = gameState.box[gameState.nextDiscoverIndex+1];

  // Calculer le nombre total de cartes à découvrir
  const remTuto = gameState.box.length - gameState.nextDiscoverIndex;
  let remHeritage = 0;
  if (typeof LEGACY_CARDS !== 'undefined') {
    const heritageCardNums = new Set();
    LEGACY_CARDS.forEach(c => {
      // Les cartes jouables (avec des faces) sont considérées comme "à découvrir"
      if (c.faces && c.faces.length > 0) {
        heritageCardNums.add(c.numero);
      }
    });

    const possessedCardNums = new Set();
    const allZones = [
      ...gameState.deck, ...gameState.play, ...gameState.discard,
      ...gameState.permanent, ...(gameState.stayInPlay || []),
      ...(gameState.retainedCards || []), ...(gameState.staging || []).map(e => e.cardInstance),
      ...(gameState.destroyed || []), ...gameState.box,
    ];
    allZones.forEach(ci => {
      if (ci && ci.cardDef) possessedCardNums.add(ci.cardDef.numero);
    });

    remHeritage = [...heritageCardNums].filter(num => !possessedCardNums.has(num)).length;
  }

  const rem = remTuto + remHeritage;
  $('#boxCount').text(`📦 ${rem} à découvrir`);
  $('#nextDiscoverInfo').text(nx ? `Prochaines: #${nx.cardDef ? nx.cardDef.numero : nx.numero}${nx2 ? ` & #${nx2.cardDef ? nx2.cardDef.numero : nx2.numero}`:''}` : 'Boîte vide');

  const $perm = $('#permanentArea');
  if ($perm.length)
    $perm.html(gameState.permanent.length===0
      ? '<div style="font-family:\'Cinzel\',serif;font-size:0.55rem;color:rgba(200,150,12,0.25);text-align:center;padding:8px;">Aucune carte permanente</div>'
      : gameState.permanent.map(c => buildPermanentCardHTML(c)).join(''));

  // ── Zone de Retenue : cartes retenues (82/83) + cartes "Reste en jeu" (Muraille) ──
  const retained  = gameState.retainedCards || [];
  const sipCards  = gameState.stayInPlay || [];
  const heldCards = [...retained, ...sipCards]; // retenues d'abord, puis reste-en-jeu
  const $heldCol  = $('#heldColumn');
  const $heldDiv  = $('#heldDivider');
  const $heldArea = $('#heldArea');
  if ($heldCol.length) {
    if (heldCards.length > 0) {
      $heldCol.show(); $heldDiv.show();
      $heldArea.html([
        ...retained.map(c  => buildHeldCardHTML(c, 'retained')),
        ...sipCards.map(c  => buildHeldCardHTML(c, 'stayInPlay')),
      ].join(''));
    } else {
      $heldCol.hide(); $heldDiv.hide();
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
    $('#btnConfirm').html(lbl);
  }

  const dc = gameState.discard.length;
  $('#discardCount').text(`${dc} carte${dc!==1?'s':''}`);
  $('#statDiscard').text(dc);
  if (dc===0) { $('#discardVisual').hide(); $('#discardEmpty').show(); }
  else { $('#discardEmpty').hide(); $('#discardVisual').show(); $('#topDiscardCard').html(buildDiscardTopHTML(gameState.discard[dc-1])); }

  $('#statTurn').text(gameState.turn);

  const destroyedCount = (gameState.destroyed || []).length;
  $('#sacrificedCount').text(`${destroyedCount} carte${destroyedCount!==1?'s':''}`);
  if (destroyedCount === 0) {
    $('#sacrificedVisual').hide(); $('#sacrificedEmpty').show();
  } else {
    $('#sacrificedEmpty').hide(); $('#sacrificedVisual').show();
    $('#topSacrificedCard').html(buildDiscardTopHTML(gameState.destroyed[destroyedCount-1]));
  }
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

  const canRestartRound = gameState.round > 0 && typeof _roundSnapshotJSON !== 'undefined' && !!_roundSnapshotJSON;
  if ($('#btnRestartRound').length === 0) {
    $('<button id="btnRestartRound" class="btn-medieval btn-restart-round" onclick="confirmRestartRound()">↺ Relancer Manche</button>').insertBefore('#btnUndo');
  }
  $('#btnRestartRound').toggle(canRestartRound).prop('disabled', !canRestartRound);

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
  if (typeof indexOrNum === 'object' && indexOrNum && indexOrNum.cardDef) {
    modalCardIndex = null;
    cardInstance = indexOrNum;
    modalCardZone = zone || 'preview';
  } else if (zone === 'staging') {
    modalCardIndex = indexOrNum;
    cardInstance = gameState.staging[indexOrNum].cardInstance;
  } else if (zone === 'retained') {
    modalCardIndex = indexOrNum;
    cardInstance = (gameState.retainedCards || []).find(c => c.cardDef.numero === indexOrNum);
    if (!cardInstance) return;
  } else if (zone === 'stayInPlay') {
    modalCardIndex = indexOrNum;
    cardInstance = (gameState.stayInPlay || []).find(c => c.cardDef.numero === indexOrNum);
    if (!cardInstance) return;
  } else {
    modalCardIndex = indexOrNum;
    const idx = _playIdxByNum(indexOrNum);
    cardInstance = idx >= 0 ? gameState.play[idx] : null;
    if (!cardInstance) return;
  }
  const face = getFaceData(cardInstance);
  const totalFaces = cardInstance.cardDef.faces.length;

  // ── En-tête ──────────────────────────────────────────────
  const typeColors = {
    Terrain:'#2d5a27', Bâtiment:'#7a6a5a', Batiment:'#7a6a5a',
    Personne:'#3a5a8a', Evènement:'#4a2a5a', Ennemi:'#8b0000',
    Maritime:'#1a4a6a', Etat:'#5a4a2a', Parchemin:'#7a5a0a'
  };
  const typeBg = typeColors[face.type] || '#5a5040';

  $('#modalCardSubtitle').text(`Carte #${cardInstance.cardDef.numero} · Niveau ${cardInstance.currentFace}/${totalFaces}`);
  $('#modalCardName').html(`${getCardEmoji(face.type, face.nom)}  ${face.nom}`);
  const victoryValue = getVictoryValue(face.victoire);
  const victoryLabel = victoryValue !== null
    ? `${victoryValue > 0 ? '+' : ''}${victoryValue} Gloire`
    : getVictoryLabel(face.victoire);
  const victoryBadge = victoryLabel
    ? `<span style="display:inline-block;margin-left:6px;background:${victoryValue < 0 ? '#8b0000' : 'rgba(200,150,12,0.25)'};` +
      `border:1px solid ${victoryValue < 0 ? '#cc3333' : 'rgba(200,150,12,0.5)'};color:${victoryValue < 0 ? '#ffaaaa' : '#f0c040'};` +
      `font-family:'Cinzel',serif;font-size:0.6rem;font-weight:700;padding:2px 8px;border-radius:10px;">` +
      `${victoryValue !== null ? (victoryValue >= 0 ? '⭐' : '💀') : '✨'} ${victoryLabel}</span>`
    : '';
  $('#modalCardTypeBadge').html(
    `<span style="display:inline-block;background:${typeBg};color:#fff;font-family:'Cinzel',serif;` +
    `font-size:0.58rem;letter-spacing:1px;padding:2px 10px;border-radius:10px;">${face.type}</span>` +
    victoryBadge
  );

  // ── Corps ─────────────────────────────────────────────────
  let body = '';

  // — Grande illustration centrale
  body += `<div style="text-align:center;margin:4px 0 16px;">
    <div style="font-size:4rem;line-height:1;filter:drop-shadow(0 2px 8px rgba(200,150,12,0.3));">
      ${getCardEmoji(face.type, face.nom)}
    </div>
  </div>`;

  // — Description (le cœur du parchemin)
  if (face.description) {
    body += `<div style="
      background: linear-gradient(135deg, rgba(200,150,12,0.06), rgba(200,150,12,0.02));
      border: 1px solid rgba(200,150,12,0.2);
      border-left: 4px solid var(--gold);
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 0 0 16px;
      font-family: 'Crimson Text', serif;
      font-style: italic;
      font-size: 1rem;
      color: #e8d5a3;
      line-height: 1.65;
    ">
      <span style="font-family:'Cinzel',serif;font-size:0.55rem;font-style:normal;letter-spacing:2px;color:var(--gold);display:block;margin-bottom:6px;text-transform:uppercase;">✦ Description</span>
      ${face.description}
    </div>`;
  }

  // — Production
  const stickerBonus = typeof getStickerResourceBonusForCard === 'function' ? getStickerResourceBonusForCard(cardInstance.cardDef.numero) : {};
  const hasStickerBonus = Object.keys(stickerBonus).length > 0;
  const hasResources = (face.ressources && face.ressources.length > 0) || hasStickerBonus;

  if (hasResources) {
    const baseRes = {};
    if (face.ressources) {
      face.ressources.forEach(r => {
        const types = Array.isArray(r.type) ? r.type : [r.type];
        types.forEach(t => {
          const resKey = normalizeRes(t);
          baseRes[resKey] = (baseRes[resKey] || 0) + r.quantite;
        });
      });
    }

    const allKeys = new Set([...Object.keys(baseRes), ...Object.keys(stickerBonus)]);
    let resPips = '';

    allKeys.forEach(resKey => {
      const baseQte = baseRes[resKey] || 0;
      const bonus = stickerBonus[resKey] || 0;
      const totalQte = baseQte + bonus;

      const isBonus = bonus > 0;
      const icon = RESOURCE_ICONS[resKey] || resKey;
      const bg = isBonus ? 'rgba(42,90,154,0.18)' : 'rgba(200,150,12,0.12)';
      const border = isBonus ? 'rgba(74,138,191,0.5)' : 'rgba(200,150,12,0.3)';
      const colorTag = isBonus ? 'color:#aaddff;' : '';
      
      resPips += `<span style="display:inline-flex;align-items:center;gap:4px;
        background:${bg};border:1px solid ${border};
        border-radius:12px;padding:3px 10px;font-size:0.88rem;${colorTag}">
        ${icon} <strong style="font-family:'Cinzel',serif;font-size:0.75rem;">×${totalQte}</strong>
        <span style="font-size:0.65rem;opacity:0.7;">${resKey}</span>
      </span>`;
    });

    body += `<div style="margin-bottom:14px;">
      <div style="font-family:'Cinzel',serif;font-size:0.58rem;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:6px;">⚒ Production</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${resPips}</div>
    </div>`;
  }

  // projected est utilisé par les effets (mini-diagramme) ET les promotions
  const projected = getProjectedResources();

  // — Effets
  if (face.effet) {
    const efs = Array.isArray(face.effet) ? face.effet : [face.effet];
    const _typeCfg = {
      Activable:      { border:'#2e7d32', bg:'rgba(27,94,32,0.18)',   icon:'🟢' },
      Passif:         { border:'#1565c0', bg:'rgba(13,71,161,0.18)',  icon:'🔵' },
      Destruction:    { border:'#bf360c', bg:'rgba(191,54,12,0.18)',  icon:'🔴' },
      Retention:      { border:'#6a1b9a', bg:'rgba(106,27,154,0.18)',icon:'🕊️' },
      Obligatoiref:   { border:'#e65100', bg:'rgba(230,81,0,0.18)',   icon:'⚠️' },
      Obligatoire:    { border:'#e65100', bg:'rgba(230,81,0,0.18)',   icon:'⚠️' },
      'Reste en jeu': { border:'#558b2f', bg:'rgba(85,139,47,0.18)',  icon:'♾️' },
    };
    const typeColors3 = {
      Terrain:'#2d5a27', Bâtiment:'#7a6a5a', Batiment:'#7a6a5a',
      Personne:'#3a5a8a', Evènement:'#4a2a5a', Ennemi:'#8b0000',
      Maritime:'#1a4a6a', Etat:'#5a4a2a'
    };

    body += `<div style="margin-bottom:14px;">
      <div style="font-family:'Cinzel',serif;font-size:0.58rem;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:6px;">⚡ Effets</div>`;

    efs.forEach(e => {
      const cfg = _typeCfg[e.type] || { border:'#c8a00c', bg:'rgba(200,160,12,0.12)', icon:'⚡' };

      let isUsed = false;
      let usedTag = '';
      if (e.usage_unique) {
        if (!gameState.usedOneTimeEffects) gameState.usedOneTimeEffects = [];
        const effectId = `${cardInstance.cardDef.numero}_${cardInstance.currentFace}`;
        if (gameState.usedOneTimeEffects.includes(effectId)) {
          isUsed = true;
          usedTag = `<span style="background:#424242;color:#9E9E9E;font-size:0.62rem;font-weight:600;padding:2px 7px;border-radius:8px;">✔️ UTILISÉ</span>`;
        }
      } else if (e.cartes && e.cartes.length > 0) {
        // This is an effect that discovers cards. Check if all targets are already in the kingdom.
        const alreadyInKingdom = new Set([
          ...gameState.deck, ...gameState.play, ...gameState.discard,
          ...gameState.permanent, ...(gameState.retainedCards || []),
          ...(gameState.stayInPlay || []), ...(gameState.destroyed || []),
          ...gameState.box
        ].map(ci => ci.cardDef.numero));

        const allTargetsOwned = e.cartes.every(num => alreadyInKingdom.has(num));
        if (allTargetsOwned) {
          isUsed = true;
          usedTag = `<span style="background:#424242;color:#9E9E9E;font-size:0.62rem;font-weight:600;padding:2px 7px;border-radius:8px;">✔️ DÉJÀ DÉCOUVERT</span>`;
        }
      }

      const defTag = e.defausse === true
        ? `<span style="background:#b71c1c;color:#fff;font-size:0.62rem;font-weight:600;padding:2px 7px;border-radius:8px;">⚠️ Se défausse</span>`
        : e.defausse === false
          ? `<span style="background:#1b5e20;color:#fff;font-size:0.62rem;font-weight:600;padding:2px 7px;border-radius:8px;">♾ Réutilisable</span>`
          : '';
      body += `<div style="
        background:${cfg.bg};
        border:1px solid ${cfg.border}50;
        border-left:4px solid ${cfg.border};
        border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:8px;
        ${isUsed ? 'opacity: 0.6;' : ''}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
          <span style="background:${cfg.border};color:#fff;font-size:0.65rem;font-weight:700;
            padding:2px 8px;border-radius:8px;font-family:'Cinzel',serif;letter-spacing:0.5px;">
            ${cfg.icon} ${e.type}</span>${defTag}${usedTag}
        </div>`;
      if (e.description) {
        body += `<p style="margin:0 0 6px;font-family:'Crimson Text',serif;font-size:0.95rem;
          color:${isUsed ? '#999' : '#e8d5a3'};line-height:1.55;${isUsed ? 'text-decoration:line-through;' : ''}">${e.description}</p>`;
      }
      if (e.ressources) {
        const gainStr = e.ressources.map(x => {
          const types = Array.isArray(x.type) ? x.type : [x.type];
          if (types.length > 1) {
            return types.map(t => formatResourceGain({ type: t, quantite: x.quantite })).join(' <em style="color:#888;">ou</em> ');
          }
          return formatResourceGain(x);
        }).join('  ');
        body += `<div style="margin-top:4px;font-size:0.82rem;${isUsed ? 'text-decoration:line-through;' : ''}">
          <span style="background:rgba(0,0,0,0.3);color:#ffd54f;font-weight:600;padding:1px 7px;border-radius:4px;">🎁 Gains</span>
          <span style="color:${isUsed ? '#999' : '#e8d5a3'};margin-left:6px;">${gainStr}</span></div>`;
      }
      if (e.cout) {
        body += `<div style="margin-top:4px;font-size:0.82rem;${isUsed ? 'text-decoration:line-through;' : ''}">
          <span style="background:rgba(0,0,0,0.3);color:#ffcc80;font-weight:600;padding:1px 7px;border-radius:4px;">💰 Coût</span>
          <span style="color:${isUsed ? '#999' : '#e8d5a3'};margin-left:6px;">${formatCost(e.cout)}</span></div>`;
      }

      // — Mini-diagramme de promotion si l'effet entraîne un changement de face
      if (e.promotion && e.promotion.face) {
        const targetFaceNum = e.promotion.face;
        const srcFd  = face; // face courante = source
        const tgtFd  = cardInstance.cardDef.faces.find(f => f.face === targetFaceNum);
        if (tgtFd) {
          const srcTypeBg = typeColors3[srcFd.type] || '#5a5040';
          const tgtTypeBg = typeColors3[tgtFd.type] || '#5a5040';

          // Coût de l'effet lui-même (peut être nul)
          const coutEff = e.cout || [];
          const canAffordEff = coutEff.every(c => (projected[normalizeRes(c.type)] || 0) >= c.quantite);
          const arrowCol = canAffordEff ? '#44ccff' : '#664422';

          const coutPillsEff = coutEff.map(c =>
            `<span style="display:inline-flex;align-items:center;gap:2px;
              background:rgba(0,0,0,0.5);border:1px solid ${arrowCol}66;border-radius:6px;
              padding:1px 5px;font-size:0.52rem;
              color:${canAffordEff ? '#e8d5a3' : '#886644'};white-space:nowrap;">
              ${RESOURCE_ICONS[normalizeRes(c.type)] || c.type} ${c.quantite}
            </span>`
          ).join('');

          const arrowLabel = coutEff.length > 0
            ? `<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center;">${coutPillsEff}</div>`
            : `<span style="font-size:0.46rem;color:#44ccff;font-family:'Cinzel',serif;">⚡ effet</span>`;

          const miniNode = (fd, isSrc) => {
            const isCur = fd.face === cardInstance.currentFace;
            const bg2   = isCur ? 'rgba(200,150,12,0.15)' : 'rgba(0,0,0,0.3)';
            const bdr   = isCur ? '#f0c04088' : 'rgba(255,255,255,0.12)';
            const nc    = isCur ? '#f0c040' : isSrc ? '#e8d5a3' : '#88ccff';
            const typBg = isCur ? (typeColors3[fd.type] || '#5a5040') : (isSrc ? srcTypeBg : tgtTypeBg);
            return `<div style="
                display:flex;flex-direction:column;align-items:center;
                background:${bg2};border:2px solid ${bdr};border-radius:8px;
                padding:6px 8px 5px;min-width:64px;max-width:80px;text-align:center;flex-shrink:0;">
              <div style="font-size:1.4rem;line-height:1;">${getCardEmoji(fd.type, fd.nom)}</div>
              <div style="font-family:'Cinzel',serif;font-size:0.48rem;font-weight:700;
                   color:${nc};margin-top:3px;line-height:1.2;word-break:break-word;">${fd.nom}</div>
              <div style="background:${typBg};color:#fff;font-family:'Cinzel',serif;
                   font-size:0.36rem;padding:1px 5px;border-radius:4px;margin-top:2px;">${fd.type}</div>
              ${fd.victoire ? `<div style="font-size:0.5rem;color:${fd.victoire<0?'#ff8888':'#f0c040'};margin-top:2px;">${fd.victoire>0?'⭐':'💀'}${fd.victoire}</div>` : ''}
            </div>`;
          };

          body += `<div style="
              display:flex;align-items:center;gap:0;
              margin-top:10px;padding:8px 10px;
              background:rgba(0,0,0,0.2);border:1px solid ${arrowCol}33;border-radius:8px;">
            ${miniNode(srcFd, true)}
            <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;min-width:46px;padding:0 3px;">
              <div style="text-align:center;margin-bottom:4px;">${arrowLabel}</div>
              <div style="display:flex;align-items:center;">
                <div style="height:2px;width:18px;background:${arrowCol};opacity:0.8;"></div>
                <div style="width:0;height:0;
                  border-top:5px solid transparent;border-bottom:5px solid transparent;
                  border-left:8px solid ${arrowCol};opacity:0.8;"></div>
              </div>
            </div>
            ${miniNode(tgtFd, false)}
          </div>`;
        }
      }

      body += `</div>`;
    });
    body += `</div>`;
  }

  // — Promotions disponibles
  const allModalPromos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  if (allModalPromos.length > 0) {
    body += `<div style="margin-bottom:14px;">
      <div style="font-family:'Cinzel',serif;font-size:0.58rem;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:6px;">▲ Promotions</div>`;
    allModalPromos.forEach(promo => {
      const nfd = cardInstance.cardDef.faces.find(f => f.face === promo.face);
      const promoCost = toCostArray(promo.cout);
      const canAfford = promoCost.every(c => (projected[normalizeRes(c.type)] || 0) >= c.quantite);
      const nfdEmoji = nfd ? getCardEmoji(nfd.type, nfd.nom) : '📄';
      body += `<div style="display:flex;align-items:center;gap:10px;
        background:rgba(0,0,0,0.25);border:1px solid ${canAfford ? 'rgba(68,200,68,0.35)' : 'rgba(200,150,12,0.2)'};
        border-radius:8px;padding:8px 12px;margin-bottom:6px;">
        <span style="font-size:1.5rem;">${nfdEmoji}</span>
        <div style="flex:1;">
          <div style="font-family:'Cinzel',serif;font-size:0.75rem;color:${canAfford ? '#88ff88' : '#f0c040'};">
            ${nfd ? nfd.nom : '?'}
          </div>
          <div style="font-size:0.72rem;color:#a09080;">Coût : ${formatCost(promo.cout)}</div>
          ${nfd && nfd.victoire ? `<div style="font-size:0.65rem;color:#f0c040;">⭐ ${nfd.victoire} Gloire</div>` : ''}
        </div>
        ${canAfford
          ? `<span style="font-size:0.65rem;color:#88ff88;font-family:'Cinzel',serif;">✓ Possible</span>`
          : `<span style="font-size:0.65rem;color:#aa8866;font-family:'Cinzel',serif;">🔒</span>`}
      </div>`;
    });
    body += `</div>`;
  }

  // — Diagramme chemin de la carte
  const saved = cardStateMap[cardInstance.cardDef.numero] || 1;

  // Construire la liste des nœuds avec leurs transitions sortantes
  // Chaque face peut avoir promotion (objet) ou promotions (tableau)
  // On construit un graphe : faceNum → [{ targetFace, cout }]
  const transitions = {}; // faceNum → [{ targetFace, cout }]
  cardInstance.cardDef.faces.forEach(f => {
    const promos = f.promotions ? f.promotions : (f.promotion ? [f.promotion] : []);
    // Aussi gérer l'effet activable avec promotion intégrée (ex: Forêt → Coupe Rase)
    const effets = f.effet ? (Array.isArray(f.effet) ? f.effet : [f.effet]) : [];
    const effectPromos = effets
      .filter(e => e.promotion && e.promotion.face)
      .map(e => ({ face: e.promotion.face, cout: e.cout || [], viaEffect: true }));
    transitions[f.face] = [...promos.map(p => ({ face: p.face, cout: p.cout || [], viaEffect: false })), ...effectPromos];
  });

  // Construire tous les chemins complets depuis la face 1 jusqu'à chaque feuille.
  // Un chemin est complet : il part de face 1 et se termine sur un nœud sans successeur.
  // Les cartes à bifurcation (ex: face 1 → face 2 ET face 1 → face 4) produisent
  // autant de lignes que de branches, chacune affichant le chemin entier.
  function buildPaths(startFace, visited = new Set()) {
    if (visited.has(startFace)) return [[startFace]]; // cycle — on s'arrête
    const newVisited = new Set(visited);
    newVisited.add(startFace);
    const nexts = (transitions[startFace] || []).filter(t => !visited.has(t.face));
    if (nexts.length === 0) return [[startFace]]; // feuille terminale
    const paths = [];
    nexts.forEach(t => {
      buildPaths(t.face, newVisited).forEach(subPath => {
        paths.push([startFace, ...subPath]);
      });
    });
    return paths;
  }

  const rawPaths = buildPaths(1);

  // Si une seule face (pas de transition), un chemin d'un seul nœud
  const allPaths = rawPaths.length > 0 ? rawPaths : [[1]];

  // Rendu d'un nœud (face)
  function renderNode(f) {
    const isCurrent = f.face === cardInstance.currentFace;
    const isReached  = f.face <= saved;
    const isLocked   = !isReached && !isCurrent;

    const typeColors2 = {
      Terrain:'#2d5a27', Bâtiment:'#7a6a5a', Batiment:'#7a6a5a',
      Personne:'#3a5a8a', Evènement:'#4a2a5a', Ennemi:'#8b0000',
      Maritime:'#1a4a6a', Etat:'#5a4a2a'
    };
    const typeBg2 = typeColors2[f.type] || '#5a5040';

    let nodeBorder, nodeBg, nameCol;
    if (isCurrent) {
      nodeBorder = '#f0c040'; nodeBg = 'rgba(200,150,12,0.2)'; nameCol = '#f0c040';
    } else if (isReached) {
      nodeBorder = 'rgba(100,180,100,0.5)'; nodeBg = 'rgba(50,100,50,0.15)'; nameCol = '#80cc80';
    } else {
      nodeBorder = 'rgba(255,255,255,0.12)'; nodeBg = 'rgba(0,0,0,0.3)'; nameCol = '#555';
    }

    const glHTML = (f.victoire !== undefined && f.victoire !== 0)
      ? `<div style="font-size:0.55rem;color:${f.victoire < 0 ? '#ff8888' : '#f0c040'};margin-top:2px;">
          ${f.victoire > 0 ? '⭐' : '💀'} ${f.victoire > 0 ? '+' : ''}${f.victoire}
        </div>`
      : '';

    const badge = isCurrent
      ? `<div style="font-family:'Cinzel',serif;font-size:0.42rem;color:#1a0e04;
           background:#f0c040;border-radius:4px;padding:1px 5px;margin-top:3px;letter-spacing:0.5px;">
           ▶ ACTUELLE</div>`
      : isReached
        ? `<div style="font-size:0.5rem;color:#80cc80;margin-top:2px;">✓</div>`
        : `<div style="font-size:0.6rem;color:#444;margin-top:2px;">🔒</div>`;

    return `<div style="
        display:flex;flex-direction:column;align-items:center;
        background:${nodeBg};
        border:2px solid ${nodeBorder};
        border-radius:10px;
        padding:7px 8px 6px;
        min-width:72px;max-width:86px;
        text-align:center;
        opacity:${isLocked ? 0.45 : 1};
        flex-shrink:0;
        box-shadow:${isCurrent ? '0 0 12px rgba(200,150,12,0.35)' : 'none'};
        transition:all 0.2s;">
      <div style="font-size:1.6rem;line-height:1;">${getCardEmoji(f.type, f.nom)}</div>
      <div style="font-family:'Cinzel',serif;font-size:0.52rem;font-weight:700;color:${nameCol};
           margin-top:4px;line-height:1.25;word-break:break-word;">${f.nom}</div>
      <div style="display:inline-block;background:${typeBg2};color:#fff;font-family:'Cinzel',serif;
           font-size:0.38rem;padding:1px 5px;border-radius:4px;margin-top:3px;letter-spacing:0.5px;">${f.type}</div>
      ${glHTML}
      ${badge}
    </div>`;
  }

  // Rendu d'une flèche avec coût entre fromFace → toFace
  function renderArrow(fromFace, toFace) {
    const t = (transitions[fromFace] || []).find(tr => tr.face === toFace);
    const cout = t ? t.cout : [];
    const viaEffect = t ? t.viaEffect : false;
    const canAfford2 = cout.length === 0 || cout.every(c => (projected[normalizeRes(c.type)] || 0) >= c.quantite);
    const arrowColor = viaEffect ? '#44ccff' : canAfford2 ? '#88cc44' : '#664422';

    const coutPills = cout.map(c =>
      `<span style="
        display:inline-flex;align-items:center;gap:2px;
        background:rgba(0,0,0,0.5);
        border:1px solid ${arrowColor}66;
        border-radius:6px;padding:1px 5px;
        font-size:0.52rem;color:${canAfford2 ? '#e8d5a3' : '#886644'};
        white-space:nowrap;">
        ${RESOURCE_ICONS[normalizeRes(c.type)] || c.type} ${c.quantite}
      </span>`
    ).join('');

    const label = viaEffect
      ? `<span style="font-size:0.48rem;color:#44ccff;font-family:'Cinzel',serif;">⚡ effet</span>`
      : cout.length > 0
        ? `<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center;">${coutPills}</div>`
        : `<span style="font-size:0.48rem;color:#888;font-family:'Cinzel',serif;">gratuit</span>`;

    return `<div style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        flex-shrink:0;min-width:50px;max-width:70px;padding:0 3px;">
      <div style="text-align:center;margin-bottom:4px;">${label}</div>
      <div style="display:flex;align-items:center;">
        <div style="height:2px;width:20px;background:${arrowColor};opacity:0.75;"></div>
        <div style="width:0;height:0;
          border-top:5px solid transparent;
          border-bottom:5px solid transparent;
          border-left:9px solid ${arrowColor};
          opacity:0.75;"></div>
      </div>
    </div>`;
  }

  body += `<div style="border-top:1px solid rgba(200,150,12,0.15);padding-top:14px;margin-top:4px;">
    <div style="font-family:'Cinzel',serif;font-size:0.58rem;letter-spacing:2px;color:var(--gold);
         text-transform:uppercase;margin-bottom:12px;">📜 Chemin de la carte</div>`;

  // Afficher chaque chemin sur une rangée (complet, de face 1 à la feuille terminale)
  allPaths.forEach((path, pi) => {
    body += `<div style="
      display:flex;align-items:center;flex-wrap:nowrap;
      overflow-x:auto;gap:0;
      padding-bottom:${pi < allPaths.length - 1 ? '10px' : '0'};
      ${pi > 0 ? 'border-top:1px dashed rgba(200,150,12,0.15);padding-top:10px;' : ''}">`;

    path.forEach((faceNum, idx) => {
      const fData = cardInstance.cardDef.faces.find(f => f.face === faceNum);
      if (!fData) return;
      body += renderNode(fData);
      if (idx < path.length - 1) {
        body += renderArrow(faceNum, path[idx + 1]);
      }
    });

    body += `</div>`;
  });

  body += `</div>`;

  $('#modalCardBody').html(body);

  // ── Boutons d'action ──────────────────────────────────────
  const inPlay = zone !== 'staging' && zone !== 'preview';
  const isPreview = zone === 'preview';
  const isRetained = zone === 'retained';
  const hasModalUpgrade = !!(face.promotion || (face.promotions && face.promotions.length > 0));
  const hasModalActivable = inPlay && hasActivableEffect(cardInstance);
  const canModalActivate = hasModalActivable && canActivateEffect(cardInstance);

  $('#modalProduceBtn')
    .toggle(!isPreview && inPlay && hasResources)
    .off('click').on('click', () => {
      if (document.activeElement) document.activeElement.blur();
      bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
      if (isRetained) stageProduceRetainedCard(modalCardIndex);
      else stageProduceCard(modalCardIndex);
      modalCardIndex = null;
    });
  $('#modalUpgradeBtn')
    .toggle(!isPreview && inPlay && hasModalUpgrade)
    .off('click').on('click', () => {
      if (document.activeElement) document.activeElement.blur();
      bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
      if (isRetained) stageUpgradeRetainedCard(modalCardIndex);
      else stageUpgradeCard(modalCardIndex);
      modalCardIndex = null;
    });
  $('#modalActivateBtn')
    .toggle(!isPreview && hasModalActivable)
    .prop('disabled', !canModalActivate)
    .css('opacity', canModalActivate ? 1 : 0.5)
    .attr('title', canModalActivate ? '' : 'Ressources insuffisantes ou conditions non remplies')
    .off('click').on('click', () => {
      if (document.activeElement) document.activeElement.blur();
      bootstrap.Modal.getInstance(document.getElementById('cardModal')).hide();
      if (isRetained) stageActivateRetainedEffect(modalCardIndex);
      else stageActivateEffect(modalCardIndex);
      modalCardIndex = null;
    });

  new bootstrap.Modal(document.getElementById('cardModal')).show();
}

function showDeckPile() {
  const $g = $('#deckPileGrid'); $g.empty();
  // On affiche les cartes dans l'ordre de la pioche (haut vers bas)
  gameState.deck.forEach(ci => {
    const f = getFaceData(ci);
    const totalFaces = ci.cardDef.faces ? ci.cardDef.faces.length : 1;
    const badgeWrapperStyle = 'background:rgba(60,40,10,0.06); border:1px solid rgba(60,40,10,0.15);';
    const numStyle = 'color:var(--ink);';
    const faceStyle = 'background:rgba(60,40,10,0.08); color:var(--stone); border-left:1px solid rgba(60,40,10,0.15);';
    const serialHTML = `
      <div class="card-header-info" style="margin-bottom:2px;">
        <div class="card-id-badge" style="${badgeWrapperStyle}">
          <span class="card-id-num" style="${numStyle}">#${ci.cardDef.numero}</span>
          ${buildFaceIndicatorHTML(ci.currentFace, totalFaces, faceStyle)}
        </div>
      </div>`;
    $g.append(`<div style="text-align:center;"><div 
      onmouseover="this.style.transform='scale(1.1) translateY(-5px)'; this.style.zIndex='10'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.5)';"
      onmouseout="this.style.transform='none'; this.style.zIndex='1'; this.style.boxShadow='none';"
      style="position:relative; z-index:1; transition:all 0.2s ease-in-out; width:100px;height:145px;border-radius:8px;background:linear-gradient(160deg,var(--parchment),var(--parchment-dark));border:2px solid var(--border-ornate);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px;">
      ${serialHTML}
      <div style="font-family:'Cinzel',serif;font-size:0.55rem;font-weight:600;color:var(--ink);text-align:center;">${f.nom}</div>
      <div style="font-size:1.5rem;margin:2px 0;">${getCardEmoji(f.type,f.nom)}</div>
      <div style="font-style:italic;font-size:0.45rem;color:var(--stone);">${f.type}</div>
      ${f.victoire?`<div style="font-size:0.5rem;color:var(--gold);">★${f.victoire}</div>`:''}
    </div></div>`);
  });
  new bootstrap.Modal(document.getElementById('deckModal')).show();
}


function showDiscardPile() {
  const $g = $('#discardPileGrid'); $g.empty();
  [...gameState.discard].reverse().forEach(ci => {
    const f = getFaceData(ci);
    const totalFaces = ci.cardDef.faces ? ci.cardDef.faces.length : 1;
    const badgeWrapperStyle = 'background:rgba(60,40,10,0.06); border:1px solid rgba(60,40,10,0.15);';
    const numStyle = 'color:var(--ink);';
    const faceStyle = 'background:rgba(60,40,10,0.08); color:var(--stone); border-left:1px solid rgba(60,40,10,0.15);';
    const serialHTML = `
      <div class="card-header-info" style="margin-bottom:2px;">
        <div class="card-id-badge" style="${badgeWrapperStyle}">
          <span class="card-id-num" style="${numStyle}">#${ci.cardDef.numero}</span>
          ${buildFaceIndicatorHTML(ci.currentFace, totalFaces, faceStyle)}
        </div>
      </div>`;
    $g.append(`<div style="text-align:center;"><div 
      onmouseover="this.style.transform='scale(1.1) translateY(-5px)'; this.style.zIndex='10'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.5)';"
      onmouseout="this.style.transform='none'; this.style.zIndex='1'; this.style.boxShadow='none';"
      style="position:relative; z-index:1; transition:all 0.2s ease-in-out; width:100px;height:145px;border-radius:8px;background:linear-gradient(160deg,var(--parchment),var(--parchment-dark));border:2px solid var(--border-ornate);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px;">
      ${serialHTML}
      <div style="font-family:'Cinzel',serif;font-size:0.55rem;font-weight:600;color:var(--ink);text-align:center;">${f.nom}</div>
      <div style="font-size:1.5rem;margin:2px 0;">${getCardEmoji(f.type,f.nom)}</div>
      <div style="font-style:italic;font-size:0.45rem;color:var(--stone);">${f.type}</div>
      ${f.victoire?`<div style="font-size:0.5rem;color:var(--gold);">★${f.victoire}</div>`:''}
    </div></div>`);
  });
  new bootstrap.Modal(document.getElementById('discardModal')).show();
}

function showSacrificedPile() {
  const $g = $('#sacrificedPileGrid'); $g.empty();
  // On affiche les cartes dans l'ordre inverse (la plus récemment sacrifiée en haut)
  [...gameState.destroyed].reverse().forEach(ci => {
    const f = getFaceData(ci);
    const totalFaces = ci.cardDef.faces ? ci.cardDef.faces.length : 1;
    const badgeWrapperStyle = 'background:rgba(60,40,10,0.06); border:1px solid rgba(60,40,10,0.15);';
    const numStyle = 'color:var(--ink);';
    const faceStyle = 'background:rgba(60,40,10,0.08); color:var(--stone); border-left:1px solid rgba(60,40,10,0.15);';
    const serialHTML = `
      <div class="card-header-info" style="margin-bottom:2px;">
        <div class="card-id-badge" style="${badgeWrapperStyle}">
          <span class="card-id-num" style="${numStyle}">#${ci.cardDef.numero}</span>
          ${buildFaceIndicatorHTML(ci.currentFace, totalFaces, faceStyle)}
        </div>
      </div>`;
    $g.append(`<div style="text-align:center;"><div 
      onmouseover="this.style.transform='scale(1.1) translateY(-5px)'; this.style.zIndex='10'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.5)';"
      onmouseout="this.style.transform='none'; this.style.zIndex='1'; this.style.boxShadow='none';"
      style="position:relative; z-index:1; transition:all 0.2s ease-in-out; width:100px;height:145px;border-radius:8px;background:linear-gradient(160deg,var(--parchment),var(--parchment-dark));border:2px solid var(--border-ornate);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px;">
      ${serialHTML}
      <div style="font-family:'Cinzel',serif;font-size:0.55rem;font-weight:600;color:var(--ink);text-align:center;">${f.nom}</div>
      <div style="font-size:1.5rem;margin:2px 0;">${getCardEmoji(f.type,f.nom)}</div>
      <div style="font-style:italic;font-size:0.45rem;color:var(--stone);">${f.type}</div>
      ${f.victoire?`<div style="font-size:0.5rem;color:var(--gold);">★${f.victoire}</div>`:''}
    </div></div>`);
  });
  new bootstrap.Modal(document.getElementById('sacrificedModal')).show();
}
// ============================================================
//  ANIMATION — Distribution des cartes (depuis la pioche)
// ============================================================

/**
 * Applique l'animation de distribution pour les cartes allant vers la zone de jeu.
 * @param {Set<number>} existingPlayNums - Numéros des cartes déjà en jeu avant le tirage.
 * @param {DOMRect} deckRect - Rectangle de la pioche (position de départ).
 */
function applyDealAnimations(existingPlayNums, deckRect) {
  const playArea = document.getElementById('playArea');
  if (!playArea) return;

  const newWrappers = Array.from(playArea.querySelectorAll('.card-wrapper[data-card-num]'))
    .filter(w => !existingPlayNums.has(parseInt(w.dataset.cardNum)));

  newWrappers.forEach((wrapper, i) => {
    const cardEl = wrapper.querySelector('.card');
    if (!cardEl) return;

    // Appliquer l'animation à l'élément de carte
    _applyCardDealAnimation(cardEl, deckRect, wrapper.getBoundingClientRect(), i);
  });
}

/**
 * Applique l'animation de distribution pour les cartes allant vers la zone de retenue.
 * @param {HTMLElement[]} newHeldWrappers - Les wrappers DOM des nouvelles cartes dans la zone de retenue.
 * @param {DOMRect} deckRect - Rectangle de la pioche (position de départ).
 */
function applyHeldDealAnimations(newHeldWrappers, deckRect) {
  newHeldWrappers.forEach((wrapper, i) => {
    const cardEl = wrapper.querySelector('.card');
    if (!cardEl) return;

    // Appliquer l'animation à l'élément de carte
    _applyCardDealAnimation(cardEl, deckRect, wrapper.getBoundingClientRect(), i);
  });
}

/**
 * Fonction utilitaire pour appliquer l'animation de distribution à un élément de carte.
 * @param {HTMLElement} cardEl - L'élément DOM de la carte à animer.
 * @param {DOMRect} deckRect - Le rectangle de la pioche (position de départ).
 * @param {DOMRect} targetRect - Le rectangle de la position finale de la carte.
 * @param {number} index - L'index de la carte dans le lot tiré (pour le délai).
 */
function _applyCardDealAnimation(cardEl, deckRect, targetRect, index) {
  let dx = -320, dy = -200, rot = -22;
  if (deckRect && targetRect) {
    const cardCx = targetRect.left + targetRect.width  / 2;
    const cardCy = targetRect.top  + targetRect.height / 2;
    const deckCx = deckRect.left + deckRect.width  / 2;
    const deckCy = deckRect.top  + deckRect.height / 2;
    dx = deckCx - cardCx;
    dy = deckCy - cardCy;
    rot = -20 - (index * 4); // Rotation légèrement différente pour chaque carte
  }

  cardEl.style.visibility = 'visible';
  cardEl.style.setProperty('--deal-dx',  `${dx}px`);
  cardEl.style.setProperty('--deal-dy',  `${dy}px`);
  cardEl.style.setProperty('--deal-rot', `${rot}deg`);
  cardEl.style.animationDelay    = `${index * 220}ms`;
  cardEl.style.animationDuration = '1s';

  cardEl.classList.remove('card-enter');
  void cardEl.offsetWidth; // Force reflow pour redémarrer l'animation si elle était déjà appliquée
  cardEl.classList.add('card-enter');

  // Retirer card-enter après la fin de l'animation pour libérer le hover
  const totalDuration = (index * 220 + 1000) + 50; // delay + duration + marge
  setTimeout(() => {
    cardEl.classList.remove('card-enter');
    cardEl.style.animationDelay    = '';
    cardEl.style.animationDuration = '';
  }, totalDuration);
}

/**
 * Animates a card promotion from the staging area.
 * @param {object} upgradeEntry - The staging entry for the upgrade.
 * @param {number} stagingIndex - The index of the card in the staging area.
 * @param {Function} callback - Function to call after all animations are complete.
 */
function _animatePromotion(upgradeEntry, stagingIndex, callback) {
  const stagingArea = document.getElementById('stagingArea');
  const sourceEl = stagingArea.querySelectorAll('.staging-card-wrapper')[stagingIndex];
  const discardEl = document.querySelector('#discardVisual .card-front');

  if (!sourceEl || !discardEl) {
    callback();
    return;
  }

  const startRect = sourceEl.getBoundingClientRect();
  const discardRect = discardEl.getBoundingClientRect();

  // 1. Create the animation element
  const animContainer = document.createElement('div');
  animContainer.className = 'promo-anim-container';
  document.body.appendChild(animContainer);

  // 2. Build front and back faces
  const frontHTML = sourceEl.querySelector('.staging-card').outerHTML;

  const tempInstance = { ...upgradeEntry.cardInstance, currentFace: upgradeEntry.newFace };
  const backHTML = buildCardFrontHTML(tempInstance, -1); // -1 for no specific play index

  const finalW = 130, finalH = 185;
  const startW = startRect.width, startH = startRect.height;

  animContainer.innerHTML = `
    <div class="promo-flip-card">
      <div class="promo-flip-front" style="display:flex;align-items:center;justify-content:center;">
        <div style="transform: scale(${startW/finalW}, ${startH/finalH});">${frontHTML}</div>
      </div>
      <div class="promo-flip-back">${backHTML}</div>
    </div>
  `;

  // 3. Position the animation element
  const startCx = startRect.left + startW / 2;
  const startCy = startRect.top + startH / 2;
  animContainer.style.position = 'fixed';
  animContainer.style.left = `${startCx - finalW / 2}px`;
  animContainer.style.top = `${startCy - finalH / 2}px`;
  animContainer.style.width = `${finalW}px`;
  animContainer.style.height = `${finalH}px`;
  animContainer.style.zIndex = '10000';

  // 4. Hide original staging area and start animation
  stagingArea.parentElement.style.visibility = 'hidden';

  requestAnimationFrame(() => {
    const flipCard = animContainer.querySelector('.promo-flip-card');
    flipCard.classList.add('is-flipped');

    // 5. After flip, animate to discard pile
    setTimeout(() => {
      const discardCx = discardRect.left + discardRect.width / 2;
      const discardCy = discardRect.top + discardRect.height / 2;
      const dx = discardCx - startCx;
      const dy = discardCy - startCy;
      const scale = discardRect.width / finalW;

      animContainer.style.transition = 'transform 0.6s ease-in, opacity 0.6s ease-in';
      animContainer.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      animContainer.style.opacity = '0';

      animContainer.addEventListener('transitionend', () => {
        animContainer.remove();
        stagingArea.parentElement.style.visibility = ''; // Show staging area again
        callback();
      }, { once: true });

    }, 950); // Corresponds to flip animation duration + a small buffer
  });
}

/**
 * Animates the reset of the Forge card (#18) to its face 1 before discarding.
 * @param {object} cardInstance - The card instance of the Forge.
 * @param {string} sourceCardName - The name of the card's face being reset (for logging).
 * @param {object[]} [targetCards] - Optional array of card definitions to discover.
 */
function _animateForgeReset(cardInstance, sourceCardName, targetCards) {
  const cardElWrapper = document.querySelector(`.card-wrapper[data-card-num="${cardInstance.cardDef.numero}"]`);
  const discardEl = document.querySelector('#discardVisual .card-front');

  if (!cardElWrapper || !discardEl) {
    // Fallback: no animation, just perform the state changes
    cardInstance.currentFace = 1;
    cardStateMap[18] = 1;
    addLog(`🔥 <span class="log-card">${sourceCardName}</span> est réinitialisée.`, true);
    gameState.discard.push(cardInstance);

    // Fallback for target cards
    if (targetCards && targetCards.length > 0) {
      targetCards.forEach(cardDef => {
        const newInst = createCardInstance(cardDef);
        gameState.discard.push(newInst);
        addLog(`✨ <span class="log-card">${getFaceData(newInst).nom}</span> est découverte et rejoint la défausse !`, true);
      });
    }

    updateUI();
    return;
  }

  const startRect = cardElWrapper.getBoundingClientRect();
  const discardRect = discardEl.getBoundingClientRect();

  // 1. Create the animation element
  const animContainer = document.createElement('div');
  animContainer.className = 'forge-reset-anim-container';
  document.body.appendChild(animContainer);

  // 2. Build front and back faces
  const frontHTML = cardElWrapper.querySelector('.card-front').outerHTML;
  const tempInstanceFace1 = { ...cardInstance, currentFace: 1 };
  const backHTML = buildCardFrontHTML(tempInstanceFace1, -1);

  const finalW = 130, finalH = 185;

  animContainer.innerHTML = `
      <div class="forge-reset-flip-card">
          <div class="forge-reset-flip-front">${frontHTML}</div>
          <div class="forge-reset-flip-back">${backHTML}</div>
      </div>
  `;

  // 3. Position the animation element
  const startCx = startRect.left + startRect.width / 2;
  const startCy = startRect.top + startRect.height / 2;
  animContainer.style.position = 'fixed';
  animContainer.style.left = `${startCx - finalW / 2}px`;
  animContainer.style.top = `${startCy - finalH / 2}px`;
  animContainer.style.width = `${finalW}px`;
  animContainer.style.height = `${finalH}px`;
  animContainer.style.zIndex = '10000';

  // 4. Hide original card and start animation
  cardElWrapper.style.visibility = 'hidden';

  requestAnimationFrame(() => {
    const flipCard = animContainer.querySelector('.forge-reset-flip-card');
    flipCard.classList.add('is-flipped');

    // 5. After flip, animate to discard pile
    setTimeout(() => {
      const discardCx = discardRect.left + discardRect.width / 2;
      const discardCy = discardRect.top + discardRect.height / 2;
      const dx = discardCx - startCx;
      const dy = discardCy - startCy;
      const scale = discardRect.width / finalW;

      animContainer.style.transition = 'transform 0.6s ease-in, opacity 0.6s ease-in';
      animContainer.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(15deg)`;
      animContainer.style.opacity = '0';

      // Animer la carte découverte (#90)
      if (targetCards && targetCards.length > 0) {
        // Petit délai pour que l'animation de la forge commence
        setTimeout(() => {
          const card90Def = targetCards[0];
          const card90Instance = createCardInstance(card90Def);
          const card90HTML = buildCardFrontHTML(card90Instance, -1);

          const discoveryEl = document.createElement('div');
          document.body.appendChild(discoveryEl);
          discoveryEl.innerHTML = card90HTML;

          discoveryEl.style.position = 'fixed';
          discoveryEl.style.left = `${startCx - finalW / 2}px`;
          discoveryEl.style.top = `${startCy - finalH / 2}px`;
          discoveryEl.style.width = `${finalW}px`;
          discoveryEl.style.height = `${finalH}px`;
          discoveryEl.style.zIndex = '9999';
          discoveryEl.style.opacity = '0';
          discoveryEl.style.transform = 'scale(0.8)';
          discoveryEl.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';

          // Apparition en fondu et zoom
          requestAnimationFrame(() => {
            discoveryEl.style.opacity = '1';
            discoveryEl.style.transform = 'scale(1.05)';
          });

          // Après un délai, animation vers la défausse
          setTimeout(() => {
            discoveryEl.style.transition = 'transform 0.6s ease-in, opacity 0.6s ease-in';
            discoveryEl.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(-10deg)`;
            discoveryEl.style.opacity = '0';
            discoveryEl.addEventListener('transitionend', () => discoveryEl.remove(), { once: true });
          }, 800);
        }, 200);
      }

      animContainer.addEventListener('transitionend', () => {
        animContainer.remove();
        
        // Perform state changes after animation
        cardInstance.currentFace = 1;
        cardStateMap[18] = 1;
        addLog(`🔥 <span class="log-card">${sourceCardName}</span> est réinitialisée.`, true);
        gameState.discard.push(cardInstance);

        if (targetCards && targetCards.length > 0) {
          targetCards.forEach(cardDef => {
            const newInst = createCardInstance(cardDef);
            gameState.discard.push(newInst);
            addLog(`✨ <span class="log-card">${getFaceData(newInst).nom}</span> est découverte et rejoint la défausse !`, true);
          });
        }
        
        updateUI();
      }, { once: true });

    }, 950); // Corresponds to flip animation duration + a small buffer
  });
}

// ============================================================
//  MODAL — détail d'une carte découverte (pas encore en jeu)
// ============================================================

function _renderDiscoveredFaceDetail(cardDef, faceNum) {
  const face = cardDef.faces.find(f => f.face === faceNum) || cardDef.faces[0];
  const typeColors = {
    Terrain:'#2d5a27','Bâtiment':'#7a6a5a', Batiment:'#7a6a5a',
    Personne:'#3a5a8a', Evènement:'#4a2a5a', Ennemi:'#8b0000',
    Maritime:'#1a4a6a', Etat:'#5a4a2a'
  };
  let html = '';

  if (face.description) {
    html += `<div style="background:linear-gradient(135deg,rgba(200,150,12,0.06),rgba(200,150,12,0.02));border:1px solid rgba(200,150,12,0.2);border-left:4px solid var(--gold);border-radius:0 8px 8px 0;padding:10px 14px;margin:0 0 12px;font-family:'Crimson Text',serif;font-style:italic;font-size:0.92rem;color:#e8d5a3;line-height:1.6;"><span style="font-family:'Cinzel',serif;font-size:0.52rem;font-style:normal;letter-spacing:2px;color:var(--gold);display:block;margin-bottom:5px;text-transform:uppercase;">✦ Description</span>${face.description}</div>`;
  }

  if (face.ressources && face.ressources.length) {
    const resPips = face.ressources.map(r => {
      const types = Array.isArray(r.type) ? r.type : [r.type];
      return types.map(t => {
        const icon = RESOURCE_ICONS[normalizeRes(t)] || t;
        return `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(200,150,12,0.12);border:1px solid rgba(200,150,12,0.3);border-radius:12px;padding:3px 10px;font-size:0.85rem;">${icon} <strong style="font-family:'Cinzel',serif;font-size:0.72rem;">×${r.quantite}</strong><span style="font-size:0.62rem;opacity:0.7;">${t}</span></span>`;
      }).join('');
    }).join('');
    html += `<div style="margin-bottom:12px;"><div style="font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:6px;">⚒ Production</div><div style="display:flex;flex-wrap:wrap;gap:6px;">${resPips}</div></div>`;
  }

  const victoryValue = getVictoryValue(face.victoire);
  const victoryLabel = victoryValue !== null
    ? `${victoryValue > 0 ? '+' : ''}${victoryValue} Gloire`
    : getVictoryLabel(face.victoire);
  if (victoryLabel) {
    html += `<div style="margin-bottom:12px;"><span style="background:${victoryValue < 0 ? 'rgba(139,0,0,0.3)' : 'rgba(200,150,12,0.15)'};border:1px solid ${victoryValue < 0 ? '#cc3333' : 'rgba(200,150,12,0.4)'};color:${victoryValue < 0 ? '#ffaaaa' : '#f0c040'};font-family:'Cinzel',serif;font-size:0.72rem;font-weight:700;padding:4px 12px;border-radius:10px;">${victoryValue !== null ? (victoryValue >= 0 ? '⭐' : '💀') : '✨'} ${victoryLabel}</span></div>`;
  }

  if (face.effet) {
    const efs = Array.isArray(face.effet) ? face.effet : [face.effet];
    const cfgMap = {
      Activable:  { border:'#2e7d32', bg:'rgba(27,94,32,0.18)',    icon:'🟢' },
      Passif:     { border:'#1565c0', bg:'rgba(13,71,161,0.18)',   icon:'🔵' },
      Destruction:{ border:'#bf360c', bg:'rgba(191,54,12,0.18)',   icon:'🔴' },
      Retention:  { border:'#6a1b9a', bg:'rgba(106,27,154,0.18)', icon:'🕊️' },
    };
    html += `<div style="margin-bottom:4px;"><div style="font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:6px;">⚡ Effet</div>`;
    efs.forEach(e => {
      const cfg = cfgMap[e.type] || { border:'#c8a00c', bg:'rgba(200,160,12,0.12)', icon:'⚡' };
      const defTag = e.defausse === true
        ? `<span style="background:#b71c1c;color:#fff;font-size:0.58rem;font-weight:600;padding:1px 6px;border-radius:6px;">⚠️ Se défausse</span>`
        : e.defausse === false
          ? `<span style="background:#1b5e20;color:#fff;font-size:0.58rem;font-weight:600;padding:1px 6px;border-radius:6px;">♾ Réutilisable</span>`
          : '';
      html += `<div style="background:${cfg.bg};border:1px solid ${cfg.border}50;border-left:4px solid ${cfg.border};border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap;"><span style="background:${cfg.border};color:#fff;font-size:0.62rem;font-weight:700;padding:2px 7px;border-radius:7px;font-family:'Cinzel',serif;">${cfg.icon} ${e.type}</span>${defTag}</div>`;
      if (e.description) html += `<p style="margin:0 0 5px;font-family:'Crimson Text',serif;font-size:0.92rem;color:#e8d5a3;line-height:1.5;">${e.description}</p>`;
      if (e.cout) html += `<div style="font-size:0.8rem;margin-top:3px;"><span style="background:rgba(0,0,0,0.3);color:#ffcc80;font-weight:600;padding:1px 7px;border-radius:4px;">💰 Coût</span> <span style="color:#e8d5a3;margin-left:4px;">${formatCost(e.cout)}</span></div>`;
      if (e.ressources) {
        const gainStr = (Array.isArray(e.ressources) ? e.ressources : [e.ressources]).map(x => {
          const types = Array.isArray(x.type) ? x.type : [x.type];
          if (types.length > 1) {
            return types.map(t => formatResourceGain({ type: t, quantite: x.quantite })).join(' <em style="color:#888;">ou</em> ');
          }
          return formatResourceGain(x);
        }).join('  ');
        html += `<div style="font-size:0.8rem;margin-top:3px;"><span style="background:rgba(0,0,0,0.3);color:#ffd54f;font-weight:600;padding:1px 7px;border-radius:4px;">🎁 Gains</span> <span style="color:#e8d5a3;margin-left:4px;">${gainStr}</span></div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  const promos = face.promotions ? face.promotions : (face.promotion ? [face.promotion] : []);
  if (promos.length > 0) {
    html += `<div style="margin-top:10px;"><div style="font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:6px;">▲ Évolution possible</div>`;
    promos.forEach(p => {
      const nfd = cardDef.faces.find(f => f.face === p.face);
      if (!nfd) return;
      html += `<div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.25);border:1px solid rgba(200,150,12,0.2);border-radius:8px;padding:8px 12px;margin-bottom:6px;"><span style="font-size:1.4rem;">${getCardEmoji(nfd.type, nfd.nom)}</span><div style="flex:1;"><div style="font-family:'Cinzel',serif;font-size:0.72rem;color:#f0c040;">${nfd.nom}</div><div style="font-size:0.68rem;color:#a09080;">Coût : ${formatCost(p.cout || [])}</div></div></div>`;
    });
    html += `</div>`;
  }

  return html;
}

// Bascule le panneau de détail d'une face dans la modale de découverte
function selectDiscoveredFaceTab(cardNum, faceNum) {
  const cardDef = window._discoveredCardDef;
  if (!cardDef || cardDef.numero !== cardNum) return;

  const typeColors = {
    Terrain:'#2d5a27','Bâtiment':'#7a6a5a', Batiment:'#7a6a5a',
    Personne:'#3a5a8a', Evènement:'#4a2a5a', Ennemi:'#8b0000',
    Maritime:'#1a4a6a', Etat:'#5a4a2a'
  };

  // Style des boutons onglets
  cardDef.faces.forEach(f => {
    const btn = document.getElementById('discBtn_' + cardNum + '_face' + f.face);
    if (!btn) return;
    const isActive = f.face === faceNum;
    btn.style.background    = isActive ? 'rgba(200,150,12,0.2)'       : 'rgba(0,0,0,0.4)';
    btn.style.borderColor   = isActive ? '#f0c040'                    : 'rgba(200,150,12,0.35)';
    btn.style.boxShadow     = isActive ? '0 0 12px rgba(200,150,12,0.35)' : 'none';
    btn.style.transform     = isActive ? 'translateY(-2px)'           : 'none';
  });

  const detailEl = document.getElementById('discoveredFaceDetail_' + cardNum);
  if (!detailEl) return;

  const face = cardDef.faces.find(f => f.face === faceNum);
  if (!face) return;

  const typeBg = typeColors[face.type] || '#5a5040';

  const header = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(200,150,12,0.2);">
    <div style="font-size:2.2rem;line-height:1;">${getCardEmoji(face.type, face.nom)}</div>
    <div>
      <div style="font-family:'Cinzel',serif;font-size:0.48rem;color:#888;letter-spacing:2px;margin-bottom:2px;">FACE ${faceNum}</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:0.9rem;color:var(--gold-light);">${face.nom}</div>
      <span style="display:inline-block;background:${typeBg};color:#fff;font-family:'Cinzel',serif;font-size:0.46rem;padding:1px 7px;border-radius:4px;margin-top:3px;">${face.type}</span>
      ${(() => {
        const victoryValue = getVictoryValue(face.victoire);
        return victoryValue !== null
          ? `<span style="display:inline-block;margin-left:6px;background:${victoryValue < 0 ? '#8b0000' : 'rgba(200,150,12,0.25)'};border:1px solid ${victoryValue < 0 ? '#cc3333' : 'rgba(200,150,12,0.4)'};color:${victoryValue < 0 ? '#ffaaaa' : '#f0c040'};font-family:'Cinzel',serif;font-size:0.5rem;font-weight:700;padding:1px 6px;border-radius:8px;">${victoryValue >= 0 ? '⭐' : '💀'} ${victoryValue > 0 ? '+' : ''}${victoryValue}</span>`
          : '';
      })()}
    </div>
  </div>`;

  detailEl.style.transition = 'opacity 0.15s';
  detailEl.style.opacity = '0';
  setTimeout(() => {
    detailEl.innerHTML = header + _renderDiscoveredFaceDetail(cardDef, faceNum);
    detailEl.style.opacity = '1';
  }, 150);
}

function showDiscoveredCardModal(cardNum) {
  // Résoudre la cardInstance depuis _pendingNewRound ou ALL_CARDS
  let cardInstance = null;
  if (window._pendingNewRound && window._pendingNewRound.discovered) {
    cardInstance = window._pendingNewRound.discovered.find(c => c.cardDef.numero === cardNum);
  }
  if (!cardInstance) {
    const cardDef = ALL_CARDS.find(c => c.numero === cardNum);
    if (cardDef) cardInstance = { cardDef, currentFace: 1 };
  }
  if (!cardInstance) return;

  const cardDef = cardInstance.cardDef;

  // IMPORTANT : assigner AVANT de construire le HTML (les onclick en auront besoin)
  window._discoveredCardDef = cardDef;

  const isChoice  = isChoiceCard(cardDef);
  const totalFaces = cardDef.faces.length;
  const face1 = cardDef.faces[0];
  const typeColors = {
    Terrain:'#2d5a27','Bâtiment':'#7a6a5a', Batiment:'#7a6a5a',
    Personne:'#3a5a8a', Evènement:'#4a2a5a', Ennemi:'#8b0000',
    Maritime:'#1a4a6a', Etat:'#5a4a2a'
  };

  // — En-tête
  if (isChoice) {
    $('#discoveredCardSubtitle').text('Carte #' + cardNum + ' · Identité double — choix permanent');
    $('#discoveredCardName').html('⚖️&nbsp; Identité à choisir');
    $('#discoveredCardTypeBadge').html(
      '<span style="display:inline-block;background:rgba(180,120,20,0.3);color:#f0c040;' +
      'font-family:\'Cinzel\',serif;font-size:0.58rem;letter-spacing:1px;padding:2px 10px;' +
      'border-radius:10px;border:1px solid rgba(200,150,12,0.4);">⚠️ Carte à double identité</span>'
    );
  } else {
    const typeBg = typeColors[face1.type] || '#5a5040';
    $('#discoveredCardSubtitle').text('Carte #' + cardNum + ' · ' + totalFaces + ' face' + (totalFaces > 1 ? 's' : '') + ' au total');
    $('#discoveredCardName').html(getCardEmoji(face1.type, face1.nom) + '  ' + face1.nom);
    $('#discoveredCardTypeBadge').html(
      '<span style="display:inline-block;background:' + typeBg + ';color:#fff;font-family:\'Cinzel\',serif;' +
      'font-size:0.58rem;letter-spacing:1px;padding:2px 10px;border-radius:10px;">' + face1.type + '</span>' +
      (face1.victoire !== undefined && face1.victoire !== 0
        ? '<span style="display:inline-block;margin-left:6px;background:' + (face1.victoire < 0 ? '#8b0000' : 'rgba(200,150,12,0.25)') +
          ';border:1px solid ' + (face1.victoire < 0 ? '#cc3333' : 'rgba(200,150,12,0.5)') +
          ';color:' + (face1.victoire < 0 ? '#ffaaaa' : '#f0c040') +
          ';font-family:\'Cinzel\',serif;font-size:0.6rem;font-weight:700;padding:2px 8px;border-radius:10px;">' +
          (face1.victoire >= 0 ? '⭐' : '💀') + ' ' + (face1.victoire > 0 ? '+' : '') + face1.victoire + ' Gloire</span>'
        : '')
    );
  }

  // — Corps
  let body = '';

  if (isChoice) {
    // === CARTE À DOUBLE IDENTITÉ ===
    const face2 = cardDef.faces[1];
    const typeBg1 = typeColors[face1.type] || '#5a5040';
    const typeBg2 = typeColors[face2.type] || '#5a5040';

    // Bannière d'explication
    body += `<div style="background:linear-gradient(135deg,rgba(180,120,0,0.2),rgba(120,80,0,0.15));border:2px solid rgba(200,150,12,0.4);border-radius:10px;padding:14px 16px;margin-bottom:18px;text-align:center;">
      <div style="font-size:1.6rem;margin-bottom:6px;">⚖️</div>
      <div style="font-family:'Cinzel',serif;font-size:0.72rem;font-weight:700;color:var(--gold-light);letter-spacing:1px;margin-bottom:6px;">Carte à Double Identité</div>
      <div style="font-family:'Crimson Text',serif;font-size:0.88rem;color:#e8d5a3;line-height:1.55;">
        Quand cette carte entre en jeu pour la première fois, vous devrez choisir
        <strong style="color:var(--gold);">une identité définitive</strong> entre ces deux faces.
        Ce choix sera <em>permanent</em> pour toute la partie.
      </div>
    </div>`;

    // Deux onglets miniatures cliquables
    body += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">`;
    [face1, face2].forEach(f => {
      const tBg = typeColors[f.type] || '#5a5040';
      const resStr = (f.ressources || []).map(r => {
        const types = Array.isArray(r.type) ? r.type : [r.type];
        return types.map(t => `${RESOURCE_ICONS[normalizeRes(t)]||t}×${r.quantite}`).join(' ');
      }).join(' · ');
      const hasEff = !!f.effet;
      body += `<button
        id="discBtn_${cardNum}_face${f.face}"
        onclick="selectDiscoveredFaceTab(${cardNum}, ${f.face})"
        style="padding:12px 8px;background:rgba(0,0,0,0.4);border:2px solid rgba(200,150,12,0.35);
          border-radius:10px;cursor:pointer;text-align:center;transition:all 0.2s;">
        <div style="font-family:'Cinzel',serif;font-size:0.42rem;color:#888;margin-bottom:4px;letter-spacing:2px;">FACE ${f.face}</div>
        <div style="font-size:2rem;margin-bottom:4px;">${getCardEmoji(f.type, f.nom)}</div>
        <div style="display:inline-block;background:${tBg};color:#fff;font-family:'Cinzel',serif;font-size:0.38rem;padding:1px 6px;border-radius:3px;margin-bottom:5px;">${f.type}</div>
        <div style="font-family:'Cinzel',serif;font-size:0.6rem;font-weight:700;color:var(--gold-light);line-height:1.2;margin-bottom:4px;">${f.nom}</div>
        ${resStr ? `<div style="font-size:0.52rem;color:#c8960c;margin-bottom:3px;">${resStr}</div>` : ''}
        ${f.victoire ? `<div style="font-size:0.52rem;color:${f.victoire<0?'#ff8888':'#f0c040'};margin-bottom:3px;">${f.victoire>0?'⭐':'💀'}${f.victoire}</div>` : ''}
        ${hasEff ? `<div style="font-size:0.5rem;color:#aaa;">⚡ effet</div>` : ''}
        <div style="margin-top:8px;padding:3px 8px;background:rgba(200,150,12,0.1);border:1px solid rgba(200,150,12,0.25);border-radius:5px;font-family:'Cinzel',serif;font-size:0.44rem;color:var(--gold-light);letter-spacing:1px;">
          🔍 Voir le détail
        </div>
      </button>`;
    });
    body += `</div>`;

    // Zone de détail — initialement vide avec invite
    body += `<div id="discoveredFaceDetail_${cardNum}" style="
      background:rgba(0,0,0,0.25);border:1px solid rgba(200,150,12,0.2);
      border-radius:10px;padding:14px 16px;min-height:80px;transition:opacity 0.15s;">
      <div style="font-family:'Crimson Text',serif;font-style:italic;color:#555;text-align:center;font-size:0.85rem;padding:16px 0;">
        ↑ Cliquez sur une face pour afficher son détail
      </div>
    </div>`;

  } else {
    // === CARTE NORMALE ===
    body += `<div style="text-align:center;margin:4px 0 16px;">
      <div style="font-size:4rem;line-height:1;filter:drop-shadow(0 2px 8px rgba(200,150,12,0.3));">${getCardEmoji(face1.type, face1.nom)}</div>
      <div style="margin-top:8px;display:inline-block;background:rgba(200,150,12,0.1);border:1px solid rgba(200,150,12,0.3);border-radius:20px;padding:4px 16px;">
        <span style="font-family:'Cinzel',serif;font-size:0.6rem;color:var(--gold);letter-spacing:2px;">✦ NOUVELLE DÉCOUVERTE ✦</span>
      </div>
    </div>`;
    body += _renderDiscoveredFaceDetail(cardDef, 1);

    // Chemin d'évolution
    if (totalFaces > 1) {
      body += `<div style="border-top:1px solid rgba(200,150,12,0.15);padding-top:14px;margin-top:10px;">
        <div style="font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:10px;">📜 Chemin d'évolution</div>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;overflow-x:auto;">`;
      cardDef.faces.forEach((f, idx) => {
        const tBg = typeColors[f.type] || '#5a5040';
        const resStr = (f.ressources || []).map(r => {
          const types = Array.isArray(r.type) ? r.type : [r.type];
          return types.map(t => `${RESOURCE_ICONS[normalizeRes(t)]||t}×${r.quantite}`).join(' ');
        }).join(' ');
        const isFirst = idx === 0;
        const promos = f.promotions ? f.promotions : (f.promotion ? [f.promotion] : []);
        const promoCost = promos.length > 0 ? formatCost(promos[0].cout || []) : '';
        body += `<div style="display:flex;align-items:center;gap:4px;">
          <div style="background:${isFirst ? 'rgba(200,150,12,0.2)' : 'rgba(0,0,0,0.3)'};border:2px solid ${isFirst ? '#f0c040' : 'rgba(255,255,255,0.15)'};border-radius:8px;padding:7px 9px;text-align:center;min-width:68px;max-width:85px;">
            <div style="font-size:1.3rem;">${getCardEmoji(f.type, f.nom)}</div>
            <div style="font-family:'Cinzel',serif;font-size:0.46rem;font-weight:700;color:${isFirst ? '#f0c040' : '#a09080'};margin-top:3px;line-height:1.2;">${f.nom}</div>
            <div style="background:${tBg};color:#fff;font-family:'Cinzel',serif;font-size:0.34rem;padding:1px 4px;border-radius:3px;margin-top:2px;">${f.type}</div>
            ${resStr ? `<div style="font-size:0.44rem;color:#c8960c;margin-top:2px;">${resStr}</div>` : ''}
            ${f.victoire ? `<div style="font-size:0.44rem;color:${f.victoire<0?'#ff8888':'#f0c040'};margin-top:1px;">${f.victoire>0?'⭐':'💀'}${f.victoire}</div>` : ''}
            ${isFirst ? '<div style="font-family:\'Cinzel\',serif;font-size:0.36rem;color:#f0c040;margin-top:2px;">DÉPART</div>' : ''}
          </div>`;
        if (idx < cardDef.faces.length - 1) {
          body += `<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;min-width:40px;">
            ${promoCost ? `<div style="font-size:0.42rem;color:#886633;text-align:center;margin-bottom:2px;">${promoCost}</div>` : ''}
            <div style="display:flex;align-items:center;">
              <div style="height:2px;width:12px;background:${promoCost ? '#664422' : 'rgba(255,255,255,0.15)'};"></div>
              <div style="width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:7px solid ${promoCost ? '#664422' : 'rgba(255,255,255,0.15)'};"></div>
            </div>
          </div>`;
        }
        body += `</div>`;
      });
      body += `</div></div>`;
    }
  }

  $('#discoveredCardBody').html(body);
  new bootstrap.Modal(document.getElementById('discoveredCardModal')).show();
}