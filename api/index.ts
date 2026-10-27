import app from '../server/app.js';

export default async function handler(req: any, res: any) {
  // If Vercel rewrote the URL, recover the real path from x-matched-path or x-forwarded-uri
  const matchedPath =
    req.headers['x-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-invoke-path'];

  if (matchedPath && typeof matchedPath === 'string') {
    const queryIdx = req.url.indexOf('?');
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = matchedPath.includes('?') ? matchedPath : matchedPath + query;
  }

  // Preflight OPTIONS handling
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    return res.status(200).end();
  }

  return app(req, res);
}
