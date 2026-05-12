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

// Noms de royaumes inspirés de Kaamelott (générateur)
const _KAA_TITRES = [
  ['Le Royaume', 'm'], ['Le Duché', 'm'], ['Le Comté', 'm'], ['Le Fief', 'm'],
  ['Le Territoire', 'm'], ['Le Bastion', 'm'], ['Le Bourg', 'm'],
  ['La Seigneurie', 'f'], ['La Baronnie', 'f'], ['La Contrée', 'f'],
  ['La Principauté', 'f'], ['La Terre', 'f'], ['La Forteresse', 'f'],
];
const _KAA_SUJETS = {
  m: ["Gras", "Poil", "Piaf", "Pif", "Bruit", "Cul", "Pas de Bol", "Graal", "Ventre", "Fromage qui pue", "Hasard", "Ennui", "Orteil", "Artichaut", "Oubli"],
  f: ["Grosse Dalle", "Joie de Vivre", "Botte Secrète", "Fatigue", "Poisse", "Binouze", "Guerre", "Technique du Rebrousse-Poil", "Chanson Paillarde", "Mort qui Tue", "Vielle qui Grince", "Hache", "Arnaque", "Illusion"],
  p: ["Petits Pédestres", "Coups dans le Pif", "Péquenots", "Gros Nuls", "Têtes de Glands", "Pains au Chocolat", "Morpions", "Petits Pois", "Couilles en Or", "Cons", "Pignoufs", "Chaussettes Sales", "Petits Poneys", "Gros Tas", "Petits Culs", "Ennuis", "Orteils"],
};
const _KAA_QUALIFIERS = [
  "(mais en moins bien)", "à la Con", "sans Joie", "qui Pue", ", si, si, la famille...", "et ses Alentours", "pour les Nuls", "(version pas chère)", ", mais pas trop", "du Nord", "du Sud", "de l'Est", "de l'Ouest"
];

function _generateKaamelottKingdomName() {
  const [titre] = _KAA_TITRES[Math.floor(Math.random() * _KAA_TITRES.length)];

  const roll = Math.random();
  let sujet, prep;

  if (roll < 0.4) { // Pluriel
    sujet = _KAA_SUJETS.p[Math.floor(Math.random() * _KAA_SUJETS.p.length)];
    prep = "des";
  } else if (roll < 0.7) { // Féminin
    sujet = _KAA_SUJETS.f[Math.floor(Math.random() * _KAA_SUJETS.f.length)];
    prep = sujet.match(/^[AEIOUH]/i) ? "de l'" : "de la";
  } else { // Masculin
    sujet = _KAA_SUJETS.m[Math.floor(Math.random() * _KAA_SUJETS.m.length)];
    prep = sujet.match(/^[AEIOUH]/i) ? "de l'" : "du";
  }

  let name = `${titre} ${prep} ${sujet}`;

  // Ajouter un qualificateur parfois (15% chance)
  if (Math.random() < 0.15) {
    name += ` ${_KAA_QUALIFIERS[Math.floor(Math.random() * _KAA_QUALIFIERS.length)]}`;
  }

  return name;
}

function _generateKingdomName() {
  // 50% de chance d'avoir un nom Kaamelott
  if (Math.random() < 0.5) {
    return _generateKaamelottKingdomName();
  }

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
    if (isChoiceCard(c)) choiceNeeded.add(c.numero); // Line 153
  });

  let deck = startCards.map(card => createCardInstance(card));
  shuffleDeck(deck);

  gameState = {
    deck, play: [], staging: [], discard: [], permanent: [], stayInPlay: [], destroyed: [],
    retained: [],
    box: boxCards.map(card => createCardInstance(card)), nextDiscoverIndex: 0,
    resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 },
    fame: 0, round: 1, turn: 1, turnStarted: false, gameOver: false,
    bandits: [], _heritageTriggered: false,
    usedOneTimeEffects: [],
    kingdomName: name,
  };

  // Mettre à jour le nom dans le header
  _updateKingdomNameUI(name);
  updateUI();
  addLog(`⚜ Que le Royaume de <strong>${name}</strong> prospère ! La partie commence.`, true);
  addLog(`📦 ${gameState.deck.length} cartes en pioche | ${gameState.box.length} cartes à découvrir (11–22).`);
  drawCards(4);
}

function _updateKingdomNameUI(name) {
  const el = document.getElementById('kingdomNameDisplay');
  if (el) el.textContent = `Royaume de ${name}`;
}

$(document).ready(function() {
  // Si une session existe, la restaurer silencieusement.
  if (!_restoreAutosave()) {
    // Sinon, démarrer une nouvelle partie en affichant le modal de choix de nom.
    initGame();
  }
});