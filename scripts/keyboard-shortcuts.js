/**
 * Keyboard Shortcuts System
 * Provides quick access to common Display operations via keyboard
 */

export class KeyboardShortcuts {
    static MODULE_ID = 'rnk-wasteland-hud';
    
    static init() {
        console.log('RNK\'s Displays | Registering keyboard shortcuts...');
        
        // Register all keybindings during init hook
        this.registerKeybindings();
        
        console.log('RNK\'s Displays | Keyboard shortcuts registered');
    }

    static ready() {
        // Add Alt+Click handler after game is ready
        this.registerAltClickHandler();
        this.setupHotbar4Macro();
    }
    
    static async setupHotbar4Macro() {
        // Create or update a macro in hotbar slot 4 for Quick Config Panel
        if (!game.user.isGM) return;
        
        const macroName = "RNK Quick Config";
        
        // Check if macro already exists (by name and flag, not author which may differ)
        let macro = game.macros.find(m => m.name === macroName && m.flags?.["rnk-wasteland-hud"]?.autoCreated);
        
        if (!macro) {
            macro = await Macro.create({
                name: macroName,
                type: "script",
                img: "icons/svg/gear.svg",
                command: `
// RNK Wasteland HUD - Open Quick Config Panel
if (!game.RNKDisplays) game.RNKDisplays = {};
if (!game.RNKDisplays.quickPanel) {
    import('/modules/rnk-wasteland-hud/scripts/quick-config-panel.js').then(module => {
        game.RNKDisplays.quickPanel = new module.QuickConfigPanel();
        game.RNKDisplays.quickPanel.render(true);
    });
} else {
    game.RNKDisplays.quickPanel.render(true);
}
`,
                flags: { "rnk-wasteland-hud": { autoCreated: true } }
            });
        }
        
        // Assign to hotbar slot 4
        if (macro) {
            await game.user.assignHotbarMacro(macro, 4);
            console.log("RNK™ Wasteland HUD | Quick Config macro assigned to hotbar slot 4");
        }
    }
    
    static registerKeybindings() {
        // Ctrl+4: Open Quick Config Panel (alternative if hotbar doesn't work)
        game.keybindings.register(this.MODULE_ID, 'open-quick-config', {
            name: 'Open Quick Config Panel',
            hint: 'Open the quick Display configuration panel',
            editable: [
                {
                    key: 'Digit4',
                    modifiers: ['Control']
                }
            ],
            onDown: () => {
                this.openQuickConfigPanel();
                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY
        });

        // Ctrl+R: Toggle Displays on/off for selected tokens
        game.keybindings.register(this.MODULE_ID, 'toggle-Displays', {
            name: 'Toggle Displays',
            hint: 'Enable/disable Displays on selected tokens',
            editable: [
                {
                    key: 'KeyR',
                    modifiers: ['Control']
                }
            ],
            onDown: () => {
                this.toggleDisplays();
                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
        
        // Ctrl+Shift+P: Open preset builder
        game.keybindings.register(this.MODULE_ID, 'open-preset-builder', {
            name: 'Open Preset Builder',
            hint: 'Open the preset builder interface',
            editable: [
                {
                    key: 'KeyP',
                    modifiers: ['Control', 'Shift']
                }
            ],
            onDown: () => {
                this.openPresetBuilder();
                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
        
        // Ctrl+Shift+B: Create speech bubble
        game.keybindings.register(this.MODULE_ID, 'create-speech-bubble', {
            name: 'Create Speech Bubble',
            hint: 'Create a speech bubble for selected tokens',
            editable: [
                {
                    key: 'KeyB',
                    modifiers: ['Control', 'Shift']
                }
            ],
            onDown: () => {
                this.createSpeechBubble();
                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
        
        // Ctrl+Shift+C: Toggle combat mode
        game.keybindings.register(this.MODULE_ID, 'toggle-combat-mode', {
            name: 'Toggle Combat Mode',
            hint: 'Switch between exploration and combat display modes',
            editable: [
                {
                    key: 'KeyC',
                    modifiers: ['Control', 'Shift']
                }
            ],
            onDown: () => {
                this.toggleCombatMode();
                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
        
        // Ctrl+Shift+T: Toggle particles
        game.keybindings.register(this.MODULE_ID, 'toggle-particles', {
            name: 'Toggle Particles',
            hint: 'Enable/disable particle effects on selected tokens',
            editable: [
                {
                    key: 'KeyT',
                    modifiers: ['Control', 'Shift']
                }
            ],
            onDown: () => {
                this.toggleParticles();
                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
        
        // Shift+MouseWheel: Adjust Display scale (handled separately)
        game.keybindings.register(this.MODULE_ID, 'scale-with-wheel', {
            name: 'Scale with Mouse Wheel',
            hint: 'Hold Shift and scroll to adjust Display scale on hover',
            editable: [],
            onDown: () => true, // Handled by mouse wheel event
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
    }
    
    static registerAltClickHandler() {
        // Alt+Click on token to quick config
        Hooks.on('controlToken', (token, controlled) => {
            if (!controlled) return;
            
            const altPressed = game.keyboard?.isModifierActive('Alt');
            if (altPressed) {
                this.quickConfig(token);
            }
        });
        
        // Mouse wheel with Shift for scaling
        document.addEventListener('wheel', (event) => {
            if (!event.shiftKey) return;
            
            const hoverToken = canvas.tokens?.hover;
            if (!hoverToken) return;
            
            event.preventDefault();
            
            const delta = event.deltaY > 0 ? -0.1 : 0.1;
            const currentScale = hoverToken.document.getFlag(this.MODULE_ID, 'scale') || 1.0;
            const newScale = Math.max(0.5, Math.min(3.0, currentScale + delta));
            
            hoverToken.document.setFlag(this.MODULE_ID, 'scale', newScale);
            
            ui.notifications.info(`Display scale: ${newScale.toFixed(1)}x`);
        }, { passive: false });
    }
    
    // Handler functions
    
    static toggleDisplays() {
        const controlled = canvas.tokens?.controlled;
        if (!controlled || controlled.length === 0) {
            ui.notifications.warn('No tokens selected');
            return;
        }
        
        let enabledCount = 0;
        let disabledCount = 0;
        
        for (const token of controlled) {
            const currentState = token.document.getFlag(this.MODULE_ID, 'enabled');
            const newState = !currentState;
            
            token.document.setFlag(this.MODULE_ID, 'enabled', newState);
            
            if (newState) enabledCount++;
            else disabledCount++;
        }
        
        const message = enabledCount > 0 
            ? `Enabled Displays on ${enabledCount} token(s)`
            : `Disabled Displays on ${disabledCount} token(s)`;
        
        ui.notifications.info(message);
    }
    
    static openPresetBuilder() {
        if (game.RNKDisplays?.presetBuilder) {
            game.RNKDisplays.presetBuilder.render(true);
        } else {
            ui.notifications.error('Preset builder not available');
        }
    }
    
    static createSpeechBubble() {
        const controlled = canvas.tokens?.controlled;
        if (!controlled || controlled.length === 0) {
            ui.notifications.warn('No tokens selected');
            return;
        }
        
        // Prompt for speech text
        new Dialog({
            title: 'Create Speech Bubble',
            content: `
                <form>
                    <div class="form-group">
                        <label>Speech Text:</label>
                        <input type="text" name="speech" autofocus />
                    </div>
                    <div class="form-group">
                        <label>Duration (seconds):</label>
                        <input type="number" name="duration" value="3" min="1" max="30" />
                    </div>
                </form>
            `,
            buttons: {
                create: {
                    icon: '<i class="fas fa-comment"></i>',
                    label: 'Create',
                    callback: (html) => {
                        const speech = html.find('[name="speech"]').val();
                        const duration = parseInt(html.find('[name="duration"]').val()) * 1000;
                        
                        for (const token of controlled) {
                            if (game.RNKDisplays?.speechBubbles) {
                                game.RNKDisplays.speechBubbles.create(token, speech, duration);
                            }
                        }
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'create'
        }).render(true);
    }
    
    static toggleCombatMode() {
        const controlled = canvas.tokens?.controlled;
        if (!controlled || controlled.length === 0) {
            ui.notifications.warn('No tokens selected');
            return;
        }
        
        for (const token of controlled) {
            const currentMode = token.document.getFlag(this.MODULE_ID, 'combatMode');
            const newMode = currentMode === 'combat' ? 'exploration' : 'combat';
            
            token.document.setFlag(this.MODULE_ID, 'combatMode', newMode);
        }
        
        const mode = controlled[0].document.getFlag(this.MODULE_ID, 'combatMode');
        ui.notifications.info(`Switched to ${mode} mode`);
    }
    
    static toggleParticles() {
        const controlled = canvas.tokens?.controlled;
        if (!controlled || controlled.length === 0) {
            ui.notifications.warn('No tokens selected');
            return;
        }
        
        let enabledCount = 0;
        let disabledCount = 0;
        
        for (const token of controlled) {
            const currentState = token.document.getFlag(this.MODULE_ID, 'particles.enabled');
            const newState = !currentState;
            
            token.document.setFlag(this.MODULE_ID, 'particles.enabled', newState);
            
            if (newState) enabledCount++;
            else disabledCount++;
        }
        
        const message = enabledCount > 0 
            ? `Enabled particles on ${enabledCount} token(s)`
            : `Disabled particles on ${disabledCount} token(s)`;
        
        ui.notifications.info(message);
    }
    
    static quickConfig(token) {
        // Open a quick config dialog
        new Dialog({
            title: `Quick Config: ${token.name}`,
            content: `
                <form>
                    <div class="form-group">
                        <label>Enable Display:</label>
                        <input type="checkbox" name="enabled" ${token.document.getFlag(this.MODULE_ID, 'enabled') ? 'checked' : ''} />
                    </div>
                    <div class="form-group">
                        <label>Preset:</label>
                        <select name="preset">
                            <option value="classic">Classic</option>
                            <option value="fantasy-Displays">Fantasy Displays</option>
                            <option value="modern">Modern</option>
                            <option value="minimal">Minimal</option>
                            <option value="scifi">Sci-Fi</option>
                            <option value="parchment">Parchment</option>
                            <option value="fire">Fire</option>
                            <option value="ice">Ice</option>
                            <option value="shadow">Shadow</option>
                            <option value="holy">Holy</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Scale:</label>
                        <input type="range" name="scale" min="0.5" max="3" step="0.1" value="${token.document.getFlag(this.MODULE_ID, 'scale') || 1}" />
                        <span class="scale-value">${token.document.getFlag(this.MODULE_ID, 'scale') || 1}</span>
                    </div>
                    <div class="form-group">
                        <label>Particles:</label>
                        <input type="checkbox" name="particles" ${token.document.getFlag(this.MODULE_ID, 'particles.enabled') ? 'checked' : ''} />
                    </div>
                </form>
            `,
            buttons: {
                apply: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Apply',
                    callback: (html) => {
                        const enabled = html.find('[name="enabled"]').is(':checked');
                        const preset = html.find('[name="preset"]').val();
                        const scale = parseFloat(html.find('[name="scale"]').val());
                        const particles = html.find('[name="particles"]').is(':checked');
                        
                        token.document.setFlag(this.MODULE_ID, 'enabled', enabled);
                        token.document.setFlag(this.MODULE_ID, 'preset', preset);
                        token.document.setFlag(this.MODULE_ID, 'scale', scale);
                        token.document.setFlag(this.MODULE_ID, 'particles.enabled', particles);
                        
                        ui.notifications.info('Quick config applied');
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'apply',
            render: (html) => {
                // Update scale display on slider change
                html.find('[name="scale"]').on('input', (event) => {
                    html.find('.scale-value').text(event.target.value);
                });
            }
        }).render(true);
    }

    static openQuickConfigPanel() {
        // Import and open the Quick Config Panel
        if (!game.RNKDisplays) game.RNKDisplays = {};
        
        if (!game.RNKDisplays.quickPanel) {
            // Dynamically import the QuickConfigPanel
            import('./quick-config-panel.js').then(module => {
                game.RNKDisplays.quickPanel = new module.QuickConfigPanel();
                game.RNKDisplays.quickPanel.render(true);
            }).catch(err => {
                console.error('RNK™ Wasteland HUD | Failed to load Quick Config Panel:', err);
                ui.notifications.error('Failed to open Quick Config Panel');
            });
        } else {
            game.RNKDisplays.quickPanel.render(true);
        }
    }
}

// Run only the ready-phase setup here. Keybindings must be registered during
// the init hook (and are already invoked from the module init). Calling
// KeyboardShortcuts.init() here causes Foundry to attempt keybinding
// registration too late and throws. So only call the ready() helper.
Hooks.once('ready', () => {
    try {
        if (typeof KeyboardShortcuts.ready === 'function') KeyboardShortcuts.ready();
    } catch (err) {
        console.warn("RNK™ Wasteland HUD | KeyboardShortcuts.ready() failed", err);
    }
});


