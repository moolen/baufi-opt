import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { MonthRecord } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';

interface AmortizationChartProps {
  data: MonthRecord[];
  onChartClick: (data: any) => void;
  fixedPeriodEnd?: Date;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({ data, onChartClick, fixedPeriodEnd }) => {
  
  // Downsample data for better performance if too many months
  const chartData = data.filter((_, idx) => idx % 3 === 0 || idx === 0 || idx === data.length - 1).map(d => ({
    ...d,
    dateStr: formatDate(d.date),
    timestamp: d.date.getTime(),
    balance: Math.round(d.remainingBalance),
  }));

  const handleChartClick = (props: any) => {
    if (props && props.activePayload && props.activePayload.length > 0) {
      const clickedData = props.activePayload[0].payload;
      onChartClick(clickedData);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-brand-600">
            Restschuld: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Klicken für Sondertilgung</p>
        </div>
      );
    }
    return null;
  };

  const fixedEndTimestamp = fixedPeriodEnd ? fixedPeriodEnd.getTime() : null;

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Verlauf der Restschuld</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          onClick={handleChartClick}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="dateStr" 
            tick={{fontSize: 12, fill: '#6b7280'}}
            tickLine={false}
            axisLine={{stroke: '#e5e7eb'}}
            minTickGap={50}
          />
          <YAxis 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            tick={{fontSize: 12, fill: '#6b7280'}}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0ea5e9', strokeWidth: 1, strokeDasharray: '4 4' }} />
          
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#0ea5e9" 
            strokeWidth={3}
            fill="url(#colorBalance)" 
            fillOpacity={0.1}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#0284c7' }}
          />
          
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>

          {fixedEndTimestamp && (
             <ReferenceLine 
                x={formatDate(fixedPeriodEnd!)} 
                stroke="#f59e0b" 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Zinsbindung Ende', 
                  position: 'insideTopRight', 
                  fill: '#d97706',
                  fontSize: 12 
                }} 
             />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};