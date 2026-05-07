import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "@clerk/react";
import { StarIcon } from "lucide-react";
import toast from "react-hot-toast";

export function ProductReviews({ productSlug }) {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["product", productSlug, "reviews"],
    queryFn: () => apiFetch(`/api/products/${productSlug}/reviews`),
  });

  const submitReviewMutation = useMutation({
    mutationFn: (body) =>
      apiFetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        body,
        getToken,
      }),
    onSuccess: () => {
      toast.success("Review submitted!");
      setRating(5);
      setComment("");
      queryClient.invalidateQueries(["product", productSlug, "reviews"]);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  const reviews = reviewsData?.reviews || [];
  
  // Calculate average
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitReviewMutation.mutate({ rating, comment });
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-4">Customer Reviews</h3>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="flex text-yellow-400">
          {[1,2,3,4,5].map(i => (
            <StarIcon 
              key={i} 
              className={`size-6 ${i <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-base-300'}`} 
            />
          ))}
        </div>
        <span className="text-lg font-medium">{avgRating.toFixed(1)} out of 5</span>
        <span className="text-base-content/60">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="skeleton h-24 w-full" />)}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-base-content/60 italic">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-base-200 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{review.user?.displayName || 'Anonymous'}</div>
                    <div className="text-xs text-base-content/50">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex text-yellow-400 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <StarIcon 
                        key={i} 
                        className={`size-4 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-base-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-base-200/50 p-6 rounded-2xl">
            <h4 className="text-xl font-bold mb-4">Write a Review</h4>
            {!isSignedIn ? (
              <p className="text-sm">You must be logged in to write a review.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="rating rating-lg">
                    {[1,2,3,4,5].map((val) => (
                      <input
                        key={val}
                        type="radio"
                        name="rating"
                        className="mask mask-star-2 bg-yellow-400"
                        checked={rating === val}
                        onChange={() => setRating(val)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Review</label>
                  <textarea 
                    className="textarea textarea-bordered w-full" 
                    placeholder="What did you think about this product?"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={submitReviewMutation.isPending}
                >
                  {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
