/**
 * Migration script to add email_recipients column to people table
 * Run this from server directory: node migrate-email-recipients.js
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');
    console.log('Running migration: Add email_recipients column...');
    
    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'people' AND column_name = 'email_recipients'
    `);

    if (checkResult.rows && checkResult.rows.length > 0) {
      console.log('✅ Column email_recipients already exists. Migration not needed.');
      return;
    }

    // Add the column
    await client.query(`
      ALTER TABLE people 
      ADD COLUMN email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[]
    `);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
