'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  profileQueries,
  reviewQueries,
  connectionQueries,
  type Profile,
  type Review,
} from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { StarRating } from '@/components/StarRating';
import { ProfileDeliveries } from '@/components/ProfileDeliveries';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    profileQueries.getProfile(client, id).then(setProfile);
    reviewQueries.listReviewsForUser(client, id).then(setReviews);
    if (user && user.id !== id) {
      connectionQueries.isFollowing(client, user.id, id).then(setFollowing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  if (authLoading || !profile || !user) return null;

  const isSelf = user.id === id;

  const toggleFollow = async () => {
    setBusy(true);
    try {
      if (following) {
        await connectionQueries.unfollow(client, user.id, id);
      } else {
        await connectionQueries.follow(client, user.id, id);
      }
      setFollowing(!following);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <StarRating value={Math.round(profile.rating_avg)} readOnly size={16} />
            <span>
              {profile.rating_avg.toFixed(1)} ({profile.rating_count} reviews)
            </span>
          </div>
        </div>
        {isSelf ? (
          <Link href="/profile/me/edit" className="rounded-full border border-ink px-4 py-2 text-sm font-medium">
            Edit profile
          </Link>
        ) : (
          <Button variant={following ? 'secondary' : 'primary'} loading={busy} onClick={toggleFollow}>
            {following ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>

      {profile.vehicle_type && <Badge>{profile.vehicle_type}</Badge>}
      {profile.bio && <p className="text-sm">{profile.bio}</p>}

      <ProfileDeliveries userId={id} isSelf={isSelf} firstName={profile.full_name.split(' ')[0]} />

      <div>
        <h2 className="mb-2 font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <StarRating value={r.rating} readOnly size={16} />
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
