/**
 * GetMeAQRCode - SaaS Dynamic QR Analytics Module
 * Pure HTML5 Canvas charts (zero external chart dependencies).
 * Visualizes scan velocity, device/OS split, and conversion metrics.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.QRAnalytics = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class AnalyticsDashboard {
    constructor() {
      this.timelineCanvas = document.getElementById('timeline-chart');
      this.devicesCanvas = document.getElementById('devices-chart');
    }

    render() {
      this.renderTimelineChart();
      this.renderDevicesChart();
    }

    renderTimelineChart() {
      const canvas = this.timelineCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.parentElement.clientWidth || 400;
      const h = canvas.height = 180;

      ctx.clearRect(0, 0, w, h);

      // Data points (Last 14 days)
      const data = [320, 450, 520, 480, 690, 850, 1120, 940, 1050, 1280, 1420, 1310, 1580, 1720];
      const maxVal = 2000;
      const padLeft = 40;
      const padBottom = 25;
      const padTop = 15;
      const padRight = 15;
      const chartW = w - padLeft - padRight;
      const chartH = h - padBottom - padTop;

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padTop + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - padRight, y);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padLeft - 6, y + 3);
      }

      // Draw Gradient Area under Line
      const grad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      ctx.beginPath();
      const stepX = chartW / (data.length - 1);
      data.forEach((val, i) => {
        const x = padLeft + i * stepX;
        const y = padTop + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padLeft + chartW, padTop + chartH);
      ctx.lineTo(padLeft, padTop + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw Line
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = padLeft + i * stepX;
        const y = padTop + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Dots
      data.forEach((val, i) => {
        const x = padLeft + i * stepX;
        const y = padTop + chartH - (val / maxVal) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });
    }

    renderDevicesChart() {
      const canvas = this.devicesCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.parentElement.clientWidth || 300;
      const h = canvas.height = 180;

      ctx.clearRect(0, 0, w, h);

      // Doughnut slices
      const slices = [
        { label: 'iOS (iPhone)', val: 68, color: '#6366f1' },
        { label: 'Android', val: 24, color: '#10b981' },
        { label: 'Desktop / Mac', val: 8, color: '#f59e0b' }
      ];

      const cx = w * 0.35;
      const cy = h / 2;
      const radius = 55;
      const innerRadius = 35;

      let startAngle = -Math.PI / 2;

      slices.forEach(slice => {
        const sliceAngle = (slice.val / 100) * (Math.PI * 2);
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = slice.color;
        ctx.fill();

        startAngle = endAngle;
      });

      // Center Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('14.8k', cx, cy - 2);
      ctx.font = '9px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Scans', cx, cy + 12);

      // Draw Legend on the right
      const legendX = w * 0.62;
      let legendY = 40;
      slices.forEach(slice => {
        ctx.fillStyle = slice.color;
        ctx.fillRect(legendX, legendY - 8, 10, 10);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${slice.label} (${slice.val}%)`, legendX + 16, legendY - 2);

        legendY += 28;
      });
    }
  }

  return AnalyticsDashboard;
}));

