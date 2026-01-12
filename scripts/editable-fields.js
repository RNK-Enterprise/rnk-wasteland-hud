/**
 * Editable Fields System
 * Double-click to edit HP, sliders, and custom fields
 * @module editable-fields
 */

/**
 * Editable Field
 */
export class EditableField extends PIXI.Container {
  constructor(token, fieldConfig) {
    super();

    this.token = token;
    this.config = {
      type: "text", // text, number, slider, dropdown
      property: "hp.value",
      label: "HP",
      min: 0,
      max: 100,
      step: 1,
      gmOnly: true,
      validation: null,
      ...fieldConfig
    };

    this.textElement = null;
    this.isEditing = false;
    this.interactive = true;
    this.cursor = "pointer";

    this._createField();
    this._setupInteraction();
  }

  _createField() {
    const value = this._getCurrentValue();
    const text = `${this.config.label}: ${value}`;

    this.textElement = new PIXI.Text(text, {
      fontFamily: "Arial",
      fontSize: 14,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2
    });

    this.addChild(this.textElement);

    // Add edit indicator using PIXI Graphics instead of emoji
    const editIcon = new PIXI.Graphics();
    editIcon.beginFill(0xffff00, 0.7);
    // Draw a simple pencil shape
    editIcon.moveTo(0, 8);
    editIcon.lineTo(2, 10);
    editIcon.lineTo(10, 2);
    editIcon.lineTo(8, 0);
    editIcon.closePath();
    editIcon.endFill();
    editIcon.position.set(this.textElement.width + 5, 0);
    this.addChild(editIcon);
  }

  _setupInteraction() {
    this.on("pointerdown", (event) => {
      if (event.data.originalEvent.detail === 2) {
        // Double-click
        this._startEditing();
      }
    });

    this.on("rightdown", () => {
      this._showContextMenu();
    });
  }

  async _startEditing() {
    // Check permissions
    if (this.config.gmOnly && !game.user.isGM) {
      ui.notifications.warn("Only the GM can edit this field");
      return;
    }

    if (!this.token.actor) {
      ui.notifications.error("No actor associated with this token");
      return;
    }

    this.isEditing = true;

    const currentValue = this._getCurrentValue();
    let newValue;

    switch (this.config.type) {
      case "number":
      case "text":
        newValue = await this._promptInput(currentValue);
        break;
      
      case "slider":
        newValue = await this._promptSlider(currentValue);
        break;
      
      case "dropdown":
        newValue = await this._promptDropdown(currentValue);
        break;
    }

    if (newValue !== null && newValue !== undefined) {
      await this._updateValue(newValue);
    }

    this.isEditing = false;
  }

  async _promptInput(currentValue) {
    return new Promise((resolve) => {
      new Dialog({
        title: `Edit ${this.config.label}`,
        content: `
          <form>
            <div class="form-group">
              <label>${this.config.label}</label>
              <input type="${this.config.type}" name="value" value="${currentValue}" 
                ${this.config.min !== undefined ? `min="${this.config.min}"` : ""}
                ${this.config.max !== undefined ? `max="${this.config.max}"` : ""}
                ${this.config.step !== undefined ? `step="${this.config.step}"` : ""} />
            </div>
          </form>
        `,
        buttons: {
          save: {
            icon: '<i class="fas fa-check"></i>',
            label: "Save",
            callback: (html) => {
              const value = html.find('input[name="value"]').val();
              resolve(this.config.type === "number" ? parseFloat(value) : value);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "save"
      }).render(true);
    });
  }

  async _promptSlider(currentValue) {
    return new Promise((resolve) => {
      const min = this.config.min || 0;
      const max = this.config.max || 100;
      const step = this.config.step || 1;

      new Dialog({
        title: `Edit ${this.config.label}`,
        content: `
          <form>
            <div class="form-group">
              <label>${this.config.label}: <span id="slider-value">${currentValue}</span></label>
              <input type="range" name="value" value="${currentValue}" 
                min="${min}" max="${max}" step="${step}" 
                oninput="document.getElementById('slider-value').textContent = this.value" />
            </div>
          </form>
        `,
        buttons: {
          save: {
            icon: '<i class="fas fa-check"></i>',
            label: "Save",
            callback: (html) => {
              const value = parseFloat(html.find('input[name="value"]').val());
              resolve(value);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "save"
      }).render(true);
    });
  }

  async _promptDropdown(currentValue) {
    if (!this.config.options || !Array.isArray(this.config.options)) {
      ui.notifications.error("No options defined for dropdown");
      return null;
    }

    return new Promise((resolve) => {
      const optionsHtml = this.config.options
        .map(opt => `<option value="${opt.value}" ${opt.value === currentValue ? "selected" : ""}>${opt.label}</option>`)
        .join("");

      new Dialog({
        title: `Edit ${this.config.label}`,
        content: `
          <form>
            <div class="form-group">
              <label>${this.config.label}</label>
              <select name="value">
                ${optionsHtml}
              </select>
            </div>
          </form>
        `,
        buttons: {
          save: {
            icon: '<i class="fas fa-check"></i>',
            label: "Save",
            callback: (html) => {
              const value = html.find('select[name="value"]').val();
              resolve(value);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "save"
      }).render(true);
    });
  }

  _showContextMenu() {
    if (!game.user.isGM) return;

    new ContextMenu($(document.body), ".editable-field", [
      {
        name: "Edit Value",
        icon: '<i class="fas fa-edit"></i>',
        callback: () => this._startEditing()
      },
      {
        name: "Reset to Default",
        icon: '<i class="fas fa-undo"></i>',
        callback: () => this._resetValue()
      },
      {
        name: "Configure Field",
        icon: '<i class="fas fa-cog"></i>',
        callback: () => this._configureField()
      }
    ]);
  }

  _getCurrentValue() {
    const actor = this.token.actor;
    if (!actor) return 0;

    return foundry.utils.getProperty(actor.system, this.config.property) || 0;
  }

  async _updateValue(newValue) {
    // Validate
    if (this.config.validation) {
      const validationResult = this.config.validation(newValue);
      if (!validationResult.valid) {
        ui.notifications.error(validationResult.message || "Invalid value");
        return;
      }
    }

    // Apply bounds for numbers
    if (this.config.type === "number" || this.config.type === "slider") {
      if (this.config.min !== undefined && newValue < this.config.min) {
        newValue = this.config.min;
      }
      if (this.config.max !== undefined && newValue > this.config.max) {
        newValue = this.config.max;
      }
    }

    // Update actor
    const updateData = {};
    updateData[`system.${this.config.property}`] = newValue;
    
    await this.token.actor.update(updateData);

    // Update display
    this.removeChildren();
    this._createField();

    // Refresh Display
    if (this.token.Display) {
      this.token.Display.refresh();
    }

    ui.notifications.info(`${this.config.label} updated to ${newValue}`);
  }

  async _resetValue() {
    const defaultValue = this.config.default || 0;
    await this._updateValue(defaultValue);
  }

  _configureField() {
    new Dialog({
      title: `Configure ${this.config.label}`,
      content: `
        <form>
          <div class="form-group">
            <label>Label</label>
            <input type="text" name="label" value="${this.config.label}" />
          </div>
          <div class="form-group">
            <label>Property Path</label>
            <input type="text" name="property" value="${this.config.property}" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select name="type">
              <option value="text" ${this.config.type === "text" ? "selected" : ""}>Text</option>
              <option value="number" ${this.config.type === "number" ? "selected" : ""}>Number</option>
              <option value="slider" ${this.config.type === "slider" ? "selected" : ""}>Slider</option>
              <option value="dropdown" ${this.config.type === "dropdown" ? "selected" : ""}>Dropdown</option>
            </select>
          </div>
          <div class="form-group">
            <label>Min Value</label>
            <input type="number" name="min" value="${this.config.min || 0}" />
          </div>
          <div class="form-group">
            <label>Max Value</label>
            <input type="number" name="max" value="${this.config.max || 100}" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="gmOnly" ${this.config.gmOnly ? "checked" : ""} />
              GM Only
            </label>
          </div>
        </form>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-check"></i>',
          label: "Save",
          callback: (html) => {
            this.config.label = html.find('input[name="label"]').val();
            this.config.property = html.find('input[name="property"]').val();
            this.config.type = html.find('select[name="type"]').val();
            this.config.min = parseFloat(html.find('input[name="min"]').val());
            this.config.max = parseFloat(html.find('input[name="max"]').val());
            this.config.gmOnly = html.find('input[name="gmOnly"]').is(":checked");

            this.removeChildren();
            this._createField();
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "save"
    }).render(true);
  }
}

/**
 * Editable Fields Manager
 */
export class EditableFieldsManager {
  static fields = new Map();

  /**
   * Create editable fields for token
   */
  static createFields(token, fieldsConfig) {
    const key = token.id;
    
    // Remove existing fields
    this.removeFields(token);

    if (!fieldsConfig || !Array.isArray(fieldsConfig) || fieldsConfig.length === 0) {
      return [];
    }

    const Display = token.Display;
    if (!Display) return [];

    const fields = [];
    let yOffset = 0;

    for (const fieldConfig of fieldsConfig) {
      const field = new EditableField(token, fieldConfig);
      field.position.set(0, yOffset);
      Display.addChild(field);
      fields.push(field);

      yOffset += field.height + 5;
    }

    this.fields.set(key, fields);
    return fields;
  }

  /**
   * Remove fields from token
   */
  static removeFields(token) {
    const key = token.id;
    const fields = this.fields.get(key);
    
    if (fields) {
      fields.forEach(field => field.destroy({ children: true }));
      this.fields.delete(key);
    }
  }

  /**
   * Get fields for token
   */
  static getFields(token) {
    return this.fields.get(token.id) || [];
  }

  /**
   * Add field to token
   */
  static addField(token, fieldConfig) {
    const existingFields = this.getFields(token);
    const allFieldsConfig = [
      ...existingFields.map(f => f.config),
      fieldConfig
    ];
    
    return this.createFields(token, allFieldsConfig);
  }

  /**
   * Clear all fields
   */
  static clear() {
    this.fields.forEach(fields => fields.forEach(field => field.destroy({ children: true })));
    this.fields.clear();
  }
}

/**
 * Setup function
 */
export function setupEditableFields() {
  console.log("RNK� Wasteland HUD | Editable fields system initialized");

  // Register settings
  game.settings.register("rnk-wasteland-hud", "enableEditableFields", {
    name: "Enable Editable Fields",
    hint: "Allow fields on token Displays to be edited by double-clicking",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Clear fields on canvas tear down
  Hooks.on("canvasTearDown", () => {
    EditableFieldsManager.clear();
  });

  // Chat command
  Hooks.on("chatMessage", (log, message, data) => {
    if (message.startsWith("/add-field")) {
      if (!game.user.isGM) {
        ui.notifications.warn("Only the GM can add fields");
        return false;
      }

      const tokens = canvas.tokens.controlled;
      if (tokens.length === 0) {
        ui.notifications.warn("Select a token first");
        return false;
      }

      tokens.forEach(token => {
        EditableFieldsManager.addField(token, {
          type: "number",
          property: "hp.value",
          label: "HP",
          min: 0,
          gmOnly: true
        });
      });

      ui.notifications.info("Editable field added to selected tokens");
      return false;
    }
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  EditableField,
  EditableFieldsManager
});


