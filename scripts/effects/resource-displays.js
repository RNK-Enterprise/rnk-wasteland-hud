/**
 * RNK™ Wasteland HUD - Resource Displays
 * Progress bars, resource bars, and display elements
 * @module effects/resource-displays
 */

export class ResourceDisplays {
  static createProgressBar(width, height, percentage, color = "#ff0000", showText = true) {
    const container = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.5);
    bg.drawRoundedRect(0, 0, width, height, 2);
    bg.endFill();
    container.addChild(bg);
    
    const fillWidth = Math.max(0, (width - 4) * (percentage / 100));
    const fill = new PIXI.Graphics();
    fill.beginFill(PIXI.utils.string2hex(color), 1);
    fill.drawRoundedRect(2, 2, fillWidth, height - 4, 2);
    fill.endFill();
    container.addChild(fill);
    
    const border = new PIXI.Graphics();
    border.lineStyle(1, 0xffffff, 0.5);
    border.drawRoundedRect(0, 0, width, height, 2);
    container.addChild(border);
    
    if (showText) {
      const text = new PIXI.Text(`${Math.round(percentage)}%`, {
        fontSize: Math.max(8, height - 4),
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: "#000000",
        strokeThickness: 2
      });
      text.anchor.set(0.5);
      text.x = width / 2;
      text.y = height / 2;
      container.addChild(text);
    }
    
    return container;
  }

  static createAdvancedResourceBar(resources, width, options = {}) {
    const container = new PIXI.Container();
    const layout = options.layout || "stacked";
    const showIcons = options.showIcons !== false;
    const iconSize = options.iconSize || 16;
    const barHeight = options.barHeight || 8;
    const spacing = options.spacing || 2;
    
    let currentY = 0;
    
    resources.forEach((resource, index) => {
      const resourceBar = this.createSingleResourceBar(resource, width, {
        barHeight,
        showIcons,
        iconSize
      });
      
      if (layout === "stacked") {
        resourceBar.y = currentY;
        currentY += barHeight + spacing;
      } else {
        const barWidth = (width - (resources.length - 1) * spacing) / resources.length;
        resourceBar.x = index * (barWidth + spacing);
        resourceBar.scale.x = barWidth / width;
      }
      
      container.addChild(resourceBar);
    });
    
    return container;
  }
  
  static createSingleResourceBar(resource, width, options = {}) {
    const container = new PIXI.Container();
    const barHeight = options.barHeight || 8;
    const showIcons = options.showIcons !== false;
    const iconSize = options.iconSize || 16;
    
    const current = resource.current || 0;
    const max = resource.max || 1;
    const percentage = Math.min(100, (current / max) * 100);
    const color = resource.color || "#4444ff";
    const icon = resource.icon || null;
    const label = resource.label || "";
    
    let barX = 0;
    
    if (showIcons && icon) {
      const iconContainer = this.createResourceIcon(icon, iconSize);
      iconContainer.x = 0;
      iconContainer.y = (barHeight - iconSize) / 2;
      container.addChild(iconContainer);
      barX = iconSize + 4;
    }
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.5);
    bg.drawRoundedRect(barX, 0, width - barX, barHeight, 2);
    bg.endFill();
    container.addChild(bg);
    
    const fillWidth = Math.max(0, (width - barX - 4) * (percentage / 100));
    const fill = new PIXI.Graphics();
    fill.beginFill(PIXI.utils.string2hex(color), 1);
    fill.drawRoundedRect(barX + 2, 2, fillWidth, barHeight - 4, 2);
    fill.endFill();
    container.addChild(fill);
    
    const border = new PIXI.Graphics();
    border.lineStyle(1, 0xffffff, 0.3);
    border.drawRoundedRect(barX, 0, width - barX, barHeight, 2);
    container.addChild(border);
    
    if (label || resource.showValue) {
      const text = resource.showValue ? `${current}/${max}` : label;
      
      const textStyle = new PIXI.TextStyle({
        fontSize: Math.max(8, barHeight - 2),
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: "#000000",
        strokeThickness: 1
      });
      
      const textElement = new PIXI.Text(text, textStyle);
      textElement.anchor.set(0.5);
      textElement.x = barX + (width - barX) / 2;
      textElement.y = barHeight / 2;
      container.addChild(textElement);
    }
    
    return container;
  }
  
  static createResourceIcon(iconName, size) {
    const container = new PIXI.Container();
    
    const style = new PIXI.TextStyle({
      fontFamily: "FontAwesome, Arial",
      fontSize: size,
      fill: "#ffffff"
    });
    
    const icon = new PIXI.Text(iconName, style);
    icon.anchor.set(0.5);
    icon.x = size / 2;
    icon.y = size / 2;
    container.addChild(icon);
    
    return container;
  }
  
  static createSpellSlotDisplay(current, max, level, width) {
    const container = new PIXI.Container();
    const pipSize = 12;
    const spacing = 4;
    const totalWidth = (pipSize * max) + (spacing * (max - 1));
    
    const colors = [
      0xCCCCCC, 0x4444FF, 0x44AAFF, 0x44FFAA, 0x44FF44,
      0xAAAA44, 0xFFAA44, 0xFF4444, 0xFF44AA, 0xAA44FF
    ];
    
    const color = colors[Math.min(level, 9)];
    const startX = (width - totalWidth) / 2;
    
    for (let i = 0; i < max; i++) {
      const pip = new PIXI.Graphics();
      
      if (i < current) {
        pip.beginFill(color, 1);
      } else {
        pip.lineStyle(2, color, 0.5);
        pip.beginFill(0x000000, 0.3);
      }
      
      pip.drawCircle(0, 0, pipSize / 2);
      pip.endFill();
      
      pip.x = startX + (i * (pipSize + spacing)) + pipSize / 2;
      pip.y = pipSize / 2;
      
      container.addChild(pip);
    }
    
    return container;
  }
  
  static createPointDisplay(current, max, width, options = {}) {
    const container = new PIXI.Container();
    const style = options.style || "pips";
    const color = options.color || 0xFFAA00;
    const icon = options.icon || "circle";
    
    if (style === "pips") {
      const pipSize = 10;
      const spacing = 3;
      const totalWidth = (pipSize * max) + (spacing * (max - 1));
      const startX = (width - totalWidth) / 2;
      
      for (let i = 0; i < max; i++) {
        const pip = new PIXI.Graphics();
        
        if (i < current) {
          pip.beginFill(color, 1);
        } else {
          pip.lineStyle(2, color, 0.4);
          pip.beginFill(0x000000, 0.2);
        }
        
        pip.drawCircle(0, 0, pipSize / 2);
        pip.endFill();
        
        pip.x = startX + (i * (pipSize + spacing)) + pipSize / 2;
        pip.y = pipSize / 2;
        
        container.addChild(pip);
      }
    } else {
      const bar = this.createSingleResourceBar({
        current,
        max,
        color: `#${color.toString(16).padStart(6, '0')}`,
        icon,
        showValue: true
      }, width, { barHeight: 12, iconSize: 14 });
      
      container.addChild(bar);
    }
    
    return container;
  }
}
