'use client';

import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueChartProps {
  data: { date: Date | string; amount: number }[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const formattedData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    amount: Number(item.amount),
  }));

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value}`} />
              <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [`Rs ${value}`, 'Revenue']} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
