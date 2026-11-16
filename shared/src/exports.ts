/**
 * Report generators shared by the admin and officer consoles. Each one pulls
 * live data from the API and downloads it as a CSV that opens cleanly in Excel.
 */
import { auditApi, evacuationsApi, incidentsApi, reportsApi, resourcesApi, respondersApi, usersApi } from './services';
import { downloadCsv, formatDateTime, fullName, humanize, todayStamp } from './format';

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  run: () => Promise<number>;
}

async function allIncidents() {
  const first = await incidentsApi.list({ limit: 200, page: 1 });
  const pages = [first.data];
  for (let p = 2; p <= Math.min(first.totalPages, 10); p++) {
    pages.push((await incidentsApi.list({ limit: 200, page: p })).data);
  }
  return pages.flat();
}

export const incidentRegister: ReportDefinition = {
  id: 'incidents',
  title: 'Incident register',
  description: 'Every incident with type, severity, status, priority, location and casualty counts.',
  run: async () => {
    const rows = await allIncidents();
    downloadCsv(
      `drrmo-incident-register-${todayStamp()}`,
      rows.map((i) => ({
        Reported: formatDateTime(i.createdAt),
        Title: i.title,
        Type: humanize(i.type),
        Severity: humanize(i.severity),
        Status: humanize(i.status),
        Priority: i.priorityLevel ? `${humanize(i.priorityLevel)} (${i.priority ?? 0})` : '',
        Barangay: i.location?.barangay,
        Address: i.location?.address,
        Latitude: i.location?.latitude,
        Longitude: i.location?.longitude,
        Affected: i.affectedCount ?? 0,
        Injured: i.injuredCount ?? 0,
        Escalated: i.escalated ? 'Yes' : 'No',
        'Reported by': fullName(i.reportedBy),
      }))
    );
    return rows.length;
  },
};

export const evacuationSummary: ReportDefinition = {
  id: 'evacuations',
  title: 'Evacuation center occupancy',
  description: 'Capacity, current occupancy and utilisation for every evacuation center.',
  run: async () => {
    const rows = await evacuationsApi.list();
    downloadCsv(
      `drrmo-evacuation-occupancy-${todayStamp()}`,
      rows.map((c) => ({
        Center: c.name,
        Barangay: c.barangay,
        Address: c.address,
        Status: humanize(c.status),
        Capacity: c.capacity,
        Occupancy: c.currentOccupancy,
        'Utilisation %': c.capacity ? Math.round((c.currentOccupancy / c.capacity) * 100) : 0,
        Facilities: (c.facilities ?? []).join('; '),
        'Last updated': formatDateTime(c.updatedAt),
      }))
    );
    return rows.length;
  },
};

export const resourceInventory: ReportDefinition = {
  id: 'resources',
  title: 'Resource inventory',
  description: 'Vehicles, equipment, supplies and personnel pools with status and location.',
  run: async () => {
    const rows = await resourcesApi.list();
    downloadCsv(
      `drrmo-resource-inventory-${todayStamp()}`,
      rows.map((r) => ({
        Resource: r.name,
        Type: humanize(r.type),
        Status: humanize(r.status),
        Quantity: r.quantity,
        Location: r.location,
        'Last updated': formatDateTime(r.updatedAt),
      }))
    );
    return rows.length;
  },
};

export const responderRoster: ReportDefinition = {
  id: 'responders',
  title: 'Responder roster',
  description: 'Field responders with team, live status, certifications and resolved incidents.',
  run: async () => {
    const rows = await respondersApi.list();
    downloadCsv(
      `drrmo-responder-roster-${todayStamp()}`,
      rows.map((r) => ({
        Responder: fullName(r.userId),
        Email: r.userId?.email ?? '',
        Team: r.team ?? '',
        Status: humanize(r.status),
        Certifications: (r.certifications ?? []).join('; '),
        'Incidents resolved': r.totalIncidentsResolved ?? 0,
        Rating: r.rating ?? '',
      }))
    );
    return rows.length;
  },
};

export const fieldSubmissions: ReportDefinition = {
  id: 'submissions',
  title: 'Barangay submissions',
  description: 'Damage assessments and assistance requests filed by barangay officials.',
  run: async () => {
    const result = await reportsApi.list({ limit: 200 });
    downloadCsv(
      `drrmo-barangay-submissions-${todayStamp()}`,
      result.data.map((r) => ({
        Submitted: formatDateTime(r.createdAt),
        Type: humanize(r.type),
        Title: r.title,
        Barangay: r.barangay ?? '',
        Severity: humanize(r.severity),
        Status: humanize(r.status),
        'Submitted by': fullName(r.submittedBy),
        Description: r.description,
      }))
    );
    return result.data.length;
  },
};

export const userDirectory: ReportDefinition = {
  id: 'users',
  title: 'User directory',
  description: 'All accounts with role, barangay, status and last sign-in.',
  run: async () => {
    const rows = await usersApi.list();
    downloadCsv(
      `drrmo-user-directory-${todayStamp()}`,
      rows.map((u) => ({
        Name: fullName(u),
        Email: u.email,
        Role: humanize(u.role),
        Barangay: u.barangay ?? '',
        Status: u.isActive ? 'Active' : 'Suspended',
        'Last login': u.lastLogin ? formatDateTime(u.lastLogin) : 'Never',
        Created: formatDateTime(u.createdAt),
      }))
    );
    return rows.length;
  },
};

export const securityAudit: ReportDefinition = {
  id: 'audit',
  title: 'Security & sign-in audit',
  description: 'The 200 most recent sign-ins for compliance review.',
  run: async () => {
    const result = await auditApi.list({ action: 'login', limit: 200 });
    downloadCsv(
      `drrmo-signin-audit-${todayStamp()}`,
      result.data.map((ev) => ({
        Time: formatDateTime(ev.createdAt),
        User: fullName(ev.userId),
        Email: ev.userId?.email ?? '',
        Role: humanize(ev.userId?.role),
      }))
    );
    return result.data.length;
  },
};
