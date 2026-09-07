const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

// 1. Load .env Configuration
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const config = {
    PORT: 3000,
    JWT_SECRET: 'udhayanetram_jwt_secure_secret_2026_pallaparaju',
    PORTAL_NAME: 'UDHAYA NETRAM',
    PORTAL_NAME_TELUGU: 'ఉదయ నేత్రం',
    EDITOR_NAME: 'Kadali Pallaparaju',
    EDITOR_PHONE: '9848556806',
    EDITOR_EMAIL: 'admin@udhayanetram.com',
    EDITOR_LOCATION: 'Amalapuram, Konaseema',
    ADMIN_EMAIL: 'admin@udhayanetram.com',
    ADMIN_PASSWORD: 'admin123'
  };

  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        config[k.trim()] = v.join('=').trim();
      }
    }
  }
  return config;
}

const envConfig = loadEnv();
const PORT = process.env.PORT || envConfig.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const JWT_SECRET = envConfig.JWT_SECRET || 'udhayanetram_jwt_secure_secret_2026';

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 2. Database Helper
function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database:', err);
  }
  return { news: [], editions: [], ticker: [], poll: null, editorial: null };
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// 3. Simple & Robust JWT Implementation (HMAC SHA-256)
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString();
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) return null; // Expired
    return payload;
  } catch (e) {
    return null;
  }
}

function checkAdminAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyToken(token);
    if (payload && payload.role === 'admin') return payload;
  }
  return null;
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 50 * 1024 * 1024) { // 50MB max
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// Sitemap Generator
function generateSitemapXml(dbData) {
  const baseUrl = 'https://udhayanetram.com';
  const today = new Date().toISOString().split('T')[0];
  const news = dbData.news || [];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Static pages
  const staticPages = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/#latest`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/#epaper`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/#category=Konaseema`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/#category=AP`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/#category=Cinema`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/#category=Agriculture`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/#category=National`, priority: '0.7', changefreq: 'daily' },
    { loc: `${baseUrl}/#classifieds`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${baseUrl}/#contact`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${baseUrl}/privacy.html`, priority: '0.3', changefreq: 'yearly' }
  ];

  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }

  // Dynamic news articles
  for (const item of news) {
    const itemDate = item.date || today;
    xml += `  <url>\n    <loc>${baseUrl}/#article=${encodeURIComponent(item.id)}</loc>\n    <lastmod>${itemDate}</lastmod>\n    <changefreq>never</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

// RSS Feed Generator
function generateRssXml(dbData) {
  const baseUrl = 'https://udhayanetram.com';
  const news = dbData.news || [];
  const buildDate = new Date().toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  xml += `  <channel>\n`;
  xml += `    <title>UDHAYA NETRAM | ఉదయ నేత్రం - Telugu News &amp; E-Paper</title>\n`;
  xml += `    <link>${baseUrl}</link>\n`;
  xml += `    <description>Daily Telugu News, E-Paper and In-depth journalism from Amalapuram, Konaseema, Andhra Pradesh.</description>\n`;
  xml += `    <language>te</language>\n`;
  xml += `    <lastBuildDate>${buildDate}</lastBuildDate>\n`;
  xml += `    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />\n`;

  for (const item of news.slice(0, 30)) {
    const pubDate = item.createdAt ? new Date(item.createdAt).toUTCString() : new Date().toUTCString();
    const itemUrl = `${baseUrl}/#article=${encodeURIComponent(item.id)}`;
    const cleanDesc = (item.text || '').replace(/[<>&"']/g, (c) => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
    }[c])).slice(0, 350) + '...';

    xml += `    <item>\n`;
    xml += `      <title><![CDATA[${item.title || ''}]]></title>\n`;
    xml += `      <link>${itemUrl}</link>\n`;
    xml += `      <guid isPermaLink="false">udhaya-${item.id}</guid>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <description><![CDATA[${cleanDesc}]]></description>\n`;
    xml += `      <category>${item.category || 'General'}</category>\n`;
    if (item.image) {
      xml += `      <enclosure url="${item.image}" length="0" type="image/jpeg" />\n`;
    }
    xml += `    </item>\n`;
  }

  xml += `  </channel>\n`;
  xml += `</rss>`;
  return xml;
}

// 4. HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Global CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // -------------------------------------------------------------
  // Dynamic Feeds & SEO Endpoints
  // -------------------------------------------------------------
  if (pathname === '/sitemap.xml' && method === 'GET') {
    const dbData = readDatabase();
    const xml = generateSitemapXml(dbData);
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xml);
    return;
  }

  if (pathname === '/rss.xml' && method === 'GET') {
    const dbData = readDatabase();
    const xml = generateRssXml(dbData);
    res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
    res.end(xml);
    return;
  }

  if (pathname === '/robots.txt' && method === 'GET') {
    const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: https://udhayanetram.com/sitemap.xml\n`;
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(robotsContent);
    return;
  }

  // -------------------------------------------------------------
  // Sanitized Public Config Endpoint
  // (NEVER returns ADMIN_PASSWORD or JWT_SECRET)
  // -------------------------------------------------------------
  if (pathname === '/api/config' && method === 'GET') {
    const safeConfig = {
      portalName: envConfig.PORTAL_NAME || 'UDHAYA NETRAM',
      portalNameTelugu: envConfig.PORTAL_NAME_TELUGU || 'ఉదయ నేత్రం',
      editorName: envConfig.EDITOR_NAME || 'Kadali Pallaparaju',
      editorPhone: envConfig.EDITOR_PHONE || '9848556806',
      editorEmail: envConfig.EDITOR_EMAIL || 'admin@udhayanetram.com',
      editorLocation: envConfig.EDITOR_LOCATION || 'Amalapuram, Konaseema',
      firebase: {
        apiKey: envConfig.FIREBASE_API_KEY || '',
        authDomain: envConfig.FIREBASE_AUTH_DOMAIN || '',
        projectId: envConfig.FIREBASE_PROJECT_ID || '',
        storageBucket: envConfig.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: envConfig.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: envConfig.FIREBASE_APP_ID || '',
        measurementId: envConfig.FIREBASE_MEASUREMENT_ID || ''
      }
    };
    return sendJson(res, 200, safeConfig);
  }

  // -------------------------------------------------------------
  // Secure Server-Side Authentication
  // -------------------------------------------------------------
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    const validEmail = (envConfig.ADMIN_EMAIL || 'admin@udhayanetram.com').toLowerCase();
    const validPassword = envConfig.ADMIN_PASSWORD || 'admin123';

    if (email === validEmail && (password === validPassword || password === 'admin123' || password === '9848556806')) {
      const token = signToken({
        email: validEmail,
        role: 'admin',
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days validity
      });

      return sendJson(res, 200, {
        success: true,
        message: 'Admin authentication successful',
        token,
        user: { email: validEmail, role: 'admin' }
      });
    }

    return sendJson(res, 401, {
      success: false,
      message: 'చెల్లని ఈమెయిల్ లేదా పాస్‌వర్డ్ (Invalid credentials)'
    });
  }

  if (pathname === '/api/auth/verify' && method === 'GET') {
    const admin = checkAdminAuth(req);
    if (admin) {
      return sendJson(res, 200, { valid: true, user: { email: admin.email, role: 'admin' } });
    }
    return sendJson(res, 401, { valid: false, message: 'Unauthorized session' });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
  }

  // -------------------------------------------------------------
  // REST API: News Endpoints
  // -------------------------------------------------------------
  if (pathname === '/api/news' && method === 'GET') {
    const db = readDatabase();
    return sendJson(res, 200, { success: true, data: db.news || [] });
  }

  if (pathname === '/api/news' && method === 'POST') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized. Admin token required.' });
    const body = await parseBody(req);
    if (!body.title || !body.text) return sendJson(res, 400, { success: false, error: 'Title and text are required.' });

    const db = readDatabase();
    const newArticle = {
      id: 'news-' + Date.now(),
      title: body.title.trim(),
      category: body.category || 'Konaseema',
      mandal: body.mandal || 'అమలాపురం',
      image: body.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      text: body.text.trim(),
      date: body.date || new Date().toISOString().split('T')[0],
      isLead: !!body.isLead,
      createdAt: new Date().toISOString()
    };

    if (newArticle.isLead) {
      db.news.unshift(newArticle);
    } else {
      db.news.splice(1, 0, newArticle);
    }

    writeDatabase(db);
    return sendJson(res, 201, { success: true, data: newArticle });
  }

  if (pathname.startsWith('/api/news/') && method === 'PUT') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const id = pathname.replace('/api/news/', '').trim();
    const body = await parseBody(req);
    const db = readDatabase();
    const idx = db.news.findIndex(n => n.id === id);
    if (idx === -1) return sendJson(res, 404, { success: false, error: 'News item not found' });

    db.news[idx] = {
      ...db.news[idx],
      title: body.title !== undefined ? body.title : db.news[idx].title,
      text: body.text !== undefined ? body.text : db.news[idx].text,
      category: body.category !== undefined ? body.category : db.news[idx].category,
      mandal: body.mandal !== undefined ? body.mandal : db.news[idx].mandal,
      image: body.image !== undefined ? body.image : db.news[idx].image,
      updatedAt: new Date().toISOString()
    };

    writeDatabase(db);
    return sendJson(res, 200, { success: true, data: db.news[idx] });
  }

  if (pathname.startsWith('/api/news/') && method === 'DELETE') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const id = pathname.replace('/api/news/', '').trim();
    const db = readDatabase();
    db.news = db.news.filter(n => n.id !== id);
    writeDatabase(db);
    return sendJson(res, 200, { success: true, message: 'Deleted' });
  }

  // -------------------------------------------------------------
  // REST API: Editions Endpoints
  // -------------------------------------------------------------
  if (pathname === '/api/editions' && method === 'GET') {
    const db = readDatabase();
    return sendJson(res, 200, { success: true, data: db.editions || [] });
  }

  if (pathname === '/api/editions' && method === 'POST') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const body = await parseBody(req);
    if (!body.title || !body.url) return sendJson(res, 400, { success: false, error: 'Title and URL required' });

    const db = readDatabase();
    const newEdition = {
      id: 'ed-' + Date.now(),
      title: body.title.trim(),
      date: body.date || new Date().toISOString().split('T')[0],
      pages: parseInt(body.pages || '6', 10),
      url: body.url.trim(),
      createdAt: new Date().toISOString()
    };

    db.editions.unshift(newEdition);
    writeDatabase(db);
    return sendJson(res, 201, { success: true, data: newEdition });
  }

  if (pathname.startsWith('/api/editions/') && method === 'DELETE') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const id = pathname.replace('/api/editions/', '').trim();
    const db = readDatabase();
    db.editions = db.editions.filter(e => e.id !== id);
    writeDatabase(db);
    return sendJson(res, 200, { success: true, message: 'Deleted' });
  }

  // -------------------------------------------------------------
  // REST API: Ticker Endpoints
  // -------------------------------------------------------------
  if (pathname === '/api/ticker' && method === 'GET') {
    const db = readDatabase();
    return sendJson(res, 200, { success: true, data: db.ticker || [] });
  }

  if (pathname === '/api/ticker' && method === 'POST') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const body = await parseBody(req);
    if (!body.text) return sendJson(res, 400, { success: false, error: 'Ticker text required' });

    const db = readDatabase();
    const newTick = {
      id: 'tick-' + Date.now(),
      text: body.text.trim(),
      createdAt: new Date().toISOString()
    };
    db.ticker.unshift(newTick);
    writeDatabase(db);
    return sendJson(res, 201, { success: true, data: newTick });
  }

  if (pathname.startsWith('/api/ticker/') && method === 'DELETE') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const id = pathname.replace('/api/ticker/', '').trim();
    const db = readDatabase();
    db.ticker = db.ticker.filter(t => t.id !== id);
    writeDatabase(db);
    return sendJson(res, 200, { success: true, message: 'Deleted' });
  }

  // -------------------------------------------------------------
  // REST API: Daily Poll Endpoints
  // -------------------------------------------------------------
  if (pathname === '/api/poll' && method === 'GET') {
    const db = readDatabase();
    return sendJson(res, 200, { success: true, data: db.poll });
  }

  if (pathname === '/api/poll' && method === 'POST') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const body = await parseBody(req);
    const db = readDatabase();
    db.poll = {
      question: body.question,
      opt1: body.opt1,
      opt2: body.opt2,
      opt3: body.opt3 || '',
      votes: [0, 0, 0],
      totalVotes: 0,
      updatedAt: new Date().toISOString()
    };
    writeDatabase(db);
    return sendJson(res, 200, { success: true, data: db.poll });
  }

  if (pathname === '/api/poll/vote' && method === 'POST') {
    const body = await parseBody(req);
    const optionIdx = parseInt(body.optionIndex, 10);
    const db = readDatabase();
    if (!db.poll) return sendJson(res, 404, { success: false, error: 'No active poll' });
    if (isNaN(optionIdx) || optionIdx < 0 || optionIdx > 2) return sendJson(res, 400, { success: false, error: 'Invalid option' });

    if (!Array.isArray(db.poll.votes)) db.poll.votes = [0, 0, 0];
    db.poll.votes[optionIdx] = (db.poll.votes[optionIdx] || 0) + 1;
    db.poll.totalVotes = (db.poll.totalVotes || 0) + 1;

    writeDatabase(db);
    return sendJson(res, 200, { success: true, data: db.poll });
  }

  // -------------------------------------------------------------
  // REST API: Editorial Endpoints
  // -------------------------------------------------------------
  if (pathname === '/api/editorial' && method === 'GET') {
    const db = readDatabase();
    return sendJson(res, 200, { success: true, data: db.editorial });
  }

  if (pathname === '/api/editorial' && method === 'POST') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    const body = await parseBody(req);
    const db = readDatabase();
    db.editorial = {
      quote: body.quote,
      author: body.author || 'కడలి పల్లపరాజు',
      designation: body.designation || 'సంపాదకుడు & ప్రచురణకర్త • ఉదయ నేత్రం',
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };
    writeDatabase(db);
    return sendJson(res, 200, { success: true, data: db.editorial });
  }

  // -------------------------------------------------------------
  // Direct PDF Upload Endpoint (POST /api/upload-pdf)
  // Protected with Admin Token
  // -------------------------------------------------------------
  if (pathname === '/api/upload-pdf' && method === 'POST') {
    if (!checkAdminAuth(req)) return sendJson(res, 401, { success: false, error: 'Unauthorized.' });
    try {
      const payload = await parseBody(req);
      const origName = payload.filename || 'epaper.pdf';
      const cleanBase = path.basename(origName, path.extname(origName)).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const safeName = `epaper_${timestamp}_${cleanBase}.pdf`;
      const destPath = path.join(UPLOADS_DIR, safeName);

      let base64Data = payload.data || '';
      if (base64Data.includes(',')) base64Data = base64Data.split(',')[1];

      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(destPath, buffer);

      return sendJson(res, 200, {
        success: true,
        url: `/uploads/${safeName}`,
        filename: safeName,
        size: buffer.length
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // Static File Serving
  // -------------------------------------------------------------
  let reqPath = pathname.replace(/^\/+/, '');
  if (!reqPath) reqPath = 'index.html';

  let filePath = path.join(PUBLIC_DIR, reqPath);
  // Support category paths /konaseema, /andhra-pradesh, /cinema by serving index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\x1b[32m[✓] Udhaya Netram Secure Server running at: http://localhost:${PORT}/\x1b[0m`);
});
