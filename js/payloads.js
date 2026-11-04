/**
 * GetMeAQRCode - QR Payload Encoders & Dynamic Form Field Schemas
 * Standardized payloads for ISO/IEC 18004 readers (iOS Camera, Google Lens, Android)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.QRPayloads = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const Payloads = {
    // 1. Website URL with optional UTM parameters
    url: {
      title: 'Website Link',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Website URL <span style="color:var(--primary)">*</span></label>
            <input type="url" id="field-url" placeholder="https://yourwebsite.com" value="https://getmeaqrcode.com">
          </div>
          <div class="mt-3">
            <label class="checkbox-label" id="utm-toggle-label">
              <input type="checkbox" id="field-utm-check">
              <span>Add Marketing Campaign Tags (UTM Parameters)</span>
            </label>
            <div class="form-row mt-2 hidden" id="utm-fields-row">
              <div class="form-group flex-1">
                <label>Campaign Source</label>
                <input type="text" id="field-utm-source" placeholder="e.g. flyer, qr, billboard">
              </div>
              <div class="form-group flex-1">
                <label>Campaign Medium</label>
                <input type="text" id="field-utm-medium" placeholder="e.g. print, qr-code">
              </div>
              <div class="form-group flex-1">
                <label>Campaign Name</label>
                <input type="text" id="field-utm-campaign" placeholder="e.g. spring_sale">
              </div>
            </div>
          </div>
        `;
      },
      encode: function () {
        let base = (document.getElementById('field-url')?.value || '').trim();
        if (!base) return 'https://qrstudio.pro';
        if (!/^https?:\/\//i.test(base)) base = 'https://' + base;

        const utmCheck = document.getElementById('field-utm-check')?.checked;
        if (utmCheck) {
          const src = document.getElementById('field-utm-source')?.value.trim();
          const med = document.getElementById('field-utm-medium')?.value.trim();
          const cam = document.getElementById('field-utm-campaign')?.value.trim();
          try {
            const urlObj = new URL(base);
            if (src) urlObj.searchParams.set('utm_source', src);
            if (med) urlObj.searchParams.set('utm_medium', med);
            if (cam) urlObj.searchParams.set('utm_campaign', cam);
            return urlObj.toString();
          } catch (e) {
            return base;
          }
        }
        return base;
      }
    },

    // 2. vCard 3.0 Contact Card
    vcard: {
      title: 'vCard Digital Business Card',
      renderForm: function () {
        return `
          <div class="form-row">
            <div class="form-group flex-1">
              <label>First Name <span style="color:var(--primary)">*</span></label>
              <input type="text" id="vcard-fn" placeholder="Alex" value="Alex">
            </div>
            <div class="form-group flex-1">
              <label>Last Name <span style="color:var(--primary)">*</span></label>
              <input type="text" id="vcard-ln" placeholder="Rivers" value="Rivers">
            </div>
          </div>
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Organization / Company</label>
              <input type="text" id="vcard-org" placeholder="Nexus Digital" value="Nexus Digital">
            </div>
            <div class="form-group flex-1">
              <label>Job Title</label>
              <input type="text" id="vcard-title" placeholder="Creative Director" value="Creative Director">
            </div>
          </div>
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Mobile Phone <span style="color:var(--primary)">*</span></label>
              <input type="tel" id="vcard-tel" placeholder="+1 (555) 234-5678" value="+15552345678">
            </div>
            <div class="form-group flex-1">
              <label>Email Address</label>
              <input type="email" id="vcard-email" placeholder="alex@nexus.com" value="alex@nexus.com">
            </div>
          </div>
          <div class="form-group mt-2">
            <label>Portfolio / Website</label>
            <input type="url" id="vcard-url" placeholder="https://nexus.com" value="https://nexus.com">
          </div>
        `;
      },
      encode: function () {
        const fn = document.getElementById('vcard-fn')?.value.trim() || 'Alex';
        const ln = document.getElementById('vcard-ln')?.value.trim() || 'Rivers';
        const org = document.getElementById('vcard-org')?.value.trim() || '';
        const title = document.getElementById('vcard-title')?.value.trim() || '';
        const tel = document.getElementById('vcard-tel')?.value.trim() || '';
        const email = document.getElementById('vcard-email')?.value.trim() || '';
        const url = document.getElementById('vcard-url')?.value.trim() || '';

        return `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}\nORG:${org}\nTITLE:${title}\nTEL;TYPE=CELL,VOICE:${tel}\nEMAIL;TYPE=INTERNET:${email}\nURL:${url}\nEND:VCARD`;
      }
    },

    // 3. Wi-Fi Auto-Connect
    wifi: {
      title: 'Wi-Fi Network Quick Connect',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Network SSID Name <span style="color:var(--primary)">*</span></label>
            <input type="text" id="wifi-ssid" placeholder="Office_Guest_WiFi" value="Studio_Fast_WiFi">
          </div>
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Security Encryption</label>
              <select id="wifi-type">
                <option value="WPA" selected>WPA / WPA2 / WPA3 (Default)</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password (Open)</option>
              </select>
            </div>
            <div class="form-group flex-1" id="wifi-pass-group">
              <label>Network Password</label>
              <input type="text" id="wifi-pass" placeholder="Enter WiFi Password" value="ConnectNow2026!">
            </div>
          </div>
          <label class="checkbox-label mt-2">
            <input type="checkbox" id="wifi-hidden">
            <span>Hidden Network SSID</span>
          </label>
        `;
      },
      encode: function () {
        const ssid = (document.getElementById('wifi-ssid')?.value || '').trim() || 'Guest_WiFi';
        const type = document.getElementById('wifi-type')?.value || 'WPA';
        const pass = (document.getElementById('wifi-pass')?.value || '').trim();
        const hidden = document.getElementById('wifi-hidden')?.checked ? 'true' : 'false';

        // Escaping special characters in SSID & password: \ ; , : "
        const cleanSsid = ssid.replace(/([\\;,:"])/g, '\\$1');
        const cleanPass = pass.replace(/([\\;,:"])/g, '\\$1');

        return `WIFI:T:${type};S:${cleanSsid};P:${type === 'nopass' ? '' : cleanPass};H:${hidden};;`;
      }
    },

    // 4. Social Media Links
    social: {
      title: 'Social Media & Bio Links',
      renderForm: function () {
        return `
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">Create a smart multi-link destination that connects users to all your social profiles.</p>
          <div class="form-group">
            <label>Primary Brand Handle / Link-in-Bio URL</label>
            <input type="text" id="social-bio-url" placeholder="https://linktr.ee/yourbrand" value="https://instagram.com/getmeaqrcode">
          </div>
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Instagram Handle</label>
              <input type="text" id="social-ig" placeholder="@yourbrand" value="@getmeaqrcode">
            </div>
            <div class="form-group flex-1">
              <label>YouTube / TikTok</label>
              <input type="text" id="social-yt" placeholder="@channel" value="@getmeaqrcode">
            </div>
          </div>
        `;
      },
      encode: function () {
        const url = (document.getElementById('social-bio-url')?.value || '').trim();
        return url || 'https://instagram.com/getmeaqrcode';
      }
    },

    // 5. Plain Text
    text: {
      title: 'Plain Text & Notes',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Your Text Message / Note</label>
            <textarea id="field-plain-text" rows="4" placeholder="Enter any text, instructions, or codes up to 500 characters...">Welcome to the special event! Show this code at the registration counter to claim your badge.</textarea>
          </div>
        `;
      },
      encode: function () {
        return document.getElementById('field-plain-text')?.value || 'Welcome to GetMeAQRCode!';
      }
    },

    // 6. Email (mailto URI)
    email: {
      title: 'Email Dispatch',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Recipient Email Address <span style="color:var(--primary)">*</span></label>
            <input type="email" id="email-to" placeholder="contact@company.com" value="support@getmeaqrcode.com">
          </div>
          <div class="form-group mt-2">
            <label>Subject Line</label>
            <input type="text" id="email-subject" placeholder="Inquiry from QR Code" value="Inquiry regarding Services">
          </div>
          <div class="form-group mt-2">
            <label>Pre-filled Message Body</label>
            <textarea id="email-body" rows="3" placeholder="Hello, I saw your QR code and would like to know more...">Hi team, I would like to schedule a consultation with your team.</textarea>
          </div>
        `;
      },
      encode: function () {
        const to = (document.getElementById('email-to')?.value || '').trim();
        const sub = (document.getElementById('email-subject')?.value || '').trim();
        const body = (document.getElementById('email-body')?.value || '').trim();
        return `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
      }
    },

    // 7. SMS Text Message
    sms: {
      title: 'SMS Message',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Phone Number (with Country Code) <span style="color:var(--primary)">*</span></label>
            <input type="tel" id="sms-phone" placeholder="+15551234567" value="+15559876543">
          </div>
          <div class="form-group mt-2">
            <label>Pre-written SMS Message</label>
            <textarea id="sms-text" rows="3" placeholder="e.g. SUBSCRIBE or RSVP YES">START OFFER50</textarea>
          </div>
        `;
      },
      encode: function () {
        const phone = (document.getElementById('sms-phone')?.value || '').trim();
        const text = (document.getElementById('sms-text')?.value || '').trim();
        return `smsto:${phone}:${text}`;
      }
    },

    // 8. Phone Call
    phone: {
      title: 'Phone Call Direct Dial',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Phone Number (with Country Code) <span style="color:var(--primary)">*</span></label>
            <input type="tel" id="tel-number" placeholder="+1 (800) 555-0199" value="+18005550199">
          </div>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">When scanned, the user's phone app opens directly with this number ready to dial.</p>
        `;
      },
      encode: function () {
        const num = (document.getElementById('tel-number')?.value || '').trim();
        return `tel:${num}`;
      }
    },

    // 9. WhatsApp Direct Chat
    whatsapp: {
      title: 'WhatsApp Direct Chat',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>WhatsApp Number (Numeric with country code, no + or dashes) <span style="color:var(--primary)">*</span></label>
            <input type="tel" id="wa-number" placeholder="15551234567" value="15559876543">
          </div>
          <div class="form-group mt-2">
            <label>Pre-populated Greeting Message</label>
            <textarea id="wa-msg" rows="3" placeholder="Hello! I would like to inquire about...">Hello! I saw your flyer and would like to chat.</textarea>
          </div>
        `;
      },
      encode: function () {
        let num = (document.getElementById('wa-number')?.value || '').replace(/\D/g, '');
        const msg = (document.getElementById('wa-msg')?.value || '').trim();
        return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
      }
    },

    // 10. PDF Document Reader
    pdf: {
      title: 'PDF Document Hosting',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>PDF Document URL <span style="color:var(--primary)">*</span></label>
            <input type="url" id="pdf-url" placeholder="https://domain.com/brochure.pdf" value="https://getmeaqrcode.com/demo-catalogue.pdf">
          </div>
          <div class="form-group mt-2">
            <label>Document Title</label>
            <input type="text" id="pdf-title" placeholder="Company Catalogue 2026" value="Summer 2026 Product Catalogue">
          </div>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">Scanners open a responsive, mobile-friendly PDF reader directly on their smartphones.</p>
        `;
      },
      encode: function () {
        return (document.getElementById('pdf-url')?.value || '').trim() || 'https://getmeaqrcode.com/demo.pdf';
      }
    },

    // 11. Unified App Store Redirection
    appstore: {
      title: 'App Store Smart Redirection',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>iOS Apple App Store Link</label>
            <input type="url" id="app-ios" placeholder="https://apps.apple.com/app/id..." value="https://apps.apple.com/app/getmeaqrcode/id123456">
          </div>
          <div class="form-group mt-2">
            <label>Android Google Play Store Link</label>
            <input type="url" id="app-android" placeholder="https://play.google.com/store/apps/details?id=..." value="https://play.google.com/store/apps/details?id=com.getmeaqrcode.app">
          </div>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">Smart dynamic link automatically routes iOS users to Apple App Store and Android users to Google Play.</p>
        `;
      },
      encode: function () {
        const ios = document.getElementById('app-ios')?.value.trim();
        const android = document.getElementById('app-android')?.value.trim();
        return ios || android || 'https://getmeaqrcode.com/download-app';
      }
    },

    // 12. Digital Restaurant Menu
    menu: {
      title: 'Digital Restaurant Menu',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Menu Web Page Link / PDF</label>
            <input type="url" id="menu-url" placeholder="https://restaurant.com/menu" value="https://restaurant.com/menu">
          </div>
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Restaurant Name</label>
              <input type="text" id="menu-restaurant" placeholder="Bistro Parisien" value="Lumière Bistro & Bar">
            </div>
            <div class="form-group flex-1">
              <label>Table Number (Optional)</label>
              <input type="text" id="menu-table" placeholder="e.g. Table 12" value="Table 04">
            </div>
          </div>
        `;
      },
      encode: function () {
        const url = (document.getElementById('menu-url')?.value || '').trim() || 'https://restaurant.com/menu';
        const table = (document.getElementById('menu-table')?.value || '').trim();
        try {
          const u = new URL(url);
          if (table) u.searchParams.set('table', table);
          return u.toString();
        } catch (e) {
          return url;
        }
      }
    },

    // 13. Crypto Wallet Address
    crypto: {
      title: 'Cryptocurrency Payment Address',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Select Cryptocurrency</label>
            <select id="crypto-currency">
              <option value="bitcoin" selected>Bitcoin (BTC)</option>
              <option value="ethereum">Ethereum (ETH / ERC-20)</option>
              <option value="solana">Solana (SOL)</option>
              <option value="usdt">Tether USDT (TRC20)</option>
            </select>
          </div>
          <div class="form-group mt-2">
            <label>Wallet Receiving Address <span style="color:var(--primary)">*</span></label>
            <input type="text" id="crypto-addr" placeholder="Wallet Address" value="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh">
          </div>
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Requested Amount (Optional)</label>
              <input type="number" step="any" id="crypto-amount" placeholder="0.005">
            </div>
          </div>
        `;
      },
      encode: function () {
        const coin = document.getElementById('crypto-currency')?.value || 'bitcoin';
        const addr = (document.getElementById('crypto-addr')?.value || '').trim();
        const amt = (document.getElementById('crypto-amount')?.value || '').trim();

        if (coin === 'bitcoin') {
          return `bitcoin:${addr}${amt ? '?amount=' + amt : ''}`;
        } else if (coin === 'ethereum') {
          return `ethereum:${addr}${amt ? '?value=' + amt : ''}`;
        }
        return addr;
      }
    },

    // 14. Calendar Event (iCal format)
    event: {
      title: 'Calendar Event / iCal',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Event Title <span style="color:var(--primary)">*</span></label>
            <input type="text" id="event-title" placeholder="Tech Summit 2026" value="AI & Design Summit 2026">
          </div>
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Start Date & Time</label>
              <input type="datetime-local" id="event-start" value="2026-12-10T09:00">
            </div>
            <div class="form-group flex-1">
              <label>End Date & Time</label>
              <input type="datetime-local" id="event-end" value="2026-12-10T17:00">
            </div>
          </div>
          <div class="form-group mt-2">
            <label>Location / Venue</label>
            <input type="text" id="event-location" placeholder="Convention Center, Hall A" value="Metropolitan Expo Center, New York">
          </div>
        `;
      },
      encode: function () {
        const title = document.getElementById('event-title')?.value.trim() || 'Event';
        const start = document.getElementById('event-start')?.value.replace(/[-:]/g, '') + '00Z';
        const end = document.getElementById('event-end')?.value.replace(/[-:]/g, '') + '00Z';
        const loc = document.getElementById('event-location')?.value.trim() || '';

        return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${start}\nDTEND:${end}\nLOCATION:${loc}\nEND:VEVENT\nEND:VCALENDAR`;
      }
    },

    // 15. Location (Geo Coordinates)
    location: {
      title: 'Geo Location & Maps',
      renderForm: function () {
        return `
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Latitude <span style="color:var(--primary)">*</span></label>
              <input type="text" id="geo-lat" placeholder="40.7128" value="40.7128">
            </div>
            <div class="form-group flex-1">
              <label>Longitude <span style="color:var(--primary)">*</span></label>
              <input type="text" id="geo-lng" placeholder="-74.0060" value="-74.0060">
            </div>
          </div>
          <div class="form-group mt-2">
            <label>Location Name / Address</label>
            <input type="text" id="geo-name" placeholder="Empire State Building" value="New York City Center">
          </div>
        `;
      },
      encode: function () {
        const lat = document.getElementById('geo-lat')?.value.trim() || '40.7128';
        const lng = document.getElementById('geo-lng')?.value.trim() || '-74.0060';
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    },

    // 16. Rating / Feedback
    rating: {
      title: 'Customer Rating & Review Form',
      renderForm: function () {
        return `
          <div class="form-group">
            <label>Review / Feedback Page URL <span style="color:var(--primary)">*</span></label>
            <input type="url" id="rating-url" placeholder="https://g.page/r/your-review" value="https://getmeaqrcode.com/review/nexus">
          </div>
          <div class="form-group mt-2">
            <label>Business Name</label>
            <input type="text" id="rating-business" placeholder="My Store" value="Nexus Design Studios">
          </div>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">Directs customers straight to your Google Reviews or Trustpilot rating page.</p>
        `;
      },
      encode: function () {
        return document.getElementById('rating-url')?.value.trim() || 'https://getmeaqrcode.com/review';
      }
    }
  };

  return Payloads;
}));

