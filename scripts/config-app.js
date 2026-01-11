/**
 * RNK Wasteland HUD - Configuration Application
 * Advanced configuration dialog for Display customization
 * Refactored to delegate to modular components
 */

import { DisplaySettings } from "./settings.js";
import { DisplayTemplateManager } from "./templates.js";
import { SystemIntegration } from "./system-integration.js";
import { VisualEffects } from "./visual-effects.js";
import { ConfigFormData } from "./config/config-form-data.js";
import { ConfigEventHandlers } from "./config/config-event-handlers.js";
import { ConfigTileManager } from "./config/config-tile-manager.js";

export class DisplayConfigApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(token, options = {}) {
    super(options);
    this.token = token;
    this.previewContainer = null;
    this.eventHandlers = new ConfigEventHandlers(this);
    this.tileManager = new ConfigTileManager(this);
  }

  static DEFAULT_OPTIONS = {
    id: "display-config",
    classes: ["display-config-app"],
    window: {
      icon: "fas fa-cog",
      title: "RNK Wasteland HUD Configuration",
      resizable: true
    },
    position: {
      width: 850,
      height: "auto"
    }
  };

  static PARTS = {
    form: {
      template: "modules/rnk-wasteland-hud/templates/display-config.html"
    }
  };

  async _prepareContext() {
    return await ConfigFormData.prepareContext(this.token);
  }

  async _onRender(context, options) {
    try {
      super._onRender?.(context, options);

      const form = this.element;
      if (form) {
        const firstTab = form.querySelector('.tabs .item');
        const firstTabContent = form.querySelector('.tab');
        if (firstTab) firstTab.classList.add('active');
        if (firstTabContent) firstTabContent.classList.add('active');
        
        form.querySelectorAll('.tabs .item').forEach(tab => {
          tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.dataset.tab;
            
            form.querySelectorAll('.tabs .item').forEach(t => t.classList.remove('active'));
            form.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            tab.classList.add('active');
            const content = form.querySelector(`.tab[data-tab="${tabName}"]`);
            if (content) content.classList.add('active');
          });
        });
      }

      const appRoot = $(this.element).closest('.app');
      const titleBar = appRoot.find('.window-title');
      if (titleBar.length && !titleBar.find('.rnk-milestones-btn').length) {
        const btn = $(
          `<button type="button" class="rnk-milestones-btn control-icon" title="Milestones">
            <i class="fas fa-trophy"></i>
          </button>`
        );
        btn.css({ marginLeft: '8px' });
        btn.on('click', (e) => {
          e.preventDefault();
          if (game.milestones && typeof game.milestones.openMilestoneManager === 'function') {
            game.milestones.openMilestoneManager();
          } else ui.notifications.warn('Milestones module not available');
        });
        titleBar.append(btn);
      }

      this.eventHandlers.setupListeners();
    } catch (renderErr) {
      console.error('RNK™ Wasteland HUD | Error in _onRender:', renderErr);
    }
  }

  async _onSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const formData = ConfigFormData.extractFormData(this.element);
      const processedData = ConfigFormData.processFormData(formData);
      
      await DisplaySettings.setFlag(this.token.document, "config", processedData);
      
      if (processedData.linkToTile && processedData.linkedTileId) {
        try {
          const tileDoc = canvas.scene?.tiles.get(processedData.linkedTileId);
          if (tileDoc) {
            await DisplaySettings.setFlag(tileDoc, "linkedTokenId", this.token.id);
            await DisplaySettings.setFlag(tileDoc, "linkedActorId", this.token.actor?.id);
            await DisplaySettings.setFlag(tileDoc, "isDisplayDisplayTile", true);
            
            const { DisplayTileConfig } = await import('./tiles/display-tile-config.js');
            if (DisplayTileConfig?.updateTileDisplay) {
              await DisplayTileConfig.updateTileDisplay(tileDoc, this.token.actor, this.token.document);
            }
          }
        } catch (tileErr) {
          console.warn('RNK™ Wasteland HUD | Failed to sync tile:', tileErr);
        }
      }
      
      if (this.token.Display) {
        this.token.Display.refresh();
      }
      
      ui.notifications.info("Display configuration saved!");
      this.close();
      
    } catch (err) {
      console.error('RNK™ Wasteland HUD | Error saving configuration:', err);
      ui.notifications.error("Failed to save configuration. Check console for details.");
    }
  }
}
