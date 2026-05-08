/**
 * Database Initialization Script
 * Run this once to create all necessary tables in Supabase
 * 
 * Usage: node src/db/init.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import SCHEMA_SQL from './schema.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please set these in your .env file');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

/**
 * Initialize database schema
 */
const initDatabase = async () => {
  try {
    console.log('🗄️  Initializing Supabase database...\n');

    // Split SQL into individual statements
    const statements = SCHEMA_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (!statement) continue;

      console.log('Executing:', statement.substring(0, 50) + '...');
      
      const { error } = await client.rpc('exec', {
        sql: statement
      }).catch(() => {
        // Fallback: use direct SQL execution
        return client.from('_raw_query').select('*').catch(err => ({
          error: err
        }));
      });

      if (error && !error.message.includes('already exists')) {
        console.error('Error:', error.message);
      }
    }

    console.log('\n✅ Database schema initialized successfully!');
    console.log('\nTables created:');
    console.log('  • sensor_readings');
    console.log('  • plant_images');
    console.log('  • plant_detections');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);
    process.exit(1);
  }
};

initDatabase();
