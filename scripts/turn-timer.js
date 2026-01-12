/**
 * Turn Timer & Combat Tracking
 * Countdown timer with visual warnings
 * @module TurnTimer
 */

/**
 * Turn Timer Display
 * @class TurnTimer
 * @extends PIXI.Container
 */
export class TurnTimer extends PIXI.Container {
  constructor(duration = 60, options = {}) {
    super();
    
    this.totalDuration = duration;
    this.remaining = duration;
    this.isPaused = false;
    this.radius = options.radius || 30;
    this.showNumbers = options.showNumbers !== false;
    this.playSounds = options.playSounds !== false;
    
    this.circle = null;
    this.progressRing = null;
    this.textElement = null;
    this.lastUpdate = Date.now();
    this.warningPlayed = false;
    this.criticalPlayed = false;
    
    this.createTimer();
    this.start();
  }
  
  /**
   * Create timer visual
   */
  createTimer() {
    const radius = this.radius;
    
    // Background circle
    this.circle = new PIXI.Graphics();
    this.circle.lineStyle(3, 0x333333, 1);
    this.circle.beginFill(0x1a1a1a, 0.8);
    this.circle.drawCircle(0, 0, radius);
    this.circle.endFill();
    
    // Progress ring
    this.progressRing = new PIXI.Graphics();
    
    // Time text
    if (this.showNumbers) {
      const style = new PIXI.TextStyle({
        fontFamily: "Arial, sans-serif",
        fontSize: 18,
        fontWeight: "bold",
        fill: 0xFFFFFF,
        align: "center"
      });
      
      this.textElement = new PIXI.Text(this.formatTime(this.remaining), style);
      this.textElement.anchor.set(0.5);
    }
    
    this.addChild(this.circle);
    this.addChild(this.progressRing);
    if (this.textElement) this.addChild(this.textElement);
    
    this.updateVisual();
  }
  
  /**
   * Format time as MM:SS or SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  }
  
  /**
   * Update visual appearance based on remaining time
   */
  updateVisual() {
    const progress = this.remaining / this.totalDuration;
    const radius = this.radius;
    
    // Determine color based on time remaining
    let color;
    if (progress > 0.5) {
      color = 0x00FF00; // Green
    } else if (progress > 0.25) {
      color = 0xFFFF00; // Yellow
    } else {
      color = 0xFF0000; // Red
    }
    
    // Draw progress ring
    this.progressRing.clear();
    this.progressRing.lineStyle(4, color, 1);
    
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (progress * Math.PI * 2);
    
    this.progressRing.arc(0, 0, radius - 2, startAngle, endAngle);
    
    // Update text
    if (this.textElement) {
      this.textElement.text = this.formatTime(this.remaining);
      this.textElement.style.fill = color;
    }
    
    // Pulse animation when low
    if (progress <= 0.25 && !this.isPaused) {
      this.startPulse();
    }
    
    // Play warning sounds
    if (this.playSounds) {
      if (progress <= 0.25 && !this.criticalPlayed) {
        this.playWarning("critical");
        this.criticalPlayed = true;
      } else if (progress <= 0.5 && !this.warningPlayed) {
        this.playWarning("warning");
        this.warningPlayed = true;
      }
    }
  }
  
  /**
   * Start pulse animation
   */
  startPulse() {
    if (this._pulsing) return;
    this._pulsing = true;
    
    const pulse = () => {
      if (!this._pulsing || this.remaining <= 0) {
        this.scale.set(1);
        this._pulsing = false;
        return;
      }
      
      const time = Date.now() / 1000;
      const scale = 1 + Math.sin(time * 8) * 0.1;
      this.scale.set(scale);
      
      requestAnimationFrame(pulse);
    };
    
    pulse();
  }
  
  /**
   * Play warning sound
   */
  playWarning(type) {
    if (!this.playSounds) return;
    
    // Use Foundry's audio system
    const sounds = {
      warning: "sounds/notify.wav",
      critical: "sounds/dice.wav"
    };
    
    const sound = sounds[type];
    if (sound) {
      AudioHelper.play({ src: sound, volume: 0.5 });
    }
  }
  
  /**
   * Start the timer
   */
  start() {
    if (this._interval) return;
    
    this.isPaused = false;
    this.lastUpdate = Date.now();
    
    this._interval = setInterval(() => {
      if (this.isPaused) return;
      
      const now = Date.now();
      const delta = (now - this.lastUpdate) / 1000;
      this.lastUpdate = now;
      
      this.remaining -= delta;
      
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.stop();
        this.onExpire();
      }
      
      this.updateVisual();
    }, 100);
  }
  
  /**
   * Pause the timer
   */
  pause() {
    this.isPaused = true;
  }
  
  /**
   * Resume the timer
   */
  resume() {
    this.isPaused = false;
    this.lastUpdate = Date.now();
  }
  
  /**
   * Stop the timer
   */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._pulsing = false;
  }
  
  /**
   * Reset the timer
   */
  reset(duration = null) {
    if (duration !== null) {
      this.totalDuration = duration;
    }
    this.remaining = this.totalDuration;
    this.warningPlayed = false;
    this.criticalPlayed = false;
    this.updateVisual();
  }
  
  /**
   * Called when timer expires
   */
  onExpire() {
    // Flash red
    this.circle.tint = 0xFF0000;
    
    // Play expiration sound
    if (this.playSounds) {
      AudioHelper.play({ src: "sounds/notify.wav", volume: 0.8 });
    }
    
    // Emit event
    this.emit("expired");
    
    // Reset tint after flash
    setTimeout(() => {
      if (this.circle) this.circle.tint = 0xFFFFFF;
    }, 500);
  }
  
  /**
   * Add time to timer
   */
  addTime(seconds) {
    this.remaining = Math.min(this.remaining + seconds, this.totalDuration);
    this.updateVisual();
  }
  
  /**
   * Cleanup
   */
  destroy(options) {
    this.stop();
    if (this.circle) this.circle.destroy();
    if (this.progressRing) this.progressRing.destroy();
    if (this.textElement) this.textElement.destroy();
    super.destroy(options);
  }
}

/**
 * Turn Timer Manager
 * Manages timers for combat
 */
export class TurnTimerManager {
  static timers = new Map(); // combatantId -> timer
  static defaultDuration = 60;
  
  /**
   * Start timer for active combatant
   */
  static startForCombatant(combatant, duration = null) {
    const token = canvas.tokens.get(combatant.tokenId);
    if (!token || !token.Display) return;
    
    // Clear existing timer
    this.clearForCombatant(combatant);
    
    // Create new timer
    const timerDuration = duration || this.defaultDuration;
    const timer = new TurnTimer(timerDuration, {
      radius: 25,
      showNumbers: true,
      playSounds: true
    });
    
    // Add to Display
    token.Display.addChild(timer);
    
    // Position in corner
    timer.x = token.Display.background.width - 35;
    timer.y = 35;
    
    // Track timer
    this.timers.set(combatant.id, { timer, token });
    
    // Handle expiration
    timer.on("expired", () => {
      ui.notifications.warn(`${combatant.name}'s turn has expired!`);
      
      // Auto-skip option
      if (game.settings.get("rnk-wasteland-hud", "autoSkipExpired")) {
        game.combat?.nextTurn();
      }
    });
    
    return timer;
  }
  
  /**
   * Clear timer for combatant
   */
  static clearForCombatant(combatant) {
    const data = this.timers.get(combatant.id);
    if (data) {
      data.timer.destroy();
      this.timers.delete(combatant.id);
    }
  }
  
  /**
   * Clear all timers
   */
  static clearAll() {
    this.timers.forEach((data, id) => {
      data.timer.destroy();
    });
    this.timers.clear();
  }
  
  /**
   * Pause all timers
   */
  static pauseAll() {
    this.timers.forEach((data) => {
      data.timer.pause();
    });
  }
  
  /**
   * Resume all timers
   */
  static resumeAll() {
    this.timers.forEach((data) => {
      data.timer.resume();
    });
  }
  
  /**
   * Get timer for combatant
   */
  static getTimer(combatant) {
    const data = this.timers.get(combatant.id);
    return data ? data.timer : null;
  }
}

/**
 * Setup turn timer integration
 */
export function setupTurnTimer() {
  console.log("RNK™ Wasteland HUD | Turn Timer initialized");
  
  // Register settings
  game.settings.register("rnk-wasteland-hud", "turnTimerDuration", {
    name: "Turn Timer Duration",
    hint: "Default duration for turn timers in seconds",
    scope: "world",
    config: true,
    type: Number,
    default: 60,
    onChange: (value) => {
      TurnTimerManager.defaultDuration = value;
    }
  });
  
  game.settings.register("rnk-wasteland-hud", "autoSkipExpired", {
    name: "Auto-Skip Expired Turns",
    hint: "Automatically skip to next turn when timer expires",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  
  game.settings.register("rnk-wasteland-hud", "enableTurnTimer", {
    name: "Enable Turn Timer",
    hint: "Show countdown timer during combat",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  
  // Update default duration
  TurnTimerManager.defaultDuration = game.settings.get("rnk-wasteland-hud", "turnTimerDuration");
  
  // Hook into combat updates
  Hooks.on("updateCombat", (combat, changed, options, userId) => {
    if (!game.settings.get("rnk-wasteland-hud", "enableTurnTimer")) return;
    if (changed.turn === undefined) return;
    
    // Clear all existing timers
    TurnTimerManager.clearAll();
    
    // Start timer for new active combatant
    const combatant = combat.combatant;
    if (combatant) {
      TurnTimerManager.startForCombatant(combatant);
    }
  });
  
  // Combat start
  Hooks.on("combatStart", (combat) => {
    if (!game.settings.get("rnk-wasteland-hud", "enableTurnTimer")) return;
    
    const combatant = combat.combatant;
    if (combatant) {
      TurnTimerManager.startForCombatant(combatant);
    }
  });
  
  // Combat end
  Hooks.on("combatEnd", (combat) => {
    TurnTimerManager.clearAll();
  });
  
  // Add chat command
  Hooks.on("chatMessage", (log, message, data) => {
    if (message.startsWith("/timer")) {
      const args = message.split(" ");
      const command = args[1];
      
      if (!game.combat || !game.combat.combatant) {
        ui.notifications.warn("No active combatant!");
        return false;
      }
      
      const combatant = game.combat.combatant;
      const timer = TurnTimerManager.getTimer(combatant);
      
      switch(command) {
        case "reset":
          if (timer) {
            timer.reset();
            ui.notifications.info("Timer reset!");
          }
          return false;
          
        case "pause":
          if (timer) {
            timer.pause();
            ui.notifications.info("Timer paused!");
          }
          return false;
          
        case "resume":
          if (timer) {
            timer.resume();
            ui.notifications.info("Timer resumed!");
          }
          return false;
          
        case "add":
          const seconds = parseInt(args[2]) || 30;
          if (timer) {
            timer.addTime(seconds);
            ui.notifications.info(`Added ${seconds} seconds!`);
          }
          return false;
      }
    }
  });
}

// Export for global access
window.TurnTimerManager = TurnTimerManager;

