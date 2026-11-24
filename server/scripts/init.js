import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';
try {await pool.query(await readFile(new URL('../sql/schema.sql',import.meta.url),'utf8')); console.log('Database tables ready.');}
catch(err){console.error(err);process.exitCode=1;}
finally{await pool.end();}
