import { AlertCenter, LoadingState, PageTitleSync } from '@drrmo/ui';
import { useBarangay } from '../lib/useBarangay';
import { NoBarangay } from '../lib/NoBarangay';

export function Alerts() {
  const { barangay, isLoading } = useBarangay();

  return (
    <div className="space-y-6">
      <PageTitleSync title="Advisories" />
      {isLoading ? (
        <LoadingState />
      ) : barangay ? (
        <AlertCenter
          audiences={[{ value: `barangay:${barangay}`, label: `Everyone in ${barangay}` }]}
          audienceHint={`Advisories reach every registered resident and official in ${barangay}. Municipality-wide alerts are issued by the DRRMO.`}
          accentClass="bg-emerald-600 hover:bg-emerald-700"
          iconClass="text-emerald-600"
          composeTitle="Compose advisory"
          historyTitle="Your recent advisories"
        />
      ) : (
        <NoBarangay />
      )}
    </div>
  );
}
