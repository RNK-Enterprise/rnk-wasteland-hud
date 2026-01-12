/**
 * RNK™ Displays - Visual Effects Coordinator
 * Coordinates all visual effects modules
 * @author RNK™
 * @version 2.0.1
 */

import { DisplaySettings } from "./settings.js";
import { VISUAL_PRESETS } from "./effects/visual-presets.js";
import { Animations } from "./effects/animations.js";
import { ResourceDisplays } from "./effects/resource-displays.js";
import { ConditionIcons } from "./effects/conditions.js";

export class VisualEffects {
  static PRESETS = VISUAL_PRESETS;

  static applyPreset(container, presetName) {
    const preset = this.PRESETS[presetName] || this.PRESETS.classic;
    
    if (container.background) {
      container.background.clear();
      container.presetStyles = preset;
    }
    
    return preset;
  }

  static createBackground(width, height, preset, opacity = 0.7) {
    const bg = new PIXI.Graphics();
    const color = PIXI.utils.string2hex(preset.backgroundColor || "#000000");
    
    bg.beginFill(color, opacity);
    
    if (preset.borderStyle !== "none" && preset.borderWidth > 0) {
      const borderColor = PIXI.utils.string2hex(preset.borderColor || "#666666");
      bg.lineStyle(preset.borderWidth, borderColor, 1);
    }
    
    if (preset.borderRadius > 0) {
      bg.drawRoundedRect(0, 0, width, height, preset.borderRadius);
    } else {
      bg.drawRect(0, 0, width, height);
    }
    
    bg.endFill();
    return bg;
  }

  static createTextStyle(preset, fontSize = 16) {
    return new PIXI.TextStyle({
      fontFamily: preset.font || "Arial",
      fontSize: fontSize,
      fill: preset.textColor || "#ffffff",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 300,
      dropShadow: preset.shadow !== "none",
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowDistance: 2
    });
  }

  // Animation delegates
  static animateFadeIn(container, duration) {
    return Animations.animateFadeIn(container, duration);
  }

  static animateFadeOut(container, duration, onComplete) {
    return Animations.animateFadeOut(container, duration, onComplete);
  }

  static animatePulse(container) {
    return Animations.animatePulse(container);
  }

  static stopPulse(container) {
    return Animations.stopPulse(container);
  }

  static animateDamage(container, amount) {
    return Animations.animateDamage(container, amount);
  }

  static showFloatingNumber(container, value, color) {
    return Animations.showFloatingNumber(container, value, color);
  }

  static applyDistanceFade(container, token) {
    return Animations.applyDistanceFade(container, token);
  }

  // Resource display delegates
  static createProgressBar(width, height, percentage, color, showText) {
    return ResourceDisplays.createProgressBar(width, height, percentage, color, showText);
  }

  static createAdvancedResourceBar(resources, width, options) {
    return ResourceDisplays.createAdvancedResourceBar(resources, width, options);
  }

  static createSingleResourceBar(resource, width, options) {
    return ResourceDisplays.createSingleResourceBar(resource, width, options);
  }

  static createResourceIcon(iconName, size) {
    return ResourceDisplays.createResourceIcon(iconName, size);
  }

  static createSpellSlotDisplay(current, max, level, width) {
    return ResourceDisplays.createSpellSlotDisplay(current, max, level, width);
  }

  static createPointDisplay(current, max, width, options) {
    return ResourceDisplays.createPointDisplay(current, max, width, options);
  }

  // Condition delegates
  static createConditionIcon(condition, size) {
    return ConditionIcons.createConditionIcon(condition, size);
  }
}


