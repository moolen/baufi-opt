import React, { useState, useEffect } from 'react';
import { Loan, RepaymentType } from '../types';
import { Input } from './Input';
import { Button } from './Button';
import { dateToInputString, isoToGerman, germanToIso } from '../utils/formatters';

interface LoanFormProps {
  initialData?: Loan;
  onSave: (loan: Loan) => void;
  onCancel: () => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({ initialData, onSave, onCancel }) => {
  // We keep a separate local state for the date input string to allow "typing" freely
  const [startDateInput, setStartDateInput] = useState('');
  const [dateError, setDateError] = useState<string | undefined>(undefined);

  const [formData, setFormData] = useState<Partial<Loan>>({
    name: 'Mein Hauskredit',
    amount: 300000,
    interestRate: 3.5,
    startDate: dateToInputString(new Date()),
    fixedInterestYears: 10,
    repaymentType: RepaymentType.PERCENTAGE,
    repaymentValue: 2.0,
    specialPayments: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setStartDateInput(isoToGerman(initialData.startDate));
    } else {
      // Default init
      const today = dateToInputString(new Date());
      setStartDateInput(isoToGerman(today));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Date
    const isoDate = germanToIso(startDateInput);
    if (!isoDate) {
      setDateError('Bitte geben Sie ein gültiges Datum ein (TT.MM.JJJJ)');
      return;
    }

    if (!formData.name || !formData.amount) return;

    onSave({
      id: initialData?.id || crypto.randomUUID(),
      name: formData.name,
      amount: Number(formData.amount),
      interestRate: Number(formData.interestRate),
      startDate: isoDate, // Save as ISO
      fixedInterestYears: Number(formData.fixedInterestYears),
      repaymentType: formData.repaymentType!,
      repaymentValue: Number(formData.repaymentValue),
      specialPayments: formData.specialPayments || []
    });
  };

  const handleChange = (field: keyof Loan, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateInputChange = (val: string) => {
    setStartDateInput(val);
    setDateError(undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Bezeichnung"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        required
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Darlehensbetrag (€)"
          type="number"
          min="1000"
          step="1000"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          required
        />
        <Input
          label="Sollzins (% p.a.)"
          type="number"
          min="0.1"
          step="0.01"
          value={formData.interestRate}
          onChange={(e) => handleChange('interestRate', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Beginn der Rückzahlung"
          type="text"
          placeholder="TT.MM.JJJJ"
          value={startDateInput}
          onChange={(e) => handleDateInputChange(e.target.value)}
          error={dateError}
          required
        />
        <Input
          label="Sollzinsbindung (Jahre)"
          type="number"
          min="1"
          max="40"
          value={formData.fixedInterestYears}
          onChange={(e) => handleChange('fixedInterestYears', e.target.value)}
          required
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Art der Rückzahlung</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="repaymentType"
              checked={formData.repaymentType === RepaymentType.PERCENTAGE}
              onChange={() => handleChange('repaymentType', RepaymentType.PERCENTAGE)}
              className="text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm">Anfängliche Tilgung in %</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="repaymentType"
              checked={formData.repaymentType === RepaymentType.ABSOLUTE}
              onChange={() => handleChange('repaymentType', RepaymentType.ABSOLUTE)}
              className="text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm">Monatliche Rate in €</span>
          </label>
        </div>
        
        <Input
          label={formData.repaymentType === RepaymentType.PERCENTAGE ? "Tilgungssatz (%)" : "Monatliche Rate (€)"}
          type="number"
          step={formData.repaymentType === RepaymentType.PERCENTAGE ? "0.1" : "10"}
          value={formData.repaymentValue}
          onChange={(e) => handleChange('repaymentValue', e.target.value)}
          required
        />
        {formData.repaymentType === RepaymentType.PERCENTAGE && formData.amount && formData.interestRate && formData.repaymentValue && (
          <p className="text-xs text-gray-500 mt-2">
            Entspricht einer monatlichen Rate von ca. 
            <span className="font-medium text-gray-900 ml-1">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                Number(formData.amount) * (Number(formData.interestRate) + Number(formData.repaymentValue)) / 100 / 12
              )}
            </span>
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit">Speichern</Button>
      </div>
    </form>
  );
};