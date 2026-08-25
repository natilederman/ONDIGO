import type { OndigoClient } from '../supabaseClient';
import type { Review } from '../database.types';

export async function listReviewsForUser(client: OndigoClient, userId: string): Promise<Review[]> {
  const { data, error } = await client
    .from('reviews')
    .select('*')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function hasReviewed(client: OndigoClient, deliveryId: string, reviewerId: string): Promise<boolean> {
  const { data, error } = await client
    .from('reviews')
    .select('id')
    .eq('delivery_id', deliveryId)
    .eq('reviewer_id', reviewerId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function createReview(
  client: OndigoClient,
  reviewerId: string,
  input: { deliveryId: string; revieweeId: string; rating: number; comment?: string }
): Promise<Review> {
  const { data, error } = await client
    .from('reviews')
    .insert({
      delivery_id: input.deliveryId,
      reviewer_id: reviewerId,
      reviewee_id: input.revieweeId,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
