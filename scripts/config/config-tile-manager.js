/**
 * RNK™ Wasteland HUD - Config Tile Manager
 * Handles tile creation and linking functionality
 * @module config/config-tile-manager
 */

import { DisplaySettings } from "../settings.js";

export class ConfigTileManager {
  constructor(app) {
    this.app = app;
  }

  static _toAbsoluteAssetUrl(src) {
    if (!src) return src;
    if (/^(data:|https?:)/i.test(src)) return src;

    try {
      if (foundry?.utils?.getRoute) return foundry.utils.getRoute(src);
    } catch (e) {
      // ignore
    }

    try {
      const cleaned = String(src).replace(/^\.\//, '');
      return new URL(cleaned.startsWith('/') ? cleaned : `/${cleaned}`, window.location.origin).href;
    } catch (e) {
      return src;
    }
  }

  /**
   * Convert an image URL to a base64 data URI
   * Required because data:image/svg+xml can't load external images
   */
  static async _imageToBase64(src) {
    if (!src) return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";
    if (src.startsWith("data:")) return src;
    
    try {
      const absoluteUrl = ConfigTileManager._toAbsoluteAssetUrl(src);
      const response = await fetch(absoluteUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=");
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("RNK Wasteland HUD | Failed to convert image to base64:", src, e);
      return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";
    }
  }

  /**
   * Render tile content to a Canvas and return as data URL
   */
  static async _renderTileToCanvas(tokenImgSrc, displayContent, config) {
    const imgSize = 100;
    const gap = 15;
    const padding = 10;
    const textBoxWidth = config.width;
    const textBoxHeight = 100;
    
    const totalWidth = imgSize + gap + textBoxWidth + padding * 2;
    const totalHeight = Math.max(imgSize, textBoxHeight) + padding;
    
    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    // Load token image
    const tokenImg = new Image();
    tokenImg.crossOrigin = "anonymous";
    
    await new Promise((resolve) => {
      tokenImg.onload = resolve;
      tokenImg.onerror = resolve;
      const absoluteUrl = ConfigTileManager._toAbsoluteAssetUrl(tokenImgSrc);
      tokenImg.src = absoluteUrl;
    });
    
    // Draw circular token image with border
    const imgX = padding;
    const imgY = (totalHeight - imgSize) / 2;
    
    // Draw border circle
    ctx.beginPath();
    ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2 + 3, 0, Math.PI * 2);
    ctx.fillStyle = config.borderColor;
    ctx.fill();
    
    // Clip to circle and draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 0, Math.PI * 2);
    ctx.clip();
    
    if (tokenImg.complete && tokenImg.naturalWidth > 0) {
      ctx.drawImage(tokenImg, imgX, imgY, imgSize, imgSize);
    } else {
      // Fallback - draw placeholder
      ctx.fillStyle = '#333';
      ctx.fillRect(imgX, imgY, imgSize, imgSize);
    }
    ctx.restore();
    
    // Draw text box background
    const textX = imgX + imgSize + gap;
    const textY = (totalHeight - textBoxHeight) / 2;
    
    ctx.globalAlpha = config.opacity;
    ctx.fillStyle = config.backgroundColor;
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    
    // Rounded rectangle
    const radius = config.borderRadius;
    ctx.beginPath();
    ctx.moveTo(textX + radius, textY);
    ctx.lineTo(textX + textBoxWidth - radius, textY);
    ctx.quadraticCurveTo(textX + textBoxWidth, textY, textX + textBoxWidth, textY + radius);
    ctx.lineTo(textX + textBoxWidth, textY + textBoxHeight - radius);
    ctx.quadraticCurveTo(textX + textBoxWidth, textY + textBoxHeight, textX + textBoxWidth - radius, textY + textBoxHeight);
    ctx.lineTo(textX + radius, textY + textBoxHeight);
    ctx.quadraticCurveTo(textX, textY + textBoxHeight, textX, textY + textBoxHeight - radius);
    ctx.lineTo(textX, textY + radius);
    ctx.quadraticCurveTo(textX, textY, textX + radius, textY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.globalAlpha = 1;
    
    // Draw text
    ctx.fillStyle = config.textColor;
    ctx.font = `${config.fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = displayContent.split('\n');
    const lineHeight = config.fontSize * 1.3;
    const textCenterX = textX + textBoxWidth / 2;
    const textStartY = textY + textBoxHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, i) => {
      ctx.fillText(line, textCenterX, textStartY + i * lineHeight);
    });
    
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: totalWidth,
      height: totalHeight
    };
  }

  async onCreateDisplayTile(event) {
    event.preventDefault();
    
    if (!game.user.isGM) {
      ui.notifications.warn("Only the GM can create display tiles.");
      return;
    }

    const actor = this.app.token.actor;
    if (!actor) {
      ui.notifications.warn("Token must have an associated actor.");
      return;
    }
    
    // Get current config from the form
    const formData = this.app.element.querySelector('form');
    const config = {
      content: formData.querySelector('[name="content"]')?.value || "@name\nHP: @hp\nAC: @ac",
      fontSize: parseInt(formData.querySelector('[name="fontSize"]')?.value) || 14,
      textColor: formData.querySelector('[name="textColor"]')?.value || "#ffffff",
      backgroundColor: formData.querySelector('[name="backgroundColor"]')?.value || "#000000",
      borderColor: formData.querySelector('[name="borderColor"]')?.value || "#666666",
      borderWidth: parseInt(formData.querySelector('[name="borderWidth"]')?.value) || 2,
      borderRadius: parseInt(formData.querySelector('[name="borderRadius"]')?.value) || 5,
      opacity: parseFloat(formData.querySelector('[name="opacity"]')?.value) || 0.8,
      width: parseInt(formData.querySelector('[name="width"]')?.value) || 200,
      preset: formData.querySelector('[name="preset"]')?.value || "classic"
    };

    // Generate HTML content for the tile
    const { SystemIntegration } = await import('../system-integration.js');
    const displayContent = SystemIntegration.parseContentVariables(
      config.content,
      actor,
      this.app.token.document
    );
    
    // Get token image
    const tokenImgSrc = this.app.token.document.texture.src || actor.img || "icons/svg/mystery-man.svg";
    
    // Render tile to canvas
    const { dataUrl, width: totalWidth, height: totalHeight } = await ConfigTileManager._renderTileToCanvas(
      tokenImgSrc,
      displayContent,
      config
    );

    const centerX = canvas.stage.pivot.x;
    const centerY = canvas.stage.pivot.y;

    const tileData = {
      texture: {
        src: dataUrl
      },
      x: centerX - (totalWidth / 2),
      y: centerY - (totalHeight / 2),
      width: totalWidth,
      height: totalHeight,
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
        "rnk-wasteland-hud": {
          isDisplayTile: true,
          linkedTokenId: this.app.token.id,
          linkedActorId: actor.id,
          displayConfig: config
        }
      }
    };

    try {
      const [createdTile] = await canvas.scene.createEmbeddedDocuments("Tile", [tileData]);
      
      console.log('RNK™ Wasteland HUD | Display tile created:', {
        id: createdTile.id,
        locked: createdTile.locked,
        hidden: createdTile.hidden,
        x: createdTile.x,
        y: createdTile.y
      });
      
      // Link tile to config
      await DisplaySettings.setFlag(this.app.token.document, "linkedTileId", createdTile.id);
      await DisplaySettings.setFlag(this.app.token.document, "linkToTile", true);
      
      // Switch to tiles layer and select the tile
      await canvas.tiles.activate();
      const tileObject = canvas.tiles.get(createdTile.id);
      if (tileObject) {
        tileObject.control({ releaseOthers: true });
        canvas.animatePan({ x: tileObject.center.x, y: tileObject.center.y, duration: 250 });
      }
      
      ui.notifications.info(`Display tile created and selected! Drag to reposition. Use Delete Linked Tile button in config to remove it.`);
      
      const checkbox = this.app.element.querySelector('[name="linkToTile"]');
      if (checkbox) checkbox.checked = true;
      
      const select = this.app.element.querySelector('[name="linkedTileId"]');
      if (select) {
        const option = document.createElement('option');
        option.value = createdTile.id;
        option.textContent = `Tile ${createdTile.id.slice(-4)} (${actor.name}'s Display)`;
        option.selected = true;
        select.appendChild(option);
      }

    } catch (err) {
      console.error("[RNK™ Wasteland HUD] Failed to create display tile:", err);
      ui.notifications.error("Failed to create display tile.");
    }
  }

  onSelectTileFromCanvas(event) {
    event.preventDefault();
    
    if (!game.user.isGM) {
      ui.notifications.warn("Only the GM can select tiles.");
      return;
    }

    ui.notifications.info("Click on a tile in the scene to select it...");
    this.app.minimize();

    const handler = async (event) => {
      const pos = canvas.app.renderer.events.pointer.getLocalPosition(canvas.stage);
      
      const clickedTiles = canvas.tiles.placeables.filter(tile => {
        const bounds = tile.bounds;
        return pos.x >= bounds.left && pos.x <= bounds.right &&
               pos.y >= bounds.top && pos.y <= bounds.bottom;
      });

      if (clickedTiles.length > 0) {
        const selectedTile = clickedTiles[0];
        
        const select = this.app.element.querySelector('[name="linkedTileId"]');
        if (select) {
          select.value = selectedTile.id;
        }

        await DisplaySettings.setFlag(selectedTile.document, "linkedTokenId", this.app.token.id);
        await DisplaySettings.setFlag(selectedTile.document, "linkedActorId", this.app.token.actor?.id);
        await DisplaySettings.setFlag(selectedTile.document, "isDisplayDisplayTile", true);

        ui.notifications.info(`Linked tile to ${this.app.token.name}`);
      } else {
        ui.notifications.warn("No tile found at that location.");
      }

      this.app.maximize();
      canvas.stage.off('pointerdown', handler);
    };

    canvas.stage.once('pointerdown', handler);
  }
}
