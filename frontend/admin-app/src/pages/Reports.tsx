import { BarChart3 } from 'lucide-react';
import { PageTitleSync, ReportCenter } from '@drrmo/ui';
import {
  evacuationSummary,
  fieldSubmissions,
  incidentRegister,
  resourceInventory,
  responderRoster,
  securityAudit,
  userDirectory,
} from '@shared/src/exports';

const REPORTS = [userDirectory, securityAudit, incidentRegister, evacuationSummary, resourceInventory, responderRoster, fieldSubmissions];

export function Reports() {
  return (
    <div className="space-y-6">
      <PageTitleSync title="System Reports" />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-slate-700" />
          <div>
            <h2 className="font-semibold text-slate-900">Administrative reporting</h2>
            <p className="text-sm text-slate-600">
              Each report is generated on demand from live records and downloads as a spreadsheet-ready CSV.
            </p>
          </div>
        </div>
      </div>

      <ReportCenter reports={REPORTS} />
    </div>
  );
}
