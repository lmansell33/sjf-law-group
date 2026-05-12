/* ===== CONFIG — paste your GHL webhook URL here ===== */
const GHL_WEBHOOK_URL = 'YOUR_GHL_WEBHOOK_URL_HERE';

/* ===== FORM HANDLER ===== */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('consult-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn    = form.querySelector('.btn-submit');
    const errBox = form.querySelector('.form-error');

    const payload = {
      firstName: form.firstName.value.trim(),
      lastName:  form.lastName.value.trim(),
      phone:     form.phone.value.trim(),
      email:     form.email.value.trim(),
      source:    'SJF Law Group – Trust Advisory Landing Page',
      tags:      ['trust-advisory', 'landing-page-lead'],
    };

    /* Basic validation */
    if (!payload.firstName || !payload.lastName || !payload.phone || !payload.email) {
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

    hideError(errBox);
    setLoading(btn, true);

    try {
      if (!GHL_WEBHOOK_URL || GHL_WEBHOOK_URL === 'YOUR_GHL_WEBHOOK_URL_HERE') {
        /* Dev mode: log payload and redirect anyway */
        console.log('[DEV] GHL payload:', payload);
        await fakeDelay(800);
      } else {
        await fetch(GHL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      window.location.href = 'thank-you.html';
    } catch (err) {
      console.error('Submission error:', err);
      /* Still redirect on network errors so the user isn't blocked */
      window.location.href = 'thank-you.html';
    }
  });
});

/* ===== FAQ ACCORDION ===== */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item.is-open').forEach(el => {
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
    btn.innerHTML = 'Schedule My Consultation &rarr;';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[\d\s\-().+]{7,}$/.test(phone);
}

function fakeDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
