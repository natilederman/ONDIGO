import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { profileQueries, reviewQueries, connectionQueries, type Profile, type Review } from '@ondigo/shared';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthProvider';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { colors } from '../lib/theme';

export function ProfileScreenBody({ userId }: { userId: string }) {
  const client = getSupabaseClient();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    profileQueries.getProfile(client, userId).then(setProfile);
    reviewQueries.listReviewsForUser(client, userId).then(setReviews);
    if (user && user.id !== userId) {
      connectionQueries.isFollowing(client, user.id, userId).then(setFollowing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.id]);

  if (!profile || !user) return null;

  const isSelf = user.id === userId;

  const toggleFollow = async () => {
    setBusy(true);
    try {
      if (following) {
        await connectionQueries.unfollow(client, user.id, userId);
      } else {
        await connectionQueries.follow(client, user.id, userId);
      }
      setFollowing(!following);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.full_name}</Text>
          <View style={styles.ratingRow}>
            <StarRating value={Math.round(profile.rating_avg)} readOnly size={15} />
            <Text style={styles.ratingText}>
              {profile.rating_avg.toFixed(1)} ({profile.rating_count} reviews)
            </Text>
          </View>
        </View>
        {isSelf ? (
          <Button variant="secondary" onPress={() => router.push('/(app)/profile/edit')}>
            Edit profile
          </Button>
        ) : (
          <Button variant={following ? 'secondary' : 'primary'} loading={busy} onPress={toggleFollow}>
            {following ? 'Following' : 'Follow'}
          </Button>
        )}
      </View>

      {profile.vehicle_type && <Badge>{profile.vehicle_type}</Badge>}
      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      <Text style={styles.sectionTitle}>Reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.empty}>No reviews yet.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {reviews.map((r) => (
            <Card key={r.id}>
              <StarRating value={r.rating} readOnly size={15} />
              {r.comment && <Text style={styles.comment}>{r.comment}</Text>}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 22, fontWeight: '700', color: colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingText: { fontSize: 13, color: colors.muted },
  bio: { fontSize: 14, color: colors.ink },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 8 },
  empty: { fontSize: 13, color: colors.muted },
  comment: { marginTop: 6, fontSize: 13, color: colors.ink },
});
