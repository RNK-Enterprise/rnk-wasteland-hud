/**
 * Concentration & Spell Tracking
 * Track active spells, concentration checks, and spell durations
 * @module concentration
 */

import { DisplaySettings } from "./settings.js";

/**
 * Active Spell
 */
export class ActiveSpell {
  constructor(data) {
    this.id = data.id || foundry.utils.randomID();
    this.name = data.name;
    this.level = data.level || 0;
    this.duration = data.duration || 0; // In rounds
    this.concentration = data.concentration || false;
    this.token = data.token;
    this.startRound = data.startRound || 0;
    this.endRound = data.endRound || 0;
    this.dc = data.dc || 10;
    this.icon = data.icon || "icons/svg/aura.svg";
  }

  getRemainingRounds(currentRound) {
    return Math.max(0, this.endRound - currentRound);
  }

  isExpired(currentRound) {
    return this.duration > 0 && currentRound >= this.endRound;
  }

  toObject() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      duration: this.duration,
      concentration: this.concentration,
      startRound: this.startRound,
      endRound: this.endRound,
      dc: this.dc,
      icon: this.icon
    };
  }
}

/**
 * Concentration Indicator
 */
export class ConcentrationIndicator extends PIXI.Container {
  constructor(token, spell) {
    super();

    this.token = token;
    this.spell = spell;
    this.ring = null;
    this.icon = null;
    this.timeText = null;
    this.animationTime = 0;

    this._createIndicator();
  }

  _createIndicator() {
    const size = this.token.w * 1.2;

    // Pulsing ring
    this.ring = new PIXI.Graphics();
    this._drawRing(size);
    this.addChild(this.ring);

    // Spell icon
    if (this.spell.icon) {
      this._loadIcon();
    }

    // Duration text
    this.timeText = new PIXI.Text("", {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      stroke: 0x9966ff,
      strokeThickness: 3
    });
    this.timeText.anchor.set(0.5);
    this.timeText.position.set(0, size / 2 + 15);
    this.addChild(this.timeText);

    this._updateText();
  }

  _drawRing(size) {
    this.ring.clear();
    this.ring.lineStyle(3, 0x9966ff, 0.8);
    this.ring.drawCircle(0, 0, size / 2);

    // Add glow using CSS filter (v12+ compatible)
    try {
      if (typeof PIXI.filters?.GlowFilter !== 'undefined') {
        const glow = new PIXI.filters.GlowFilter({
          distance: 15,
          outerStrength: 2,
          color: 0x9966ff
        });
        this.ring.filters = [glow];
      } else {
        // Fallback: use blur filter for glow effect
        const blur = new PIXI.BlurFilter(4);
        blur.quality = 2;
        this.ring.filters = [blur];
      }
    } catch (err) {
      console.debug('RNK™ Wasteland HUD | GlowFilter not available, using fallback');
    }
  }

  async _loadIcon() {
    try {
      // Use Foundry's loadTexture for v12+ compatibility
      const texture = await loadTexture(this.spell.icon);
      this.icon = new PIXI.Sprite(texture);
      this.icon.width = 32;
      this.icon.height = 32;
      this.icon.anchor.set(0.5);
      this.icon.position.set(0, -(this.token.h / 2 + 20));
      this.addChild(this.icon);
    } catch (error) {
      console.warn("Failed to load spell icon:", this.spell.icon);
    }
  }

  _updateText() {
    if (!game.combat) {
      this.timeText.text = this.spell.name;
      return;
    }

    const remaining = this.spell.getRemainingRounds(game.combat.round);
    if (remaining > 0) {
      this.timeText.text = `${this.spell.name} (${remaining}r)`;
    } else {
      this.timeText.text = this.spell.name;
    }
  }

  update(delta) {
    this.animationTime += delta * 0.05;

    // Pulse animation
    const pulse = Math.sin(this.animationTime) * 0.2 + 0.8;
    this.ring.alpha = pulse;
    this.ring.scale.set(1 + Math.sin(this.animationTime * 2) * 0.05);

    // Update text
    this._updateText();
  }
}

/**
 * Concentration Tracker
 */
export class ConcentrationTracker {
  static activeSpells = new Map(); // token.id -> ActiveSpell
  static indicators = new Map(); // token.id -> ConcentrationIndicator

  /**
   * Start concentrating on a spell
   */
  static async startConcentration(token, spellData) {
    if (!token.actor) return;

    // End previous concentration
    this.endConcentration(token);

    const currentRound = game.combat?.round || 0;
    const spell = new ActiveSpell({
      ...spellData,
      token: token.id,
      concentration: true,
      startRound: currentRound,
      endRound: currentRound + (spellData.duration || 10)
    });

    this.activeSpells.set(token.id, spell);

    // Create visual indicator
    const indicator = new ConcentrationIndicator(token, spell);
    indicator.position.set(token.w / 2, token.h / 2);
    token.addChild(indicator);
    this.indicators.set(token.id, indicator);

    // Store in actor flags
    await DisplaySettings.setFlag(token.actor, "concentrationSpell", spell.toObject());

    ChatMessage.create({
      content: `${token.name} is now concentrating on ${spell.name}`,
      speaker: ChatMessage.getSpeaker({ token: token.document })
    });

    return spell;
  }

  /**
   * End concentration
   */
  static async endConcentration(token) {
    const spell = this.activeSpells.get(token.id);
    if (!spell) return;

    // Remove indicator
    const indicator = this.indicators.get(token.id);
    if (indicator) {
      token.removeChild(indicator);
      indicator.destroy({ children: true });
      this.indicators.delete(token.id);
    }

    // Remove from tracking
    this.activeSpells.delete(token.id);

    // Clear flag
    if (token.actor) {
      await DisplaySettings.setFlag(token.actor, "concentrationSpell", undefined);
    }

    ChatMessage.create({
      content: `${token.name} stops concentrating on ${spell.name}`,
      speaker: ChatMessage.getSpeaker({ token: token.document })
    });
  }

  /**
   * Check concentration (on damage)
   */
  static async checkConcentration(token, damage) {
    const spell = this.activeSpells.get(token.id);
    if (!spell) return;

    const dc = Math.max(10, Math.floor(damage / 2));
    spell.dc = dc;

    // Prompt for save
    const result = await this._promptConcentrationSave(token, dc);

    if (!result.success) {
      this.endConcentration(token);
      
      ChatMessage.create({
        content: `${token.name} failed concentration check (DC ${dc}) and lost ${spell.name}!`,
        speaker: ChatMessage.getSpeaker({ token: token.document })
      });
    } else {
      ChatMessage.create({
        content: `${token.name} maintained concentration on ${spell.name} (DC ${dc})`,
        speaker: ChatMessage.getSpeaker({ token: token.document })
      });
    }
  }

  /**
   * Prompt for concentration save
   */
  static async _promptConcentrationSave(token, dc) {
    return new Promise((resolve) => {
      new Dialog({
        title: `Concentration Check - DC ${dc}`,
        content: `
          <p><strong>${token.name}</strong> must make a Constitution saving throw to maintain concentration.</p>
          <p><strong>DC:</strong> ${dc}</p>
          <form>
            <div class="form-group">
              <label>Roll Result:</label>
              <input type="number" name="roll" value="10" autofocus />
            </div>
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: "Roll",
            callback: async () => {
              // Try to auto-roll if system supports it
              if (token.actor?.rollAbilitySave) {
                const roll = await token.actor.rollAbilitySave("con");
                const total = roll.total || roll._total;
                resolve({ success: total >= dc, roll: total });
              } else {
                resolve({ success: false });
              }
            }
          },
          manual: {
            icon: '<i class="fas fa-check"></i>',
            label: "Manual",
            callback: (html) => {
              const roll = parseInt(html.find('input[name="roll"]').val());
              resolve({ success: roll >= dc, roll });
            }
          },
          fail: {
            icon: '<i class="fas fa-times"></i>',
            label: "Failed",
            callback: () => resolve({ success: false })
          }
        },
        default: "roll"
      }).render(true);
    });
  }

  /**
   * Update all active spells
   */
  static update(delta) {
    for (const [tokenId, indicator] of this.indicators.entries()) {
      indicator.update(delta);
    }

    // Check for expired spells
    if (game.combat) {
      for (const [tokenId, spell] of this.activeSpells.entries()) {
        if (spell.isExpired(game.combat.round)) {
          const token = canvas.tokens.get(tokenId);
          if (token) {
            this.endConcentration(token);
            
            ChatMessage.create({
              content: `${spell.name} expired on ${token.name}`,
              speaker: ChatMessage.getSpeaker({ token: token.document })
            });
          }
        }
      }
    }
  }

  /**
   * Get active concentration spell for token
   */
  static getConcentration(token) {
    return this.activeSpells.get(token.id);
  }

  /**
   * Clear all concentration
   */
  static clear() {
    this.indicators.forEach(indicator => indicator.destroy({ children: true }));
    this.indicators.clear();
    this.activeSpells.clear();
  }
}

/**
 * Spell Tracker (non-concentration)
 */
export class SpellTracker {
  static spells = new Map(); // token.id -> ActiveSpell[]

  /**
   * Add active spell to token
   */
  static addSpell(token, spellData) {
    const tokenSpells = this.spells.get(token.id) || [];
    
    const currentRound = game.combat?.round || 0;
    const spell = new ActiveSpell({
      ...spellData,
      token: token.id,
      startRound: currentRound,
      endRound: currentRound + (spellData.duration || 10)
    });

    tokenSpells.push(spell);
    this.spells.set(token.id, tokenSpells);

    ChatMessage.create({
      content: `${spell.name} is now active on ${token.name}`,
      speaker: ChatMessage.getSpeaker({ token: token.document })
    });

    return spell;
  }

  /**
   * Remove spell from token
   */
  static removeSpell(token, spellId) {
    const tokenSpells = this.spells.get(token.id) || [];
    const index = tokenSpells.findIndex(s => s.id === spellId);
    
    if (index >= 0) {
      const spell = tokenSpells.splice(index, 1)[0];
      this.spells.set(token.id, tokenSpells);

      ChatMessage.create({
        content: `${spell.name} ended on ${token.name}`,
        speaker: ChatMessage.getSpeaker({ token: token.document })
      });
    }
  }

  /**
   * Get all active spells for token
   */
  static getSpells(token) {
    return this.spells.get(token.id) || [];
  }

  /**
   * Update and check for expired spells
   */
  static update() {
    if (!game.combat) return;

    for (const [tokenId, tokenSpells] of this.spells.entries()) {
      const token = canvas.tokens.get(tokenId);
      if (!token) continue;

      const expired = tokenSpells.filter(s => s.isExpired(game.combat.round));
      
      expired.forEach(spell => {
        this.removeSpell(token, spell.id);
      });
    }
  }
}

/**
 * Setup function
 */
export function setupConcentration() {
  console.log("RNK Wasteland HUD | Concentration tracking initialized");

  // Restore concentration on canvas ready
  Hooks.on("canvasReady", () => {
    canvas.tokens.placeables.forEach(token => {
      const spellData = DisplaySettings.getFlag(token.actor, "concentrationSpell");
      if (spellData) {
        ConcentrationTracker.startConcentration(token, spellData);
      }
    });
  });

  // Check concentration on damage
  Hooks.on("updateActor", (actor, change, options, userId) => {
    if ("system.attributes.hp.value" in change) {
      const oldHP = actor.system.attributes.hp.value;
      const newHP = change.system.attributes.hp.value;
      
      if (newHP < oldHP) {
        const damage = oldHP - newHP;
        const token = actor.getActiveTokens()[0];
        
        if (token && ConcentrationTracker.getConcentration(token)) {
          ConcentrationTracker.checkConcentration(token, damage);
        }
      }
    }
  });

  // Update on combat turn
  Hooks.on("updateCombat", () => {
    ConcentrationTracker.update(1);
    SpellTracker.update();
  });

  // Add to ticker
  Hooks.on("canvasReady", () => {
    canvas.app.ticker.add((delta) => {
      ConcentrationTracker.update(delta);
    });
  });

  // Clear on tear down
  Hooks.on("canvasTearDown", () => {
    ConcentrationTracker.clear();
  });

  // Chat commands
  Hooks.on("chatMessage", (log, message, data) => {
    if (message.startsWith("/concentrate")) {
      const tokens = canvas.tokens.controlled;
      if (tokens.length === 0) {
        ui.notifications.warn("Select a token first");
        return false;
      }

      const spellName = message.replace("/concentrate", "").trim();
      if (!spellName) {
        ui.notifications.warn("Usage: /concentrate <spell name>");
        return false;
      }

      tokens.forEach(token => {
        ConcentrationTracker.startConcentration(token, {
          name: spellName,
          level: 1,
          duration: 10
        });
      });

      return false;
    }

    if (message === "/endconcentration") {
      const tokens = canvas.tokens.controlled;
      tokens.forEach(token => {
        ConcentrationTracker.endConcentration(token);
      });
      return false;
    }
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  ActiveSpell,
  ConcentrationIndicator,
  ConcentrationTracker,
  SpellTracker
});


