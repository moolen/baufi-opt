import { Loan, SpecialPayment } from '../types';

const API_BASE = '/api';

// Error types
export class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Loans API
export const loansAPI = {
  /**
   * Get all loans
   */
  getAll: async (): Promise<Loan[]> => {
    const res = await fetch(`${API_BASE}/loans`);
    if (!res.ok) {
      throw new APIError(res.status, 'Failed to fetch loans');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a single loan with special payments
   */
  getOne: async (id: string): Promise<Loan> => {
    const res = await fetch(`${API_BASE}/loans/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new APIError(404, 'Loan not found');
      }
      throw new APIError(res.status, 'Failed to fetch loan');
    }
    return res.json();
  },

  /**
   * Create a new loan
   */
  create: async (
    loan: Omit<Loan, 'id' | 'specialPayments' | 'createdAt' | 'updatedAt'>
  ): Promise<Loan> => {
    const res = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to create loan' }));
      throw new APIError(res.status, error.error || 'Failed to create loan');
    }
    return res.json();
  },

  /**
   * Update an existing loan
   */
  update: async (id: string, loan: Partial<Loan>): Promise<Loan> => {
    const res = await fetch(`${API_BASE}/loans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan),
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new APIError(404, 'Loan not found');
      }
      const error = await res.json().catch(() => ({ error: 'Failed to update loan' }));
      throw new APIError(res.status, error.error || 'Failed to update loan');
    }
    return res.json();
  },

  /**
   * Delete a loan
   */
  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/loans/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new APIError(404, 'Loan not found');
      }
      throw new APIError(res.status, 'Failed to delete loan');
    }
  },
};

// Special Payments API
export const paymentsAPI = {
  /**
   * Create a special payment for a loan
   */
  create: async (
    loanId: string,
    payment: Omit<SpecialPayment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SpecialPayment> => {
    const res = await fetch(`${API_BASE}/loans/${loanId}/special-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new APIError(404, 'Loan not found');
      }
      const error = await res.json().catch(() => ({ error: 'Failed to create payment' }));
      throw new APIError(res.status, error.error || 'Failed to create payment');
    }
    return res.json();
  },

  /**
   * Delete a special payment
   */
  delete: async (loanId: string, paymentId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/loans/${loanId}/special-payments/${paymentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new APIError(404, 'Payment not found');
      }
      throw new APIError(res.status, 'Failed to delete payment');
    }
  },
};
