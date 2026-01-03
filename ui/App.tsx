import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, Trash2, Edit2, Calculator, Save, TrendingDown, Clock, Sparkles } from 'lucide-react';
import { Loan, SpecialPayment } from './types';
import { calculateAmortization, calculateComparison, calculatePaymentImpact } from './utils/finance';
import { LoanForm } from './components/LoanForm';
import { AmortizationChart } from './components/AmortizationChart';
import { AmortizationTable } from './components/AmortizationTable';
import { SummaryCard } from './components/SummaryCard';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { dateToInputString, isoToGerman, germanToIso } from './utils/formatters';
import { loansAPI, paymentsAPI } from './utils/api';

function App() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>(undefined);

  // Special Payment Form State
  const [paymentForm, setPaymentForm] = useState<{date: string, amount: string}>({
    date: '',
    amount: ''
  });
  const [paymentDateError, setPaymentDateError] = useState<string | undefined>(undefined);

  // Load loans from backend on mount
  useEffect(() => {
    const loadLoans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await loansAPI.getAll();
        setLoans(data);
        if (data.length > 0) setSelectedLoanId(data[0].id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load loans';
        setError(message);
        console.error('Error loading loans:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, []);

  const selectedLoan = useMemo(() => 
    loans.find(l => l.id === selectedLoanId), 
    [loans, selectedLoanId]
  );

  const calculations = useMemo(() => {
    if (!selectedLoan) return null;
    return calculateAmortization(selectedLoan);
  }, [selectedLoan]);

  const comparison = useMemo(() => {
    if (!selectedLoan) return null;
    return calculateComparison(selectedLoan);
  }, [selectedLoan]);

  // Calculate impact for each payment individually for gamification display
  const paymentsWithImpact = useMemo(() => {
    if (!selectedLoan) return [];
    
    // Sort by date
    const sorted = [...selectedLoan.specialPayments].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map(payment => {
      const impact = calculatePaymentImpact(selectedLoan, payment.id);
      return { ...payment, impact };
    });
  }, [selectedLoan]);

  const handleSaveLoan = async (loan: Loan) => {
    try {
      if (editingLoan) {
        // Update existing loan
        const updated = await loansAPI.update(loan.id, loan);
        setLoans(prev => prev.map(l => l.id === loan.id ? updated : l));
      } else {
        // Create new loan
        const created = await loansAPI.create({
          name: loan.name,
          amount: loan.amount,
          interestRate: loan.interestRate,
          startDate: loan.startDate,
          fixedInterestYears: loan.fixedInterestYears,
          repaymentType: loan.repaymentType,
          repaymentValue: loan.repaymentValue,
        });
        setLoans(prev => [...prev, created]);
        setSelectedLoanId(created.id);
      }
      setIsLoanModalOpen(false);
      setEditingLoan(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save loan';
      alert(`Error: ${message}`);
      console.error('Error saving loan:', err);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (confirm('Möchten Sie diesen Kredit wirklich löschen?')) {
      try {
        await loansAPI.delete(id);
        const newLoans = loans.filter(l => l.id !== id);
        setLoans(newLoans);
        if (selectedLoanId === id) {
          setSelectedLoanId(newLoans.length > 0 ? newLoans[0].id : null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete loan';
        alert(`Error: ${message}`);
        console.error('Error deleting loan:', err);
      }
    }
  };

  const handleChartClick = (data: any) => {
    // data comes from the chart payload. The chart data has `date` as a Date object.
    const date = new Date(data.date);
    // Convert to German format for the form
    setPaymentForm({
      date: isoToGerman(dateToInputString(date)),
      amount: '5000' // Default suggestion
    });
    setPaymentDateError(undefined);
    setIsPaymentModalOpen(true);
  };

  const handleAddSpecialPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !paymentForm.amount || !paymentForm.date) return;

    // Convert German input back to ISO for storage
    const isoDate = germanToIso(paymentForm.date);
    if (!isoDate) {
      setPaymentDateError("Ungültiges Datum (TT.MM.JJJJ)");
      return;
    }

    try {
      const newPayment = await paymentsAPI.create(selectedLoan.id, {
        date: isoDate,
        amount: parseFloat(paymentForm.amount),
        note: 'Sondertilgung',
      });

      const updatedLoan = {
        ...selectedLoan,
        specialPayments: [...selectedLoan.specialPayments, newPayment]
      };

      setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
      setIsPaymentModalOpen(false);
      setPaymentDateError(undefined);
      setPaymentForm({ date: '', amount: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add payment';
      alert(`Error: ${message}`);
      console.error('Error adding payment:', err);
    }
  };

  const handleRemovePayment = async (paymentId: string) => {
    if (!selectedLoan) return;
    try {
      await paymentsAPI.delete(selectedLoan.id, paymentId);
      const updatedLoan = {
        ...selectedLoan,
        specialPayments: selectedLoan.specialPayments.filter(p => p.id !== paymentId)
      };
      setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove payment';
      alert(`Error: ${message}`);
      console.error('Error removing payment:', err);
    }
  };

  const openNewPaymentModal = () => {
    const today = new Date();
    setPaymentForm({ date: isoToGerman(dateToInputString(today)), amount: '' });
    setPaymentDateError(undefined);
    setIsPaymentModalOpen(true);
  };

  const formatMonths = (months: number) => {
    if (months === 0) return '';
    if (months < 12) return `${months} Mon.`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y} J. ${m} M.` : `${y} Jahre`;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col md:h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2 text-brand-700">
          <Calculator size={24} />
          <h1 className="font-bold text-xl">FinanzPlaner</h1>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Meine Kredite</h2>
            <button 
              onClick={() => { setEditingLoan(undefined); setIsLoanModalOpen(true); }}
              className="p-1 hover:bg-gray-100 rounded-md text-brand-600 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-2">
            {loans.map(loan => (
              <div 
                key={loan.id}
                onClick={() => setSelectedLoanId(loan.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedLoanId === loan.id ? 'bg-brand-50 border-brand-200 shadow-sm' : 'hover:bg-gray-50 border-transparent'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-medium ${selectedLoanId === loan.id ? 'text-brand-900' : 'text-gray-700'}`}>{loan.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(loan.amount)}
                    </p>
                  </div>
                  {selectedLoanId === loan.id && (
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingLoan(loan); setIsLoanModalOpen(true); }} className="p-1 text-gray-400 hover:text-brand-600">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteLoan(loan.id); }} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loans.length === 0 && (
              <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-lg">
                <Wallet className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-500">Keine Kredite vorhanden.</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => setIsLoanModalOpen(true)}>
                  Ersten Kredit anlegen
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-brand-600 text-lg font-semibold mb-2">Laden...</div>
              <p className="text-gray-500 text-sm">Kredite werden geladen...</p>
            </div>
          </div>
        ) : !selectedLoan || !calculations || !comparison ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            {loans.length > 0 ? 'Wählen Sie einen Kredit aus.' : 'Legen Sie los, indem Sie einen Kredit hinzufügen.'}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedLoan.name}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Start: {new Date(selectedLoan.startDate).toLocaleDateString('de-DE')} • 
                  Zins: {selectedLoan.interestRate}% • 
                  Bindung: {selectedLoan.fixedInterestYears} Jahre
                </p>
              </div>
              <div className="flex gap-2">
                 <Button onClick={openNewPaymentModal}>
                   <Plus size={16} className="mr-2" />
                   Sondertilgung
                 </Button>
              </div>
            </div>

            <SummaryCard comparison={comparison} payoffDate={calculations.payoffDate} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <div className="lg:col-span-2 space-y-6">
                <AmortizationChart 
                  data={calculations.schedule} 
                  onChartClick={handleChartClick} 
                  fixedPeriodEnd={calculations.fixedPeriodEndDate}
                />
                <AmortizationTable data={calculations.schedule} />
              </div>

              {/* Sidebar Info / Payment List */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Save size={18} className="text-brand-600"/>
                    Geplante Sondertilgungen
                  </h3>
                  
                  {paymentsWithImpact.length === 0 ? (
                    <p className="text-sm text-gray-500 italic text-center py-4">
                      Noch keine Sondertilgungen. Klicken Sie in das Diagramm oder oben rechts auf "Sondertilgung", um zu sehen, wie viel Zinsen Sie sparen können.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {paymentsWithImpact.map(payment => (
                        <div key={payment.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                          {/* Background decoration for positive impact */}
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-50 to-transparent rounded-bl-3xl -mr-8 -mt-8 opacity-50"></div>

                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <p className="font-bold text-gray-900 text-lg">
                                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payment.amount)}
                                </p>
                                <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString('de-DE')}</p>
                              </div>
                              
                              {/* Impact Stats */}
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                                  <TrendingDown size={12} />
                                  <span>-{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payment.impact.interestSaved)} Zinsen</span>
                                </div>
                                {payment.impact.monthsSaved > 0 && (
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                                    <Clock size={12} />
                                    <span>-{formatMonths(payment.impact.monthsSaved)} Laufzeit</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button 
                              onClick={() => handleRemovePayment(payment.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              title="Löschen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          {/* Gamification Badge if impact is significant */}
                          {payment.impact.interestSaved > 1000 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
                              <Sparkles size={12} className="text-amber-500" />
                              <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">
                                {payment.impact.interestSaved > 5000 ? "Massiver Impact!" : "Tolle Ersparnis!"}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
        title={editingLoan ? "Kredit bearbeiten" : "Neuen Kredit anlegen"}
      >
        <LoanForm 
          initialData={editingLoan} 
          onSave={handleSaveLoan} 
          onCancel={() => setIsLoanModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Sondertilgung hinzufügen"
      >
        <form onSubmit={handleAddSpecialPayment} className="space-y-4">
          <Input 
            label="Datum" 
            type="text"
            placeholder="TT.MM.JJJJ"
            value={paymentForm.date} 
            onChange={(e) => {
              setPaymentForm(prev => ({...prev, date: e.target.value}));
              setPaymentDateError(undefined);
            }}
            error={paymentDateError}
            required
          />
          <Input 
            label="Betrag (€)" 
            type="number" 
            min="0.01"
            step="0.01"
            value={paymentForm.amount} 
            onChange={(e) => setPaymentForm(prev => ({...prev, amount: e.target.value}))}
            required
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Abbrechen</Button>
            <Button type="submit">Hinzufügen</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default App;