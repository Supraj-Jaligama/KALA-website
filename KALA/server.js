const http = require('node:http');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map();
let writeQueue = Promise.resolve();

const DEMO_ARTISTS = [
  { name: 'Sample Artist — Mithila Studio', city: 'Mithila, Bihar', artForms: 'Madhubani / Mithila painting', bio: 'Illustrative demo artist profile for trying the KALA artist store. This is not a real person or seller.' },
  { name: 'Sample Artist — Odisha Studio', city: 'Puri, Odisha', artForms: 'Pattachitra', bio: 'Illustrative demo artist profile for trying the KALA artist store. This is not a real person or seller.' },
  { name: 'Sample Artist — Warli Studio', city: 'Maharashtra', artForms: 'Warli painting', bio: 'Illustrative demo artist profile for trying the KALA artist store. This is not a real person or seller.' },
  { name: 'Sample Artist — Tamil Bronze Studio', city: 'Tamil Nadu', artForms: 'Chola bronze sculpture', bio: 'Illustrative demo artist profile for trying the KALA artist store. This is not a real person or seller.' },
  { name: 'Sample Artist — Jaipur Blue Pottery Studio', city: 'Jaipur, Rajasthan', artForms: 'Jaipur blue pottery', bio: 'Illustrative demo craft-store profile. This is not a real person or seller.' },
  { name: 'Sample Artist — Channapatna Toy Studio', city: 'Channapatna, Karnataka', artForms: 'Channapatna lacquered wood toys', bio: 'Illustrative demo craft-store profile. This is not a real person or seller.' },
  { name: 'Sample Artist — Bidri Craft Studio', city: 'Bidar, Karnataka', artForms: 'Bidriware metal craft', bio: 'Illustrative demo craft-store profile. This is not a real person or seller.' },
  { name: 'Sample Artist — Kutch Embroidery Studio', city: 'Kutch, Gujarat', artForms: 'Kutchi embroidery and textiles', bio: 'Illustrative demo craft-store profile. This is not a real person or seller.' },
  { name: 'Sample Artist — Dhokra Metal Craft Studio', city: 'West Bengal, India', artForms: 'Dhokra / Dokra lost-wax metal craft', bio: 'Illustrative demo craft-store profile. This is not a real person or seller.' },
  { name: 'Sample Artist — Kashmir Woodcraft Studio', city: 'Kashmir, India', artForms: 'Kashmiri woodcarving', bio: 'Illustrative demo craft-store profile. This is not a real person or seller.' },
  { name: 'Sample Artist — Assam Bamboo Craft Studio', city: 'Assam, India', artForms: 'Assamese bamboo craft', bio: 'Illustrative demo craft-store profile. This is not a real person or seller.' }
];
const DEMO_LISTINGS = [
  { id: 101, title: 'Mithila Garden Panel', artist: DEMO_ARTISTS[0].name, place: DEMO_ARTISTS[0].city, style: 'Madhubani', category: 'Painting', medium: 'Demo listing · handmade painting', year: 'Sample store item', price: 3500, image: 'assets/madhubani-asha-jha.jpg', description: 'Sample store listing to demonstrate cart and artist contact. The image is a licensed tradition reference, not a photograph of this demo item.', forSale: true, isSample: true },
  { id: 102, title: 'Jagannath in Painted Cloth', artist: DEMO_ARTISTS[1].name, place: DEMO_ARTISTS[1].city, style: 'Pattachitra', category: 'Painting', medium: 'Demo listing · cloth painting', year: 'Sample store item', price: 4200, image: 'assets/pattachitra.jpg', description: 'Sample store listing to demonstrate cart and artist contact. The image is a licensed tradition reference, not a photograph of this demo item.', forSale: true, isSample: true },
  { id: 103, title: 'Village Dance Study', artist: DEMO_ARTISTS[2].name, place: DEMO_ARTISTS[2].city, style: 'Warli', category: 'Painting', medium: 'Demo listing · wall panel', year: 'Sample store item', price: 2800, image: 'assets/warli-jivya-soma-mashe.jpg', description: 'Sample store listing to demonstrate cart and artist contact. The image is a licensed tradition reference, not a photograph of this demo item.', forSale: true, isSample: true },
  { id: 104, title: 'Nataraja Form Study', artist: DEMO_ARTISTS[3].name, place: DEMO_ARTISTS[3].city, style: 'Chola bronze sculpture', category: 'Sculpture', medium: 'Demo listing · sculpture', year: 'Sample store item', price: 6200, image: 'assets/chola-nataraja.jpg', description: 'Sample store listing to demonstrate cart and artist contact. The image is a museum reference, not a photograph of this demo item.', forSale: true, isSample: true },
  { id: 105, title: 'Blue Lotus Vase', artist: DEMO_ARTISTS[4].name, place: DEMO_ARTISTS[4].city, style: 'Jaipur blue pottery', category: 'Handicraft', medium: 'Demo listing · glazed pottery', year: 'Sample store item', price: 2400, image: 'assets/jaipur-blue-pottery.jpg', source: 'https://commons.wikimedia.org/wiki/File:Blue_pottery_from_Jaipur.jpg', credit: 'Atcelsius · CC BY-SA 4.0', description: 'Sample Jaipur blue pottery store listing. Reference photo by Atcelsius, Wikimedia Commons, CC BY-SA 4.0. This is not a photograph of the demo item.', forSale: true, isSample: true },
  { id: 106, title: 'Channapatna Toy Set', artist: DEMO_ARTISTS[5].name, place: DEMO_ARTISTS[5].city, style: 'Channapatna wood craft', category: 'Handicraft', medium: 'Demo listing · lacquered wood toys', year: 'Sample store item', price: 1800, image: 'assets/channapatna-toys.jpg', source: 'https://commons.wikimedia.org/wiki/File:Finished_Channapatna_toys.jpg', credit: 'KartikMistry · CC BY-SA 4.0', description: 'Sample Channapatna toy store listing. Reference photo by KartikMistry, Wikimedia Commons, CC BY-SA 4.0. This is not a photograph of the demo item.', forSale: true, isSample: true },
  { id: 107, title: 'Bidriware Keepsake Vessel', artist: DEMO_ARTISTS[6].name, place: DEMO_ARTISTS[6].city, style: 'Bidriware', category: 'Handicraft', medium: 'Demo listing · inlaid zinc alloy', year: 'Sample store item', price: 3600, image: 'assets/bidriware.jpg', source: 'https://commons.wikimedia.org/wiki/File:Bidriware.jpg', credit: 'Shivapriya Sulgante · CC BY-SA 4.0', description: 'Sample Bidriware store listing. Reference photo by Shivapriya Sulgante, Wikimedia Commons, CC BY-SA 4.0. This is not a photograph of the demo item.', forSale: true, isSample: true },
  { id: 108, title: 'Kutchi Embroidered Textile', artist: DEMO_ARTISTS[7].name, place: DEMO_ARTISTS[7].city, style: 'Kutchi embroidery', category: 'Handicraft', medium: 'Demo listing · embroidered textile', year: 'Sample store item', price: 3200, image: 'assets/kutch-embroidery.jpg', source: 'https://commons.wikimedia.org/wiki/File:Antique_Kutch_Embroidery.jpg', credit: 'Jainamishra · CC BY 3.0', description: 'Sample Kutch embroidery store listing. Reference photo by Jainamishra, Wikimedia Commons, CC BY 3.0. This is not a photograph of the demo item.', forSale: true, isSample: true },
  { id: 109, title: 'Dhokra Durga Figure', artist: DEMO_ARTISTS[8].name, place: DEMO_ARTISTS[8].city, style: 'Dhokra / Dokra metal craft', category: 'Handicraft', medium: 'Demo listing · lost-wax cast metal', year: 'Sample store item', price: 5400, image: 'assets/dhokra-art.jpg', source: 'https://commons.wikimedia.org/wiki/File:Dokra_Art.jpg', credit: 'Duttasubha88 · CC BY-SA 4.0', description: 'Sample Dhokra craft listing. The reference photo depicts a Durga figure made using Dokra craft, photographed by Duttasubha88 and licensed CC BY-SA 4.0. It is not a photo of the sample item.', forSale: true, isSample: true },
  { id: 110, title: 'Kashmiri Carved Wood Keepsake', artist: DEMO_ARTISTS[9].name, place: DEMO_ARTISTS[9].city, style: 'Kashmiri woodcarving', category: 'Handicraft', medium: 'Demo listing · carved wood', year: 'Sample store item', price: 4600, image: 'assets/kashmiri-woodcarving.jpg', source: 'https://commons.wikimedia.org/wiki/File:Kashmiri_Woodcarving_And_Paper_mach%C3%A9.jpg', credit: 'Sheen2024 · CC BY-SA 4.0', description: 'Sample Kashmiri woodcraft listing. The reference photo shows Kashmiri woodcarving by Sheen2024, Wikimedia Commons, CC BY-SA 4.0. It is not a photo of the sample item.', forSale: true, isSample: true },
  { id: 111, title: 'Assam Bamboo Household Craft', artist: DEMO_ARTISTS[10].name, place: DEMO_ARTISTS[10].city, style: 'Assamese bamboo craft', category: 'Handicraft', medium: 'Demo listing · handwoven bamboo', year: 'Sample store item', price: 2200, image: 'assets/assam-bamboo-craft.jpg', source: 'https://commons.wikimedia.org/wiki/File:Bamboo_articrafts_from_Assam.jpg', credit: 'Medhi jyoti · CC BY 4.0', description: 'Sample Assamese bamboo craft listing. The reference photo by Medhi jyoti depicts bamboo articles from Assam used for fishing and household work; CC BY 4.0. It is not a photo of the sample item.', forSale: true, isSample: true }
];

const emptyStore = () => ({ users: [], carts: {}, favorites: {}, messages: [], artistProfiles: {}, listings: [] });

async function readStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { return { ...emptyStore(), ...JSON.parse(await fs.readFile(DB_FILE, 'utf8')) }; }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initial = emptyStore();
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

function saveStore(store) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tempFile = `${DB_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8');
    await fs.rename(tempFile, DB_FILE);
  });
  return writeQueue;
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(payload));
}

function getCookie(req, key) {
  const cookie = req.headers.cookie || '';
  const entry = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.slice(key.length + 1)) : '';
}

async function readBody(req, maxBytes = 16_384) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Send a valid JSON request body.'), { status: 400 }); }
}

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function authenticated(req, store, role) {
  const token = getCookie(req, 'kala_session');
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    throw Object.assign(new Error('Please sign in to continue.'), { status: 401 });
  }
  const user = store.users.find(item => item.id === session.userId);
  if (!user) throw Object.assign(new Error('Please sign in to continue.'), { status: 401 });
  if (role && user.role !== role) throw Object.assign(new Error('This action is for artist accounts.'), { status: 403 });
  return user;
}

function normalizeName(name) { return String(name || '').trim().toLocaleLowerCase('en'); }
function artistDisplayName(user, store) { return store.artistProfiles[user.id]?.name || user.name; }
function messageReplies(message) {
  if (Array.isArray(message.replies)) return message.replies;
  return message.reply ? [{ fromRole: 'artist', body: message.reply, createdAt: message.repliedAt || message.createdAt }] : [];
}

function publicArtistProfiles(store) {
  const live = store.users.filter(user => user.role === 'artist').map(user => {
    const profile = store.artistProfiles[user.id] || {};
    return { id: user.id, name: profile.name || user.name, city: profile.city || 'India', artForms: profile.artForms || 'Indian art', bio: profile.bio || 'Artist profile on KALA.', isSample: false };
  });
  const liveNames = new Set(live.map(profile => normalizeName(profile.name)));
  const demos = DEMO_ARTISTS.filter(profile => !liveNames.has(normalizeName(profile.name))).map(profile => ({ ...profile, id: `demo-${normalizeName(profile.name).replace(/[^a-z0-9]+/g, '-')}`, isSample: true }));
  return [...demos, ...live];
}

function publicListings(store) {
  const live = store.listings.map(item => {
    const owner = store.users.find(user => user.id === item.artistId);
    const profile = owner && store.artistProfiles[owner.id] || {};
    const images = Array.isArray(item.images) && item.images.length ? item.images : [item.image];
    return { ...item, image: item.image || images[0], images, artist: profile.name || owner?.name || item.artist, place: profile.city || item.place, isSample: false };
  });
  const demos = DEMO_LISTINGS.map(item => ({ ...item, images: item.images?.length ? item.images : [item.image] }));
  return [...demos, ...live];
}

async function api(req, res, url) {
  const route = url.pathname.replace(/\/$/, '') || '/';
  const store = await readStore();

  if (req.method === 'GET' && route === '/api/health') return sendJson(res, 200, { ok: true, service: 'KALA API' });

  if (req.method === 'POST' && route === '/api/auth/register') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = body.role;
    if (!name || name.length > 80) return sendJson(res, 400, { error: 'Enter a name up to 80 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return sendJson(res, 400, { error: 'Enter a valid email address.' });
    if (password.length < 10 || password.length > 200) return sendJson(res, 400, { error: 'Use a password between 10 and 200 characters.' });
    if (!['user', 'artist'].includes(role)) return sendJson(res, 400, { error: 'Choose a user or artist account.' });
    if (store.users.some(user => user.email === email)) return sendJson(res, 409, { error: 'An account already uses that email. Sign in instead.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
    const user = { id: crypto.randomUUID(), name, email, salt, passwordHash, role, createdAt: new Date().toISOString() };
    store.users.push(user);
    store.carts[user.id] = [];
    store.favorites[user.id] = [];
    if (role === 'artist') {
      store.artistProfiles[user.id] = { name, city: 'India', artForms: '', bio: '' };
      for (const message of store.messages) {
        if (!message.artistUserId && normalizeName(message.artistName) === normalizeName(name)) message.artistUserId = user.id;
      }
    }
    await saveStore(store);
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL });
    return sendJson(res, 201, { user: safeUser(user) }, { 'Set-Cookie': `kala_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}` });
  }

  if (req.method === 'POST' && route === '/api/auth/login') {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const role = body.role;
    const user = store.users.find(item => item.email === email);
    if (user && user.role !== role) return sendJson(res, 400, { error: `This email is registered as an ${user.role === 'artist' ? 'artist' : 'art lover'} account. Choose ${user.role === 'artist' ? 'Artist' : 'Art lover'} as the account type.` });
    if (!user || !body.password) return sendJson(res, 401, { error: 'Email or password is incorrect.' });
    const candidate = await scrypt(String(body.password), user.salt, 64);
    const known = Buffer.from(user.passwordHash, 'hex');
    if (known.length !== candidate.length || !crypto.timingSafeEqual(known, candidate)) return sendJson(res, 401, { error: 'Email or password is incorrect.' });
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL });
    return sendJson(res, 200, { user: safeUser(user) }, { 'Set-Cookie': `kala_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}` });
  }

  if (req.method === 'POST' && route === '/api/auth/logout') {
    const token = getCookie(req, 'kala_session');
    if (token) sessions.delete(token);
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'kala_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }

  if (req.method === 'GET' && route === '/api/me') {
    const user = await authenticated(req, store);
    return sendJson(res, 200, { user: safeUser(user) });
  }

  if (req.method === 'GET' && route === '/api/artists') return sendJson(res, 200, { artists: publicArtistProfiles(store) });
  if (req.method === 'GET' && route === '/api/artworks') return sendJson(res, 200, { listings: publicListings(store) });

  if (route === '/api/artist/profile' && req.method === 'GET') {
    const user = await authenticated(req, store, 'artist');
    return sendJson(res, 200, { profile: store.artistProfiles[user.id] || { name: user.name, city: 'India', artForms: '', bio: '' } });
  }
  if (route === '/api/artist/profile' && req.method === 'PUT') {
    const user = await authenticated(req, store, 'artist');
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const city = String(body.city || '').trim();
    const artForms = String(body.artForms || '').trim();
    const bio = String(body.bio || '').trim();
    if (!name || name.length > 80) return sendJson(res, 400, { error: 'Enter a store or artist name up to 80 characters.' });
    if (city.length > 100 || artForms.length > 160 || bio.length > 1000) return sendJson(res, 400, { error: 'Keep location, art forms, and bio within the displayed limits.' });
    store.artistProfiles[user.id] = { name, city: city || 'India', artForms, bio, updatedAt: new Date().toISOString() };
    user.name = name;
    for (const message of store.messages) {
      if (!message.artistUserId && normalizeName(message.artistName) === normalizeName(name)) message.artistUserId = user.id;
    }
    await saveStore(store);
    return sendJson(res, 200, { profile: store.artistProfiles[user.id], user: safeUser(user) });
  }

  if (route === '/api/artist/images' && req.method === 'POST') {
    const user = await authenticated(req, store, 'artist');
    const body = await readBody(req, 6 * 1024 * 1024);
    const match = /^data:image\/(jpeg|png|webp);base64,([a-z0-9+/]+=*)$/i.exec(String(body.dataUrl || ''));
    if (!match) return sendJson(res, 400, { error: 'Choose a JPEG, PNG, or WebP image.' });
    const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const imageBytes = Buffer.from(match[2], 'base64');
    if (!imageBytes.length || imageBytes.length > 4 * 1024 * 1024) return sendJson(res, 413, { error: 'Keep each artwork image under 4 MB.' });
    const validSignature = extension === 'jpg'
      ? imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff
      : extension === 'png'
        ? imageBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : imageBytes.subarray(0, 4).toString() === 'RIFF' && imageBytes.subarray(8, 12).toString() === 'WEBP';
    if (!validSignature) return sendJson(res, 400, { error: 'The selected file does not match its image type.' });
    const uploadDirectory = path.join(ROOT, 'assets', 'uploads');
    await fs.mkdir(uploadDirectory, { recursive: true });
    const filename = `artist-${user.id}-${crypto.randomUUID()}.${extension}`;
    await fs.writeFile(path.join(uploadDirectory, filename), imageBytes, { flag: 'wx' });
    return sendJson(res, 201, { image: `assets/uploads/${filename}` });
  }

  if (route === '/api/artist/listings' && req.method === 'GET') {
    const user = await authenticated(req, store, 'artist');
    const listings = store.listings.filter(item => item.artistId === user.id).map(item => ({ ...item, images: Array.isArray(item.images) && item.images.length ? item.images : [item.image] }));
    return sendJson(res, 200, { listings });
  }
  if (route === '/api/artist/listings' && req.method === 'POST') {
    const user = await authenticated(req, store, 'artist');
    const body = await readBody(req);
    const title = String(body.title || '').trim();
    const category = ['Painting', 'Sculpture', 'Handicraft'].includes(body.category) ? body.category : 'Painting';
    const style = String(body.style || '').trim();
    const medium = String(body.medium || '').trim();
    const description = String(body.description || '').trim();
    const price = Number(body.price);
    const images = Array.isArray(body.images) ? body.images.map(image => String(image || '').trim()) : body.image ? [String(body.image).trim()] : [];
    if (!title || title.length > 120 || !style || style.length > 100 || !medium || medium.length > 100 || !description || description.length > 1500) return sendJson(res, 400, { error: 'Complete the title, Indian art form, medium, and description fields.' });
    if (!Number.isFinite(price) || price < 1 || price > 10000000) return sendJson(res, 400, { error: 'Set a sample price between ₹1 and ₹1,00,00,000.' });
    if (images.length < 1 || images.length > 6 || images.some(image => !/^assets\/(?:uploads\/)?[a-z0-9._-]+\.(?:jpg|jpeg|png|svg|webp)$/i.test(image))) return sendJson(res, 400, { error: 'Add between 1 and 6 valid artwork photos from the KALA assets folder.' });
    const image = images[0];
    const product = { id: Math.max(Date.now(), ...store.listings.map(item => Number(item.id) + 1 || 0)), artistId: user.id, title, artist: artistDisplayName(user, store), place: store.artistProfiles[user.id]?.city || 'India', style, category, medium, description, price, image, images, year: 'Artist listing', forSale: true, isSample: false, createdAt: new Date().toISOString() };
    store.listings.push(product);
    await saveStore(store);
    return sendJson(res, 201, { listing: product });
  }
  const listingRemove = route.match(/^\/api\/artist\/listings\/(\d+)$/);
  if (req.method === 'DELETE' && listingRemove) {
    const user = await authenticated(req, store, 'artist');
    const productId = Number(listingRemove[1]);
    const index = store.listings.findIndex(item => item.id === productId && item.artistId === user.id);
    if (index < 0) return sendJson(res, 404, { error: 'Your artwork listing was not found.' });
    store.listings.splice(index, 1);
    for (const ownerId of Object.keys(store.carts)) store.carts[ownerId] = store.carts[ownerId].filter(id => id !== productId);
    for (const ownerId of Object.keys(store.favorites)) store.favorites[ownerId] = store.favorites[ownerId].filter(id => id !== productId);
    await saveStore(store);
    return sendJson(res, 200, { ok: true });
  }

  if (route === '/api/cart' && req.method === 'GET') {
    const user = await authenticated(req, store);
    return sendJson(res, 200, { artworkIds: store.carts[user.id] || [] });
  }
  if (route === '/api/cart' && req.method === 'POST') {
    const user = await authenticated(req, store);
    const { artworkId } = await readBody(req);
    const id = Number(artworkId);
    if (!Number.isInteger(id) || id < 1) return sendJson(res, 400, { error: 'Choose a valid artwork.' });
    const cart = store.carts[user.id] || (store.carts[user.id] = []);
    if (!cart.includes(id)) cart.push(id);
    await saveStore(store);
    return sendJson(res, 200, { artworkIds: cart });
  }
  const cartRemove = route.match(/^\/api\/cart\/(\d+)$/);
  if (req.method === 'DELETE' && cartRemove) {
    const user = await authenticated(req, store);
    store.carts[user.id] = (store.carts[user.id] || []).filter(id => id !== Number(cartRemove[1]));
    await saveStore(store);
    return sendJson(res, 200, { artworkIds: store.carts[user.id] });
  }

  if (route === '/api/favorites' && req.method === 'GET') {
    const user = await authenticated(req, store);
    return sendJson(res, 200, { artworkIds: store.favorites[user.id] || [] });
  }
  const favorite = route.match(/^\/api\/favorites\/(\d+)$/);
  if (favorite && req.method === 'PUT') {
    const user = await authenticated(req, store);
    const id = Number(favorite[1]);
    const favorites = store.favorites[user.id] || (store.favorites[user.id] = []);
    if (!favorites.includes(id)) favorites.push(id);
    await saveStore(store);
    return sendJson(res, 200, { artworkIds: favorites });
  }
  if (favorite && req.method === 'DELETE') {
    const user = await authenticated(req, store);
    store.favorites[user.id] = (store.favorites[user.id] || []).filter(id => id !== Number(favorite[1]));
    await saveStore(store);
    return sendJson(res, 200, { artworkIds: store.favorites[user.id] });
  }

  if (route === '/api/messages' && req.method === 'GET') {
    const user = await authenticated(req, store, 'user');
    const items = store.messages.filter(message => message.fromUserId === user.id).map(message => ({ id: message.id, fromName: message.fromName, artistName: message.artistName, artworkTitle: message.artworkTitle, body: message.body, createdAt: message.createdAt, reply: message.reply, repliedAt: message.repliedAt, replies: messageReplies(message) }));
    return sendJson(res, 200, { messages: items });
  }
  const userReplyRoute = route.match(/^\/api\/messages\/([a-f0-9-]+)\/reply$/i);
  if (userReplyRoute && req.method === 'POST') {
    const user = await authenticated(req, store, 'user');
    const { reply } = await readBody(req);
    const text = String(reply || '').trim();
    if (!text || text.length > 3000) return sendJson(res, 400, { error: 'Enter a reply of up to 3,000 characters.' });
    const message = store.messages.find(item => item.id === userReplyRoute[1] && item.fromUserId === user.id);
    if (!message) return sendJson(res, 404, { error: 'Conversation not found.' });
    message.replies = [...messageReplies(message), { fromRole: 'user', fromName: user.name, body: text, createdAt: new Date().toISOString() }];
    await saveStore(store);
    return sendJson(res, 200, { replies: message.replies });
  }
  if (route === '/api/messages' && req.method === 'POST') {
    const user = await authenticated(req, store);
    if (user.role !== 'user') return sendJson(res, 403, { error: 'Artist accounts cannot send artist inquiries.' });
    const body = await readBody(req);
    const artistName = String(body.artistName || '').trim().slice(0, 100);
    const messageText = String(body.message || '').trim();
    const artworkId = Number(body.artworkId);
    const artworkTitle = String(body.artworkTitle || '').trim().slice(0, 180);
    if (!artistName || !messageText || messageText.length > 3000) return sendJson(res, 400, { error: 'Add an artist name and a message of up to 3,000 characters.' });
    const artistUser = store.users.find(item => item.role === 'artist' && normalizeName(artistDisplayName(item, store)) === normalizeName(artistName));
    const message = { id: crypto.randomUUID(), fromUserId: user.id, fromName: user.name, artistName, artistUserId: artistUser?.id || null, artworkId: Number.isInteger(artworkId) ? artworkId : null, artworkTitle, body: messageText, createdAt: new Date().toISOString(), reply: null, repliedAt: null, replies: [] };
    store.messages.push(message);
    await saveStore(store);
    return sendJson(res, 201, { message: { id: message.id, artistName: message.artistName, artworkTitle: message.artworkTitle, createdAt: message.createdAt, routed: Boolean(artistUser) } });
  }

  if (route === '/api/artist/messages' && req.method === 'GET') {
    const user = await authenticated(req, store, 'artist');
    const artistName = artistDisplayName(user, store);
    const items = store.messages.filter(message => message.artistUserId === user.id || (!message.artistUserId && normalizeName(message.artistName) === normalizeName(artistName))).map(message => ({ ...message, replies: messageReplies(message) }));
    return sendJson(res, 200, { messages: items });
  }
  const replyRoute = route.match(/^\/api\/artist\/messages\/([a-f0-9-]+)\/reply$/i);
  if (replyRoute && req.method === 'POST') {
    const user = await authenticated(req, store, 'artist');
    const { reply } = await readBody(req);
    const text = String(reply || '').trim();
    if (!text || text.length > 3000) return sendJson(res, 400, { error: 'Enter a reply of up to 3,000 characters.' });
    const artistName = artistDisplayName(user, store);
    const message = store.messages.find(item => item.id === replyRoute[1] && (item.artistUserId === user.id || (!item.artistUserId && normalizeName(item.artistName) === normalizeName(artistName))));
    if (!message) return sendJson(res, 404, { error: 'Message not found.' });
    message.replies = [...messageReplies(message), { fromRole: 'artist', fromName: artistName, body: text, createdAt: new Date().toISOString() }];
    message.reply = text;
    message.repliedAt = new Date().toISOString();
    await saveStore(store);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { error: 'API endpoint not found.' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

async function staticFile(req, res, url) {
  let requested;
  try { requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); }
  catch { return sendJson(res, 400, { error: 'Invalid URL path.' }); }
  const fullPath = path.resolve(ROOT, `.${requested}`);
  if (fullPath !== ROOT && !fullPath.startsWith(`${ROOT}${path.sep}`)) return sendJson(res, 403, { error: 'Forbidden.' });
  if (fullPath === DATA_DIR || fullPath.startsWith(`${DATA_DIR}${path.sep}`) || requested.split('/').some(segment => segment.startsWith('.'))) return sendJson(res, 403, { error: 'Forbidden.' });
  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) return sendJson(res, 404, { error: 'Not found.' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fullPath).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    fsSync.createReadStream(fullPath).pipe(res);
  } catch { sendJson(res, 404, { error: 'Not found.' }); }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (!['GET', 'HEAD'].includes(req.method)) return sendJson(res, 405, { error: 'Method not allowed.' });
    return await staticFile(req, res, url);
  } catch (error) {
    if (res.headersSent) return res.destroy();
    return sendJson(res, error.status || 500, { error: error.status ? error.message : 'The server could not complete the request.' });
  }
}).listen(PORT, HOST, () => console.log(`KALA is running on ${HOST}:${PORT}`));
