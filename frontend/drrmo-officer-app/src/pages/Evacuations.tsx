import { EvacuationBoard, PageTitleSync } from '@drrmo/ui';

export function Evacuations() {
  return (
    <div className="space-y-6">
      <PageTitleSync title="Evacuation Centers" />
      <EvacuationBoard />
    </div>
  );
}
