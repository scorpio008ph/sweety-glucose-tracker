import jwt from 'jsonwebtoken';
export function auth(req,res,next) {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1];
  if (!token) return res.status(401).json({ error:'Authentication required.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms:['HS256'] });
    req.userId = payload.sub;
    next();
  } catch { return res.status(401).json({ error:'Invalid or expired session. Please log in.' }); }
}
