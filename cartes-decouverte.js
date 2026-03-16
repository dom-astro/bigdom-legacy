const CARDS_TO_DISCOVER = 
[
  { "numero": 71,
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
          "defausse": true,
          "description": "Défaussez cette carte et dépensez 1 Or pour extraire 2 Pierres supplémentaires de la zone rocheuse.",
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
          "defausse": false,
          "description": "Détruisez cette carte pour découvrir une nouvelle mine (carte #84 ou #85) et l'ajouter à votre deck.",
          "cartes": [
            84,
            85
          ]
        }
      }
    ]
  },
  { "numero": 72,
    "faces": [
      { "face": 1,
        "nom": "Forêt",
        "type": "Terrain",
        "description": "Une zone boisée, riche en ressources naturelles.",
        "ressources": [
          {
            "type": [
              "Bois"
            ],
            "quantite": 1
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Pierre",
              "quantite": 2
            }
          ]
        },
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Coupe Rase : abattez tous les arbres de la forêt pour récolter 3 Bois d'un coup. La forêt bascule sur sa face 'Coupe Rase' (terrain dégagé) et est aussitôt défaussée. Elle pourra repousser ou être aménagée par la suite.",
          "ressources": [
            {
              "type": [
                "Bois"
              ],
              "quantite": 3
            }
          ],
          "promotion": {
            "face": 2
          }
        }
      },
      { "face": 2,
        "nom": "Coupe Rase",
        "type": "Terrain",
        "description": "Une zone de terrain dégagée, idéale pour les constructions.",
        "promotions": [
          {
            "face": 1,
            "cout": [
              {
                "type": "Or",
                "quantite": 1
              }
            ]
          },
          {
            "face": 3,
            "cout": [
              {
                "type": "Pierre",
                "quantite": 1
              },
              {
                "type": "Bois",
                "quantite": 1
              },
              {
                "type": "Or",
                "quantite": 2
              }
            ]
          }
        ]
      },
      { "face": 3,
        "nom": "Cabane de Bûcheron",
        "type": "Bâtiment",
        "description": "Un abri pour les travailleurs du bois, offrant des ressources précieuses pour la construction.",
        "ressources": [
          {
            "type": [
              "Bois"
            ],
            "quantite": 2
          }
        ],
        "victoire": 2
      },
      { "face": 4,
        "nom": "Puit Sacré",
        "type": "Bâtiment",
        "description": "Un puits mystique qui ouvrer le chemin du sanctuaire.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "victoire": 2,
        "effet": {
          "type": "Destruction",
          "defausse": false,
          "description": "Détruisez ce puits sacré pour ouvrir le chemin du sanctuaire : découvrez la carte #82 ou #83 (Autel) et ajoutez-la à votre deck.",
          "cartes": [
            82,
            83
          ]
        }
      }
    ]
  },
  { "numero": 73,
    "faces": [
      { "face": 1,
        "nom": "Canyon de l'ouest",
        "type": "Terrain",
        "description": "Une zone de terrain rocailleux, riche en ressources naturelles.",
        "ressources": [
          {
            "type": ["Pierre", 'Métal'],
            "quantite": 1
          }
        ],
        "promotions": [
          {
            "face": 2,
            "cout": [
              { "type": "Or", "quantite": 1 },
              { "type": "Bois", "quantite": 1 },
              { "type": "Pierre", "quantite": 1 },
              { "type": "Métal", "quantite": 1 }
            ]
          },
          {
            "face": 4,
            "cout": [
              {
                "type": "Pierre",
                "quantite": 3
              }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Mineurs",
        "type": "Personnes",
        "description": "Des mineurs expérimentés, capables de récolter des ressources précieuses.",
        "victoire": 2,
        "ressources": [
          { "type": "Pierre", "quantite": 1 },
          { "type": "Métal", "quantite": 1 }
        ],
        "promotion": {
          "face": 3,
          "cout": [
            { "type": "Epée", "quantite": 2 }
          ]
        }
      },
      { "face": 3,
        "nom": "Travaux forcés",
        "type": "Etat",
        "description": "Une politique de travail forcé pour augmenter la production de ressources.",
        "victoire": -3,
        "ressources": [
          { "type": "Pierre", "quantite": 2 },
          { "type": "Métal", "quantite": 2 },
        ],
      },
      { "face": 4,
        "nom": "Muraille",
        "type": "Bâtiment",
        "description": "Une muraille imposante qui protège votre royaume des menaces extérieures, offrant une défense solide contre les attaques ennemies.",
        "victoire": 3,
        "ressources": [
          {
            "type": [
              "Epée"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Passif",
          "defausse": false,
          "description": "Cette muraille reste en jeu à la fin du tour (ne se défausse pas). Elle offre une présence permanente pour protéger votre royaume."
        }
      }
    ]
  },
  { "numero": 74,
    "faces": [
      { "face": 1,
        "nom": "Littoral",
        "type": "Terrain",
        "description": "Une zone côtière, riche en ressources maritimes.",
        "ressources": [
          { "type": "Or", "quantite": 1 }
        ],
        "promotions": [
          {
            "face": 2,
            "cout": [
              { "type": "Or", "quantite": 1 },
              { "type": "Bois", "quantite": 3 }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Chantier naval",
        "type": "Bâtiment",
        "description": "Un chantier naval pour construire des navires et exploiter les ressources maritimes.",
        "victoire": 3,
        "ressources": [
          { "type": [ "Or", "Bois" ], "quantite": 1 }
        ],
        "promotion": {
          "face": 3,
          "cout": [
            { "type": "Or", "quantite": 1 },
            { "type": "Bois", "quantite": 4 }
          ]
        }
      },
      { "face": 3,
        "nom": "Navire Marchand",
        "type": "Maritime - navire",
        "description": "Un navire marchand pour transporter des ressources maritimes.",
        "victoire": 6,
        "ressources": [
          { "type": ["Or", "Bois", "Marchandise"], "quantite": 1 }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            { "type": "Personne", "quantite": 2 },
            { "type": "Or", "quantite": 1 },
            { "type": "Bois", "quantite": 2 }
          ]
        }
      },
      { "face": 4,
        "nom": "Route commerciale",
        "type": "Maritime - navire",
        "description": "Une route commerciale maritime qui permet de transporter des marchandises entre les ports.",
        "victoire": 13,
        "ressources": [
          { "type": [ "Or", "Bois", "Métal", "Marchandise" ], "quantite": 1 }
        ],
        "effet": {
          "type": "Obligatoiref",
          "defausse": false,
          "description": "Effet forcé : dès que cette route commerciale entre en jeu, découvrez immédiatement le Pirate (carte #76) qui rejoindra votre deck — une menace inévitable sur les mers.",
          "carte": 76
        }
      }
    ]
  },
  { "numero": 82,
    "faces": [
      { "face": 1,
        "nom": "Autel",
        "type": "Terrain",
        "description": "Un autel sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 3,
        "effet": [
          {
            "type": "Retention",
            "defausse": true,
            "retenir": 1,
            "description": "Défaussez cette carte pour qu'une carte en jeu reste au tour suivant (ne sera pas défaussée en fin de tour)."
          }
        ],
        "promotion": {
          "face": 2,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Sanctuaire",
        "type": "Batiment",
        "description": "Un sanctuaire sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 5,
        "effet": [
          {
            "type": "Retention",
            "defausse": true,
            "retenir": 2,
            "description": "Défaussez ce sanctuaire pour que 2 cartes de votre choix en jeu restent sur la table au prochain tour (elles ne seront pas défaussées en fin de tour)."
          }
        ],
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            },
            {
              "type": "Pierre",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Oratoire",
        "type": "Batiment",
        "description": "Un oratoire sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 9,
        "effet": [
          {
            "type": "Retention",
            "defausse": true,
            "retenir": 3,
            "description": "Défaussez cet oratoire pour que 3 cartes de votre choix en jeu restent sur la table au prochain tour (elles ne seront pas défaussées en fin de tour)."
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            },
            {
              "type": "Bois",
              "quantite": 2
            },
            {
              "type": "Pierre",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Temple",
        "type": "Batiment",
        "description": "Un temple sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 15,
        "effet": [
          {
            "type": "Retention",
            "defausse": true,
            "retenir": 4,
            "description": "Défaussez ce temple pour que 4 cartes de votre choix en jeu restent sur la table au prochain tour (elles ne seront pas défaussées en fin de tour)."
          }
        ]
      },
    ]
  },
  { "numero": 83,
    "faces": [
      { "face": 1,
        "nom": "Autel",
        "type": "Terrain",
        "description": "Un autel sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 3,
        "effet": [
          {
            "type": "Retention",
            "retenir": 1,
            "description": "Défaussez cette carte pour qu'une carte en jeu reste au tour suivant."
          }
        ],
        "promotion": {
          "face": 2,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Sanctuaire",
        "type": "Batiment",
        "description": "Un sanctuaire sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 5,
        "effet": [
          {
            "type": "Retention",
            "defausse": true,
            "retenir": 2,
            "description": "Défaussez ce sanctuaire pour que 2 cartes de votre choix en jeu restent sur la table au prochain tour (elles ne seront pas défaussées en fin de tour)."
          }
        ],
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            },
            {
              "type": "Pierre",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Oratoire",
        "type": "Batiment",
        "description": "Un oratoire sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 9,
        "effet": [
          {
            "type": "Retention",
            "defausse": true,
            "retenir": 3,
            "description": "Défaussez cet oratoire pour que 3 cartes de votre choix en jeu restent sur la table au prochain tour (elles ne seront pas défaussées en fin de tour)."
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            },
            {
              "type": "Bois",
              "quantite": 2
            },
            {
              "type": "Pierre",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Temple",
        "type": "Batiment",
        "description": "Un temple sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 15,
        "effet": [
          {
            "type": "Retention",
            "defausse": true,
            "retenir": 4,
            "description": "Défaussez ce temple pour que 4 cartes de votre choix en jeu restent sur la table au prochain tour (elles ne seront pas défaussées en fin de tour)."
          }
        ]
      },
    ]
  },
  { "numero": 84,
    "faces": [
      { "face": 1,
        "nom": "Mine",
        "type": "Batiment",
        "description": "",
        "victoire": 4,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 1
          }
        ],
        "promotion": {
          "face": 2,
          "cout": [
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Mine profonde",
        "type": "Batiment",
        "description": "",
        "victoire": 6,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            },
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Mine de rubis",
        "type": "Batiment",
        "description": "",
        "victoire": 9,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 2
          },
          {
            "type": "Marchandise",
            "quantite": 1
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            },
            {
              "type": "Bois",
              "quantite": 2
            },
            {
              "type": "Pierre",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Mine de diamant",
        "type": "Batiment",
        "description": "",
        "victoire": 13,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 2
          },
          {
            "type": "Marchandise",
            "quantite": 2
          }
        ],
      },
    ]
  },
  { "numero": 85,
    "faces": [
      { "face": 1,
        "nom": "Mine",
        "type": "Batiment",
        "description": "",
        "victoire": 4,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 1
          }
        ],
        "promotion": {
          "face": 2,
          "cout": [
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Mine profonde",
        "type": "Batiment",
        "description": "",
        "victoire": 6,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            },
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Mine de rubis",
        "type": "Batiment",
        "description": "",
        "victoire": 9,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 2
          },
          {
            "type": "Marchandise",
            "quantite": 1
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            },
            {
              "type": "Bois",
              "quantite": 2
            },
            {
              "type": "Pierre",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Mine de diamant",
        "type": "Batiment",
        "description": "",
        "victoire": 13,
        "ressources": [
          {
            "type": "Pierre",
            "quantite": 1
          },
          {
            "type": "Métal",
            "quantite": 2
          },
          {
            "type": "Marchandise",
            "quantite": 2
          }
        ],
      },
    ]
  },
  { "numero": 103,
    "faces": [
      { "face": 1,
        "nom": "Missionaire",
        "type": "Personne",
        "description": "Un missionnaire dévoué, prêt à répandre la foi et à convertire les mécréants.",
        "promotion": {
          "face": 2,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        },
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce missionnaire et dépensez 3 Or pour convertir un Bandit présent en jeu : le bandit est retiré du jeu sans combat et ne bloquera plus aucune carte.",
          "conversion": true,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Apiculteur",
        "type": "Personne",
        "description": "Un apiculteur expert, capable de produire du miel de qualité supérieure.",
        "effet": {
          "type": "Activable",
          "defausse": false,
          "description": "Activez sans défausser pour cocher une case de progression. Lorsque les 4 cases sont cochées, choisissez une ressource et ajoutez-la définitivement à la production de cette carte (effet permanent)."
        }
      }
    ]
  }
]