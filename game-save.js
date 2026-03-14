// ============================================================
//  EXPORT / IMPORT DE PARTIE
// ============================================================

const SESSION_KEY = 'bigdom-autosave';

function _buildSaveObject() {
  const serializeCards = (list) =>
    (list || []).filter(ci => ci && ci.cardDef && ci.cardDef.numero != null)
      .map(ci => ({ n: ci.cardDef.numero, f: ci.currentFace || 1 }));

  const readableCard = (ci) => {
    if (!ci || !ci.cardDef) return null;
    const face = getFaceData(ci);
    return { numero: ci.cardDef.numero, face_active: ci.currentFace || 1,
      nom: face?.nom || `Carte #${ci.cardDef.numero}`, type: face?.type || '—' };
  };
  const readableList = (list) => (list || []).map(readableCard).filter(Boolean);

  const readableStaging = (list) =>
    (list || []).filter(e => e && e.cardInstance && e.cardInstance.cardDef).map(e => {
      const face = getFaceData(e.cardInstance);
      const res = Object.entries(e.resourcesGained || {}).filter(([,v]) => v > 0).map(([k,v]) => `+${v} ${k}`).join(', ');
      return { numero: e.cardInstance.cardDef.numero, face_active: e.cardInstance.currentFace || 1,
        nom: face?.nom || `Carte #${e.cardInstance.cardDef.numero}`, type: face?.type || '—',
        action: e.action, ressources_attendues: res || '—', fame_attendu: e.fameGained || 0,
        promotion_vers_face: e.newFace || null,
        sacrifice: (e.sacrificeCardInstance && e.sacrificeCardInstance.cardDef) ? readableCard(e.sacrificeCardInstance) : null };
    });

  const now = new Date();
  const kingdom = gameState.kingdomName || 'Inconnu';

  return {
    meta: { version: 2, date: now.toISOString(),
      date_lisible: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`,
      nom_fichier: `${kingdom} — Manche ${gameState.round} Tour ${gameState.turn}` },
    royaume: { nom: kingdom, gloire: gameState.fame, manche: gameState.round, tour: gameState.turn },
    ressources: { ...gameState.resources },
    zones: {
      en_jeu:     { label: 'Cartes dans la zone de jeu', nombre: gameState.play.length, cartes: readableList(gameState.play) },
      en_attente: { label: 'Cartes en attente (staging)', nombre: gameState.staging.length, cartes: readableStaging(gameState.staging) },
      permanentes:{ label: 'Cartes permanentes', nombre: gameState.permanent.length, cartes: readableList(gameState.permanent) },
      defaussees: { label: 'Cartes défaussées', nombre: gameState.discard.length, cartes: readableList(gameState.discard) },
      detruites:  { label: 'Cartes détruites / sacrifiées', nombre: (gameState.destroyed||[]).length, cartes: readableList(gameState.destroyed||[]) },
      pioche:     { label: 'Cartes en pioche', nombre: gameState.deck.length, cartes: readableList(gameState.deck) },
    },
    _tech: {
      v: 1,
      turnStarted: gameState.turnStarted, gameOver: gameState.gameOver,
      _heritageTriggered: gameState._heritageTriggered || false,
      armeeProgress: gameState.armeeProgress || { face:1, casesMarquees:0 },
      armeeGloirePrev: gameState.armeeGloirePrev || 0,
      retained: gameState.retained || [],
      nextDiscoverIndex: gameState.nextDiscoverIndex,
      cardStateMap: cardStateMap,
      choiceNeeded: [...choiceNeeded],
      deck:      serializeCards(gameState.deck),
      play:      serializeCards(gameState.play),
      discard:   serializeCards(gameState.discard),
      permanent: serializeCards(gameState.permanent),
      destroyed: serializeCards(gameState.destroyed || []),
      box:       serializeCards(gameState.box),
      staging: (gameState.staging || []).filter(e => e && e.cardInstance && e.cardInstance.cardDef).map(e => ({
        n: e.cardInstance.cardDef.numero, f: e.cardInstance.currentFace || 1,
        action: e.action, resourcesGained: e.resourcesGained, fameGained: e.fameGained,
        newFace: e.newFace, cout: e.cout,
        sacN: e.sacrificeCardInstance?.cardDef?.numero ?? null,
        sacF: e.sacrificeCardInstance?.currentFace    ?? null,
      })),
      bandits: (gameState.bandits || []).map(b => ({ bN: b.banditNum, blN: b.blockedNum ?? null })),
    },
  };
}

function _autosave() {
  if (!gameState.kingdomName) return;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(_buildSaveObject())); }
  catch (e) { console.warn('Autosave localStorage échoué :', e); }
}

function _restoreAutosave() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const save = JSON.parse(raw);
    if (!save || !save._tech) return false;
    _applyImport(save);
    addLog(`🔄 Session restaurée automatiquement — <strong>${gameState.kingdomName}</strong>.`, true);
    return true;
  } catch (e) { console.warn('Restauration session échouée :', e); return false; }
}

function confirmRestartGame() {
  new bootstrap.Modal(document.getElementById('restartModal')).show();
}

function doRestartGame() {
  bootstrap.Modal.getInstance(document.getElementById('restartModal'))?.hide();
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
  cardStateMap = {};
  choiceNeeded = new Set();
  ALL_CARDS = [ ...BEGIN_CARDS, ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : []) ];
  gameState = {
    deck: [], play: [], staging: [], discard: [], permanent: [], destroyed: [],
    retained: [], box: [], nextDiscoverIndex: 0,
    resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 },
    fame: 0, round: 1, turn: 1, turnStarted: false, gameOver: false,
    bandits: [], _heritageTriggered: false, kingdomName: '',
  };
  $('#gameLog').empty();
  updateUI();
  initGame();
}

function exportGame() {
  const save = _buildSaveObject();
  const kingdom = gameState.kingdomName || 'royaume';
  const slug = kingdom.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'-').toLowerCase();
  const filename = `${slug}-m${gameState.round}-t${gameState.turn}.json`;
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  addLog(`💾 Partie sauvegardée — <strong>${kingdom}</strong>, Manche ${gameState.round} Tour ${gameState.turn}.`, true);
}

function importGame() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { _applyImport(JSON.parse(ev.target.result)); }
      catch (err) { alert('❌ Fichier invalide ou corrompu.\n' + err.message); }
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

function _restoreBox(save) {
  const resolved = (save.box || []).map(_resolveCard).filter(Boolean);
  if (resolved.length > 0) return resolved;
  const knownNums = new Set([
    ...(save.deck||[]).map(c=>c.n), ...(save.play||[]).map(c=>c.n),
    ...(save.discard||[]).map(c=>c.n), ...(save.permanent||[]).map(c=>c.n),
    ...(save.destroyed||[]).map(c=>c.n),
  ]);
  const phase1 = ALL_CARDS.filter(c=>c.numero>=11&&c.numero<=22&&!knownNums.has(c.numero))
    .sort((a,b)=>a.numero-b.numero).map(c=>createCardInstance(c));
  if (!save._heritageTriggered) return phase1;
  const phase1Nums = new Set(phase1.map(ci=>ci.cardDef.numero));
  const phase2 = (typeof CARDS_TO_DISCOVER!=='undefined'?CARDS_TO_DISCOVER:[])
    .filter(c=>!knownNums.has(c.numero)&&!phase1Nums.has(c.numero))
    .sort((a,b)=>a.numero-b.numero).map(c=>createCardInstance(c));
  return [...phase1,...phase2];
}

function _applyImport(raw) {
  const isV2 = raw && raw._tech && raw.meta;
  const save = isV2 ? raw._tech : raw;
  const info = isV2 ? raw.royaume : raw;
  if (!save || save.v !== 1) { alert('❌ Format de sauvegarde non reconnu.'); return; }

  cardStateMap = {};
  Object.entries(save.cardStateMap || {}).forEach(([k, v]) => { cardStateMap[parseInt(k)] = v; });
  choiceNeeded = new Set((save.choiceNeeded || []).map(Number));

  const resolve = (list) => (list || []).map(_resolveCard).filter(Boolean);
  const play = resolve(save.play);

  const staging = (save.staging || []).map(e => {
    const ci = _resolveCard({ n: e.n, f: e.f });
    if (!ci) return null;
    const entry = { cardInstance: ci, action: e.action, resourcesGained: e.resourcesGained || {},
      fameGained: e.fameGained || 0, newFace: e.newFace || null, cout: e.cout || [] };
    if (e.sacN) { const sc = _resolveCard({ n: e.sacN, f: e.sacF || 1 }); if (sc) entry.sacrificeCardInstance = sc; }
    return entry;
  }).filter(Boolean);

  const bandits = (save.bandits || [])
    .filter(b => b.bN != null && play.some(ci => ci.cardDef.numero === b.bN))
    .map(b => ({ banditNum: b.bN, blockedNum: b.blN ?? null }));

  gameState = {
    deck: resolve(save.deck), play, staging,
    discard: resolve(save.discard), permanent: resolve(save.permanent),
    destroyed: resolve(save.destroyed || []),
    box: _restoreBox(save),
    nextDiscoverIndex: save.nextDiscoverIndex || 0,
    resources: { ...(isV2 ? raw.ressources : save.resources) },
    fame:        (isV2 ? info.gloire  : save.fame)  || 0,
    round:       (isV2 ? info.manche  : save.round) || 1,
    turn:        (isV2 ? info.tour    : save.turn)  || 1,
    turnStarted: save.turnStarted || false,
    gameOver:    save.gameOver    || false,
    _heritageTriggered: save._heritageTriggered || false,
    armeeProgress:   save.armeeProgress   || { face:1, casesMarquees:0 },
    armeeGloirePrev: save.armeeGloirePrev || 0,
    retained:        save.retained        || [],
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
