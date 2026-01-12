/**
 * RNK™ Wasteland HUD - Animation Effects
 * Handles animations, transitions, and visual feedback
 * @module effects/animations
 */

import { DisplaySettings } from "../settings.js";

export class Animations {
  static animateFadeIn(container, duration = 300) {
    if (!DisplaySettings.get("enableAnimations")) {
      container.alpha = 1;
      return;
    }

    container.alpha = 0;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.alpha = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  static animateFadeOut(container, duration = 300, onComplete) {
    if (!DisplaySettings.get("enableAnimations")) {
      container.alpha = 0;
      if (onComplete) onComplete();
      return;
    }

    const startAlpha = container.alpha;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.alpha = startAlpha * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    animate();
  }

  static animatePulse(container) {
    if (!DisplaySettings.get("enableAnimations")) return;

    const originalAlpha = container.alpha;
    const duration = 1000;
    const startTime = Date.now();
    
    const animate = () => {
      if (!container || container.destroyed) return;
      
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      const pulse = Math.sin(progress * Math.PI * 2) * 0.2 + 1;
      container.alpha = originalAlpha * pulse;
      
      container.pulseAnimation = requestAnimationFrame(animate);
    };
    animate();
  }

  static stopPulse(container) {
    if (container.pulseAnimation) {
      cancelAnimationFrame(container.pulseAnimation);
      container.pulseAnimation = null;
    }
  }

  static animateDamage(container, amount) {
    if (!DisplaySettings.get("enableAnimations")) return;

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0xff0000, 0.5);
    overlay.drawRect(0, 0, container.width, container.height);
    overlay.endFill();
    
    container.addChild(overlay);
    
    this.animateFadeOut(overlay, 500, () => {
      if (overlay && !overlay.destroyed) {
        overlay.destroy();
      }
    });
    
    if (amount && amount > 0) {
      this.showFloatingNumber(container, -amount, "#ff0000");
    } else if (amount < 0) {
      this.showFloatingNumber(container, Math.abs(amount), "#00ff00");
    }
  }

  static showFloatingNumber(container, value, color = "#ffffff") {
    const text = new PIXI.Text(value > 0 ? `+${value}` : `${value}`, {
      fontSize: 20,
      fill: color,
      fontWeight: "bold",
      stroke: "#000000",
      strokeThickness: 3
    });
    
    text.anchor.set(0.5);
    text.x = container.width / 2;
    text.y = container.height / 2;
    
    container.addChild(text);
    
    const startTime = Date.now();
    const duration = 1500;
    const startY = text.y;
    
    const animate = () => {
      if (!text || text.destroyed) return;
      
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        text.y = startY - (progress * 50);
        text.alpha = 1 - progress;
        requestAnimationFrame(animate);
      } else {
        text.destroy();
      }
    };
    animate();
  }

  static applyDistanceFade(container, token) {
    const maxDistance = DisplaySettings.get("distanceFade");
    if (maxDistance === 0) {
      container.alpha = 1;
      return;
    }

    const controlledTokens = canvas.tokens.controlled;
    let minDistance = Infinity;
    
    if (controlledTokens.length > 0) {
      controlledTokens.forEach(controlled => {
        const distance = Math.sqrt(
          Math.pow(token.x - controlled.x, 2) + 
          Math.pow(token.y - controlled.y, 2)
        ) / canvas.grid.size;
        minDistance = Math.min(minDistance, distance);
      });
    } else {
      const centerX = canvas.stage.pivot.x;
      const centerY = canvas.stage.pivot.y;
      minDistance = Math.sqrt(
        Math.pow(token.x - centerX, 2) + 
        Math.pow(token.y - centerY, 2)
      ) / canvas.grid.size;
    }
    
    if (minDistance <= maxDistance) {
      container.alpha = 1;
    } else {
      const fadeDistance = maxDistance * 0.5;
      const fadeAmount = Math.max(0, 1 - ((minDistance - maxDistance) / fadeDistance));
      container.alpha = fadeAmount;
    }
  }
}
