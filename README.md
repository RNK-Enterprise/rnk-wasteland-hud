# RNK™ Wasteland HUD

A post-apocalyptic token HUD system for Foundry VTT featuring movable overlays, dynamic data displays, progress bars, and salvaged bunker aesthetics.

![Foundry VTT](https://img.shields.io/badge/Foundry-v11--v13-informational)
![Version](https://img.shields.io/badge/Version-2.0.1-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

### Token Display System
- **Movable HUD Overlays** - Drag and position display elements anywhere on screen
- **Dynamic Resource Bars** - HP, mana, stamina with customizable colors and styles
- **Condition Tracking** - Visual indicators for status effects and conditions
- **Shape Borders** - Multiple border styles including hexagonal, circular, and rectangular

### Combat Features
- **Turn Timer** - Visual countdown for combat rounds
- **Combat Stats Tracker** - Track damage dealt, healing, kills, and more
- **Concentration Tracking** - Automatic concentration spell monitoring (D&D 5e)
- **Click-to-Roll** - Quick dice rolling from token displays

### Visual Effects
- **Particle System** - Customizable particle effects for tokens
- **Background Textures** - Apply textures and patterns to displays
- **Visual Presets** - Pre-configured visual styles for quick setup
- **Cinematic Mode** - Dramatic visual presentations

### Multiplayer Features
- **Player Cursors** - See other players' cursor positions
- **Ping Effects** - Alert players to specific locations
- **Typing Indicators** - Know when others are typing
- **Shared Notes** - Collaborative note-taking on tokens

### Quality of Life
- **Radial Menu** - Quick action wheel for common tasks
- **Quick Actions** - Customizable action buttons
- **Keyboard Shortcuts** - Hotkeys for frequent operations
- **Party Frames** - Group health and status overview
- **Speech Bubbles** - In-game dialogue display
- **Inventory Display** - Quick item access from tokens

### Customization
- **Preset Builder** - Create and save custom display configurations
- **Plugin System** - Extend functionality with custom plugins
- **Scene Stats Widget** - Display scene-wide statistics

## Supported Systems

- D&D 5th Edition (dnd5e)
- Pathfinder 2nd Edition (pf2e)
- Savage Worlds Adventure Edition (swade)
- Warhammer Fantasy Roleplay 4th Edition (wfrp4e)
- Chroniques Oubliees Fantasy (cof)

## Installation

### Method 1: Foundry VTT Module Browser
1. Open Foundry VTT
2. Navigate to **Add-on Modules** tab
3. Click **Install Module**
4. Search for "RNK Wasteland HUD"
5. Click **Install**

### Method 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/RNK-Enterprise/rnk-wasteland-hud/releases)
2. Extract to your `Data/modules/` folder
3. Restart Foundry VTT

### Method 3: Manifest URL
```
https://raw.githubusercontent.com/RNK-Enterprise/rnk-wasteland-hud/main/module.json
```

## Quick Start

1. Enable the module in your world's **Module Management**
2. Select a token and right-click to access the configuration
3. Customize display settings in the configuration panel
4. Use `/rnk help` in chat for available commands

## Configuration

Access module settings via **Game Settings > Module Settings > RNK Wasteland HUD**

Key settings include:
- Default display styles
- Animation preferences
- Multiplayer feature toggles
- Keyboard shortcut bindings

## Chat Commands

| Command | Description |
|---------|-------------|
| `/rnk help` | Display available commands |
| `/rnk config` | Open configuration panel |
| `/rnk preset [name]` | Apply a saved preset |
| `/rnk reset` | Reset to default settings |

## Compatibility

- **Foundry VTT**: Version 11 - 13
- **Browser**: Modern browsers with ES6+ support

## Support

- **Issues**: [GitHub Issues](https://github.com/RNK-Enterprise/rnk-wasteland-hud/issues)
- **Discord**: RNK

## License

This module is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Credits

Developed by RNK™

---

*Survive the wasteland with style.*
