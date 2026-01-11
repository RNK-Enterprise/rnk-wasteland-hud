/**
 * RNK™ Wasteland HUD - Hooks Manager
 * Manages all Foundry VTT hooks for the Display system
 * @author RNK™
 * @version 2.0.1
 */

import { TokenDisplay } from "./token-display-class.js";
import { DisplaySettings } from "../settings.js";
import { VisualEffects } from "../visual-effects.js";
import { DisplayConfigApp } from "../config-app.js";
import { DisplayPlacer } from "../display-placer.js";

export class HooksManager {
  static registerHooks() {
    this._registerTokenHooks();
    this._registerCombatHooks();
    this._registerRenderHooks();
    this._registerCanvasHooks();
    this._registerTileHooks();
  }

  static _registerTokenHooks() {
    Hooks.on("refreshToken", (token) => {
      const displayPos = DisplaySettings.getFlag(token.document, "displayPosition");
      const config = DisplaySettings.getFlag(token.document, "config") || {};
      const enabled = DisplaySettings.getFlag(token.document, "enabled");
      
      if (!displayPos || enabled === false) {
        // No waypoint set or disabled - remove display
        if (token.rnkDisplay) {
          canvas.interface.removeChild(token.rnkDisplay);
          token.rnkDisplay.destroy();
          token.rnkDisplay = null;
        }
        return;
      }
      
      if (!token.rnkDisplay) {
        // Create Display in interface layer for proper interactivity
        token.rnkDisplay = new TokenDisplay(token);
        canvas.interface.addChild(token.rnkDisplay);
      } else {
        token.rnkDisplay.refresh();
      }
      
      if (config.visibility === "selected") {
        token.rnkDisplay.visible = token.controlled;
      }
    });

    Hooks.on("destroyToken", (token) => {
      if (token.rnkDisplay) {
        canvas.interface.removeChild(token.rnkDisplay);
        token.rnkDisplay.destroy();
        token.rnkDisplay = null;
      }
    });

    Hooks.on("controlToken", (token, controlled) => {
      if (!token.rnkDisplay) return;
      
      const config = DisplaySettings.getFlag(token.document, "config") || {};
      if (config.visibility === "selected") {
        token.rnkDisplay.visible = controlled;
        if (controlled && DisplaySettings.get("enableAnimations")) {
          VisualEffects.animateFadeIn(token.rnkDisplay, 200);
        }
      }
    });

    Hooks.on("hoverToken", (token, hovered) => {
      if (!token.rnkDisplay) return;
      
      const config = DisplaySettings.getFlag(token.document, "config") || {};
      if (config.visibility === "hover") {
        if (hovered) {
          token.rnkDisplay.visible = true;
          if (DisplaySettings.get("enableAnimations")) {
            VisualEffects.animateFadeIn(token.rnkDisplay, 150);
          }
        } else {
          if (DisplaySettings.get("enableAnimations")) {
            VisualEffects.animateFadeOut(token.rnkDisplay, 150, () => {
              token.rnkDisplay.visible = false;
            });
          } else {
            token.rnkDisplay.visible = false;
          }
        }
      }
    });

    Hooks.on("updateActor", async (actor, changes, options, userId) => {
      // Update all TokenDisplays for this actor
      canvas.tokens.placeables.forEach(token => {
        if (token.actor && token.actor.id === actor.id && token.rnkDisplay) {
          token.rnkDisplay.refresh();
        }
      });
      
      // Update all Display Tiles linked to this actor
      const tiles = canvas.scene.tiles.filter(tile => 
        tile.flags?.["rnk-wasteland-hud"]?.isDisplayTile && 
        tile.flags?.["rnk-wasteland-hud"]?.linkedActorId === actor.id
      );
      
      for (const tile of tiles) {
        await HooksManager._updateDisplayTile(tile);
      }
    });
  }

  static _registerCombatHooks() {
    Hooks.on("updateCombat", (combat, changed, options, userId) => {
      if (!DisplaySettings.get("combatHighlight")) return;
      
      canvas.tokens.placeables.forEach(token => {
        if (token.rnkDisplay) {
          token.rnkDisplay.refresh();
        }
      });
    });

    Hooks.on("combatStart", (combat) => {
      canvas.tokens.placeables.forEach(token => {
        if (token.rnkDisplay) {
          const config = DisplaySettings.getFlag(token.document, "config") || {};
          if (config.visibility === "combat") {
            token.rnkDisplay.visible = true;
            if (DisplaySettings.get("enableAnimations")) {
              VisualEffects.animateFadeIn(token.rnkDisplay);
            }
          }
        }
      });
    });

    Hooks.on("combatEnd", (combat) => {
      canvas.tokens.placeables.forEach(token => {
        if (token.rnkDisplay) {
          VisualEffects.stopPulse(token.rnkDisplay);
          
          const config = DisplaySettings.getFlag(token.document, "config") || {};
          if (config.visibility === "combat") {
            token.rnkDisplay.visible = false;
          }
        }
      });
    });
  }

  static _registerRenderHooks() {
    // Hub button is now added by hub-module.js
    // No token HUD button needed anymore
  }

  static _registerCanvasHooks() {
    Hooks.on("canvasPan", () => {
      if (DisplaySettings.get("distanceFade") === 0) return;
      
      canvas.tokens.placeables.forEach(token => {
        if (token.rnkDisplay && token.rnkDisplay.visible) {
          VisualEffects.applyDistanceFade(token.rnkDisplay, token);
        }
      });
    });
  }

  /**
   * Update a display tile's texture to reflect current actor data
   * @param {TileDocument} tile - The tile to update
   */
  static async _updateDisplayTile(tile) {
    const { SystemIntegration } = await import('../system-integration.js');
    
    const actorId = tile.flags["rnk-wasteland-hud"].linkedActorId;
    const tokenId = tile.flags["rnk-wasteland-hud"].linkedTokenId;
    const config = tile.flags["rnk-wasteland-hud"].displayConfig;
    
    const actor = game.actors.get(actorId);
    const token = canvas.tokens.get(tokenId);
    
    if (!actor || !config) return;
    
    // Get token image
    const tokenImgSrc = token?.document.texture.src || actor.img || "icons/svg/mystery-man.svg";
    
    // Generate updated content
    const displayContent = SystemIntegration.parseContentVariables(
      config.content,
      actor,
      token?.document
    );
    
    // Render tile to canvas
    const { dataUrl, width: totalWidth, height: totalHeight } = await HooksManager._renderTileToCanvas(
      tokenImgSrc,
      displayContent,
      config
    );

    // Update the tile document
    await tile.update({
      "texture.src": dataUrl,
      width: totalWidth,
      height: totalHeight
    });
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
      const absoluteUrl = HooksManager._toAbsoluteAssetUrl(tokenImgSrc);
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

  static _registerTileHooks() {
    // Add interactive overlay to display tiles
    Hooks.on("refreshTile", (tile) => {
      if (!tile.document.flags?.["rnk-wasteland-hud"]?.isDisplayTile) return;
      
      // Remove existing overlay if present
      if (tile.rnkDisplayOverlay) {
        canvas.interface.removeChild(tile.rnkDisplayOverlay);
        tile.rnkDisplayOverlay.destroy();
        tile.rnkDisplayOverlay = null;
      }
      
      // Create interactive overlay
      const overlay = new PIXI.Container();
      overlay.eventMode = 'static';
      overlay.cursor = 'pointer';
      overlay.zIndex = 10000;
      
      // Create hitArea matching tile size
      const hitBox = new PIXI.Graphics();
      hitBox.beginFill(0x000000, 0.01); // Nearly invisible but interactive
      hitBox.drawRect(0, 0, tile.document.width, tile.document.height);
      hitBox.endFill();
      overlay.addChild(hitBox);
      
      overlay.hitArea = new PIXI.Rectangle(0, 0, tile.document.width, tile.document.height);
      overlay.position.set(tile.document.x, tile.document.y);
      
      // Disable overlay when on tiles layer so tile can be dragged normally
      const updateOverlayInteractivity = () => {
        const onTilesLayer = canvas.activeLayer === canvas.tiles;
        overlay.eventMode = onTilesLayer ? 'none' : 'static';
        overlay.visible = !onTilesLayer; // Hide overlay on tiles layer
      };
      
      updateOverlayInteractivity();
      
      // Update when layer changes
      Hooks.on('canvasReady', updateOverlayInteractivity);
      
      // Right-click opens config (only when not on tiles layer)
      overlay.on('rightdown', (event) => {
        event.stopPropagation();
        const tokenId = tile.document.flags["rnk-wasteland-hud"].linkedTokenId;
        const token = canvas.tokens.get(tokenId);
        
        if (token) {
          new DisplayConfigApp(token).render(true);
        } else {
          ui.notifications.warn("Linked token not found. Delete this tile from the Tiles layer.");
        }
      });
      
      // Left-click for selection feedback
      overlay.on('pointerdown', (event) => {
        event.stopPropagation();
        ui.notifications.info("Right-click to configure. Switch to Tiles layer (T key) to drag.");
      });
      
      tile.rnkDisplayOverlay = overlay;
      canvas.interface.addChild(overlay);
    });
    
    // Clean up overlay when tile is destroyed
    Hooks.on("destroyTile", (tile) => {
      if (tile.rnkDisplayOverlay) {
        canvas.interface.removeChild(tile.rnkDisplayOverlay);
        tile.rnkDisplayOverlay.destroy();
        tile.rnkDisplayOverlay = null;
      }
    });
    
    // Make display tiles right-clickable from tile config sheet
    Hooks.on("renderTileConfig", (app, html, data) => {
      const tileDoc = app.object;
      if (!tileDoc.flags?.["rnk-wasteland-hud"]?.isDisplayTile) return;
      
      // Add button to open display config
      const footer = html.find('.sheet-footer');
      const button = $(`<button type="button" class="open-display-config">
        <i class="fas fa-cog"></i> Open Display Config
      </button>`);
      
      button.on('click', async (e) => {
        e.preventDefault();
        const tokenId = tileDoc.flags["rnk-wasteland-hud"].linkedTokenId;
        const token = canvas.tokens.get(tokenId);
        
        if (!token) {
          ui.notifications.warn("Linked token not found on scene.");
          return;
        }
        
        new DisplayConfigApp(token).render(true);
        app.close();
      });
      
      footer.prepend(button);
    });
  }

  static setupAnimationTicker() {
    canvas.app.ticker.add((delta) => {
      canvas.tokens.placeables.forEach(token => {
        if (token.rnkDisplay) {
          token.rnkDisplay.updateParticles(delta);
        }
      });
    });
  }
}
