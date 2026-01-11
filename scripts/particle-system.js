/**
 * RNK Wasteland HUD - Particle Effects System
 * Animated particles, auras, and elemental effects
 */

export class ParticleSystem extends PIXI.Container {
  constructor(options = {}) {
    super();
    this.particlePool = [];
    this.activeParticles = [];
    this.maxParticles = options.maxParticles || 100;
    this.emitterConfig = options.config || {};
    this.isActive = false;
  }

  static createElementalAura(element, radius = 50) {
    const configs = {
      fire: {
        particleColor: [0xff4400, 0xff8800, 0xffaa00],
        particleSize: [3, 8],
        lifetime: [0.5, 1.5],
        speed: [20, 40],
        acceleration: {x: 0, y: -30},
        spawnRadius: radius,
        spawnRate: 20,
        alpha: [0.8, 0],
        scale: [1, 0.3],
        rotation: [0, Math.PI * 2],
        blendMode: PIXI.BLEND_MODES.ADD
      },
      ice: {
        particleColor: [0x88ccff, 0xaaddff, 0xccffff],
        particleSize: [2, 5],
        lifetime: [1, 2],
        speed: [10, 20],
        acceleration: {x: 0, y: 5},
        spawnRadius: radius,
        spawnRate: 15,
        alpha: [0.6, 0],
        scale: [1, 0.5],
        rotation: [0, Math.PI],
        blendMode: PIXI.BLEND_MODES.NORMAL
      },
      lightning: {
        particleColor: [0xffff00, 0xffffaa, 0xffffff],
        particleSize: [4, 10],
        lifetime: [0.2, 0.5],
        speed: [50, 100],
        acceleration: {x: 0, y: 0},
        spawnRadius: radius,
        spawnRate: 30,
        alpha: [1, 0],
        scale: [1.5, 0],
        rotation: [0, 0],
        blendMode: PIXI.BLEND_MODES.ADD,
        flicker: true
      },
      nature: {
        particleColor: [0x44ff44, 0x88ff88, 0xaaffaa],
        particleSize: [3, 6],
        lifetime: [1.5, 2.5],
        speed: [5, 15],
        acceleration: {x: 0, y: -10},
        spawnRadius: radius,
        spawnRate: 12,
        alpha: [0.7, 0],
        scale: [0.5, 1.2],
        rotation: [0, Math.PI * 4],
        blendMode: PIXI.BLEND_MODES.NORMAL
      },
      shadow: {
        particleColor: [0x220022, 0x440044, 0x660066],
        particleSize: [5, 12],
        lifetime: [1, 2],
        speed: [5, 15],
        acceleration: {x: 0, y: 10},
        spawnRadius: radius,
        spawnRate: 18,
        alpha: [0.8, 0],
        scale: [1, 0.2],
        rotation: [0, Math.PI],
        blendMode: PIXI.BLEND_MODES.MULTIPLY
      },
      holy: {
        particleColor: [0xffffaa, 0xffffff, 0xffffee],
        particleSize: [2, 6],
        lifetime: [1, 2],
        speed: [10, 25],
        acceleration: {x: 0, y: -20},
        spawnRadius: radius,
        spawnRate: 25,
        alpha: [1, 0],
        scale: [0.8, 0.3],
        rotation: [0, Math.PI * 2],
        blendMode: PIXI.BLEND_MODES.ADD,
        twinkle: true
      },
      poison: {
        particleColor: [0x44ff00, 0x88ff44, 0x44aa00],
        particleSize: [4, 8],
        lifetime: [1.5, 2.5],
        speed: [8, 18],
        acceleration: {x: 0, y: -5},
        spawnRadius: radius,
        spawnRate: 15,
        alpha: [0.7, 0],
        scale: [1, 0.5],
        rotation: [0, Math.PI],
        blendMode: PIXI.BLEND_MODES.NORMAL,
        drift: true
      }
    };
    
    return new ParticleSystem({
      config: configs[element] || configs.fire,
      maxParticles: 200
    });
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.lastSpawnTime = Date.now();
    this.update();
  }

  stop() {
    this.isActive = false;
  }

  update() {
    if (!this.isActive) return;
    
    const now = Date.now();
    const delta = (now - (this.lastUpdateTime || now)) / 1000;
    this.lastUpdateTime = now;
    
    // Spawn new particles
    const spawnInterval = 1000 / this.emitterConfig.spawnRate;
    if (now - this.lastSpawnTime > spawnInterval) {
      this.spawnParticle();
      this.lastSpawnTime = now;
    }
    
    // Update existing particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      this.updateParticle(particle, delta);
      
      if (particle.life <= 0) {
        this.removeParticle(i);
      }
    }
    
    if (this.isActive) {
      requestAnimationFrame(() => this.update());
    }
  }

  spawnParticle() {
    if (this.activeParticles.length >= this.maxParticles) return;
    
    const particle = this.getParticleFromPool();
    const config = this.emitterConfig;
    
    // Random position in spawn radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * config.spawnRadius;
    particle.x = Math.cos(angle) * distance;
    particle.y = Math.sin(angle) * distance;
    
    // Random velocity
    const speed = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0]);
    const velocityAngle = Math.random() * Math.PI * 2;
    particle.vx = Math.cos(velocityAngle) * speed;
    particle.vy = Math.sin(velocityAngle) * speed;
    
    // Properties
    particle.life = config.lifetime[0] + Math.random() * (config.lifetime[1] - config.lifetime[0]);
    particle.maxLife = particle.life;
    particle.startAlpha = config.alpha[0];
    particle.endAlpha = config.alpha[1];
    particle.startScale = config.scale[0];
    particle.endScale = config.scale[1];
    
    // Visual
    const colorIndex = Math.floor(Math.random() * config.particleColor.length);
    particle.tint = config.particleColor[colorIndex];
    particle.blendMode = config.blendMode || PIXI.BLEND_MODES.NORMAL;
    
    const size = config.particleSize[0] + Math.random() * (config.particleSize[1] - config.particleSize[0]);
    particle.width = size;
    particle.height = size;
    
    this.activeParticles.push(particle);
    this.addChild(particle);
  }

  updateParticle(particle, delta) {
    const config = this.emitterConfig;
    
    // Apply acceleration
    if (config.acceleration) {
      particle.vx += config.acceleration.x * delta;
      particle.vy += config.acceleration.y * delta;
    }
    
    // Apply drift (sine wave movement)
    if (config.drift) {
      particle.vx += Math.sin(Date.now() / 1000 + particle.x) * 10 * delta;
    }
    
    // Update position
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    
    // Update life
    particle.life -= delta;
    const lifeRatio = particle.life / particle.maxLife;
    
    // Update alpha
    particle.alpha = particle.startAlpha + (particle.endAlpha - particle.startAlpha) * (1 - lifeRatio);
    
    // Update scale
    const scale = particle.startScale + (particle.endScale - particle.startScale) * (1 - lifeRatio);
    particle.scale.set(scale);
    
    // Update rotation
    if (config.rotation) {
      particle.rotation += (config.rotation[1] - config.rotation[0]) * delta;
    }
    
    // Flicker effect
    if (config.flicker) {
      particle.alpha *= 0.5 + Math.random() * 0.5;
    }
    
    // Twinkle effect
    if (config.twinkle) {
      particle.alpha *= 0.3 + Math.sin(Date.now() / 100 + particle.x) * 0.7;
    }
  }

  getParticleFromPool() {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop();
    }
    
    // Create new particle sprite
    const particle = new PIXI.Graphics();
    particle.beginFill(0xffffff);
    particle.drawCircle(0, 0, 1);
    particle.endFill();
    particle.anchor = {x: 0.5, y: 0.5};
    
    return particle;
  }

  removeParticle(index) {
    const particle = this.activeParticles[index];
    this.removeChild(particle);
    this.particlePool.push(particle);
    this.activeParticles.splice(index, 1);
  }

  destroy(options) {
    this.stop();
    this.activeParticles.forEach(p => this.removeChild(p));
    this.activeParticles = [];
    this.particlePool = [];
    super.destroy(options);
  }
}

/**
 * Magic Circle Effect
 */
export class MagicCircle extends PIXI.Container {
  constructor(radius = 60, color = 0x4488ff) {
    super();
    this.radius = radius;
    this.color = color;
    this.rotation = 0;
    this.rotationSpeed = 0.01;
    
    this.createCircle();
    this.animate();
  }

  createCircle() {
    const graphics = new PIXI.Graphics();
    
    // Outer circle
    graphics.lineStyle(2, this.color, 0.8);
    graphics.drawCircle(0, 0, this.radius);
    
    // Inner circle
    graphics.lineStyle(1, this.color, 0.6);
    graphics.drawCircle(0, 0, this.radius * 0.7);
    
    // Display symbols around circle
    const DisplayCount = 8;
    for (let i = 0; i < DisplayCount; i++) {
      const angle = (Math.PI * 2 / DisplayCount) * i;
      const x = Math.cos(angle) * this.radius * 0.85;
      const y = Math.sin(angle) * this.radius * 0.85;
      
      graphics.lineStyle(2, this.color, 0.7);
      graphics.moveTo(x - 5, y - 5);
      graphics.lineTo(x + 5, y + 5);
      graphics.moveTo(x + 5, y - 5);
      graphics.lineTo(x - 5, y + 5);
    }
    
    // Pentagram or star
    const points = 5;
    const outerRadius = this.radius * 0.5;
    const innerRadius = this.radius * 0.2;
    
    graphics.lineStyle(2, this.color, 0.6);
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI * 2 / (points * 2)) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.closePath();
    
    this.addChild(graphics);
    
    // Add glow
    const glow = new PIXI.Graphics();
    glow.beginFill(this.color, 0.1);
    glow.drawCircle(0, 0, this.radius * 1.2);
    glow.endFill();
    glow.filters = [new PIXI.filters.BlurFilter(8)];
    this.addChildAt(glow, 0);
  }

  animate() {
    this.rotation += this.rotationSpeed;
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  destroy(options) {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    super.destroy(options);
  }
}

