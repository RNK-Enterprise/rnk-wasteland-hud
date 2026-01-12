/**
 * RNK™ Wasteland HUD - Token Display Interactivity
 * Handles user interactions with Displays
 * @author RNK™
 * @version 2.0.1
 */

import { DisplaySettings } from "../settings.js";
import { SystemIntegration } from "../system-integration.js";
import { DisplayConfigApp } from "../config-app.js";
import { DisplayTemplateManager } from "../templates.js";
import { RadialMenu } from "../radial-menu.js";

export class TokenDisplayInteractivity {
  static setupInteractivity(DisplayInstance) {
    DisplayInstance.on('click', (event) => {
      const config = DisplayInstance.getConfig();
      if (config.clickToOpen && DisplayInstance.token.actor?.sheet?.render) {
        DisplayInstance.token.actor.sheet.render(true);
      }
    });

    DisplayInstance.on('rightclick', (event) => {
      if (!game.user.isGM) return;
      this.showQuickMenu(DisplayInstance, event);
    });

    DisplayInstance.on('mousedown', this.onDragStart.bind(this, DisplayInstance));
    DisplayInstance.on('mouseup', this.onDragEnd.bind(this, DisplayInstance));
    DisplayInstance.on('mouseupoutside', this.onDragEnd.bind(this, DisplayInstance));
    DisplayInstance.on('mousemove', this.onDragMove.bind(this, DisplayInstance));

    DisplayInstance.on('pointerover', this.onHoverStart.bind(this, DisplayInstance));
    DisplayInstance.on('pointerout', this.onHoverEnd.bind(this, DisplayInstance));
  }

  static onDragStart(DisplayInstance, event) {
    const config = DisplayInstance.getConfig();
    if (!config.allowDrag || !game.user.isGM) return;
    
    DisplayInstance.isDragging = true;
    // Get position in canvas.interface space
    DisplayInstance.dragData = event.data.getLocalPosition(canvas.interface);
    DisplayInstance.alpha = 0.5;
  }

  static onDragEnd(DisplayInstance, event) {
    if (!DisplayInstance.isDragging) return;
    
    DisplayInstance.isDragging = false;
    DisplayInstance.alpha = 1;
    
    this.saveCustomOffset(DisplayInstance);
  }

  static onDragMove(DisplayInstance, event) {
    if (!DisplayInstance.isDragging) return;
    
    // Get position in canvas.interface space (absolute scene coordinates)
    const newPosition = event.data.getLocalPosition(canvas.interface);
    const dx = newPosition.x - DisplayInstance.dragData.x;
    const dy = newPosition.y - DisplayInstance.dragData.y;
    
    DisplayInstance.customOffset.x += dx;
    DisplayInstance.customOffset.y += dy;
    
    // Update position directly
    DisplayInstance.x += dx;
    DisplayInstance.y += dy;
    
    DisplayInstance.dragData = newPosition;
  }

  static async saveCustomOffset(DisplayInstance) {
    await DisplaySettings.setFlag(DisplayInstance.token.document, "customOffset", DisplayInstance.customOffset);
  }

  static onHoverStart(DisplayInstance) {
    const config = DisplayInstance.getConfig();
    if (config.showOnHover) {
      this.showDetailedTooltip(DisplayInstance);
    }
    
    if (DisplaySettings.get("enableAnimations")) {
      DisplayInstance.scale.set(1.05);
    }
  }

  static onHoverEnd(DisplayInstance) {
    if (DisplayInstance.tooltip) {
      DisplayInstance.tooltip.destroy();
      DisplayInstance.tooltip = null;
    }
    
    DisplayInstance.scale.set(1);
  }

  static showDetailedTooltip(DisplayInstance) {
    if (!DisplayInstance.token.actor) return;
    
    const actorData = SystemIntegration.getActorData(DisplayInstance.token.actor);
    let tooltipText = `${actorData.name}\n`;
    
    if (actorData.class) tooltipText += `${actorData.class}`;
    if (actorData.level) tooltipText += ` Level ${actorData.level}\n`;
    if (actorData.hp) tooltipText += `HP: ${actorData.hp.value}/${actorData.hp.max}\n`;
    if (actorData.ac) tooltipText += `AC: ${actorData.ac}`;
    
    DisplayInstance.tooltip = new PIXI.Text(tooltipText, {
      fontSize: 12,
      fill: "#ffffff",
      backgroundColor: "#000000",
      padding: 5
    });
    
    DisplayInstance.tooltip.x = DisplayInstance.width + 10;
    DisplayInstance.tooltip.y = 0;
    DisplayInstance.addChild(DisplayInstance.tooltip);
  }

  static showQuickMenu(DisplayInstance, event) {
    event.preventDefault();
    event.stopPropagation();
    
    new ContextMenu($(document.body), ".token-display-context", [
      {
        name: "Configure Display",
        icon: '<i class="fas fa-cog"></i>',
        callback: () => new DisplayConfigApp(DisplayInstance.token).render(true)
      },
      {
        name: "Toggle Visibility",
        icon: '<i class="fas fa-eye"></i>',
        callback: async () => {
          const config = DisplayInstance.getConfig();
          await DisplaySettings.setFlag(DisplayInstance.token.document, "config", {
            ...config,
            enabled: !config.enabled
          });
          DisplayInstance.refresh();
        }
      },
      {
        name: "Reset Position",
        icon: '<i class="fas fa-undo"></i>',
        callback: async () => {
          DisplayInstance.customOffset = {x: 0, y: 0};
          await this.saveCustomOffset(DisplayInstance);
          DisplayInstance._positionDisplay();
        }
      },
      {
        name: "Remove Display",
        icon: '<i class="fas fa-trash"></i>',
        callback: async () => {
          const confirm = await Dialog.confirm({
            title: "Remove Display",
            content: "<p>Are you sure you want to remove this display?</p>",
            yes: () => true,
            no: () => false
          });
          
          if (confirm) {
            await DisplaySettings.setFlag(DisplayInstance.token.document, "config", null);
            await DisplaySettings.setFlag(DisplayInstance.token.document, "enabled", false);
            DisplayInstance.destroy({ children: true });
            if (DisplayInstance.token.rnkDisplay) {
              delete DisplayInstance.token.rnkDisplay;
            }
            ui.notifications.info("Display removed");
          }
        }
      },
      {
        name: "Apply Template",
        icon: '<i class="fas fa-file-import"></i>',
        callback: () => this.showTemplateMenu(DisplayInstance)
      }
    ]);
  }

  static async showTemplateMenu(DisplayInstance) {
    const templates = {...DisplayTemplateManager.getDefaultTemplates(), ...DisplayTemplateManager.getAllTemplates()};
    
    const buttons = {};
    Object.entries(templates).forEach(([key, template]) => {
      buttons[key] = {
        label: template.name || key,
        callback: async () => {
          await DisplaySettings.setFlag(DisplayInstance.token.document, "config", template);
          DisplayInstance.refresh();
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

  static showRadialMenu(DisplayInstance) {
    if (DisplayInstance.radialMenu) {
      DisplayInstance.radialMenu.close();
      return;
    }
    
    const config = DisplayInstance.getConfig();
    if (!DisplayInstance.background) {
      console.warn('[RNK™ Wasteland HUD] TokenDisplay.showRadialMenu: background is null or undefined');
      return;
    }

    const actions = config.radialActions || RadialMenu.getDefaultActions(DisplayInstance.token);
    
    DisplayInstance.radialMenu = new RadialMenu(DisplayInstance.token, actions);
    DisplayInstance.addChild(DisplayInstance.radialMenu);
    
    DisplayInstance.radialMenu.x = DisplayInstance.background.width / 2;
    DisplayInstance.radialMenu.y = DisplayInstance.background.height / 2;
    
    DisplayInstance.radialMenu.open();
    
    DisplayInstance.radialMenu.once("close", () => {
      DisplayInstance.removeChild(DisplayInstance.radialMenu);
      DisplayInstance.radialMenu.destroy();
      DisplayInstance.radialMenu = null;
    });
  }
}
