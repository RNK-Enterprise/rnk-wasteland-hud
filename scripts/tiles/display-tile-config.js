/**
 * RNK Wasteland HUD - Tile Configuration
 * Manages tile creation and actor assignment for interactive tiles
 */

import { DisplayTileApp } from './display-tile-app.js';
import { DisplaySettings } from '../settings.js';
import { DisplayContentParser } from '../core/token-display-content.js';
import { VisualEffects } from '../visual-effects.js';

class DisplayTileConfig {
  /**
   * Initialize tile configuration (runs on module ready)
   */
  static init() {
    // Add context menu for creating Display tiles
    this.setupTileContextMenu();
    
    // Add hooks for tile interactions
    Hooks.on('preCreateTile', (tileDoc, data) => this.onPreCreateTile(tileDoc, data));
    Hooks.on('clickTile', (tile, interaction) => this.onClickTile(tile, interaction));
    
    // Hook into token/actor updates to sync linked tiles
    Hooks.on('updateActor', (actor, changes) => this.syncLinkedTiles(actor, changes));
    Hooks.on('updateToken', (tokenDoc, changes) => this.syncLinkedTilesForToken(tokenDoc, changes));
    
    // Hook into token refresh to update tiles
    Hooks.on('refreshToken', (token) => {
      if (!canvas.scene) return;
      const linkedTiles = canvas.scene.tiles.filter(tile => 
        tile.getFlag('rnk-wasteland-hud', 'linkedTokenId') === token.id
      );
      for (const tileDoc of linkedTiles) {
        if (token.actor) {
          this.updateTileDisplay(tileDoc, token.actor, token.document);
        }
      }
    });
  }

  /**
   * Sync all tiles linked to an actor when actor data changes
   */
  static async syncLinkedTiles(actor, changes) {
    if (!canvas.scene) return;
    
    // Find all tiles linked to this actor
    const linkedTiles = canvas.scene.tiles.filter(tile => 
      tile.getFlag('rnk-wasteland-hud', 'linkedActorId') === actor.id
    );
    
    for (const tileDoc of linkedTiles) {
      await this.updateTileDisplay(tileDoc, actor);
    }
  }

  /**
   * Sync tiles linked to a specific token
   */
  static async syncLinkedTilesForToken(tokenDoc, changes) {
    if (!canvas.scene) return;
    
    // Find tiles linked to this token
    const linkedTiles = canvas.scene.tiles.filter(tile => 
      tile.getFlag('rnk-wasteland-hud', 'linkedTokenId') === tokenDoc.id
    );
    
    const actor = tokenDoc.actor;
    if (!actor) return;
    
    for (const tileDoc of linkedTiles) {
      await this.updateTileDisplay(tileDoc, actor, tokenDoc);
    }
  }

  /**
   * Update the tile's display with current actor/token data
   */
  static async updateTileDisplay(tileDoc, actor, tokenDoc = null) {
    const config = tileDoc.getFlag('rnk-wasteland-hud', 'displayConfig') || {};
    
    // Build the display data
    const displayData = {
      name: actor.name,
      img: actor.img,
      hp: actor.system?.attributes?.hp || { value: 0, max: 0 },
      ac: actor.system?.attributes?.ac?.value || 0,
      conditions: tokenDoc?.actor?.effects?.map(e => e.name) || [],
      lastUpdated: Date.now()
    };
    
    // Store the display data on the tile
    await tileDoc.setFlag('rnk-wasteland-hud', 'displayData', displayData);
    
    // Trigger a refresh of the tile's visual if it has a custom renderer
    const tile = canvas.tiles.get(tileDoc.id);
    if (tile && tile.DisplayOverlay) {
      tile.DisplayOverlay.refresh(displayData);
    }
  }

  /**
   * Setup context menu for tile creation
   */
  static setupTileContextMenu() {
    const tileLayer = canvas?.stage?.getChildByName('TileLayer');
    if (!tileLayer) return;

    // This is a simplified approach; in production, you'd use Foundry's ContextMenu API
    Hooks.on('renderTileConfig', (config, html) => {
      // Add actor selection field to tile config
      const footer = html.find('.sheet-footer');
      const actorSelect = document.createElement('div');
      actorSelect.className = 'form-group';
      actorSelect.innerHTML = `
        <label>Linked Actor (for Display Tile)</label>
        <select name="flags.rnk-wasteland-hud.linkedActorId" class="form-control">
          <option value="">-- None (Regular Tile) --</option>
          ${game.actors.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
        </select>
        <p class="hint">Select an actor to make this tile a Display Tile that displays their character info.</p>
      `;
      footer.before(actorSelect);
    });
  }

  /**
   * Prepare tile data on creation
   */
  static onPreCreateTile(tileDoc, data) {
    // Tiles can have flags set during creation
    // This is handled via the config form
  }

  /**
   * Handle tile click
   */
  static onClickTile(tile, interaction) {
    if (!interaction.button === 0) return; // Left click only

    const linkedActorId = tile.getFlag('rnk-wasteland-hud', 'linkedActorId');
    if (!linkedActorId) return; // Not a Display tile

    const actor = game.actors.get(linkedActorId);
    if (!actor) {
      ui.notifications.warn('Display Tile: Actor not found');
      return;
    }

    // Create and open the tile app
    const app = new DisplayTileApp(tile, linkedActorId, {
      title: `${actor.name} - Quick Access`
    });
    app.render(true);
  }

  /**
   * Create a new Display tile at a specific location
   * Usage: DisplayTileConfig.createDisplayTile(actorId, x, y)
   */
  static async createDisplayTile(actorId, x = 0, y = 0) {
    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.error('Actor not found');
      return;
    }

    // Create tile data
    const tileData = {
      texture: {
        src: actor.img
      },
      x: x,
      y: y,
      width: 200,
      height: 200,
      z: 100,
      alpha: 1,
      hidden: false,
      locked: false,
      overhead: true,
      roof: false,
      occlusion: {
        mode: 0,
        alpha: 0
      },
      flags: {
        'rnk-wasteland-hud': {
          linkedActorId: actorId,
          tileType: 'characterQuickAccess'
        }
      }
    };

    // Create the tile in the scene
    const tile = await canvas.scene.createEmbeddedDocuments('Tile', [tileData]);
    
    console.log('RNK™ Wasteland HUD | Display tile created:', {
      id: tile[0].id,
      locked: tile[0].locked,
      actor: actor.name
    });
    
    ui.notifications.info(`Created Display Tile for ${actor.name}. Click the Tiles control (left sidebar) to move it.`);
    return tile[0];
  }

  /**
   * Add a button to the tile config dialog for creating Display tiles
   */
  static addDisplayTileButton() {
    if (!game.user.isGM) return;

    // Create a dialog for tile creation
    const dialog = new Dialog({
      title: 'Create Display Tile',
      content: `
        <form>
          <div class="form-group">
            <label>Select Actor:</label>
            <select id="actor-select" class="form-control">
              <option value="">-- Select an Actor --</option>
              ${game.actors.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
            </select>
          </div>
        </form>
      `,
      buttons: {
        create: {
          label: 'Create Tile',
          callback: (html) => {
            const actorId = html.find('#actor-select').val();
            if (!actorId) {
              ui.notifications.warn('Please select an actor');
              return;
            }
            DisplayTileConfig.createDisplayTile(actorId, canvas.mouseX, canvas.mouseY);
          }
        },
        cancel: {
          label: 'Cancel'
        }
      }
    });
    dialog.render(true);
  }

  /**
   * Render Display overlay on linked tiles
   */
  static renderTileOverlay(tile) {
    const tileDoc = tile.document;
    if (!tileDoc.getFlag('rnk-wasteland-hud', 'isDisplayDisplayTile')) return;

    const linkedTokenId = tileDoc.getFlag('rnk-wasteland-hud', 'linkedTokenId');
    if (!linkedTokenId) return;

    const token = canvas.tokens.get(linkedTokenId);
    if (!token) return;

    // Create or update the overlay
    if (!tile.DisplayOverlay) {
      tile.DisplayOverlay = new DisplayTileOverlay(tile, token);
      tile.addChild(tile.DisplayOverlay);
    } else {
      tile.DisplayOverlay.refresh(token);
    }
  }
}

/**
 * PIXI overlay for displaying Display data on tiles
 */
class DisplayTileOverlay extends PIXI.Container {
  constructor(tile, token) {
    super();
    this.tile = tile;
    this.token = token;
    this.draw();
  }

  draw() {
    this.removeChildren();
    if (!this.token) return;

    const width = this.tile.document.width;
    const height = this.tile.document.height;

    // Get the token's Display config
    const config = DisplaySettings.getFlag(this.token.document, 'config') || {};
    const preset = VisualEffects.PRESETS[config.preset] || VisualEffects.PRESETS.classic;

    // Get display content using the same parser as token Displays
    const content = DisplayContentParser.getDisplayContent(this.token, config);

    // Create background
    const bg = new PIXI.Graphics();
    const bgColor = parseInt(preset.backgroundColor?.replace('#', '0x') || '0x000000');
    bg.beginFill(bgColor, 0.9);
    bg.drawRoundedRect(0, 0, width, height, config.borderRadius || 8);
    bg.endFill();
    
    // Add border
    if (preset.borderWidth && preset.borderWidth > 0) {
      const borderColor = parseInt(preset.borderColor?.replace('#', '0x') || '0x666666');
      bg.lineStyle(preset.borderWidth, borderColor, 1);
      bg.drawRoundedRect(0, 0, width, height, config.borderRadius || 8);
    }
    this.addChild(bg);

    // Create text with preset styling
    const style = VisualEffects.createTextStyle(preset, config.fontSize || 16);
    style.wordWrap = true;
    style.wordWrapWidth = width - 20;
    
    const textElement = new PIXI.Text(content, style);
    textElement.x = 10;
    textElement.y = 10;
    this.addChild(textElement);

    // Add progress bars if configured
    if (config.showHealthBar && this.token.actor?.system?.attributes?.hp) {
      const hp = this.token.actor.system.attributes.hp;
      const barY = textElement.y + textElement.height + 10;
      const barWidth = width - 20;
      const barHeight = 8;
      
      const hpPercent = Math.max(0, Math.min(1, hp.value / hp.max));
      
      // Background
      const barBg = new PIXI.Graphics();
      barBg.beginFill(0x333333);
      barBg.drawRoundedRect(10, barY, barWidth, barHeight, 3);
      barBg.endFill();
      this.addChild(barBg);
      
      // Fill
      const barFill = new PIXI.Graphics();
      const hpColor = hpPercent > 0.5 ? 0x44bb44 : hpPercent > 0.25 ? 0xddaa00 : 0xdd4444;
      barFill.beginFill(hpColor);
      barFill.drawRoundedRect(10, barY, barWidth * hpPercent, barHeight, 3);
      barFill.endFill();
      this.addChild(barFill);
    }
  }

  refresh(token) {
    this.token = token;
    this.draw();
  }
}

export { DisplayTileConfig, DisplayTileApp, DisplayTileOverlay };

