/**
 * RNK™ Wasteland HUD - Token Display Display Logic
 * Handles drawing and positioning of token Displays
 * @author RNK™
 * @version 2.0.1
 */

import { DisplaySettings } from "../settings.js";
import { SystemIntegration } from "../system-integration.js";
import { VisualEffects } from "../visual-effects.js";

export class TokenDisplayDisplay {
  /**
   * Check if Display should be displayed based on config and permissions
   */
  static shouldDisplay(token, config) {
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
    
    if (config.hideWhenHidden !== false && token.document.hidden && !game.user.isGM) {
      return false;
    }
    
    if (!game.user.isGM && config.showToPlayers === false) {
      return false;
    }
    
    return true;
  }

  /**
   * Get display content with player visibility handling
   */
  static getDisplayContent(token, config) {
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
      token.actor,
      token.document
    );
  }

  /**
   * Create a progress bar
   */
  static createProgressBar(token, barConfig, width) {
    if (!token.actor) return null;
    
    const actorData = SystemIntegration.getActorData(token.actor);
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

  /**
   * Position Display in absolute scene coordinates (overlay mode)
   */
  static positionDisplay(Display, token, config, customOffset = {x: 0, y: 0}) {
    // Use absolute scene coordinates for overlay positioning
    const tokenX = token.x;
    const tokenY = token.y;
    const tokenWidth = token.w;
    const tokenHeight = token.h;
    const position = config.position || "bottom";
    
    let baseX = tokenX;
    let baseY = tokenY;
    
    switch(position) {
      case "top":
        baseX = tokenX + tokenWidth / 2 - Display.width / 2;
        baseY = tokenY - Display.height - 10;
        break;
      case "bottom":
        baseX = tokenX + tokenWidth / 2 - Display.width / 2;
        baseY = tokenY + tokenHeight + 10;
        break;
      case "left":
        baseX = tokenX - Display.width - 10;
        baseY = tokenY + tokenHeight / 2 - Display.height / 2;
        break;
      case "right":
        baseX = tokenX + tokenWidth + 10;
        baseY = tokenY + tokenHeight / 2 - Display.height / 2;
        break;
    }
    
    Display.x = baseX + customOffset.x;
    Display.y = baseY + customOffset.y;
  }

  /**
   * Check if token is active combatant
   */
  static isActiveCombatant(token) {
    if (!game.combat || !game.combat.started) return false;
    
    const combatant = game.combat.combatants.find(c => c.tokenId === token.id);
    return combatant && game.combat.current.combatantId === combatant.id;
  }
}
