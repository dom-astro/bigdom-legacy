// ============================================================
//  GAME-STATE.JS — Constantes, état global et helpers de base
//  Doit être chargé EN PREMIER avant tous les autres modules.
// ============================================================

// ALL_CARDS contient uniquement les cartes "actives" du royaume à un instant T.
// Les cartes de CARDS_TO_DISCOVER n'y sont JAMAIS ajoutées au démarrage :
// elles rejoignent ALL_CARDS uniquement quand elles sont découvertes par une action de jeu.
let ALL_CARDS = [
  ...BEGIN_CARDS,
];

const RESOURCE_ICONS = { Or:'🪙', Bois:'🪵', Pierre:'🪨',
   Métal:'<img src="img/lingot.png" alt="Métal" style="width:1.2em;height:1.2em;vertical-align:-0.15em;object-fit:contain;">',
   Epée:'⚔️', 
   marchandise:'<img src="img/marchandise.png" alt="Marchandise" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
   Marchandise:' <img src="img/marchandise.png" alt="Marchandise" style="width:1em;height:1em;vertical-align:-0.15em;object-fit:contain;">'
};
const TYPE_ICONS = { Terrain:'🗺️', Bâtiment:'🏰', Personne:'👤', Evènement:'🎉', Ennemi:'💀', Maritime:'⚓' };

let cardStateMap = {};
let choiceNeeded = new Set();

let gameState = {
  deck: [],
  play: [],
  staging: [],
  discard: [],
  permanent: [],
  stayInPlay: [], // cartes "Reste en jeu" — jouables à tout tour de la manche, défaussées en fin de manche
  box: [],
  nextDiscoverIndex: 0,
  resources: { Or:0, Bois:0, Pierre:0, Métal:0, Epée:0, marchandise:0 },
  fame: 0,
  round: 1,
  turn: 1,
  turnStarted: false,
  gameOver: false,
  bandits: [],
  retainedCards: [], // utilisables jusqu'à fin de manche
  eruptionActive: false,
};

function getFaceData(ci) {
  return ci.cardDef.faces.find(f => f.face === ci.currentFace) || ci.cardDef.faces[0];
}
function getFaceName(cardDef, faceNum) {
  const f = cardDef.faces.find(f => f.face === faceNum); return f ? f.nom : '?';
}

function getVictoryValue(victoire) {
  if (victoire === undefined || victoire === null) return null;
  if (typeof victoire === 'number') return victoire;
  if (typeof victoire === 'object') {
    if (typeof victoire.valeur === 'number') return victoire.valeur;
  }
  return null;
}

function getVictoryLabel(victoire) {
  const value = getVictoryValue(victoire);
  if (value !== null) return `${value > 0 ? '+' : ''}${value}`;
  if (typeof victoire === 'object') {
    if (victoire.description) return victoire.description;
    if (victoire.valeur && typeof victoire.valeur === 'object' && typeof victoire.valeur.multiplie === 'number') {
      return `${victoire.valeur.multiplie}×${victoire.valeur.par || ''}`;
    }
  }
  return '';
}

// Résout l'index dans play[] à partir d'un numéro de carte (retourne -1 si absent)
function _playIndexOf(cardNum) {
  return gameState.play.findIndex(ci => ci.cardDef.numero === cardNum);
}
const _playIdxByNum = _playIndexOf; // Alias court

function normalizeRes(t) {
  const val = Array.isArray(t) ? t[0] : t;
  return { Or:'Or', Bois:'Bois', Pierre:'Pierre', Métal:'Métal', Metal:'Métal', Epée:'Epée', marchandise:'marchandise' }[val] || val;
}
function toCostArray(cout) {
  if (!cout) return [];
  return Array.isArray(cout) ? cout : [cout];
}
function formatCost(cout) {
  const items = toCostArray(cout);
  if (!items.length) return 'Gratuit';
  return items.map(c => `${c.quantite}${RESOURCE_ICONS[normalizeRes(c.type)]||c.type}`).join(' + ');
}
function formatCostHint(cout) {
  const items = toCostArray(cout);
  if (!items.length) return 'Gratuit';
  const cells = items.map(c => `${c.quantite}${RESOURCE_ICONS[normalizeRes(c.type)]||c.type}`);
  if (cells.length <= 2) return cells.join(' + ');
  return `<span class="promo-costs-grid">${cells.join('')}</span>`;
}
function formatResourceGain(resource) {
  if (!resource) return '';
  const types = Array.isArray(resource.type) ? resource.type : [resource.type];
  const typeText = types.map(t => RESOURCE_ICONS[normalizeRes(t)] || t).join(' / ');
  let quantityPart = '';
  if (typeof resource.quantite === 'number') {
    quantityPart = `${resource.quantite}×`;
  } else if (typeof resource.quantite === 'object') {
    if (typeof resource.quantite.multiplie === 'number') {
      quantityPart = `${resource.quantite.multiplie}×`;
      if (resource.quantite.par) quantityPart += ` par ${resource.quantite.par}`;
    } else if (typeof resource.quantite.valeur === 'number') {
      quantityPart = `${resource.quantite.valeur}×`;
    } else if (typeof resource.quantite.description === 'string') {
      quantityPart = resource.quantite.description;
    } else {
      quantityPart = JSON.stringify(resource.quantite);
    }
  } else {
    quantityPart = String(resource.quantite);
  }
  return `${quantityPart} ${typeText}`.trim();
}
function getCardEmoji(type, nom) {
  return ({
    'Herbes Sauvages':'<img src="img/herbes.png" alt="Herbes sauvages" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Plaines':'<img src="img/plaine.png" alt="Plaines" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Terres cultivées':'<img src="img/champ.png" alt="Terres cultivées" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Grange':'<img src="img/grange.png" alt="Grange" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Montagnes Lointaines':'⛰️',
    'Zone Rocheuse':'<img src="img/zone-rocheuse.png" alt="Zone rocheuse" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Carrière':'<img src="img/carriere.png" alt="Carrière" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Mine Peu Profonde':'<img src="img/mine.png" alt="Mine peu profonde" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Mine':'<img src="img/mine-2.png" alt="Mine" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Forêt':'<img src="img/foret.png" alt="Forêt" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Coupe Rase':'🪓',
    'Cabane de Bûcheron':'<img src="img/cabane-bucheron.png" alt="Cabane de Bûcheron" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Puit Sacré':'<img src="img/puit-sacree.png" alt="Puit sacré" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Quartier Général':'<img src="img/quartier-general.svg" alt="Quartier général" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Hôtel de Ville':'<img src="img/mairie.png" alt="Hôtel de Ville" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Donjon':'<img src="img/donjon.png" alt="Donjon" style="width:2em;height:2em;vertical-align:-0.15em;object-fit:contain;">',
    'Château':'<img src="img/chateau.png" alt="Château" style="width:2em;height:2em;vertical-align:-0.15em;object-fit:contain;">',
    'Commerçante':'<img src="img/commercante.png" alt="Commerçante" style="width:2em;height:2em;vertical-align:-0.15em;object-fit:contain;">',
    'Bazar':'<img src="img/bazar.png" alt="Bazar" style="width:1.8em;height:1.8em;vertical-align:-0.15em;object-fit:contain;">',
    'Marché':'<img src="img/marche.png" alt="Marché" style="width:1.8em;height:1.6em;vertical-align:-0.15em;object-fit:contain;">',
    'Festival':'<img src="img/festival.png" alt="Festival" style="width:1.8em;height:1.8em;vertical-align:-0.15em;object-fit:contain;">',
    'Jungle':'<img src="img/jungle.png" alt="Jungle" style="width:2em;height:2em;vertical-align:-0.15em;object-fit:contain;">',
    'Arbres Géants':'🌳',
    'Jungle Profonde':'<img src="img/jungle_profonde.png" alt="Jungle profonde" style="width:2em;height:2em;vertical-align:-0.15em;object-fit:contain;">',
    'Cabane dans les Arbres':'🛖',
    'Rivière':'<img src="img/river.svg" alt="Rivière" style="width:1em;height:1em;vertical-align:-0.15em;object-fit:contain;">',
    'Pont':'<img src="img/pont.png" alt="Pont" style="width:2em;height:2em;vertical-align:-0.15em;object-fit:contain;">',
    'Pont de Pierre':'<img src="img/pont-pierre.png" alt="Pont de pierre" style="width:2em;height:2em;vertical-align:-0.15em;object-fit:contain;">',
    'Explorateurs':'🧭',
    'Autel':'<img src="img/autel.png" alt="Autel" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Exploitant':'<img src="img/exploitant.png" alt="Exploitant" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Domestique':'<img src="img/domestique.png" alt="Domestique" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Bandit':'<img src="img/bandit.png" alt="Bandit" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Travailleur':'👨‍🔧',
    'Entrepreneur':'<img src="img/entrepreneur.png" alt="Entrepreneur" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Scientifique':'<img src="img/scientifique.png" alt="Scientifique" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Ingénieur':'<img src="img/ingenieur.png" alt="Ingénieur" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Inventrice':'<img src="img/inventrice.png" alt="Inventrice" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Inventrice inspirée':'<img src="img/inventrice-inspiree.png" alt="Inventrice inspirée" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'L\'opportuniste':'<img src="img/opportuniste.png" alt="Opportuniste" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Le recruteur':'<img src="img/chevalier.png" alt="Le recruteur" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Le travailleur':'<img src="img/mineur.png" alt="Le travailleur" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Le faux noble':'<img src="img/noble.png" alt="Le faux noble" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Apiculteur':'<img src="img/apiculteur.png" alt="Apiculteur" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Missionaire':'<img src="img/missionnaire.png" alt="Missionnaire" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Colline':'<img src="img/colline.png" alt="Colline" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Chapelle':'<img src="img/chapelle.png" alt="Chapelle" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Eglise':'<img src="img/eglise.png" alt="Eglise" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Cathédrale':'<img src="img/cathedrale.png" alt="Cathédrale" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Observatoire':'<img src="img/observatoire.png" alt="Observatoire" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Laboratoire':'<img src="img/laboratoire.png" alt="Laboratoire" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Sanctuaire':'<img src="img/sanctuaire.png" alt="Sanctuaire" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Forge':'<img src="img/forge.png" alt="Forge" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Bijoux':'<img src="img/bijoux.png" alt="Bijoux" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Armurerie':'<img src="img/armurie.png" alt="Armurerie" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Muraille':'<img src="img/muraille.png" alt="Muraille" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Marais':'<img src="img/marais.png" alt="Marais" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Marais Amenagés':'<img src="img/marais-amenages.png" alt="Marais Aménagés" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Jardin du Marais':'<img src="img/nenuphar.png" alt="Jardin du marais" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Arbres à Fruits Exotiques':'🍍',
    'Lac':'<img src="img/lac.png" alt="Lac" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Bateau de Pêche':'⛵',
    'Chalet du Pêcheur':'<img src="img/chalet-pecheur.png" alt="Chalet du pêcheur" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Phare':'🗼',
    'Falaises de l\'Est': '<img src="img/falaises.png" alt="Falaises de l\'Est" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Eruption volcanique':'<img src="img/volcan.png" alt="Eruption volcanique" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Cendres volcaniques':'<img src="img/destruction.png" alt="Cendres volcaniques" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
    'Jeune forêt':'<img src="img/jeune-foret.png" alt="Jeune forêt" style="width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;">',
  }[nom]) || TYPE_ICONS[type] || '📄';
}

function createCardInstance(cardDef) {
  return { cardDef, currentFace: cardStateMap[cardDef.numero] || 1 };
}

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

// Ressources réellement disponibles (hors staging) — utilisées pour vérifier
// si une promotion ou un effet activable est payable avec des ressources acquises.
// Les productions en attente dans la staging zone ne sont PAS incluses.
function getConfirmedResources() {
  const confirmed = { ...gameState.resources };
  // Déduire uniquement les coûts déjà engagés (upgrades et activations en staging)
  gameState.staging.forEach(entry => {
    if (entry.action === 'activate') {
      (entry.cout || []).forEach(c => {
        const key = normalizeRes(c.type);
        confirmed[key] = (confirmed[key] || 0) - c.quantite;
      });
    } else if (entry.action === 'upgrade' && entry.cout) {
      entry.cout.forEach(c => {
        const key = normalizeRes(c.type);
        confirmed[key] = (confirmed[key] || 0) - c.quantite;
      });
    }
    // Les productions (action='produce') ne sont PAS ajoutées : elles ne sont
    // pas encore confirmées et ne peuvent pas financer une promo ou un effet.
  });
  return confirmed;
}

function isScientistActiveInPlay() {
  const activeCards = [
    ...(gameState.play || []),
    ...(gameState.stayInPlay || []),
    ...(gameState.retainedCards || []),
    ...(gameState.permanent || [])
  ];
  return activeCards.some(ci => ci.cardDef.numero === 32);
}

function getScientistPersonneBonus(faceData) {
  return isScientistActiveInPlay() && faceData && faceData.type === 'Personne' ? 1 : 0;
}

function getScientistPersonneBonusForCard(cardNum, faceData) {
  if (!getScientistPersonneBonus(faceData) || typeof cardNum === 'undefined' || cardNum === null) return 0;
  const activeCards = [
    ...(gameState.play || []),
    ...(gameState.stayInPlay || []),
    ...(gameState.retainedCards || []),
    ...(gameState.permanent || [])
  ];
  return activeCards.some(ci => ci.cardDef.numero === cardNum) ? 1 : 0;
}

// Une carte nécessite un choix de face si :
// - elle a exactement 2 faces
// - aucune face n'est un Bandit (type Ennemi, nom Bandit)
// - la face 1 n'a PAS de promotion/promotions (sinon c'est un upgrade classique)
function isChoiceCard(cardDef) {
  if (cardDef.faces.length !== 2) return false;
  if (cardDef.faces.some(f => f.type === 'Ennemi' && f.nom === 'Bandit')) return false;
  const face1 = cardDef.faces[0];
  return !face1.promotion && (!face1.promotions || face1.promotions.length === 0);
}
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}