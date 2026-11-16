import { EvacuationBoard, LoadingState, PageTitleSync } from '@drrmo/ui';
import { useBarangay } from '../lib/useBarangay';
import { NoBarangay } from '../lib/NoBarangay';

export function Evacuations() {
  const { barangay, isLoading } = useBarangay();

  return (
    <div className="space-y-6">
      <PageTitleSync title="Evacuation Centers" />
      {isLoading ? (
        <LoadingState />
      ) : barangay ? (
        <>
          <p className="text-sm text-slate-600">
            Check evacuees in and out of centers in <strong>{barangay}</strong>. Counts sync to the DRRMO command center in real time.
          </p>
          <EvacuationBoard scopeBarangay={barangay} accentClass="bg-emerald-600 hover:bg-emerald-700" />
        </>
      ) : (
        <NoBarangay />
      )}
    </div>
  );
}
