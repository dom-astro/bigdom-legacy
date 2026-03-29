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
    const carte24Used = gameState.carte24EffetsUtilises || [];
    effetHTML = `
      <div style="margin-top:16px;">
        <div style="font-family:'Cinzel',serif;font-size:0.65rem;color:${color};letter-spacing:2px;margin-bottom:8px;">EFFETS PERMANENTS</div>
        ${cardData.effet.map((e, i) => {
          const used = carte24Used.includes(i);
          // Prévisualisation des stickers disponibles
          const stickerPreviews = (e.stickers || []).map(id => {
            const s = (typeof STICKERS !== 'undefined') ? STICKERS.find(st => st.id === id) : null;
            return s ? `<span style="background:rgba(74,122,170,0.25);border:1px solid #4a7aaa55;border-radius:4px;padding:1px 6px;font-size:0.52rem;color:#88bbff;">&#x1F3F7; ${_stickerLabel(s)}</span>` : '';
          }).filter(Boolean).join(' ');
          return `
          <div style="
            background:${used ? 'rgba(20,20,20,0.5)' : 'rgba(0,0,0,0.3)'};
            border-left:3px solid ${used ? '#444' : color};
            border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:8px;
            opacity:${used ? 0.5 : 1};">
            <div style="font-family:'Crimson Text',serif;font-size:0.9rem;color:${used ? '#666' : 'var(--parchment)'};line-height:1.5;margin-bottom:6px;">
              ${used ? '<s>' : ''}\u2746 ${e.description || e.type}${used ? '</s>' : ''}
            </div>
            ${stickerPreviews ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${stickerPreviews}</div>` : ''}
            ${e.cible ? `<div style="font-size:0.58rem;color:#888;margin-bottom:6px;">Cible : <strong style="color:#aaa;">${e.cible}</strong></div>` : ''}
            ${used
              ? `<div style="font-family:'Cinzel',serif;font-size:0.58rem;color:#8acc44;">\u2713 Effet appliqu\xe9</div>`
              : e.type_effet === 'sticker'
                ? `<button onclick="applyStickerFromCarte24(${i})" style="
                    font-family:'Cinzel',serif;font-size:0.6rem;font-weight:700;letter-spacing:0.5px;
                    background:linear-gradient(135deg,#1a3a6a,#2a5a9a);border:2px solid #4a7aaa;
                    color:#aaddff;padding:5px 12px;border-radius:6px;cursor:pointer;margin-top:2px;">
                    &#x1F3F7; Appliquer l'autocollant
                  </button>`
                : ''
            }
          </div>`;
        }).join('')}
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
//  CARTE 26 — TRÉSOR / TRÉSOR ÉTENDU
// ============================================================

// État de progression de la carte 26 (persisté dans gameState)
// gameState.tresorProgress = { face: 1|2, casesMarquees: 0 }

function _getTresorData(face) {
  const raw = LEGACY_CARDS.find(c => c.numero === 26);
  if (!raw || !raw.faces) return null;
  return raw.faces.find(f => f.face === face) || null;
}

function _getTresorProgress() {
  if (!gameState.tresorProgress) gameState.tresorProgress = { face: 1, casesMarquees: 0 };
  return gameState.tresorProgress;
}

// Ouvre le modal d'investissement pour la carte Trésor
// Même structure qu'openArmeeModal : face active uniquement, section "face suivante" verrouillée
function openTresorModal() {
  const prog     = _getTresorProgress();
  const faceData = _getTresorData(prog.face);
  if (!faceData) return;

  const cases      = faceData.cases || [];
  const nextIndex  = prog.casesMarquees;
  const nextCase   = cases[nextIndex];
  const projected  = getProjectedResources();
  const orDispo    = projected['Or'] || 0;

  const nomCarte       = prog.face === 1 ? '🪙 Trésor' : '🪙 Trésor Étendu';
  const glBonus        = faceData.gloire_bonus || 0;
  const glorieActuelle = glBonus + (nextIndex > 0 ? cases[nextIndex - 1].gloire : 0);

  // ── Grille des cases de la face active ────────────────────
  let casesHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:16px 0;">';
  cases.forEach((c, i) => {
    const marked     = i < prog.casesMarquees;
    const isCurrent  = i === nextIndex;
    const locked     = i > nextIndex;
    let bg, border, textColor;
    if (marked)        { bg = 'linear-gradient(135deg,#3a5a1a,#5a8a2a)'; border = '#8acc44'; textColor = '#ccff88'; }
    else if (isCurrent){ bg = 'linear-gradient(135deg,#3a3010,#7a6020)'; border = '#f0c040'; textColor = '#f0c040'; }
    else               { bg = 'rgba(0,0,0,0.3)';                         border = '#444';    textColor = '#666';    }

    const icon = marked ? '✓' : isCurrent ? '▶' : '🔒';
    casesHTML += `
      <div style="
        background:${bg};border:2px solid ${border};border-radius:8px;
        padding:8px 10px;text-align:center;min-width:56px;
        opacity:${locked ? 0.4 : 1};transition:all 0.2s;">
        <div style="font-size:0.55rem;color:${textColor};font-family:'Cinzel',serif;">${icon} Case ${c.index}</div>
        <div style="font-size:0.65rem;color:#fff;margin:3px 0;">${c.cout_or}🪙</div>
        ${c.promotion
          ? '<div style="font-size:0.6rem;color:#f0c040;">🔱 Promo</div>'
          : `<div style="font-size:0.7rem;color:#f0c040;font-weight:bold;">★${c.gloire}</div>`}
      </div>`;
  });
  casesHTML += '</div>';

  // ── Section "face suivante" verrouillée (si face 1 active) ─
  let nextFaceHTML = '';
  if (prog.face === 1) {
    const face2Data  = _getTresorData(2);
    const f2Cases    = face2Data?.cases || [];
    const f2Bonus    = face2Data?.gloire_bonus || 0;
    const f2MaxGloire = f2Cases.length > 0 ? f2Cases[f2Cases.length - 1].gloire : 0;
    nextFaceHTML = `
      <div style="
        border-top:2px solid rgba(255,255,255,0.08);
        padding-top:12px;margin-top:4px;opacity:0.4;">
        <div style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:2px;color:#555;margin-bottom:8px;">
          🔒 TRÉSOR ÉTENDU — Se débloque après la case 12 (+${f2Bonus} gloire bonus)
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">
          ${f2Cases.map(c => `
            <div style="
              background:rgba(0,0,0,0.3);border:1px solid #333;border-radius:6px;
              padding:5px 7px;text-align:center;min-width:46px;">
              <div style="font-size:0.48rem;color:#555;font-family:'Cinzel',serif;">🔒 ${c.index}</div>
              <div style="font-size:0.55rem;color:#444;margin:2px 0;">${c.cout_or}🪙</div>
              <div style="font-size:0.55rem;color:#555;font-weight:bold;">★${c.gloire}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // ── Panneau "prochaine case" + bouton ─────────────────────
  const canMark = !!nextCase && orDispo >= (nextCase.cout_or || 0);
  const allDone = nextIndex >= cases.length;

  let actionHTML = '';
  if (allDone) {
    actionHTML = `<p style="text-align:center;font-family:'Cinzel',serif;font-size:0.8rem;color:#8acc44;">✅ Toutes les cases sont marquées !</p>`;
  } else {
    const coutOr   = nextCase.cout_or || 0;
    const gainLabel = nextCase.promotion
      ? '🔱 Promotion → Trésor Étendu (+50 gloire bonus)'
      : `Gain : ★ ${nextCase.gloire} gloire`;
    actionHTML = `
      <div style="
        background:rgba(0,0,0,0.3);border:1px solid ${canMark ? '#f0c040' : '#444'};
        border-radius:10px;padding:14px;text-align:center;margin-top:8px;">
        <div style="font-family:'Cinzel',serif;font-size:0.75rem;color:#aaa;margin-bottom:6px;">Prochaine case</div>
        <div style="font-size:1.1rem;color:#fff;margin-bottom:4px;">
          Coût : <strong style="color:#f5c842;">${coutOr} 🪙</strong>
        </div>
        <div style="font-size:0.9rem;color:#f0c040;">${gainLabel}</div>
        <div style="font-size:0.75rem;color:${canMark ? '#aaffaa' : '#ff8888'};margin-top:6px;">
          ${canMark
            ? `✅ Vous avez ${orDispo}🪙 — vous pouvez marquer`
            : `❌ Il vous faut ${coutOr}🪙 (vous avez ${orDispo})`}
        </div>
      </div>
      <div style="text-align:center;margin-top:14px;">
        <button onclick="confirmTresorCase()" ${canMark ? '' : 'disabled'} style="
          font-family:'Cinzel',serif;font-weight:700;font-size:0.8rem;
          letter-spacing:1px;text-transform:uppercase;
          background:${canMark ? 'linear-gradient(135deg,#5a4a08,#c8960c,#5a4a08)' : 'rgba(0,0,0,0.4)'};
          border:2px solid ${canMark ? '#f0c040' : '#444'};
          color:${canMark ? '#1a0e04' : '#666'};
          padding:10px 28px;border-radius:6px;cursor:${canMark ? 'pointer' : 'not-allowed'};
          transition:all 0.2s;">
          🪙 Marquer la case ${nextCase.index}
        </button>
      </div>`;
  }

  // ── Assemblage ────────────────────────────────────────────
  const body = `
    <div style="text-align:center;margin-bottom:10px;">
      <div style="font-size:0.6rem;font-family:'Cinzel',serif;color:#888;letter-spacing:2px;">CARTE #26 — PERMANENTE</div>
      <div style="font-size:0.75rem;font-family:'Cinzel',serif;color:#aaa;margin-top:4px;font-style:italic;">${faceData.description}</div>
    </div>
    <div style="text-align:center;font-family:'Cinzel',serif;font-size:0.75rem;color:#f0c040;margin-bottom:4px;">
      Gloire actuelle de la carte : <strong>★ ${glorieActuelle}</strong>
      ${glBonus ? `<span style="color:#aaa;font-size:0.65rem;"> (bonus ${glBonus} + case)</span>` : ''}
    </div>
    ${casesHTML}
    ${nextFaceHTML}
    ${actionHTML}`;

  document.getElementById('tresorModalTitle').textContent = nomCarte;
  document.getElementById('tresorModalBody').innerHTML = body;
  new bootstrap.Modal(document.getElementById('tresorModal')).show();
}

// Confirme le marquage de la prochaine case du Trésor
function confirmTresorCase() {
  bootstrap.Modal.getInstance(document.getElementById('tresorModal'))?.hide();

  const prog     = _getTresorProgress();
  const faceData = _getTresorData(prog.face);
  if (!faceData) return;
  const cases    = faceData.cases || [];
  const nextCase = cases[prog.casesMarquees] || null;
  if (!nextCase || nextCase.cout_or == null) {
    addLog(`❌ Trésor — aucune case disponible à marquer.`);
    return;
  }

  // Dépenser l'Or
  gameState.resources['Or'] = Math.max(0, (gameState.resources['Or'] || 0) - nextCase.cout_or);

  prog.casesMarquees++;

  if (nextCase.promotion) {
    // Case 12 (dernière de face 1) → promotion vers Trésor Étendu
    prog.face = 2;
    prog.casesMarquees = 0;
    addLog(`🔱 <span class="log-card">Trésor</span> → <span class="log-card">Trésor Étendu</span> ! -${nextCase.cout_or}🪙 ✨ +50 gloire bonus débloqué`, true);
  } else {
    const gloire = nextCase.gloire;
    const bonus  = faceData.gloire_bonus || 0;
    const total  = bonus + gloire;
    addLog(`🪙 <span class="log-card">${faceData.nom}</span> — case ${nextCase.index} marquée ! -${nextCase.cout_or}🪙 ★${total} gloire`, true);
  }

  _updateTresorGloire();
  updateUI();
  // Rouvrir le modal avec l'état mis à jour (même comportement qu'openArmeeModal)
  setTimeout(() => openTresorModal(), 200);
}

// Recalcule et applique la gloire du Trésor dans gameState.fame
function _updateTresorGloire() {
  const prog     = _getTresorProgress();
  const faceData = _getTresorData(prog.face);
  if (!faceData) return;
  const cases  = faceData.cases || [];
  const bonus  = faceData.gloire_bonus || 0;

  // Gloire de la dernière case marquée dans la face active
  const lastMarked = prog.casesMarquees > 0 ? cases[prog.casesMarquees - 1] : null;
  // Si on vient de passer en face 2 (casesMarquees=0), la gloire bonus s'applique sans case
  const caseGloire = lastMarked && !lastMarked.promotion ? lastMarked.gloire : 0;
  const newGloire  = bonus + caseGloire;

  const prev = gameState.tresorGloirePrev || 0;
  const diff = newGloire - prev;
  if (diff !== 0) {
    gameState.fame = Math.max(0, (gameState.fame || 0) + diff);
    gameState.tresorGloirePrev = newGloire;
    if (diff > 0) addLog(`⭐ Gloire Trésor +${diff} → Total : ${gameState.fame}`, true);
  }
}

// ============================================================
//  CARTE 27 — EXPORT / MASS EXPORT
// ============================================================

// Structure de gameState.exportProgress :
// {
//   face: 1|2,           — face active (1=Export, 2=Mass Export)
//   totalDepense: 0,     — cumul total de Marchandises dépensées (jamais réinitialisé)
//   seuilsUtilises: [],  — indices des seuils déjà utilisés (barrés)
// }

function _getExportData(face) {
  const raw = LEGACY_CARDS.find(c => c.numero === 27);
  if (!raw || !raw.faces) return null;
  return raw.faces.find(f => f.face === face) || null;
}

function _getExportProgress() {
  if (!gameState.exportProgress) {
    gameState.exportProgress = { face: 1, totalDepense: 0, seuilsUtilises: [] };
  }
  return gameState.exportProgress;
}

// Renvoie tous les seuils (face 1 + face 2) triés par cout_total
function _getAllExportSeuils() {
  const f1 = _getExportData(1);
  const f2 = _getExportData(2);
  return [
    ...(f1 ? f1.seuils : []),
    ...(f2 ? f2.seuils : []),
  ];
}

// Renvoie les seuils atteints mais pas encore utilisés (disponibles entre les tours)
function _getExportSeuilsDisponibles() {
  const prog = _getExportProgress();
  return _getAllExportSeuils().filter(s =>
    prog.totalDepense >= s.cout_total && !prog.seuilsUtilises.includes(s.index)
  );
}

// Ouvre le modal principal de la carte Export
function openExportModal() {
  const prog       = _getExportProgress();
  const projected  = getProjectedResources();
  const marcDispo  = projected['Troc'] || 0; // Troc = Marchandise dans le jeu
  const allSeuils  = _getAllExportSeuils();
  const face1Data  = _getExportData(1);
  const face2Data  = _getExportData(2);
  const isMassExport = prog.face === 2;
  const nomCarte   = isMassExport ? '🛒 Mass Export' : '🛒 Export';

  // Seuils disponibles (non encore utilisés et atteints)
  const disponibles = _getExportSeuilsDisponibles();

  // ── Barre de progression globale ──────────────────────────
  const maxTotal = allSeuils[allSeuils.length - 1]?.cout_total || 300;
  const pctGlobal = Math.min(100, Math.round((prog.totalDepense / maxTotal) * 100));

  // ── Rendu d'un seuil ──────────────────────────────────────
  function renderSeuil(s) {
    const atteint   = prog.totalDepense >= s.cout_total;
    const utilise   = prog.seuilsUtilises.includes(s.index);
    const estPromo  = s.type_effet === 'promotion';
    let bg, border, textColor, icon;
    if (utilise)       { bg = 'rgba(40,40,40,0.5)';  border = '#444';    textColor = '#555';    icon = '✗'; }
    else if (atteint)  { bg = 'linear-gradient(135deg,#1a3a1a,#2a5a2a)'; border = '#66cc44'; textColor = '#ccff88'; icon = '✅'; }
    else               { bg = 'rgba(0,0,0,0.3)';     border = '#444';    textColor = '#666';    icon = '🔒'; }

    const typeTag = s.type_effet === 'sticker'
      ? `<span style="font-size:0.52rem;background:rgba(74,122,170,0.3);border:1px solid #4a7aaa55;border-radius:4px;padding:1px 5px;color:#88bbff;">🏷 Autocollant</span>`
      : s.type_effet === 'decouverte'
        ? `<span style="font-size:0.52rem;background:rgba(200,150,12,0.25);border:1px solid #c8960c55;border-radius:4px;padding:1px 5px;color:#f0c040;">✨ Découverte</span>`
        : s.type_effet === 'promotion'
          ? `<span style="font-size:0.52rem;background:rgba(136,68,204,0.3);border:1px solid #8844cc55;border-radius:4px;padding:1px 5px;color:#cc88ff;">🔱 Promotion</span>`
          : `<span style="font-size:0.52rem;background:rgba(200,80,20,0.25);border:1px solid #c8501455;border-radius:4px;padding:1px 5px;color:#ffaa66;">⚡ Spécial</span>`;

    const btnHTML = (atteint && !utilise && !estPromo)
      ? `<button onclick="utiliserSeuilExport(${s.index})" style="
           font-family:'Cinzel',serif;font-size:0.55rem;font-weight:700;letter-spacing:0.5px;
           background:linear-gradient(135deg,#1e5a1a,#3a8a2a);border:2px solid #66cc44;
           color:#ccff88;padding:3px 8px;border-radius:5px;cursor:pointer;margin-top:4px;">
           ✗ Utiliser cet effet
         </button>`
      : (atteint && !utilise && estPromo)
        ? `<button onclick="utiliserSeuilExport(${s.index})" style="
             font-family:'Cinzel',serif;font-size:0.55rem;font-weight:700;letter-spacing:0.5px;
             background:linear-gradient(135deg,#3a1a5a,#6a2a8a);border:2px solid #aa44ff;
             color:#ddaaff;padding:3px 8px;border-radius:5px;cursor:pointer;margin-top:4px;">
             🔱 Promouvoir
           </button>`
        : '';

    return `
      <div style="
        display:flex;align-items:flex-start;gap:8px;
        background:${bg};border:1px solid ${border};border-radius:8px;
        padding:8px 10px;margin-bottom:6px;
        opacity:${utilise ? 0.45 : 1};
        ${utilise ? 'text-decoration:line-through;' : ''}">
        <div style="font-size:1rem;flex-shrink:0;margin-top:1px;">${icon}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
            <span style="font-family:'Cinzel',serif;font-size:0.62rem;font-weight:700;color:${atteint ? '#f0c040' : '#666'};">${s.cout_total} 🏺</span>
            ${typeTag}
          </div>
          <div style="font-family:'Crimson Text',serif;font-size:0.82rem;color:${textColor};line-height:1.4;">${s.effet}</div>
          ${btnHTML}
        </div>
      </div>`;
  }

  // ── Sections face 1 / face 2 ──────────────────────────────
  const face1Seuils = face1Data?.seuils || [];
  const face2Seuils = face2Data?.seuils || [];
  const face2Unlocked = isMassExport;

  const section1 = `
    <div style="margin-bottom:10px;">
      <div style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:2px;
        color:${isMassExport ? '#8acc44' : '#f0c040'};margin-bottom:8px;">
        ${isMassExport ? '✅ EXPORT — COMPLÉTÉ' : '🛒 EXPORT — Seuils 10 à 100'}
      </div>
      ${face1Seuils.map(renderSeuil).join('')}
    </div>`;

  const section2 = `
    <div style="border-top:2px solid ${face2Unlocked ? 'rgba(136,68,204,0.4)' : 'rgba(255,255,255,0.08)'};padding-top:12px;">
      <div style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:2px;
        color:${!face2Unlocked ? '#555' : '#cc88ff'};margin-bottom:8px;">
        ${!face2Unlocked ? '🔒 MASS EXPORT — Débloquer à 100 🏺' : '🛒 MASS EXPORT — Seuils 125 à 300'}
      </div>
      <div style="opacity:${face2Unlocked ? 1 : 0.3};">
        ${face2Seuils.map(renderSeuil).join('')}
      </div>
    </div>`;

  // ── Panneau investissement ─────────────────────────────────
  const canInvest = marcDispo >= 1;
  let investHTML = `
    <div style="
      background:rgba(0,0,0,0.3);border:1px solid ${canInvest ? '#8844cc' : '#333'};
      border-radius:10px;padding:12px 14px;margin-top:12px;text-align:center;">
      <div style="font-family:'Cinzel',serif;font-size:0.7rem;color:#aaa;margin-bottom:6px;">
        Dépenser des Marchandises
      </div>
      <div style="font-size:0.9rem;color:#e8d5a3;margin-bottom:4px;">
        Total dépensé : <strong style="color:#cc88ff;">${prog.totalDepense} 🏺</strong>
      </div>
      <div style="font-size:0.78rem;color:${canInvest ? '#aaffaa' : '#ff8888'};margin-bottom:8px;">
        ${canInvest ? `Vous avez ${marcDispo} 🏺 disponible${marcDispo > 1 ? 's' : ''}` : 'Aucune Marchandise disponible'}
      </div>`;

  if (canInvest) {
    // Proposer des montants rapides : 1, 5, ou tout
    const opts = [1, 5, marcDispo].filter((v, i, a) => v <= marcDispo && a.indexOf(v) === i).sort((a,b) => a-b);
    investHTML += `<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">`;
    opts.forEach(n => {
      investHTML += `<button onclick="investirExport(${n})" style="
        font-family:'Cinzel',serif;font-weight:700;font-size:0.72rem;letter-spacing:1px;
        background:linear-gradient(135deg,#3a1a5a,#6a2a8a);border:2px solid #aa44ff;
        color:#ddaaff;padding:6px 14px;border-radius:6px;cursor:pointer;transition:all 0.2s;">
        +${n} 🏺
      </button>`;
    });
    investHTML += `</div>`;
  }
  investHTML += `</div>`;

  // ── Alerte seuils disponibles ──────────────────────────────
  let alerteHTML = '';
  if (disponibles.length > 0) {
    alerteHTML = `
      <div style="
        background:rgba(40,100,40,0.2);border:2px solid #66cc44;border-radius:8px;
        padding:8px 12px;margin-top:10px;text-align:center;
        font-family:'Cinzel',serif;font-size:0.68rem;color:#aaffaa;letter-spacing:1px;">
        🎉 ${disponibles.length} effet${disponibles.length > 1 ? 's' : ''} disponible${disponibles.length > 1 ? 's' : ''} — à utiliser entre les tours !
      </div>`;
  }

  const body = `
    <div style="text-align:center;margin-bottom:12px;">
      <div style="font-size:0.6rem;font-family:'Cinzel',serif;color:#888;letter-spacing:2px;">CARTE #27 — PERMANENTE</div>
      <div style="font-family:'Crimson Text',serif;font-size:0.78rem;color:#aaa;font-style:italic;margin-top:4px;">
        Dépensez vos Marchandises à tout moment. Utilisez les effets <em>entre les tours</em>.
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <div style="font-family:'Cinzel',serif;font-size:0.6rem;color:#cc88ff;">Progression globale</div>
        <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${pctGlobal}%;background:linear-gradient(90deg,#8844cc,#cc44ff);border-radius:3px;transition:width 0.4s;"></div>
        </div>
        <div style="font-family:'Cinzel',serif;font-size:0.6rem;color:#cc88ff;">${prog.totalDepense}/${maxTotal} 🏺</div>
      </div>
    </div>
    ${section1}
    ${section2}
    ${investHTML}
    ${alerteHTML}`;

  document.getElementById('exportModalTitle').textContent = nomCarte;
  document.getElementById('exportModalBody').innerHTML = body;
  new bootstrap.Modal(document.getElementById('exportModal')).show();
}

// Investit N Marchandises dans l'Export (sans fermer le modal)
function investirExport(n) {
  const projected = getProjectedResources();
  const marcDispo = projected['Troc'] || 0;
  const aDepenser = Math.min(n, marcDispo);
  if (aDepenser <= 0) {
    addLog(`❌ Export — aucune Marchandise disponible.`);
    return;
  }

  const prog = _getExportProgress();
  const ancienTotal = prog.totalDepense;

  // Dépenser immédiatement (pas de staging — l'investissement est instantané)
  gameState.resources['Troc'] = Math.max(0, (gameState.resources['Troc'] || 0) - aDepenser);
  prog.totalDepense += aDepenser;

  addLog(`🛒 <span class="log-card">Export</span> — ${aDepenser} 🏺 investie${aDepenser > 1 ? 's' : ''} (total : ${prog.totalDepense} 🏺).`);

  // Détecter si un nouveau seuil de promotion est atteint
  const allSeuils = _getAllExportSeuils();
  allSeuils.forEach(s => {
    if (s.type_effet === 'promotion' && ancienTotal < s.cout_total && prog.totalDepense >= s.cout_total) {
      // Promotion automatique vers Mass Export
      prog.face = 2;
      addLog(`🔱 <span class="log-card">Export</span> → <span class="log-card">Mass Export</span> ! Le commerce s'emballe.`, true);
    } else if (ancienTotal < s.cout_total && prog.totalDepense >= s.cout_total) {
      addLog(`🎉 Nouveau seuil Export atteint : <strong>${s.effet}</strong> — à utiliser entre les tours !`, true);
    }
  });

  bootstrap.Modal.getInstance(document.getElementById('exportModal'))?.hide();
  // Rouvrir après recalcul UI
  setTimeout(() => openExportModal(), 200);
  updateUI();
}

// Marque un seuil comme utilisé (barré)
function utiliserSeuilExport(seuilIndex) {
  const prog = _getExportProgress();
  if (prog.seuilsUtilises.includes(seuilIndex)) return;

  const seuil = _getAllExportSeuils().find(s => s.index === seuilIndex);
  if (!seuil) return;
  if (prog.totalDepense < seuil.cout_total) {
    addLog(`❌ Export — seuil ${seuil.cout_total} 🏺 non encore atteint.`);
    return;
  }

  // Promotion : changer de face
  if (seuil.type_effet === 'promotion') {
    prog.face = 2;
    prog.seuilsUtilises.push(seuilIndex);
    addLog(`🔱 <span class="log-card">Export</span> → <span class="log-card">Mass Export</span> !`, true);
    bootstrap.Modal.getInstance(document.getElementById('exportModal'))?.hide();
    setTimeout(() => openExportModal(), 200);
    updateUI();
    return;
  }

  // Découverte d'une carte
  if (seuil.type_effet === 'decouverte' && seuil.carte) {
    prog.seuilsUtilises.push(seuilIndex);
    const allPool = [
      ...ALL_CARDS,
      ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : []),
    ];
    const cardDef = allPool.find(c => c.numero === seuil.carte);
    if (cardDef) {
      _discoverByEffect(cardDef);
    } else {
      addLog(`📦 Export — carte #${seuil.carte} introuvable.`);
    }
    addLog(`✨ <span class="log-card">Export</span> — effet « ${seuil.effet} » utilisé.`, true);
    bootstrap.Modal.getInstance(document.getElementById('exportModal'))?.hide();
    setTimeout(() => openExportModal(), 200);
    updateUI();
    return;
  }

  // Autocollant : ouvrir le modal de sélection de sticker + cible
  if (seuil.type_effet === 'sticker') {
    prog.seuilsUtilises.push(seuilIndex);
    bootstrap.Modal.getInstance(document.getElementById('exportModal'))?.hide();
    // Petit délai pour que le modal Export se ferme avant d'ouvrir le modal sticker
    setTimeout(() => applyStickerFromExport(seuil), 250);
    updateUI();
    return;
  }

  // Effet spécial ou inconnu : on marque comme utilisé (le joueur applique manuellement)
  prog.seuilsUtilises.push(seuilIndex);
  addLog(`\u2717 <span class="log-card">Export</span> \u2014 effet barr\xe9\u00a0: \u00ab\u00a0${seuil.effet}\u00a0\u00bb. \xc0 appliquer manuellement.`, true);
  bootstrap.Modal.getInstance(document.getElementById('exportModal'))?.hide();
  setTimeout(() => openExportModal(), 200);
  updateUI();
}

// ============================================================
//  STICKERS — Autocollants permanents sur les cartes du royaume
// ============================================================
//
//  gameState.stickerApplications = [
//    { cardNum: 7, stickerId: 1, quantite: 1 },  // Or x1 sur carte #7
//    { cardNum: 9, stickerId: 7, quantite: 1 },  // Reste en jeu sur carte #9
//    ...
//  ]
//
//  Deux points d'entrée :
//    - applyStickerFromCarte24(effetIndex)  -> Carte 24 (Terre fertile, 1 usage par effet)
//    - applyStickerFromExport(seuil)        -> Carte 27 (Export, seuils sticker)

// --- helpers -------------------------------------------------

function _getStickerApplications() {
  if (!gameState.stickerApplications) gameState.stickerApplications = [];
  return gameState.stickerApplications;
}

function _getStickerById(id) {
  if (typeof STICKERS === 'undefined') return null;
  return STICKERS.find(s => s.id === id) || null;
}

function _stickerLabel(s) {
  if (!s) return '?';
  if (s.ressource) return `${RESOURCE_ICONS[normalizeRes(s.ressource)] || s.ressource} +${s.quantite} ${s.ressource}`;
  if (s.effe === 'Reste en jeu') return '\u267e\ufe0f Reste en jeu';
  if (s.type === 'Gloire') return `\u2b50 +${s.victoire} Gloire`;
  return `Sticker #${s.id}`;
}

// Renvoie le HTML des stickers apposés sur une carte (pour buildCardFrontHTML)
function getStickerBonusForCard(cardNum) {
  const apps = _getStickerApplications().filter(a => a.cardNum === cardNum);
  if (!apps.length) return '';
  return apps.map(a => {
    const s = _getStickerById(a.stickerId);
    if (!s) return '';
    if (s.ressource) return `<span class="resource-pip sticker-pip" title="Autocollant Heritage">&#x1F3F7; ${RESOURCE_ICONS[normalizeRes(s.ressource)] || s.ressource} \xd7${s.quantite}</span>`;
    if (s.effe === 'Reste en jeu') return `<span class="resource-pip sticker-pip" title="Autocollant Heritage \u2014 Reste en jeu">&#x1F3F7; \u267e\ufe0f</span>`;
    if (s.type === 'Gloire') return `<span class="resource-pip sticker-pip" title="Autocollant Heritage \u2014 Gloire">&#x1F3F7; \u2b50+${s.victoire}</span>`;
    return '';
  }).filter(Boolean).join('');
}

// Renvoie les bonus de ressources dus aux stickers sur une carte (pour getProjectedResources)
function getStickerResourceBonusForCard(cardNum) {
  const apps = _getStickerApplications().filter(a => a.cardNum === cardNum);
  const bonus = {};
  apps.forEach(a => {
    const s = _getStickerById(a.stickerId);
    if (s && s.ressource) {
      const key = normalizeRes(s.ressource);
      bonus[key] = (bonus[key] || 0) + s.quantite;
    }
  });
  return bonus;
}

// --- modal generique de pose d'autocollant -------------------

function ouvrirModalSticker(options) {
  window._pendingStickerOptions = options;
  window._stickerSelections     = [];
  window._stickerChoisi         = null;

  const { stickers } = options;
  const stickerDefs = (stickers || []).map(id => _getStickerById(id)).filter(Boolean);

  if (stickerDefs.length === 0) {
    addLog('\u274c Aucun autocollant disponible pour cet effet.');
    _finaliserSticker([], options, options);
    return;
  }
  // Pre-selectionner si un seul sticker possible
  if (stickerDefs.length === 1) window._stickerChoisi = stickerDefs[0].id;

  _renderModalStickerContenu();
  new bootstrap.Modal(document.getElementById('stickerModal')).show();
}

function _candidatesForSticker() {
  const opts  = window._pendingStickerOptions || {};
  const cible = opts.cible || 'Toute';
  const allZones = [
    ...gameState.deck,
    ...gameState.play,
    ...gameState.discard,
    ...(gameState.stayInPlay || []),
    ...(gameState.retainedCards || []),
    ...gameState.permanent.filter(ci => !ci.cardDef._level1),
  ];
  const seen = new Set();
  return allZones.filter(ci => {
    if (seen.has(ci.cardDef.numero)) return false;
    seen.add(ci.cardDef.numero);
    const fd = getFaceData(ci);
    if (cible === 'Terrain')   return fd.type === 'Terrain';
    if (cible === 'B\xe2timent' || cible === 'Batiment') return fd.type === 'B\xe2timent' || fd.type === 'Batiment';
    if (cible === 'Personne')  return fd.type === 'Personne';
    if (cible === 'Alli\xe9e') return fd.type !== 'Ennemi';
    return fd.type !== 'Ennemi'; // 'Toute'
  });
}

function _renderModalStickerContenu() {
  const opts      = window._pendingStickerOptions || {};
  const quantite  = opts.quantite || 1;
  const sel       = window._stickerSelections || [];
  const stickerDefs = (opts.stickers || []).map(i => _getStickerById(i)).filter(Boolean);
  const candidates  = _candidatesForSticker();

  // --- choix du sticker ---
  let stickerChoixHTML = '';
  if (stickerDefs.length === 1) {
    stickerChoixHTML = `
      <div style="display:inline-flex;align-items:center;gap:8px;
        background:rgba(74,122,170,0.2);border:2px solid #4a7aaa;border-radius:8px;
        padding:6px 14px;margin-bottom:14px;">
        <span style="font-size:1.2rem;">&#x1F3F7;</span>
        <span style="font-family:'Cinzel',serif;font-size:0.78rem;color:#88bbff;">${_stickerLabel(stickerDefs[0])}</span>
      </div>`;
  } else {
    stickerChoixHTML = `
      <div style="margin-bottom:14px;">
        <div style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:2px;color:#88bbff;margin-bottom:8px;">CHOISIR L'AUTOCOLLANT</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
          ${stickerDefs.map(s => `
            <button id="stkBtn_${s.id}" onclick="_choisirSticker(${s.id})" style="
              font-family:'Cinzel',serif;font-size:0.65rem;font-weight:700;
              background:${window._stickerChoisi === s.id ? 'rgba(74,122,170,0.5)' : 'rgba(0,0,0,0.4)'};
              border:2px solid ${window._stickerChoisi === s.id ? '#88bbff' : '#4a7aaa55'};
              color:${window._stickerChoisi === s.id ? '#ddeeff' : '#88bbff'};
              border-radius:6px;padding:5px 12px;cursor:pointer;transition:all 0.15s;">
              &#x1F3F7; ${_stickerLabel(s)}
            </button>`).join('')}
        </div>
      </div>`;
  }

  // --- liste des cartes cibles ---
  const alreadySelected = sel.map(s => s.cardNum);
  const targetListHTML = candidates.length === 0
    ? `<div style="color:#888;font-style:italic;text-align:center;padding:12px;">Aucune carte eligible dans le royaume.</div>`
    : candidates.map(ci => {
        const fd = getFaceData(ci);
        const isSelected = alreadySelected.includes(ci.cardDef.numero);
        const existingStickers = getStickerBonusForCard(ci.cardDef.numero);
        const typeColors = { Terrain:'#2d5a27', 'B\xe2timent':'#7a6a5a', Batiment:'#7a6a5a', Personne:'#3a5a8a' };
        const bg = typeColors[fd.type] || '#5a5040';
        const zone = gameState.play.some(c => c.cardDef.numero === ci.cardDef.numero) ? 'En jeu'
          : gameState.discard.some(c => c.cardDef.numero === ci.cardDef.numero) ? 'D\xe9fausse'
          : gameState.deck.some(c => c.cardDef.numero === ci.cardDef.numero) ? 'Pioche' : 'Autre';

        return `
          <button onclick="_selectionnerCibleSticker(${ci.cardDef.numero})" style="
            width:100%;display:flex;align-items:center;gap:10px;
            background:${isSelected ? 'rgba(74,122,170,0.3)' : 'rgba(0,0,0,0.3)'};
            border:2px solid ${isSelected ? '#88bbff' : bg + '66'};
            border-radius:8px;padding:8px 10px;margin-bottom:6px;cursor:pointer;
            transition:all 0.15s;text-align:left;">
            <div style="font-size:1.6rem;flex-shrink:0;">${getCardEmoji(fd.type, fd.nom)}</div>
            <div style="flex:1;">
              <div style="font-family:'Cinzel',serif;font-size:0.72rem;color:${isSelected ? '#aaddff' : '#f5e6c8'};font-weight:700;">${fd.nom}</div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">
                <span style="background:${bg};color:#fff;font-family:'Cinzel',serif;font-size:0.38rem;padding:1px 5px;border-radius:3px;">${fd.type}</span>
                <span style="font-size:0.52rem;color:#888;">#${ci.cardDef.numero} \xb7 ${zone}</span>
              </div>
              ${existingStickers ? `<div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:2px;">${existingStickers}</div>` : ''}
            </div>
            ${isSelected ? `<div style="font-size:1.1rem;color:#88bbff;">\u2713</div>` : ''}
          </button>`;
      }).join('');

  // --- resume + bouton ---
  const selOK = sel.length >= (quantite === 1 ? 1 : quantite);
  let resumeHTML = '';
  if (sel.length > 0) {
    const allCards = [...gameState.deck, ...gameState.play, ...gameState.discard,
                     ...(gameState.stayInPlay||[]), ...(gameState.retainedCards||[]),
                     ...gameState.permanent];
    resumeHTML = `
      <div style="margin-top:10px;padding:8px 12px;background:rgba(74,122,170,0.15);
        border:1px solid #4a7aaa55;border-radius:8px;">
        <div style="font-family:'Cinzel',serif;font-size:0.58rem;color:#88bbff;margin-bottom:4px;">S\xc9LECTION</div>
        ${sel.map(s => {
          const stk = _getStickerById(s.stickerId);
          const ci  = allCards.find(c => c.cardDef.numero === s.cardNum);
          const nom = ci ? getFaceData(ci).nom : '#' + s.cardNum;
          return `<div style="font-size:0.72rem;color:#ddeeff;">&#x1F3F7; ${_stickerLabel(stk)} \u2192 <strong>${nom}</strong></div>`;
        }).join('')}
      </div>`;
  }

  const body = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:0.6rem;font-family:'Cinzel',serif;color:#88bbff;letter-spacing:2px;margin-bottom:4px;">
        &#x1F3F7; POSE D'AUTOCOLLANT${quantite > 1 ? ` (${sel.length}/${quantite})` : ''}
      </div>
      <div style="font-family:'Crimson Text',serif;font-size:0.82rem;color:#c8d8e8;font-style:italic;">
        Cible : <strong style="color:#88bbff;">${opts.cible || 'Toute carte'}</strong>
        ${quantite > 1 ? ` \u2014 choisissez <strong style="color:#88bbff;">${quantite} cartes</strong>` : ''}
      </div>
    </div>
    ${stickerChoixHTML}
    <div style="max-height:42vh;overflow-y:auto;padding-right:2px;">${targetListHTML}</div>
    ${resumeHTML}
    <div style="text-align:center;margin-top:14px;display:flex;gap:10px;justify-content:center;">
      <button onclick="_annulerModalSticker()" style="
        font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:1px;
        background:rgba(60,40,20,0.6);border:1px solid rgba(139,105,20,0.4);
        color:var(--stone-light);padding:8px 18px;border-radius:6px;cursor:pointer;">
        \u2715 Annuler
      </button>
      <button id="btnConfirmSticker" onclick="_confirmerPoseSticker()" ${selOK ? '' : 'disabled'} style="
        font-family:'Cinzel',serif;font-weight:700;font-size:0.72rem;letter-spacing:1px;
        background:${selOK ? 'linear-gradient(135deg,#1a3a6a,#2a5a9a)' : 'rgba(0,0,0,0.4)'};
        border:2px solid ${selOK ? '#4a7aaa' : '#333'};
        color:${selOK ? '#aaddff' : '#555'};
        padding:8px 22px;border-radius:6px;cursor:${selOK ? 'pointer' : 'not-allowed'};transition:all 0.2s;">
        &#x1F3F7; Apposer l'autocollant
      </button>
    </div>`;

  document.getElementById('stickerModalBody').innerHTML = body;
}

function _choisirSticker(id) {
  window._stickerChoisi = id;
  _renderModalStickerContenu();
}

function _selectionnerCibleSticker(cardNum) {
  const opts     = window._pendingStickerOptions || {};
  const quantite = opts.quantite || 1;
  const sel      = window._stickerSelections || [];
  const stickerDefs = (opts.stickers || []).map(i => _getStickerById(i)).filter(Boolean);
  const stickerChoisiId = window._stickerChoisi ||
    (stickerDefs.length === 1 ? stickerDefs[0].id : null);

  if (!stickerChoisiId) {
    addLog('\u274c Veuillez d\'abord choisir un autocollant.');
    return;
  }
  const pos = sel.findIndex(s => s.cardNum === cardNum);
  if (pos >= 0) {
    sel.splice(pos, 1);
  } else if (sel.length < quantite) {
    sel.push({ cardNum, stickerId: stickerChoisiId });
  } else if (quantite === 1) {
    sel[0] = { cardNum, stickerId: stickerChoisiId };
  }
  window._stickerSelections = sel;
  _renderModalStickerContenu();
}

function _annulerModalSticker() {
  bootstrap.Modal.getInstance(document.getElementById('stickerModal'))?.hide();
  window._pendingStickerOptions = null;
  window._stickerSelections     = [];
  window._stickerChoisi         = null;
}

function _confirmerPoseSticker() {
  bootstrap.Modal.getInstance(document.getElementById('stickerModal'))?.hide();
  const opts = window._pendingStickerOptions || {};
  const sel  = window._stickerSelections || [];
  window._pendingStickerOptions = null;
  window._stickerSelections     = [];
  window._stickerChoisi         = null;

  if (sel.length === 0) { _finaliserSticker([], opts, opts); return; }

  const apps = _getStickerApplications();
  const allCards = [...gameState.deck, ...gameState.play, ...gameState.discard,
                    ...(gameState.stayInPlay||[]), ...(gameState.retainedCards||[]),
                    ...gameState.permanent];

  sel.forEach(({ cardNum, stickerId }) => {
    apps.push({ cardNum, stickerId, quantite: 1 });
    const s   = _getStickerById(stickerId);
    const ci  = allCards.find(c => c.cardDef.numero === cardNum);
    const nom = ci ? getFaceData(ci).nom : '#' + cardNum;
    addLog(`&#x1F3F7; Autocollant <strong>${_stickerLabel(s)}</strong> appos\xe9 sur <span class="log-card">${nom}</span>.`, true);

    if (s && s.effe === 'Reste en jeu') {
      if (!gameState.stickerStayInPlay) gameState.stickerStayInPlay = [];
      if (!gameState.stickerStayInPlay.includes(cardNum)) gameState.stickerStayInPlay.push(cardNum);
    }
    if (s && s.type === 'Gloire') {
      gameState.fame = (gameState.fame || 0) + s.victoire;
      addLog(`\u2b50 Gloire +${s.victoire} (sticker) \u2192 Total\u00a0: ${gameState.fame}`, true);
    }
  });

  _finaliserSticker(sel, opts, opts);
  updateUI();
}

function _finaliserSticker(sel, opts, originalOpts) {
  if (!originalOpts) return;
  if (originalOpts.source === 'carte24') {
    if (!gameState.carte24EffetsUtilises) gameState.carte24EffetsUtilises = [];
    if (originalOpts.effetIndex !== undefined &&
        !gameState.carte24EffetsUtilises.includes(originalOpts.effetIndex)) {
      gameState.carte24EffetsUtilises.push(originalOpts.effetIndex);
    }
  }
  updateUI();
}

// --- Carte 24 — Terre fertile --------------------------------

function applyStickerFromCarte24(effetIndex) {
  const carte24 = LEGACY_CARDS.find(c => c.numero === 24);
  if (!carte24 || !carte24.effet) return;
  const eff = carte24.effet[effetIndex];
  if (!eff) return;

  if (!gameState.carte24EffetsUtilises) gameState.carte24EffetsUtilises = [];
  if (gameState.carte24EffetsUtilises.includes(effetIndex)) {
    addLog('\u274c Cet effet de la Terre fertile a d\xe9j\xe0 \xe9t\xe9 appliqu\xe9.');
    return;
  }
  ouvrirModalSticker({
    stickers:   eff.stickers || [],
    cible:      eff.cible    || 'Toute',
    quantite:   1,
    source:     'carte24',
    effetIndex,
  });
}

// Ouvre un modal récapitulatif de la carte 24 avec boutons d'action (accessible depuis la zone permanente)
function ouvrirCarte24Modal() {
  const carte24 = LEGACY_CARDS.find(c => c.numero === 24);
  if (!carte24 || !carte24.effet) return;
  const carte24Used = gameState.carte24EffetsUtilises || [];
  const color = '#c8960c';

  const stickerPreviews = (ids) => (ids || []).map(id => {
    const s = (typeof STICKERS !== 'undefined') ? STICKERS.find(st => st.id === id) : null;
    return s ? `<span style="background:rgba(74,122,170,0.25);border:1px solid #4a7aaa55;border-radius:4px;padding:1px 6px;font-size:0.52rem;color:#88bbff;">&#x1F3F7; ${_stickerLabel(s)}</span>` : '';
  }).filter(Boolean).join(' ');

  const effetsHTML = carte24.effet.map((e, i) => {
    const done = carte24Used.includes(i);
    return `
      <div style="background:${done ? 'rgba(20,20,20,0.5)' : 'rgba(0,0,0,0.3)'};border-left:3px solid ${done ? '#444' : color};
        border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:10px;opacity:${done ? 0.55 : 1};">
        <div style="font-family:'Crimson Text',serif;font-size:0.92rem;color:${done ? '#666' : 'var(--parchment)'};line-height:1.5;margin-bottom:6px;">
          ${done ? '<s>' : ''}\u2746 ${e.description || e.type}${done ? '</s>' : ''}
        </div>
        ${e.cible ? `<div style="font-size:0.6rem;color:#888;margin-bottom:6px;">Cible : <strong style="color:#aaa;">${e.cible}</strong></div>` : ''}
        ${stickerPreviews(e.stickers) ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${stickerPreviews(e.stickers)}</div>` : ''}
        ${done
          ? `<div style="font-family:'Cinzel',serif;font-size:0.6rem;color:#8acc44;">\u2713 Appliqu\xe9</div>`
          : e.type_effet === 'sticker'
            ? `<button onclick="bootstrap.Modal.getInstance(document.getElementById('carte24Modal'))?.hide();setTimeout(()=>applyStickerFromCarte24(${i}),200);" style="
                font-family:'Cinzel',serif;font-size:0.62rem;font-weight:700;letter-spacing:0.5px;
                background:linear-gradient(135deg,#1a3a6a,#2a5a9a);border:2px solid #4a7aaa;
                color:#aaddff;padding:6px 14px;border-radius:6px;cursor:pointer;">
                &#x1F3F7; Appliquer l'autocollant
              </button>`
            : ''
        }
      </div>`;
  }).join('');

  document.getElementById('carte24ModalBody').innerHTML = `
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-size:3rem;margin-bottom:6px;">\uD83C\uDF3E</div>
      <div style="font-family:'Cinzel',serif;font-size:0.58rem;color:#888;letter-spacing:2px;margin-bottom:4px;">CARTE #24 \u2014 PARCHEMIN H\xc9RITAGE</div>
      <div style="font-family:'Cinzel',serif;font-weight:700;font-size:1rem;color:#f0c040;">Terre fertile</div>
      <div style="font-family:'Crimson Text',serif;font-style:italic;font-size:0.82rem;color:#aaa;margin-top:4px;">
        Chaque effet peut \xeatre appliqu\xe9 une seule fois, \xe0 tout moment.
      </div>
    </div>
    ${effetsHTML}`;

  new bootstrap.Modal(document.getElementById('carte24Modal')).show();
}

// --- Carte 27 — Export (sticker depuis seuil) ----------------

function applyStickerFromExport(seuil) {
  ouvrirModalSticker({
    stickers:   seuil.stickers || [],
    cible:      seuil.cible    || 'Toute',
    quantite:   seuil.quantite || 1,
    source:     'export',
    seuilIndex: seuil.index,
  });
}

// ============================================================
//  RETENTION (cartes 82 & 83 -- Autel / Sanctuaire / Oratoire / Temple)
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