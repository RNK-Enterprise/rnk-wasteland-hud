/**
 * RNK Wasteland HUD - Main Module
 * Advanced token labels with dynamic data, progress bars, and extensive customization
 * @author RNK
 * @version 2.0.0
 */

import { DisplaySettings } from "./settings.js";
import { DisplayConfigApp } from "./config-app.js";
import { SystemIntegration } from "./system-integration.js";
import { VisualEffects } from "./visual-effects.js";
import { DisplayTemplateManager } from "./templates.js";
import { RadialMenu } from "./radial-menu.js";
import { ParticleSystem, MagicCircle } from "./particle-system.js";
import { CombatStats, CombatStatsManager } from "./combat-stats.js";
import { ClickToRoll } from "./click-to-roll.js";
import { SpeechBubbleManager, setupSpeechBubbles } from "./speech-bubbles.js";
import { TurnTimerManager, setupTurnTimer } from "./turn-timer.js";
import { QuickActionManager, setupQuickActions } from "./quick-actions.js";
import { PresetBuilderManager, setupPresetBuilder } from "./preset-builder.js";
import { ShapeBorderManager, setupShapeBorders } from "./shape-borders.js";
import { TextureManager, setupBackgroundTextures } from "./background-textures.js";
import { EditableFieldsManager, setupEditableFields } from "./editable-fields.js";
import { TokenLinkManager, setupTokenLinks } from "./token-links.js";
import { ConcentrationTracker, setupConcentration } from "./concentration.js";
import { InventoryDisplayManager, setupInventoryDisplay } from "./inventory-display.js";
import { CinematicEffects, setupCinematicEffects } from "./cinematic.js";
import { MultiplayerFeatures, setupMultiplayer } from "./multiplayer.js";
import { PartyFramesManager, setupPartyFrames } from "./party-frames.js";
import { PluginSystem, setupPluginSystem } from "./plugin-system.js";
import { KeyboardShortcuts } from "./keyboard-shortcuts.js";
import { TokenDisplay } from "./core/token-display-class.js";
import { HooksManager } from "./core/hooks-manager.js";
import { ChatCommandsHandler } from "./core/chat-commands.js";
import { initializeHub } from "./hub-module.js";

/**
 * Token Display class is imported from modular files
 * See: scripts/core/token-display-class.js
 */

/**
 * Module Initialization
 */
Hooks.once("init", () => {
  console.log("RNK™ Wasteland HUD | Initializing v2.0.0");
  
  DisplaySettings.registerSettings();
  
  // Register chat commands
  ChatCommandsHandler.registerChatCommands();
  
  // Register hooks
  HooksManager.registerHooks();
  
  // Initialize hub
  initializeHub();
  
  // Register keyboard shortcuts in init hook (required by Foundry)
  KeyboardShortcuts.init();
  
  // Register Handlebars helpers for ApplicationV2 templates
  // These are needed for template rendering in V2 apps
  Handlebars.registerHelper('selected', function(value, test) {
    return value === test ? 'selected' : '';
  });
  
  Handlebars.registerHelper('checked', function(value) {
    return value ? 'checked' : '';
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('multiply', function(a, b) {
    return Math.round(a * b);
  });
});

Hooks.once("ready", () => {
  console.log("RNK™ Wasteland HUD | Ready");
  
  // Complete keyboard shortcuts setup (guarded) - avoid calling if not defined to prevent
  // duplicate/late registration errors.
  try {
    if (typeof KeyboardShortcuts?.ready === 'function') KeyboardShortcuts.ready();
  } catch (err) {
    console.warn("RNK Wasteland HUD: KeyboardShortcuts.ready() failed", err);
  }
  
  // Initialize advanced features
  setupSpeechBubbles();
  setupTurnTimer();
  // setupQuickActions(); // Disabled - not needed
  setupPresetBuilder();
  setupShapeBorders();
  setupBackgroundTextures();
  setupEditableFields();
  setupTokenLinks();
  setupConcentration();
  setupInventoryDisplay();
  setupCinematicEffects();
  setupMultiplayer();
  setupPartyFrames();
  setupPluginSystem();
  
  // Add scene control button for Display toggle
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!controls || !controls.length) return;
    
    const tokenControls = controls.find(c => c?.name === "token");
    if (!tokenControls) return;
    
    tokenControls.tools.unshift({
      name: "rnk-wasteland-hud-toggle",
      title: "Toggle Displays",
      icon: "fas fa-scroll",
      button: true,
      onClick: () => {
        const controlled = canvas.tokens?.controlled;
        if (!controlled || controlled.length === 0) {
          ui.notifications.warn("Select at least one token to toggle Displays");
          return;
        }
        
        const firstToken = controlled[0];
        const currentState = DisplaySettings.getFlag(firstToken.document, "enabled");
        const newState = !currentState;
        
        controlled.forEach(async token => {
          await DisplaySettings.setFlag(token.document, "enabled", newState);
        });
        
        ui.notifications.info(`Displays ${newState ? "enabled" : "disabled"} for ${controlled.length} token(s)`);
      }
    });
  });
  
  // Add animation ticker for particles
  canvas.app.ticker.add((delta) => {
    canvas.tokens.placeables.forEach(token => {
      if (token.Display) {
        token.Display.updateParticles(delta);
      }
    });
  });
  
  // Add chat command for bulk operations
  Hooks.on("chatMessage", (log, message, data) => {
    if (message.startsWith("/Displays")) {
      const args = message.split(" ");
      const command = args[1];
      
      switch(command) {
        case "enable":
          canvas.tokens.controlled.forEach(async t => await DisplaySettings.setFlag(t.document, "config", {enabled: true}));
          ui.notifications.info("Displays enabled for selected tokens!");
          return false;
        case "disable":
          canvas.tokens.controlled.forEach(async t => await DisplaySettings.setFlag(t.document, "config", {enabled: false}));
          ui.notifications.info("Displays disabled for selected tokens!");
          return false;
        case "stats":
          if (canvas.tokens.controlled.length === 1) {
            const token = canvas.tokens.controlled[0];
            if (token.actor) {
              const stats = CombatStatsManager.getStats(token);
              const html = stats.renderStatsDisplay();
              ChatMessage.create({
                content: html,
                whisper: game.user.isGM ? [] : [game.user.id]
              });
            }
          } else {
            ui.notifications.warn("Select exactly one token to view stats!");
          }
          return false;
        case "help":
          ChatMessage.create({
            content: `
              <h3>RNK Wasteland HUD Commands</h3>
              <ul>
                <li><code>/Displays enable</code> - Enable Displays for selected tokens</li>
                <li><code>/Displays disable</code> - Disable Displays for selected tokens</li>
                <li><code>/Displays stats</code> - Show combat statistics for selected token</li>
                <li><code>/Displays help</code> - Show this help</li>
              </ul>
            `,
            whisper: [game.user.id]
          });
          return false;
      }
    }
  });
});

/**
 * Token Hooks
 */
Hooks.on("refreshToken", (token) => {
  if (!token.Display) {
    token.Display = token.addChild(new TokenDisplay(token));
  } else {
    token.Display.refresh();
  }
  
  // Handle visibility modes
  const config = DisplaySettings.getFlag(token.document, "config") || {};
  if (config.visibility === "selected") {
    token.Display.visible = token.controlled;
  }
});

Hooks.on("destroyToken", (token) => {
  if (token.Display) {
    token.Display.destroy();
    token.Display = null;
  }
});

Hooks.on("controlToken", (token, controlled) => {
  if (!token.Display) return;
  
  const config = DisplaySettings.getFlag(token.document, "config") || {};
  if (config.visibility === "selected") {
    token.Display.visible = controlled;
    if (controlled && DisplaySettings.get("enableAnimations")) {
      VisualEffects.animateFadeIn(token.Display, 200);
    }
  }
});

Hooks.on("hoverToken", (token, hovered) => {
  if (!token.Display) return;
  
  const config = DisplaySettings.getFlag(token.document, "config") || {};
  if (config.visibility === "hover") {
    if (hovered) {
      token.Display.visible = true;
      if (DisplaySettings.get("enableAnimations")) {
        VisualEffects.animateFadeIn(token.Display, 150);
      }
    } else {
      if (DisplaySettings.get("enableAnimations")) {
        VisualEffects.animateFadeOut(token.Display, 150, () => {
          token.Display.visible = false;
        });
      } else {
        token.Display.visible = false;
      }
    }
  }
});

// Update on actor changes
Hooks.on("updateActor", (actor, changes, options, userId) => {
  // Find all tokens for this actor and refresh their Displays
  canvas.tokens.placeables.forEach(token => {
    if (token.actor && token.actor.id === actor.id && token.Display) {
      token.Display.refresh();
    }
  });
});

// Combat tracker integration
Hooks.on("updateCombat", (combat, changed, options, userId) => {
  if (!DisplaySettings.get("combatHighlight")) return;
  
  canvas.tokens.placeables.forEach(token => {
    if (token.Display) {
      token.Display.refresh();
    }
  });
});

Hooks.on("combatStart", (combat) => {
  canvas.tokens.placeables.forEach(token => {
    if (token.Display) {
      const config = DisplaySettings.getFlag(token.document, "config") || {};
      if (config.visibility === "combat") {
        token.Display.visible = true;
        if (DisplaySettings.get("enableAnimations")) {
          VisualEffects.animateFadeIn(token.Display);
        }
      }
    }
  });
});

Hooks.on("combatEnd", (combat) => {
  canvas.tokens.placeables.forEach(token => {
    if (token.Display) {
      VisualEffects.stopPulse(token.Display);
      
      const config = DisplaySettings.getFlag(token.document, "config") || {};
      if (config.visibility === "combat") {
        token.Display.visible = false;
      }
    }
  });
});

// Token HUD hooks handled by HooksManager

// Canvas pan/zoom - update distance fades
Hooks.on("canvasPan", () => {
  if (DisplaySettings.get("distanceFade") === 0) return;
  
  canvas.tokens.placeables.forEach(token => {
    if (token.Display && token.Display.visible) {
      VisualEffects.applyDistanceFade(token.Display, token);
    }
  });
});

// Export for console/macro access
window.RNKDisplays = {
  TokenDisplay,
  DisplayConfigApp,
  DisplaySettings,
  DisplayTemplateManager,
  SystemIntegration,
  VisualEffects,
  RadialMenu,
  ParticleSystem,
  MagicCircle,
  CombatStats,
  CombatStatsManager,
  ClickToRoll,
  SpeechBubbleManager,
  TurnTimerManager,
  QuickActionManager,
  PresetBuilderManager,
  ShapeBorderManager,
  TextureManager,
  EditableFieldsManager,
  TokenLinkManager,
  ConcentrationTracker,
  InventoryDisplayManager,
  CinematicEffects,
  MultiplayerFeatures,
  PartyFramesManager,
  PluginSystem
};

console.log("RNK™ Wasteland HUD | Module loaded successfully!");


