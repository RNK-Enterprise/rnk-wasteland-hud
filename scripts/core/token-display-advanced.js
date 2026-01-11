/**
 * RNK™ Wasteland HUD - Advanced Features Manager
 * Manages particle systems, radial menus, and other advanced features
 * @author RNK™
 * @version 2.0.1
 */

import { DisplaySettings } from "../settings.js";
import { RadialMenu } from "../radial-menu.js";
import { ParticleSystem, MagicCircle } from "../particle-system.js";
import { CombatStatsManager } from "../combat-stats.js";
import { ClickToRoll } from "../click-to-roll.js";

export class TokenDisplayAdvancedFeatures {
  /**
   * Initialize advanced features for a Display
   */
  static initializeAdvancedFeatures(Display, token, config) {
    // Initialize combat stats
    if (!Display.combatStats && token.actor) {
      Display.combatStats = CombatStatsManager.getStats(token);
    }
    
    // Initialize particle system
    TokenDisplayAdvancedFeatures._initializeParticleSystem(Display, config);
    
    // Initialize magic circle
    TokenDisplayAdvancedFeatures._initializeMagicCircle(Display, config);
    
    // Make text rollable
    if (config.enableClickToRoll !== false && Display.textElement) {
      ClickToRoll.makeRollable(Display.textElement, token);
    }
  }

  static _initializeParticleSystem(Display, config) {
    if (config.particleEffect && config.particleEffect !== "none") {
      if (!Display.particleSystem) {
        Display.particleSystem = ParticleSystem.createElementalAura(config.particleEffect);
        Display.addChild(Display.particleSystem);
        
        Display.particleSystem.x = Display.background.width / 2;
        Display.particleSystem.y = Display.background.height / 2;
      }
    } else if (Display.particleSystem) {
      Display.removeChild(Display.particleSystem);
      Display.particleSystem.destroy();
      Display.particleSystem = null;
    }
  }

  static _initializeMagicCircle(Display, config) {
    if (config.magicCircle) {
      if (!Display.magicCircle) {
        Display.magicCircle = new MagicCircle(Display.background.width / 2);
        Display.addChildAt(Display.magicCircle, 1);
        
        Display.magicCircle.x = Display.background.width / 2;
        Display.magicCircle.y = Display.background.height / 2;
      }
    } else if (Display.magicCircle) {
      Display.removeChild(Display.magicCircle);
      Display.magicCircle.destroy();
      Display.magicCircle = null;
    }
  }

  /**
   * Show radial menu for a Display
   */
  static showRadialMenu(Display, token) {
    if (Display.radialMenu) {
      Display.radialMenu.close();
      return;
    }
    
    const config = DisplaySettings.getFlag(token.document, "config") || {};
    if (!Display.background) {
      console.warn('[RNK™ Wasteland HUD] TokenDisplay.showRadialMenu: background is null or undefined');
      return;
    }

    const actions = config.radialActions || RadialMenu.getDefaultActions(token);
    
    Display.radialMenu = new RadialMenu(token, actions);
    Display.addChild(Display.radialMenu);
    
    Display.radialMenu.x = Display.background.width / 2;
    Display.radialMenu.y = Display.background.height / 2;
    
    Display.radialMenu.open();
    
    Display.radialMenu.once("close", () => {
      Display.removeChild(Display.radialMenu);
      Display.radialMenu.destroy();
      Display.radialMenu = null;
    });
  }

  /**
   * Update particle animations
   */
  static updateParticles(Display, delta) {
    if (Display.particleSystem) {
      Display.particleSystem.update(delta);
    }
    
    if (Display.magicCircle) {
      Display.magicCircle.rotation += 0.005;
    }
  }
}
