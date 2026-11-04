/**
 * QR Studio Pro - Advanced Canvas & SVG Vector Rendering Engine
 * Supports custom module patterns, corner eye shapes, linear/radial gradients,
 * transparent backgrounds, logo overlay with safe margin, and CTA frames.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['QREngine'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('./qr-engine'));
  } else {
    root.QRRenderer = factory(root.QREngine);
  }
}(typeof self !== 'undefined' ? self : this, function (QREngine) {

  // Relative luminance calculation for WCAG contrast checking
  function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function calculateContrastRatio(fgHex, bgHex) {
    if (!fgHex || !bgHex) return 21;
    const rgb1 = hexToRgb(fgHex);
    const rgb2 = hexToRgb(bgHex);
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Main Renderer Class
   */
  class QRRenderer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = Object.assign({
        text: 'https://getmeaqrcode.com',
        size: 600,
        margin: 20,
        pattern: 'square', // 'square', 'dots', 'rounded', 'diamond', 'classy', 'fluid'
        colorMode: 'single', // 'single', 'linear', 'radial'
        fgColor1: '#0f172a',
        fgColor2: '#4f46e5',
        gradientAngle: 135,
        bgColor: '#ffffff',
        isTransparentBg: false,
        eyeFrame: 'square', // 'square', 'rounded', 'circle', 'leaf'
        eyeBall: 'square',  // 'square', 'circle', 'rounded', 'diamond'
        customEyeColor: false,
        eyeColor: '#4338ca',
        frame: 'none', // 'none', 'bottom-pill', 'bottom-badge', 'top-badge', 'circular', 'ticket'
        frameText: 'SCAN ME',
        frameColor: '#6366f1',
        logoImg: null, // HTMLImageElement
        logoSizePercent: 22,
        errorCorrection: 'M'
      }, options);

      this.qr = null;
    }

    setOptions(newOptions) {
      // If logo is added, auto-boost error correction to H (30%) for safety
      if (newOptions.logoImg && newOptions.logoImg !== this.options.logoImg) {
        newOptions.errorCorrection = 'H';
      }
      Object.assign(this.options, newOptions);
      this.render();
    }

    getContrastScore() {
      if (this.options.isTransparentBg) {
        return { ratio: 15.0, isGood: true }; // Assume contrast with target background
      }
      const ratio = calculateContrastRatio(this.options.fgColor1, this.options.bgColor);
      return {
        ratio: Math.round(ratio * 10) / 10,
        isGood: ratio >= 3.5,
        isExcellent: ratio >= 7.0
      };
    }

    render() {
      const opts = this.options;
      const canvas = this.canvas;
      const ctx = this.ctx;

      // Ensure canvas matches target resolution
      const targetSize = opts.size || 600;
      if (canvas.width !== targetSize || canvas.height !== targetSize) {
        canvas.width = targetSize;
        canvas.height = targetSize;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Generate QR Matrix
      try {
        const ec = opts.logoImg ? 'H' : (opts.errorCorrection || 'M');
        this.qr = QREngine.generateMatrix(opts.text || 'https://getmeaqrcode.com', ec);
      } catch (e) {
        console.warn('QR Engine fallback generation error:', e);
        this.qr = QREngine.generateMatrix(opts.text || 'https://getmeaqrcode.com', 'L');
      }

      const count = this.qr.getModuleCount();
      
      // Calculate framing layout
      let frameTopPadding = 0;
      let frameBottomPadding = 0;
      let frameLeftPadding = 0;
      let frameRightPadding = 0;

      if (opts.frame === 'bottom-pill' || opts.frame === 'bottom-badge') {
        frameBottomPadding = targetSize * 0.16;
      } else if (opts.frame === 'top-badge') {
        frameTopPadding = targetSize * 0.16;
      } else if (opts.frame === 'circular') {
        frameTopPadding = targetSize * 0.08;
        frameBottomPadding = targetSize * 0.12;
        frameLeftPadding = targetSize * 0.08;
        frameRightPadding = targetSize * 0.08;
      } else if (opts.frame === 'ticket') {
        frameBottomPadding = targetSize * 0.14;
        frameTopPadding = targetSize * 0.04;
      }

      // Draw Background
      if (!opts.isTransparentBg) {
        ctx.fillStyle = opts.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Calculate QR Matrix drawing bounding box
      const margin = opts.margin + (targetSize * 0.04);
      const availableWidth = targetSize - (margin * 2) - frameLeftPadding - frameRightPadding;
      const availableHeight = targetSize - (margin * 2) - frameTopPadding - frameBottomPadding;
      const qrBoxSize = Math.min(availableWidth, availableHeight);
      
      const startX = (targetSize - qrBoxSize) / 2 + (frameLeftPadding - frameRightPadding) / 2;
      const startY = (targetSize - qrBoxSize) / 2 + (frameTopPadding - frameBottomPadding) / 2;
      const cellSize = qrBoxSize / count;

      // Create Foreground Pattern / Gradient
      let fillStyle = opts.fgColor1;
      if (opts.colorMode === 'linear') {
        const angleRad = (opts.gradientAngle || 135) * Math.PI / 180;
        const x1 = startX + qrBoxSize / 2 - Math.cos(angleRad) * qrBoxSize / 2;
        const y1 = startY + qrBoxSize / 2 - Math.sin(angleRad) * qrBoxSize / 2;
        const x2 = startX + qrBoxSize / 2 + Math.cos(angleRad) * qrBoxSize / 2;
        const y2 = startY + qrBoxSize / 2 + Math.sin(angleRad) * qrBoxSize / 2;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, opts.fgColor1);
        grad.addColorStop(1, opts.fgColor2);
        fillStyle = grad;
      } else if (opts.colorMode === 'radial') {
        const cx = startX + qrBoxSize / 2;
        const cy = startY + qrBoxSize / 2;
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, qrBoxSize / 1.4);
        grad.addColorStop(0, opts.fgColor1);
        grad.addColorStop(1, opts.fgColor2);
        fillStyle = grad;
      }

      // Safe Logo Bounding Box (avoid drawing modules where logo will sit)
      let logoArea = null;
      if (opts.logoImg) {
        const logoSizePx = qrBoxSize * ((opts.logoSizePercent || 22) / 100);
        const logoMargin = cellSize * 1.5;
        const lx = startX + (qrBoxSize - logoSizePx) / 2;
        const ly = startY + (qrBoxSize - logoSizePx) / 2;
        logoArea = {
          x: lx - logoMargin,
          y: ly - logoMargin,
          w: logoSizePx + logoMargin * 2,
          h: logoSizePx + logoMargin * 2
        };
      }

      // Draw Modules
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          const modX = startX + c * cellSize;
          const modY = startY + r * cellSize;

          // Check if module is within Finder Pattern (Corner Eyes)
          const finder = QREngine.isCornerFinderPattern(r, c, count);
          if (finder.isFinder) {
            // Corner eyes are rendered cleanly by drawFinderPattern()
            continue;
          }

          // Check if module is obscured by Center Logo
          if (logoArea &&
              modX + cellSize > logoArea.x && modX < logoArea.x + logoArea.w &&
              modY + cellSize > logoArea.y && modY < logoArea.y + logoArea.h) {
            continue;
          }

          if (this.qr.isDark(r, c)) {
            ctx.fillStyle = fillStyle;
            this.drawModule(ctx, modX, modY, cellSize, opts.pattern, r, c);
          }
        }
      }

      // Draw the 3 Corner Eyes (Top-Left, Top-Right, Bottom-Left)
      const eyeFill = opts.customEyeColor ? opts.eyeColor : fillStyle;
      this.drawCornerEye(ctx, startX, startY, cellSize, opts.eyeFrame, opts.eyeBall, eyeFill, opts.bgColor, opts.isTransparentBg);
      this.drawCornerEye(ctx, startX + (count - 7) * cellSize, startY, cellSize, opts.eyeFrame, opts.eyeBall, eyeFill, opts.bgColor, opts.isTransparentBg);
      this.drawCornerEye(ctx, startX, startY + (count - 7) * cellSize, cellSize, opts.eyeFrame, opts.eyeBall, eyeFill, opts.bgColor, opts.isTransparentBg);

      // Draw Logo if specified
      if (opts.logoImg) {
        const logoSizePx = qrBoxSize * ((opts.logoSizePercent || 22) / 100);
        const lx = startX + (qrBoxSize - logoSizePx) / 2;
        const ly = startY + (qrBoxSize - logoSizePx) / 2;
        const pad = cellSize * 0.6;

        // Draw clean white/bg background circle or rounded rect for logo
        ctx.save();
        ctx.fillStyle = opts.bgColor || '#ffffff';
        ctx.beginPath();
        const cr = (logoSizePx + pad * 2) / 2;
        ctx.arc(lx + logoSizePx / 2, ly + logoSizePx / 2, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw the image
        try {
          ctx.drawImage(opts.logoImg, lx, ly, logoSizePx, logoSizePx);
        } catch (e) {
          console.warn('Could not draw logo:', e);
        }
      }

      // Draw Frames & CTA Badges
      if (opts.frame && opts.frame !== 'none') {
        this.drawFrame(ctx, canvas.width, canvas.height, startX, startY, qrBoxSize, opts);
      }
    }

    /**
     * Draw individual module shape
     */
    drawModule(ctx, x, y, size, style, r, c) {
      const half = size / 2;
      ctx.beginPath();

      switch (style) {
        case 'dots':
          ctx.arc(x + half, y + half, half * 0.88, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'rounded':
          const rad = size * 0.35;
          ctx.roundRect ? ctx.roundRect(x, y, size, size, rad) : ctx.rect(x, y, size, size);
          ctx.fill();
          break;

        case 'diamond':
          ctx.moveTo(x + half, y);
          ctx.lineTo(x + size, y + half);
          ctx.lineTo(x + half, y + size);
          ctx.lineTo(x, y + half);
          ctx.closePath();
          ctx.fill();
          break;

        case 'classy':
          // Alternating rounded leaf
          if ((r + c) % 2 === 0) {
            ctx.roundRect ? ctx.roundRect(x, y, size, size, [size * 0.5, 0, size * 0.5, 0]) : ctx.rect(x, y, size, size);
          } else {
            ctx.arc(x + half, y + half, half * 0.9, 0, Math.PI * 2);
          }
          ctx.fill();
          break;

        case 'fluid':
          ctx.arc(x + half, y + half, half * 0.95, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'square':
        default:
          ctx.fillRect(x, y, size, size);
          break;
      }
    }

    /**
     * Draw Corner Eye Finder Pattern
     */
    drawCornerEye(ctx, x, y, cellSize, frameStyle, ballStyle, fillStyle, bgColor, isTransparent) {
      const outerSize = cellSize * 7;
      const innerSize = cellSize * 3;
      const ballOffset = cellSize * 2;

      ctx.save();

      // Outer Frame
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      if (frameStyle === 'circle') {
        ctx.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2, 0, Math.PI * 2);
        ctx.fill();
        // Cut out hole
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2 - cellSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (frameStyle === 'rounded') {
        const r = cellSize * 1.8;
        ctx.roundRect ? ctx.roundRect(x, y, outerSize, outerSize, r) : ctx.rect(x, y, outerSize, outerSize);
        ctx.fill();
        // Cut inner
        ctx.fillStyle = isTransparent ? '#ffffff' : bgColor;
        if (isTransparent) ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        const ir = cellSize * 1.0;
        ctx.roundRect ? ctx.roundRect(x + cellSize, y + cellSize, outerSize - cellSize * 2, outerSize - cellSize * 2, ir) : ctx.rect(x + cellSize, y + cellSize, outerSize - cellSize * 2, outerSize - cellSize * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (frameStyle === 'leaf') {
        // Leaf / Petal
        ctx.roundRect ? ctx.roundRect(x, y, outerSize, outerSize, [outerSize * 0.45, 0, outerSize * 0.45, 0]) : ctx.rect(x, y, outerSize, outerSize);
        ctx.fill();
        ctx.fillStyle = isTransparent ? '#ffffff' : bgColor;
        if (isTransparent) ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x + cellSize, y + cellSize, outerSize - cellSize * 2, outerSize - cellSize * 2, [outerSize * 0.35, 0, outerSize * 0.35, 0]) : ctx.rect(x + cellSize, y + cellSize, outerSize - cellSize * 2, outerSize - cellSize * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Square
        ctx.fillRect(x, y, outerSize, outerSize);
        ctx.fillStyle = isTransparent ? '#ffffff' : bgColor;
        if (isTransparent) ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(x + cellSize, y + cellSize, outerSize - cellSize * 2, outerSize - cellSize * 2);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Inner Eyeball
      ctx.fillStyle = fillStyle;
      const bx = x + ballOffset;
      const by = y + ballOffset;

      ctx.beginPath();
      if (ballStyle === 'circle') {
        ctx.arc(bx + innerSize / 2, by + innerSize / 2, innerSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (ballStyle === 'rounded') {
        const br = innerSize * 0.3;
        ctx.roundRect ? ctx.roundRect(bx, by, innerSize, innerSize, br) : ctx.rect(bx, by, innerSize, innerSize);
        ctx.fill();
      } else if (ballStyle === 'diamond') {
        const bh = innerSize / 2;
        ctx.moveTo(bx + bh, by);
        ctx.lineTo(bx + innerSize, by + bh);
        ctx.lineTo(bx + bh, by + innerSize);
        ctx.lineTo(bx, by + bh);
        ctx.closePath();
        ctx.fill();
      } else {
        // Square
        ctx.fillRect(bx, by, innerSize, innerSize);
      }

      ctx.restore();
    }

    /**
     * Draw Frames & CTA Badges
     */
    drawFrame(ctx, w, h, qrX, qrY, qrSize, opts) {
      const text = (opts.frameText || 'SCAN ME').toUpperCase();
      const frameColor = opts.frameColor || '#6366f1';

      ctx.save();
      ctx.fillStyle = frameColor;

      if (opts.frame === 'bottom-pill') {
        // Rounded pill button below QR
        const pillW = qrSize * 0.72;
        const pillH = h * 0.085;
        const pillX = (w - pillW) / 2;
        const pillY = qrY + qrSize + (h * 0.035);

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2) : ctx.rect(pillX, pillY, pillW, pillH);
        ctx.fill();

        // CTA Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(pillH * 0.44)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pillX + pillW / 2, pillY + pillH / 2);

      } else if (opts.frame === 'bottom-badge') {
        // Full width banner below QR
        const bannerH = h * 0.12;
        const bannerY = h - bannerH;

        ctx.fillRect(0, bannerY, w, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${Math.round(bannerH * 0.38)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, bannerY + bannerH / 2);

      } else if (opts.frame === 'top-badge') {
        // Banner above QR
        const bannerH = h * 0.12;
        ctx.fillRect(0, 0, w, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${Math.round(bannerH * 0.38)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, bannerH / 2);

      } else if (opts.frame === 'circular') {
        // Circular ring frame
        ctx.lineWidth = w * 0.025;
        ctx.strokeStyle = frameColor;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
        ctx.stroke();

        // Bottom arched badge
        const badgeW = qrSize * 0.6;
        const badgeH = h * 0.075;
        const bx = (w - badgeW) / 2;
        const by = h - badgeH - (h * 0.03);

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bx, by, badgeW, badgeH, badgeH / 2) : ctx.rect(bx, by, badgeW, badgeH);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(badgeH * 0.48)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, by + badgeH / 2);

      } else if (opts.frame === 'ticket') {
        // Ticket badge border with cutout notches
        ctx.lineWidth = 3;
        ctx.strokeStyle = frameColor;
        ctx.strokeRect(15, 15, w - 30, h - 30);

        const pillW = qrSize * 0.8;
        const pillH = h * 0.085;
        const pillX = (w - pillW) / 2;
        const pillY = h - pillH - 25;

        ctx.fillRect(pillX, pillY, pillW, pillH);

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${Math.round(pillH * 0.44)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, pillY + pillH / 2);
      }

      ctx.restore();
    }

    /**
     * Export to High-Resolution Vector SVG
     */
    toSVG() {
      const opts = this.options;
      const count = this.qr.getModuleCount();
      const size = 600;
      const margin = 30;
      const qrBoxSize = size - margin * 2;
      const cellSize = qrBoxSize / count;

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">\n`;
      
      // Defs (Gradients)
      svg += `  <defs>\n`;
      if (opts.colorMode === 'linear') {
        const rad = (opts.gradientAngle || 135) * Math.PI / 180;
        const x1 = Math.round(50 - Math.cos(rad) * 50);
        const y1 = Math.round(50 - Math.sin(rad) * 50);
        const x2 = Math.round(50 + Math.cos(rad) * 50);
        const y2 = Math.round(50 + Math.sin(rad) * 50);
        svg += `    <linearGradient id="qrGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">\n`;
        svg += `      <stop offset="0%" stop-color="${opts.fgColor1}"/>\n`;
        svg += `      <stop offset="100%" stop-color="${opts.fgColor2}"/>\n`;
        svg += `    </linearGradient>\n`;
      }
      svg += `  </defs>\n`;

      // Background
      if (!opts.isTransparentBg) {
        svg += `  <rect width="100%" height="100%" fill="${opts.bgColor || '#ffffff'}"/>\n`;
      }

      const fill = opts.colorMode === 'linear' ? 'url(#qrGrad)' : opts.fgColor1;

      // Modules
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          const finder = QREngine.isCornerFinderPattern(r, c, count);
          if (finder.isFinder) continue;

          if (this.qr.isDark(r, c)) {
            const mx = margin + c * cellSize;
            const my = margin + r * cellSize;
            if (opts.pattern === 'dots') {
              const rad = cellSize * 0.44;
              svg += `  <circle cx="${mx + cellSize / 2}" cy="${my + cellSize / 2}" r="${rad}" fill="${fill}"/>\n`;
            } else if (opts.pattern === 'rounded') {
              svg += `  <rect x="${mx}" y="${my}" width="${cellSize}" height="${cellSize}" rx="${cellSize * 0.3}" fill="${fill}"/>\n`;
            } else {
              svg += `  <rect x="${mx}" y="${my}" width="${cellSize}" height="${cellSize}" fill="${fill}"/>\n`;
            }
          }
        }
      }

      // 3 Corner Eyes
      const eyeFill = opts.customEyeColor ? opts.eyeColor : fill;
      const cornerOffsets = [
        [margin, margin],
        [margin + (count - 7) * cellSize, margin],
        [margin, margin + (count - 7) * cellSize]
      ];

      cornerOffsets.forEach(([cx, cy]) => {
        const outer = cellSize * 7;
        const inner = cellSize * 3;
        const innerOff = cellSize * 2;
        svg += `  <rect x="${cx}" y="${cy}" width="${outer}" height="${outer}" rx="${cellSize}" fill="${eyeFill}"/>\n`;
        svg += `  <rect x="${cx + cellSize}" y="${cy + cellSize}" width="${outer - cellSize * 2}" height="${outer - cellSize * 2}" rx="${cellSize * 0.5}" fill="${opts.bgColor || '#ffffff'}"/>\n`;
        svg += `  <rect x="${cx + innerOff}" y="${cy + innerOff}" width="${inner}" height="${inner}" rx="${cellSize * 0.4}" fill="${eyeFill}"/>\n`;
      });

      svg += `</svg>`;
      return svg;
    }

    /**
     * Download as PNG with custom DPI/resolution
     */
    downloadPNG(filename = 'getmeaqrcode.png', exportResolution = 1024) {
      const currentSize = this.options.size;
      this.options.size = exportResolution;
      this.render();

      const link = document.createElement('a');
      link.download = filename;
      link.href = this.canvas.toDataURL('image/png');
      link.click();

      // Restore view resolution
      this.options.size = currentSize;
      this.render();
    }

    /**
     * Download as SVG
     */
    downloadSVG(filename = 'getmeaqrcode.svg') {
      const svgData = this.toSVG();
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  return QRRenderer;
}));

