import { Loan, MonthRecord, CalculationResult, RepaymentType } from '../types';

export const calculateAmortization = (loan: Loan): CalculationResult => {
  const { amount, interestRate, startDate, fixedInterestYears, repaymentType, repaymentValue, specialPayments } = loan;
  
  const schedule: MonthRecord[] = [];
  let currentBalance = amount;
  let totalInterest = 0;
  
  const start = new Date(startDate);
  // Normalize to first of month for calculation ease, though typical banking math can be day-exact. 
  // For this app, monthly resolution is standard.
  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
  
  const fixedPeriodEndDate = new Date(start.getFullYear() + fixedInterestYears, start.getMonth(), start.getDate());
  
  // Calculate monthly payment (Annuität)
  let monthlyPayment = 0;
  
  if (repaymentType === RepaymentType.ABSOLUTE) {
    monthlyPayment = repaymentValue;
  } else {
    // Initial repayment % + Interest Rate % = Annuity %
    // Monthly Payment = Loan Amount * (Interest + Tilgung) / 100 / 12
    monthlyPayment = amount * (interestRate + repaymentValue) / 100 / 12;
  }

  const monthlyInterestRate = interestRate / 100 / 12;
  
  let monthIndex = 0;
  let isPaidOff = false;
  let remainingAtFixedEnd = 0;
  let fixedPeriodEndRecorded = false;

  // Safety break: max 60 years or until paid off
  while (!isPaidOff && monthIndex < 720) {
    const interest = currentBalance * monthlyInterestRate;
    
    // Regular principal payment (Tilgung)
    let principal = monthlyPayment - interest;
    
    // Check for special payments in this month
    // We match by YYYY-MM
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed
    
    const extras = specialPayments.filter(sp => {
      const spDate = new Date(sp.date);
      return spDate.getFullYear() === currentYear && spDate.getMonth() === currentMonth;
    });
    
    const specialPaymentTotal = extras.reduce((sum, sp) => sum + sp.amount, 0);
    
    // Adjust principal if it exceeds remaining balance
    if (principal + specialPaymentTotal > currentBalance) {
      principal = currentBalance - specialPaymentTotal;
      // If result is negative (special payment covers everything), logic holds: 
      // currentBalance will become negative or zero in next step properly handled below
    }

    // Actual deduction
    const totalDeduction = principal + specialPaymentTotal;
    // Handle case where total payment exceeds balance (last month)
    let payForMonth = totalDeduction + interest;
    if (currentBalance + interest < payForMonth) {
        payForMonth = currentBalance + interest;
    }

    currentBalance -= totalDeduction;
    
    // Floating point correction
    if (currentBalance < 0.01) currentBalance = 0;
    
    totalInterest += interest;

    const isFixedEnd = 
      !fixedPeriodEndRecorded && 
      currentDate.getTime() >= fixedPeriodEndDate.getTime();

    if (isFixedEnd) {
      remainingAtFixedEnd = currentBalance;
      fixedPeriodEndRecorded = true;
    }

    schedule.push({
      date: new Date(currentDate),
      monthIndex,
      interest,
      principal,
      specialPayment: specialPaymentTotal,
      totalPayment: payForMonth,
      remainingBalance: currentBalance,
      isFixedPeriodEnd: isFixedEnd
    });

    if (currentBalance <= 0) {
      isPaidOff = true;
    }

    // Next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    monthIndex++;
  }

  // If fixed period is longer than payoff, set remaining to 0
  if (!fixedPeriodEndRecorded) {
      remainingAtFixedEnd = 0;
  }

  return {
    schedule,
    totalInterest,
    payoffDate: schedule[schedule.length - 1].date,
    fixedPeriodEndDate,
    remainingAtFixedEnd
  };
};

// Compare base scenario (no special payments) vs actual scenario
export const calculateComparison = (loan: Loan) => {
  const baseLoan = { ...loan, specialPayments: [] };
  const baseResult = calculateAmortization(baseLoan);
  const actualResult = calculateAmortization(loan);

  const interestSaved = baseResult.totalInterest - actualResult.totalInterest;
  
  // Calculate time saved
  const baseMonths = baseResult.schedule.length;
  const actualMonths = actualResult.schedule.length;
  const monthsSaved = Math.max(0, baseMonths - actualMonths);

  // Savings at end of fixed period
  // We need to find the cumulative interest paid up to fixed period end for both
  const getInterestUntilFixed = (res: CalculationResult) => {
     let sum = 0;
     for (const rec of res.schedule) {
       sum += rec.interest;
       if (rec.isFixedPeriodEnd || rec.date > res.fixedPeriodEndDate) break;
     }
     return sum;
  };

  const interestFixedBase = getInterestUntilFixed(baseResult);
  const interestFixedActual = getInterestUntilFixed(actualResult);
  const interestSavedAtFixedEnd = interestFixedBase - interestFixedActual;
  const capitalDifferenceAtFixedEnd = Math.max(0, baseResult.remainingAtFixedEnd - actualResult.remainingAtFixedEnd);

  return {
    baseResult,
    actualResult,
    interestSaved,
    monthsSaved,
    interestSavedAtFixedEnd,
    capitalDifferenceAtFixedEnd
  };
};

// Calculate the specific impact of ONE special payment
export const calculatePaymentImpact = (loan: Loan, paymentId: string) => {
  // 1. Calculate Status Quo (with all payments)
  const currentResult = calculateAmortization(loan);

  // 2. Calculate what would happen WITHOUT this specific payment
  const loanWithoutPayment = {
    ...loan,
    specialPayments: loan.specialPayments.filter(p => p.id !== paymentId)
  };
  const resultWithoutPayment = calculateAmortization(loanWithoutPayment);

  // 3. The difference is the impact
  const interestSaved = Math.max(0, resultWithoutPayment.totalInterest - currentResult.totalInterest);
  const monthsSaved = Math.max(0, resultWithoutPayment.schedule.length - currentResult.schedule.length);

  return {
    interestSaved,
    monthsSaved
  };
};