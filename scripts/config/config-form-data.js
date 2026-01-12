/**
 * RNK™ Wasteland HUD - Config Form Data Handler
 * Handles form data preparation and context building
 * @module config/config-form-data
 */

import { DisplaySettings } from "../settings.js";
import { SystemIntegration } from "../system-integration.js";
import { VisualEffects } from "../visual-effects.js";

export class ConfigFormData {
  static async prepareContext(token) {
    const flags = DisplaySettings.getFlag(token.document, "config") || {};
    
    return {
      enabled: flags.enabled ?? true,
      content: flags.content || "@name\nHP: @hp",
      position: flags.position || "bottom",
      
      preset: flags.preset || DisplaySettings.get("defaultPreset"),
      fontSize: flags.fontSize || 14,
      textColor: flags.textColor || "#ffffff",
      backgroundColor: flags.backgroundColor || "#000000",
      borderColor: flags.borderColor || "#666666",
      borderWidth: flags.borderWidth || 2,
      borderRadius: flags.borderRadius || 5,
      opacity: flags.opacity || 0.8,
      width: flags.width || 200,
      
      visibility: flags.visibility || "always",
      showToPlayers: flags.showToPlayers !== false,
      playerContent: flags.playerContent || "",
      hideWhenHidden: flags.hideWhenHidden !== false,
      
      showProgressBars: flags.showProgressBars || false,
      progressBars: flags.progressBars || [],
      showConditions: flags.showConditions || false,
      maxConditions: flags.maxConditions || 5,
      
      clickToOpen: flags.clickToOpen !== false,
      allowDrag: flags.allowDrag !== false,
      showOnHover: flags.showOnHover || false,
      
      linkToTile: flags.linkToTile || false,
      linkedTileId: flags.linkedTileId || "",
      tileAutoUpdate: flags.tileAutoUpdate !== false,
      tileShowFullStats: flags.tileShowFullStats || false,
      
      shadow: flags.shadow || false,
      gradient: flags.gradient || false,
      
      presets: Object.keys(VisualEffects.PRESETS).map(key => ({
        value: key,
        name: VisualEffects.PRESETS[key].name || key
      })),
      
      availableVariables: this.getAvailableVariables(token),
      actorName: token.actor ? token.actor.name : "",
      tiles: this.getSceneTiles()
    };
  }

  static getAvailableVariables(token) {
    if (!token.actor) return [];
    
    const actorData = SystemIntegration.getActorData(token.actor);
    const variables = [
      { key: "@name", desc: "Character name" },
      { key: "@level", desc: "Character level" },
      { key: "@class", desc: "Character class" },
      { key: "@race", desc: "Character race/ancestry" },
      { key: "@background", desc: "Character background" }
    ];
    
    if (actorData.hp) {
      variables.push({ key: "@hp", desc: "Current/Max HP" });
      variables.push({ key: "@hp.value", desc: "Current HP" });
      variables.push({ key: "@hp.max", desc: "Maximum HP" });
      variables.push({ key: "@hp.percentage", desc: "HP percentage" });
      variables.push({ key: "@hp.temp", desc: "Temporary HP" });
    }
    
    if (actorData.ac) variables.push({ key: "@ac", desc: "Armor Class" });
    if (actorData.speed) variables.push({ key: "@speed", desc: "Movement Speed" });
    
    variables.push(
      { key: "@initiative", desc: "Initiative bonus" },
      { key: "@proficiency", desc: "Proficiency bonus" },
      { key: "@str", desc: "Strength modifier" },
      { key: "@dex", desc: "Dexterity modifier" },
      { key: "@con", desc: "Constitution modifier" },
      { key: "@int", desc: "Intelligence modifier" },
      { key: "@wis", desc: "Wisdom modifier" },
      { key: "@cha", desc: "Charisma modifier" },
      { key: "@passiveperception", desc: "Passive Perception" },
      { key: "@passiveinvestigation", desc: "Passive Investigation" },
      { key: "@passiveinsight", desc: "Passive Insight" },
      { key: "@spelldc", desc: "Spell save DC" },
      { key: "@spellattack", desc: "Spell attack bonus" },
      { key: "@spellslots", desc: "Available spell slots" },
      { key: "@ki", desc: "Ki/Focus points" },
      { key: "@inspiration", desc: "Inspiration status" },
      { key: "@conditions", desc: "Active conditions" },
      { key: "@concentration", desc: "Active concentration spell" },
      { key: "@exhaustion", desc: "Exhaustion level" }
    );
    
    return variables;
  }

  static getSceneTiles() {
    if (!canvas.scene) return [];
    
    return canvas.scene.tiles.contents.map(tile => {
      const doc = tile.document || tile;
      const linkedActorId = DisplaySettings.getFlag(doc, 'linkedActorId');
      const isDisplayDisplayTile = DisplaySettings.getFlag(doc, 'isDisplayDisplayTile');
      
      return {
        id: tile.id,
        name: `Tile ${tile.id.slice(-4)} (${linkedActorId ? 'Linked' : 'Available'})`,
        linked: !!isDisplayDisplayTile
      };
    });
  }

  static extractFormData(element) {
    const form = element?.querySelector('form') || element;
    if (!form) {
      console.error('[RNK™ Wasteland HUD] Could not find form element');
      return {};
    }
    
    if (form.tagName === 'FORM') {
      const formData = new FormData(form);
      return Object.fromEntries(formData);
    }
    
    const data = {};
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.name) return;
      
      if (input.type === 'checkbox') {
        data[input.name] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) data[input.name] = input.value;
      } else {
        data[input.name] = input.value;
      }
    });
    return data;
  }

  static processFormData(formData) {
    const progressBars = [];
    Object.keys(formData).forEach(key => {
      if (key.startsWith("progressBars.")) {
        const match = key.match(/progressBars\.(\d+)\.(.+)/);
        if (match) {
          const index = parseInt(match[1]);
          const prop = match[2];
          if (!progressBars[index]) progressBars[index] = {};
          progressBars[index][prop] = formData[key];
          delete formData[key];
        }
      }
    });
    
    formData.progressBars = progressBars.filter(b => b);
    
    const booleanFields = [
      'enabled', 'linkToTile', 'tileAutoUpdate', 'tileShowFullStats',
      'showProgressBars', 'showConditions', 'showIcons', 'showToPlayers',
      'hideWhenHidden', 'shadow', 'gradient', 'clickToOpen', 'allowDrag', 'showOnHover'
    ];
    
    booleanFields.forEach(field => {
      if (formData[field] !== undefined) {
        formData[field] = formData[field] === 'on' || formData[field] === true || formData[field] === 'true';
      }
    });
    
    return formData;
  }
}
