import 'dotenv/config';
import { app } from './app.js';
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Set DATABASE_URL and a JWT_SECRET of at least 32 characters in server/.env');
  process.exit(1);
}
app.listen(Number(process.env.PORT)||4000,()=>console.log(`Sweety API running on http://localhost:${process.env.PORT||4000}`));
