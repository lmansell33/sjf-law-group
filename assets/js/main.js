/* ===== CONFIG ===== */
const LAWMATICS_FORM_URL = 'https://api.lawmatics.com/v1/forms/321b05ef-a688-4d70-9526-60372f6ec402/submit';

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

    hideError(errBox);
    setLoading(btn, true);

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
    btn.innerHTML = 'Schedule My Consultation &rarr;';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[\d\s\-().+]{7,}$/.test(phone);
}
