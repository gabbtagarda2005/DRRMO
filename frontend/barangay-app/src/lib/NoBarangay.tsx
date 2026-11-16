import { MapPinOff } from 'lucide-react';

/** Shown when a barangay official's account hasn't been linked to a barangay yet. */
export function NoBarangay() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
      <MapPinOff className="h-7 w-7 text-amber-600" />
      <p className="font-semibold text-amber-900">Your account isn't linked to a barangay yet</p>
      <p className="max-w-md text-sm text-amber-800">
        Ask a DRRMO system administrator to set your barangay under User Management. Once assigned, this page will show your barangay's data.
      </p>
    </div>
  );
}
