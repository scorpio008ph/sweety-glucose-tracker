import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../src/db.js';
import { localToday } from '../src/utils/validation.js';
const email='demo@sweety.local', password='Demo12345!';
try {
  const hash = await bcrypt.hash(password,12);
  const user = await pool.query(`INSERT INTO users(name,email,password_hash) VALUES('Demo Patient',$1,$2) ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,[email,hash]);
  const id=user.rows[0].id;
  const slots=['Morning (fasting)','After breakfast','After lunch','After dinner'];
  const today = localToday();
  for(let i=0;i<slots.length;i++) await pool.query(`INSERT INTO readings(user_id,reading_date,slot,value) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,reading_date,slot) DO NOTHING`,[id,today,slots[i],[92,137,122,148][i]]);
  console.log(`Demo login: ${email} / ${password}`);
} catch(err){console.error(err);process.exitCode=1;} finally{await pool.end();}
