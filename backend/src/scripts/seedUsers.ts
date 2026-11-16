/**
 * Seeds demo data.
 *
 *   npm run seed        → the 5 demo login accounts only
 *   npm run seed:demo   → demo accounts + barangays, evacuation centers,
 *                         resources, responders, incidents, reports, alerts
 *
 * Point MONGODB_URI at your cloud database (e.g. MongoDB Atlas) to seed production.
 * Operational data is only inserted into empty collections; it never duplicates.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { seedDemoData, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../services/demoSeed.js';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/drrmo';
  const includeOperationalData = process.argv.includes('--demo');

  await mongoose.connect(uri);
  await seedDemoData({ includeOperationalData });

  console.log('');
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.role.padEnd(18)} ${account.email}`);
  }
  console.log(`\nAll demo accounts use password: ${DEMO_PASSWORD}`);
  if (includeOperationalData) console.log('Operational demo data seeded (only into empty collections).');

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
