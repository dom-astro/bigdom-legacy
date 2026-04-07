// Données des cartes 23 à 27 — règles de l'Héritage
  const LEGACY_CARDS = [
    { "numero": 23,
      "type": "Règle",
      "description": "Maintenant que vous maîtrisez le jeu, vous pouvez recommencer si vous souhaitez tenter votre chance. Si vous continuez, vous découvrirez 4 cartes, les cartes 24 à 27. Examinez-les maintenant, puis décidez si vous voulez recommencer ou continuer.\n     Après ces cartes, vous découvrirez la partie « Héritage » du jeu, où certaines cartes changeront définitivement au fil de la partie. Vous ne pourrez plus réinitialiser le jeu une fois engagé dans cette voie."
    },
    { "numero": 24,
      "nom": "Terre fertile",
      "type": "Parchemin",
      "effet": [
          {
            "type": "Permanent",
            "description": "Ajoutez l'autocollant Or (🪙×1) sur un Terrain de votre royaume.",
            "type_effet": "sticker",
            "stickers": [1],
            "cible": "Terrain"
          },
          {
            "type": "Permanent",
            "description": "Choisissez un Bâtiment et ajoutez-lui un autocollant de production (Bois, Pierre, Métal, Épée ou Marchandise).",
            "type_effet": "sticker",
            "stickers": [2, 3, 4, 5, 6],
            "cible": "Bâtiment"
          }
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
            { "index": 10, "cout_epee": 10, "gloire": 50, "decouverte": 135, "promotion": true }
          ]
        },
        {
          "face": 2,
          "nom": "Grande Armée",
          "description": "Dépensez des ⚔️ pour améliorer votre Grande Armée. Vaut 50 gloire + la gloire de la case la plus haute marquée.",
          "gloire_bonus": 50,
          "cases": [
            { "index": 1, "cout_epee": 10, "gloire": 60 },
            { "index": 2, "cout_epee": 10, "gloire": 70 },
            { "index": 3, "cout_epee": 12, "gloire": 80 },
            { "index": 4, "cout_epee": 12, "gloire": 90 },
            { "index": 5, "cout_epee": 15, "gloire": 100 }
          ]
        }
      ]
    },
    { "numero": 26,
      "nom": "Trésor",
      "type": "Progression",
      "description": "Accumulez des richesses, on ne sait jamais quand on pourrait en avoir besoin !",
      "permanent": true,
      "faces": [
        {
          "face": 1,
          "nom": "Trésor",
          "description": "Cette carte est permanente. Dépensez de l'🪙 pour remplir votre trésor : marquez 1 case de gauche à droite. Cette carte vaut la gloire de la case la plus haute marquée. Quand toutes les cases sont remplies, cette carte devient Trésor Étendu.",
          "cases": [
            { "index": 1,  "cout_or": 1,  "gloire": 1  },
            { "index": 2,  "cout_or": 2,  "gloire": 2  },
            { "index": 3,  "cout_or": 3,  "gloire": 3  },
            { "index": 4,  "cout_or": 4,  "gloire": 5  },
            { "index": 5,  "cout_or": 5,  "gloire": 7  },
            { "index": 6,  "cout_or": 6,  "gloire": 10 },
            { "index": 7,  "cout_or": 7,  "gloire": 14 },
            { "index": 8,  "cout_or": 8,  "gloire": 19 },
            { "index": 9,  "cout_or": 9,  "gloire": 25 },
            { "index": 10, "cout_or": 10, "gloire": 32 },
            { "index": 11, "cout_or": 11, "gloire": 40 },
            { "index": 12, "cout_or": 12, "gloire": 50, "promotion": true }
          ]
        },
        {
          "face": 2,
          "nom": "Trésor Étendu",
          "description": "Cette carte est permanente. Dépensez de l'🪙 pour continuer à remplir votre trésor : marquez 1 case de gauche à droite. Cette carte vaut 50 gloire + la gloire de la case la plus haute marquée.",
          "gloire_bonus": 50,
          "cases": [
            { "index": 13, "cout_or": 13, "gloire": 60 },
            { "index": 14, "cout_or": 14, "gloire": 70 },
            { "index": 15, "cout_or": 15, "gloire": 80 },
            { "index": 16, "cout_or": 16, "gloire": 90 },
            { "index": 17, "cout_or": 17, "gloire": 100 }
          ]
        }
      ]
    },
    { "numero": 27,
      "nom": "Export",
      "type": "Progression",
      "description": "Rendez-vous indispensable pour vos voisins, cela paiera sûrement !",
      "permanent": true,
      "faces": [
        {
          "face": 1,
          "nom": "Export",
          "description": "Cette carte est permanente. À chaque fois que vous gagnez des Marchandises 🏺, vous pouvez les dépenser ici pour faire progresser votre commerce. Le compteur est cumulatif : dépensez autant que vous voulez, même plusieurs fois par tour. Entre deux tours, vous pouvez utiliser (et barrer ✗) les effets des seuils atteints.",
          "seuils": [
            { "index": 1,  "cout_total": 10,  "effet": "Autocollant 1, 2 ou 3 sur 1 Terrain",   "type_effet": "sticker", "stickers": [1,2,3],   "cible": "Terrain"   },
            { "index": 2,  "cout_total": 20,  "effet": "Autocollant 7 sur 1 Personne",           "type_effet": "sticker", "stickers": [7],       "cible": "Personne"  },
            { "index": 3,  "cout_total": 30,  "effet": "Découvrir la carte #86 (Anoblissement)", "type_effet": "decouverte", "carte": 86         },
            { "index": 4,  "cout_total": 40,  "effet": "Autocollant 4, 5 ou 6 sur 1 Bâtiment",  "type_effet": "sticker", "stickers": [4,5,6],   "cible": "Bâtiment"  },
            { "index": 5,  "cout_total": 55,  "effet": "Autocollant 2, 3, 4 ou 5 sur 1 carte alliée", "type_effet": "sticker", "stickers": [2,3,4,5], "cible": "Alliée" },
            { "index": 6,  "cout_total": 75,  "effet": "Autocollant 10 sur n'importe quelle carte", "type_effet": "sticker", "stickers": [10],    "cible": "Toute"     },
            { "index": 7,  "cout_total": 100, "effet": "Promotion vers Mass Export",              "type_effet": "promotion"                       }
          ]
        },
        {
          "face": 2,
          "nom": "Mass Export",
          "description": "Cette carte est permanente. Continuez à dépenser des Marchandises 🏺 pour débloquer de nouveaux avantages commerciaux. Le compteur reprend là où vous vous étiez arrêté. Entre deux tours, utilisez (et barrez ✗) les effets des seuils atteints.",
          "seuils": [
            { "index": 8,  "cout_total": 125, "effet": "Autocollant 8 sur 2 Terrains différents", "type_effet": "sticker", "stickers": [8],      "cible": "Terrain",  "quantite": 2 },
            { "index": 9,  "cout_total": 150, "effet": "Autocollant 10 sur 1 Personne",            "type_effet": "sticker", "stickers": [10],     "cible": "Personne"  },
            { "index": 10, "cout_total": 175, "effet": "Découvrir la carte #107 (Visite Royale)",  "type_effet": "decouverte", "carte": 107       },
            { "index": 11, "cout_total": 200, "effet": "Autocollant 10 sur 1 Bâtiment",            "type_effet": "sticker", "stickers": [10],     "cible": "Bâtiment"  },
            { "index": 12, "cout_total": 225, "effet": "Détruire 1 autre carte permanente en gagnant tous ses effets", "type_effet": "special_destroy_perm" },
            { "index": 13, "cout_total": 250, "effet": "Détruire toutes les autres cartes permanentes en gagnant leurs effets", "type_effet": "special_destroy_all_perm" },
            { "index": 14, "cout_total": 300, "effet": "Découvrir la carte #117 (Relations Commerciales)", "type_effet": "decouverte", "carte": 117 }
          ]
        }
      ]
    },
    { "numero": 28,
      "faces": [
        { "face": 1,
          "nom": "Erruption volcanique",
          "type": "Evènement",
          "description": "Un volcan proche de votre royaume entre en éruption, recouvrant les terres environnantes de cendres et de lave. Les ressources deviennent plus rares, mais les terres sont plus fertiles.",
          "Effet ": {
            "type": "Force",
            "description": "Tant que cette carte est en jeu, détruisez le prochain terrain que vous jouez puis retourner cette carte",
            "face": 3
          }
        },
        { "face": 3,
          "nom": "Cendres volcaniques",
          "type": "Terrain",
          "description": "Les cendres volcaniques enrichissent le sol, rendant les récoltes plus abondantes.",
          "victoire": -2,
          "promotion": {
            "face": 4,
            "cout": {
              "type": "Or",
              "quantite": 2
            }
          },
        },
        { "face": 4,
          "nom": "Jeune forêt",
          "type": "Terrain",
          "description": "La nature reprend ses droits sur les cendres, transformant le paysage en une jeune forêt.",
          "victoire": 1,
          "effet": {
            "type": "Marqueur",
            "description": "Vous pouvez utiliser le sablier pour cocher la prochaine case vide, de haut en bas. Lorsque vous cochez une case d'un astérisque, ajoutez le sticker Bois comme production sur cette carte. Au final, cela peut produire 3 unités de bois.",
            "cases": [
              { "index": 1, "ressource": "Bois", "quantite": 1  },
              { "index": 2  },
              { "index": 3,  "ressource": "Bois", "quantite": 1  },
              { "index": 4 },
              { "index": 5,  "ressource": "Bois", "quantite": 1  },
            ]
          }
        }
      ]
    },
    { "numero": 29,
      "faces": [
        { "face": 1,
          "nom": "L'opportuniste",
          "type": "Personne",
          "description": "L'Opportuniste peut toujours s'adapter à vos besoins",
          "ressources": { 
            "type": "Or",
            "quantite": 1
          }, 
          "promotions": [
            { "face": 2 } , { face: 4 }
          ]
        },
        { "face": 2,
          "nom": "Le recruteur",
          "type": "Personne",
          "description": "Le recruteur est un maître de la persuasion, capable de rallier les talents à votre cause.",
          "ressources": { 
            "type": "Epée",
            "quantite": 1
          }, 
          "promotions": [
            { "face": 1 } , { face: 3 }
          ]
        },
        { "face": 3,
          "nom": "Le faux noble",
          "type": "Personne",
          "description": "Le faux noble est un intrigant habile, capable de manipuler les situations à son avantage.",
          "victoire": 4, 
          "promotions": [
            { "face": 2 } , { face: 4 }
          ]
        },
        { "face": 4,
          "nom": "Le travailleur",
          "type": "Personne",
          "description": "Le travailleur est un individu dur et dévoué, capable de réaliser le travail nécessaire pour faire prospérer votre royaume.",
          "ressources": { 
            "type": "Pierre",
            "quantite": 1
          }, 
          "promotions": [
            { "face": 1 } , { face: 3 }
          ]
        },
      ]
    }
  ];