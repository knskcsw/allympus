import type {
  SalaryEntry,
  NumericSalaryKey,
  DeductionLabel,
  EditableSalaryKey,
} from "@/types/salary";

/**
 * Currency formatter for Japanese Yen
 */
const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

/**
 * Format a number as Japanese currency
 */
export const formatCurrency = (value: number): string =>
  currencyFormatter.format(Math.round(value));

/**
 * Sum a specific numeric field across all salary entries
 */
export const sumBy = (items: SalaryEntry[], key: NumericSalaryKey): number =>
  items.reduce((total, item) => total + item[key], 0);

/**
 * Calculate total deductions for a single salary entry
 */
export const getTotalDeductions = (row: SalaryEntry): number =>
  row.healthInsurance +
  row.pension +
  row.employmentInsurance +
  row.incomeTax +
  row.residentTax +
  row.otherDeductions;

/**
 * Deduction labels with display configuration
 */
export const DEDUCTION_LABELS: DeductionLabel[] = [
  { key: "healthInsurance", label: "健康保険料", color: "bg-[var(--chart-1)]" },
  { key: "pension", label: "厚生年金", color: "bg-[var(--chart-2)]" },
  { key: "employmentInsurance", label: "雇用保険料", color: "bg-[var(--chart-3)]" },
  { key: "incomeTax", label: "所得税", color: "bg-[var(--chart-4)]" },
  { key: "residentTax", label: "住民税", color: "bg-[var(--chart-5)]" },
  { key: "otherDeductions", label: "その他控除", color: "bg-muted-foreground" },
];

/**
 * Editable salary field keys for the table
 */
export const EDITABLE_SALARY_KEYS: EditableSalaryKey[] = [
  "gross",
  "net",
  "healthInsurance",
  "pension",
  "employmentInsurance",
  "incomeTax",
  "residentTax",
  "otherDeductions",
  "bonus",
];

/**
 * Table header labels for salary fields
 */
export const SALARY_TABLE_HEADERS: { key: EditableSalaryKey; label: string }[] = [
  { key: "gross", label: "額面" },
  { key: "net", label: "手取り" },
  { key: "healthInsurance", label: "健康保険" },
  { key: "pension", label: "厚生年金" },
  { key: "employmentInsurance", label: "雇用保険" },
  { key: "incomeTax", label: "所得税" },
  { key: "residentTax", label: "住民税" },
  { key: "otherDeductions", label: "その他" },
  { key: "bonus", label: "賞与" },
];
