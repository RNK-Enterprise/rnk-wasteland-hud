/**
 * Cinematic Effects
 * Camera shake, screen flash, slow motion, spotlight, and zoom effects
 * @module cinematic
 */

/**
 * Cinematic Effects Manager
 */
export class CinematicEffects {
  static isShaking = false;
  static originalPosition = null;
  static slowMotionActive = false;
  static originalSpeed = 1;

  /**
   * Camera shake effect
   */
  static async cameraShake(duration = 500, intensity = 10) {
    if (this.isShaking) return;

    this.isShaking = true;
    this.originalPosition = {
      x: canvas.stage.pivot.x,
      y: canvas.stage.pivot.y
    };

    const startTime = Date.now();
    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Reset to original position
        canvas.stage.pivot.set(this.originalPosition.x, this.originalPosition.y);
        this.isShaking = false;
        return;
      }

      // Decrease intensity over time
      const currentIntensity = intensity * (1 - progress);
      
      // Random offset
      const offsetX = (Math.random() - 0.5) * currentIntensity;
      const offsetY = (Math.random() - 0.5) * currentIntensity;

      canvas.stage.pivot.set(
        this.originalPosition.x + offsetX,
        this.originalPosition.y + offsetY
      );

      requestAnimationFrame(shake);
    };

    shake();
  }

  /**
   * Screen flash effect
   */
  static async screenFlash(color = 0xffffff, duration = 300, intensity = 0.8) {
    const flash = new PIXI.Graphics();
    flash.beginFill(color, intensity);
    flash.drawRect(0, 0, window.innerWidth, window.innerHeight);
    flash.endFill();
    flash.zIndex = 10000;

    canvas.stage.addChild(flash);

    // Fade out
    await this._animate(duration, (progress) => {
      flash.alpha = intensity * (1 - progress);
    });

    canvas.stage.removeChild(flash);
    flash.destroy();
  }

  /**
   * Slow motion effect
   */
  static slowMotion(duration = 2000, speed = 0.3) {
    if (this.slowMotionActive) return;

    this.slowMotionActive = true;
    this.originalSpeed = canvas.app.ticker.speed;
    
    // Slow down
    canvas.app.ticker.speed = speed;

    // Show indicator
    ui.notifications.info("Slow Motion Active");

    setTimeout(() => {
      // Return to normal
      canvas.app.ticker.speed = this.originalSpeed;
      this.slowMotionActive = false;
      ui.notifications.info("Normal Speed Restored");
    }, duration);
  }

  /**
   * Spotlight effect on token
   */
  static spotlight(token, duration = 3000, radius = 200) {
    // Create dark overlay
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, window.innerWidth * 2, window.innerHeight * 2);
    overlay.endFill();

    // Create spotlight hole
    const spotlight = new PIXI.Graphics();
    spotlight.beginFill(0xffffff, 1);
    spotlight.drawCircle(0, 0, radius);
    spotlight.endFill();

    // Position at token
    const pos = token.center;
    spotlight.position.set(pos.x, pos.y);

    // Use spotlight as mask
    overlay.mask = spotlight;
    overlay.zIndex = 9999;

    canvas.stage.addChild(overlay);
    canvas.stage.addChild(spotlight);

    // Pulse animation
    let time = 0;
    const pulse = (delta) => {
      time += delta * 0.05;
      spotlight.scale.set(1 + Math.sin(time) * 0.1);
    };

    canvas.app.ticker.add(pulse);

    // Remove after duration
    setTimeout(() => {
      canvas.app.ticker.remove(pulse);
      canvas.stage.removeChild(overlay);
      canvas.stage.removeChild(spotlight);
      overlay.destroy();
      spotlight.destroy();
    }, duration);
  }

  /**
   * Zoom to token
   */
  static async zoomTo(token, scale = 2, duration = 1000) {
    const targetX = token.center.x;
    const targetY = token.center.y;
    const targetScale = scale;

    const startX = canvas.stage.pivot.x;
    const startY = canvas.stage.pivot.y;
    const startScale = canvas.stage.scale.x;

    await this._animate(duration, (progress) => {
      // Ease in-out
      const eased = this._easeInOutCubic(progress);

      // Interpolate position
      const x = startX + (targetX - startX) * eased;
      const y = startY + (targetY - startY) * eased;
      const scale = startScale + (targetScale - startScale) * eased;

      canvas.stage.pivot.set(x, y);
      canvas.stage.scale.set(scale);
    });
  }

  /**
   * Freeze frame effect
   */
  static async freezeFrame(duration = 1000) {
    // Capture current frame
    const texture = canvas.app.renderer.generateTexture(canvas.stage);
    const sprite = new PIXI.Sprite(texture);
    sprite.zIndex = 10000;

    canvas.stage.addChild(sprite);

    // Pause game
    const wasPlaying = game.paused;
    game.togglePause(true);

    await new Promise(resolve => setTimeout(resolve, duration));

    // Unpause
    if (!wasPlaying) {
      game.togglePause(false);
    }

    // Remove freeze frame
    canvas.stage.removeChild(sprite);
    sprite.destroy();
    texture.destroy();
  }

  /**
   * Vignette effect
   */
  static vignette(intensity = 0.5, duration = 2000) {
    const vignette = new PIXI.Graphics();
    
    // Create radial gradient effect
    const gradient = vignette.beginFill(0x000000, 0);
    vignette.drawRect(0, 0, window.innerWidth, window.innerHeight);
    vignette.endFill();

    // Apply vignette filter
    const filter = new PIXI.filters.VignetteFilter({
      radius: 0.8,
      strength: intensity
    });
    canvas.stage.filters = canvas.stage.filters || [];
    canvas.stage.filters.push(filter);

    // Remove after duration
    if (duration > 0) {
      setTimeout(() => {
        const index = canvas.stage.filters.indexOf(filter);
        if (index > -1) {
          canvas.stage.filters.splice(index, 1);
        }
      }, duration);
    }

    return filter;
  }

  /**
   * Blur effect
   */
  static blur(amount = 10, duration = 1000) {
    const filter = new PIXI.filters.BlurFilter(amount);
    canvas.stage.filters = canvas.stage.filters || [];
    canvas.stage.filters.push(filter);

    if (duration > 0) {
      setTimeout(() => {
        const index = canvas.stage.filters.indexOf(filter);
        if (index > -1) {
          canvas.stage.filters.splice(index, 1);
        }
      }, duration);
    }

    return filter;
  }

  /**
   * Color filter effect
   */
  static colorFilter(color = 0xff0000, intensity = 0.3, duration = 500) {
    const filter = new PIXI.filters.ColorMatrixFilter();
    
    // Apply color tint
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    
    filter.brightness(1 + intensity, false);
    filter.tint(color, false);

    canvas.stage.filters = canvas.stage.filters || [];
    canvas.stage.filters.push(filter);

    if (duration > 0) {
      setTimeout(() => {
        const index = canvas.stage.filters.indexOf(filter);
        if (index > -1) {
          canvas.stage.filters.splice(index, 1);
        }
      }, duration);
    }

    return filter;
  }

  /**
   * Combo effect: Critical hit
   */
  static criticalHit(token) {
    this.cameraShake(300, 15);
    this.screenFlash(0xffff00, 200, 0.5);
    this.slowMotion(800, 0.5);
    this.spotlight(token, 1000, 150);
  }

  /**
   * Combo effect: Death blow
   */
  static deathBlow(token) {
    this.cameraShake(500, 20);
    this.screenFlash(0xff0000, 300, 0.7);
    this.slowMotion(1500, 0.3);
    this.vignette(0.8, 2000);
  }

  /**
   * Combo effect: Level up
   */
  static levelUp(token) {
    this.screenFlash(0x00ff00, 500, 0.4);
    this.spotlight(token, 3000, 250);
    this.zoomTo(token, 1.5, 1000);
  }

  /**
   * Helper: Animation loop
   */
  static _animate(duration, callback) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        callback(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Helper: Easing function
   */
  static _easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

/**
 * Setup function
 */
export function setupCinematicEffects() {
  console.log("RNK Wasteland HUD | Cinematic effects initialized");

  // Register settings
  game.settings.register("rnk-wasteland-hud", "enableCinematicEffects", {
    name: "Enable Cinematic Effects",
    hint: "Enable camera shake, flashes, and other cinematic effects",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("rnk-wasteland-hud", "cinematicOnCrit", {
    name: "Cinematic on Critical Hit",
    hint: "Trigger cinematic effects on critical hits",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Trigger on critical hit
  Hooks.on("dnd5e.rollAttack", (item, roll) => {
    if (!game.settings.get("rnk-wasteland-hud", "enableCinematicEffects")) return;
    if (!game.settings.get("rnk-wasteland-hud", "cinematicOnCrit")) return;

    if (roll.dice[0].total === 20) {
      const token = item.actor.getActiveTokens()[0];
      if (token) {
        CinematicEffects.criticalHit(token);
      }
    }
  });

  // Trigger on token death
  Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (!game.settings.get("rnk-wasteland-hud", "enableCinematicEffects")) return;

    if ("system.attributes.hp.value" in changes) {
      const newHP = changes.system.attributes.hp.value;
      
      if (newHP <= 0 && actor.system.attributes.hp.value > 0) {
        const token = actor.getActiveTokens()[0];
        if (token) {
          CinematicEffects.deathBlow(token);
        }
      }
    }
  });

  // Chat commands
  Hooks.on("chatMessage", (log, message, data) => {
    if (!message.startsWith("/cinematic")) return true;

    const args = message.split(" ");
    const effect = args[1];
    const tokens = canvas.tokens.controlled;

    if (tokens.length === 0 && !["shake", "flash", "slow"].includes(effect)) {
      ui.notifications.warn("Select a token first");
      return false;
    }

    const token = tokens[0];

    switch (effect) {
      case "shake":
        const intensity = parseInt(args[2]) || 10;
        CinematicEffects.cameraShake(500, intensity);
        break;

      case "flash":
        const color = args[2] || "ffffff";
        CinematicEffects.screenFlash(parseInt(color, 16), 300, 0.8);
        break;

      case "slow":
        const duration = parseInt(args[2]) || 2000;
        CinematicEffects.slowMotion(duration, 0.3);
        break;

      case "spotlight":
        CinematicEffects.spotlight(token, 3000, 200);
        break;

      case "zoom":
        const scale = parseFloat(args[2]) || 2;
        CinematicEffects.zoomTo(token, scale, 1000);
        break;

      case "freeze":
        CinematicEffects.freezeFrame(1000);
        break;

      case "vignette":
        CinematicEffects.vignette(0.5, 2000);
        break;

      case "blur":
        CinematicEffects.blur(10, 1000);
        break;

      case "crit":
        CinematicEffects.criticalHit(token);
        break;

      case "death":
        CinematicEffects.deathBlow(token);
        break;

      case "levelup":
        CinematicEffects.levelUp(token);
        break;

      default:
        ui.notifications.info("Usage: /cinematic [shake|flash|slow|spotlight|zoom|freeze|vignette|blur|crit|death|levelup]");
    }

    return false;
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  CinematicEffects
});


