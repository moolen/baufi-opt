import React, { useEffect, useRef } from 'react';
import { MonthRecord } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Coins, Calendar } from 'lucide-react';

interface AmortizationTableProps {
  data: MonthRecord[];
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Logic to scroll to the current month on mount or data change
    if (containerRef.current && data.length > 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Find index of the first record that is >= current month
      const targetIndex = data.findIndex(record => {
        const rYear = record.date.getFullYear();
        const rMonth = record.date.getMonth();
        return rYear > currentYear || (rYear === currentYear && rMonth >= currentMonth);
      });

      // If we found a target (and it's not the very first one which shows anyway), scroll to it
      if (targetIndex > 0) {
        const rowId = `amort-row-${targetIndex}`;
        const rowElement = document.getElementById(rowId);
        
        if (rowElement) {
          // Calculate offset relative to the container (subtract header height ~45px)
          const headerHeight = 45; 
          containerRef.current.scrollTop = rowElement.offsetTop - headerHeight;
        }
      } else {
        // Reset scroll if start date is in future or reset needed
        containerRef.current.scrollTop = 0;
      }
    }
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          Tilgungsplan
        </h3>
        <span className="text-xs text-gray-500">{data.length} Monate Gesamt</span>
      </div>
      
      <div className="overflow-y-auto flex-1 relative" ref={containerRef}>
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 bg-gray-50">Datum</th>
              <th className="px-4 py-3 text-right bg-gray-50">Rate</th>
              <th className="px-4 py-3 text-right bg-gray-50">Zinsen</th>
              <th className="px-4 py-3 text-right bg-gray-50">Tilgung</th>
              <th className="px-4 py-3 text-right bg-gray-50">Sondertilgung</th>
              <th className="px-4 py-3 text-right bg-gray-50">Restschuld</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((record, index) => (
              <tr 
                key={record.monthIndex} 
                id={`amort-row-${index}`}
                className={`hover:bg-gray-50 transition-colors ${record.specialPayment > 0 ? 'bg-green-50/60' : ''} ${record.isFixedPeriodEnd ? 'bg-amber-50' : ''}`}
              >
                <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">
                  {formatDate(record.date)}
                  {record.isFixedPeriodEnd && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Ende Zinsbindung</span>}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap font-medium text-gray-700">
                  {formatCurrency(record.totalPayment)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-red-600">
                  {formatCurrency(record.interest)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-brand-600">
                  {formatCurrency(record.principal)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                   {record.specialPayment > 0 ? (
                     <span className="inline-flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full text-xs">
                       <Coins size={12} />
                       +{formatCurrency(record.specialPayment)}
                     </span>
                   ) : '-'}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap font-medium text-gray-900">
                  {formatCurrency(record.remainingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};