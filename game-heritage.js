// ============================================================
//  GAME-HERITAGE.JS — Système Héritage, Armée & Rétention
//  Dépend de : game-state.js, game-bandit.js, game-ui.js
// ============================================================

// ============================================================
//  HELPERS — Construction des cardInstances level-1 (cartes 23-27)
// ============================================================

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

// ============================================================
//  HÉRITAGE — Modal règle (carte #23)
// ============================================================

// Affiche le modal de la Règle Héritage (carte #23)
function _showHeritageRuleModal(allCards) {
  const rule23 = LEGACY_CARDS.find(c => c.numero === 23);
  if (!rule23) { _continueNewRoundAfterHeritage(allCards); return; }

  const desc = rule23.description || '';
  const html = `
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-size:3rem;margin-bottom:8px;">📜</div>
      <div style="font-family:'Cinzel',serif;font-size:0.65rem;color:var(--stone);letter-spacing:2px;margin-bottom:4px;">CARTE #23 — RÈGLE</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:1.1rem;color:var(--gold-light);margin-bottom:12px;">L'Héritage du Royaume — Manche 7 accomplie</div>
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
    `;

  document.getElementById('heritageRuleBody').innerHTML = html;
  window._heritageAllCards = allCards;
  new bootstrap.Modal(document.getElementById('heritageRuleModal')).show();
}

// ============================================================
//  HÉRITAGE — Inspection des cartes 24-27
// ============================================================

// File d'inspection des cartes 24-27 : { allCards, queue: [cardData,...], currentIndex }
let _heritageInspectState = null;

// Appelé quand le joueur clique "J'ai lu la règle" dans le modal #23
// Lance l'inspection une par une des cartes 24-27
function confirmHeritageRule() {
  bootstrap.Modal.getInstance(document.getElementById('heritageRuleModal'))?.hide();
  const allCards = window._heritageAllCards;
  window._heritageAllCards = null;

  const queue = [24, 25, 26, 27]
    .map(num => LEGACY_CARDS.find(c => c.numero === num))
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

// Reprend le fil de newRound() après le déclenchement de l'Héritage
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
  const raw = LEGACY_CARDS.find(c => c.numero === 25);
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

  // Retirer temporairement la carte de play[] sans la défausser encore.
  // Elle sera défaussée à la confirmation, ou remise en jeu si le joueur ferme.
  _playRemove(playIndex);
  window._retentionSourceCard = cardInstance;

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

  const toSelect = Math.min(count, eligible.length);

  let html = `
    <p style="font-family:'Crimson Text',serif;font-size:0.9rem;color:#f5e6c8;text-align:center;margin:0 0 14px;">
      Choisissez <strong style="color:#f0c040;">${toSelect}</strong> carte${toSelect>1?'s':''} à conserver pour la prochaine manche.
    </p>
    <div id="retentionCardList" style="display:flex;flex-direction:column;gap:8px;">`;

  eligible.forEach((ci, i) => {
    const face = getFaceData(ci);
    const playIdx = gameState.play.indexOf(ci);
    const blocked = isBlockedByBandit(playIdx);
    const isBanditCard = isBandit(ci);
    const typeColors = { Personne:'#2a4a7a', Terrain:'#1e4a1a', Bâtiment:'#5a4a3a', Batiment:'#5a4a3a', Ennemi:'#5a0a0a' };
    const bg = blocked ? '#5a3a00' : (typeColors[face.type] || '#3a3a3a');
    const isDisabled = blocked; // une carte bloquée ne peut pas être retenue

    html += `
      <button id="retBtn_${i}"
        ${isDisabled ? 'disabled' : `onclick="toggleRetentionCard(${i}, ${toSelect})"`}
        style="
          width:100%;text-align:left;
          background:${isDisabled ? 'rgba(40,20,0,0.5)' : 'linear-gradient(135deg,#1a1408,#0e0e06)'};
          border:2px solid ${bg};border-radius:10px;padding:10px 14px;
          cursor:${isDisabled ? 'not-allowed' : 'pointer'};
          display:flex;align-items:center;gap:12px;transition:all 0.2s;
          opacity:${isDisabled ? '0.45' : '1'};"
        data-cardnum="${ci.cardDef.numero}">
        <div style="min-width:34px;text-align:center;background:rgba(0,0,0,0.4);border:1px solid ${bg};border-radius:5px;padding:3px 2px;font-family:'Cinzel',serif;color:var(--gold);font-size:0.6rem;">#${ci.cardDef.numero}</div>
        <div style="font-size:1.8rem;">${getCardEmoji(face.type, face.nom)}</div>
        <div style="flex:1;">
          <div style="font-family:'Cinzel',serif;font-weight:700;color:${isDisabled ? '#aa6622' : 'var(--gold-light)'};font-size:0.82rem;">${face.nom}</div>
          <div style="font-size:0.6rem;color:#888;">${face.type}</div>
          ${isDisabled ? `<div style="font-size:0.58rem;color:#cc6600;margin-top:2px;">🔒 Bloquée par un Bandit — ne peut pas être retenue</div>` : ''}
          ${isBanditCard ? `<div style="font-size:0.58rem;color:#ffaaaa;margin-top:2px;">⚔️ Retenir ce Bandit lèvera son blocage</div>` : ''}
        </div>
        <div id="retCheck_${i}" style="font-size:1.4rem;opacity:0;">✅</div>
      </button>`;
  });

  html += `</div>
    <div style="text-align:center;margin-top:16px;display:flex;gap:10px;justify-content:center;">
      <button onclick="closeRetentionModal()" style="
        font-family:'Cinzel',serif;font-size:0.72rem;letter-spacing:1px;
        background:rgba(60,40,20,0.6);border:1px solid rgba(139,105,20,0.4);
        color:var(--stone-light);padding:10px 20px;border-radius:6px;cursor:pointer;">
        ✕ Fermer
      </button>
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

function closeRetentionModal() {
  bootstrap.Modal.getInstance(document.getElementById('retentionModal'))?.hide();
  window._retentionSelected = [];
  // Remettre la carte source en jeu — l'effet n'est pas activé
  if (window._retentionSourceCard) {
    gameState.play.push(window._retentionSourceCard);
    window._retentionSourceCard = null;
    updateUI();
  }
}

function confirmRetentionSelection() {
  bootstrap.Modal.getInstance(document.getElementById('retentionModal'))?.hide();
  const selected = window._retentionSelected || [];
  window._retentionSelected = [];

  // Défausser la carte source maintenant que l'effet est confirmé
  const sourceCard = window._retentionSourceCard;
  window._retentionSourceCard = null;
  if (sourceCard) {
    gameState.discard.push(sourceCard);
    const fd = getFaceData(sourceCard);
    addLog(`🕊️ <span class="log-card">${fd.nom}</span> — défaussée pour retenir ${selected.length} carte${selected.length > 1 ? 's' : ''}.`, true);
  }

  if (!gameState.retained) gameState.retained = [];
  if (!gameState.retainedCards) gameState.retainedCards = [];
  selected.forEach(n => {
    if (!gameState.retained.includes(n)) {
      gameState.retained.push(n);
      // Récupérer l'instance depuis play[] et la déplacer dans retainedCards
      const idx = gameState.play.findIndex(c => c.cardDef.numero === n);
      if (idx >= 0) {
        const [ci] = gameState.play.splice(idx, 1);
        gameState.retainedCards.push(ci);
        // Si c'est un bandit, lever son blocage sur la carte cible
        if (isBandit(ci)) {
          updateBanditIndices(ci.cardDef.numero);
          addLog(`🗡️ <span class="log-card">Bandit</span> retenu — blocage levé.`);
        }
      }
    }
  });
  const names = selected.map(n => {
    const ci = gameState.retainedCards.find(c => c.cardDef.numero === n);
    return ci ? `<span class="log-card">${getFaceData(ci).nom}</span>` : `#${n}`;
  });
  addLog(`🕊️ Retenue${names.length > 1 ? 's' : ''} : ${names.join(', ')} — visible${names.length > 1 ? 's' : ''} jusqu'à la fin de la manche.`, true);
  updateUI();
}
