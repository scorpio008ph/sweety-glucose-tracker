import { Router } from 'express';
import { pool } from '../db.js';
import { validateReading, isValidDate, localToday } from '../utils/validation.js';
const router = Router();
const fields = `id, reading_date::text AS date, slot, value, created_at`;
function dbError(err,res,next) {
  if (err.code === '23505') return res.status(409).json({error:'You already have a reading for this slot on this date.'});
  if (err.code === '23514') return res.status(400).json({error:'Invalid reading value or slot.'});
  next(err);
}
router.get('/', async (req,res,next) => {
  try {
    const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({error:'Page must be positive and limit must be 1–100.'});
    const date = req.query.date;
    if (date && !isValidDate(date)) return res.status(400).json({error:'Invalid date.'});
    const where = date ? 'user_id=$1 AND reading_date=$2' : 'user_id=$1';
    const params = date ? [req.userId,date] : [req.userId];
    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM readings WHERE ${where}`,params);
    const rows = await pool.query(`SELECT ${fields} FROM readings WHERE ${where} ORDER BY reading_date DESC, CASE slot WHEN 'Morning (fasting)' THEN 1 WHEN 'After breakfast' THEN 2 WHEN 'After lunch' THEN 3 ELSE 4 END LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params,limit,(page-1)*limit]);
    res.json({readings:rows.rows,total:count.rows[0].total,page,limit});
  } catch(err){next(err);}
});
router.post('/', async(req,res,next) => {
  const error = validateReading(req.body);
  if (error) return res.status(400).json({error});
  const client = await pool.connect().catch(next);
  if (!client) return;
  try {
    await client.query('BEGIN');
    // Lock the user row to serialize concurrent inserts/updates for this user's day.
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.userId]);
    const exists = await client.query('SELECT slot FROM readings WHERE user_id=$1 AND reading_date=$2',[req.userId,req.body.date]);
    if (exists.rows.some(r => r.slot === req.body.slot)) { await client.query('ROLLBACK'); return res.status(409).json({error:`You already have an ${req.body.slot} reading for this date.`}); }
    if (exists.rowCount >= 4) { await client.query('ROLLBACK'); return res.status(400).json({error:'You can add only 4 readings per day.'}); }
    const result = await client.query(`INSERT INTO readings(user_id,reading_date,slot,value) VALUES($1,$2,$3,$4) RETURNING ${fields}`,[req.userId,req.body.date,req.body.slot,req.body.value]);
    await client.query('COMMIT');
    res.status(201).json({reading:result.rows[0]});
  } catch(err) { await client.query('ROLLBACK'); dbError(err,res,next); } finally { client.release(); }
});
router.put('/:id', async(req,res,next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({error:'Invalid reading ID.'});
  const error = validateReading(req.body);
  if (error) return res.status(400).json({error});
  const client = await pool.connect().catch(next);
  if (!client) return;
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.userId]);
    const current = await client.query('SELECT id FROM readings WHERE id=$1 AND user_id=$2',[req.params.id,req.userId]);
    if (!current.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({error:'Reading not found.'}); }
    const existing = await client.query('SELECT id,slot FROM readings WHERE user_id=$1 AND reading_date=$2 AND id<>$3',[req.userId,req.body.date,req.params.id]);
    if (existing.rows.some(r => r.slot === req.body.slot)) { await client.query('ROLLBACK'); return res.status(409).json({error:`You already have an ${req.body.slot} reading for this date.`}); }
    if (existing.rowCount >= 4) { await client.query('ROLLBACK'); return res.status(400).json({error:'You can add only 4 readings per day.'}); }
    const result = await client.query(`UPDATE readings SET reading_date=$1,slot=$2,value=$3,updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING ${fields}`,[req.body.date,req.body.slot,req.body.value,req.params.id,req.userId]);
    await client.query('COMMIT');
    res.json({reading:result.rows[0]});
  } catch(err){await client.query('ROLLBACK');dbError(err,res,next);} finally {client.release();}
});
router.delete('/:id',async(req,res,next)=>{
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({error:'Invalid reading ID.'});
    const result = await pool.query('DELETE FROM readings WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,req.userId]);
    if (!result.rowCount) return res.status(404).json({error:'Reading not found.'});
    res.status(204).end();
  } catch(err){next(err);}
});
export default router;
