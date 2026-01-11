/**
 * Token Display Content Parser
 * Handles content parsing, variable resolution, and display formatting
 * @module core/token-display-content
 */

import { DisplaySettings } from "../settings.js";
import { SystemIntegration } from "../system-integration.js";
import { VisualEffects } from "../visual-effects.js";

export class DisplayContentParser {
  static shouldDisplay(token, config) {
    if (config.enabled === false) return false;
    
    // Hide token display if linked to tile
    if (config.linkToTile && config.linkedTileId) {
      return false;
    }
    
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

  static calculatePosition(token, Display, config, customOffset) {
    const tokenWidth = token.w;
    const tokenHeight = token.h;
    const position = config.position || "bottom";
    
    let x, y;
    
    switch(position) {
      case "top":
        x = tokenWidth / 2 - Display.width / 2;
        y = -Display.height - 10;
        break;
      case "bottom":
        x = tokenWidth / 2 - Display.width / 2;
        y = tokenHeight + 10;
        break;
      case "left":
        x = -Display.width - 10;
        y = tokenHeight / 2 - Display.height / 2;
        break;
      case "right":
        x = tokenWidth + 10;
        y = tokenHeight / 2 - Display.height / 2;
        break;
      default:
        x = tokenWidth / 2 - Display.width / 2;
        y = tokenHeight + 10;
    }
    
    x += customOffset.x;
    y += customOffset.y;
    
    return { x, y };
  }
}
