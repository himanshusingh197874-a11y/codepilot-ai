'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Props = {
  data: {
    path: string;
    findings: number;
  }[];
};

export default function TopFilesChart({ data }: Props) {
  const chartData = data.map((file) => ({
    name: file.path.split('/').pop() || file.path,
    path: file.path,
    findings: file.findings,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-gray-50">
        <p className="text-sm text-gray-500">
          No problematic files found yet.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 10,
            right: 20,
            left: 20,
            bottom: 10,
          }}
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
            tick={{ fontSize: 12 }}
          />

          <Tooltip
            formatter={(value) => [
              value,
              'Findings',
            ]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.path ?? ''
            }
          />

          <Bar
            dataKey="findings"
            radius={[0, 6, 6, 0]}
            fill="#4f46e5"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}