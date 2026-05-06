import { KitchenDashboard } from './components/kds/KitchenDashboard';
import { MOCK_LOCATION_ID } from './components/kds/mockData';

const locationId = import.meta.env.VITE_KDS_LOCATION_ID || MOCK_LOCATION_ID;

export default function App() {
  return <KitchenDashboard locationId={locationId} />;
}
