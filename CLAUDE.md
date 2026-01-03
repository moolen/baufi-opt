# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Baufinanzierungs-Optimierer** (Mortgage Optimizer) is a React + TypeScript web application for calculating and optimizing loan repayment schedules. Users can create multiple loans, simulate special payments (Sondertilgungen), and visualize amortization schedules with interest impact analysis.

The UI is built with **Vite**, **React 19**, **Tailwind CSS**, **Recharts** for visualizations, and **Lucide React** for icons.

## Commands

All commands should be run from the `/ui` directory:

```bash
# Development
npm run dev        # Start Vite dev server on http://localhost:3000

# Production Build
npm run build      # Generate optimized build in dist/

# Preview
npm run preview    # Preview the built app locally
```

## Project Structure

### Core Architecture

- **App.tsx**: Main application component managing loan state, modals, and calculations.
- **types.ts**: Central type definitions (`Loan`, `MonthRecord`, `CalculationResult`, `SpecialPayment`, `RepaymentType`).
- **utils/finance.ts**: Core calculation engine. Exports:
  - `calculateAmortization()`: Generates month-by-month amortization schedule
  - `calculateComparison()`: Compares loan with/without special payments
  - `calculatePaymentImpact()`: Calculates interest/time savings for individual special payments
- **utils/formatters.ts**: Date and currency formatting utilities with German locale handling (ISO ↔ German date format conversion)

### Component Structure

- **components/LoanForm.tsx**: Modal form for creating/editing loans with date validation
- **components/AmortizationChart.tsx**: Recharts visualization showing balance/interest progression with clickable points
- **components/AmortizationTable.tsx**: Detailed month-by-month repayment table
- **components/SummaryCard.tsx**: Key metrics display (total interest, payoff date, comparison stats)
- **components/Modal.tsx**: Reusable modal wrapper
- **components/Button.tsx**, **Input.tsx**: Reusable UI primitives with Tailwind styling

### Data Flow

1. User creates/edits loans in `LoanForm` → stored in `App.tsx` state -> stored via /api/loans API in the database.
2. Selected loan flows through `useMemo` calculations in `App.tsx`
3. Calculations feed into chart and table components for visualization
4. Special payments trigger recalculation of impacts via `calculatePaymentImpact()`

### UI Styling

- **Tailwind CSS** for all styling with a custom `brand-*` color palette (see `index.html`)
- Responsive design with `md:` breakpoints (sidebar collapses on mobile)
- Component library pattern with primitive components (`Button`, `Input`)

## Key Implementation Details

### Date Handling
- Internal storage: ISO format (YYYY-MM-DD)
- User input/display: German format (DD.MM.YYYY)
- Conversion functions: `isoToGerman()`, `germanToIso()` in `utils/formatters.ts`
- The app normalizes loan dates to the first of the month for calculation consistency

### Loan Calculations
- **RepaymentType**: `PERCENTAGE` (Tilgung % + interest = annuity) or `ABSOLUTE` (fixed monthly rate in €)
- Monthly payment calculation depends on repayment type (see `calculateAmortization()` lines 20-26)
- Special payments are matched by year-month, not exact day
- Balance is floored at 0 to avoid floating-point errors
- Fixed interest period end date is tracked separately to show when rate renewal will occur

### Special Payments (Sondertilgungen)
- Each payment is stored with `id`, `date`, `amount`, and optional `note`
- Impact calculation creates temporary loan scenarios to measure interest saved and months reduced
- Displayed with gamification badges ("Tolle Ersparnis!", "Massiver Impact!") when impact exceeds €1,000

## Vite Configuration

- **Port**: 3000 (customizable via `vite.config.ts`)
- **Environment Variables**: Loads from `.env.local` but primarily focuses on `GEMINI_API_KEY` (currently unused in calculations)
- **Path Aliases**: `@/*` resolves to repository root for cleaner imports
- **React Plugin**: Uses `@vitejs/plugin-react` with SWC-based transform

## Common Development Tasks

### Adding a New Loan Property
1. Update `Loan` interface in `types.ts`
2. Update `LoanForm.tsx` to include the new field
3. Update calculation logic in `utils/finance.ts` if it affects amortization
4. Update relevant components (`SummaryCard`, `AmortizationTable`, etc.) to display the property

### Extending Calculations
- All financial calculations centralize in `utils/finance.ts`
- Calculation results are memoized in `App.tsx` to avoid recalculation on every render
- Be aware that special payments are matched by YYYY-MM, not exact date

### UI Changes
- Use Tailwind classes with the `brand-*` custom colors for consistency
- Update modal overlays and button states in `components/Modal.tsx` and `components/Button.tsx`
- Chart customization happens in `components/AmortizationChart.tsx` (Recharts config)

## Testing & Debugging

- Vite dev server provides HMR (hot module reload) for instant feedback
- `React.StrictMode` in `index.tsx` helps catch side-effect issues in development
