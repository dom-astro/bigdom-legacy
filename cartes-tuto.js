const BEGIN_CARDS = 
[
  { "numero": 1,
    "faces": [
      { "face": 1,
        "nom": "Herbes Sauvages",
        "type": "Terrain",
        "description": "Une zone de terre fertile, idéale pour la culture.",
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
        "nom": "Plaines",
        "type": "Terrain",
        "description": "Une vaste étendue de terre, parfaite pour l'agriculture.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Sacrifice : défaussez cette carte ainsi qu'une autre carte alliée en jeu pour récolter 2 Or d'un coup — au lieu du seul 1 Or de production normale.",
          "ressources": [
            {
              "type": "Or",
              "quantite": 2
            }
          ],
          "sacrifice": true
        },
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Terres cultivées",
        "type": "Terrain",
        "description": "Des champs fertiles prêts à être exploités.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Grange",
        "type": "Bâtiment",
        "description": "Un bâtiment de ferme pour stocker les récoltes.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "victoire": 3,
        "effet": {
          "type": "Reste en jeu",
          "defausse": false,
          "description": "Effet passif : cette Grange reste en jeu à la fin du tour. Elle est cependant défaussée si vous la choisissez pour produire ou activer un effet. En fin de manche, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  { "numero": 2,
    "faces": [
      { "face": 1,
        "nom": "Herbes Sauvages",
        "type": "Terrain",
        "description": "Une zone de terre fertile, idéale pour la culture.",
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
        "nom": "Plaines",
        "type": "Terrain",
        "description": "Une vaste étendue de terre, parfaite pour l'agriculture.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Sacrifice : défaussez cette carte ainsi qu'une autre carte alliée en jeu pour récolter 2 Or d'un coup — au lieu du seul 1 Or de production normale.",
          "ressources": [
            {
              "type": "Or",
              "quantite": 2
            }
          ],
          "sacrifice": true
        },
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Terres cultivées",
        "type": "Terrain",
        "description": "Des champs fertiles prêts à être exploités.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Grange",
        "type": "Bâtiment",
        "description": "Un bâtiment de ferme pour stocker les récoltes.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "victoire": 3,
        "effet": {
          "type": "Reste en jeu",
          "defausse": false,
          "description": "Effet passif : cette Grange reste en jeu à la fin du tour. Elle est cependant défaussée si vous la choisissez pour produire ou activer un effet. En fin de manche, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  { "numero": 3,
    "faces": [
      { "face": 1,
        "nom": "Herbes Sauvages",
        "type": "Terrain",
        "description": "Une zone de terre fertile, idéale pour la culture.",
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
        "nom": "Plaines",
        "type": "Terrain",
        "description": "Une vaste étendue de terre, parfaite pour l'agriculture.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Sacrifice : défaussez cette carte ainsi qu'une autre carte alliée en jeu pour récolter 2 Or d'un coup — au lieu du seul 1 Or de production normale.",
          "ressources": [
            {
              "type": "Or",
              "quantite": 2
            }
          ],
          "sacrifice": true
        },
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Terres cultivées",
        "type": "Terrain",
        "description": "Des champs fertiles prêts à être exploités.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Grange",
        "type": "Bâtiment",
        "description": "Un bâtiment de ferme pour stocker les récoltes.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "victoire": 3,
        "effet": {
          "type": "Reste en jeu",
          "defausse": false,
          "description": "Effet passif : cette Grange reste en jeu à la fin du tour. Elle est cependant défaussée si vous la choisissez pour produire ou activer un effet. En fin de manche, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  { "numero": 4,
    "faces": [
      { "face": 1,
        "nom": "Herbes Sauvages",
        "type": "Terrain",
        "description": "Une zone de terre fertile, idéale pour la culture.",
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
        "nom": "Plaines",
        "type": "Terrain",
        "description": "Une vaste étendue de terre, parfaite pour l'agriculture.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Sacrifice : défaussez cette carte ainsi qu'une autre carte alliée en jeu pour récolter 2 Or d'un coup — au lieu du seul 1 Or de production normale.",
          "ressources": [
            {
              "type": "Or",
              "quantite": 2
            }
          ],
          "sacrifice": true
        },
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Terres cultivées",
        "type": "Terrain",
        "description": "Des champs fertiles prêts à être exploités.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Grange",
        "type": "Bâtiment",
        "description": "Un bâtiment de ferme pour stocker les récoltes.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "victoire": 3,
        "effet": {
          "type": "Reste en jeu",
          "defausse": false,
          "description": "Effet passif : cette Grange reste en jeu à la fin du tour. Elle est cependant défaussée si vous la choisissez pour produire ou activer un effet. En fin de manche, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  { "numero": 5,
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
          "description": "Détruisez cette mine peu profonde pour en creuser une plus grande : découvrez la carte #84 ou #85 (Mine) et ajoutez-la à votre deck.",
          "cartes": [
            84,
            85
          ]
        }
      }
    ]
  },
  { "numero": 6,
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
          "description": "Détruisez cette mine peu profonde pour en creuser une plus grande : découvrez la carte #84 ou #85 (Mine) et ajoutez-la à votre deck.",
          "cartes": [
            84,
            85
          ]
        }
      }
    ]
  },
  { "numero": 7,
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
          "description": "Coupe Rase : abattez tous les arbres pour récolter 3 Bois d'un coup. La forêt bascule sur sa face 'Coupe Rase' (terrain dégagé) et est aussitôt défaussée. Le terrain pourra repousser ou être aménagé par la suite.",
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
  { "numero": 8,
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
          "description": "Coupe Rase : abattez tous les arbres pour récolter 3 Bois d'un coup. La forêt bascule sur sa face 'Coupe Rase' (terrain dégagé) et est aussitôt défaussée. Le terrain pourra repousser ou être aménagé par la suite.",
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
  { "numero": 9,
    "faces": [
      { "face": 1,
        "nom": "Quartier Général",
        "type": "Bâtiment",
        "description": "Le centre de commandement de votre royaume, essentiel pour la défense et la coordination.",
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
              "type": "Pierre",
              "quantite": 3
            },
            {
              "type": "Bois",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Hôtel de Ville",
        "type": "Bâtiment",
        "description": "Un bâtiment administratif qui centralise les ressources et les décisions de votre royaume.",
        "victoire": 3,
        "ressources": [
          {
            "type": [
              "Epée"
            ],
            "quantite": 1
          }
        ],
        "promotions": [
          {
            "face": 3,
            "cout": [
              {
                "type": "Bois",
                "quantite": 2
              },
              {
                "type": "Pierre",
                "quantite": 4
              }
            ]
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cet Hôtel de Ville pour récupérer la production d'un Terrain ET d'un Bâtiment en jeu simultanément, sans les défausser.",
          "ressource": [
            {
              "type": "Terrain",
              "quantite": 1
            },
            {
              "type": "Bâtiment",
              "quantite": 1
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Donjon",
        "type": "Bâtiment",
        "description": "Une forteresse imposante qui protège votre royaume des menaces extérieures.",
        "ressources": [
          {
            "type": [
              "Epée"
            ],
            "quantite": 1
          }
        ],
        "victoire": 7,
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Métal",
              "quantite": 1
            },
            {
              "type": "Bois",
              "quantite": 2
            },
            {
              "type": "Pierre",
              "quantite": 6
            }
          ]
        },
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce Donjon pour récupérer la production d'un Terrain ET d'un Bâtiment en jeu simultanément, sans les défausser.",
          "ressource": [
            {
              "type": "Terrain",
              "quantite": 1
            },
            {
              "type": "Bâtiment",
              "quantite": 1
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Château",
        "type": "Bâtiment",
        "description": "Une résidence royale majestueuse, symbole de votre pouvoir et de votre influence.",
        "ressources": [
          {
            "type": [
              "Epée"
            ],
            "quantite": 1
          }
        ],
        "victoire": 12,
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce Château pour piocher une carte supplémentaire depuis le sommet de votre deck et la jouer immédiatement ce tour.",
          "ressource": [
            {
              "type": "Carte",
              "quantite": 1
            }
          ]
        }
      }
    ]
  },
  { "numero": 10,
    "faces": [
      { "face": 1,
        "nom": "Commerçante",
        "type": "Personne",
        "description": "Une marchande itinérante qui apporte des ressources précieuses et des opportunités commerciales.",
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cette marchande et dépensez 1 Or pour obtenir 1 Bois — un échange commercial avantageux pour les chantiers de construction.",
          "cout": [
            {
              "type": "Or",
              "quantite": 1
            }
          ],
          "ressources": [
            {
              "type": [
                "Bois"
              ],
              "quantite": 1
            }
          ]
        },
        "promotions": [
          {
            "face": 2,
            "cout": [
              {
                "type": "Or",
                "quantite": 3
              }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Bazar",
        "type": "Bâtiment",
        "description": "Un marché animé où les commerçants vendent leurs marchandises, offrant une variété de ressources pour votre royaume.",
        "victoire": 1,
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce bazar et dépensez 1 Or pour obtenir 1 Bois ou 1 Pierre au choix — les étals du marché proposent ce qu'il vous faut.",
          "cout": [
            {
              "type": "Or",
              "quantite": 1
            }
          ],
          "ressources": [
            {
              "type": [
                "Bois",
                "Pierre"
              ],
              "quantite": 1
            }
          ]
        },
        "promotions": [
          {
            "face": 3,
            "cout": [
              {
                "type": "Or",
                "quantite": 3
              }
            ]
          }
        ]
      },
      { "face": 3,
        "nom": "Marché",
        "type": "Bâtiment",
        "description": "Un centre commercial prospère où les marchands échangent des biens et des ressources, stimulant l'économie de votre royaume.",
        "victoire": 3,
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce marché et dépensez 1 Or pour obtenir 1 Bois, 1 Pierre ou 1 Or supplémentaire au choix — les marchands du bourg ont tout ce dont votre royaume a besoin.",
          "cout": [
            {
              "type": "Or",
              "quantite": 1
            }
          ],
          "ressources": [
            {
              "type": [
                "Or",
                "Bois",
                "Pierre"
              ],
              "quantite": 1
            }
          ]
        },
        "promotions": [
          {
            "face": 4,
            "cout": [
              {
                "type": "Or",
                "quantite": 5
              }
            ]
          }
        ]
      },
      { "face": 4,
        "nom": "Festival",
        "type": "Evènement",
        "description": "Un grand festival qui attire des visiteurs de tout le royaume, augmentant la popularité et les ressources de votre domaine.",
        "victoire": 4,
        "ressources": [
          {
            "type": [
              "Or",
              "Bois",
              "Pierre",
              "Métal"
            ],
            "quantite": 1
          }
        ]
      }
    ]
  },
  { "numero": 11,
    "faces": [
      { "face": 1,
        "nom": "Jungle",
        "type": "Terrain",
        "description": "Une dense jungle regorgeant de ressources naturelles, mais difficile à exploiter.",
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cette jungle et dépensez 1 Or pour faire défricher un coin de la forêt dense et récolter 1 Bois.",
          "cout": [
            {
              "type": "Or",
              "quantite": 1
            }
          ],
          "ressources": [
            {
              "type": "Bois",
              "quantite": 1
            }
          ]
        },
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
        "nom": "Arbres Géants",
        "type": "Terrain",
        "description": "Des arbres majestueux qui offrent des ressources précieuses pour la construction, mais nécessitent des efforts considérables pour être exploités.",
        "ressources": [
          {
            "type": [
              "Bois"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ces arbres géants et dépensez 1 Or pour organiser une coupe intensive et récolter 2 Bois supplémentaires.",
          "cout": [
            {
              "type": "Or",
              "quantite": 1
            }
          ],
          "ressources": [
            {
              "type": "Bois",
              "quantite": 2
            }
          ]
        },
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Jungle Profonde",
        "type": "Terrain",
        "description": "Une partie encore plus dense de la jungle, offrant des ressources abondantes mais nécessitant des efforts considérables pour être exploités.",
        "ressources": [
          {
            "type": [
              "Bois"
            ],
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Bois",
              "quantite": 4
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Cabane dans les Arbres",
        "type": "Bâtiment",
        "description": "Un refuge construit dans les arbres, offrant une vue imprenable sur la jungle et des ressources précieuses pour la construction.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          },
          {
            "type": [
              "Bois"
            ],
            "quantite": 2
          }
        ],
        "victoire": 4,
        "effet": {
          "type": "Passif",
          "defausse": false,
          "description": "Effet passif : cette cabane perchée dans les arbres reste en jeu à la fin du tour. Elle offre un refuge durable et continue de produire chaque tour sans être défaussée."
        }
      }
    ]
  },
  { "numero": 12,
    "faces": [
      { "face": 1,
        "nom": "Rivière",
        "type": "Terrain",
        "description": "Une rivière sinueuse qui traverse votre royaume, offrant des ressources précieuses et des opportunités de développement.",
        "ressources": [
          {
            "type": "Or",
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
        "nom": "Pont",
        "type": "Terrain",
        "description": "Un pont solide qui traverse la rivière, facilitant les déplacements et le commerce entre les différentes parties de votre royaume.",
        "victoire": 2,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Pierre",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Pont de Pierre",
        "type": "Terrain",
        "description": "Un pont de pierre robuste qui traverse la rivière, offrant une connexion solide et durable entre les différentes parties de votre royaume.",
        "victoire": 4,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Explorateurs",
        "type": "Personne",
        "description": "Un groupe d'explorateurs courageux qui découvrent de nouveaux territoires au-delà de la rivière, ouvrant la voie à l'expansion et à la conquête.",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "victoire": 4,
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ces explorateurs pour partir en expédition : découvrez l'un des nouveaux territoires (#71, #72, #73 ou #74) et ajoutez-le à votre deck.",
          "cartes": [
            71,
            72,
            73,
            74
          ],
          "promotion": {
            "face": 3
          }
        }
      }
    ]
  },
  { "numero": 13,
    "faces": [
      { "face": 1,
        "nom": "Exploitant",
        "type": "Personne",
        "description": "Un travailleur acharné qui exploite les ressources de votre royaume pour en tirer le meilleur parti.",
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cet exploitant pour activer immédiatement la production d'une carte Terrain en jeu, comme si vous l'aviez produite normalement (sans la défausser).",
          "ressources": [
            {
              "type": [
                "Terrain"
              ],
              "quantite": 1
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Domestique",
        "type": "Personne",
        "description": "Un serviteur dévoué qui s'occupe des tâches quotidiennes de votre royaume, vous permettant de vous concentrer sur la gestion et le développement.",
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce domestique pour recevoir gratuitement 1 ressource au choix parmi Or, Bois ou Pierre — le serviteur se met en quête de ce dont le royaume a besoin.",
          "ressources": [
            {
              "type": [
                "Or",
                "Bois",
                "Pierre"
              ],
              "quantite": 1
            }
          ]
        }
      }
    ]
  },
  { "numero": 14,
    "faces": [
      { "face": 1,
        "nom": "Bandit",
        "type": "Ennemi",
        "description": "Un bandit rusé qui menace la sécurité de votre royaume, volant des ressources et semant le chaos.",
        "victoire": -2,
        "effet": [
          {
            "type": "Obligatoire",
            "defausse": false,
            "description": "Effet forcé : dès que ce bandit entre en jeu, il bloque une carte alliée qui produit de l'Or. Cette carte bloquée ne peut plus être utilisée tant que le bandit est présent.",
            "blocage": {
              "type": "Carte",
              "production": "Or"
            }
          },
          {
            "type": "Activable",
            "defausse": true,
            "description": "Dépensez 1 ⚔️ Épée pour vaincre ce bandit : il est défaussé et vous gagnez 2 ressources au choix parmi Or, Bois, Pierre ou Métal en récompense.",
            "cout": [
              {
                "type": [
                  "Epée"
                ],
                "quantite": 1
              }
            ],
            "ressources": [
              {
                "type": [
                  "Or",
                  "Bois",
                  "Pierre",
                  "Métal"
                ],
                "quantite": 2
              }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Travailleur",
        "type": "Personne",
        "description": "Un ouvrier dévoué qui travaille dur pour construire et développer votre royaume, contribuant à son expansion et à sa prospérité.",
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce travailleur pour activer la production d'un Bâtiment en jeu, comme si vous l'aviez produit normalement (sans le défausser).",
          "ressources": [
            {
              "type": [
                "Bâtiment"
              ],
              "zone": "En jeu",
              "quantite": 1
            }
          ]
        }
      }
    ]
  },
  { "numero": 15,
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
          "cartes": [
            84,
            85
          ]
        }
      }
    ]
  },
  { "numero": 16,
    "faces": [
      { "face": 1,
        "nom": "Bandit",
        "type": "Ennemi",
        "description": "Un bandit rusé qui menace la sécurité de votre royaume, volant des ressources et semant le chaos.",
        "victoire": -2,
        "effet": [
          {
            "type": "Obligatoire",
            "defausse": false,
            "description": "Effet forcé : dès que ce bandit entre en jeu, il bloque une carte alliée qui produit de l'Or. Cette carte bloquée ne peut plus être utilisée tant que le bandit est présent.",
            "blocage": {
              "type": "Carte",
              "production": "Or"
            }
          },
          {
            "type": "Activable",
            "defausse": true,
            "description": "Dépensez 1 ⚔️ Épée pour vaincre ce bandit : il est défaussé et vous gagnez 2 ressources au choix parmi Or, Bois, Pierre ou Métal en récompense.",
            "cout": [
              {
                "type": [
                  "Epée"
                ],
                "quantite": 1
              }
            ],
            "ressources": [
              {
                "type": [
                  "Or",
                  "Bois",
                  "Pierre",
                  "Métal"
                ],
                "quantite": 2
              }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Exploitant",
        "type": "Personne",
        "description": "Un travailleur acharné qui exploite les ressources de votre royaume pour en tirer le meilleur parti.",
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cet exploitant pour activer immédiatement la production d'une carte Terrain en jeu, comme si vous l'aviez produite normalement (sans la défausser).",
          "ressources": [
            {
              "type": [
                "Terrain"
              ],
              "quantite": 1
            }
          ]
        }
      }
    ]
  },
  { "numero": 17,
    "faces": [
      { "face": 1,
        "nom": "Colline",
        "type": "Terrain",
        "description": "Une colline verdoyante offrant une vue panoramique sur les environs, idéale pour la construction de bâtiments importants.",
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
              "quantite": 1
            },
            {
              "type": "Bois",
              "quantite": 1
            },
            {
              "type": "Pierre",
              "quantite": 1
            }
          ]
        }
      },
      { "face": 2,
        "nom": "Chapelle",
        "type": "Bâtiment",
        "description": "Un lieu de culte modeste qui offre des ressources spirituelles et une protection contre les forces du mal.",
        "victoire": 1,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cette chapelle et dépensez 3 Or pour faire venir un Missionnaire (#103) dans votre royaume — la foi attire les hommes de Dieu.",
          "cout": [
            {
              "type": "Or",
              "quantite": 3
            }
          ],
          "cartes": [
            103
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
              "type": "Pierre",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Eglise",
        "type": "Bâtiment",
        "description": "Un lieu de culte plus grand et plus impressionnant, offrant des ressources spirituelles accrues et une protection renforcée contre les forces du mal.",
        "victoire": 3,
        "ressources": [
          {
            "type": [
              "Pierre"
            ],
            "quantite": 2
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cette église et dépensez 4 Or pour invoquer un personnage sacré (carte #104) et l'ajouter à votre royaume.",
          "cout": [
            {
              "type": "Or",
              "quantite": 4
            }
          ],
          "cartes": [
            104
          ]
        },
        "promotion": {
          "face": 4,
          "cout": [
            {
              "type": "Métal",
              "quantite": 1
            },
            {
              "type": "Bois",
              "quantite": 2
            },
            {
              "type": "Pierre",
              "quantite": 3
            }
          ]
        }
      },
      { "face": 4,
        "nom": "Cathédrale",
        "type": "Bâtiment",
        "description": "Un lieu de culte majestueux et imposant, symbole de la foi et de la puissance spirituelle de votre royaume.",
        "victoire": 7,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Passif",
          "defausse": false,
          "description": "Effet passif permanent : cette cathédrale produit 1 Or supplémentaire par carte Personne présente en jeu ce tour — la dévotion des ouailles enrichit le royaume.",
          "ressources": [
            {
              "type": [
                "Or"
              ],
              "quantite": {
                "multiplie": 1,
                "par": "Personne"
              }
            }
          ]
        }
      }
    ]
  },
  { "numero": 18,
    "faces": [
      { "face": 1,
        "nom": "Falaises de l'Est",
        "type": "Terrain",
        "description": "Des falaises escarpées offrant une vue imprenable sur les environs, mais difficiles à exploiter.",
        "ressources": [
          {
            "type": [
              "Pierre"
            ],
            "quantite": 1
          }
        ],
        "promotions": [
          {
            "face": 2,
            "cout": [
              {
                "type": "Bois",
                "quantite": 1
              },
              {
                "type": "Pierre",
                "quantite": 1
              },
              {
                "type": "Métal",
                "quantite": 2
              }
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
        "nom": "Forge",
        "type": "Bâtiment",
        "description": "Une forge où les artisans travaillent le métal pour créer des outils, des armes et des armures, offrant des ressources précieuses pour la construction et la défense de votre royaume.",
        "victoire": 1,
        "ressources": [
          {
            "type": [
              "Métal"
            ],
            "quantite": 1
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez cette forge pour la réinitialiser et découvrir la carte #90 (Bijoux) — les forgerons élaborent de précieux ornements pour le commerce.",
          "cartes": [
            90
          ]
        },
        "promotion": {
          "face": 3,
          "cout": [
            {
              "type": "Or",
              "quantite": 2
            },
            {
              "type": "Métal",
              "quantite": 2
            }
          ]
        }
      },
      { "face": 3,
        "nom": "Armurerie",
        "type": "Terrain",
        "description": "Un atelier où les armuriers fabriquent des armes et des armures, offrant des ressources précieuses pour la défense de votre royaume.",
        "victoire": 4,
        "effet": {
          "type": "Passif",
          "defausse": false,
          "description": "Effet passif : cette armurerie produit 1 ⚔️ Épée supplémentaire pour chaque carte Personne présente en jeu ce tour — les armuriers équipent chaque soldat.",
          "ressources": [
            {
              "type": [
                "Epée"
              ],
              "quantite": {
                "multiplie": 1,
                "par": "Personne"
              }
            }
          ]
        },
        "ressources": [
          {
            "type": [
              "Metal"
            ],
            "quantite": 1
          }
        ]
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
          "description": "Effet passif : cette muraille reste en jeu à la fin du tour. Elle offre une présence permanente pour protéger votre royaume, et continue de produire des ⚔️ Épées chaque tour."
        }
      }
    ]
  },
  { "numero": 19,
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
          "description": "Coupe Rase : abattez tous les arbres pour récolter 3 Bois d'un coup. La forêt bascule sur sa face 'Coupe Rase' (terrain dégagé) et est aussitôt défaussée. Le terrain pourra repousser ou être aménagé par la suite.",
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
  { "numero": 20,
    "faces": [
      { "face": 1,
        "nom": "Marais",
        "type": "Terrain",
        "description": "Un marais humide et boueux, offrant des ressources précieuses mais difficiles à exploiter.",
        "ressources": [],
        "promotions": [
          {
            "face": 2,
            "cout": [
              {
                "type": [
                  "Or"
                ],
                "quantite": 1
              },
              {
                "type": [
                  "Bois"
                ],
                "quantite": 1
              }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Marais Amenagés",
        "type": "Terrain",
        "victoire": 1,
        "ressources": [],
        "promotions": [
          {
            "face": 3,
            "cout": [
              {
                "type": [
                  "Or"
                ],
                "quantite": 2
              },
              {
                "type": [
                  "Bois"
                ],
                "quantite": 1
              }
            ]
          }
        ]
      },
      { "face": 3,
        "nom": "Jardin du Marais",
        "type": "Terrain",
        "victoire": 3,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "promotions": [
          {
            "face": 4,
            "cout": [
              {
                "type": [
                  "Or"
                ],
                "quantite": 1
              },
              {
                "type": [
                  "Bois"
                ],
                "quantite": 2
              }
            ]
          }
        ]
      },
      { "face": 4,
        "nom": "Arbres à Fruits Exotiques",
        "type": "Bâtiment",
        "victoire": 4,
        "ressources": [
          {
            "type": [
              "Marchandise"
            ],
            "quantite": 2
          }
        ],
        "promotions": []
      }
    ]
  },
  { "numero": 21,
    "faces": [
      { "face": 1,
        "nom": "Marais",
        "type": "Terrain",
        "description": "Un marais humide et boueux, offrant des ressources précieuses mais difficiles à exploiter.",
        "ressources": [],
        "promotions": [
          {
            "face": 2,
            "cout": [
              {
                "type": [
                  "Or"
                ],
                "quantite": 1
              },
              {
                "type": [
                  "Bois"
                ],
                "quantite": 1
              }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Marais Amenagés",
        "type": "Terrain",
        "description": "Un marais aménagé pour faciliter l'exploitation des ressources, offrant une base solide pour le développement futur.",
        "victoire": 1,
        "ressources": [],
        "promotions": [
          {
            "face": 3,
            "cout": [
              {
                "type": [
                  "Or"
                ],
                "quantite": 2
              },
              {
                "type": [
                  "Bois"
                ],
                "quantite": 1
              }
            ]
          }
        ]
      },
      { "face": 3,
        "nom": "Jardin du Marais",
        "type": "Terrain",
        "description": "Un jardin luxuriant au cœur du marais, offrant des ressources précieuses et une beauté naturelle qui attire les visiteurs.",
        "victoire": 3,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "promotions": [
          {
            "face": 4,
            "cout": [
              {
                "type": [
                  "Or"
                ],
                "quantite": 1
              },
              {
                "type": [
                  "Bois"
                ],
                "quantite": 2
              }
            ]
          }
        ]
      },
      { "face": 4,
        "nom": "Arbres à Fruits Exotiques",
        "type": "Bâtiment",
        "description": "Un verger de fruits exotiques, offrant des ressources précieuses et une attraction touristique pour votre royaume.",
        "victoire": 4,
        "ressources": [
          {
            "type": [
              "Marchandise"
            ],
            "quantite": 2
          }
        ],
        "promotions": []
      }
    ]
  },
  { "numero": 22,
    "faces": [
      { "face": 1,
        "nom": "Lac",
        "type": "Terrain",
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "promotions": [
          {
            "face": 2,
            "cout": [
              {
                "type": [
                  "Bois"
                ],
                "quantite": 1
              },
              {
                "type": [
                  "Pierre"
                ],
                "quantite": 2
              }
            ]
          },
          {
            "face": 4,
            "cout": [
              {
                "type": [
                  "Pierre"
                ],
                "quantite": 4
              }
            ]
          }
        ]
      },
      { "face": 2,
        "nom": "Chalet du Pêcheur",
        "type": "Bâtiment",
        "description": "Un chalet pittoresque au bord du lac, offrant des ressources précieuses pour la pêche et la navigation.",
        "victoire": 1,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 1
          }
        ],
        "promotions": [
          {
            "face": 3,
            "cout": [
              {
                "type": [
                  "Bois"
                ],
                "quantite": 3
              }
            ]
          }
        ]
      },
      { "face": 3,
        "nom": "Bateau de Pêche",
        "type": "Maritime",
        "description": "Un bateau de pêche robuste qui permet d'exploiter les ressources du lac, offrant des ressources précieuses pour la construction et la subsistance.",
        "victoire": 1,
        "ressources": [
          {
            "type": [
              "Or"
            ],
            "quantite": 2
          }
        ],
        "effet": {
          "type": "Activable",
          "defausse": true,
          "description": "Défaussez ce bateau pour organiser une expédition de pêche : découvrez la carte #75 et ajoutez-la à votre deck.",
          "carte": [
            75
          ]
        }
      },
      { "face": 4,
        "nom": "Phare",
        "type": "Bâtiment",
        "description": "Un phare majestueux qui guide les navires à travers les eaux dangereuses du lac, offrant une protection contre les tempêtes et les pirates.",
        "victoire": 5,
        "effet": {
          "type": "Passif",
          "defausse": false,
          "description": "Effet passif : ce phare reste en jeu à la fin du tour. En contrepartie, défaussez la carte au sommet de votre pioche à chaque fin de tour (elle est perdue sans produire).",
          "action": "Défaussez la carte au sommet de votre pioche"
        }
      }
    ]
  }
]