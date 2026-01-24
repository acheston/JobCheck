/**
 * Quick script to check which database you're connected to
 * Run: node check-db-connection.js
 */

import dotenv from 'dotenv';
import { queryOne } from '../db/client.js';

dotenv.config({ path: '.env' });

async function checkConnection() {
  try {
    console.log('🔍 Checking database connection...\n');
    
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in environment');
      console.log('   Make sure you have a .env file in the server directory');
      process.exit(1);
    }

    // Extract database name from connection string for display
    const dbMatch = DATABASE_URL.match(/\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
    const dbName = dbMatch ? dbMatch[4] : 'unknown';
    const dbHost = dbMatch ? dbMatch[3] : 'unknown';
    
    console.log(`📊 Database Info:`);
    console.log(`   Host: ${dbHost}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Connection String: ${DATABASE_URL.substring(0, 50)}...\n`);

    // Test connection
    const result = await queryOne('SELECT current_database() as db_name, version() as version');
    
    if (result) {
      console.log('✅ Successfully connected to database!');
      console.log(`   Database Name: ${result.db_name}`);
      console.log(`   PostgreSQL Version: ${result.version.split(' ')[0]} ${result.version.split(' ')[1]}\n`);
      
      // Check if people table exists
      const tableCheck = await queryOne(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'people'
        ) as table_exists
      `);
      
      if (tableCheck?.table_exists) {
        console.log('✅ People table exists');
        
        // Count records
        const count = await queryOne('SELECT COUNT(*) as count FROM people');
        console.log(`   Records in people table: ${count?.count || 0}`);
      } else {
        console.log('⚠️  People table does not exist');
        console.log('   Run: node ../db/init.js to create the schema');
      }
    }
    
    console.log('\n💡 Tip: To use a different database, update DATABASE_URL in server/.env');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check that DATABASE_URL is correct in server/.env');
    console.error('  2. Verify the database exists in Neon dashboard');
    console.error('  3. Check your internet connection');
    process.exit(1);
  }
}

checkConnection();
