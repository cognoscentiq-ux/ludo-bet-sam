import { createClient } from '@supabase/supabase-js';

// REQUIRED ENV VARS BEFORE RUNNING:
//   SUPABASE_SERVICE_KEY (service role key - DO NOT expose publicly)
//   SUPABASE_URL (https://mzdclssjndpdhckmknve.supabase.co)
// Run: node scripts/seedUsers.js

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mzdclssjndpdhckmknve.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY env var (service role key). Aborting.');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

// Dummy accounts to create (passwords intentionally simple for dev ONLY)
const dummyAccounts = [
  { email: 'admin@amicus.pro', password: 'AdminPass123!', full_name: 'Admin', role: 'admin' },
  { email: 'alice@example.com', password: 'Password123!', full_name: 'Alice Karanja', role: 'user' },
  { email: 'bob@example.com', password: 'Password123!', full_name: 'Bob Otieno', role: 'user' },
  { email: 'chris@example.com', password: 'Password123!', full_name: 'Chris Mwangi', role: 'user' },
  { email: 'diana@example.com', password: 'Password123!', full_name: 'Diana Wambui', role: 'user' }
];

async function ensureProfile(userId, full_name, role) {
  const { error } = await adminClient.from('profiles').upsert({ id: userId, full_name, role });
  if (error) console.error(`Profile upsert error for ${userId}:`, error.message);
}

async function seed() {
  console.log('Seeding dummy accounts...');
  for (const acct of dummyAccounts) {
    try {
      // Check if user exists
      const existing = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
      const found = existing.users.find(u => u.email === acct.email);
      if (found) {
        console.log(`User already exists: ${acct.email}`);
        await ensureProfile(found.id, acct.full_name, acct.role);
        continue;
      }
      const { data, error } = await adminClient.auth.admin.createUser({
        email: acct.email,
        password: acct.password,
        email_confirm: true,
        user_metadata: { full_name: acct.full_name }
      });
      if (error) {
        console.error(`Create user failed for ${acct.email}:`, error.message);
        continue;
      }
      console.log(`Created user: ${acct.email}`);
      if (data.user) await ensureProfile(data.user.id, acct.full_name, acct.role);
    } catch (e) {
      console.error(`Unexpected error for ${acct.email}:`, e.message || e);
    }
  }
  console.log('Seeding complete.');
}

seed();
