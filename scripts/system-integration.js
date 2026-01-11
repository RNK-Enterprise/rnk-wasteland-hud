/**
 * RNK Wasteland HUD - System Integration
 * Support for different game systems
 */

export class SystemIntegration {
  static getSystemId() {
    return game.system.id;
  }

  static getActorData(actor) {
    if (!actor) return {};

    const systemId = this.getSystemId();
    
    switch(systemId) {
      case "dnd5e":
        return this.getDnd5eData(actor);
      case "pf2e":
        return this.getPf2eData(actor);
      case "swade":
        return this.getSwadeData(actor);
      case "wfrp4e":
        return this.getWfrp4eData(actor);
      case "cof":
        return this.getCofData(actor);
      default:
        return this.getGenericData(actor);
    }
  }

  static getDnd5eData(actor) {
    const data = {};
    const system = actor.system;

    data.name = actor.name;
    data.level = system.details?.level || 0;
    data.class = system.details?.class || "";
    data.race = system.details?.race || "";
    
    // HP
    if (system.attributes?.hp) {
      data.hp = {
        value: system.attributes.hp.value,
        max: system.attributes.hp.max,
        temp: system.attributes.hp.temp || 0,
        percentage: Math.round((system.attributes.hp.value / system.attributes.hp.max) * 100)
      };
    }

    // AC
    if (system.attributes?.ac) {
      data.ac = system.attributes.ac.value;
    }

    // Speed
    if (system.attributes?.movement) {
      data.speed = system.attributes.movement.walk || 30;
    }

    // Initiative
    if (system.attributes?.init) {
      data.initiative = system.attributes.init.total || system.attributes.init.mod;
    }

    // Spell Slots
    if (system.spells) {
      data.spellSlots = {};
      for (let i = 1; i <= 9; i++) {
        const slot = system.spells[`spell${i}`];
        if (slot && slot.max > 0) {
          data.spellSlots[i] = {
            value: slot.value,
            max: slot.max,
            percentage: Math.round((slot.value / slot.max) * 100)
          };
        }
      }
    }

    // Resources
    if (system.resources) {
      data.resources = {};
      ['primary', 'secondary', 'tertiary'].forEach(res => {
        if (system.resources[res]?.max > 0) {
          data.resources[res] = {
            label: system.resources[res].label || res,
            value: system.resources[res].value,
            max: system.resources[res].max,
            percentage: Math.round((system.resources[res].value / system.resources[res].max) * 100)
          };
        }
      });
    }

    return data;
  }

  static getPf2eData(actor) {
    const data = {};
    const system = actor.system;

    data.name = actor.name;
    data.level = system.details?.level?.value || 0;
    data.class = system.details?.class?.name || "";
    data.ancestry = system.details?.ancestry?.name || "";

    // HP
    if (system.attributes?.hp) {
      data.hp = {
        value: system.attributes.hp.value,
        max: system.attributes.hp.max,
        temp: system.attributes.hp.temp || 0,
        percentage: Math.round((system.attributes.hp.value / system.attributes.hp.max) * 100)
      };
    }

    // AC
    if (system.attributes?.ac) {
      data.ac = system.attributes.ac.value;
    }

    // Speed
    if (system.attributes?.speed) {
      data.speed = system.attributes.speed.value || 25;
    }

    // Hero Points (PF2e specific)
    if (system.resources?.heroPoints) {
      data.heroPoints = {
        value: system.resources.heroPoints.value,
        max: system.resources.heroPoints.max || 3
      };
    }

    return data;
  }

  static getSwadeData(actor) {
    const data = {};
    const system = actor.system;

    data.name = actor.name;
    
    // Wounds
    if (system.wounds) {
      data.wounds = {
        value: system.wounds.value,
        max: system.wounds.max
      };
    }

    // Fatigue
    if (system.fatigue) {
      data.fatigue = {
        value: system.fatigue.value,
        max: system.fatigue.max
      };
    }

    // Bennies
    if (system.bennies) {
      data.bennies = system.bennies.value;
    }

    // Parry & Toughness
    data.parry = system.stats?.parry?.value || 0;
    data.toughness = system.stats?.toughness?.value || 0;

    return data;
  }

  static getWfrp4eData(actor) {
    const data = {};
    const system = actor.system;

    data.name = actor.name;
    
    // Wounds
    if (system.status?.wounds) {
      data.hp = {
        value: system.status.wounds.value,
        max: system.status.wounds.max,
        percentage: Math.round((system.status.wounds.value / system.status.wounds.max) * 100)
      };
    }

    // Fortune & Fate
    if (system.status?.fortune) {
      data.fortune = system.status.fortune.value;
    }
    if (system.status?.fate) {
      data.fate = system.status.fate.value;
    }

    return data;
  }

  static getCofData(actor) {
    const data = {};
    const system = actor.system;

    data.name = actor.name;
    data.level = system.level?.value || 0;
    
    // HP
    if (system.attributes?.hp) {
      data.hp = {
        value: system.attributes.hp.value,
        max: system.attributes.hp.max,
        percentage: Math.round((system.attributes.hp.value / system.attributes.hp.max) * 100)
      };
    }

    // Defense
    if (system.attributes?.def) {
      data.def = system.attributes.def.value;
    }

    return data;
  }

  static getGenericData(actor) {
    const data = {};
    const system = actor.system;

    data.name = actor.name;

    // Try to find HP-like attributes
    if (system.attributes) {
      for (const [key, attr] of Object.entries(system.attributes)) {
        if (attr && typeof attr === 'object' && 'value' in attr && 'max' in attr) {
          data[key] = {
            value: attr.value,
            max: attr.max,
            percentage: attr.max > 0 ? Math.round((attr.value / attr.max) * 100) : 0
          };
        }
      }
    }

    // Try to find level
    if (system.details?.level) {
      data.level = system.details.level.value || system.details.level;
    } else if (system.level) {
      data.level = system.level.value || system.level;
    }

    return data;
  }

  static getConditions(actor) {
    const conditions = [];
    
    // Get conditions/effects from actor
    if (actor.effects) {
      actor.effects.forEach(effect => {
        if (!effect.disabled && !effect.isSuppressed) {
          conditions.push({
            id: effect.id,
            name: effect.name || effect.label,
            icon: effect.icon,
            duration: this.getEffectDuration(effect)
          });
        }
      });
    }

    return conditions;
  }

  static getEffectDuration(effect) {
    if (!effect.duration || !effect.duration.seconds) return null;
    
    const remaining = effect.duration.remaining;
    if (!remaining) return null;

    const rounds = effect.duration.rounds;
    const seconds = effect.duration.seconds;

    if (rounds) return `${rounds}r`;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }

  static parseContentVariables(content, actor, tokenDocument) {
    if (!content || !actor) return content;

    const actorData = this.getActorData(actor);
    let parsed = content;

    // Replace basic variables
    parsed = parsed.replace(/@name/g, actorData.name || "");
    parsed = parsed.replace(/@level/g, actorData.level || "");
    parsed = parsed.replace(/@class/g, actorData.class || "");
    parsed = parsed.replace(/@race/g, actorData.race || actorData.ancestry || "");
    parsed = parsed.replace(/@background/g, actor.system?.details?.background || "");

    // HP variants
    if (actorData.hp) {
      parsed = parsed.replace(/@hp\.value/g, actorData.hp.value);
      parsed = parsed.replace(/@hp\.max/g, actorData.hp.max);
      parsed = parsed.replace(/@hp\.temp/g, actor.system?.attributes?.hp?.temp || 0);
      parsed = parsed.replace(/@hp\.percentage/g, actorData.hp.percentage);
      parsed = parsed.replace(/@hp/g, `${actorData.hp.value}/${actorData.hp.max}`);
    }

    // AC
    if (actorData.ac) {
      parsed = parsed.replace(/@ac/g, actorData.ac);
    }

    // Speed
    if (actorData.speed) {
      parsed = parsed.replace(/@speed/g, actorData.speed);
    }

    // Initiative
    if (actorData.initiative !== undefined) {
      parsed = parsed.replace(/@initiative/g, actorData.initiative);
    }

    // Ability scores and modifiers
    const abilities = actor.system?.abilities || {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
      if (abilities[ability]) {
        parsed = parsed.replace(new RegExp(`@${ability}`, 'g'), abilities[ability].value || 0);
        parsed = parsed.replace(new RegExp(`@${ability}\\.mod`, 'g'), abilities[ability].mod || 0);
      }
    });

    // Saving throws
    const saves = actor.system?.abilities || {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
      if (saves[ability]?.save !== undefined) {
        parsed = parsed.replace(new RegExp(`@save\\.${ability}`, 'g'), saves[ability].save || 0);
      }
    });

    // Proficiency bonus
    parsed = parsed.replace(/@prof/g, actor.system?.attributes?.prof || 0);

    // Passive skills
    parsed = parsed.replace(/@passiveperception/g, actor.system?.skills?.prc?.passive || 10);
    parsed = parsed.replace(/@passiveinvestigation/g, actor.system?.skills?.inv?.passive || 10);
    parsed = parsed.replace(/@passiveinsight/g, actor.system?.skills?.ins?.passive || 10);

    // Inspiration
    parsed = parsed.replace(/@inspiration/g, actor.system?.attributes?.inspiration ? "Yes" : "No");

    // Conditions
    const conditions = this.getConditions(actor);
    parsed = parsed.replace(/@conditions/g, conditions.map(c => c.label).join(", ") || "None");
    
    // Exhaustion
    const exhaustion = actor.system?.attributes?.exhaustion || 0;
    parsed = parsed.replace(/@exhaustion/g, exhaustion);

    // Spell slots (for spellcasters)
    if (actor.system?.spells) {
      for (let i = 1; i <= 9; i++) {
        const slot = actor.system.spells[`spell${i}`];
        if (slot) {
          parsed = parsed.replace(new RegExp(`@spell${i}\\.value`, 'g'), slot.value || 0);
          parsed = parsed.replace(new RegExp(`@spell${i}\\.max`, 'g'), slot.max || 0);
          parsed = parsed.replace(new RegExp(`@spell${i}`, 'g'), `${slot.value || 0}/${slot.max || 0}`);
        }
      }
    }

    // Resources (primary/secondary)
    if (actor.system?.resources) {
      const primary = actor.system.resources.primary;
      const secondary = actor.system.resources.secondary;
      
      if (primary) {
        parsed = parsed.replace(/@resource1\.label/g, primary.label || "");
        parsed = parsed.replace(/@resource1\.value/g, primary.value || 0);
        parsed = parsed.replace(/@resource1\.max/g, primary.max || 0);
        parsed = parsed.replace(/@resource1/g, `${primary.value || 0}/${primary.max || 0}`);
      }
      
      if (secondary) {
        parsed = parsed.replace(/@resource2\.label/g, secondary.label || "");
        parsed = parsed.replace(/@resource2\.value/g, secondary.value || 0);
        parsed = parsed.replace(/@resource2\.max/g, secondary.max || 0);
        parsed = parsed.replace(/@resource2/g, `${secondary.value || 0}/${secondary.max || 0}`);
      }
    }

    // Disposition (friendly/hostile/neutral)
    if (tokenDocument) {
      const disposition = ["Hostile", "Neutral", "Friendly"][tokenDocument.disposition + 1] || "Neutral";
      parsed = parsed.replace(/@disposition/g, disposition);
    }

    return parsed;
  }

  static getIconForStat(stat) {
    const iconMap = {
      hp: "fa-heart",
      ac: "fa-shield-alt",
      speed: "fa-running",
      initiative: "fa-bolt",
      level: "fa-star",
      class: "fa-user-tag",
      race: "fa-users",
      spells: "fa-magic",
      resources: "fa-battery-three-quarters"
    };

    return iconMap[stat.toLowerCase()] || "fa-circle";
  }
}

