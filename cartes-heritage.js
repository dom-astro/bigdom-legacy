  // Données des cartes level-1 (23-27 — règles de l'Héritage)
  // Chargées depuis level-1.js — intégrées inline pour garantir la disponibilité synchrone
  const LEVEL1_CARDS = [
    { "numero": 23,
      "type": "Règle",
      "description": "Maintenant que vous maîtrisez le jeu, vous pouvez recommencer si vous souhaitez tenter votre chance. Si vous continuez, vous découvrirez 4 cartes, les cartes 24 à 27. Examinez-les maintenant, puis décidez si vous voulez recommencer ou continuer.\n     Après ces cartes, vous découvrirez la partie « Héritage » du jeu, où certaines cartes changeront définitivement au fil de la partie. Vous ne pourrez plus réinitialiser le jeu une fois engagé dans cette voie."
    },
    { "numero": 24,
      "nom": "Terre fertile",
      "type": "Parchemin",
      "effet": [
          { "type": "Permanent", "description": "Ajouter une ressource Or à un terrain de votre deck" },
          { "type": "Permanent", "description": "Choisissez un bâtiment et augmentez sa production de ressource de un" }
      ]
    },
    { "numero": 25,
      "nom": "Armée",
      "type": "Progression",
      "description": "Pour conquérir de nouveaux territoires, vous devez entraîner une armée.",
      "permanent": true,
      "faces": [
        {
          "face": 1,
          "nom": "Armée",
          "description": "Cette carte est permanente. Dépensez des ⚔️ pour améliorer votre armée : marquez 1 case de gauche à droite. Quand toutes les cases sont remplies, découvrez l'État Vassal (#135) et cette carte devient Grande Armée. Vaut la gloire de la case la plus haute marquée.",
          "cases": [
            { "index": 1,  "cout_epee": 1,  "gloire": 1  },
            { "index": 2,  "cout_epee": 2,  "gloire": 4  },
            { "index": 3,  "cout_epee": 3,  "gloire": 7  },
            { "index": 4,  "cout_epee": 4,  "gloire": 10 },
            { "index": 5,  "cout_epee": 5,  "gloire": 14 },
            { "index": 6,  "cout_epee": 6,  "gloire": 19 },
            { "index": 7,  "cout_epee": 7,  "gloire": 25 },
            { "index": 8,  "cout_epee": 8,  "gloire": 32 },
            { "index": 9,  "cout_epee": 9,  "gloire": 40 },
            { "index": 10, "cout_epee": 10, "gloire": 0, "decouverte": 135, "promotion": true }
          ]
        },
        {
          "face": 2,
          "nom": "Grande Armée",
          "description": "Dépensez des ⚔️ pour améliorer votre Grande Armée. Vaut 50 gloire + la gloire de la case la plus haute marquée.",
          "gloire_bonus": 50,
          "cases": [
            { "index": 1, "cout_epee": 10, "gloire": 10 },
            { "index": 2, "cout_epee": 10, "gloire": 20 },
            { "index": 3, "cout_epee": 12, "gloire": 30 },
            { "index": 4, "cout_epee": 12, "gloire": 40 },
            { "index": 5, "cout_epee": 15, "gloire": 50 }
          ]
        }
      ]
    },
    { "numero": 26, "nom": "Trésor",   "type": "Progression", "faces": [{ "face": 1 },{ "face": 2 }] },
    { "numero": 27, "nom": "Export",   "type": "Progression", "faces": [{ "face": 1 },{ "face": 2 }] }
  ];