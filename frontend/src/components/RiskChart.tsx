import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { RiskContributionItem } from '../types';

interface RiskChartProps {
  contributions: RiskContributionItem[];
}

export const RiskChart: React.FC<RiskChartProps> = ({ contributions }) => {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500 font-medium">
        No risk contribution data available.
      </div>
    );
  }

  // Aggregate by group
  const groupMap: Record<string, { totalStrength: number; count: number }> = {};

  contributions.forEach((item) => {
    const rawGroup = item.group || 'general';
    if (!groupMap[rawGroup]) {
      groupMap[rawGroup] = { totalStrength: 0, count: 0 };
    }
    groupMap[rawGroup].totalStrength += item.strength || 0;
    groupMap[rawGroup].count += 1;
  });

  const chartData = Object.entries(groupMap).map(([groupKey, val]) => {
    const formattedGroup = groupKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const avgStrength = Number((val.totalStrength / val.count).toFixed(2));
    return {
      groupName: formattedGroup,
      rawKey: groupKey,
      strength: avgStrength,
      totalStrength: Number(val.totalStrength.toFixed(2)),
      count: val.count,
    };
  }).sort((a, b) => b.strength - a.strength);

  // Soft pastel bar colors matching theme
  const getBarColor = (strength: number) => {
    if (strength >= 0.7) return '#F8B4B4'; // Rose
    if (strength >= 0.4) return '#FDE8B8'; // Amber
    return '#A5B4FC'; // Pastel Indigo
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E8DFF5" horizontal={false} />
          <XAxis type="number" stroke="#6B6684" tick={{ fontSize: 11 }} domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="groupName"
            stroke="#2D2A3D"
            tick={{ fontSize: 11, fontWeight: 700 }}
            width={130}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-pastel-lilac p-3 rounded-xl text-xs space-y-1 shadow-lg">
                    <p className="font-extrabold text-slate-900">{data.groupName}</p>
                    <p className="text-slate-600 font-medium">
                      Average Risk Strength: <span className="font-mono font-bold text-pastel-indigo-dark">{data.strength}</span>
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      Clauses contributing: {data.count}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="strength" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.strength)} stroke="#6366F1" strokeWidth={0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
