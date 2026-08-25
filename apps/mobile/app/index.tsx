import { Redirect } from 'expo-router';
import { useAuth } from '../src/lib/AuthProvider';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(app)/(tabs)/requests' : '/login'} />;
}
