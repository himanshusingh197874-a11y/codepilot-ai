"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  data: {
    date: string;
    score: number;
  }[];
};

export default function ScoreTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
        />

        <YAxis
          domain={[0, 10]}
          tick={{ fontSize: 12 }}
        />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="score"
          stroke="#4f46e5"
          strokeWidth={3}
          dot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}