export enum RepaymentType {
  PERCENTAGE = 'PERCENTAGE', // Tilgung in %
  ABSOLUTE = 'ABSOLUTE'      // Rate in €
}

export interface SpecialPayment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
}

export interface Loan {
  id: string;
  name: string;
  amount: number;         // Darlehensbetrag
  interestRate: number;   // Sollzins
  startDate: string;      // YYYY-MM-DD
  fixedInterestYears: number; // Sollzinsbindung
  repaymentType: RepaymentType;
  repaymentValue: number; // Value for % or € depending on type
  specialPayments: SpecialPayment[];
}

export interface MonthRecord {
  date: Date;
  monthIndex: number;
  interest: number;
  principal: number; // Regular principal payment
  specialPayment: number;
  totalPayment: number;
  remainingBalance: number;
  isFixedPeriodEnd: boolean;
}

export interface CalculationResult {
  schedule: MonthRecord[];
  totalInterest: number;
  payoffDate: Date;
  fixedPeriodEndDate: Date;
  remainingAtFixedEnd: number;
}