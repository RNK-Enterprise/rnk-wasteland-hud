/**
 * RNK Wasteland HUD - Click-to-Roll System
 * Click stats to roll dice automatically
 */

import { SystemIntegration } from "./system-integration.js";

export class ClickToRoll {
  static makeRollable(textElement, token, variable) {
    if (!textElement || !token.actor) return;
    
    textElement.interactive = true;
    textElement.buttonMode = true;
    textElement.cursor = 'pointer';
    
    textElement.on('click', (event) => {
      event.stopPropagation();
      this.handleRoll(token, variable);
    });
    
    textElement.on('pointerover', () => {
      textElement.alpha = 0.8;
      textElement.scale.set(1.05);
    });
    
    textElement.on('pointerout', () => {
      textElement.alpha = 1;
      textElement.scale.set(1);
    });
  }

  static async handleRoll(token, variable) {
    const actor = token.actor;
    if (!actor) return;
    
    const systemId = game.system.id;
    
    switch(variable) {
      case "@hp":
      case "@hp.value":
      case "@hp.max":
        // No roll for HP
        ui.notifications.info("HP cannot be rolled");
        break;
        
      case "@ac":
        if (systemId === "dnd5e" || systemId === "pf2e") {
          ui.notifications.info(`AC: ${actor.system.attributes.ac.value}`);
        }
        break;
        
      case "@initiative":
        if (game.combat) {
          await game.combat.rollInitiative([token.id]);
        } else {
          this.rollInitiative(actor);
        }
        break;
        
      case "@attack":
        this.rollAttack(actor);
        break;
        
      case "@damage":
        this.rollDamage(actor);
        break;
        
      case "@save":
        this.rollSave(actor);
        break;
        
      case "@skill":
        this.rollSkill(actor);
        break;
        
      case "@ability":
        this.rollAbility(actor);
        break;
        
      default:
        // Try to roll a generic check
        this.rollGeneric(actor, variable);
    }
  }

  static async rollInitiative(actor) {
    if (game.system.id === "dnd5e") {
      const roll = await actor.rollInitiative();
      ChatMessage.create({
        content: `<strong>${actor.name}</strong> rolls initiative!`,
        speaker: ChatMessage.getSpeaker({actor: actor})
      });
    } else {
      ui.notifications.warn("Initiative rolling not supported for this system");
    }
  }

  static async rollAttack(actor) {
    // Get equipped weapons
    const weapons = actor.items.filter(i => 
      i.type === "weapon" && i.system.equipped
    );
    
    if (weapons.length === 0) {
      ui.notifications.warn("No equipped weapons!");
      return;
    }
    
    if (weapons.length === 1) {
      weapons[0].roll();
    } else {
      // Show selection dialog
      const buttons = {};
      weapons.forEach(weapon => {
        buttons[weapon.id] = {
          label: weapon.name,
          callback: () => weapon.roll()
        };
      });
      
      new Dialog({
        title: "Select Weapon",
        content: "<p>Choose a weapon:</p>",
        buttons
      }).render(true);
    }
  }

  static async rollDamage(actor) {
    ui.notifications.info("Select a weapon to roll damage");
    this.rollAttack(actor);
  }

  static async rollSave(actor) {
    if (game.system.id === "dnd5e") {
      const saves = ["str", "dex", "con", "int", "wis", "cha"];
      const buttons = {};
      
      saves.forEach(save => {
        buttons[save] = {
          label: save.toUpperCase(),
          callback: () => actor.rollAbilitySave(save)
        };
      });
      
      new Dialog({
        title: "Saving Throw",
        content: "<p>Choose a save:</p>",
        buttons
      }).render(true);
    }
  }

  static async rollSkill(actor) {
    if (game.system.id === "dnd5e") {
      const skills = Object.keys(actor.system.skills);
      const buttons = {};
      
      skills.slice(0, 10).forEach(skill => {
        buttons[skill] = {
          label: skill.charAt(0).toUpperCase() + skill.slice(1),
          callback: () => actor.rollSkill(skill)
        };
      });
      
      new Dialog({
        title: "Skill Check",
        content: "<p>Choose a skill:</p>",
        buttons,
        default: "perception"
      }).render(true);
    }
  }

  static async rollAbility(actor) {
    if (game.system.id === "dnd5e") {
      const abilities = ["str", "dex", "con", "int", "wis", "cha"];
      const buttons = {};
      
      abilities.forEach(ability => {
        buttons[ability] = {
          label: ability.toUpperCase(),
          callback: () => actor.rollAbilityTest(ability)
        };
      });
      
      new Dialog({
        title: "Ability Check",
        content: "<p>Choose an ability:</p>",
        buttons
      }).render(true);
    }
  }

  static async rollGeneric(actor, variable) {
    // Try to parse and roll
    const formula = variable.replace("@", "");
    
    try {
      const roll = new Roll(formula);
      await roll.evaluate({async: true});
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({actor: actor}),
        flavor: `Rolling ${variable}`
      });
    } catch (e) {
      ui.notifications.warn(`Cannot roll ${variable}`);
    }
  }

  static enhanceDisplayText(textElement, token, content) {
    // Parse the content for rollable variables
    const rollablePatterns = [
      /@initiative/g,
      /@attack/g,
      /@damage/g,
      /@save/g,
      /@skill/g,
      /@ability/g
    ];
    
    let hasRollable = false;
    rollablePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasRollable = true;
      }
    });
    
    if (hasRollable) {
      this.makeRollable(textElement, token, content);
    }
  }
}

