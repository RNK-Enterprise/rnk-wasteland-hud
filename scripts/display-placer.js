/**
 * RNK™ Wasteland HUD - Display Placer
 * Waypoint-based display placement system
 */

import { TokenDisplay } from "./core/token-display-class.js";
import { DisplaySettings } from "./settings.js";
import { DisplayConfigApp } from "./config-app.js";

export class DisplayPlacer {
  static placementMode = false;
  static currentToken = null;
  static crosshair = null;

  static async startPlacement(token) {
    if (!token || !token.actor) {
      ui.notifications.warn("Please select a token first");
      return;
    }

    this.currentToken = token;
    this.placementMode = true;

    // Create crosshair
    this.crosshair = new PIXI.Graphics();
    this.crosshair.lineStyle(2, 0x39ff14, 1);
    this.crosshair.drawCircle(0, 0, 20);
    this.crosshair.moveTo(-25, 0);
    this.crosshair.lineTo(25, 0);
    this.crosshair.moveTo(0, -25);
    this.crosshair.lineTo(0, 25);
    canvas.controls.addChild(this.crosshair);

    // Add event listeners
    canvas.stage.on('pointermove', this._onMouseMove);
    canvas.stage.on('click', this._onCanvasClick);

    ui.notifications.info("Click on the canvas to place the display. Right-click to cancel.");
  }

  static _onMouseMove(event) {
    if (!DisplayPlacer.placementMode || !DisplayPlacer.crosshair) return;
    
    const pos = event.data.getLocalPosition(canvas.stage);
    DisplayPlacer.crosshair.x = pos.x;
    DisplayPlacer.crosshair.y = pos.y;
  }

  static async _onCanvasClick(event) {
    if (!DisplayPlacer.placementMode) return;
    
    // Right-click cancels
    if (event.data.button === 2) {
      DisplayPlacer.cancelPlacement();
      return;
    }

    const pos = event.data.getLocalPosition(canvas.stage);
    
    // Store absolute position in flags
    await DisplaySettings.setFlag(DisplayPlacer.currentToken.document, "displayPosition", {
      x: pos.x,
      y: pos.y
    });

    // Enable the display
    await DisplaySettings.setFlag(DisplayPlacer.currentToken.document, "enabled", true);
    
    // Create or refresh the display
    if (DisplayPlacer.currentToken.rnkDisplay) {
      DisplayPlacer.currentToken.rnkDisplay.refresh();
    } else {
      DisplayPlacer.currentToken.rnkDisplay = new TokenDisplay(DisplayPlacer.currentToken);
      canvas.interface.addChild(DisplayPlacer.currentToken.rnkDisplay);
    }

    ui.notifications.info("Display placed! Double-click the display to configure.");
    
    DisplayPlacer.cancelPlacement();
  }

  static cancelPlacement() {
    this.placementMode = false;
    this.currentToken = null;

    if (this.crosshair) {
      canvas.controls.removeChild(this.crosshair);
      this.crosshair.destroy();
      this.crosshair = null;
    }

    canvas.stage.off('pointermove', this._onMouseMove);
    canvas.stage.off('click', this._onCanvasClick);
  }
}
