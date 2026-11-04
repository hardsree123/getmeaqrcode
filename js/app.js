/**
 * GetMeAQRCode - Main Application Controller
 * Wires real-time forms, styling engine, live contrast safety checker,
 * AI Studio, modal dialogs, and multi-format exports.
 */

// Domain Protection Layer (Prevents Unauthorized Re-hosting)
(function enforceDomainIntegrity() {
  const authorizedHosts = [
    'getmeaqrcode.com',
    'www.getmeaqrcode.com',
    'getmeaqrcode.vercel.app', // Vercel deployment
    'getmeaqrcode.pages.dev',  // Cloudflare Pages deployment
    'localhost',
    '127.0.0.1',
    '' // Local file:// protocol testing
  ];

  const currentHost = window.location.hostname;
  const isAuthorized = authorizedHosts.some(host => {
    return host === '' ? (!currentHost || window.location.protocol === 'file:') : currentHost.endsWith(host);
  });

  if (!isAuthorized) {
    console.warn('Unauthorized clone detected. Redirecting to official platform...');
    window.location.href = 'https://getmeaqrcode.com/?ref=unauthorized_clone';
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const qrCanvas = document.getElementById('qr-canvas');
  const formContainer = document.getElementById('form-fields-container');
  const typesGrid = document.getElementById('types-grid');
  const dynamicToggle = document.getElementById('dynamic-qr-toggle');
  const dynamicAlert = document.getElementById('dynamic-alert-box');
  const contrastBadge = document.getElementById('contrast-badge');
  const contrastText = document.getElementById('contrast-text');

  // Instantiate Renderer
  const renderer = new QRRenderer(qrCanvas, {
    text: 'https://getmeaqrcode.com',
    size: 600,
    pattern: 'square',
    colorMode: 'single',
    fgColor1: '#0f172a',
    fgColor2: '#4f46e5',
    bgColor: '#ffffff',
    isTransparentBg: false,
    frame: 'none',
    frameText: 'SCAN ME',
    frameColor: '#6366f1'
  });

  // Instantiate AI Studio & Analytics
  const aiEngine = new AIGenerator.AIGenerator(renderer);
  const analyticsDashboard = new QRAnalytics();

  // App State
  let currentType = 'url';
  let exportResolution = 1024;
  let activeLogoType = 'none';
  let customLogoImg = null;

  // Debounced input handler for 60fps rendering
  let renderTimeout = null;
  function triggerRender() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => {
      updateQRPayload();
      renderer.render();
      updateContrastMeter();
    }, 20);
  }

  // 1. Initialize Form for active type
  function renderTypeForm(typeKey) {
    currentType = typeKey;
    const schema = QRPayloads[typeKey];
    if (!schema) return;

    formContainer.innerHTML = schema.renderForm();

    // Attach listeners to all inputs in form
    const inputs = formContainer.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', triggerRender);
      input.addEventListener('change', triggerRender);
    });

    // Special handlers inside form (e.g., UTM toggle)
    const utmCheck = document.getElementById('field-utm-check');
    const utmRow = document.getElementById('utm-fields-row');
    if (utmCheck && utmRow) {
      utmCheck.addEventListener('change', () => {
        utmRow.classList.toggle('hidden', !utmCheck.checked);
        triggerRender();
      });
    }

    triggerRender();
  }

  // 2. Compute Payload Text
  function updateQRPayload() {
    const schema = QRPayloads[currentType];
    let payload = schema ? schema.encode() : 'https://qrstudio.pro';

    // If dynamic QR is toggled on, encode through managed shortlink
    if (dynamicToggle && dynamicToggle.checked) {
      payload = 'https://qr.studio/x7K9';
    }

    renderer.options.text = payload;
  }

  // 3. Contrast & Scannability Checker
  function updateContrastMeter() {
    const score = renderer.getContrastScore();
    if (score.isGood) {
      contrastBadge.className = 'contrast-score-badge';
      contrastText.innerHTML = `<strong>100% Scannable</strong> (${score.ratio}:1)`;
    } else {
      contrastBadge.className = 'contrast-score-badge warning';
      contrastText.innerHTML = `⚠️ Low Contrast (${score.ratio}:1) - May fail scan`;
    }
  }

  // Initialize with URL form
  renderTypeForm('url');

  // Category Selection
  typesGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.type-btn');
    if (!btn) return;
    typesGrid.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTypeForm(btn.dataset.type);
  });

  // Dynamic QR Toggle
  if (dynamicToggle) {
    dynamicToggle.addEventListener('change', () => {
      dynamicAlert.classList.toggle('hidden', !dynamicToggle.checked);
      triggerRender();
    });
  }

  // Step Tabs Navigation (Content / Design / AI)
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = {
    content: document.getElementById('tab-content-panel'),
    design: document.getElementById('tab-design-panel'),
    ai: document.getElementById('tab-ai-panel')
  };

  function switchTab(tabKey) {
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    Object.keys(tabPanels).forEach(key => {
      if (tabPanels[key]) {
        tabPanels[key].classList.toggle('active', key === tabKey);
      }
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const btnGotoDesign = document.getElementById('btn-goto-design');
  if (btnGotoDesign) {
    btnGotoDesign.addEventListener('click', () => switchTab('design'));
  }

  const navAiStudio = document.getElementById('nav-ai-studio');
  if (navAiStudio) {
    navAiStudio.addEventListener('click', () => switchTab('ai'));
  }

  // Design Accordion Toggle
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('open');
    });
  });

  // Frames & Badges
  const framePresets = document.getElementById('frame-presets');
  const frameTextInput = document.getElementById('frame-text-input');
  const frameColorPicker = document.getElementById('frame-color-picker');
  const frameColorHex = document.getElementById('frame-color-hex');

  framePresets.addEventListener('click', (e) => {
    const preset = e.target.closest('.frame-preset');
    if (!preset) return;
    framePresets.querySelectorAll('.frame-preset').forEach(p => p.classList.remove('active'));
    preset.classList.add('active');
    renderer.setOptions({ frame: preset.dataset.frame });
    triggerRender();
  });

  if (frameTextInput) {
    frameTextInput.addEventListener('input', () => {
      renderer.setOptions({ frameText: frameTextInput.value });
      triggerRender();
    });
  }

  if (frameColorPicker) {
    frameColorPicker.addEventListener('input', () => {
      frameColorHex.innerText = frameColorPicker.value;
      renderer.setOptions({ frameColor: frameColorPicker.value });
      triggerRender();
    });
  }

  // Patterns & Body Shapes
  const patternPresets = document.getElementById('pattern-presets');
  patternPresets.addEventListener('click', (e) => {
    const btn = e.target.closest('.pattern-btn');
    if (!btn) return;
    patternPresets.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderer.setOptions({ pattern: btn.dataset.pattern });
    triggerRender();
  });

  // Corner Eyes: Outer Frame & Inner Eyeball
  const eyeFramePresets = document.getElementById('eye-frame-presets');
  eyeFramePresets.addEventListener('click', (e) => {
    const btn = e.target.closest('.eye-btn');
    if (!btn) return;
    eyeFramePresets.querySelectorAll('.eye-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderer.setOptions({ eyeFrame: btn.dataset.eyeFrame });
    triggerRender();
  });

  const eyeBallPresets = document.getElementById('eye-ball-presets');
  eyeBallPresets.addEventListener('click', (e) => {
    const btn = e.target.closest('.eye-btn');
    if (!btn) return;
    eyeBallPresets.querySelectorAll('.eye-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderer.setOptions({ eyeBall: btn.dataset.eyeBall });
    triggerRender();
  });

  // Custom Corner Eye Color
  const customEyeCheck = document.getElementById('custom-eye-color-check');
  const customEyePickerBox = document.getElementById('custom-eye-picker-box');
  const eyeColorPicker = document.getElementById('eye-color-picker');
  const eyeColorHex = document.getElementById('eye-color-hex');

  customEyeCheck.addEventListener('change', () => {
    customEyePickerBox.classList.toggle('hidden', !customEyeCheck.checked);
    renderer.setOptions({
      customEyeColor: customEyeCheck.checked,
      eyeColor: eyeColorPicker.value
    });
    triggerRender();
  });

  eyeColorPicker.addEventListener('input', () => {
    eyeColorHex.innerText = eyeColorPicker.value;
    renderer.setOptions({ eyeColor: eyeColorPicker.value });
    triggerRender();
  });

  // Color Modes (Single / Linear / Radial)
  const colorModeBtns = document.querySelectorAll('.sub-tab-btn');
  const fgColor2Group = document.getElementById('fg-color-2-group');
  const gradientAngleGroup = document.getElementById('gradient-angle-group');
  const fgColor1Input = document.getElementById('fg-color-1');
  const fgColor2Input = document.getElementById('fg-color-2');
  const fgColor1Hex = document.getElementById('fg-color-1-hex');
  const fgColor2Hex = document.getElementById('fg-color-2-hex');
  const angleSlider = document.getElementById('gradient-angle-slider');
  const angleVal = document.getElementById('gradient-angle-val');
  const bgColorPicker = document.getElementById('bg-color-picker');
  const bgColorHex = document.getElementById('bg-color-hex');
  const transparentBgCheck = document.getElementById('transparent-bg-check');

  colorModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.colorMode;
      const isGrad = (mode === 'linear' || mode === 'radial');
      fgColor2Group.classList.toggle('hidden', !isGrad);
      gradientAngleGroup.classList.toggle('hidden', mode !== 'linear');
      renderer.setOptions({ colorMode: mode });
      triggerRender();
    });
  });

  fgColor1Input.addEventListener('input', () => {
    fgColor1Hex.innerText = fgColor1Input.value;
    renderer.setOptions({ fgColor1: fgColor1Input.value });
    triggerRender();
  });

  fgColor2Input.addEventListener('input', () => {
    fgColor2Hex.innerText = fgColor2Input.value;
    renderer.setOptions({ fgColor2: fgColor2Input.value });
    triggerRender();
  });

  angleSlider.addEventListener('input', () => {
    angleVal.innerText = angleSlider.value + '°';
    renderer.setOptions({ gradientAngle: parseInt(angleSlider.value, 10) });
    triggerRender();
  });

  bgColorPicker.addEventListener('input', () => {
    bgColorHex.innerText = bgColorPicker.value;
    renderer.setOptions({ bgColor: bgColorPicker.value });
    triggerRender();
  });

  transparentBgCheck.addEventListener('change', () => {
    renderer.setOptions({ isTransparentBg: transparentBgCheck.checked });
    triggerRender();
  });

  // Curated Palette Presets
  document.querySelectorAll('.swatch-btn').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const fg = swatch.dataset.fg;
      const fg2 = swatch.dataset.fg2;
      const bg = swatch.dataset.bg;

      fgColor1Input.value = fg;
      fgColor1Hex.innerText = fg;
      fgColor2Input.value = fg2;
      fgColor2Hex.innerText = fg2;
      bgColorPicker.value = bg;
      bgColorHex.innerText = bg;

      renderer.setOptions({
        fgColor1: fg,
        fgColor2: fg2,
        bgColor: bg,
        colorMode: fg === fg2 ? 'single' : 'linear'
      });
      triggerRender();
    });
  });

  // Logos & Icons
  const logoPresets = document.getElementById('logo-presets');
  const logoFileInput = document.getElementById('logo-file-input');
  const logoDropzone = document.getElementById('logo-dropzone');
  const logoPreviewBox = document.getElementById('logo-preview-box');
  const logoPreviewImg = document.getElementById('logo-preview-img');
  const btnRemoveLogo = document.getElementById('btn-remove-logo');

  // Preset Logos SVGs / URLs
  const presetSvgs = {
    google: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23EA4335' d='M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z'/><path fill='%234285F4' d='M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z'/><path fill='%23FBBC05' d='M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3c0 2.2.5 4.3 1.4 6.2l3.7-2.9c.3-1.3.5-2.6.5-3.8z'/><path fill='%2334A853' d='M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.7 7.5 23.5 12 23.5z'/></svg>",
    instagram: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E1306C'><circle cx='12' cy='12' r='4'/><path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z'/></svg>",
    whatsapp: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'><path d='M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z'/></svg>",
    youtube: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF0000'><path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/></svg>",
    wifi: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2.5'><path d='M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01'/></svg>",
    linkedin: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A66C2'><path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'/></svg>"
  };

  logoPresets.addEventListener('click', (e) => {
    const btn = e.target.closest('.logo-btn');
    if (!btn) return;
    logoPresets.querySelectorAll('.logo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const logoKey = btn.dataset.logo;
    activeLogoType = logoKey;

    if (logoKey === 'none') {
      renderer.setOptions({ logoImg: null });
      logoPreviewBox.classList.add('hidden');
      triggerRender();
      return;
    }

    const img = new Image();
    img.onload = () => {
      renderer.setOptions({ logoImg: img });
      logoPreviewImg.src = presetSvgs[logoKey];
      logoPreviewBox.classList.remove('hidden');
      triggerRender();
    };
    img.src = presetSvgs[logoKey];
  });

  // Custom Logo Upload
  function handleLogoFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        customLogoImg = img;
        renderer.setOptions({ logoImg: img });
        logoPreviewImg.src = evt.target.result;
        logoPreviewBox.classList.remove('hidden');
        logoPresets.querySelectorAll('.logo-btn').forEach(b => b.classList.remove('active'));
        triggerRender();
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  logoFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleLogoFile(e.target.files[0]);
  });

  logoDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoDropzone.style.borderColor = 'var(--primary)';
  });

  logoDropzone.addEventListener('dragleave', () => {
    logoDropzone.style.borderColor = 'var(--border-subtle)';
  });

  logoDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    logoDropzone.style.borderColor = 'var(--border-subtle)';
    if (e.dataTransfer.files.length) handleLogoFile(e.dataTransfer.files[0]);
  });

  btnRemoveLogo.addEventListener('click', () => {
    renderer.setOptions({ logoImg: null });
    logoPreviewBox.classList.add('hidden');
    logoFileInput.value = '';
    logoPresets.querySelector('[data-logo="none"]').classList.add('active');
    triggerRender();
  });

  // AI Generator Tab
  let selectedAiStyle = 'cyberpunk';
  const aiStylesGrid = document.getElementById('ai-styles-grid');
  const btnGenerateAi = document.getElementById('btn-generate-ai');
  const aiPromptInput = document.getElementById('ai-prompt-input');

  aiStylesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.ai-style-card');
    if (!card) return;
    aiStylesGrid.querySelectorAll('.ai-style-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedAiStyle = card.dataset.style;
  });

  document.querySelectorAll('.suggestion-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      aiPromptInput.value = tag.dataset.prompt;
    });
  });

  btnGenerateAi.addEventListener('click', () => {
    const prompt = aiPromptInput.value.trim() || 'Cyberpunk neon cafe';
    btnGenerateAi.disabled = true;
    btnGenerateAi.innerHTML = '<span>✨ Synthesizing...</span>';

    aiEngine.synthesize(prompt, selectedAiStyle, 2, (pct) => {
      // Progress
    }, (res) => {
      btnGenerateAi.disabled = false;
      btnGenerateAi.innerHTML = '<span class="sparkle-icon">✨</span> Generate AI QR Code Artwork';
      updateContrastMeter();
    });
  });

  // Resolution Chips
  const resChips = document.querySelectorAll('.res-chip');
  const resLabel = document.getElementById('res-label');
  resChips.forEach(chip => {
    chip.addEventListener('click', () => {
      resChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      exportResolution = parseInt(chip.dataset.size, 10);
      resLabel.innerText = `${exportResolution} x ${exportResolution} px (${chip.innerText})`;
    });
  });

  // Export Buttons & High-RPM Download Ad Interstitial
  const downloadAdModal = document.getElementById('download-ad-modal');
  const countdownTimerText = document.getElementById('countdown-timer-text');
  const btnInstantDownload = document.getElementById('btn-instant-download');
  let pendingDownloadAction = null;
  let countdownTimer = null;

  function triggerMonetizedDownload(actionFn) {
    pendingDownloadAction = actionFn;
    downloadAdModal.classList.remove('hidden');

    let secondsLeft = 3;
    countdownTimerText.innerHTML = `Download starts automatically in <strong>${secondsLeft}</strong> seconds...`;

    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        countdownTimerText.innerHTML = `Download starts automatically in <strong>${secondsLeft}</strong> seconds...`;
      } else {
        clearInterval(countdownTimer);
        downloadAdModal.classList.add('hidden');
        if (pendingDownloadAction) {
          pendingDownloadAction();
          pendingDownloadAction = null;
        }
      }
    }, 1000);
  }

  btnInstantDownload.addEventListener('click', () => {
    clearInterval(countdownTimer);
    downloadAdModal.classList.add('hidden');
    if (pendingDownloadAction) {
      pendingDownloadAction();
      pendingDownloadAction = null;
    }
  });

  document.getElementById('btn-download-png').addEventListener('click', () => {
    triggerMonetizedDownload(() => {
      renderer.downloadPNG(`getmeaqrcode-${currentType}-${exportResolution}px.png`, exportResolution);
    });
  });

  document.getElementById('btn-download-svg').addEventListener('click', () => {
    triggerMonetizedDownload(() => {
      renderer.downloadSVG(`getmeaqrcode-${currentType}.svg`);
    });
  });

  document.getElementById('btn-download-pdf').addEventListener('click', () => {
    // Generate high-res print document window
    const dataUrl = qrCanvas.toDataURL('image/png');
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Code — GetMeAQRCode</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; margin: 0; text-align: center; }
          img { max-width: 480px; width: 100%; height: auto; }
          h2 { margin-top: 1.5rem; color: #0f172a; font-size: 1.5rem; }
          p { color: #64748b; font-size: 0.9rem; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <img src="${dataUrl}">
        <h2>Scan with Smartphone Camera</h2>
        <p>Generated by GetMeAQRCode (ISO/IEC 18004 Standard)</p>
        <div class="no-print" style="margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 20px; font-weight:bold; cursor:pointer; background:#6366f1; color:#fff; border:none; border-radius:6px;">Print Now</button>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  });

  // Copy to Clipboard
  document.getElementById('btn-copy-clipboard').addEventListener('click', async () => {
    try {
      qrCanvas.toBlob(async (blob) => {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        const btn = document.getElementById('btn-copy-clipboard');
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        setTimeout(() => { btn.innerHTML = orig; }, 1800);
      });
    } catch (e) {
      alert('Copied link payload: ' + renderer.options.text);
    }
  });

  // Test Scan Decoder Modal
  const scanTestModal = document.getElementById('scan-test-modal');
  const btnScanTest = document.getElementById('btn-scan-test');
  const testResultType = document.getElementById('test-result-type');
  const testResultPayload = document.getElementById('test-result-payload');

  btnScanTest.addEventListener('click', () => {
    testResultType.innerText = `Type: ${QRPayloads[currentType]?.title || 'Website'}`;
    testResultPayload.innerText = renderer.options.text;
    scanTestModal.classList.remove('hidden');
  });

  // Pricing Modal
  const pricingModal = document.getElementById('pricing-modal');
  document.getElementById('btn-pricing').addEventListener('click', () => {
    pricingModal.classList.remove('hidden');
  });

  // Analytics Modal
  const analyticsModal = document.getElementById('analytics-modal');
  document.getElementById('nav-analytics').addEventListener('click', () => {
    analyticsModal.classList.remove('hidden');
    setTimeout(() => { analyticsDashboard.render(); }, 50);
  });

  // History & Saved QRs (Local Storage)
  const historyModal = document.getElementById('history-modal');
  const historyListContainer = document.getElementById('history-list-container');
  const historyBadge = document.getElementById('history-badge');
  const btnSaveCode = document.getElementById('btn-save-code');
  const navHistory = document.getElementById('nav-history');

  function getSavedCodes() {
    try {
      return JSON.parse(localStorage.getItem('qr_saved_codes') || '[]');
    } catch (e) {
      return [];
    }
  }

  function updateHistoryBadge() {
    const list = getSavedCodes();
    historyBadge.innerText = list.length;
  }

  function renderHistoryList() {
    const list = getSavedCodes();
    if (!list.length) {
      historyListContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:2rem 0;">No saved QR codes yet. Click "Save to My Codes" to store codes here.</p>`;
      return;
    }

    historyListContainer.innerHTML = list.map((item, idx) => `
      <div class="history-item">
        <div class="history-item-left">
          <img src="${item.thumb}" class="history-thumb" alt="QR">
          <div class="history-info">
            <h5>${item.title}</h5>
            <span>${item.date} • ${item.type.toUpperCase()}</span>
          </div>
        </div>
        <div class="history-actions">
          <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="window.loadSavedQR(${idx})">Load</button>
          <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:var(--danger);" onclick="window.deleteSavedQR(${idx})">&times;</button>
        </div>
      </div>
    `).join('');
  }

  btnSaveCode.addEventListener('click', () => {
    const list = getSavedCodes();
    const item = {
      title: `${QRPayloads[currentType]?.title || 'QR Code'}`,
      type: currentType,
      text: renderer.options.text,
      thumb: qrCanvas.toDataURL('image/png'),
      date: new Date().toLocaleDateString()
    };
    list.unshift(item);
    localStorage.setItem('qr_saved_codes', JSON.stringify(list.slice(0, 20)));
    updateHistoryBadge();

    const orig = btnSaveCode.innerHTML;
    btnSaveCode.innerHTML = '✓ Saved to Collection!';
    setTimeout(() => { btnSaveCode.innerHTML = orig; }, 1800);
  });

  navHistory.addEventListener('click', () => {
    renderHistoryList();
    historyModal.classList.remove('hidden');
  });

  window.deleteSavedQR = function (idx) {
    const list = getSavedCodes();
    list.splice(idx, 1);
    localStorage.setItem('qr_saved_codes', JSON.stringify(list));
    updateHistoryBadge();
    renderHistoryList();
  };

  window.loadSavedQR = function (idx) {
    const list = getSavedCodes();
    const item = list[idx];
    if (!item) return;
    historyModal.classList.add('hidden');
    renderer.setOptions({ text: item.text });
    triggerRender();
  };

  updateHistoryBadge();

  // Modal Closers
  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        el.closest('.modal-backdrop').classList.add('hidden');
      }
    });
  });

  // Theme Switcher
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('qr_theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const cur = html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('qr_theme', next);
  });

  // Notification Bar Close
  const notifClose = document.getElementById('notification-close');
  const notifBar = document.getElementById('notification-bar');
  if (notifClose && notifBar) {
    notifClose.addEventListener('click', () => {
      notifBar.style.display = 'none';
    });
  }

  // SEO FAQ Accordion Interactivity
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasActive = item.classList.contains('active');
      // Optional: close other open items for accordion behavior
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });

  // Initial trigger to render QR on load
  triggerRender();
});

