import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

export function ComingSoonPage({
  title,
  version = 'a future version',
  description,
}: {
  title: string;
  version?: string;
  description?: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <Card className="p-10 text-center">
        <div className="text-3xl">🚧</div>
        <h2 className="mt-3 text-lg font-semibold text-slate-800">Coming in {version}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          {description ??
            'This screen is planned for a later version. The data model and navigation are already in place.'}
        </p>
      </Card>
    </div>
  );
}
