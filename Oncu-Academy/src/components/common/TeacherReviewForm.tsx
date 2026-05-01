import { useEffect, useState, type FormEvent } from 'react';
import { Star, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/services/publicApi';

const MAX_REVIEW_LENGTH = 500;

type TeacherReviewFormProps = {
  teacherId: string;
  initialRating?: number;
  initialComment?: string;
  onSubmitted?: (updatedTeacher: any) => void;
};

export default function TeacherReviewForm({
  teacherId,
  initialRating = 5,
  initialComment = '',
  onSubmitted
}: TeacherReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const remainingCharacters = MAX_REVIEW_LENGTH - comment.length;

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [teacherId, initialRating, initialComment]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!comment.trim()) {
      toast.error('Zəhmət olmasa rəyinizi yazın');
      return;
    }

    if (comment.length > MAX_REVIEW_LENGTH) {
      toast.error(`Rəy maksimum ${MAX_REVIEW_LENGTH} simvol ola bilər`);
      return;
    }

    const token = localStorage.getItem('rim_auth_token');

    if (!token) {
      toast.error('Rəy yazmaq üçün giriş etməlisiniz');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/teacher/public/${teacherId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Rəy göndərilmədi');
      }

      toast.success(data.message || 'Müəllim rəyi qeyd edildi');
      onSubmitted?.(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Rəy göndərilmədi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Rəy yazın</p>
        <h3 className="text-xl font-black text-gray-900">Müəllimi qiymətləndirin</h3>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Qiymət</span>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} ulduz`}
            >
              <Star className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-gray-500">{rating}/5</span>
        </div>
      </div>

      <Textarea
        placeholder="Müəllim haqqında fikirlərinizi bölüşün..."
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={MAX_REVIEW_LENGTH}
        className="min-h-[120px] rounded-2xl border-gray-200 bg-white focus:border-[#D4AF37]"
      />

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Max {MAX_REVIEW_LENGTH} simvol</span>
        <span className={remainingCharacters < 50 ? 'font-semibold text-amber-600' : ''}>
          Qalan: {Math.max(remainingCharacters, 0)}
        </span>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 rounded-2xl bg-[#D4AF37] px-6 font-bold text-white hover:bg-[#B88A1B]"
      >
        {isSubmitting ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Rəyi göndər
          </>
        )}
      </Button>
    </form>
  );
}