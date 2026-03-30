const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDo2N0QnGcpiSeYCm9n4uMZ6JoOjsDXxF0FE52J6sCKUVt4wGDQL0WDbFCKsCEcaasiA/exec';

class MathVector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }
    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        let m = this.mag();
        if (m !== 0) this.div(m);
        return this;
    }
    dist(v) {
        let dx = this.x - v.x;
        let dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    lerp(v, amt) {
        this.x += (v.x - this.x) * amt;
        this.y += (v.y - this.y) * amt;
        return this;
    }
    copy() {
        return new MathVector(this.x, this.y);
    }
}

class MathUtils {
    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    static lerp(start, end, amt) {
        return start + (end - start) * amt;
    }
}

class InputController {
    constructor(canvas) {
        this.canvas = canvas;
        this.position = new MathVector();
        this.lastPosition = new MathVector();
        this.velocity = new MathVector();
        this.dragStart = new MathVector();
        this.isPressed = false;
        this.justPressed = false;
        this.justReleased = false;
        this.bounds = canvas.getBoundingClientRect();
        this.initializeEvents();
    }
    refreshBounds() {
        this.bounds = this.canvas.getBoundingClientRect();
    }
    extractCoordinates(e) {
        let x = 0;
        let y = 0;
        if (e.clientX !== undefined) {
            x = e.clientX;
            y = e.clientY;
        } else if (e.touches && e.touches.length > 0) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        }
        return new MathVector(x - this.bounds.left, y - this.bounds.top);
    }
    initializeEvents() {
        window.addEventListener('resize', () => {
            this.refreshBounds();
        });
        const handleDown = (e) => {
            this.refreshBounds();
            const p = this.extractCoordinates(e);
            this.position.set(p.x, p.y);
            this.lastPosition.set(p.x, p.y);
            this.dragStart.set(p.x, p.y);
            this.isPressed = true;
            this.justPressed = true;
            this.velocity.set(0, 0);
        };
        const handleMove = (e) => {
            if (this.isPressed) {
                const p = this.extractCoordinates(e);
                this.velocity.set(p.x - this.position.x, p.y - this.position.y);
                this.lastPosition.set(this.position.x, this.position.y);
                this.position.set(p.x, p.y);
            }
        };
        const handleUp = () => {
            this.isPressed = false;
            this.justReleased = true;
        };
        
        this.canvas.addEventListener('mousedown', handleDown);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        this.canvas.addEventListener('touchstart', handleDown, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
    }
    clearFrameFlags() {
        this.justPressed = false;
        this.justReleased = false;
        this.velocity.mult(0.3);
    }
}

class DOMManager {
    constructor() {
        this.wrapper = document.getElementById('application-wrapper');
        this.layerLogin = document.getElementById('layer-login');
        this.layerResults = document.getElementById('layer-results');
        this.inputName = document.getElementById('input-name');
        this.inputSector = document.getElementById('input-sector');
        this.triggerStart = document.getElementById('trigger-start');
        this.triggerReset = document.getElementById('trigger-reset');
        this.displayIdentity = document.getElementById('display-identity');
        this.displayPoints = document.getElementById('display-points');
        this.hudElement = null;
        this.phaseText = null;
        this.scoreText = null;
        
        this.toastContainer = document.createElement('div');
        this.toastContainer.style.position = 'fixed';
        this.toastContainer.style.bottom = '0';
        this.toastContainer.style.right = '0';
        this.toastContainer.style.padding = '2rem';
        this.toastContainer.style.display = 'flex';
        this.toastContainer.style.flexDirection = 'column';
        this.toastContainer.style.gap = '1rem';
        this.toastContainer.style.zIndex = '100';
        this.toastContainer.style.pointerEvents = 'none';
        document.body.appendChild(this.toastContainer);
    }
    hideLogin() {
        if (this.layerLogin) {
            this.layerLogin.classList.remove('active');
            this.layerLogin.classList.add('hidden');
        }
    }
    showResults(name, sector, score) {
        if (this.hudElement) this.hudElement.remove();
        if (this.layerResults) {
            this.layerResults.classList.remove('hidden');
            this.layerResults.classList.add('active');
        }
        if (this.displayIdentity) this.displayIdentity.textContent = `${name} • ${sector}`;
        if (this.displayPoints) this.displayPoints.textContent = score;
    }
    injectHUD() {
        if (this.wrapper) {
            const hud = document.createElement('div');
            hud.style.position = 'absolute';
            hud.style.top = '0';
            hud.style.left = '0';
            hud.style.width = '100%';
            hud.style.padding = '1.5rem';
            hud.style.display = 'flex';
            hud.style.justifyContent = 'space-between';
            hud.style.alignItems = 'flex-start';
            hud.style.pointerEvents = 'none';
            hud.style.zIndex = '10';
            
            const leftBox = document.createElement('div');
            leftBox.style.background = 'rgba(11, 17, 32, 0.6)';
            leftBox.style.backdropFilter = 'blur(16px)';
            leftBox.style.border = '1px solid rgba(56, 189, 248, 0.15)';
            leftBox.style.padding = '0.75rem 1.25rem';
            leftBox.style.borderRadius = '1rem';
            leftBox.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
            leftBox.innerHTML = `<span style="font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 0.25rem; font-weight: 800;">Progresso</span><span class="phase-text" style="font-size: 1.1rem; color: #f8fafc; font-weight: 900; letter-spacing: -0.02em;">Fase 1/4</span>`;
            
            const rightBox = document.createElement('div');
            rightBox.style.background = 'rgba(11, 17, 32, 0.6)';
            rightBox.style.backdropFilter = 'blur(16px)';
            rightBox.style.border = '1px solid rgba(16, 185, 129, 0.2)';
            rightBox.style.padding = '0.75rem 1.25rem';
            rightBox.style.borderRadius = '1rem';
            rightBox.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
            rightBox.style.textAlign = 'right';
            rightBox.innerHTML = `<span style="font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 0.25rem; font-weight: 800;">Score Atual</span><span class="score-text" style="font-size: 1.1rem; color: #10b981; font-weight: 900; font-family: monospace; letter-spacing: -0.05em; text-shadow: 0 0 10px rgba(16,185,129,0.5);">0000</span>`;
            
            hud.appendChild(leftBox);
            hud.appendChild(rightBox);
            this.wrapper.appendChild(hud);
            
            this.hudElement = hud;
            this.phaseText = leftBox.querySelector('.phase-text');
            this.scoreText = rightBox.querySelector('.score-text');
        }
    }
    updateHUD(phase, score) {
        if (this.phaseText) this.phaseText.textContent = `Fase ${phase}/4`;
        if (this.scoreText) this.scoreText.textContent = score.toString().padStart(4, '0');
    }
    showToast(type, messageTitle, messageDesc) {
        const toast = document.createElement('div');
        toast.style.position = 'relative';
        toast.style.background = 'rgba(30, 41, 59, 0.9)';
        toast.style.backdropFilter = 'blur(20px)';
        toast.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        toast.style.borderLeft = `4px solid ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#f59e0b'}`;
        toast.style.color = '#f8fafc';
        toast.style.padding = '1.25rem 1.5rem';
        toast.style.borderRadius = '1rem';
        toast.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.6), inset 1px 1px 0 rgba(255,255,255,0.05)';
        toast.style.display = 'flex';
        toast.style.flexDirection = 'column';
        toast.style.gap = '0.35rem';
        toast.style.transform = 'translateX(120%)';
        toast.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        toast.style.zIndex = '100';
        
        const title = document.createElement('span');
        title.style.fontWeight = '900';
        title.style.fontSize = '0.95rem';
        title.style.color = type === 'success' ? '#34d399' : type === 'danger' ? '#f87171' : '#fbbf24';
        title.innerText = messageTitle;
        
        const desc = document.createElement('span');
        desc.style.fontWeight = '500';
        desc.style.fontSize = '0.8rem';
        desc.style.color = '#cbd5e1';
        desc.innerText = messageDesc;
        
        toast.appendChild(title);
        toast.appendChild(desc);
        this.toastContainer.appendChild(toast);
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.style.transform = 'translateX(0)');
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }
}

class ParticleBase {
    constructor(x, y, color) {
        this.pos = new MathVector(x, y);
        this.vel = new MathVector(0, 0);
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = 5;
    }
    process() {
        this.pos.add(this.vel);
        this.life -= this.decay;
    }
    render(ctx) {
        if(isNaN(this.pos.x) || isNaN(this.pos.y)) return;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    isDead() {
        return this.life <= 0;
    }
}

class SparkParticle extends ParticleBase {
    constructor(x, y, color, speedBase, sizeBase) {
        super(x, y, color);
        const angle = MathUtils.randomRange(0, Math.PI * 2);
        const velocityMagnitude = MathUtils.randomRange(speedBase * 0.5, speedBase);
        this.vel.set(Math.cos(angle) * velocityMagnitude, Math.sin(angle) * velocityMagnitude);
        this.size = MathUtils.randomRange(2, sizeBase);
        this.decay = MathUtils.randomRange(0.01, 0.03);
        this.gravity = 0.25;
        this.friction = 0.96;
    }
    process() {
        this.vel.mult(this.friction);
        this.vel.y += this.gravity;
        super.process();
        this.size *= 0.95;
    }
}

class TrailParticle extends ParticleBase {
    constructor(x, y, color, size) {
        super(x, y, color);
        this.size = size || 8;
        this.decay = 0.08;
    }
    process() {
        this.life -= this.decay;
        this.size *= 0.85;
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.pos = new MathVector(x, y);
        this.vel = new MathVector(0, -2.5);
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.scale = 0.5;
    }
    process() {
        this.pos.add(this.vel);
        this.vel.mult(0.92);
        this.life -= 0.02;
        this.scale = MathUtils.lerp(this.scale, 1.2, 0.1);
    }
    render(ctx) {
        if(isNaN(this.pos.x) || isNaN(this.pos.y)) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 24px "Segoe UI", Roboto, sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        ctx.translate(this.pos.x, this.pos.y);
        ctx.scale(this.scale, this.scale);
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
    isDead() { return this.life <= 0; }
}

class GridBackground {
    constructor(width, height) {
        this.width = width || window.innerWidth;
        this.height = height || window.innerHeight;
        this.offsetY = 0;
        this.nodes = [];
        this.initializeNodes();
    }
    initializeNodes() {
        this.nodes = [];
        for (let i = 0; i < 35; i++) {
            this.nodes.push({
                x: MathUtils.randomRange(0, this.width),
                y: MathUtils.randomRange(0, this.height),
                speed: MathUtils.randomRange(0.1, 0.8),
                size: MathUtils.randomRange(1, 3.5),
                alpha: MathUtils.randomRange(0.05, 0.3)
            });
        }
    }
    setWidth(w) { this.width = w; this.initializeNodes(); }
    setHeight(h) { this.height = h; this.initializeNodes(); }
    
    process() {
        this.offsetY += 0.4;
        if (this.offsetY > 70) this.offsetY = 0;
        
        for (let n of this.nodes) {
            n.y -= n.speed;
            if (n.y < -20) {
                n.y = this.height + 20;
                n.x = MathUtils.randomRange(0, this.width);
            }
        }
    }
    render(ctx) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.width; x += 70) {
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.height + 70; y += 70) {
            ctx.beginPath();
            ctx.moveTo(0, y + this.offsetY - 70); ctx.lineTo(this.width, y + this.offsetY - 70);
            ctx.stroke();
        }
        for (let n of this.nodes) {
            ctx.fillStyle = `rgba(56, 189, 248, ${n.alpha})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class GraphicsRenderer {
    static drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    static wrapParagraph(ctx, text, x, y, maxWidth, lineHeight) {
        if(!text) return y;
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > Math.max(10, maxWidth) && n > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
        return currentY + lineHeight;
    }
    static renderBullseye(ctx, x, y, r, active) {
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowColor = active ? 'rgba(255,255,255,0.4)' : 'rgba(220,38,38,0.4)';
        ctx.shadowBlur = 20;
        for (let i = 4; i > 0; i--) {
            ctx.beginPath();
            ctx.arc(0, 0, (r / 4) * i, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? (active ? '#f8fafc' : '#1e293b') : (active ? '#ef4444' : '#0f172a');
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        if (active) {
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-r * 1.2, 0); ctx.lineTo(r * 1.2, 0);
            ctx.moveTo(0, -r * 1.2); ctx.lineTo(0, r * 1.2);
            ctx.stroke();
        }
        ctx.restore();
    }
    static renderBasketball(ctx, x, y, r, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 12;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = r * 0.08;
        ctx.strokeStyle = '#431407';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(0, r);
        ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-r, 0, r * 0.8, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r, 0, r * 0.8, Math.PI / 2, -Math.PI / 2);
        ctx.stroke();
        ctx.restore();
    }
    static renderBasketHoop(ctx, x, y, w) {
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#0f172a';
        GraphicsRenderer.drawRoundedRect(ctx, -w / 2 - 10, -30, w + 20, 80, 12);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#020617';
        ctx.fillRect(-w * 0.4, -10, w * 0.8, 55);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(0, 50, w * 0.45, 18, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, 55); ctx.lineTo(-w * 0.25, 120);
        ctx.lineTo(w * 0.25, 120); ctx.lineTo(w * 0.4, 55);
        ctx.stroke();
        for (let i = 1; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(-w * 0.4 + (w * 0.8 / 6) * i, 55);
            ctx.lineTo(-w * 0.25 + (w * 0.5 / 6) * i, 120);
            ctx.stroke();
        }
        for (let j = 1; j < 4; j++) {
            ctx.beginPath();
            ctx.moveTo(-w * 0.38 + j*4, 55 + j*18);
            ctx.lineTo(w * 0.38 - j*4, 55 + j*18);
            ctx.stroke();
        }
        ctx.restore();
    }
    static renderCrumpledPaper(ctx, x, y, r, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-r, -r * 0.6); ctx.lineTo(-r * 0.5, -r * 1.1);
        ctx.lineTo(r * 0.6, -r * 0.9); ctx.lineTo(r * 1.1, r * 0.5);
        ctx.lineTo(r * 0.4, r * 1.1); ctx.lineTo(-r * 0.9, r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.7)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.3); ctx.lineTo(r * 0.4, -r * 0.5);
        ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.7, 0.3);
        ctx.moveTo(-r * 0.5, r * 0.4); ctx.lineTo(r * 0.5, r * 0.6);
        ctx.moveTo(-r * 0.2, -r * 0.8); ctx.lineTo(-r * 0.1, r * 0.7);
        ctx.stroke();
        ctx.restore();
    }
    static renderWasteBin(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, h); ctx.lineTo(w * 0.4, h);
        ctx.lineTo(w * 0.55, 0); ctx.lineTo(-w * 0.55, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        const grad = ctx.createLinearGradient(-w*0.5, 0, w*0.5, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0.05)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        GraphicsRenderer.drawRoundedRect(ctx, -w * 0.6, -20, w * 1.2, 20, 6);
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-w * 0.25, 15); ctx.lineTo(-w * 0.2, h - 15);
        ctx.moveTo(0, 15); ctx.lineTo(0, h - 15);
        ctx.moveTo(w * 0.25, 15); ctx.lineTo(w * 0.2, h - 15);
        ctx.stroke();
        ctx.restore();
    }
}

const KNOWLEDGE_BASE = {
    p1: [
        { q: "Qual a base legal primária para o tratamento de dados de pacientes na saúde?", o: ["Consentimento", "Tutela da Saúde", "Legítimo Interesse"], c: 1, info: "A Tutela da Saúde permite o tratamento por profissionais de saúde sem consentimento direto." },
        { q: "Dado anonimizado é considerado dado pessoal pela LGPD?", o: ["Sim, sempre", "Não, perde a associação", "Apenas se for sensível"], c: 1, info: "Dados anonimizados não são considerados dados pessoais, pois não identificam o titular." },
        { q: "Quem deve ser notificado em caso de vazamento de dados críticos?", o: ["Apenas o TI", "O Titular e a ANPD", "A Polícia Militar"], c: 1, info: "A Autoridade Nacional (ANPD) e os titulares devem ser informados sobre riscos relevantes." },
        { q: "O princípio da Finalidade exige que o tratamento seja:", o: ["Lucrativo", "Geral e amplo", "Específico e explícito"], c: 2, info: "A LGPD proíbe o tratamento genérico sem finalidade específica e informada ao titular." }
    ],
    p2: [
        { t: "Prontuário Eletrônico", d: "Você finalizou o atendimento e vai almoçar.", o: ["Deixar tela ligada", "Minimizar", "Bloquear Win+L"], c: 2, info: "Sempre bloqueie a estação de trabalho ao se ausentar para evitar acessos não autorizados." },
        { t: "Suporte Externo", d: "Técnico pede sua senha para teste no sistema Salutem.", o: ["Digitar para ele", "Negar e abrir TI", "Anotar no post-it"], c: 1, info: "Senhas são pessoais e intransferíveis. O suporte deve usar credenciais próprias." },
        { t: "Descarte Seguro", d: "Exame impresso com erro de digitação do paciente.", o: ["Lixo reciclável", "Lixo comum", "Fragmentadora"], c: 2, info: "Documentos com dados de pacientes devem ser destruídos fisicamente antes do descarte." },
        { t: "Acesso de Terceiros", d: "Colega pede para usar seu login rapidinho para consulta.", o: ["Emprestar", "Negar acesso", "Digitar por ele"], c: 1, info: "O compartilhamento de credenciais compromete a rastreabilidade e a auditoria do sistema." }
    ],
    p3: [
        { t: "Compartilhamento", d: "Foto de ferida do paciente no WhatsApp pessoal.", o: ["Sem rosto OK", "Totalmente proibido", "Apenas grupo médico"], c: 1, info: "O uso de apps mensageiros pessoais para dados clínicos fere as diretrizes de segurança institucionais." },
        { t: "Curiosidade", d: "Acessar prontuário de uma figura pública internada.", o: ["Equipe pode", "Violação de sigilo", "Sistema permite"], c: 1, info: "O acesso motivado por curiosidade é infração grave e quebra de sigilo profissional." },
        { t: "Engenharia Social", d: "Ligação do suporte pedindo token de acesso.", o: ["Fornecer", "Desligar e reportar", "Pedir crachá"], c: 1, info: "A equipe de TI nunca solicitará sua senha ou token via telefone." },
        { t: "Comunicação", d: "Enviar lista de pacientes por e-mail para casa.", o: ["Proibido", "Permitido se urgente", "Se gestor deixar"], c: 0, info: "Transitar dados sensíveis para ambientes não controlados expõe a instituição a vazamentos." }
    ],
    p4: [
        { t: "Alergias Medicamentosas", s: true, info: "Dados de saúde são classificados como dados pessoais sensíveis pela LGPD." },
        { t: "Ramal do Setor", s: false, info: "Informações corporativas e de contato comercial não são dados sensíveis." },
        { t: "Orientação Sexual", s: true, info: "A LGPD classifica orientação sexual como dado sensível, exigindo maior proteção." },
        { t: "Nome da Mãe", s: false, info: "Embora seja um dado pessoal e usado para validação, não é categorizado como sensível." }
    ]
};

class GamePhase1 {
    constructor(engine) {
        this.engine = engine;
        this.index = 0;
        this.targets = [];
        this.projectile = null;
        this.pointer = new MathVector(engine.width / 2, engine.height / 2);
        this.isLocked = false;
        this.waitTimer = 0;
        this.scoreVal = 100;
    }
    initialize() {
        if (this.index >= KNOWLEDGE_BASE.p1.length) {
            this.engine.transitionPhase(2);
            return;
        }
        this.targets = [];
        this.projectile = null;
        this.isLocked = false;
        this.waitTimer = 0;
        
        const questionData = KNOWLEDGE_BASE.p1[this.index];
        const spacing = this.engine.width / (questionData.o.length + 1);
        
        for (let i = 0; i < questionData.o.length; i++) {
            this.targets.push({
                pos: new MathVector(spacing * (i + 1), this.engine.height * 0.45),
                originY: this.engine.height * 0.45,
                radius: 45,
                label: questionData.o[i],
                isCorrect: i === questionData.c,
                isActive: true,
                timeOffset: MathUtils.randomRange(0, 100),
                bobSpeed: MathUtils.randomRange(0.04, 0.07)
            });
        }
    }
    process() {
        if (this.isLocked) {
            this.waitTimer--;
            if (this.waitTimer <= 0) {
                this.index++;
                this.initialize();
            }
            return;
        }
        const input = this.engine.input;
        this.pointer.lerp(input.position, 0.3);
        
        for (let t of this.targets) {
            if (t.isActive) {
                t.timeOffset += t.bobSpeed;
                t.pos.y = t.originY + Math.sin(t.timeOffset) * 25;
            }
        }
        
        if (input.justPressed && !this.projectile) {
            this.projectile = {
                pos: new MathVector(this.engine.width / 2, this.engine.height),
                target: input.position.copy()
            };
            const direction = this.projectile.target.copy().sub(this.projectile.pos).normalize().mult(35);
            this.projectile.vel = direction;
        }
        
        if (this.projectile) {
            this.engine.particleSystem.push(new TrailParticle(this.projectile.pos.x, this.projectile.pos.y, '#38bdf8', 12));
            this.projectile.pos.add(this.projectile.vel);
            
            let collisionDetected = false;
            for (let t of this.targets) {
                if (t.isActive && this.projectile.pos.dist(t.pos) < t.radius) {
                    t.isActive = false;
                    collisionDetected = true;
                    this.isLocked = true;
                    this.waitTimer = 120;
                    const qData = KNOWLEDGE_BASE.p1[this.index];
                    
                    if (t.isCorrect) {
                        this.engine.registerScore(this.scoreVal, t.pos);
                        this.engine.spawnSparks(t.pos.x, t.pos.y, '#10b981', 60);
                        this.engine.domManager.showToast('success', 'Resposta Correta', qData.info);
                    } else {
                        this.engine.registerScore(-50, t.pos);
                        this.engine.spawnSparks(t.pos.x, t.pos.y, '#ef4444', 40);
                        this.engine.domManager.showToast('danger', 'Resposta Incorreta', qData.info);
                    }
                    break;
                }
            }
            
            const outOfBounds = (
                this.projectile.pos.y < -50 ||
                this.projectile.pos.y > this.engine.height + 50 ||
                this.projectile.pos.x < -50 ||
                this.projectile.pos.x > this.engine.width + 50
            );
            
            if (collisionDetected || outOfBounds) {
                this.projectile = null;
            }
        }
    }
    render(ctx) {
        if (this.index >= KNOWLEDGE_BASE.p1.length) return;
        const qData = KNOWLEDGE_BASE.p1[this.index];
        
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.font = '900 24px "Segoe UI"';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        GraphicsRenderer.wrapParagraph(ctx, qData.q, this.engine.width / 2, 130, this.engine.width - 60, 36);
        ctx.shadowBlur = 0;
        
        for (let t of this.targets) {
            if (t.isActive) {
                GraphicsRenderer.renderBullseye(ctx, t.pos.x, t.pos.y, t.radius, true);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '800 14px "Segoe UI"';
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.shadowBlur = 8;
                GraphicsRenderer.wrapParagraph(ctx, t.label, t.pos.x, t.pos.y + t.radius + 35, 110, 18);
                ctx.shadowBlur = 0;
            }
        }
        
        if (this.projectile && !isNaN(this.projectile.pos.x)) {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(this.projectile.pos.x, this.projectile.pos.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        if (!isNaN(this.pointer.x)) {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.pointer.x - 25, this.pointer.y);
            ctx.lineTo(this.pointer.x + 25, this.pointer.y);
            ctx.moveTo(this.pointer.x, this.pointer.y - 25);
            ctx.lineTo(this.pointer.x, this.pointer.y + 25);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.pointer.x, this.pointer.y, 15, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class GamePhase2 {
    constructor(engine) {
        this.engine = engine;
        this.index = 0;
        this.hoops = [];
        this.ball = { pos: new MathVector(), vel: new MathVector(), rot: 0, state: 'idle' };
        this.isLocked = false;
        this.waitTimer = 0;
        this.scoreVal = 100;
    }
    initialize() {
        if (this.index >= KNOWLEDGE_BASE.p2.length) {
            this.engine.transitionPhase(3);
            return;
        }
        this.isLocked = false;
        this.waitTimer = 0;
        this.ball.state = 'idle';
        this.ball.pos.set(this.engine.width / 2, this.engine.height - 140);
        this.ball.vel.set(0, 0);
        this.hoops = [];
        
        const questionData = KNOWLEDGE_BASE.p2[this.index];
        const spacing = this.engine.width / (questionData.o.length + 1);
        
        for (let i = 0; i < questionData.o.length; i++) {
            this.hoops.push({
                pos: new MathVector(spacing * (i + 1), 260),
                originY: 260,
                w: 90,
                label: questionData.o[i],
                isCorrect: i === questionData.c,
                isActive: true,
                timeOffset: MathUtils.randomRange(0, 100),
                bobSpeed: MathUtils.randomRange(0.03, 0.06)
            });
        }
    }
    process() {
        if (this.isLocked) {
            this.waitTimer--;
            if (this.waitTimer <= 0) {
                this.index++;
                this.initialize();
            }
            return;
        }
        const input = this.engine.input;
        
        for (let h of this.hoops) {
            if (h.isActive) {
                h.timeOffset += h.bobSpeed;
                h.pos.y = h.originY + Math.sin(h.timeOffset) * 15;
            }
        }
        
        if (this.ball.state === 'idle') {
            if (input.justPressed && input.position.y > this.engine.height - 220) {
                this.ball.state = 'drag';
            }
        } else if (this.ball.state === 'drag') {
            this.ball.pos.lerp(input.position, 0.6);
            if (input.justReleased) {
                this.ball.state = 'fly';
                this.ball.vel.set(input.velocity.x * 0.7, Math.min(input.velocity.y * 0.7, -22));
            }
        } else if (this.ball.state === 'fly') {
            this.engine.particleSystem.push(new TrailParticle(this.ball.pos.x, this.ball.pos.y, '#f97316', 14));
            this.ball.pos.add(this.ball.vel);
            this.ball.vel.y += 1.2;
            this.ball.rot += this.ball.vel.x * 0.08;
            
            let hitTarget = null;
            if (this.ball.vel.y > 0) {
                for (let h of this.hoops) {
                    if (h.isActive && Math.abs(this.ball.pos.x - h.pos.x) < h.w / 2 && Math.abs(this.ball.pos.y - h.pos.y) < 40) {
                        hitTarget = h;
                        break;
                    }
                }
            }
            
            if (hitTarget) {
                this.ball.state = 'done';
                this.isLocked = true;
                this.waitTimer = 120;
                hitTarget.isActive = false;
                const qData = KNOWLEDGE_BASE.p2[this.index];
                
                if (hitTarget.isCorrect) {
                    this.engine.registerScore(this.scoreVal, hitTarget.pos);
                    this.engine.spawnSparks(hitTarget.pos.x, hitTarget.pos.y, '#f59e0b', 70);
                    this.engine.domManager.showToast('success', 'Procedimento Seguro', qData.info);
                } else {
                    this.engine.registerScore(-50, hitTarget.pos);
                    this.engine.spawnSparks(hitTarget.pos.x, hitTarget.pos.y, '#ef4444', 40);
                    this.engine.domManager.showToast('danger', 'Procedimento Inseguro', qData.info);
                }
            }
            
            const outOfBounds = (
                this.ball.pos.y > this.engine.height + 80 ||
                this.ball.pos.x < -80 ||
                this.ball.pos.x > this.engine.width + 80
            );
            
            if (outOfBounds && this.ball.state !== 'done') {
                this.ball.state = 'idle';
                this.ball.pos.set(this.engine.width / 2, this.engine.height - 140);
                this.ball.vel.set(0, 0);
            }
        }
    }
    render(ctx) {
        if (this.index >= KNOWLEDGE_BASE.p2.length) return;
        const q = KNOWLEDGE_BASE.p2[this.index];
        
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.font = '900 20px "Segoe UI"';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(q.t, this.engine.width / 2, 70);
        
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 18px "Segoe UI"';
        GraphicsRenderer.wrapParagraph(ctx, q.d, this.engine.width / 2, 100, this.engine.width - 60, 26);
        ctx.shadowBlur = 0;
        
        for (let h of this.hoops) {
            if (h.isActive) {
                GraphicsRenderer.renderBasketHoop(ctx, h.pos.x, h.pos.y, h.w);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '800 14px "Segoe UI"';
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.shadowBlur = 8;
                GraphicsRenderer.wrapParagraph(ctx, h.label, h.pos.x, h.pos.y + 85, 105, 18);
                ctx.shadowBlur = 0;
            }
        }
        
        if (this.ball.state !== 'done' && !isNaN(this.ball.pos.x)) {
            if (this.ball.state === 'drag') {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(this.ball.pos.x, this.ball.pos.y);
                ctx.lineTo(this.ball.pos.x + this.engine.input.velocity.x * 12, this.ball.pos.y + this.engine.input.velocity.y * 12);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            GraphicsRenderer.renderBasketball(ctx, this.ball.pos.x, this.ball.pos.y, 35, this.ball.rot);
        }
    }
}

class GamePhase3 {
    constructor(engine) {
        this.engine = engine;
        this.index = 0;
        this.paperObj = { pos: new MathVector(), vel: new MathVector(), rot: 0, state: 'idle' };
        this.bins = [];
        this.isLocked = false;
        this.waitTimer = 0;
        this.scoreVal = 100;
    }
    initialize() {
        if (this.index >= KNOWLEDGE_BASE.p3.length) {
            this.engine.transitionPhase(4);
            return;
        }
        this.isLocked = false;
        this.waitTimer = 0;
        this.paperObj.state = 'idle';
        this.paperObj.pos.set(this.engine.width / 2, this.engine.height - 140);
        this.bins = [];
        
        const questionData = KNOWLEDGE_BASE.p3[this.index];
        const spacing = this.engine.width / (questionData.o.length + 1);
        
        for (let i = 0; i < questionData.o.length; i++) {
            this.bins.push({
                pos: new MathVector(spacing * (i + 1), 270),
                originY: 270,
                w: 85,
                h: 100,
                label: questionData.o[i],
                isCorrect: i === questionData.c,
                isActive: true,
                timeOffset: MathUtils.randomRange(0, 100),
                bobSpeed: MathUtils.randomRange(0.02, 0.05)
            });
        }
    }
    process() {
        if (this.isLocked) {
            this.waitTimer--;
            if (this.waitTimer <= 0) {
                this.index++;
                this.initialize();
            }
            return;
        }
        const input = this.engine.input;
        
        for (let b of this.bins) {
            if (b.isActive) {
                b.timeOffset += b.bobSpeed;
                b.pos.y = b.originY + Math.sin(b.timeOffset) * 12;
            }
        }
        
        if (this.paperObj.state === 'idle') {
            if (input.justPressed && input.position.y > this.engine.height - 220) {
                this.paperObj.state = 'drag';
            }
        } else if (this.paperObj.state === 'drag') {
            this.paperObj.pos.lerp(input.position, 0.6);
            if (input.justReleased) {
                this.paperObj.state = 'fly';
                this.paperObj.vel.set(input.velocity.x * 0.7, Math.min(input.velocity.y * 0.7, -22));
            }
        } else if (this.paperObj.state === 'fly') {
            this.engine.particleSystem.push(new TrailParticle(this.paperObj.pos.x, this.paperObj.pos.y, '#f1f5f9', 10));
            this.paperObj.pos.add(this.paperObj.vel);
            this.paperObj.vel.y += 1.1;
            this.paperObj.rot += 0.4;
            
            let hitTarget = null;
            if (this.paperObj.vel.y > 0) {
                for (let b of this.bins) {
                    if (b.isActive && Math.abs(this.paperObj.pos.x - b.pos.x) < b.w / 1.4 && Math.abs(this.paperObj.pos.y - (b.pos.y - b.h / 2)) < 35) {
                        hitTarget = b;
                        break;
                    }
                }
            }
            
            if (hitTarget) {
                this.paperObj.state = 'done';
                this.isLocked = true;
                this.waitTimer = 120;
                hitTarget.isActive = false;
                const qData = KNOWLEDGE_BASE.p3[this.index];
                
                if (hitTarget.isCorrect) {
                    this.engine.registerScore(this.scoreVal, hitTarget.pos);
                    this.engine.spawnSparks(hitTarget.pos.x, hitTarget.pos.y - hitTarget.h / 2, '#f8fafc', 55);
                    this.engine.domManager.showToast('success', 'Conduta Adequada', qData.info);
                } else {
                    this.engine.registerScore(-50, hitTarget.pos);
                    this.engine.spawnSparks(hitTarget.pos.x, hitTarget.pos.y - hitTarget.h / 2, '#ef4444', 35);
                    this.engine.domManager.showToast('danger', 'Conduta Inadequada', qData.info);
                }
            }
            
            const outOfBounds = (
                this.paperObj.pos.y > this.engine.height + 80 ||
                this.paperObj.pos.x < -80 ||
                this.paperObj.pos.x > this.engine.width + 80
            );
            
            if (outOfBounds && this.paperObj.state !== 'done') {
                this.paperObj.state = 'idle';
                this.paperObj.pos.set(this.engine.width / 2, this.engine.height - 140);
            }
        }
    }
    render(ctx) {
        if (this.index >= KNOWLEDGE_BASE.p3.length) return;
        const q = KNOWLEDGE_BASE.p3[this.index];
        
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.font = '900 20px "Segoe UI"';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(q.t, this.engine.width / 2, 60);
        
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 18px "Segoe UI"';
        GraphicsRenderer.wrapParagraph(ctx, q.d, this.engine.width / 2, 90, this.engine.width - 60, 26);
        ctx.shadowBlur = 0;
        
        for (let b of this.bins) {
            if (b.isActive) {
                GraphicsRenderer.renderWasteBin(ctx, b.pos.x, b.pos.y, b.w, b.h);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '800 14px "Segoe UI"';
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.shadowBlur = 8;
                GraphicsRenderer.wrapParagraph(ctx, b.label, b.pos.x, b.pos.y + 25, 105, 18);
                ctx.shadowBlur = 0;
            }
        }
        
        if (this.paperObj.state !== 'done' && !isNaN(this.paperObj.pos.x)) {
            let scaleAdjustment = this.paperObj.state === 'fly' ? Math.max(0.6, 1 - (this.paperObj.pos.y / this.engine.height)) : 1;
            ctx.save();
            ctx.translate(this.paperObj.pos.x, this.paperObj.pos.y);
            ctx.scale(scaleAdjustment, scaleAdjustment);
            if (this.paperObj.state === 'drag') {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.engine.input.velocity.x * 12, this.engine.input.velocity.y * 12);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            GraphicsRenderer.renderCrumpledPaper(ctx, 0, 0, 35, this.paperObj.rot);
            ctx.restore();
        }
    }
}

class GamePhase4 {
    constructor(engine) {
        this.engine = engine;
        this.index = 0;
        this.cardObj = { off: new MathVector(), rot: 0, state: 'idle' };
        this.isLocked = false;
        this.waitTimer = 0;
        this.scoreVal = 100;
    }
    initialize() {
        if (this.index >= KNOWLEDGE_BASE.p4.length) {
            this.engine.triggerEndState();
            return;
        }
        this.isLocked = false;
        this.waitTimer = 0;
        this.cardObj.state = 'idle';
        this.cardObj.off.set(0, 0);
        this.cardObj.rot = 0;
    }
    process() {
        if (this.isLocked) {
            this.waitTimer--;
            if (this.waitTimer <= 0) {
                this.index++;
                this.initialize();
            }
            return;
        }
        const input = this.engine.input;
        
        if (this.cardObj.state === 'idle') {
            if (input.isPressed) {
                this.cardObj.state = 'drag';
            }
        } else if (this.cardObj.state === 'drag') {
            this.cardObj.off.x = input.position.x - input.dragStart.x;
            this.cardObj.off.y = input.position.y - input.dragStart.y;
            this.cardObj.rot = this.cardObj.off.x * 0.002;
            
            if (input.justReleased) {
                if (Math.abs(this.cardObj.off.x) > 150 || Math.abs(input.velocity.x) > 10) {
                    this.cardObj.state = 'fly';
                    if (Math.abs(input.velocity.x) > 15) {
                        this.cardObj.off.x += Math.sign(input.velocity.x) * 50;
                    }
                } else {
                    this.cardObj.state = 'return';
                }
            }
        } else if (this.cardObj.state === 'return') {
            this.cardObj.off.lerp(new MathVector(0, 0), 0.35);
            this.cardObj.rot *= 0.75;
            if (this.cardObj.off.mag() < 2) {
                this.cardObj.state = 'idle';
            }
        } else if (this.cardObj.state === 'fly') {
            let dir = this.cardObj.off.x >= 0 ? 1 : -1;
            this.cardObj.off.x += dir * 45;
            this.cardObj.rot += dir * 0.18;
            
            if (Math.abs(this.cardObj.off.x) > this.engine.width + 150) {
                this.isLocked = true;
                this.waitTimer = 120;
                
                const choiceSensivel = this.cardObj.off.x > 0;
                const qData = KNOWLEDGE_BASE.p4[this.index];
                
                if (choiceSensivel === qData.s) {
                    this.engine.registerScore(this.scoreVal, new MathVector(this.engine.width / 2, this.engine.height / 2));
                    this.engine.spawnSparks(this.engine.width / 2, this.engine.height / 2, '#10b981', 80);
                    this.engine.domManager.showToast('success', 'Classificação Correta', qData.info);
                } else {
                    this.engine.registerScore(-50, new MathVector(this.engine.width / 2, this.engine.height / 2));
                    this.engine.spawnSparks(this.engine.width / 2, this.engine.height / 2, '#ef4444', 50);
                    this.engine.domManager.showToast('danger', 'Classificação Incorreta', qData.info);
                }
            }
        }
    }
    render(ctx) {
        if (this.index >= KNOWLEDGE_BASE.p4.length) return;
        const qData = KNOWLEDGE_BASE.p4[this.index];
        
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.font = '900 20px "Segoe UI"';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText("Classifique a Sensibilidade", this.engine.width / 2, 100);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#3b82f6';
        ctx.font = '900 22px "Segoe UI"';
        ctx.fillText("← COMUM", 90, this.engine.height / 2);
        
        ctx.fillStyle = '#ef4444';
        ctx.fillText("SENSÍVEL →", this.engine.width - 90, this.engine.height / 2);
        
        ctx.save();
        ctx.translate(this.engine.width / 2 + this.cardObj.off.x, this.engine.height / 2 + this.cardObj.off.y);
        ctx.rotate(this.cardObj.rot);
        
        const cardW = 320;
        const cardH = 460;
        
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetY = 25;
        ctx.fillStyle = '#0f172a';
        GraphicsRenderer.drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 32);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.font = '900 32px "Segoe UI"';
        GraphicsRenderer.wrapParagraph(ctx, qData.t, 0, -40, cardW - 60, 42);
        
        let opacityLevel = Math.min(Math.abs(this.cardObj.off.x) / 180, 0.95);
        if (opacityLevel > 0) {
            ctx.fillStyle = this.cardObj.off.x > 0 ? `rgba(239, 68, 68, ${opacityLevel})` : `rgba(59, 130, 246, ${opacityLevel})`;
            GraphicsRenderer.drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 32);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 48px "Segoe UI"';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            ctx.fillText(this.cardObj.off.x > 0 ? "SENSÍVEL" : "COMUM", 0, 150);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }
}

class SystemEngine {
    constructor() {
        this.canvas = document.getElementById('render-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.input = new InputController(this.canvas);
        this.domManager = new DOMManager();
        this.appState = 'LOBBY';
        this.totalScore = 0;
        this.displayedScore = 0;
        this.particleSystem = [];
        this.textSystem = [];
        this.gridBg = new GridBackground(this.width, this.height);
        this.modules = [null, new GamePhase1(this), new GamePhase2(this), new GamePhase3(this), new GamePhase4(this)];
        this.activeModule = 1;
        this.userName = '';
        this.userSector = '';
        
        this.handleResize();
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        this.bindEvents();
        requestAnimationFrame(() => {
            this.engineLoop();
        });
    }
    
    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        if (this.canvas.parentElement) {
            this.width = this.canvas.parentElement.clientWidth;
            this.height = this.canvas.parentElement.clientHeight;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);
            this.gridBg.setWidth(this.width);
            this.gridBg.setHeight(this.height);
        }
    }
    
    bindEvents() {
        if (this.domManager.triggerStart) {
            this.domManager.triggerStart.addEventListener('click', (e) => {
                if (e && e.preventDefault) e.preventDefault();
                
                const nameInput = this.domManager.inputName;
                const sectorInput = this.domManager.inputSector;
                
                const nameVal = nameInput ? nameInput.value.trim() : '';
                const sectorVal = sectorInput ? sectorInput.value : '';
                
                let isValid = true;
                
                if (!nameVal) {
                    if (nameInput) {
                        nameInput.classList.add('animate-shake');
                        nameInput.style.border = '1px solid #ef4444';
                        setTimeout(() => {
                            nameInput.classList.remove('animate-shake');
                            nameInput.style.border = '';
                        }, 2000);
                    }
                    isValid = false;
                }
                
                if (!sectorVal) {
                    if (sectorInput) {
                        sectorInput.classList.add('animate-shake');
                        sectorInput.style.border = '1px solid #ef4444';
                        setTimeout(() => {
                            sectorInput.classList.remove('animate-shake');
                            sectorInput.style.border = '';
                        }, 2000);
                    }
                    isValid = false;
                }
                
                if (!isValid) {
                    this.domManager.showToast('warning', 'Acesso Restrito', 'Preencha todos os campos obrigatórios para ingressar na arena.');
                    return;
                }
                
                this.domManager.hideLogin();
                this.userName = nameVal;
                this.userSector = sectorVal;
                this.appState = 'ACTIVE_GAME';
                this.domManager.injectHUD();
                this.modules[1].initialize();
            });
        }
        if (this.domManager.triggerReset) {
            this.domManager.triggerReset.addEventListener('click', () => {
                location.reload();
            });
        }
    }
    
    transitionPhase(p) {
        this.activeModule = p;
        this.modules[p].initialize();
    }
    
    triggerEndState() {
        this.appState = 'RESULTS';
        this.domManager.showResults(this.userName, this.userSector, this.totalScore);
        for (let i = 0; i < 150; i++) {
            this.spawnSparks(MathUtils.randomRange(0, this.width), -40, ['#3b82f6', '#10b981', '#0ea5e9', '#f59e0b'][Math.floor(MathUtils.randomRange(0, 4))], 80);
        }
        
        const syncPayload = {
            nome: this.userName,
            setor: this.userSector,
            pontuacao: `${this.totalScore}/1600`
        };
        
        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload)
        }).catch(() => {});
    }
    
    registerScore(points, pos) {
        this.totalScore += points;
        const clr = points > 0 ? '#10b981' : '#ef4444';
        const lbl = points > 0 ? `+${points}` : `${points}`;
        this.textSystem.push(new FloatingText(pos.x, pos.y - 50, lbl, clr));
    }
    
    spawnSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particleSystem.push(new SparkParticle(x, y, color, 15, 10));
        }
    }
    
    engineLoop() {
        this.ctx.fillStyle = '#09090b';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.gridBg.process();
        this.gridBg.render(this.ctx);
        
        this.displayedScore = MathUtils.lerp(this.displayedScore, this.totalScore, 0.15);
        
        if (this.appState === 'ACTIVE_GAME') {
            try {
                this.domManager.updateHUD(this.activeModule, Math.round(this.displayedScore));
                this.modules[this.activeModule].process();
                this.modules[this.activeModule].render(this.ctx);
                
                const barWidth = this.width - 60;
                this.ctx.fillStyle = '#1e293b';
                GraphicsRenderer.drawRoundedRect(this.ctx, 30, 20, barWidth, 6, 3);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#3b82f6';
                let currentProgress = ((this.activeModule - 1) * 4 + this.modules[this.activeModule].index) / 16;
                GraphicsRenderer.drawRoundedRect(this.ctx, 30, 20, barWidth * currentProgress, 6, 3);
                this.ctx.fill();
            } catch (error) {
                console.error('Render Loop Error:', error);
            }
        }
        
        for (let i = this.particleSystem.length - 1; i >= 0; i--) {
            let p = this.particleSystem[i];
            p.process();
            p.render(this.ctx);
            if (p.isDead()) this.particleSystem.splice(i, 1);
        }
        
        for (let i = this.textSystem.length - 1; i >= 0; i--) {
            let t = this.textSystem[i];
            t.process();
            t.render(this.ctx);
            if (t.isDead()) this.textSystem.splice(i, 1);
        }
        
        if (this.appState === 'RESULTS' && Math.random() < 0.15) {
            this.spawnSparks(MathUtils.randomRange(0, this.width), -30, ['#3b82f6', '#10b981', '#0ea5e9', '#f59e0b'][Math.floor(MathUtils.randomRange(0, 4))], 25);
        }
        
        this.input.clearFrameFlags();
        
        requestAnimationFrame(() => {
            this.engineLoop();
        });
    }
}

window.onload = () => {
    new SystemEngine();
};