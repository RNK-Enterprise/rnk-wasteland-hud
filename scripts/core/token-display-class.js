/**
 * RNK™ Wasteland HUD - TokenDisplay Core Class
 * Main display class for token Displays
 * @author RNK™
 * @version 2.0.1
 */

import { DisplaySettings } from "../settings.js";
import { SystemIntegration } from "../system-integration.js";
import { VisualEffects } from "../visual-effects.js";
import { DisplayTemplateManager } from "../templates.js";
import { RadialMenu } from "../radial-menu.js";
import { ParticleSystem, MagicCircle } from "../particle-system.js";
import { CombatStatsManager } from "../combat-stats.js";
import { ClickToRoll } from "../click-to-roll.js";
import { DisplayConfigApp } from "../config-app.js";
import { DisplayContentParser } from "./token-display-content.js";

/**
 * Main Display Display Class
 */
export class TokenDisplay extends PIXI.Container {
  constructor(token) {
    super();
    this.token = token;
    this.config = null;
    this.textElement = null;
    this.background = null;
    this.progressBars = [];
    this.conditionIcons = [];
    this.isDragging = false;
    this.customOffset = {x: 0, y: 0};
    this.lastHPValue = null;
    
    // Advanced features
    this.radialMenu = null;
    this.particleSystem = null;
    this.magicCircle = null;
    this.combatStats = null;
    
    // CRITICAL: Setup PIXI interactivity for independent clickable element
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.interactive = true;
    this.interactiveChildren = false;
    this.sortableChildren = true;
    
    // Make this display render on top and be independently clickable
    this.zIndex = 10000;
    
    // Set name for debugging
    this.name = `RNK_Display_${token.id}`;
    
    this._setupInteractivity();
    this.draw();
  }

  _setupInteractivity() {
    // Click to open actor sheet
    this.on('click', (event) => {
      event.stopPropagation();
      const config = this.getConfig();
      if (config.clickToOpen && this.token.actor?.sheet?.render) {
        this.token.actor.sheet.render(true);
      }
    });

    // Right-click for options (GM only)
    this.on('rightclick', (event) => {
      event.stopPropagation();
      if (!game.user.isGM) return;
      this._showQuickMenu(event);
    });

    // Double-click for config (GM only)
    this.on('dblclick', (event) => {
      event.stopPropagation();
      if (game.user.isGM) {
        new DisplayConfigApp(this.token).render(true);
      }
    });

    // Drag functionality
    this.on('pointerdown', this._onDragStart.bind(this));
    this.on('pointerup', this._onDragEnd.bind(this));
    this.on('pointerupoutside', this._onDragEnd.bind(this));
    this.on('pointermove', this._onDragMove.bind(this));

    // Hover effects
    this.on('pointerover', this._onHoverStart.bind(this));
    this.on('pointerout', this._onHoverEnd.bind(this));
  }

  _onDragStart(event) {
    const config = this.getConfig();
    if (!config.allowDrag || !game.user.isGM) return;
    
    event.stopPropagation();
    this.isDragging = true;
    this.dragData = event.data.getLocalPosition(this.parent);
    this.alpha = 0.5;
    this.cursor = 'grabbing';
  }

  _onDragEnd(event) {
    if (!this.isDragging) return;
    
    event.stopPropagation();
    this.isDragging = false;
    this.alpha = 1;
    this.cursor = 'pointer';
    
    this._saveCustomOffset();
  }

  _onDragMove(event) {
    if (!this.isDragging) return;
    
    event.stopPropagation();
    const newPosition = event.data.getLocalPosition(this.parent);
    
    // Move display directly to new position
    this.x = newPosition.x;
    this.y = newPosition.y;
  }

  async _saveCustomOffset() {
    // Save absolute position as waypoint
    await DisplaySettings.setFlag(this.token.document, "displayPosition", {
      x: this.x,
      y: this.y
    });
  }

  _onHoverStart() {
    const config = this.getConfig();
    if (config.showOnHover) {
      this._showDetailedTooltip();
    }
    
    if (DisplaySettings.get("enableAnimations")) {
      this.scale.set(1.05);
    }
  }

  _onHoverEnd() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
    
    this.scale.set(1);
  }

  _showDetailedTooltip() {
    if (!this.token.actor) return;
    
    const actorData = SystemIntegration.getActorData(this.token.actor);
    let tooltipText = `${actorData.name}\n`;
    
    if (actorData.class) tooltipText += `${actorData.class}`;
    if (actorData.level) tooltipText += ` Level ${actorData.level}\n`;
    if (actorData.hp) tooltipText += `HP: ${actorData.hp.value}/${actorData.hp.max}\n`;
    if (actorData.ac) tooltipText += `AC: ${actorData.ac}`;
    
    this.tooltip = new PIXI.Text(tooltipText, {
      fontSize: 12,
      fill: "#ffffff",
      backgroundColor: "#000000",
      padding: 5
    });
    
    this.tooltip.x = this.width + 10;
    this.tooltip.y = 0;
    this.addChild(this.tooltip);
  }

  _showQuickMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Use Foundry's Dialog instead of ContextMenu for better compatibility
    const buttons = {
      configure: {
        icon: '<i class="fas fa-cog"></i>',
        label: "Configure Display",
        callback: () => new DisplayConfigApp(this.token).render(true)
      },
      toggle: {
        icon: '<i class="fas fa-eye"></i>',
        label: "Toggle Visibility",
        callback: async () => {
          const config = this.getConfig();
          await DisplaySettings.setFlag(this.token.document, "config", {
            ...config,
            enabled: !config.enabled
          });
          this.refresh();
        }
      },
      reset: {
        icon: '<i class="fas fa-undo"></i>',
        label: "Reset Position",
        callback: async () => {
          this.customOffset = {x: 0, y: 0};
          await this._saveCustomOffset();
          this._positionDisplay();
        }
      },
      remove: {
        icon: '<i class="fas fa-trash"></i>',
        label: "Remove Display",
        callback: async () => {
          const confirm = await Dialog.confirm({
            title: "Remove Display",
            content: "<p>Are you sure you want to remove this display?</p>"
          });
          
          if (confirm) {
            await DisplaySettings.setFlag(this.token.document, "config", null);
            await DisplaySettings.setFlag(this.token.document, "enabled", false);
            this.destroy({ children: true });
            if (this.token.rnkDisplay) {
              delete this.token.rnkDisplay;
            }
            ui.notifications.info("Display removed");
          }
        }
      },
      template: {
        icon: '<i class="fas fa-file-import"></i>',
        label: "Apply Template",
        callback: () => this._showTemplateMenu()
      }
    };
    
    new Dialog({
      title: "Display Options",
      content: `<p>Select an action for <strong>${this.token.name}</strong>'s display:</p>`,
      buttons,
      default: "configure"
    }).render(true);
  }

  async _showTemplateMenu() {
    const templates = {...DisplayTemplateManager.getDefaultTemplates(), ...DisplayTemplateManager.getAllTemplates()};
    
    const buttons = {};
    Object.entries(templates).forEach(([key, template]) => {
      buttons[key] = {
        label: template.name || key,
        callback: async () => {
          await DisplaySettings.setFlag(this.token.document, "config", template);
          this.refresh();
          ui.notifications.info(`Template "${template.name}" applied!`);
        }
      };
    });
    
    new Dialog({
      title: "Apply Template",
      content: "<p>Select a template to apply to this token:</p>",
      buttons
    }).render(true);
  }

  getConfig() {
    if (!this.config) {
      this.config = DisplaySettings.getFlag(this.token.document, "config") || {};
    }
    return this.config;
  }

  draw() {
    this.removeChildren();
    this.config = null;
    
    const config = this.getConfig();
    
    if (!this._shouldDisplay(config)) {
      this.visible = false;
      return;
    }
    
    this.visible = true;
    
    const preset = VisualEffects.PRESETS[config.preset] || VisualEffects.PRESETS.classic;
    const content = this._getDisplayContent(config);
    
    const style = VisualEffects.createTextStyle(preset, config.fontSize || 14);
    style.wordWrapWidth = config.width || 200;
    
    this.textElement = new PIXI.Text(content, style);
    this.textElement.x = 8;
    this.textElement.y = 8;
    
    const padding = 8;
    let totalWidth = this.textElement.width + (padding * 2);
    let totalHeight = this.textElement.height + (padding * 2);
    
    // Create background graphics with proper hit area
    this.background = VisualEffects.createBackground(
      totalWidth, 
      totalHeight, 
      preset, 
      config
    );
    
    // Set explicit hit area for the entire background
    this.background.hitArea = new PIXI.Rectangle(0, 0, totalWidth, totalHeight);
    this.background.eventMode = 'static';
    this.background.interactive = true;
    
    this.addChild(this.background);
    this.addChild(this.textElement);
    
    if (config.showProgressBars && config.progressBars && config.progressBars.length > 0) {
      const barY = this.textElement.height + padding + 5;
      config.progressBars.forEach((barConfig, index) => {
        const bar = this._createProgressBar(barConfig, totalWidth - (padding * 2));
        if (bar) {
          bar.y = barY + (index * (barConfig.height + 3));
          this.progressBars.push(bar);
          totalHeight = Math.max(totalHeight, bar.y + bar.height + padding);
        }
      });
    }
    
    if (config.showConditions && this.token.actor) {
      const conditions = SystemIntegration.getConditions(this.token.actor);
      if (conditions.length > 0) {
        const maxConditions = config.maxConditions || 5;
        const displayConditions = conditions.slice(0, maxConditions);
        const iconSize = 24;
        const spacing = 4;
        
        let conditionX = padding;
        let conditionY = totalHeight;
        
        displayConditions.forEach((condition, index) => {
          const icon = VisualEffects.createConditionIcon(condition, iconSize);
          icon.x = conditionX;
          icon.y = conditionY;
          
          this.conditionIcons.push(icon);
          
          conditionX += iconSize + spacing;
          if (conditionX + iconSize > totalWidth) {
            conditionX = padding;
            conditionY += iconSize + spacing;
          }
        });
        
        if (this.conditionIcons.length > 0) {
          totalHeight = conditionY + iconSize + padding;
        }
      }
    }
    
    this.background = VisualEffects.createBackground(
      totalWidth,
      totalHeight,
      preset,
      config.opacity || 0.8
    );
    
    // Make background explicitly interactive with hit area
    this.background.eventMode = 'static';
    this.background.interactive = true;
    this.background.hitArea = new PIXI.Rectangle(0, 0, totalWidth, totalHeight);
    
    // Set container's hit area to match background
    this.hitArea = new PIXI.Rectangle(0, 0, totalWidth, totalHeight);
    
    this.addChild(this.background);
    this.addChild(this.textElement);
    this.progressBars.forEach(bar => this.addChild(bar));
    this.conditionIcons.forEach(icon => this.addChild(icon));
    
    this._positionDisplay(config);
    
    if (config.visibility === "hover") {
      this.visible = false;
    } else if (DisplaySettings.get("enableAnimations")) {
      VisualEffects.animateFadeIn(this);
    }
    
    if (DisplaySettings.get("combatHighlight") && this._isActiveCombatant()) {
      VisualEffects.animatePulse(this);
    }
    
    if (DisplaySettings.get("distanceFade") > 0) {
      VisualEffects.applyDistanceFade(this, this.token);
    }
    
    this._initializeAdvancedFeatures(config);
  }
  
  _initializeAdvancedFeatures(config) {
    if (!this.combatStats && this.token.actor) {
      this.combatStats = CombatStatsManager.getStats(this.token);
    }
    
    if (config.particleEffect && config.particleEffect !== "none") {
      if (!this.particleSystem) {
        this.particleSystem = ParticleSystem.createElementalAura(config.particleEffect);
        this.addChild(this.particleSystem);
        
        this.particleSystem.x = this.background.width / 2;
        this.particleSystem.y = this.background.height / 2;
      }
    } else if (this.particleSystem) {
      this.removeChild(this.particleSystem);
      this.particleSystem.destroy();
      this.particleSystem = null;
    }
    
    if (config.magicCircle) {
      if (!this.magicCircle) {
        this.magicCircle = new MagicCircle(this.background.width / 2);
        this.addChildAt(this.magicCircle, 1);
        
        this.magicCircle.x = this.background.width / 2;
        this.magicCircle.y = this.background.height / 2;
      }
    } else if (this.magicCircle) {
      this.removeChild(this.magicCircle);
      this.magicCircle.destroy();
      this.magicCircle = null;
    }
    
    if (config.enableClickToRoll !== false && this.textElement) {
      ClickToRoll.makeRollable(this.textElement, this.token);
    }
  }

  showRadialMenu() {
    if (this.radialMenu) {
      this.radialMenu.close();
      return;
    }
    
    const config = this.getConfig();
    if (!this.background) {
      console.warn('[RNK™ Wasteland HUD] TokenDisplay.showRadialMenu: background is null or undefined');
      return;
    }

    const actions = config.radialActions || RadialMenu.getDefaultActions(this.token);
    
    this.radialMenu = new RadialMenu(this.token, actions);
    this.addChild(this.radialMenu);
    
    this.radialMenu.x = this.background.width / 2;
    this.radialMenu.y = this.background.height / 2;
    
    this.radialMenu.open();
    
    this.radialMenu.once("close", () => {
      this.removeChild(this.radialMenu);
      this.radialMenu.destroy();
      this.radialMenu = null;
    });
  }
  
  updateParticles(delta) {
    if (this.particleSystem) {
      this.particleSystem.update(delta);
    }
    
    if (this.magicCircle) {
      this.magicCircle.rotation += 0.005;
    }
  }

  _shouldDisplay(config) {
    return DisplayContentParser.shouldDisplay(this.token, config);
  }

  _getDisplayContent(config) {
    return DisplayContentParser.getDisplayContent(this.token, config);
  }

  _createProgressBar(barConfig, width) {
    return DisplayContentParser.createProgressBar(this.token, barConfig, width);
  }

  _positionDisplay(config = null) {
    if (!config) config = this.getConfig();
    
    // Check for absolute waypoint position first
    const displayPos = DisplaySettings.getFlag(this.token.document, "displayPosition");
    if (displayPos) {
      this.x = displayPos.x;
      this.y = displayPos.y;
      return;
    }
    
    // Fallback to relative positioning (legacy)
    const savedOffset = DisplaySettings.getFlag(this.token.document, "customOffset");
    if (savedOffset) {
      this.customOffset = savedOffset;
    }
    
    const pos = DisplayContentParser.calculatePosition(this.token, this, config, this.customOffset);
    
    // Position relative to token's world position
    this.x = this.token.x + pos.x;
    this.y = this.token.y + pos.y;
  }

  _isActiveCombatant() {
    if (!game.combat || !game.combat.started) return false;
    
    const combatant = game.combat.combatants.find(c => c.tokenId === this.token.id);
    return combatant && game.combat.current.combatantId === combatant.id;
  }

  refresh() {
    if (this.token.actor) {
      const actorData = SystemIntegration.getActorData(this.token.actor);
      if (actorData.hp && this.lastHPValue !== null) {
        const hpChange = actorData.hp.value - this.lastHPValue;
        if (hpChange !== 0) {
          VisualEffects.animateDamage(this, hpChange);
        }
      }
      this.lastHPValue = actorData.hp ? actorData.hp.value : null;
    }
    
    VisualEffects.stopPulse(this);
    this.draw();
  }

  destroy(options) {
    VisualEffects.stopPulse(this);
    super.destroy(options);
  }
}
