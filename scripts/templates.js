/**
 * RNK Wasteland HUD - Template Manager
 * Save, load, and manage Display templates
 */

import { DisplaySettings } from "./settings.js";

export class DisplayTemplateManager {
  static async saveTemplate(name, config) {
    const templates = DisplaySettings.get("templates") || {};
    templates[name] = {
      ...config,
      savedAt: Date.now(),
      author: game.user.name
    };
    await DisplaySettings.set("templates", templates);
    ui.notifications.info(`Template "${name}" saved!`);
  }

  static async loadTemplate(name) {
    const templates = DisplaySettings.get("templates") || {};
    return templates[name] || null;
  }

  static async deleteTemplate(name) {
    const templates = DisplaySettings.get("templates") || {};
    delete templates[name];
    await DisplaySettings.set("templates", templates);
    ui.notifications.info(`Template "${name}" deleted!`);
  }

  static getAllTemplates() {
    return DisplaySettings.get("templates") || {};
  }

  static getDefaultTemplates() {
    return {
      "hp-bar": {
        name: "HP Bar Only",
        enabled: true,
        content: "@name",
        showProgressBars: true,
        progressBars: [{type: "hp", color: "#ff0000"}],
        preset: "minimal",
        position: "bottom"
      },
      "combat-card": {
        name: "Combat Card",
        enabled: true,
        content: "@name\nHP: @hp | AC: @ac\nInit: @initiative",
        showProgressBars: true,
        progressBars: [{type: "hp", color: "#ff0000"}],
        showConditions: true,
        preset: "fantasy",
        position: "top",
        fontSize: 14
      },
      "nameplate": {
        name: "Simple Nameplate",
        enabled: true,
        content: "@name",
        preset: "modern",
        position: "bottom",
        fontSize: 16,
        showProgressBars: false
      },
      "full-stats": {
        name: "Full Character Stats",
        enabled: true,
        content: "@name | Level @level\nHP: @hp | AC: @ac\n@class - @race",
        showProgressBars: true,
        progressBars: [
          {type: "hp", color: "#ff0000"},
          {type: "resources", color: "#0066ff"}
        ],
        showConditions: true,
        preset: "fantasy",
        position: "bottom",
        fontSize: 12
      },
      "minimal-icons": {
        name: "Minimal with Icons",
        enabled: true,
        content: "@name",
        showIcons: true,
        showProgressBars: true,
        progressBars: [{type: "hp", color: "#00ff00"}],
        preset: "minimal",
        position: "bottom",
        fontSize: 14
      }
    };
  }

  static renderTemplateDialog() {
    const templates = {...this.getDefaultTemplates(), ...this.getAllTemplates()};
    
    const content = `
      <div class="Display-template-manager">
        <h3>Saved Templates</h3>
        <div class="template-list">
          ${Object.entries(templates).map(([key, template]) => `
            <div class="template-item" data-template="${key}">
              <strong>${template.name || key}</strong>
              <div class="template-actions">
                <button class="load-template" data-template="${key}">
                  <i class="fas fa-download"></i> Load
                </button>
                ${template.author ? `
                  <button class="delete-template" data-template="${key}">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    return content;
  }
}

