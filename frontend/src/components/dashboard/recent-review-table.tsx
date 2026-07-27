type Review = {
  id: string;
  score: number;
  summary: string;
  createdAt: string;
};

type Props = {
  reviews: Review[];
};

export default function RecentReviewTable({
  reviews,
}: Props) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Score</th>
            <th className="px-4 py-3 text-left">Summary</th>
            <th className="px-4 py-3 text-left">Created</th>
          </tr>
        </thead>

        <tbody>
          {reviews.map((review) => (
            <tr
              key={review.id}
              className="border-b last:border-none"
            >
              <td className="px-4 py-3 font-semibold">
                {review.score}
              </td>

              <td className="px-4 py-3">
                {review.summary}
              </td>

              <td className="px-4 py-3 text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}