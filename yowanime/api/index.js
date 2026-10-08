import app from '../server/index.js';

export default function handler(req, res) {
  // Normalisasi URL agar selalu cocok dengan route Express yang berawalan /api
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
