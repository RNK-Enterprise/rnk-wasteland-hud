/**
 * RNK™ Wasteland HUD - Multiplayer Features Manager
 * Coordinates multiplayer collaboration features
 * @module multiplayer/multiplayer-manager
 */

import { PlayerCursor } from "./player-cursor.js";
import { PingEffect } from "./ping-effect.js";
import { TypingIndicator } from "./typing-indicator.js";
import { SharedNote } from "./shared-note.js";

export class MultiplayerFeatures {
  static cursors = new Map();
  static pings = [];
  static typingIndicators = new Map();
  static notes = new Map();
  static container = null;

  static initialize() {
    if (!canvas.ready) return;

    this.container = new PIXI.Container();
    this.container.zIndex = 10000;
    canvas.stage.addChild(this.container);

    this._setupSocketListeners();
    this._trackCursor();
  }

  static _setupSocketListeners() {
    game.socket.on("module.rnk-wasteland-hud", (data) => {
      switch (data.type) {
        case "cursor":
          this.updateCursor(data.userId, data.userName, data.x, data.y, data.color);
          break;

        case "ping":
          this.createPing(data.x, data.y, data.color, data.label);
          break;

        case "typing":
          this.showTypingIndicator(data.userId, data.userName, data.color);
          break;

        case "stopTyping":
          this.hideTypingIndicator(data.userId);
          break;

        case "createNote":
          this.createNote(data.noteData);
          break;

        case "moveNote":
          this.moveNote(data.noteId, data.x, data.y);
          break;

        case "updateNote":
          this.updateNote(data.noteId, data.text);
          break;

        case "deleteNote":
          this.removeNote(data.noteId);
          break;
      }
    });
  }

  static _trackCursor() {
    let lastUpdate = 0;
    const throttle = 100;

    $(document).on("mousemove", (event) => {
      const now = Date.now();
      if (now - lastUpdate < throttle) return;
      lastUpdate = now;

      const x = event.clientX;
      const y = event.clientY;

      game.socket.emit("module.rnk-wasteland-hud", {
        type: "cursor",
        userId: game.user.id,
        userName: game.user.name,
        x: x,
        y: y,
        color: game.user.color
      });
    });
  }

  static updateCursor(userId, userName, x, y, color) {
    if (userId === game.user.id) return;

    let cursor = this.cursors.get(userId);
    
    if (!cursor) {
      cursor = new PlayerCursor(userId, userName, color);
      this.container.addChild(cursor);
      this.cursors.set(userId, cursor);
    }

    cursor.moveTo(x, y);
  }

  static createPing(x, y, color = game.user.color, label = "") {
    const ping = new PingEffect(x, y, color, label);
    this.container.addChild(ping);
    this.pings.push(ping);
  }

  static broadcastPing(x, y, label = "") {
    game.socket.emit("module.rnk-wasteland-hud", {
      type: "ping",
      x: x,
      y: y,
      color: game.user.color,
      label: label
    });

    this.createPing(x, y, game.user.color, label);
  }

  static showTypingIndicator(userId, userName, color) {
    if (userId === game.user.id) return;

    let indicator = this.typingIndicators.get(userId);
    
    if (!indicator) {
      indicator = new TypingIndicator(userName, color);
      indicator.position.set(10, window.innerHeight - 50);
      this.container.addChild(indicator);
      this.typingIndicators.set(userId, indicator);
    }
  }

  static hideTypingIndicator(userId) {
    const indicator = this.typingIndicators.get(userId);
    
    if (indicator) {
      this.container.removeChild(indicator);
      indicator.destroy();
      this.typingIndicators.delete(userId);
    }
  }

  static createNote(noteData) {
    const note = new SharedNote(noteData);
    this.container.addChild(note);
    this.notes.set(note.data.id, note);
  }

  static moveNote(noteId, x, y) {
    const note = this.notes.get(noteId);
    if (note) {
      note.position.set(x, y);
    }
  }

  static updateNote(noteId, text) {
    const note = this.notes.get(noteId);
    if (note) {
      note.data.text = text;
      note.removeChildren();
      note._createNote();
    }
  }

  static removeNote(noteId) {
    const note = this.notes.get(noteId);
    
    if (note) {
      this.container.removeChild(note);
      note.destroy();
      this.notes.delete(noteId);
    }
  }

  static update(delta) {
    for (const cursor of this.cursors.values()) {
      cursor.update(delta);
    }

    for (let i = this.pings.length - 1; i >= 0; i--) {
      const shouldRemove = this.pings[i].update(delta);
      
      if (shouldRemove) {
        const ping = this.pings.splice(i, 1)[0];
        this.container.removeChild(ping);
        ping.destroy();
      }
    }

    for (const indicator of this.typingIndicators.values()) {
      indicator.update(delta);
    }
  }

  static clear() {
    this.cursors.forEach(cursor => cursor.destroy());
    this.cursors.clear();
    
    this.pings.forEach(ping => ping.destroy());
    this.pings = [];
    
    this.typingIndicators.forEach(indicator => indicator.destroy());
    this.typingIndicators.clear();
    
    this.notes.forEach(note => note.destroy());
    this.notes.clear();

    if (this.container) {
      this.container.removeChildren();
    }
  }
}
