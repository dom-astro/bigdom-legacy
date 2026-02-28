const CARDS_TO_DISCOVER = 
[
  { "numero": 82,
    "faces": [
      { "face": 1,
        "nom": "Autel",
        "type": "Terrain",
        "description": "Un autel sacré, souvent utilisé pour les cérémonies rituelles.",
        "victoire": 3,
        "effet": [
          {
            "type": "Evènement",
            "description": "Défausser pour que une autre carte reste en jeu"
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
            "type": "Evènement",
            "description": "Défausser pour que deux autres carte reste en jeu"
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
            "type": "Evènement",
            "description": "Défausser pour que trois autres carte reste en jeu"
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
            "type": "Evènement",
            "description": "Défausser pour que trois autres carte reste en jeu"
          }
        ],
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
            "type": "Evènement",
            "description": "Défausser pour que une autre carte reste en jeu"
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
            "type": "Evènement",
            "description": "Défausser pour que deux autres carte reste en jeu"
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
            "type": "Evènement",
            "description": "Défausser pour que trois autres carte reste en jeu"
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
            "type": "Evènement",
            "description": "Défausser pour que trois autres carte reste en jeu"
          }
        ],
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
  }
]