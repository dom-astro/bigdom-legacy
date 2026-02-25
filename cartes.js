const BEGIN_CARDS = 
[
  {
    "numero": 1,
    "faces": [
      {
        "face": 1,
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
      {
        "face": 2,
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
          "description": "Au lieu de produire 1 pièce d'or avec cette carte, vous pouvez la défausser avec une autre carte alliée pour en gagne",
          "ressources": [
            {
              "type": "Or",
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
      {
        "face": 3,
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
      {
        "face": 4,
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
          "description": "Cette carte n’est pas défaussée à la fin du tour. Elle est cependant défaussée lorsque vous produisez une carte avec elle ou utilisez un effet ou une action activée sur elle. À la fin d’un tour, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  {
    "numero": 2,
    "faces": [
      {
        "face": 1,
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
      {
        "face": 2,
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
          "description": "Au lieu de produire 1 pièce d'or avec cette carte, vous pouvez la défausser avec une autre carte alliée pour en gagne",
          "ressources": [
            {
              "type": "Or",
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
      {
        "face": 3,
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
      {
        "face": 4,
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
          "description": "Cette carte n’est pas défaussée à la fin du tour. Elle est cependant défaussée lorsque vous produisez une carte avec elle ou utilisez un effet ou une action activée sur elle. À la fin d’un tour, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  {
    "numero": 3,
    "faces": [
      {
        "face": 1,
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
      {
        "face": 2,
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
          "description": "Au lieu de produire 1 pièce d'or avec cette carte, vous pouvez la défausser avec une autre carte alliée pour en gagne",
          "ressources": [
            {
              "type": "Or",
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
      {
        "face": 3,
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
      {
        "face": 4,
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
          "description": "Cette carte n’est pas défaussée à la fin du tour. Elle est cependant défaussée lorsque vous produisez une carte avec elle ou utilisez un effet ou une action activée sur elle. À la fin d’un tour, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  {
    "numero": 4,
    "faces": [
      {
        "face": 1,
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
      {
        "face": 2,
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
          "description": "Au lieu de produire 1 pièce d'or avec cette carte, vous pouvez la défausser avec une autre carte alliée pour en gagne",
          "ressources": [
            {
              "type": "Or",
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
      {
        "face": 3,
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
      {
        "face": 4,
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
          "description": "Cette carte n’est pas défaussée à la fin du tour. Elle est cependant défaussée lorsque vous produisez une carte avec elle ou utilisez un effet ou une action activée sur elle. À la fin d’un tour, toutes les cartes sont défaussées, y compris celle-ci."
        }
      }
    ]
  },
  {
    "numero": 5,
    "faces": [
      {
        "face": 1,
        "nom": "Montagnes Lointaines",
        "type": "Terrain",
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
        },
        "description": "Des cimes enneigées scintillent à l'horizon. Peu de ressources s'en dégagent, mais les miners y voient un trésor caché."
      },
      {
        "face": 2,
        "nom": "Zone Rocheuse",
        "type": "Terrain",
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
      {
        "face": 3,
        "nom": "Carrière",
        "type": "Terrain",
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
      {
        "face": 4,
        "nom": "Mine Peu Profonde",
        "type": "Bâtiment",
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
  {
    "numero": 6,
    "faces": [
      {
        "face": 1,
        "nom": "Montagnes Lointaines",
        "type": "Terrain",
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
        },
        "description": "Des cimes enneigées scintillent à l'horizon. Peu de ressources s'en dégagent, mais les miners y voient un trésor caché."
      },
      {
        "face": 2,
        "nom": "Zone Rocheuse",
        "type": "Terrain",
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
      {
        "face": 3,
        "nom": "Carrière",
        "type": "Terrain",
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
      {
        "face": 4,
        "nom": "Mine Peu Profonde",
        "type": "Bâtiment",
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
  {
    "numero": 7,
    "faces": [
      {
        "face": 1,
        "nom": "Forêt",
        "type": "Terrain",
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
        },
        "description": "Une forêt dense aux arbres centenaires. Le bois y est abondant, mais on peut aussi l'abattre d'un coup pour en tirer tout le bois rapidement."
      },
      {
        "face": 2,
        "nom": "Coupe Rase",
        "type": "Terrain",
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
      {
        "face": 3,
        "nom": "Cabane de Bûcheron",
        "type": "Bâtiment",
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
      {
        "face": 4,
        "nom": "Puit Sacré",
        "type": "Bâtiment",
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
          "cartes": [
            82,
            83
          ]
        }
      }
    ]
  },
  {
    "numero": 8,
    "faces": [
      {
        "face": 1,
        "nom": "Forêt",
        "type": "Terrain",
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
        },
        "description": "Une forêt dense aux arbres centenaires. Le bois y est abondant, mais on peut aussi l'abattre d'un coup pour en tirer tout le bois rapidement."
      },
      {
        "face": 2,
        "nom": "Coupe Rase",
        "type": "Terrain",
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
      {
        "face": 3,
        "nom": "Cabane de Bûcheron",
        "type": "Bâtiment",
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
      {
        "face": 4,
        "nom": "Puit Sacré",
        "type": "Bâtiment",
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
          "cartes": [
            82,
            83
          ]
        }
      }
    ]
  },
  {
    "numero": 9,
    "faces": [
      {
        "face": 1,
        "nom": "Quartier Général",
        "type": "Bâtiment",
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
        },
        "description": "Un bâtiment administratif sobre mais fonctionnel, premier pilier de l'autorité royale. Il génère l'or nécessaire à l'expansion du royaume."
      },
      {
        "face": 2,
        "nom": "Hôtel de Ville",
        "type": "Bâtiment",
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
      {
        "face": 3,
        "nom": "Donjon",
        "type": "Bâtiment",
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
      {
        "face": 4,
        "nom": "Château",
        "type": "Bâtiment",
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
  {
    "numero": 10,
    "faces": [
      {
        "face": 1,
        "nom": "Commerçante",
        "type": "Personne",
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
        ],
        "description": "Une femme d'affaires avisée qui sait tirer profit de chaque échange. Moyennant une pièce d'or, elle vous procure du bois ou d'autres matériaux rares."
      },
      {
        "face": 2,
        "nom": "Bazar",
        "type": "Bâtiment",
        "victoire": 1,
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
              "type": [
                "Or",
                "Bois"
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
      {
        "face": 3,
        "nom": "Marché",
        "type": "Bâtiment",
        "victoire": 3,
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
      {
        "face": 4,
        "nom": "Festival",
        "type": "Evènement",
        "victoire": 4,
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
  {
    "numero": 11,
    "faces": [
      {
        "face": 1,
        "nom": "Jungle",
        "type": "Terrain",
        "effet": {
          "type": "Activable",
          "cout": [
            {
              "type": "Or",
              "quantite": 2
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
        },
        "description": "Une jungle touffue et mystérieuse où la végétation règne en maître. Difficile d'accès, elle peut néanmoins livrer son bois aux plus déterminés."
      },
      {
        "face": 2,
        "nom": "Arbres Géants",
        "type": "Terrain",
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
          "cout": [
            {
              "type": "Or",
              "quantite": 2
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
      {
        "face": 3,
        "nom": "Jungle Profonde",
        "type": "Terrain",
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
      {
        "face": 4,
        "nom": "Cabane dans les Arbres",
        "type": "Bâtiment",
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
          "description": "Reste en jeu"
        }
      }
    ]
  },
  {
    "numero": 12,
    "faces": [
      {
        "face": 1,
        "nom": "Rivière",
        "type": "Terrain",
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
        },
        "description": "Une rivière sinueuse traverse vos terres, apportant commerce et richesse à ceux qui savent en tirer parti."
      },
      {
        "face": 2,
        "nom": "Pont",
        "type": "Terrain",
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
      {
        "face": 3,
        "nom": "Pont de Pierre",
        "type": "Terrain",
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
      {
        "face": 4,
        "nom": "Explorateurs",
        "type": "Personne",
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
          "description": "Nouveau territoire",
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
  {
    "numero": 13,
    "faces": [
      {
        "face": 1,
        "nom": "Exploitant",
        "type": "Personne",
        "effet": {
          "type": "Activable",
          "description": "Exploiter une carte Terrain en jeu pour obtenir des ressources",
          "ressources": [
            {
              "type": [
                "Terrain"
              ],
              "quantite": 1
            }
          ]
        },
        "description": "Un homme de peine habile et polyvalent. Selon le chemin qu'il emprunte, il deviendra un exploitant de terrain ou un domestique du palais."
      },
      {
        "face": 2,
        "nom": "Domestique",
        "type": "Personne",
        "effet": {
          "type": "Activable",
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
  {
    "numero": 14,
    "faces": [
      {
        "face": 1,
        "nom": "Bandit",
        "type": "Ennemi",
        "victoire": -2,
        "effet": [
          {
            "type": "Obligatoire",
            "blocage": {
              "type": "Carte",
              "production": "Or"
            }
          },
          {
            "type": "Activable",
            "description": "Vaincre",
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
        ],
        "description": "Un brigand armé qui rôde autour de vos terres et bloque la production d'or d'une carte amie. Une épée suffit à s'en débarrasser et à récupérer des ressources."
      },
      {
        "face": 2,
        "nom": "Travailleur",
        "type": "Personne",
        "effet": {
          "type": "Activable",
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
  {
    "numero": 15,
    "faces": [
      {
        "face": 1,
        "nom": "Montagnes Lointaines",
        "type": "Terrain",
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
        },
        "description": "Des cimes enneigées scintillent à l'horizon. Peu de ressources s'en dégagent, mais les miners y voient un trésor caché."
      },
      {
        "face": 2,
        "nom": "Zone Rocheuse",
        "type": "Terrain",
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
      {
        "face": 3,
        "nom": "Carrière",
        "type": "Terrain",
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
      {
        "face": 4,
        "nom": "Mine Peu Profonde",
        "type": "Bâtiment",
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
  {
    "numero": 16,
    "faces": [
      {
        "face": 1,
        "nom": "Bandit",
        "type": "Ennemi",
        "victoire": -2,
        "effet": [
          {
            "type": "Obligatoire",
            "blocage": {
              "type": "Carte",
              "production": "Or"
            }
          },
          {
            "type": "Activable",
            "description": "Vaincre",
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
        ],
        "description": "Un brigand armé qui rôde autour de vos terres et bloque la production d'or d'une carte amie. Une épée suffit à s'en débarrasser et à récupérer des ressources."
      },
      {
        "face": 2,
        "nom": "Exploitant",
        "type": "Personne",
        "effet": {
          "type": "Activable",
          "description": "Exploiter une carte Terrain en jeu pour obtenir des ressources",
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
  {
    "numero": 17,
    "faces": [
      {
        "face": 1,
        "nom": "Colinne",
        "type": "Terrain",
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
        },
        "description": "Une colline verdoyante offrant une vue dégagée sur le royaume. Modeste en or, elle peut être transformée en lieu de culte pour inspirer la foi du peuple."
      },
      {
        "face": 2,
        "nom": "Chapelle",
        "type": "Bâtiment",
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
      {
        "face": 3,
        "nom": "Eglise",
        "type": "Bâtiment",
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
      {
        "face": 4,
        "nom": "Cathédrale",
        "type": "Bâtiment",
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
          "description": "Gagne 1 Or supplémentaire pour chaque carte Personne en jeu",
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
  {
    "numero": 18,
    "faces": [
      {
        "face": 1,
        "nom": "Falaises de l'Est",
        "type": "Terrain",
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
        ],
        "description": "Des falaises abruptes battues par les vents de l'est. Riches en pierre, elles peuvent devenir une forge ou une muraille selon la vision du seigneur."
      },
      {
        "face": 2,
        "nom": "Forge",
        "type": "Bâtiment",
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
          "description": "Rénitialiser pour découvrir des Bijoux",
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
      {
        "face": 3,
        "nom": "Armurerie",
        "type": "Terrain",
        "victoire": 4,
        "effet": {
          "type": "Passif",
          "description": "Gagner une épée pour chaque personne en jeu",
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
      {
        "face": 4,
        "nom": "Muraille",
        "type": "Bâtiment",
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
          "description": "Reste en jeu"
        }
      }
    ]
  },
  {
    "numero": 19,
    "faces": [
      {
        "face": 1,
        "nom": "Forêt",
        "type": "Terrain",
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
        },
        "description": "Une forêt dense aux arbres centenaires. Le bois y est abondant, mais on peut aussi l'abattre d'un coup pour en tirer tout le bois rapidement."
      },
      {
        "face": 2,
        "nom": "Coupe Rase",
        "type": "Terrain",
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
      {
        "face": 3,
        "nom": "Cabane de Bûcheron",
        "type": "Bâtiment",
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
      {
        "face": 4,
        "nom": "Puit Sacré",
        "type": "Bâtiment",
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
          "cartes": [
            82,
            83
          ]
        }
      }
    ]
  },
  {
    "numero": 20,
    "faces": [
      {
        "face": 1,
        "nom": "Marais",
        "type": "Terrain",
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
        ],
        "description": "Un marais boueux et peu hospitalier, dépourvu de ressources. Un investissement patient permettra d'en faire un jardin prospère."
      },
      {
        "face": 2,
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
      {
        "face": 3,
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
      {
        "face": 4,
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
  {
    "numero": 21,
    "faces": [
      {
        "face": 1,
        "nom": "Marais",
        "type": "Terrain",
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
        ],
        "description": "Un marais boueux et peu hospitalier, dépourvu de ressources. Un investissement patient permettra d'en faire un jardin prospère."
      },
      {
        "face": 2,
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
      {
        "face": 3,
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
      {
        "face": 4,
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
  {
    "numero": 22,
    "faces": [
      {
        "face": 1,
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
        ],
        "description": "Un lac paisible au cœur du territoire. Ses eaux reflètent le ciel et recèlent un or modeste, en attendant qu'un pêcheur vienne s'y établir."
      },
      {
        "face": 2,
        "nom": "MChalet du Pêcheur",
        "type": "Bâtiment",
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
      {
        "face": 3,
        "nom": "Bateau de Pêche",
        "type": "Maritime",
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
          "carte": [
            75
          ]
        }
      },
      {
        "face": 4,
        "nom": "Phare",
        "type": "Bâtiment",
        "victoire": 5,
        "effet": {
          "type": "Passif",
          "description": "Reste en jeu",
          "action": "Défaussez la carte au sommet de votre pioche"
        }
      }
    ]
  }
]
