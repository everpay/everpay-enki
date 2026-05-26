import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Serves the Everpay checkout widget JS for BigCommerce storefronts.
 * Injected via Script Manager during OAuth install.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

  const checkoutScript = `
;(function () {
  if (window.__everpay_widget_injected) return;
  window.__everpay_widget_injected = true;

  var APP_BASE = '${supabaseUrl}/functions/v1';
  var OAUTH_URL = APP_BASE + '/bigcommerce-oauth';
  var CHECKOUT_URL = APP_BASE + '/bigcommerce-checkout';

  function log() { console.debug.apply(console, ['[Everpay Widget]'].concat(Array.prototype.slice.call(arguments))); }

  function whenElement(selector, timeout) {
    timeout = timeout || 10000;
    return new Promise(function (resolve, reject) {
      var el = document.querySelector(selector);
      if (el) return resolve(el);
      var obs = new MutationObserver(function () {
        var e = document.querySelector(selector);
        if (e) { obs.disconnect(); resolve(e); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { obs.disconnect(); reject(new Error('timeout: ' + selector)); }, timeout);
    });
  }

  function getStoreHash() {
    var meta = document.querySelector('meta[name="bc-store-hash"]') || document.querySelector('meta[name="store-hash"]');
    if (meta && meta.content) return meta.content;
    if (window.BC_ORDER && window.BC_ORDER.store_hash) return window.BC_ORDER.store_hash;
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var m = (scripts[i].src || '').match(/stores\\/([a-z0-9]+)\\//i);
      if (m) return m[1];
    }
    return null;
  }

  function getOrderId() {
    try {
      if (window.BC_ORDER && window.BC_ORDER.id) return String(window.BC_ORDER.id);
      if (window.checkoutConfig && window.checkoutConfig.orderId) return String(window.checkoutConfig.orderId);
      var orderInput = document.querySelector('input[name="order_id"]');
      if (orderInput && orderInput.value) return String(orderInput.value);
    } catch (e) {}
    return null;
  }

  function getCheckoutId() {
    try {
      if (window.checkoutConfig && window.checkoutConfig.checkoutId) return String(window.checkoutConfig.checkoutId);
      var match = (window.location.pathname || '').match(/\/checkouts\/([^/?#]+)/i);
      if (match && match[1]) return match[1];
    } catch (e) {}
    return null;
  }

  function createCardForm(theme) {
    var wrapper = document.createElement('div');
    wrapper.id = 'everpay-card-form-wrapper';
    wrapper.style.cssText = 'border:1px solid #e6e6e6;padding:16px;border-radius:8px;margin-top:12px;max-width:520px;';

    function esc(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;}
    function safeColor(s){return /^#[0-9a-fA-F]{3,8}$|^[a-zA-Z]+$/.test(String(s||''))?String(s):'';}
    var btnBg = safeColor(theme.button_bg_color) || '#0052cc';
    var btnFg = safeColor(theme.button_text_color) || '#fff';
    wrapper.innerHTML =
      '<h4 style="margin:0 0 8px 0">' + esc(theme.header_text || 'Pay securely with Everpay') + '</h4>' +
      '<div style="display:flex;gap:8px;flex-direction:column;">' +
        '<input id="everpay-card-name" placeholder="Cardholder name" style="padding:8px;border:1px solid #ccc;border-radius:4px" />' +
        '<input id="everpay-card-number" placeholder="Card number" inputmode="numeric" style="padding:8px;border:1px solid #ccc;border-radius:4px" />' +
        '<div style="display:flex;gap:8px;">' +
          '<input id="everpay-card-exp" placeholder="MM/YY" style="padding:8px;border:1px solid #ccc;border-radius:4px;flex:1" />' +
          '<input id="everpay-card-cvc" placeholder="CVC" inputmode="numeric" style="padding:8px;border:1px solid #ccc;border-radius:4px;width:120px" />' +
        '</div>' +
        '<div id="everpay-card-message" style="color:#c00;min-height:18px;font-size:13px"></div>' +
        '<button id="everpay-pay-btn" style="padding:10px 14px;border-radius:6px;border:none;background:' +
          btnBg + ';color:' + btnFg +
          ';cursor:pointer;font-weight:600">' + esc(theme.button_text || 'Pay with Everpay') + '</button>' +
      '</div>';
    return wrapper;
  }

  function validateCard(c) {
    if (!c.name || c.name.trim().length < 2) return 'Enter cardholder name';
    if (!c.number || c.number.replace(/\\s+/g,'').length < 12) return 'Enter valid card number';
    if (!/^\\d\\d\\/\\d\\d$/.test(c.exp)) return 'Expiry must be MM/YY';
    if (!/^\\d{3,4}$/.test(c.cvc)) return 'Invalid CVC';
    return null;
  }

  async function run() {
    try {
      var storeHash = getStoreHash();
      if (!storeHash) { log('Could not determine store hash'); return; }

      // Fetch merchant config
      var cfgResp = await fetch(OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_public_key', store_hash: storeHash })
      });
      var cfg = await cfgResp.json();
      if (!cfg.success || !cfg.public_key) { log('No Everpay config found'); return; }

      var theme = cfg.theme || {};

      // Look for payment method containers
      var selectors = [
        '[data-test="payment-methods"]',
        '.checkout-payment-methods',
        '#payment-methods',
        '.payment-options'
      ];

      var pmContainer = null;
      for (var i = 0; i < selectors.length; i++) {
        try { pmContainer = await whenElement(selectors[i], 3000); if (pmContainer) break; } catch(e) {}
      }
      if (!pmContainer) pmContainer = document.body;

      var observer = new MutationObserver(function () {
        var labels = pmContainer.querySelectorAll('label, .method, .payment-method, .radio-label');
        for (var j = 0; j < labels.length; j++) {
          var text = (labels[j].innerText || '').toLowerCase();
          if (text.indexOf('everpay') >= 0 && !labels[j].__everpay_attached) {
            labels[j].__everpay_attached = true;
            var container = document.createElement('div');
            labels[j].parentElement.appendChild(container);
            var cardForm = createCardForm(theme);
            container.appendChild(cardForm);

            var btn = cardForm.querySelector('#everpay-pay-btn');
            btn.addEventListener('click', async function (ev) {
              ev.preventDefault();
              var msg = cardForm.querySelector('#everpay-card-message');
              msg.textContent = '';
              btn.disabled = true;
              btn.textContent = 'Processing...';

              var name = cardForm.querySelector('#everpay-card-name').value;
              var number = cardForm.querySelector('#everpay-card-number').value.replace(/\\s+/g, '');
              var exp = cardForm.querySelector('#everpay-card-exp').value;
              var cvc = cardForm.querySelector('#everpay-card-cvc').value;

              var err = validateCard({ name: name, number: number, exp: exp, cvc: cvc });
              if (err) { msg.textContent = err; btn.disabled = false; btn.textContent = theme.button_text || 'Pay with Everpay'; return; }

              try {
                // Tokenize with Everpay
                var tokResp = await fetch(cfg.base_url + '/v1/tokens', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ card: { number: number, exp: exp, cvc: cvc, name: name }, public_key: cfg.public_key })
                });
                var tok = await tokResp.json();
                if (!tokResp.ok || !tok.id) { msg.textContent = tok.error || 'Tokenization failed'; return; }

                // Get order total
                var amount = null;
                try {
                  var totalEl = document.querySelector('[data-test="order-total"], .order-total, .checkout-total');
                  if (totalEl) amount = parseFloat(totalEl.innerText.replace(/[^0-9.,]/g,'').replace(',','.'));
                } catch(e) {}

                if (!amount || amount <= 0) {
                  msg.textContent = 'Could not determine checkout amount.';
                  return;
                }

                var orderId = getOrderId();
                var checkoutId = getCheckoutId();

                // Process payment
                var payResp = await fetch(CHECKOUT_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    store_hash: storeHash,
                    order_id: orderId,
                    checkout_id: checkoutId,
                    amount: amount,
                    currency: 'USD',
                    payment_token: tok.id
                  })
                });
                var payResult = await payResp.json();
                if (!payResp.ok) { msg.textContent = payResult.error || 'Payment failed'; return; }

                msg.style.color = '#0a0';
                msg.textContent = 'Payment successful!';

                var placeBtn = document.querySelector('button[type="submit"].place-order') ||
                  document.querySelector('button[data-test="checkout-continue-button"]');
                if (placeBtn) placeBtn.click();
                else setTimeout(function() { location.reload(); }, 1200);
              } catch (e) {
                console.error(e);
                msg.textContent = 'Payment error. Please try again.';
              } finally {
                btn.disabled = false;
                btn.textContent = theme.button_text || 'Pay with Everpay';
              }
            });
          }
        }
      });

      observer.observe(pmContainer, { childList: true, subtree: true });
    } catch (err) {
      console.error('Everpay widget failed:', err);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 500);
  } else {
    window.addEventListener('DOMContentLoaded', function () { setTimeout(run, 500); });
  }
})();
`;

  return new Response(checkoutScript, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300',
    },
  });
});
