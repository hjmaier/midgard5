// Ported from the V0.07 data defaults. System fields and type IDs stay stable.
const actorFragments = {
  "characterDescription": {
    "description": " "
  },
  "characterBars": {
    "lp": {
      "value": 15,
      "min": 0,
      "max": 15
    },
    "ap": {
      "value": 20,
      "min": 0,
      "max": 20
    }
  },
  "characterHeader": {
    "es": 0,
    "ep": 0,
    "gg": 0,
    "sg": 0,
    "gp": 2
  },
  "attributes": {
    "st": {
      "value": 50,
      "bonus": 0
    },
    "ge": {
      "value": 50,
      "bonus": 0
    },
    "gw": {
      "value": 50,
      "bonus": 0
    },
    "ko": {
      "value": 50,
      "bonus": 0
    },
    "in": {
      "value": 50,
      "bonus": 0
    },
    "zt": {
      "value": 50,
      "bonus": 0
    },
    "au": {
      "value": 50,
      "bonus": 0
    },
    "pa": {
      "value": 50,
      "bonus": 0
    },
    "wk": {
      "value": 50,
      "bonus": 0
    },
    "gs": {
      "value": 50,
      "bonus": 0
    }
  }
};
const actorTypes = {
  "npc": [
    "characterBars",
    "attributes",
    "characterDescription"
  ],
  "character": [
    "characterBars",
    "attributes",
    "characterDescription",
    "characterHeader"
  ],
  "npcnotlinked": [
    "characterBars",
    "attributes",
    "characterDescription"
  ],
  "vehicle": [
    "characterBars",
    "attributes",
    "characterDescription"
  ]
};
const itemFragments = {
  "itemDescription": {
    "description": " "
  },
  "skillHeader": {
    "fw": 0,
    "bonus": 0,
    "leitE": "",
    "pp": 0,
    "lernListe": "",
    "kampfBlatt": false
  },
  "itemMod": {
    "mod": {
      "angB": 0,
      "schB": 0,
      "abwB": 0,
      "hRang": 0,
      "lpSchutz": 0,
      "apSchutz": 0,
      "resG": 0,
      "resK": 0,
      "lpMod": 0,
      "apMod": 0,
      "stMod": 0,
      "gwMod": 0,
      "gsMod": 0,
      "koMod": 0,
      "inMod": 0,
      "ztMod": 0,
      "auMod": 0,
      "paMod": 0,
      "wkMod": 0,
      "gitMod": 0,
      "bMod": 0,
      "gpMod": 0,
      "kawMod": 0,
      "glMod": 0,
      "fertigkeit": {}
    }
  },
  "itemBase": {
    "magic": false,
    "active": false,
    "container": " ",
    "quantity": 1,
    "value": 0,
    "abw": 0,
    "weight": 0
  },
  "itemWeapon": {
    "spezial": false,
    "schaden": 0,
    "fertigkeit": ""
  },
  "itemWeaponRn": {
    "munition": 0,
    "reichweite": 0
  }
};
const itemTypes = {
  "item": [
    "itemDescription",
    "itemMod",
    "itemBase"
  ],
  "skill": [
    "itemDescription",
    "skillHeader"
  ],
  "weaponcl": [
    "itemDescription",
    "itemMod",
    "itemBase",
    "itemWeapon"
  ],
  "weaponrn": [
    "itemDescription",
    "itemMod",
    "itemBase",
    "itemWeapon",
    "itemWeaponRn"
  ],
  "weapondf": [
    "itemDescription",
    "itemMod",
    "itemBase",
    "itemWeapon"
  ],
  "armor": [
    "itemDescription",
    "itemMod",
    "itemBase"
  ],
  "spell": [
    "itemDescription",
    "skillHeader"
  ],
  "language": [
    "itemDescription",
    "skillHeader"
  ],
  "untrained": [
    "itemDescription",
    "skillHeader"
  ],
  "sense": [
    "itemDescription",
    "skillHeader"
  ],
  "race": [
    "itemDescription",
    "itemMod"
  ],
  "type": [
    "itemDescription",
    "itemMod"
  ]
};

function expand(fragments, types) {
  return Object.fromEntries(Object.entries(types).map(([type, names]) => [
    type, Object.assign({}, ...names.map(name => fragments[name]))
  ]));
}

export const defaults = { Actor: expand(actorFragments, actorTypes), Item: expand(itemFragments, itemTypes) };
