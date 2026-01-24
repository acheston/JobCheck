/**
 * Migration script to add email_recipients column to people table
 * Run this once from server directory: node ../db/migrate-add-email-recipients.js
 * Or from project root: cd server && node ../db/migrate-add-email-recipients.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function migrate() {
  try {
    console.log('Running migration: Add email_recipients column...');
    
    // Check if column already exists
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'people' AND column_name = 'email_recipients'
    `);

    if (checkResult.rows && checkResult.rows.length > 0) {
      console.log('✅ Column email_recipients already exists. Migration not needed.');
      return;
    }

    // Add the column
    await query(`
      ALTER TABLE people 
      ADD COLUMN email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[]
    `);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
