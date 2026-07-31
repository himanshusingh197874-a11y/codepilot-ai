"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  data: {
    high: number;
    medium: number;
    low: number;
  };
};

const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
];

export default function SeverityPieChart({ data }: Props) {
  const chartData = [
    {
      name: "High",
      value: data.high,
    },
    {
      name: "Medium",
      value: data.medium,
    },
    {
      name: "Low",
      value: data.low,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={110}
          label
        >
          {chartData.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}