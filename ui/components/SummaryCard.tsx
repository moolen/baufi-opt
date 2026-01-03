import React from 'react';
import { PiggyBank, Clock, TrendingDown, Target } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SummaryCardProps {
  comparison: any;
  payoffDate: Date;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ comparison, payoffDate }) => {
  const { interestSaved, monthsSaved, interestSavedAtFixedEnd, capitalDifferenceAtFixedEnd } = comparison;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <PiggyBank size={24} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Zinsersparnis (Gesamt)</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(interestSaved)}</p>
        <p className="text-xs text-green-600 mt-1">Durch Sondertilgungen gespart</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Clock size={24} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Laufzeitverkürzung</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {Math.floor(monthsSaved / 12)} <span className="text-lg font-normal text-gray-500">Jahre</span> {monthsSaved % 12} <span className="text-lg font-normal text-gray-500">Monate</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Schuldenfrei am: {formatDate(payoffDate)}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <Target size={24} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Effekt Zinsbindung</span>
        </div>
        <p className="text-xl font-bold text-gray-900">{formatCurrency(capitalDifferenceAtFixedEnd)}</p>
        <p className="text-xs text-gray-500 mt-1">Weniger Restschuld am Ende der Zinsbindung</p>
      </div>
       
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <TrendingDown size={24} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Zinsersparnis (Fix)</span>
        </div>
        <p className="text-xl font-bold text-gray-900">{formatCurrency(interestSavedAtFixedEnd)}</p>
        <p className="text-xs text-gray-500 mt-1">Während der Sollzinsbindung</p>
      </div>

    </div>
  );
};