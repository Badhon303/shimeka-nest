'use client';

import { useState } from 'react';
import type { ReviewView } from '@shimeka/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { formatDate } from '@/lib/utils';

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-500">
      {'★'.repeat(Math.round(value))}
      <span className="text-brand-100">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function ReviewsSection({
  productId,
  initialReviews,
}: {
  productId: string;
  initialReviews: ReviewView[];
}) {
  const { token } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ productId, rating, comment }),
      });
      setMessage('Thank you! Your review is pending approval.');
      setComment('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-14 border-t border-brand-100 pt-10">
      <h2 className="mb-6 font-serif text-2xl font-bold">Customer Reviews</h2>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {reviews.length === 0 && (
            <p className="text-sm text-ink/50">No reviews yet. Be the first to review!</p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.userName}</span>
                <Stars value={r.rating} />
              </div>
              {r.verifiedPurchase && (
                <span className="badge mt-1 bg-green-50 text-green-700">Verified Purchase</span>
              )}
              {r.comment && <p className="mt-2 text-sm text-ink/70">{r.comment}</p>}
              <p className="mt-2 text-xs text-ink/40">{formatDate(r.createdAt)}</p>
            </div>
          ))}
        </div>

        <div className="card h-fit p-5">
          <h3 className="mb-3 font-semibold">Write a review</h3>
          {!token ? (
            <p className="text-sm text-ink/60">
              Please log in to write a review. Only customers with a delivered order can review.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Rating</label>
                <div className="flex gap-1 text-2xl">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setRating(n)}
                      className={n <= rating ? 'text-amber-500' : 'text-brand-100'}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="input"
              />
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              {message && <p className="text-sm text-green-600">{message}</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
