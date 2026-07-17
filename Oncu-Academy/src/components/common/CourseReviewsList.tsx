import { useEffect, useMemo, useState } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

type ReviewUser = {
  _id?: string;
  id?: string;
  name?: string;
  surname?: string;
  avatar?: string;
};

type ReviewItem = {
  _id?: string;
  user?: ReviewUser | string | null;
  name?: string;
  rating: number;
  comment: string;
  createdAt?: string | Date;
};

type CourseReviewsListProps = {
  reviews: ReviewItem[];
  rating: number;
  pageSize?: number;
  showSummary?: boolean;
  title?: string;
  subtitle?: string;
  summaryText?: string;
  emptyMessage?: string;
};

const getUserName = (review: ReviewItem) => {
  if (review.user && typeof review.user === 'object') {
    return `${review.user.name || ''} ${review.user.surname || ''}`.trim() || 'Student';
  }

  return review.name || 'Student';
};

const getUserAvatar = (review: ReviewItem) => {
  if (review.user && typeof review.user === 'object' && review.user.avatar) {
    return review.user.avatar;
  }

  const name = encodeURIComponent(getUserName(review));
  return `https://ui-avatars.com/api/?name=${name}&background=00D084&color=fff`;
};

const formatReviewDate = (value?: string | Date) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return date.toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getPageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
};

export default function CourseReviewsList({
  reviews,
  rating,
  pageSize = 3,
  showSummary = true,
  title = 'Student opinions placeholder',
  subtitle = 'This course subtitle placeholder',
  summaryText = 'reviews collected.',
  emptyMessage = 'No reviews yet for this course.'
}: CourseReviewsListProps) {
  const { t } = useTranslation();
  const resolvedTitle = title !== 'Student opinions placeholder' ? title : t('reviews.students_opinions', { defaultValue: 'Tələbələrin fikirləri' });
  const resolvedSubtitle = subtitle !== 'This course subtitle placeholder' ? subtitle : t('reviews.for_this_course', { defaultValue: 'Bu kurs üçün' });
  const resolvedSummaryText = summaryText !== 'reviews collected.' ? summaryText : t('reviews.summary_text', { defaultValue: 'rəy toplanıb.' });
  const resolvedEmptyMessage = emptyMessage !== 'No reviews yet for this course.' ? emptyMessage : t('reviews.empty_message', { defaultValue: 'Hələ bu kurs üçün rəy yoxdur.' });
  const orderedReviews = useMemo(() => [...reviews].sort((left, right) => {
    const rightTime = new Date(right.createdAt || 0).getTime();
    const leftTime = new Date(left.createdAt || 0).getTime();
    return rightTime - leftTime;
  }), [reviews]);
  const reviewCount = orderedReviews.length;
  const formattedRating = Number(rating || 0).toFixed(1);
  const totalPages = Math.max(1, Math.ceil(reviewCount / pageSize));
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const visibleReviews = orderedReviews.slice(startIndex, startIndex + pageSize);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
  };

  return (
    <div className="space-y-6">
      {showSummary ? (
        <div className="flex flex-col gap-4 rounded-3xl bg-gray-50 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{t('common.reviews', { defaultValue: 'Rəylər' })}</p>
            <h3 className="mt-2 text-2xl font-black text-gray-900">{resolvedTitle}</h3>
            <p className="mt-2 text-sm text-gray-500">{resolvedSubtitle} {reviewCount} {resolvedSummaryText}</p>
          </div>

          <div className="rounded-3xl bg-[#0A0A0A] px-6 py-5 text-white shadow-xl shadow-gray-200/50">
            <div className="text-4xl font-black">{formattedRating}</div>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-white/70">{reviewCount} {t('common.review_count_suffix', { defaultValue: 'rəy' })}</p>
          </div>
        </div>
      ) : null}

      {reviewCount === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          {resolvedEmptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((review, index) => (
            <article
              key={review._id || `${getUserName(review)}-${index}`}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <img
                  src={getUserAvatar(review)}
                  alt={getUserName(review)}
                  className="h-12 w-12 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{getUserName(review)}</h4>
                      <p className="text-sm text-gray-500">{formatReviewDate(review.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-gray-600">
                    {review.comment}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {t('reviews.page_indicator', { current: currentPage, total: totalPages, defaultValue: `Səhifə ${currentPage} / ${totalPages}` })}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="rounded-xl"
                >
                  {t('common.back', { defaultValue: 'Geri' })}
                </Button>

                {pageNumbers.map((page, index) => {
                  const previousPage = pageNumbers[index - 1];
                  const hasGap = previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {hasGap ? <span className="px-1 text-gray-400">...</span> : null}
                      <Button
                        type="button"
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => goToPage(page)}
                        className={`min-w-10 rounded-xl ${page === currentPage ? 'bg-[#D4AF37] text-white hover:bg-[#B88A1B]' : ''}`}
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="rounded-xl"
                >
                  {t('common.forward', { defaultValue: 'İrəli' })}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}