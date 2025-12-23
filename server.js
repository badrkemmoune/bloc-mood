const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'subscribers.json');
const TEMP_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
]);

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8');
  }
}

function readSubscribers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to read subscribers file', error);
    return [];
  }
}

function writeSubscribers(list) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!emailPattern.test(email)) return false;

  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && TEMP_EMAIL_DOMAINS.has(domain)) return false;
  return true;
}

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/subscribe', (req, res) => {
  const { email, website } = req.body || {};

  if (website) {
    return res.status(400).json({ success: false, message: 'Bot detected.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const subscribers = readSubscribers();
  const alreadySubscribed = subscribers.some(
    (entry) => entry.email === normalizedEmail,
  );

  if (alreadySubscribed) {
    return res.status(200).json({ success: true, message: 'Already subscribed.' });
  }

  subscribers.push({
    email: normalizedEmail,
    subscribedAt: new Date().toISOString(),
  });

  try {
    writeSubscribers(subscribers);
  } catch (error) {
    console.error('Failed to write subscribers file', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }

  return res.status(200).json({ success: true, message: 'Subscribed.' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`Server running on http://localhost:${PORT}`);
});
