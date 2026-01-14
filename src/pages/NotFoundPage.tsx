import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

export default function NotFoundPage() {
  return (
    <Card title="Nicht gefunden">
      <div className="text-sm text-primary-700">Diese Seite existiert nicht.</div>
      <div className="mt-3">
        <Link to="/">
          <Button size="sm">Zurück zum Dashboard</Button>
        </Link>
      </div>
    </Card>
  );
}
