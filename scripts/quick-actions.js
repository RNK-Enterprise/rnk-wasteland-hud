/**
 * RNK™ Displays - Quick Actions
 * Coordinates quick action toolbar integration
 * @module QuickActions
 */

import { DisplaySettings } from "./settings.js";
import { QuickActionButton } from "./actions/action-button.js";
import { QuickActionBar } from "./actions/action-bar.js";
import { QuickActionManager } from "./actions/action-manager.js";
import { getDefaultActions, showWeaponSelector } from "./actions/default-actions.js";

export { QuickActionButton, QuickActionBar, QuickActionManager, getDefaultActions, showWeaponSelector };

export function setupQuickActions() {
  console.log("RNK™ Displays | Quick Actions initialized");
  
  game.settings.register("rnk-wasteland-hud", "showQuickActions", {
    name: "Show Quick Action Buttons",
    hint: "Display quick action toolbar on tokens",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "never": "Never",
      "selected": "When Selected",
      "always": "Always",
      "combat": "During Combat"
    },
    default: "selected"
  });
  
  Hooks.on("controlToken", (token, controlled) => {
    const setting = DisplaySettings.get("showQuickActions");
    
    if (setting === "selected") {
      if (controlled) {
        const config = DisplaySettings.getFlag(token.document, "config") || {};
        if (config.quickActions !== false) {
          QuickActionManager.show(token, config.customQuickActions);
        }
      } else {
        QuickActionManager.hide(token);
      }
    }
  });
  
  Hooks.on("updateCombat", (combat, changed) => {
    const setting = DisplaySettings.get("showQuickActions");
    
    if (setting === "combat" && changed.turn !== undefined) {
      QuickActionManager.hideAll();
      
      const combatant = combat.combatant;
      if (combatant) {
        const token = canvas.tokens.get(combatant.tokenId);
        if (token) {
          const config = DisplaySettings.getFlag(token.document, "config") || {};
          QuickActionManager.show(token, config.customQuickActions);
        }
      }
    }
  });
  
  Hooks.on("combatEnd", () => {
    const setting = game.settings.get("rnk-wasteland-hud", "showQuickActions");
    if (setting === "combat") {
      QuickActionManager.hideAll();
    }
  });
  
  Hooks.on("chatMessage", (log, message) => {
    if (message.startsWith("/actions")) {
      const args = message.split(" ");
      const command = args[1];
      
      const token = canvas.tokens.controlled[0];
      if (!token) {
        ui.notifications.warn("Select a token first!");
        return false;
      }
      
      switch(command) {
        case "show":
          QuickActionManager.show(token);
          ui.notifications.info("Actions shown!");
          return false;
          
        case "hide":
          QuickActionManager.hide(token);
          ui.notifications.info("Actions hidden!");
          return false;
          
        case "toggle":
          QuickActionManager.toggle(token);
          return false;
      }
    }
  });
  
  // renderTokenHUD hook disabled - quick actions button removed
  /*
  Hooks.on("renderTokenHUD", (hud, html, data) => {
    const token = canvas.tokens.get(data._id);
    if (!token) return;
    
    const button = $(`
      <div class="control-icon quick-actions" title="Quick Actions">
        <i class="fas fa-grip-horizontal"></i>
      </div>
    `);
    
    button.click(() => {
      QuickActionManager.toggle(token);
    });
    
    html = $(html);
    html.find(".col.right").append(button);
  });
  */
}

window.QuickActionManager = QuickActionManager;

