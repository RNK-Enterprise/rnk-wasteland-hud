/**
 * RNK™ Wasteland HUD - Chat Commands Handler
 * Manages chat commands for Display operations
 * @author RNK™
 * @version 2.0.1
 */

import { CombatStatsManager } from "../combat-stats.js";
import { DisplaySettings } from "../settings.js";

export class ChatCommandsHandler {
  static registerChatCommands() {
    Hooks.on("chatMessage", (log, message, data) => {
      if (!message.startsWith("/Displays")) return;
      
      const args = message.split(" ");
      const command = args[1];
      
      return this.handleCommand(command, args);
    });
  }

  static handleCommand(command, args) {
    switch(command) {
      case "enable":
        return this.enableDisplays();
      case "disable":
        return this.disableDisplays();
      case "stats":
        return this.showStats();
      case "help":
        return this.showHelp();
      default:
        ui.notifications.warn("Unknown command. Use /Displays help for available commands.");
        return false;
    }
  }

  static enableDisplays() {
    canvas.tokens.controlled.forEach(t => 
      DisplaySettings.setFlag(t.document, "config", {enabled: true})
    );
    ui.notifications.info("Displays enabled for selected tokens!");
    return false;
  }

  static disableDisplays() {
    canvas.tokens.controlled.forEach(t => 
      DisplaySettings.setFlag(t.document, "config", {enabled: false})
    );
    ui.notifications.info("Displays disabled for selected tokens!");
    return false;
  }

  static showStats() {
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
  }

  static showHelp() {
    ChatMessage.create({
      content: `
        <h3>RNK™ Wasteland HUD Commands</h3>
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
