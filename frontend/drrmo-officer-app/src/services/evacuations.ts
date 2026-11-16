import { apiGet } from '@shared/src/api';

interface EvacuationCenterWire {
  _id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
}

export interface EvacuationSummary {
  centers: number;
  totalCapacity: number;
  totalOccupancy: number;
}

export async function fetchEvacuationSummary(): Promise<EvacuationSummary> {
  const centers = await apiGet<EvacuationCenterWire[]>('/evacuations');
  return centers.reduce(
    (acc, center) => ({
      centers: acc.centers + 1,
      totalCapacity: acc.totalCapacity + (center.capacity || 0),
      totalOccupancy: acc.totalOccupancy + (center.currentOccupancy || 0),
    }),
    { centers: 0, totalCapacity: 0, totalOccupancy: 0 },
  );
}
