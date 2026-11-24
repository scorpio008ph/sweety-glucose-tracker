import { Router } from 'express';
import { pool } from '../db.js';
import { reportRange, isValidDate, localToday } from '../utils/validation.js';
const router = Router();
router.get('/:type',async(req,res,next)=>{
  try {
    const date = req.query.date || localToday();
    if (!isValidDate(date)) return res.status(400).json({error:'Please enter a valid date.'});
    if (date > localToday()) return res.status(400).json({error:'Date cannot be in the future.'});
    if (!['daily','mtd','monthly'].includes(req.params.type)) return res.status(400).json({error:'Invalid report type.'});
    const {start,end} = reportRange(req.params.type,date);
    const stats = await pool.query(`SELECT COUNT(*)::int AS count, MAX(value)::int AS highest, MIN(value)::int AS lowest, ROUND(AVG(value)::numeric,1)::float AS average FROM readings WHERE user_id=$1 AND reading_date BETWEEN $2 AND $3`,[req.userId,start,end]);
    let readings = [];
    if(req.params.type === 'daily') {
      const result = await pool.query(`SELECT id,reading_date::text AS date,slot,value FROM readings WHERE user_id=$1 AND reading_date=$2 ORDER BY CASE slot WHEN 'Morning (fasting)' THEN 1 WHEN 'After breakfast' THEN 2 WHEN 'After lunch' THEN 3 ELSE 4 END`,[req.userId,date]);
      readings = result.rows;
    }
    res.json({type:req.params.type,start,end,...stats.rows[0],readings});
  } catch(err){next(err);}
});
export default router;
