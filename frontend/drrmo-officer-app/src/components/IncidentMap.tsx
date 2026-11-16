import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { MAP_CONFIG, RISK_LEVEL_COLORS } from '@shared/constants';
import type { Incident } from '../services/incidents';
import 'leaflet/dist/leaflet.css';

const SEVERITY_COLOR: Record<string, string> = {
  low: RISK_LEVEL_COLORS.LOW,
  medium: RISK_LEVEL_COLORS.MEDIUM,
  high: RISK_LEVEL_COLORS.HIGH,
  critical: RISK_LEVEL_COLORS.CRITICAL,
};

function severityIcon(severity: string): L.DivIcon {
  const color = SEVERITY_COLOR[severity] ?? RISK_LEVEL_COLORS.MEDIUM;
  return L.divIcon({
    className: 'incident-marker',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

interface IncidentMapProps {
  incidents: Incident[];
  selectedId?: string | null;
  onSelect?: (incident: Incident) => void;
  heightClassName?: string;
}

export function IncidentMap({ incidents, selectedId, onSelect, heightClassName = 'h-80' }: IncidentMapProps) {
  const selected = incidents.find((i) => i._id === selectedId);
  const center: [number, number] = selected
    ? [selected.location.latitude, selected.location.longitude]
    : [MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng];

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-100 ${heightClassName}`}>
      <MapContainer
        center={center}
        zoom={MAP_CONFIG.DEFAULT_ZOOM}
        minZoom={MAP_CONFIG.MIN_ZOOM}
        maxZoom={MAP_CONFIG.MAX_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          url={MAP_CONFIG.TILE_LAYER}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerClusterGroup chunkedLoading>
          {incidents.map((incident) => (
            <Marker
              key={incident._id}
              position={[incident.location.latitude, incident.location.longitude]}
              icon={severityIcon(incident.severity)}
              eventHandlers={{ click: () => onSelect?.(incident) }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold capitalize">{incident.title}</p>
                  <p className="text-xs text-slate-500">
                    {incident.type} · {incident.severity} · {incident.status}
                  </p>
                  <p className="text-xs text-slate-500">{incident.location.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
