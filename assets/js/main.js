/* ===== CONFIG ===== */
const LAWMATICS_FORM_URL = 'https://api.lawmatics.com/v1/forms/321b05ef-a688-4d70-9526-60372f6ec402/submit';

/* Single source of truth for the firm phone number.
   Update these two values to change the number everywhere on the page.
   - display: what visitors see, e.g. (954) 289-5355
   - tel:     dialer link, digits only with country code, e.g. +19542895355 */
const PHONE = {
  display: '(954) 289-5355',
  tel: '+19542895355',
};

/* Sync every phone link/label from the PHONE config.
   HTML carries the same values as a no-JS fallback; this keeps them in sync. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-phone-link]').forEach(a => {
    a.setAttribute('href', 'tel:' + PHONE.tel);
  });
  document.querySelectorAll('[data-phone-text]').forEach(el => {
    el.textContent = PHONE.display;
  });
});

/* ===== FORM HANDLER ===== */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('consult-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn    = form.querySelector('.btn-submit');
    const errBox = form.querySelector('.form-error');

    const payload = {
      first_name: form.first_name.value.trim(),
      last_name:  form.last_name.value.trim(),
      phone:      form.phone.value.trim(),
      email:      form.email.value.trim(),
      role:       form.role.value,
    };

    /* Basic validation */
    if (!payload.first_name || !payload.last_name || !payload.phone || !payload.email) {
      showError(errBox, 'Please fill in all required fields.');
      return;
    }
    if (!isValidEmail(payload.email)) {
      showError(errBox, 'Please enter a valid email address.');
      return;
    }
    if (!isValidPhone(payload.phone)) {
      showError(errBox, 'Please enter a valid phone number.');
      return;
    }
    if (!payload.role) {
      showError(errBox, 'Please select your current role.');
      return;
    }
    if (!form.consent.checked) {
      showError(errBox, 'Please agree to the terms to continue.');
      return;
    }

    hideError(errBox);
    setLoading(btn, true);

    /* Shared event ID so the browser Pixel and server-side CAPI events dedupe */
    const eventId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2);

    /* Browser-side Meta Pixel Lead event (with advanced matching) */
    if (window.fbq) {
      fbq('init', '765142088381799', {
        em: payload.email,
        ph: payload.phone,
        fn: payload.first_name,
        ln: payload.last_name,
      });
      fbq('track', 'Lead', {}, { eventID: eventId });
    }

    /* Server-side Conversions API event (fire-and-forget, survives redirect) */
    try {
      fetch('/api/fb-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          ...payload,
          event_id: eventId,
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
          event_source_url: window.location.href,
        }),
      });
    } catch (err) {
      console.error('CAPI error:', err);
    }

    try {
      await fetch(LAWMATICS_FORM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload).toString(),
      });
      window.location.href = 'thank-you.html';
    } catch (err) {
      console.error('Submission error:', err);
      /* Still redirect on network errors so the user isn't blocked */
      window.location.href = 'thank-you.html';
    }
  });

  /* Remove placeholder styling once a real option is selected */
  const roleSelect = form.querySelector('#role');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      roleSelect.classList.toggle('placeholder-selected', !roleSelect.value);
    });
  }
});

/* ===== FAQ ACCORDION ===== */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-card');
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-card.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
});

/* ===== HELPERS ===== */
function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('visible');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideError(el) { el.classList.remove('visible'); }

function setLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Submitting…';
  } else {
    btn.disabled = false;
    btn.innerHTML = 'Request My Consultation &rarr;';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[\d\s\-().+]{7,}$/.test(phone);
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}
