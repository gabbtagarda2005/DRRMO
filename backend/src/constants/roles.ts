export const ROLES = {
  ADMIN: 'admin',
  DRRMO_OFFICER: 'drrmo_officer',
  RESPONDER: 'responder',
  BARANGAY_OFFICIAL: 'barangay_official',
  CITIZEN: 'citizen',
};

export const INCIDENT_STATUS = {
  REPORTED: 'reported',
  VERIFIED: 'verified',
  RESPONDING: 'responding',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const INCIDENT_TYPE = {
  FLOOD: 'flood',
  EARTHQUAKE: 'earthquake',
  FIRE: 'fire',
  LANDSLIDE: 'landslide',
  TYPHOON: 'typhoon',
  ACCIDENT: 'accident',
  OTHER: 'other',
};

export const RESPONDER_STATUS = {
  AVAILABLE: 'available',
  ON_DUTY: 'on_duty',
  RESPONDING: 'responding',
  ON_SCENE: 'on_scene',
  OFF_DUTY: 'off_duty',
};

export const RESOURCE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  UNAVAILABLE: 'unavailable',
};

export const RESOURCE_TYPE = {
  AMBULANCE: 'ambulance',
  VEHICLE: 'vehicle',
  EQUIPMENT: 'equipment',
  SUPPLIES: 'supplies',
  PERSONNEL: 'personnel',
};
