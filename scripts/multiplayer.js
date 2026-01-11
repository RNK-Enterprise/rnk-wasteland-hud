/**
 * RNK™ Displays - Multiplayer Collaboration
 * Coordinates player cursors, pings, typing indicators, and shared notes
 * @module multiplayer
 */

import { PlayerCursor } from "./multiplayer/player-cursor.js";
import { PingEffect } from "./multiplayer/ping-effect.js";
import { TypingIndicator } from "./multiplayer/typing-indicator.js";
import { SharedNote } from "./multiplayer/shared-note.js";
import { MultiplayerFeatures } from "./multiplayer/multiplayer-manager.js";

export { PlayerCursor, PingEffect, TypingIndicator, SharedNote, MultiplayerFeatures };

export function setupMultiplayer() {
  console.log("RNK™ Displays | Multiplayer features initialized");

  Hooks.on("canvasReady", () => {
    MultiplayerFeatures.initialize();
  });

  Hooks.on("canvasReady", () => {
    canvas.app.ticker.add((delta) => {
      MultiplayerFeatures.update(delta);
    });
  });

  Hooks.on("canvasTearDown", () => {
    MultiplayerFeatures.clear();
  });

  Hooks.on("canvasReady", () => {
    canvas.stage.on("pointerdown", (event) => {
      if (event.data.originalEvent.shiftKey) {
        const pos = event.data.getLocalPosition(canvas.stage);
        MultiplayerFeatures.broadcastPing(pos.x, pos.y);
      }
    });
  });

  Hooks.on("chatMessage", (log, message, data) => {
    if (message.startsWith("/ping")) {
      const label = message.replace("/ping", "").trim();
      const center = canvas.scene.dimensions.sceneRect;
      MultiplayerFeatures.broadcastPing(center.x + center.width / 2, center.y + center.height / 2, label);
      return false;
    }

    if (message === "/note") {
      const center = canvas.scene.dimensions.sceneRect;
      const noteData = {
        text: "New note",
        x: center.x + center.width / 2,
        y: center.y + center.height / 2,
        color: game.user.color,
        author: game.user.name
      };

      game.socket.emit("module.rnk-wasteland-hud", {
        type: "createNote",
        noteData: noteData
      });

      MultiplayerFeatures.createNote(noteData);
      return false;
    }
  });
}

window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  PlayerCursor,
  PingEffect,
  TypingIndicator,
  SharedNote,
  MultiplayerFeatures
});
