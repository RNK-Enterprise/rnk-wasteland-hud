/**
 * RNK™ Wasteland HUD - Token Display Rendering
 * Handles drawing and visual display of Displays
 * @author RNK™
 * @version 2.0.1
 */

import { DisplaySettings } from "../settings.js";
import { SystemIntegration } from "../system-integration.js";
import { VisualEffects } from "../visual-effects.js";
import { ParticleSystem, MagicCircle } from "../particle-system.js";
import { CombatStatsManager } from "../combat-stats.js";
import { ClickToRoll } from "../click-to-roll.js";

export class TokenDisplayRenderer {
  static draw(DisplayInstance) {
    DisplayInstance.removeChildren();
    DisplayInstance.config = null;
    
    const config = DisplayInstance.getConfig();
    
    if (!this.shouldDisplay(DisplayInstance, config)) {
      DisplayInstance.visible = false;
      return;
    }
    
    DisplayInstance.visible = true;
    
    const preset = VisualEffects.PRESETS[config.preset] || VisualEffects.PRESETS.classic;
    const content = this.getDisplayContent(DisplayInstance, config);
    
    const style = VisualEffects.createTextStyle(preset, config.fontSize || 14);
    style.wordWrapWidth = config.width || 200;
    
    DisplayInstance.textElement = new PIXI.Text(content, style);
    DisplayInstance.textElement.x = 8;
    DisplayInstance.textElement.y = 8;
    
    const padding = 8;
    let totalWidth = DisplayInstance.textElement.width + (padding * 2);
    let totalHeight = DisplayInstance.textElement.height + (padding * 2);
    
    if (config.showProgressBars && config.progressBars && config.progressBars.length > 0) {
      const barY = DisplayInstance.textElement.height + padding + 5;
      config.progressBars.forEach((barConfig, index) => {
        const bar = this.createProgressBar(DisplayInstance, barConfig, totalWidth - (padding * 2));
        if (bar) {
          bar.y = barY + (index * (barConfig.height + 3));
          DisplayInstance.progressBars.push(bar);
          totalHeight = Math.max(totalHeight, bar.y + bar.height + padding);
        }
      });
    }
    
    if (config.showConditions && DisplayInstance.token.actor) {
      totalHeight = this.addConditionIcons(DisplayInstance, totalHeight, totalWidth, padding);
    }
    
    DisplayInstance.background = VisualEffects.createBackground(
      totalWidth,
      totalHeight,
      preset,
      config.opacity || 0.8
    );
    
    DisplayInstance.addChild(DisplayInstance.background);
    DisplayInstance.addChild(DisplayInstance.textElement);
    DisplayInstance.progressBars.forEach(bar => DisplayInstance.addChild(bar));
    DisplayInstance.conditionIcons.forEach(icon => DisplayInstance.addChild(icon));
    
    this.positionDisplay(DisplayInstance, config);
    
    if (config.visibility === "hover") {
      DisplayInstance.visible = false;
    } else if (DisplaySettings.get("enableAnimations")) {
      VisualEffects.animateFadeIn(DisplayInstance);
    }
    
    if (DisplaySettings.get("combatHighlight") && this.isActiveCombatant(DisplayInstance)) {
      VisualEffects.animatePulse(DisplayInstance);
    }
    
    if (DisplaySettings.get("distanceFade") > 0) {
      VisualEffects.applyDistanceFade(DisplayInstance, DisplayInstance.token);
    }
    
    this.initializeAdvancedFeatures(DisplayInstance, config);
  }

  static addConditionIcons(DisplayInstance, totalHeight, totalWidth, padding) {
    const conditions = SystemIntegration.getConditions(DisplayInstance.token.actor);
    if (conditions.length === 0) return totalHeight;
    
    const config = DisplayInstance.getConfig();
    const maxConditions = config.maxConditions || 5;
    const displayConditions = conditions.slice(0, maxConditions);
    const iconSize = 24;
    const spacing = 4;
    
    let conditionX = padding;
    let conditionY = totalHeight;
    
    displayConditions.forEach((condition, index) => {
      const icon = VisualEffects.createConditionIcon(condition, iconSize);
      icon.x = conditionX;
      icon.y = conditionY;
      
      DisplayInstance.conditionIcons.push(icon);
      
      conditionX += iconSize + spacing;
      if (conditionX + iconSize > totalWidth) {
        conditionX = padding;
        conditionY += iconSize + spacing;
      }
    });
    
    if (DisplayInstance.conditionIcons.length > 0) {
      return conditionY + iconSize + padding;
    }
    
    return totalHeight;
  }

  static initializeAdvancedFeatures(DisplayInstance, config) {
    if (!DisplayInstance.combatStats && DisplayInstance.token.actor) {
      DisplayInstance.combatStats = CombatStatsManager.getStats(DisplayInstance.token);
    }
    
    if (config.particleEffect && config.particleEffect !== "none") {
      if (!DisplayInstance.particleSystem) {
        DisplayInstance.particleSystem = ParticleSystem.createElementalAura(config.particleEffect);
        DisplayInstance.addChild(DisplayInstance.particleSystem);
        
        DisplayInstance.particleSystem.x = DisplayInstance.background.width / 2;
        DisplayInstance.particleSystem.y = DisplayInstance.background.height / 2;
      }
    } else if (DisplayInstance.particleSystem) {
      DisplayInstance.removeChild(DisplayInstance.particleSystem);
      DisplayInstance.particleSystem.destroy();
      DisplayInstance.particleSystem = null;
    }
    
    if (config.magicCircle) {
      if (!DisplayInstance.magicCircle) {
        DisplayInstance.magicCircle = new MagicCircle(DisplayInstance.background.width / 2);
        DisplayInstance.addChildAt(DisplayInstance.magicCircle, 1);
        
        DisplayInstance.magicCircle.x = DisplayInstance.background.width / 2;
        DisplayInstance.magicCircle.y = DisplayInstance.background.height / 2;
      }
    } else if (DisplayInstance.magicCircle) {
      DisplayInstance.removeChild(DisplayInstance.magicCircle);
      DisplayInstance.magicCircle.destroy();
      DisplayInstance.magicCircle = null;
    }
    
    if (config.enableClickToRoll !== false && DisplayInstance.textElement) {
      ClickToRoll.makeRollable(DisplayInstance.textElement, DisplayInstance.token);
    }
  }

  static shouldDisplay(DisplayInstance, config) {
    if (config.enabled === false) return false;
    
    const visibility = config.visibility || DisplaySettings.get("defaultVisibility");
    
    switch(visibility) {
      case "gm-only":
        if (!game.user.isGM) return false;
        break;
      case "combat":
        if (!game.combat || !game.combat.started) return false;
        break;
      case "hover":
      case "selected":
        break;
    }
    
    if (config.hideWhenHidden !== false && DisplayInstance.token.document.hidden && !game.user.isGM) {
      return false;
    }
    
    if (!game.user.isGM && config.showToPlayers === false) {
      return false;
    }
    
    return true;
  }

  static getDisplayContent(DisplayInstance, config) {
    let content = config.content || "@name";
    
    if (!game.user.isGM && config.playerContent) {
      const playerVisibility = DisplaySettings.get("playerVisibility");
      
      switch(playerVisibility) {
        case "name-only":
          content = "@name";
          break;
        case "basic":
          content = config.playerContent || "@name\nHP: @hp";
          break;
        case "none":
          return "";
        case "all":
        default:
          break;
      }
    }
    
    return SystemIntegration.parseContentVariables(
      content,
      DisplayInstance.token.actor,
      DisplayInstance.token.document
    );
  }

  static createProgressBar(DisplayInstance, barConfig, width) {
    if (!DisplayInstance.token.actor) return null;
    
    const actorData = SystemIntegration.getActorData(DisplayInstance.token.actor);
    let percentage = 0;
    let color = barConfig.color || "#ff0000";
    const height = barConfig.height || 8;
    
    switch(barConfig.type) {
      case "hp":
        if (actorData.hp) {
          percentage = actorData.hp.percentage;
        }
        break;
      case "resources":
        if (actorData.resources && actorData.resources.primary) {
          percentage = actorData.resources.primary.percentage;
          color = barConfig.color || "#0066ff";
        }
        break;
      case "custom":
        percentage = barConfig.percentage || 0;
        break;
    }
    
    const bar = VisualEffects.createProgressBar(width, height, percentage, color, false);
    bar.x = 8;
    
    return bar;
  }

  static positionDisplay(DisplayInstance, config = null) {
    if (!config) config = DisplayInstance.getConfig();
    
    const savedOffset = DisplaySettings.getFlag(DisplayInstance.token.document, "customOffset");
    if (savedOffset) {
      DisplayInstance.customOffset = savedOffset;
    }
    
    const tokenWidth = DisplayInstance.token.w;
    const tokenHeight = DisplayInstance.token.h;
    const position = config.position || "bottom";
    
    switch(position) {
      case "top":
        DisplayInstance.x = tokenWidth / 2 - DisplayInstance.width / 2;
        DisplayInstance.y = -DisplayInstance.height - 10;
        break;
      case "bottom":
        DisplayInstance.x = tokenWidth / 2 - DisplayInstance.width / 2;
        DisplayInstance.y = tokenHeight + 10;
        break;
      case "left":
        DisplayInstance.x = -DisplayInstance.width - 10;
        DisplayInstance.y = tokenHeight / 2 - DisplayInstance.height / 2;
        break;
      case "right":
        DisplayInstance.x = tokenWidth + 10;
        DisplayInstance.y = tokenHeight / 2 - DisplayInstance.height / 2;
        break;
    }
    
    DisplayInstance.x += DisplayInstance.customOffset.x;
    DisplayInstance.y += DisplayInstance.customOffset.y;
  }

  static isActiveCombatant(DisplayInstance) {
    if (!game.combat || !game.combat.started) return false;
    
    const combatant = game.combat.combatants.find(c => c.tokenId === DisplayInstance.token.id);
    return combatant && game.combat.current.combatantId === combatant.id;
  }
}
