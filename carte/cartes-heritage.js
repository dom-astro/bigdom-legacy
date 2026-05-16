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
          "description": "Cette carte est permanente. À chaque fois que vous gagnez des Marchandises <img src='img/marchandise.png' alt='Marchandise' style='width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;'>, vous pouvez les dépenser ici pour faire progresser votre commerce. Le compteur est cumulatif : dépensez autant que vous voulez, même plusieurs fois par tour. Entre deux tours, vous pouvez utiliser (et barrer ✗) les effets des seuils atteints.",
          "seuils": [
            { "index": 1,  "cout_total": 10,  "effet": "Autocollant 1, 2 ou 3 sur 1 Terrain",   "type_effet": "sticker", "stickers": [1,2,3], "cible": "Terrain"   },
            { "index": 2,  "cout_total": 20,  "effet": "Autocollant 7 sur 1 Personne",           "type_effet": "sticker", "stickers": [7], "cible": "Personne"  },
            { "index": 3,  "cout_total": 30,  "effet": "Découvrir la carte #86 (Anoblissement)", "type_effet": "decouverte", "carte": 86 },
            { "index": 4,  "cout_total": 40,  "effet": "Autocollant 4, 5 ou 6 sur 1 Bâtiment",  "type_effet": "sticker", "stickers": [4,5,6], "cible": "Bâtiment"  },
            { "index": 5,  "cout_total": 55,  "effet": "Autocollant 2, 3, 4 ou 5 sur 1 carte alliée", "type_effet": "sticker", "stickers": [2,3,4,5], "cible": "Alliée" },
            { "index": 6,  "cout_total": 75,  "effet": "Autocollant 10 sur n'importe quelle carte", "type_effet": "sticker", "stickers": [10], "cible": "Toute"     },
            { "index": 7,  "cout_total": 100, "effet": "25 points de victoire", "type_effet": "victoire", "victoire": 25  },
            { "index": 8,  "cout_total": 125, "effet": "Autocollant 8 sur 2 terrains différents", "type_effet": "sticker", "stickers": [8,8], "cible": "Terrain", "victoire": 25  },
            { "index": 9,  "cout_total": 150, "effet": "Autocollant 10 sur une personne", "type_effet": "sticker", "stickers": [10], "cible": "Personne"  },
            { "index": 10,  "cout_total": 175, "effet": "Découvrir la carte #107 (Visite Royale)", "type_effet": "decouverte", "carte": 107 },
            { "index": 11,  "cout_total": 200, "effet": "Autocollant 10 sur un bâtiment", "type_effet": "sticker", "stickers": [10], "cible": "Bâtiment"  },
            { "index": 12,  "cout_total": 250, "effet": "Active une case sur une autre carte permanente", "type_effet": "Activation"  },
            { "index": 13,  "cout_total": 300, "effet": "Active une case sur toutes les autres cartes permanente", "type_effet": "Activation"  },
            { "index": 14,  "cout_total": 350, "effet": "Découvrir la carte #117 (Relations Commerciales)", "type_effet": "decouverte", "carte": 117 }]
        },
        {
          "face": 2,
          "nom": "Mass Export",
          "description": "Cette carte est permanente. Continuez à dépenser des Marchandises <img src='img/marchandise.png' alt='Marchandise' style='width:1.5em;height:1.5em;vertical-align:-0.15em;object-fit:contain;'> pour débloquer de nouveaux avantages commerciaux. Le compteur reprend là où vous vous étiez arrêté. Entre deux tours, utilisez (et barrez ✗) les effets des seuils atteints.",
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
          "nom": "Eruption volcanique",
          "type": "Evènement",
          "description": "Un volcan proche de votre royaume entre en éruption, recouvrant les terres environnantes de cendres et de lave. Les ressources deviennent plus rares, mais les terres sont plus fertiles.",
          "Effet ": {
            "type": "Force",
            "description": "Tant que cette carte est en jeu, détruisez le prochain terrain que vous jouez puis retourner cette carte",
            "promotion": {
              "face": 2
            }
          }
        },
        { "face": 2,
          "nom": "Cendres volcaniques",
          "type": "Terrain",
          "description": "Les cendres volcaniques enrichissent le sol, rendant les récoltes plus abondantes.",
          "victoire": -2,
          "promotion": {
            "face": 2,
            "cout": {
              "type": "Or",
              "quantite": 2
            }
          },
        },
        { "face": 3,
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
          "ressources": [
            { "type": "Or", "quantite": 1 }
          ],
          "promotions": [
            { "face": 2 } , { face: 4 }
          ]
        },
        { "face": 2,
          "nom": "Le recruteur",
          "type": "Personne",
          "description": "Le recruteur est un maître de la persuasion, capable de rallier les talents à votre cause.",
          "ressources": [
            { "type": "Epée", "quantite": 1 }
          ],
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
          "ressources": [
            { "type": "Pierre", "quantite": 1 }
          ],
          "promotions": [
            { "face": 1 } , { face: 3 }
          ]
        },
      ]
    },
    { "numero": 31,
      "faces": [
        {
          "face": 1,
          "nom": "Entrepreneur",
          "type": "Personne",
          "description": "Un entrepreneur ambitieux qui cherche à développer son commerce et à étendre son influence.",
          "ressources": [
            { "type": "Marchandise", "quantite": 1 }
          ],
          "effet": {
            "type": "Activable",
            "description": "À son arrivée, l'Entrepreneur établit de nouveaux contacts et découvre la carte #118.",
            "carte": 118
          },
          "promotion": {
            "face": 2,
            "cout": [
              { "type": "Or", "quantite": 1 },
              { "type": "Bois", "quantite": 3 }
            ]
          }
        },
        {
          "face": 2,
          "nom": "Hôtel",
          "type": "Bâtiment",
          "description": "Un établissement prospère qui attire de nombreux voyageurs et personnalités.",
          "victoire": 2,
          "ressources": [
            { "type": "Or", "quantite": 1 },
            { "type": "Marchandise", "quantite": 1 }
          ],
          "effet": {
            "type": "Passif",
            "description": "Gagne 1 Or pour chaque carte Personne en jeu.",
            "ressources": [
              {
                "type": "Or",
                "quantite": {
                  "multiplie": 1,
                  "par": "Personne"
                }
              }
            ]
          },
          "promotion": {
            "face": 3,
            "cout": [
              { "type": "Or", "quantite": 1 },
              { "type": "Bois", "quantite": 1 },
              { "type": "Pierre", "quantite": 1 }
            ]
          }
        },
        {
          "face": 3,
          "nom": "Pub",
          "type": "Bâtiment",
          "description": "Un lieu de rencontre populaire où les affaires se font et les rumeurs se propagent.",
          "victoire": 2,
          "ressources": [
            { "type": "Marchandise", "quantite": 2 }
          ],
          "effet": {
            "type": "Activable",
            "defausse": true,
            "description": "Défaussez cette carte et une carte Personne pour découvrir la carte #92.",
            "cartes": [92]
          },
          "promotion": {
            "face": 4,
            "cout": [
              { "type": "Or", "quantite": 2 },
              { "type": "Bois", "quantite": 2 },
              { "type": "Marchandise", "quantite": 2 }
            ]
          }
        },
        {
          "face": 4,
          "nom": "Taverne",
          "type": "Bâtiment",
          "description": "Le cœur social du royaume, un lieu de fête et de transactions lucratives.",
          "victoire": 4,
          "ressources": [
            { "type": "Marchandise", "quantite": 2 },
            { "type": "Or", "quantite": 2 }
          ],
          "effet": {
            "type": "Activable",
            "description": "L'influence de la Taverne est telle qu'elle attire l'attention et découvre la carte #87.",
            "carte": 87
          }
        }
      ]
    },
    { "numero": 32,
      "faces": [
        {
          "face": 1,
          "nom": "Scientifique",
          "type": "Personne",
          "description": "Un scientifique de renom qui, par sa présence, stimule la recherche et l'économie.",
          "effet": {
            "type": "Passif",
            "description": "Toutes les personnes en zone de jeu, y compris le scientifique, produisent 1 or.",
            "ressources": [
              {
                "type": "Or",
                "quantite": {
                  "multiplie": 1,
                  "par": "Personne"
                }
              }
            ]
          },
          "promotion": {
            "face": 4,
            "cout": [
              { "type": "Bois", "quantite": 1 },
              { "type": "Métal", "quantite": 3 },
              { "type": "Pierre", "quantite": 2 }
            ]
          }
        },
        {
          "face": 3,
          "nom": "Laboratoire",
          "type": "Bâtiment",
          "description": "Un laboratoire de pointe où les découvertes façonnent l'avenir du royaume.",
          "victoire": 10,
          "ressources": [
            { "type": "marchandise", "quantite": 2 },
            { "type": "Or", "quantite": 1 }
          ],
          "effet": {
            "type": "Activable",
            "description": "Permet de découvrir la carte #96.",
            "cartes": [96]
          },
          "promotion": {
            "face": 4,
            "cout": [
              { "type": "Or", "quantite": 2 },
              { "type": "Bois", "quantite": 2 },
              { "type": "marchandise", "quantite": 2 }
            ]
          }
        },
        {
          "face": 4,
          "nom": "Observatoire",
          "type": "Bâtiment",
          "description": "Un observatoire pour scruter les étoiles et percer les secrets de l'univers.",
          "victoire": 5,
          "ressources": [
            { "type": "marchandise", "quantite": 1 },
            { "type": "Or", "quantite": 1 }
          ],
          "effet": {
            "type": "Activable",
            "description": "Permet de découvrir la carte #95.",
            "cartes": [95]
          },
          "promotion": {
            "face": 3,
            "cout": [
              { "type": "Or", "quantite": 1 },
              { "type": "Pierre", "quantite": 2 },
              { "type": "Métal", "quantite": 2 }
            ]
          }
        }
      ]
    },
    { "numero": 33,
      "faces": [
        {
          "face": 1,
          "nom": "Ingénieur",
          "type": "Personne",
          "description": "Un ingénieur de génie capable de transformer des structures existantes en merveilles d'efficacité.",
          "effet": {
            "type": "Activable",
            "description": "Transforme une 'Cabane de bûcheron', 'Grange', ou 'Bateau de pêche' en jeu en une nouvelle carte spécialisée (#100, #101, ou #102).",
            "transformation": [
              { "source_nom": "Cabane de Bûcheron", "cible_carte": 100 },
              { "source_nom": "Grange", "cible_carte": 101 },
              { "source_nom": "Bateau de pêche", "cible_carte": 102 }
            ]
          },
          "promotion": {
            "face": 2,
            "cout": [
              { "type": "Bois", "quantite": 2 },
              { "type": "Métal", "quantite": 2 }
            ]
          }
        },
        {
          "face": 2,
          "nom": "Trébuchet",
          "type": "Bâtiment",
          "description": "Une puissante machine de siège, capable de détruire les fortifications ennemies et de découvrir de nouvelles stratégies.",
          "victoire": 1,
          "ressources": [
            { "type": "Epée", "quantite": 1 }
          ],
          "effet": [
            {
              "type": "Activable",
              "description": "Permet de découvrir la carte #96.",
              "cartes": [96]
            },
            {
              "type": "Activable",
              "description": "Vainquez un ennemi (dans la défausse, en jeu, ou permanent). Puis, marquez une case sur la carte permanente Armée.",
              "type_effet": "siege"
            }
          ]
        }
      ]
    },
    { "numero": 34,
      "faces": [
        {
          "face": 1,
          "nom": "Inventrice",
          "type": "Personne",
          "description": "Une inventrice brillante, toujours à la recherche de la prochaine grande idée. Chaque invention découverte la rend plus célèbre.",
          "victoire": {
            "description": "Gagne 5 points de victoire pour chaque invention découverte avec la face 'Inventrice inspirée'.",
            "valeur": {
              "multiplie": 5,
              "par": "InventionDecouverte"
            }
          },
          "promotion": {
            "face": 2,
            "cout": [
              { "type": "Or", "quantite": 2 }
            ]
          }
        },
        {
          "face": 2,
          "nom": "Inventrice inspirée",
          "type": "Bâtiment",
          "description": "L'inspiration a frappé ! L'inventrice se retire dans son atelier pour donner vie à une nouvelle création.",
          "victoire": {
            "description": "Gagne 5 points de victoire pour chaque invention découverte avec cette face.",
            "valeur": {
              "multiplie": 5,
              "par": "InventionDecouverte"
            }
          },
          "effet": {
            "type": "Activable",
            "description": "Découvrez une invention (#97, #98, ou #99). Vous gagnez 5 points de victoire et cette carte retourne à sa face 1.",
            "type_effet": "invention",
            "cartes_choix": [97, 98, 99],
            "gain_victoire": 5,
            "retour_face": 1
          }
        }
      ]
    },
    { "numero": 35,
      "faces": [
        { "face": 1,
          "nom": "Montagnes Lointaines",
          "type": "Terrain",
          "description": "Des montagnes riches en ressources, mais difficiles à exploiter.",
          "ressources": [
            {
              "type": [
                "Or"
              ],
              "quantite": 1
            }
          ],
          "promotion": {
            "face": 2,
            "cout": [
              {
                "type": "Or",
                "quantite": 2
              }
            ]
          }
        },
        { "face": 2,
          "nom": "Zone Rocheuse",
          "type": "Terrain",
          "description": "Une zone de terrain accidenté, riche en pierres mais difficile à exploiter.",
          "ressources": [
            {
              "type": [
                "Pierre"
              ],
              "quantite": 1
            }
          ],
          "effet": {
            "type": "Activable",
            "cout": [
              {
                "type": "Or",
                "quantite": 1
              }
            ],
            "ressources": [
              {
                "type": "Pierre",
                "quantite": 2
              }
            ]
          },
          "promotion": {
            "face": 3,
            "cout": [
              {
                "type": "Bois",
                "quantite": 2
              },
              {
                "type": "Or",
                "quantite": 2
              }
            ]
          }
        },
        { "face": 3,
          "nom": "Carrière",
          "type": "Terrain",
          "description": "Une zone d'extraction de pierre, offrant des ressources précieuses pour la construction.",
          "ressources": [
            {
              "type": [
                "Pierre"
              ],
              "quantite": 2
            }
          ],
          "promotion": {
            "face": 4,
            "cout": [
              {
                "type": "Bois",
                "quantite": 2
              },
              {
                "type": "Or",
                "quantite": 2
              }
            ]
          }
        },
        { "face": 4,
          "nom": "Mine Peu Profonde",
          "type": "Bâtiment",
          "description": "Une mine à ciel ouvert pour extraire les ressources minérales.",
          "ressources": [
            {
              "type": [
                "Pierre"
              ],
              "quantite": 1
            },
            {
              "type": [
                "Métal"
              ],
              "quantite": 1
            }
          ],
          "victoire": 3,
          "effet": {
            "type": "Destruction",
          "description": "Découvrez la carte #84 ou #85 (Mine Profonde) et ajoutez-la à votre défausse.",
            "cartes": [
              84,
              85
            ]
          }
        }
      ]
    },
    { "numero": 36,
      "faces": [
        { "face": 1,
          "nom": "Mercenaire",
          "type": "Personne",
          "description": "Un mercenaire expérimenté, prêt à se battre pour la meilleure offre. Son expertise militaire peut être précieuse pour défendre votre royaume ou conquérir de nouveaux territoires.",
          "promotion": {
            "face": 2,
            "cout": [
              {
                "type": "Or",
                "quantite": 3
              },
              {
                "type": "Lingot",
                "quantite": 1
              }
            ]
          }
        },
        { "face": 2,
          "nom": "Sir",
          "type": "Personne",
          "description": "Donner à ce personnage le nom de votre choix.",
          "effet": {
            "type": "Temporaire",
            "cout": [
              {
                "type": "Lingot",
                "quantite": 3
              }
            ],
            "ressources": [
              {
                "type": "Stricker",
                "quantite": 1
              }
            ]
          }
        }
      ]
    }
];