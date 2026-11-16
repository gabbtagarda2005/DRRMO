import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Barangay } from '../models/Barangay.js';
import { EvacuationCenter } from '../models/EvacuationCenter.js';
import { Resource } from '../models/Resource.js';
import { Responder } from '../models/Responder.js';
import { Incident } from '../models/Incident.js';
import { Report } from '../models/Report.js';
import { Notification } from '../models/Notification.js';
import { ROLES } from '../constants/roles.js';
import { calculateIncidentPriority } from './priorityEngine.js';
import { logger } from '../utils/logger.js';

export const DEMO_PASSWORD = 'DRRMO123';

/** Core login accounts listed in DEMO_ACCOUNTS.txt — always upserted. */
export const DEMO_ACCOUNTS = [
  { email: 'admin@drmmo.gov.ph', firstName: 'System', lastName: 'Administrator', role: ROLES.ADMIN, phone: '+63-912-345-6789' },
  { email: 'officer1@drmmo.gov.ph', firstName: 'Juan', lastName: 'Dela Cruz', role: ROLES.DRRMO_OFFICER, phone: '+63-912-345-6790' },
  { email: 'responder1@drmmo.gov.ph', firstName: 'Maria', lastName: 'Santos', role: ROLES.RESPONDER, phone: '+63-912-345-6791' },
  { email: 'barangay1@drmmo.gov.ph', firstName: 'Pedro', lastName: 'Garcia', role: ROLES.BARANGAY_OFFICIAL, barangay: 'Barangay Centro', phone: '+63-912-345-6792' },
  { email: 'citizen1@email.com', firstName: 'Ana', lastName: 'Reyes', role: ROLES.CITIZEN, barangay: 'Barangay Centro', phone: '+63-912-345-6793' },
];

/** Extra accounts so rosters, responder boards and audiences aren't empty. */
const SUPPORTING_ACCOUNTS = [
  { email: 'responder2@drmmo.gov.ph', firstName: 'Carlo', lastName: 'Mendoza', role: ROLES.RESPONDER, phone: '+63-917-100-2001' },
  { email: 'responder3@drmmo.gov.ph', firstName: 'Liza', lastName: 'Villanueva', role: ROLES.RESPONDER, phone: '+63-917-100-2002' },
  { email: 'responder4@drmmo.gov.ph', firstName: 'Ramon', lastName: 'Aquino', role: ROLES.RESPONDER, phone: '+63-917-100-2003' },
  { email: 'barangay2@drmmo.gov.ph', firstName: 'Teresa', lastName: 'Bautista', role: ROLES.BARANGAY_OFFICIAL, barangay: 'San Isidro', phone: '+63-917-100-3001' },
  { email: 'officer2@drmmo.gov.ph', firstName: 'Grace', lastName: 'Lim', role: ROLES.DRRMO_OFFICER, phone: '+63-917-100-4001' },
  { email: 'citizen2@email.com', firstName: 'Jose', lastName: 'Ramos', role: ROLES.CITIZEN, barangay: 'San Isidro', phone: '+63-917-100-5001' },
  { email: 'citizen3@email.com', firstName: 'Rosa', lastName: 'Fernandez', role: ROLES.CITIZEN, barangay: 'Barangay Centro', phone: '+63-917-100-5002' },
];

const BARANGAYS = [
  { name: 'Barangay Centro', code: 'BRGY-001', population: 18450, location: { latitude: 14.5995, longitude: 120.9842 } },
  { name: 'San Isidro', code: 'BRGY-002', population: 12930, location: { latitude: 14.6091, longitude: 120.9946 } },
  { name: 'Santa Cruz', code: 'BRGY-003', population: 21480, location: { latitude: 14.6175, longitude: 120.9801 } },
  { name: 'San Roque', code: 'BRGY-004', population: 9870, location: { latitude: 14.5872, longitude: 120.9931 } },
  { name: 'Bagong Silang', code: 'BRGY-005', population: 15620, location: { latitude: 14.5928, longitude: 120.9715 } },
  { name: 'Mabini', code: 'BRGY-006', population: 8340, location: { latitude: 14.6052, longitude: 121.0058 } },
];

const CENTERS = [
  { name: 'Centro Elementary School Gym', address: 'Rizal Ave., Barangay Centro', barangay: 'Barangay Centro', location: { latitude: 14.6003, longitude: 120.9851 }, capacity: 250, currentOccupancy: 142, facilities: ['Restrooms', 'Kitchen', 'Medical station', 'Generator'] },
  { name: 'Barangay Centro Covered Court', address: 'Mabuhay St., Barangay Centro', barangay: 'Barangay Centro', location: { latitude: 14.5981, longitude: 120.9829 }, capacity: 180, currentOccupancy: 61, facilities: ['Restrooms', 'Water station'] },
  { name: 'San Isidro Multi-Purpose Hall', address: 'Del Pilar St., San Isidro', barangay: 'San Isidro', location: { latitude: 14.6088, longitude: 120.9939 }, capacity: 320, currentOccupancy: 288, facilities: ['Restrooms', 'Kitchen', 'Sleeping area', 'Generator'] },
  { name: 'Santa Cruz National High School', address: 'Bonifacio Rd., Santa Cruz', barangay: 'Santa Cruz', location: { latitude: 14.6169, longitude: 120.9812 }, capacity: 400, currentOccupancy: 96, facilities: ['Classrooms', 'Restrooms', 'Clinic', 'Kitchen'] },
  { name: 'San Roque Chapel Grounds', address: 'Mabini Ext., San Roque', barangay: 'San Roque', location: { latitude: 14.5866, longitude: 120.9925 }, capacity: 120, currentOccupancy: 0, facilities: ['Tents', 'Restrooms'] },
  { name: 'Bagong Silang Sports Complex', address: 'Luna St., Bagong Silang', barangay: 'Bagong Silang', location: { latitude: 14.5934, longitude: 120.9722 }, capacity: 500, currentOccupancy: 214, facilities: ['Restrooms', 'Showers', 'Kitchen', 'Medical station', 'Generator'] },
];

const RESOURCES = [
  { name: 'Ambulance A-01', type: 'ambulance', status: 'in_use', quantity: 1, location: 'DRRMO Central Garage' },
  { name: 'Ambulance A-02', type: 'ambulance', status: 'available', quantity: 1, location: 'DRRMO Central Garage' },
  { name: 'Rescue Boat RB-02', type: 'vehicle', status: 'available', quantity: 4, location: 'Riverside Staging Area' },
  { name: '6x6 Rescue Truck', type: 'vehicle', status: 'in_use', quantity: 2, location: 'Santa Cruz Fire Station' },
  { name: 'Portable Generators (5kVA)', type: 'equipment', status: 'available', quantity: 12, location: 'Municipal Warehouse' },
  { name: 'Chainsaw Units', type: 'equipment', status: 'maintenance', quantity: 8, location: 'Municipal Warehouse' },
  { name: 'Family Food Packs', type: 'supplies', status: 'available', quantity: 1850, location: 'Municipal Warehouse' },
  { name: 'Drinking Water (5-gal)', type: 'supplies', status: 'available', quantity: 640, location: 'Municipal Warehouse' },
  { name: 'Hygiene Kits', type: 'supplies', status: 'in_use', quantity: 420, location: 'San Isidro Hall' },
  { name: 'Volunteer Search & Rescue Team', type: 'personnel', status: 'available', quantity: 36, location: 'DRRMO Operations Center' },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

async function upsertAccounts(accounts: typeof DEMO_ACCOUNTS, hashedPassword: string) {
  for (const account of accounts) {
    await User.findOneAndUpdate(
      { email: account.email },
      { ...account, password: hashedPassword, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

/**
 * Seeds demo accounts plus operational data. Operational collections are only
 * filled when empty, so re-running never duplicates or clobbers real records.
 */
export async function seedDemoData({ includeOperationalData = true } = {}): Promise<void> {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  await upsertAccounts(DEMO_ACCOUNTS, hashedPassword);
  logger.info(`Seeded ${DEMO_ACCOUNTS.length} demo login accounts`);

  if (!includeOperationalData) return;

  await upsertAccounts(SUPPORTING_ACCOUNTS, hashedPassword);

  const users = await User.find({ email: { $in: [...DEMO_ACCOUNTS, ...SUPPORTING_ACCOUNTS].map((a) => a.email) } });
  const byEmail = new Map(users.map((u) => [u.email, u]));
  const get = (email: string) => byEmail.get(email)!;

  if ((await Barangay.countDocuments()) === 0) {
    await Barangay.insertMany(
      BARANGAYS.map((b) => ({
        ...b,
        officials: [
          ...(b.name === 'Barangay Centro' ? [get('barangay1@drmmo.gov.ph')._id] : []),
          ...(b.name === 'San Isidro' ? [get('barangay2@drmmo.gov.ph')._id] : []),
        ],
      }))
    );
  }

  if ((await EvacuationCenter.countDocuments()) === 0) {
    await EvacuationCenter.insertMany(
      CENTERS.map((c) => ({
        ...c,
        status: c.name.includes('Chapel') ? 'under_maintenance' : 'operational',
        manager: c.barangay === 'San Isidro' ? get('barangay2@drmmo.gov.ph')._id : get('barangay1@drmmo.gov.ph')._id,
        supplies: { foodPacks: Math.round(c.capacity * 0.8), waterLiters: c.capacity * 6, sleepingMats: Math.round(c.capacity * 0.6) },
      }))
    );
  }

  if ((await Resource.countDocuments()) === 0) {
    await Resource.insertMany(RESOURCES);
  }

  if ((await Responder.countDocuments()) === 0) {
    await Responder.insertMany([
      { userId: get('responder1@drmmo.gov.ph')._id, status: 'responding', team: 'Alpha Rescue Unit', certifications: ['Water Search & Rescue', 'BLS'], currentLocation: { latitude: 14.6079, longitude: 120.9931 }, totalIncidentsResolved: 42, rating: 4.9 },
      { userId: get('responder2@drmmo.gov.ph')._id, status: 'available', team: 'Bravo Medical', certifications: ['EMT-B', 'ACLS'], currentLocation: { latitude: 14.5999, longitude: 120.9848 }, totalIncidentsResolved: 31, rating: 4.8 },
      { userId: get('responder3@drmmo.gov.ph')._id, status: 'on_duty', team: 'Charlie Fire', certifications: ['Fire Suppression', 'HazMat Awareness'], currentLocation: { latitude: 14.6162, longitude: 120.9797 }, totalIncidentsResolved: 27, rating: 4.7 },
      { userId: get('responder4@drmmo.gov.ph')._id, status: 'off_duty', team: 'Delta General', certifications: ['Collapsed Structure SAR'], totalIncidentsResolved: 18, rating: 4.6 },
    ]);
  }

  if ((await Incident.countDocuments()) === 0) {
    const reporter = get('citizen1@email.com')._id;
    const reporter2 = get('citizen2@email.com')._id;
    const officer = get('officer1@drmmo.gov.ph')._id;
    const r1 = get('responder1@drmmo.gov.ph')._id;
    const r3 = get('responder3@drmmo.gov.ph')._id;

    const raw = [
      { title: 'Rising floodwater along Del Pilar St.', description: 'Knee-deep water entering homes near the creek; several families requesting evacuation assistance.', type: 'flood', severity: 'high', status: 'responding', location: { latitude: 14.6084, longitude: 120.9952, address: 'Del Pilar St. near creek bridge', barangay: 'San Isidro' }, reportedBy: reporter2, affectedCount: 64, injuredCount: 0, assignedResponders: [r1], verifiedBy: officer, verifiedAt: hoursAgo(2.5), age: 3, escalated: true },
      { title: 'Residential fire — two-storey house', description: 'Smoke and flames visible from second floor. Neighbors evacuated; fire spreading to adjacent structure.', type: 'fire', severity: 'critical', status: 'in_progress', location: { latitude: 14.6171, longitude: 120.9806, address: '12 Bonifacio Rd.', barangay: 'Santa Cruz' }, reportedBy: reporter, affectedCount: 14, injuredCount: 2, assignedResponders: [r3], verifiedBy: officer, verifiedAt: hoursAgo(1), age: 1.2 },
      { title: 'Landslide risk on hillside access road', description: 'Cracks observed on slope after continuous rain. Road partially blocked by debris.', type: 'landslide', severity: 'high', status: 'verified', location: { latitude: 14.6058, longitude: 121.0066, address: 'Mabini hillside road, km 2', barangay: 'Mabini' }, reportedBy: reporter2, affectedCount: 30, injuredCount: 0, verifiedBy: officer, verifiedAt: hoursAgo(4), age: 5 },
      { title: 'Motorcycle collision at Rizal Ave.', description: 'Two-vehicle collision; one rider conscious with leg injury.', type: 'accident', severity: 'medium', status: 'reported', location: { latitude: 14.5997, longitude: 120.9839, address: 'Rizal Ave. corner Mabuhay St.', barangay: 'Barangay Centro' }, reportedBy: reporter, affectedCount: 2, injuredCount: 1, age: 0.4 },
      { title: 'Fallen tree blocking drainage canal', description: 'Large acacia tree uprooted by wind, blocking canal and causing localized ponding.', type: 'typhoon', severity: 'medium', status: 'reported', location: { latitude: 14.5978, longitude: 120.9825, address: 'Mabuhay St. drainage canal', barangay: 'Barangay Centro' }, reportedBy: get('citizen3@email.com')._id, affectedCount: 8, injuredCount: 0, age: 0.8 },
      { title: 'Minor tremor — cracked school wall', description: 'Hairline cracks observed on perimeter wall after magnitude 4.1 tremor. No injuries reported.', type: 'earthquake', severity: 'low', status: 'resolved', location: { latitude: 14.5869, longitude: 120.9928, address: 'San Roque Elementary School', barangay: 'San Roque' }, reportedBy: reporter, affectedCount: 0, injuredCount: 0, verifiedBy: officer, verifiedAt: hoursAgo(30), age: 32 },
      { title: 'Flash flood at Luna St. underpass', description: 'Underpass submerged; two vehicles stalled. Traffic re-routed.', type: 'flood', severity: 'high', status: 'closed', location: { latitude: 14.5931, longitude: 120.9719, address: 'Luna St. underpass', barangay: 'Bagong Silang' }, reportedBy: reporter2, affectedCount: 20, injuredCount: 0, verifiedBy: officer, verifiedAt: hoursAgo(50), age: 52 },
    ];

    for (const { age, ...inc } of raw) {
      const { score, level, reason } = calculateIncidentPriority({
        type: inc.type,
        severity: inc.severity as any,
        affectedCount: inc.affectedCount,
        injuredCount: inc.injuredCount,
        ageMinutes: age * 60,
      });
      const created = await Incident.create({
        ...inc,
        priority: score,
        priorityLevel: level,
        priorityReason: reason,
        escalatedAt: inc.escalated ? hoursAgo(age - 0.5) : undefined,
        escalatedBy: inc.escalated ? get('barangay2@drmmo.gov.ph')._id : undefined,
        closedAt: inc.status === 'closed' ? hoursAgo(age - 6) : undefined,
      });
      // Back-date so dashboards show a realistic timeline.
      await Incident.collection.updateOne({ _id: created._id }, { $set: { createdAt: hoursAgo(age), updatedAt: hoursAgo(Math.max(age - 0.3, 0)) } });
    }
  }

  if ((await Report.countDocuments()) === 0) {
    const b1 = get('barangay1@drmmo.gov.ph')._id;
    const b2 = get('barangay2@drmmo.gov.ph')._id;
    await Report.insertMany([
      { title: 'Residential damage — Del Pilar St.', description: 'Ground-floor flooding in 14 houses; 3 with partial wall collapse.', type: 'damage_report', barangay: 'San Isidro', submittedBy: b2, severity: 'high', status: 'reviewed', details: { sector: 'residential', structures: 14 } },
      { title: 'Drainage canal blockage', description: 'Debris and fallen tree blocking canal, causing street ponding.', type: 'damage_report', barangay: 'Barangay Centro', submittedBy: b1, severity: 'medium', status: 'pending', details: { sector: 'infrastructure', structures: 1 } },
      { title: 'Relief packs for 50 families', description: 'Families relocated to the covered court need food packs and drinking water for 3 days.', type: 'resource_report', barangay: 'Barangay Centro', submittedBy: b1, severity: 'high', status: 'pending', details: { category: 'relief', quantity: 50, unit: 'families' } },
      { title: 'Rescue boat standby — creek area', description: 'Request one rescue boat on standby near the creek while water level remains high.', type: 'resource_report', barangay: 'San Isidro', submittedBy: b2, severity: 'critical', status: 'processed', details: { category: 'rescue', quantity: 1, unit: 'boat' } },
    ]);
  }

  if ((await Notification.countDocuments()) === 0) {
    const everyone = await User.find({ isActive: { $ne: false } }).select('_id');
    const centro = await User.find({ barangay: 'Barangay Centro' }).select('_id');
    const toMap = (ids: { _id: unknown }[]) => new Map(ids.map((u) => [String(u._id), false]));
    await Notification.create([
      { title: 'Tropical Storm Signal No. 2 raised', message: 'PAGASA has raised TCWS No. 2 over the municipality. Secure loose objects, prepare go-bags and monitor official advisories.', type: 'alert', priority: 'critical', audience: 'all', createdBy: get('officer1@drmmo.gov.ph')._id, recipients: everyone.map((u) => u._id), isRead: toMap(everyone) },
      { title: 'Relief distribution schedule', message: 'Family food packs will be distributed at the Centro Covered Court from 9:00 AM. Bring your barangay ID.', type: 'info', priority: 'medium', audience: 'barangay:Barangay Centro', createdBy: get('barangay1@drmmo.gov.ph')._id, recipients: centro.map((u) => u._id), isRead: toMap(centro) },
    ]);
  }

  logger.info('Demo operational data is in place');
}

/** Called at boot when SEED_DEMO_DATA=true — only seeds a completely empty database. */
export async function seedDemoDataIfEmpty(): Promise<void> {
  if (process.env.SEED_DEMO_DATA !== 'true') return;
  const userCount = await User.estimatedDocumentCount();
  if (userCount > 0) {
    logger.info('SEED_DEMO_DATA=true but database already has users — skipping demo seed');
    return;
  }
  logger.info('Empty database detected — seeding demo data (SEED_DEMO_DATA=true)');
  await seedDemoData();
}
