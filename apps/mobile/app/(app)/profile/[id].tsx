import { useLocalSearchParams } from 'expo-router';
import { ProfileScreenBody } from '../../../src/components/ProfileScreenBody';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileScreenBody userId={id} />;
}
