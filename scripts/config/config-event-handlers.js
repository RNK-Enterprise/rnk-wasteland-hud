/**
 * RNK™ Wasteland HUD - Config Event Handlers
 * Handles all UI event interactions for the config form
 * @module config/config-event-handlers
 */

import { VisualEffects } from "../visual-effects.js";
import { SystemIntegration } from "../system-integration.js";
import { ConfigFormData } from "./config-form-data.js";

export class ConfigEventHandlers {
  constructor(app) {
    this.app = app;
  }

  setupListeners() {
    try {
      const form = this.app.element;
      if (!form) {
        console.warn('[RNK™ Wasteland HUD] No element found for listeners');
        return;
      }

      const formElement = form.querySelector('form');
      if (formElement) {
        formElement.addEventListener('submit', (e) => this.app._onSubmit(e));
      }
      
      form.querySelector('button[type="submit"]')?.addEventListener('click', (e) => this.app._onSubmit(e));
      form.querySelector('button.close')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.app.close();
      });
      
      form.querySelector('button.delete-display')?.addEventListener('click', (e) => this.onDeleteDisplay(e));
      
      form.querySelector('button.place-display-waypoint')?.addEventListener('click', (e) => this.onPlaceDisplay(e));

      form.querySelector('select[name="preset"]')?.addEventListener('change', (e) => this.onPresetChange(e));
      
      form.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('change', () => this.updatePreview());
        input.addEventListener('keyup', foundry.utils.debounce(() => this.updatePreview(), 300));
      });

      form.querySelector(".add-progress-bar")?.addEventListener('click', (e) => this.onAddProgressBar(e));
      form.querySelectorAll(".remove-progress-bar").forEach(btn => {
        btn.addEventListener('click', (e) => this.onRemoveProgressBar(e));
      });

      form.querySelectorAll(".insert-variable").forEach(btn => {
        btn.addEventListener('click', (e) => this.onInsertVariable(e));
      });
      
      // Add click handlers for variable reference items
      form.querySelectorAll(".variable-item").forEach(item => {
        item.addEventListener('click', (e) => this.onClickVariable(e));
      });

      form.querySelector(".quick-enable-all")?.addEventListener('click', () => this.setAllDisplays(true));
      form.querySelector(".quick-disable-all")?.addEventListener('click', () => this.setAllDisplays(false));

      form.querySelector('[name="linkToTile"]')?.addEventListener('change', (e) => this.onToggleTileLink(e));
      form.querySelector('.create-display-tile')?.addEventListener('click', (e) => this.app.tileManager.onCreateDisplayTile(e));
      form.querySelector('.select-tile-on-canvas')?.addEventListener('click', (e) => this.app.tileManager.onSelectTileFromCanvas(e));
      form.querySelector('.delete-display-tile')?.addEventListener('click', (e) => this.onDeleteTile(e));

      this.updatePreview();
      
    } catch (err) {
      console.error('[RNK™ Wasteland HUD] Error setting up listeners:', err);
    }
  }

  onPresetChange(event) {
    try {
      const presetName = event.currentTarget.value;
      const preset = VisualEffects.PRESETS?.[presetName];
      
      if (preset) {
        const form = this.app.element;
        if (form.querySelector('[name="backgroundColor"]')) form.querySelector('[name="backgroundColor"]').value = preset.backgroundColor || '#000000';
        if (form.querySelector('[name="textColor"]')) form.querySelector('[name="textColor"]').value = preset.textColor || '#ffffff';
        if (form.querySelector('[name="fontSize"]')) form.querySelector('[name="fontSize"]').value = preset.fontSize || 14;
        if (form.querySelector('[name="borderColor"]')) form.querySelector('[name="borderColor"]').value = preset.borderColor || '#666666';
        if (form.querySelector('[name="borderWidth"]')) form.querySelector('[name="borderWidth"]').value = preset.borderWidth || 2;
        if (form.querySelector('[name="borderRadius"]')) form.querySelector('[name="borderRadius"]').value = preset.borderRadius || 5;
        
        this.updatePreview();
      }
    } catch (err) {
      console.warn('[RNK™ Wasteland HUD] Error changing preset:', err);
    }
  }

  onAddProgressBar(event) {
    event.preventDefault();
    const container = this.app.element.querySelector(".progress-bars-list");
    const index = container.children.length;
    
    const html = `
      <div class="progress-bar-item" data-index="${index}">
        <select name="progressBars.${index}.type">
          <option value="hp">HP</option>
          <option value="resources">Resources</option>
          <option value="custom">Custom</option>
        </select>
        <input type="color" name="progressBars.${index}.color" value="#ff0000">
        <input type="number" name="progressBars.${index}.height" value="8" min="4" max="20">
        <button type="button" class="remove-progress-bar" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
  }

  onRemoveProgressBar(event) {
    event.preventDefault();
    event.currentTarget.closest(".progress-bar-item").remove();
  }

  onInsertVariable(event) {
    event.preventDefault();
    const variable = event.currentTarget.dataset.variable;
    const textarea = this.app.element.querySelector('[name="content"]');
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, cursorPos);
      const textAfter = textarea.value.substring(cursorPos);
      
      textarea.value = textBefore + variable + textAfter;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + variable.length;
      textarea.focus();
      
      this.updatePreview();
    }
  }

  setAllDisplays(enabled) {
    const form = this.app.element;
    form.querySelectorAll('[name="enabled"]').forEach(input => {
      input.checked = enabled;
    });
  }

  onToggleTileLink(event) {
    const enabled = event.currentTarget.checked;
    const tileOptions = this.app.element.querySelector('.tile-options');
    if (tileOptions) {
      tileOptions.style.display = enabled ? 'block' : 'none';
    }
  }

  updatePreview() {
    const previewContainer = this.app.element?.querySelector(".Display-preview");
    if (!previewContainer) return;
    
    try {
      const formData = ConfigFormData.extractFormData(this.app.element);
      if (!formData) {
        console.warn('[RNK™ Wasteland HUD] No form data for preview');
        return;
      }
      
      let content = formData.content || '@name';
      
      try {
        if (SystemIntegration?.parseContentVariables && this.app.token?.actor) {
          content = SystemIntegration.parseContentVariables(
            content,
            this.app.token.actor,
            this.app.token.document
          );
        }
      } catch (parseErr) {
        console.warn('[RNK™ Wasteland HUD] Preview parse error:', parseErr);
        content = formData.content || '@name';
      }
      
      let presetStyles = { gradient: '', shadow: 'none', font: 'inherit' };
      try {
        presetStyles = VisualEffects?.PRESETS?.[formData.preset] || VisualEffects?.PRESETS?.classic || presetStyles;
      } catch (presetErr) {
        // Use defaults
      }
      
      previewContainer.innerHTML = `
        <div class="preview-Display" style="
          background: ${formData.gradient ? (presetStyles.gradient || formData.backgroundColor) : (formData.backgroundColor || '#000000')};
          color: ${formData.textColor || '#ffffff'};
          font-size: ${formData.fontSize || 14}px;
          border: ${formData.borderWidth || 2}px solid ${formData.borderColor || '#666666'};
          border-radius: ${formData.borderRadius || 5}px;
          padding: 8px;
          max-width: ${formData.width || 200}px;
          opacity: ${formData.opacity || 0.8};
          box-shadow: ${formData.shadow ? (presetStyles.shadow || 'none') : 'none'};
          font-family: ${presetStyles.font || 'inherit'};
          text-align: center;
          white-space: pre-wrap;
        ">
          ${content}
          ${formData.showProgressBars ? '<div class="preview-progress-bar" style="width: 100%; height: 8px; background: #333; margin-top: 5px; position: relative;"><div style="width: 75%; height: 100%; background: #ff0000;"></div></div>' : ''}
        </div>
      `;
    } catch (err) {
      console.warn('[RNK™ Wasteland HUD] Preview update failed:', err);
    }
  }  
  onClickVariable(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const item = event.currentTarget;
    const variable = item.querySelector('code')?.textContent;
    
    if (!variable) return;
    
    const textarea = this.app.element.querySelector('textarea[name="content"]');
    if (!textarea) return;
    
    // Get cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Insert variable at cursor position
    const before = text.substring(0, start);
    const after = text.substring(end);
    textarea.value = before + variable + after;
    
    // Set cursor after inserted variable
    const newCursorPos = start + variable.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    
    // Update preview
    this.updatePreview();
    
    // Visual feedback
    item.style.backgroundColor = 'rgba(212, 175, 55, 0.5)';
    setTimeout(() => {
      item.style.backgroundColor = '';
    }, 200);
  }
  
  async onDeleteDisplay(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const confirm = await Dialog.confirm({
      title: "Delete Display",
      content: "<p>Are you sure you want to permanently delete this display?</p><p><strong>This cannot be undone.</strong></p>",
      defaultYes: false
    });
    
    if (confirm) {
      const { DisplaySettings } = await import('../settings.js');
      
      // Clear all display-related flags
      await DisplaySettings.setFlag(this.app.token.document, "config", null);
      await DisplaySettings.setFlag(this.app.token.document, "enabled", false);
      await DisplaySettings.setFlag(this.app.token.document, "displayPosition", null);
      await DisplaySettings.setFlag(this.app.token.document, "customOffset", null);
      
      // Remove the display from canvas
      if (this.app.token.rnkDisplay) {
        canvas.interface.removeChild(this.app.token.rnkDisplay);
        this.app.token.rnkDisplay.destroy({ children: true });
        delete this.app.token.rnkDisplay;
      }
      
      ui.notifications.info("Display deleted successfully");
      this.app.close();
    }
  }
  
  async onPlaceDisplay(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const { DisplayPlacer } = await import('../display-placer.js');
    
    this.app.close();
    DisplayPlacer.startPlacement(this.app.token);
  }

  async onDeleteTile(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!game.user.isGM) {
      ui.notifications.warn("Only the GM can delete display tiles.");
      return;
    }
    
    const { DisplaySettings } = await import('../settings.js');
    const linkedTileId = DisplaySettings.getFlag(this.app.token.document, "linkedTileId");
    
    if (!linkedTileId) {
      ui.notifications.warn("No tile linked to this display.");
      return;
    }
    
    const tile = canvas.scene.tiles.get(linkedTileId);
    if (!tile) {
      ui.notifications.warn("Linked tile not found on scene.");
      await DisplaySettings.setFlag(this.app.token.document, "linkedTileId", null);
      await DisplaySettings.setFlag(this.app.token.document, "linkToTile", false);
      return;
    }
    
    const confirm = await Dialog.confirm({
      title: "Delete Display Tile",
      content: "<p>Are you sure you want to delete the display tile?</p>",
      defaultYes: false
    });
    
    if (confirm) {
      await tile.delete();
      await DisplaySettings.setFlag(this.app.token.document, "linkedTileId", null);
      await DisplaySettings.setFlag(this.app.token.document, "linkToTile", false);
      
      const checkbox = this.app.element.querySelector('[name="linkToTile"]');
      if (checkbox) checkbox.checked = false;
      
      const select = this.app.element.querySelector('[name="linkedTileId"]');
      if (select) select.value = "";
      
      ui.notifications.info("Display tile deleted successfully");
    }
  }
}
