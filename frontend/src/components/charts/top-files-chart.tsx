"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = {
  data: {
    path: string;
    findings: number;
  }[];
};

export default function TopFilesChart({ data }: Props) {
  const chartData = data.map(file => ({
    name: file.path.split("/").pop(),
    findings: file.findings,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          type="number"
          allowDecimals={false}
        />

        <YAxis
          type="category"
          dataKey="name"
          width={180}
        />

        <Tooltip />

        <Bar
          dataKey="findings"
          radius={[0, 6, 6, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}