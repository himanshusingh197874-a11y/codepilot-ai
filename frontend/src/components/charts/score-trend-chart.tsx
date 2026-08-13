'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Props = {
  data: {
    date: string;
    score: number;
  }[];
};

export default function ScoreTrendChart({ data }: Props) {
  const chartData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString(),
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 12 }}
            allowDecimals
          />

          <Tooltip
            formatter={(value) => [
              `${Number(value).toFixed(1)}/10`,
              'Score',
            ]}
          />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}