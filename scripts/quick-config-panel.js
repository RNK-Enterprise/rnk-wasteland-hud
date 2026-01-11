/**
 * Quick Config Panel
 * Floating toolbar for instant access to common Display features
 * Migrated to Foundry V2 Application framework for Foundry v12+
 */

export class QuickConfigPanel extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
) {
    static MODULE_ID = 'rnk-wasteland-hud';
    
    static DEFAULT_OPTIONS = {
        id: 'rnk-wasteland-hud-quick-panel',
        classes: ['rnk-wasteland-hud', 'quick-config-panel'],
        window: {
            title: 'Quick Display Config',
            resizable: false,
            minimizable: true
        },
        position: {
            width: 320,
            height: 'auto'
        }
    };

    static PARTS = {
        form: {
            template: 'modules/rnk-wasteland-hud/templates/quick-config-panel.html'
        }
    };
    
    async _prepareContext() {
        const token = canvas.tokens?.controlled[0];
        
        if (!token) {
            return {
                hasToken: false,
                message: 'Select a token to configure'
            };
        }
        
        const opacity = token.document.getFlag(QuickConfigPanel.MODULE_ID, 'opacity') || 1.0;
        const combatMode = token.document.getFlag(QuickConfigPanel.MODULE_ID, 'combatMode') || 'exploration';
        
        return {
            hasToken: true,
            tokenName: token.name,
            enabled: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'enabled') || false,
            preset: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'preset') || 'classic',
            scale: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'scale') || 1.0,
            opacity: opacity,
            opacityPercent: Math.round(opacity * 100),
            particlesEnabled: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'particles.enabled') || false,
            combatMode: combatMode,
            isCombatMode: combatMode === 'combat',
            presets: [
                { value: 'classic', label: 'Classic' },
                { value: 'fantasy-Displays', label: 'Fantasy Displays' },
                { value: 'modern', label: 'Modern' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'scifi', label: 'Sci-Fi' },
                { value: 'parchment', label: 'Parchment' },
                { value: 'neon', label: 'Neon' },
                { value: 'fire', label: 'Fire' },
                { value: 'ice', label: 'Ice' },
                { value: 'lightning', label: 'Lightning' },
                { value: 'nature', label: 'Nature' },
                { value: 'shadow', label: 'Shadow' },
                { value: 'holy', label: 'Holy' },
                { value: 'arcane', label: 'Arcane' },
                { value: 'poison', label: 'Poison' },
                { value: 'blood', label: 'Blood' }
            ]
        };
    }
    
    _onRender(context, options) {
        super._onRender(context, options);
        
        const html = $(this.element);
        
        // Enable/disable toggle
        html.find('[name="enabled"]').on('change', this._onToggleEnabled.bind(this));
        
        // Preset selector
        html.find('[name="preset"]').on('change', this._onChangePreset.bind(this));
        
        // Scale slider
        html.find('[name="scale"]').on('input', this._onChangeScale.bind(this));
        
        // Opacity slider
        html.find('[name="opacity"]').on('input', this._onChangeOpacity.bind(this));
        
        // Particles toggle
        html.find('[name="particles"]').on('change', this._onToggleParticles.bind(this));
        
        // Combat mode toggle
        html.find('[name="combat-mode"]').on('change', this._onToggleCombatMode.bind(this));
        
        // Quick actions
        html.find('.quick-action').on('click', this._onQuickAction.bind(this));
        
        // Apply to all party button
        html.find('.apply-to-party').on('click', this._onApplyToParty.bind(this));
        
        // Refresh on token control
        Hooks.on('controlToken', () => {
            if (this.rendered) this.render();
        });
    }
    
    async _onToggleEnabled(event) {
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        const enabled = event.target.checked;
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'enabled', enabled);
    }
    
    async _onChangePreset(event) {
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        const preset = event.target.value;
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'preset', preset);
    }
    
    async _onChangeScale(event) {
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        const scale = parseFloat(event.target.value);
        $(event.target).siblings('.value-display').text(scale.toFixed(1) + 'x');
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'scale', scale);
    }
    
    async _onChangeOpacity(event) {
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        const opacity = parseFloat(event.target.value);
        $(event.target).siblings('.value-display').text(Math.round(opacity * 100) + '%');
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'opacity', opacity);
    }
    
    async _onToggleParticles(event) {
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        const enabled = event.target.checked;
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'particles.enabled', enabled);
    }
    
    async _onToggleCombatMode(event) {
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        const mode = event.target.checked ? 'combat' : 'exploration';
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'combatMode', mode);
    }
    
    async _onQuickAction(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        switch (action) {
            case 'reset':
                await this._resetToDefaults(token);
                break;
            case 'copy':
                this._copyConfig(token);
                break;
            case 'paste':
                await this._pasteConfig(token);
                break;
            case 'speech':
                this._createSpeechBubble(token);
                break;
        }
    }
    
    async _resetToDefaults(token) {
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'enabled', true);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'preset', 'classic');
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'scale', 1.0);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'opacity', 1.0);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'particles.enabled', false);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'combatMode', 'exploration');
        
        this.render();
        ui.notifications.info('Reset to defaults');
    }
    
    _copyConfig(token) {
        const config = {
            enabled: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'enabled'),
            preset: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'preset'),
            scale: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'scale'),
            opacity: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'opacity'),
            particlesEnabled: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'particles.enabled'),
            combatMode: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'combatMode')
        };
        
        game.RNKDisplays = game.RNKDisplays || {};
        game.RNKDisplays.copiedConfig = config;
        
        ui.notifications.info('Configuration copied');
    }
    
    async _pasteConfig(token) {
        const config = game.RNKDisplays?.copiedConfig;
        
        if (!config) {
            ui.notifications.warn('No configuration copied');
            return;
        }
        
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'enabled', config.enabled);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'preset', config.preset);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'scale', config.scale);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'opacity', config.opacity);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'particles.enabled', config.particlesEnabled);
        await token.document.setFlag(QuickConfigPanel.MODULE_ID, 'combatMode', config.combatMode);
        
        this.render();
        ui.notifications.info('Configuration pasted');
    }
    
    _createSpeechBubble(token) {
        new Dialog({
            title: 'Speech Bubble',
            content: `<input type="text" name="speech" placeholder="Enter speech..." autofocus />`,
            buttons: {
                create: {
                    label: 'Create',
                    callback: (html) => {
                        const speech = html.find('[name="speech"]').val();
                        if (game.RNKDisplays?.speechBubbles) {
                            game.RNKDisplays.speechBubbles.create(token, speech, 3000);
                        }
                    }
                }
            },
            default: 'create'
        }).render(true);
    }
    
    async _onApplyToParty() {
        const token = canvas.tokens?.controlled[0];
        if (!token) return;
        
        const config = {
            enabled: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'enabled'),
            preset: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'preset'),
            scale: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'scale'),
            opacity: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'opacity'),
            particlesEnabled: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'particles.enabled'),
            combatMode: token.document.getFlag(QuickConfigPanel.MODULE_ID, 'combatMode')
        };
        
        const partyTokens = canvas.tokens.placeables.filter(t => 
            t.actor?.hasPlayerOwner && t.id !== token.id
        );
        
        for (const partyToken of partyTokens) {
            await partyToken.document.setFlag(QuickConfigPanel.MODULE_ID, 'enabled', config.enabled);
            await partyToken.document.setFlag(QuickConfigPanel.MODULE_ID, 'preset', config.preset);
            await partyToken.document.setFlag(QuickConfigPanel.MODULE_ID, 'scale', config.scale);
            await partyToken.document.setFlag(QuickConfigPanel.MODULE_ID, 'opacity', config.opacity);
            await partyToken.document.setFlag(QuickConfigPanel.MODULE_ID, 'particles.enabled', config.particlesEnabled);
            await partyToken.document.setFlag(QuickConfigPanel.MODULE_ID, 'combatMode', config.combatMode);
        }
        
        ui.notifications.info(`Applied config to ${partyTokens.length} party token(s)`);
    }
}

// Add toggle button to token controls
Hooks.on('getSceneControlButtons', (controls) => {
    if (!controls || !controls.length) return;
    
    const tokenControls = controls.find(c => c?.name === 'token');
    if (!tokenControls) return;
    
    if (tokenControls) {
        tokenControls.tools.push({
            name: 'quick-config-panel',
            title: 'Quick Display Config',
            icon: 'fas fa-sliders-h',
            button: true,
            onClick: () => {
                if (!game.RNKDisplays.quickPanel) {
                    game.RNKDisplays.quickPanel = new QuickConfigPanel();
                }
                game.RNKDisplays.quickPanel.render(true);
            }
        });
    }
});


