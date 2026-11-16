import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCenter, PageTitleSync, type AudienceOption } from '@drrmo/ui';
import { barangaysApi } from '@shared/src/services';

const BASE_AUDIENCES: AudienceOption[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'citizens', label: 'All citizens' },
  { value: 'barangay_officials', label: 'Barangay officials' },
  { value: 'responders', label: 'Responders' },
  { value: 'staff', label: 'All DRRMO staff' },
];

export function Alerts() {
  const barangays = useQuery({ queryKey: ['barangays'], queryFn: barangaysApi.list, staleTime: 10 * 60_000 });

  const audiences = useMemo(
    () => [
      ...BASE_AUDIENCES,
      ...(barangays.data ?? []).map((b) => ({ value: `barangay:${b.name}`, label: `Barangay · ${b.name}` })),
    ],
    [barangays.data]
  );

  return (
    <div className="space-y-6">
      <PageTitleSync title="Alerts & Announcements" />
      <AlertCenter
        key={audiences.length}
        audiences={audiences}
        audienceHint="Alerts are delivered instantly to everyone signed in, and appear in each recipient's notification inbox."
      />
    </div>
  );
}
