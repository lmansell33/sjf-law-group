const crypto = require('crypto');

const PIXEL_ID = '765142088381799';
const GRAPH_VERSION = 'v21.0';

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const normText = (v) => String(v || '').trim().toLowerCase();
const normEmail = (v) => normText(v);
const normName = (v) => normText(v).replace(/[^a-zÀ-ſ]/g, '');
const normPhone = (v) => {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 10) d = '1' + d; // assume US/Canada
  return d;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const body = req.body || {};
  const { first_name, last_name, phone, email, event_id, fbp, fbc, event_source_url } = body;

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    (req.socket && req.socket.remoteAddress) || undefined;
  const ua = req.headers['user-agent'] || undefined;

  const user_data = {
    client_ip_address: ip,
    client_user_agent: ua,
  };
  if (email) user_data.em = [sha256(normEmail(email))];
  if (phone) user_data.ph = [sha256(normPhone(phone))];
  if (first_name) user_data.fn = [sha256(normName(first_name))];
  if (last_name) user_data.ln = [sha256(normName(last_name))];
  if (fbp) user_data.fbp = fbp;
  if (fbc) user_data.fbc = fbc;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: event_id || crypto.randomUUID(),
      event_source_url: event_source_url,
      action_source: 'website',
      user_data,
    }],
  };
  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await r.json();
    res.status(r.ok ? 200 : 502).json(json);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
};
