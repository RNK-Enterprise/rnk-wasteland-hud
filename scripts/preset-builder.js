/**
 * Visual Preset Builder UI
 * Drag-and-drop theme creator with live preview
 * @module PresetBuilder
 */

import { DisplaySettings } from "./settings.js";

/**
 * Preset Builder Application
 * @class PresetBuilderApp
 * @extends Application
 */
export class PresetBuilderApp extends Application {
  constructor(options = {}) {
    super(options);
    
    this.preset = options.preset || this.getDefaultPreset();
    this.previewToken = null;
    this.previewDisplay = null;
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "preset-builder",
      template: "modules/rnk-wasteland-hud/templates/preset-builder.html",
      width: 900,
      height: 700,
      title: "RNK Wasteland HUD - Preset Builder",
      resizable: true,
      classes: ["rnk-wasteland-hud", "preset-builder"],
      tabs: [{navSelector: ".tabs", contentSelector: ".content", initial: "colors"}]
    });
  }
  
  /**
   * Get default preset template
   */
  getDefaultPreset() {
    return {
      id: "custom-" + Date.now(),
      name: "Custom Preset",
      backgroundColor: "#2a2a2a",
      textColor: "#ffffff",
      borderColor: "#666666",
      borderWidth: 2,
      borderRadius: 8,
      shadowColor: "#000000",
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      gradient: "none",
      gradientColor1: "#2a2a2a",
      gradientColor2: "#1a1a1a",
      gradientAngle: 135,
      opacity: 0.9,
      fontFamily: "Arial, sans-serif",
      fontSize: 14,
      fontWeight: "normal",
      animation: "none",
      particleEffect: "none"
    };
  }
  
  /**
   * Prepare data for template
   */
  getData() {
    return {
      preset: this.preset,
      animations: [
        "none",
        "Display-fade-in",
        "Display-pulse",
        "Display-glow-pulse",
        "Display-float",
        "Display-rotate",
        "Display-shake"
      ],
      particleEffects: [
        "none",
        "fire",
        "ice",
        "lightning",
        "nature",
        "shadow",
        "holy",
        "poison"
      ],
      fontFamilies: [
        "Arial, sans-serif",
        "Times New Roman, serif",
        "Courier New, monospace",
        "Georgia, serif",
        "Verdana, sans-serif",
        "Impact, fantasy",
        "Comic Sans MS, cursive"
      ],
      gradientTypes: [
        "none",
        "linear",
        "radial"
      ]
    };
  }
  
  /**
   * Activate listeners
   */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Color pickers
    html.find('input[type="color"]').change(this._onColorChange.bind(this));
    
    // Number inputs
    html.find('input[type="number"]').change(this._onNumberChange.bind(this));
    
    // Range sliders
    html.find('input[type="range"]').on("input", this._onRangeChange.bind(this));
    
    // Select dropdowns
    html.find("select").change(this._onSelectChange.bind(this));
    
    // Text inputs
    html.find('input[type="text"]').change(this._onTextChange.bind(this));
    
    // Buttons
    html.find(".save-preset").click(this._onSavePreset.bind(this));
    html.find(".export-preset").click(this._onExportPreset.bind(this));
    html.find(".import-preset").click(this._onImportPreset.bind(this));
    html.find(".reset-preset").click(this._onResetPreset.bind(this));
    html.find(".apply-to-selected").click(this._onApplyToSelected.bind(this));
    
    // Initialize preview
    this._updatePreview(html);
  }
  
  /**
   * Color picker changed
   */
  _onColorChange(event) {
    const input = event.currentTarget;
    const property = input.dataset.property;
    this.preset[property] = input.value;
    this._updatePreview(this.element);
  }
  
  /**
   * Number input changed
   */
  _onNumberChange(event) {
    const input = event.currentTarget;
    const property = input.dataset.property;
    this.preset[property] = parseFloat(input.value);
    this._updatePreview(this.element);
  }
  
  /**
   * Range slider changed
   */
  _onRangeChange(event) {
    const input = event.currentTarget;
    const property = input.dataset.property;
    const value = parseFloat(input.value);
    this.preset[property] = value;
    
    // Update display value
    const display = this.element.find(`#${input.id}-value`);
    if (display.length) {
      display.text(value);
    }
    
    this._updatePreview(this.element);
  }
  
  /**
   * Select dropdown changed
   */
  _onSelectChange(event) {
    const select = event.currentTarget;
    const property = select.dataset.property;
    this.preset[property] = select.value;
    this._updatePreview(this.element);
  }
  
  /**
   * Text input changed
   */
  _onTextChange(event) {
    const input = event.currentTarget;
    const property = input.dataset.property;
    this.preset[property] = input.value;
    this._updatePreview(this.element);
  }
  
  /**
   * Update live preview
   */
  _updatePreview(html) {
    const preview = html.find(".preview-container");
    if (!preview.length) return;
    
    // Generate CSS for preview
    const css = this._generateCSS();
    
    // Update preview style
    const previewBox = preview.find(".preview-Display");
    if (previewBox.length) {
      previewBox.attr("style", css);
    }
  }
  
  /**
   * Generate CSS from preset
   */
  _generateCSS() {
    const p = this.preset;
    let css = "";
    
    // Background
    if (p.gradient !== "none") {
      if (p.gradient === "linear") {
        css += `background: linear-gradient(${p.gradientAngle}deg, ${p.gradientColor1}, ${p.gradientColor2});`;
      } else if (p.gradient === "radial") {
        css += `background: radial-gradient(circle, ${p.gradientColor1}, ${p.gradientColor2});`;
      }
    } else {
      css += `background-color: ${p.backgroundColor};`;
    }
    
    // Text
    css += `color: ${p.textColor};`;
    css += `font-family: ${p.fontFamily};`;
    css += `font-size: ${p.fontSize}px;`;
    css += `font-weight: ${p.fontWeight};`;
    
    // Border
    css += `border: ${p.borderWidth}px solid ${p.borderColor};`;
    css += `border-radius: ${p.borderRadius}px;`;
    
    // Shadow
    css += `box-shadow: ${p.shadowOffsetX}px ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor};`;
    
    // Opacity
    css += `opacity: ${p.opacity};`;
    
    // Animation
    if (p.animation !== "none") {
      css += `animation: ${p.animation} 2s ease-in-out infinite;`;
    }
    
    return css;
  }
  
  /**
   * Save preset
   */
  async _onSavePreset(event) {
    event.preventDefault();
    
    const name = this.preset.name || "Custom Preset";
    
    // Save to game settings
    const savedPresets = game.settings.get("rnk-wasteland-hud", "customPresets") || {};
    savedPresets[this.preset.id] = this.preset;
    
    await game.settings.set("rnk-wasteland-hud", "customPresets", savedPresets);
    
    ui.notifications.info(`Preset "${name}" saved!`);
  }
  
  /**
   * Export preset as JSON
   */
  _onExportPreset(event) {
    event.preventDefault();
    
    const json = JSON.stringify(this.preset, null, 2);
    const filename = `${this.preset.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    // Create download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    ui.notifications.info("Preset exported!");
  }
  
  /**
   * Import preset from JSON
   */
  _onImportPreset(event) {
    event.preventDefault();
    
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const preset = JSON.parse(event.target.result);
          this.preset = preset;
          this.render(true);
          ui.notifications.info("Preset imported!");
        } catch (error) {
          ui.notifications.error("Invalid preset file!");
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }
  
  /**
   * Reset to default
   */
  _onResetPreset(event) {
    event.preventDefault();
    
    Dialog.confirm({
      title: "Reset Preset",
      content: "<p>Reset to default values?</p>",
      yes: () => {
        this.preset = this.getDefaultPreset();
        this.render(true);
      }
    });
  }
  
  /**
   * Apply to selected tokens
   */
  async _onApplyToSelected(event) {
    event.preventDefault();
    
    const tokens = canvas.tokens.controlled;
    if (tokens.length === 0) {
      ui.notifications.warn("No tokens selected!");
      return;
    }
    
    for (const token of tokens) {
      await DisplaySettings.setFlag(token.document, "config", {
        preset: this.preset.id,
        customPreset: this.preset
      });
      
      if (token.Display) {
        token.Display.draw();
      }
    }
    
    ui.notifications.info(`Preset applied to ${tokens.length} token(s)!`);
  }
}

/**
 * Preset Builder Manager
 */
export class PresetBuilderManager {
  static app = null;
  
  /**
   * Open preset builder
   */
  static open(preset = null) {
    if (this.app) {
      this.app.close();
    }
    
    this.app = new PresetBuilderApp({ preset });
    this.app.render(true);
  }
  
  /**
   * Close preset builder
   */
  static close() {
    if (this.app) {
      this.app.close();
      this.app = null;
    }
  }
  
  /**
   * Get custom presets
   */
  static getCustomPresets() {
    return game.settings.get("rnk-wasteland-hud", "customPresets") || {};
  }
  
  /**
   * Delete custom preset
   */
  static async deletePreset(presetId) {
    const presets = this.getCustomPresets();
    delete presets[presetId];
    await game.settings.set("rnk-wasteland-hud", "customPresets", presets);
  }
}

/**
 * Setup preset builder
 */
export function setupPresetBuilder() {
  console.log("RNK™ Wasteland HUD | Preset Builder initialized");
  
  // Register setting for custom presets
  game.settings.register("rnk-wasteland-hud", "customPresets", {
    name: "Custom Presets",
    hint: "Saved custom visual presets",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
  
  // Add chat command
  Hooks.on("chatMessage", (log, message) => {
    if (message === "/preset-builder" || message === "/presets") {
      PresetBuilderManager.open();
      return false;
    }
  });
  
  // Add to controls
  Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find(c => c.name === "token");
    if (tokenControls && game.user.isGM) {
      tokenControls.tools.push({
        name: "preset-builder",
        title: "Preset Builder",
        icon: "fas fa-palette",
        button: true,
        onClick: () => PresetBuilderManager.open()
      });
    }
  });
}

// Export for global access
window.PresetBuilderManager = PresetBuilderManager;

