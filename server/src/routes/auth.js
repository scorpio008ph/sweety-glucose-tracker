import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const issueToken = id => jwt.sign({}, process.env.JWT_SECRET, { subject: String(id), expiresIn:'7d', algorithm:'HS256' });
router.post('/register', async (req,res,next) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) return res.status(400).json({error:'Name is required (max 100 characters).'});
    if (typeof email !== 'string' || !emailPattern.test(email) || email.length > 255) return res.status(400).json({error:'Enter a valid email address.'});
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({error:'Password must be 8–72 characters.'});
    const normalized = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [name.trim(),normalized,hash]);
    const user = result.rows[0];
    return res.status(201).json({ user, token: issueToken(user.id) });
  } catch (err) { if (err.code === '23505') return res.status(409).json({error:'Email already registered.'}); next(err); }
});
router.post('/login', async (req,res,next) => {
  try {
    const {email,password} = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({error:'Email and password are required.'});
    const result = await pool.query('SELECT id,name,email,password_hash FROM users WHERE email=$1',[email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({error:'Incorrect email or password.'});
    return res.json({user:{id:user.id,name:user.name,email:user.email},token:issueToken(user.id)});
  } catch(err) { next(err); }
});
export default router;
