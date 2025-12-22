import { RouteForm } from '@/features/routes/components/route-form';

interface EditRoutePageProps {
  params: {
    routeId: string;
  };
}

export default function EditRoutePage({ params }: EditRoutePageProps) {
  return <RouteForm routeId={params.routeId} />;
}
