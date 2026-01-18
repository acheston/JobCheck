/**
 * Shared database client for both Express and Vercel serverless
 * Uses connection pooling for better performance
 */

import pkg from 'pg';
const { Pool } = pkg;

let pool = null;

/**
 * Get or create the database connection pool
 * Lazy-loads to ensure environment variables are available
 */
function getPool() {
  if (!pool) {
    // Get connection string from environment
    const DATABASE_URL = process.env.DATABASE_URL || 
                         process.env.POSTGRES_URL || 
                         process.env.POSTGRES_PRISMA_URL;

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL environment variable is required');
    }

    // Create connection pool
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('sslmode=require') 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Don't exit in serverless environments
      if (process.env.VERCEL) {
        console.error('Pool error in Vercel - will attempt to reconnect on next query');
      } else {
        process.exit(-1);
      }
    });
  }
  
  return pool;
}

// Export the pool getter - pool is created on first use
export default getPool;

/**
 * Helper function to run a query
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const pool = getPool();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Helper function to get a single row
 */
export async function queryOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * Helper function to get multiple rows
 */
export async function queryMany(text, params) {
  const result = await query(text, params);
  return result.rows;
}
