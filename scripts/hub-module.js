/**
 * RNK™ Wasteland HUD Control Hub
 * Scene control button to open configuration
 */

import { DisplayConfigApp } from './config-app.js';

export function initializeHub() {
    // Add hub button to scene controls
    function addHubButton() {
        const layersMenu = document.getElementById('scene-controls-layers') || 
                          document.querySelector('#scene-controls ol') ||
                          document.querySelector('#scene-controls menu') ||
                          document.querySelector('#scene-controls .main-controls');
        
        if (!layersMenu) {
            console.log('RNK™ Wasteland HUD | Scene controls not found yet');
            return false;
        }
        
        // Check if button already exists
        if (document.querySelector('.rnk-wasteland-hub-control')) return true;
        
        // Create hub button
        const li = document.createElement('li');
        li.className = 'rnk-wasteland-hub-control';
        
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'control ui-control layer icon fa-solid fa-biohazard';
        button.style.color = '#39ff14';
        button.style.textShadow = '0 0 10px #39ff14';
        button.setAttribute('data-tooltip', 'RNK™ Wasteland HUD');
        button.setAttribute('aria-label', 'RNK™ Wasteland HUD');
        button.onclick = () => {
            const tokens = canvas.tokens.controlled;
            
            if (tokens.length === 0) {
                ui.notifications.warn('Please select a token first');
                return;
            }
            
            if (tokens.length > 1) {
                ui.notifications.warn('Please select only one token');
                return;
            }
            
            // Open the full configuration app
            new DisplayConfigApp(tokens[0]).render(true);
        };
        
        li.appendChild(button);
        layersMenu.appendChild(li);
        console.log('RNK™ Wasteland HUD | Hub button added');
        return true;
    }
    
    // Try on renderSceneControls hook
    Hooks.on('renderSceneControls', () => {
        addHubButton();
    });
    
    // Also try immediately with timeout as fallback
    setTimeout(() => {
        if (!document.querySelector('.rnk-wasteland-hub-control')) {
            addHubButton();
        }
    }, 500);
}
