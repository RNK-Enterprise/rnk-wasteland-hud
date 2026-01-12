/**
 * RNK Wasteland HUD - Combat Statistics Tracker
 * Track damage, healing, crits, and performance metrics
 */

import { DisplaySettings } from "./settings.js";

export class CombatStats {
  static missingDocumentWarningShown = false;

  constructor(token) {
    this.token = token;
    this.stats = this.loadStats();
  }

  loadStats() {
    // Safety check: ensure token and document exist
    if (!this.token?.document) {
      if (!CombatStats.missingDocumentWarningShown) {
        console.debug("RNK Wasteland HUD | CombatStats: Token missing document; skipping stats init for preview token.");
        CombatStats.missingDocumentWarningShown = true;
      }
      return this.getDefaultStats();
    }
    
    const saved = DisplaySettings.getFlag(this.token.document, "combatStats");
    return saved || this.getDefaultStats();
  }

  getDefaultStats() {
    return {
      damageDealt: 0,
      damageTaken: 0,
      healingGiven: 0,
      healingReceived: 0,
      kills: 0,
      criticalHits: 0,
      criticalMisses: 0,
      spellsCast: 0,
      attacksMade: 0,
      attacksReceived: 0,
      sessionDamage: 0,
      sessionHealing: 0,
      sessionKills: 0,
      history: []
    };
  }

  async saveStats() {
    await DisplaySettings.setFlag(this.token.document, "combatStats", this.stats);
  }

  async recordDamage(amount, target = null) {
    this.stats.damageDealt += amount;
    this.stats.sessionDamage += amount;
    
    this.stats.history.push({
      type: "damage",
      amount: amount,
      target: target?.name,
      timestamp: Date.now()
    });
    
    await this.saveStats();
    this.showFloatingNumber(amount, "#ff0000", null);
  }

  async recordDamageTaken(amount, source = null) {
    this.stats.damageTaken += amount;
    
    this.stats.history.push({
      type: "damageTaken",
      amount: amount,
      source: source?.name,
      timestamp: Date.now()
    });
    
    await this.saveStats();
  }

  async recordHealing(amount, target = null) {
    this.stats.healingGiven += amount;
    this.stats.sessionHealing += amount;
    
    this.stats.history.push({
      type: "healing",
      amount: amount,
      target: target?.name,
      timestamp: Date.now()
    });
    
    await this.saveStats();
    this.showFloatingNumber(amount, "#00ff00", null);
  }

  async recordKill(target) {
    this.stats.kills++;
    this.stats.sessionKills++;
    
    this.stats.history.push({
      type: "kill",
      target: target?.name,
      timestamp: Date.now()
    });
    
    await this.saveStats();
    this.showFloatingNumber("KILL!", "#ffff00", null);
  }

  async recordCritical(hit = true) {
    if (hit) {
      this.stats.criticalHits++;
    } else {
      this.stats.criticalMisses++;
    }
    
    this.stats.history.push({
      type: hit ? "crit" : "fumble",
      timestamp: Date.now()
    });
    
    await this.saveStats();
    
    if (hit) {
      this.showFloatingNumber("CRIT!", "#ffaa00", null);
    } else {
      this.showFloatingNumber("FUMBLE!", "#7a5a2e", null);
    }
  }

  async recordSpellCast(spell) {
    this.stats.spellsCast++;
    
    this.stats.history.push({
      type: "spell",
      spell: spell?.name,
      timestamp: Date.now()
    });
    
    await this.saveStats();
  }

  async recordAttack() {
    this.stats.attacksMade++;
    await this.saveStats();
  }

  async resetSession() {
    this.stats.sessionDamage = 0;
    this.stats.sessionHealing = 0;
    this.stats.sessionKills = 0;
    await this.saveStats();
  }

  async resetAll() {
    this.stats = {
      damageDealt: 0,
      damageTaken: 0,
      healingGiven: 0,
      healingReceived: 0,
      kills: 0,
      criticalHits: 0,
      criticalMisses: 0,
      spellsCast: 0,
      attacksMade: 0,
      attacksReceived: 0,
      sessionDamage: 0,
      sessionHealing: 0,
      sessionKills: 0,
      history: []
    };
    await this.saveStats();
  }

  showFloatingNumber(text, color, icon = null) {
    if (!this.token.Display) return;
    
    const container = new PIXI.Container();
    
    const style = {
      fontSize: 24,
      fontWeight: "bold",
      fill: color,
      stroke: "#000000",
      strokeThickness: 4,
      dropShadow: true,
      dropShadowDistance: 2,
      dropShadowBlur: 4
    };
    
    if (icon) {
      const iconText = new PIXI.Text(icon, { fontSize: 20 });
      iconText.x = -15;
      container.addChild(iconText);
    }
    
    const textElement = new PIXI.Text(text, style);
    textElement.x = icon ? 5 : 0;
    container.addChild(textElement);
    
    container.x = this.token.Display.width / 2;
    container.y = 0;
    this.token.Display.addChild(container);
    
    // Animate
    const startTime = Date.now();
    const duration = 1500;
    const startY = container.y;
    
    const animate = () => {
      if (!container || container.destroyed) return;
      
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        container.y = startY - (progress * 60);
        container.alpha = 1 - progress;
        container.scale.set(1 + progress * 0.3);
        requestAnimationFrame(animate);
      } else {
        container.destroy();
      }
    };
    
    animate();
  }

  getStatsSummary() {
    return {
      combat: {
        damageDealt: this.stats.damageDealt,
        damageTaken: this.stats.damageTaken,
        healingGiven: this.stats.healingGiven,
        kills: this.stats.kills
      },
      accuracy: {
        criticalHits: this.stats.criticalHits,
        criticalMisses: this.stats.criticalMisses,
        attacksMade: this.stats.attacksMade,
        critRate: this.stats.attacksMade > 0 ? 
          ((this.stats.criticalHits / this.stats.attacksMade) * 100).toFixed(1) + "%" : "0%"
      },
      session: {
        damageDealt: this.stats.sessionDamage,
        healingGiven: this.stats.sessionHealing,
        kills: this.stats.sessionKills
      }
    };
  }

  renderStatsDisplay() {
    const summary = this.getStatsSummary();
    
    return `
      <div class="combat-stats-display">
        <h3>Combat Statistics</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <label>Damage Dealt</label>
            <span>${summary.combat.damageDealt}</span>
          </div>
          <div class="stat-item">
            <label>Damage Taken</label>
            <span>${summary.combat.damageTaken}</span>
          </div>
          <div class="stat-item">
            <label>Healing Given</label>
            <span>${summary.combat.healingGiven}</span>
          </div>
          <div class="stat-item">
            <label>Kills</label>
            <span>${summary.combat.kills}</span>
          </div>
          <div class="stat-item">
            <label>Critical Hits</label>
            <span>${summary.accuracy.criticalHits}</span>
          </div>
          <div class="stat-item">
            <label>Crit Rate</label>
            <span>${summary.accuracy.critRate}</span>
          </div>
        </div>
        <h4>This Session</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <label>Damage</label>
            <span>${summary.session.damageDealt}</span>
          </div>
          <div class="stat-item">
            <label>Healing</label>
            <span>${summary.session.healingGiven}</span>
          </div>
          <div class="stat-item">
            <label>Kills</label>
            <span>${summary.session.kills}</span>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Combat Stats Manager - Global tracker
 */
export class CombatStatsManager {
  static tokenStats = new Map();

  static getStats(token) {
    if (!this.tokenStats.has(token.id)) {
      this.tokenStats.set(token.id, new CombatStats(token));
    }
    return this.tokenStats.get(token.id);
  }

  static async recordDamage(attacker, target, amount) {
    if (attacker) {
      await this.getStats(attacker).recordDamage(amount, target);
    }
    if (target) {
      await this.getStats(target).recordDamageTaken(amount, attacker);
      
      // Check for kill
      if (target.actor?.system?.attributes?.hp?.value <= 0) {
        await this.getStats(attacker).recordKill(target);
      }
    }
  }

  static async recordHealing(healer, target, amount) {
    if (healer) {
      await this.getStats(healer).recordHealing(amount, target);
    }
    if (target) {
      const targetStats = this.getStats(target);
      targetStats.stats.healingReceived += amount;
      await targetStats.saveStats();
    }
  }

  static showStatsDialog(token) {
    const stats = this.getStats(token);
    
    new Dialog({
      title: `Combat Stats: ${token.name}`,
      content: stats.renderStatsDisplay(),
      buttons: {
        reset: {
          label: "Reset Session",
          callback: () => stats.resetSession()
        },
        close: {
          label: "Close"
        }
      }
    }).render(true);
  }
}

