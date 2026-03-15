// ============================================================
//  GAME-STATE.JS — Constantes, état global et helpers de base
//  Doit être chargé EN PREMIER avant tous les autres modules.
// ============================================================

let ALL_CARDS = [
  ...BEGIN_CARDS,
  ...(typeof CARDS_TO_DISCOVER !== 'undefined' ? CARDS_TO_DISCOVER : []),
];

const RESOURCE_ICONS = { Or:'🪙', Bois:'🪵', Pierre:'🪨', Métal:'⚙️', Epée:'⚔️', Troc:'🛒' };
const TYPE_ICONS = { Terrain:'🌿', Bâtiment:'🏰', Personne:'👤', Evènement:'🎉', Ennemi:'💀', Maritime:'⚓' };

let cardStateMap = {};
let choiceNeeded = new Set();

let gameState = {
  deck: [],
  play: [],
  staging: [],
  discard: [],
  permanent: [],
  box: [],
  nextDiscoverIndex: 0,
  resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, Troc:0 },
  fame: 0,
  round: 1,
  turn: 1,
  turnStarted: false,
  gameOver: false,
  bandits: [],
  retainedCards: [], // cartes retenues par l'effet de la carte 83 — utilisables jusqu'à fin de manche
};

function getFaceData(ci) {
  return ci.cardDef.faces.find(f => f.face === ci.currentFace) || ci.cardDef.faces[0];
}
function getFaceName(cardDef, faceNum) {
  const f = cardDef.faces.find(f => f.face === faceNum); return f ? f.nom : '?';
}
function normalizeRes(t) {
  const val = Array.isArray(t) ? t[0] : t;
  return { Or:'Or', Bois:'Bois', Pierre:'Pierre', Métal:'Métal', Metal:'Métal', Epée:'Epée', Troc:'Troc' }[val] || val;
}
function formatCost(cout) {
  if (!cout || !cout.length) return 'Gratuit';
  return cout.map(c => `${c.quantite}${RESOURCE_ICONS[normalizeRes(c.type)]||c.type}`).join(' + ');
}
function formatCostHint(cout) {
  if (!cout || !cout.length) return 'Gratuit';
  const items = cout.map(c => `${c.quantite}${RESOURCE_ICONS[normalizeRes(c.type)]||c.type}`);
  if (items.length <= 2) return items.join(' + ');
  const cells = items.map(it => `<span class="promo-cost-item">${it}</span>`).join('');
  return `<span class="promo-costs-grid">${cells}</span>`;
}
function getCardEmoji(type, nom) {
  return ({
    'Herbes Sauvages':'🌾','Plaines':'🌿','Terres cultivées':'🚜','Grange':'🏚️',
    'Montagnes Lointaines':'⛰️','Zone Rocheuse':'🪨','Carrière':'⛏️','Mine Peu Profonde':'🪝',
    'Forêt':'🌲','Coupe Rase':'🪓','Cabane de Bûcheron':'🏡','Puit Sacré':'⛲',
    'Quartier Général':'⚑','Hôtel de Ville':'🏛️','Donjon':'🏰','Château':'🏯',
    'Commerçante':'👩‍💼','Bazar':'🏪','Marché':'🛍️','Festival':'🎪',
    'Jungle':'🌴','Arbres Géants':'🌳','Jungle Profonde':'🏕️','Cabane dans les Arbres':'🛖',
    'Rivière':'🏞️','Pont':'🌉','Pont de Pierre':'🗿','Explorateurs':'🧭',
    'Autel':'⛩️',
    'Exploitant':'⚒️','Domestique':'🧹','Bandit':'🗡️','Travailleur':'👷',
    'Colinne':'⛰️','Chapelle':'⛪','Eglise':'⛪','Cathédrale':'🕍',
    'Forge':'🔨','Armurerie':'⚔️','Muraille':'🏯',
    'Marais':'🌊','Marais Amenagés':'🌿','Jardin du Marais':'🌺','Arbres à Fruits Exotiques':'🍎',
    'Lac':'🏞️','Bateau de Pêche':'⛵','Phare':'🗼',
  }[nom]) || TYPE_ICONS[type] || '📄';
}

function createCardInstance(cardDef) {
  return { cardDef, currentFace: cardStateMap[cardDef.numero] || 1 };
}
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}