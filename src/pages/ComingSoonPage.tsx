import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

export function ComingSoonPage({
  title,
  phase = 'Phase 2',
  description,
}: {
  title: string;
  phase?: string;
  description?: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <Card className="p-10 text-center">
        <div className="text-3xl">🚧</div>
        <h2 className="mt-3 text-lg font-semibold text-slate-800">Coming in {phase}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          {description ??
            'This screen is planned for a later phase. The data model and navigation are already in place.'}
        </p>
      </Card>
    </div>
  );
}
