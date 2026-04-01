import fs   from 'fs';
import path from 'path';
import pool from './client';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const runMigrations = async () => {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    try {
      await pool.query(sql);
      console.log(`Ran: ${file}`);
    } catch (err) {
      console.error(`Failed: ${file}`, err);
      process.exit(1);
    }
  }

  await pool.end();
  console.log('All migrations complete');
};

runMigrations();
