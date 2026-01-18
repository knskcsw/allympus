/**
 * Salary entry representing a single month's salary record
 */
export type SalaryEntry = {
  id: string;
  year: number;
  month: number;
  gross: number;
  net: number;
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  otherDeductions: number;
  bonus: number;
};

/**
 * Keys of SalaryEntry that are numeric (excludes 'id')
 */
export type NumericSalaryKey = Exclude<keyof SalaryEntry, "id">;

/**
 * Keys that represent editable salary fields in the table
 */
export type EditableSalaryKey =
  | "gross"
  | "net"
  | "healthInsurance"
  | "pension"
  | "employmentInsurance"
  | "incomeTax"
  | "residentTax"
  | "otherDeductions"
  | "bonus";

/**
 * Aggregated totals for salary summary
 */
export type SalaryTotals = {
  gross: number;
  net: number;
  bonus: number;
  deductions: number;
  averageNet: number;
};

/**
 * Deduction label configuration
 */
export type DeductionLabel = {
  key: NumericSalaryKey;
  label: string;
  color: string;
};

/**
 * Deduction total with value
 */
export type DeductionTotal = DeductionLabel & {
  value: number;
};

/**
 * Net trend item for chart
 */
export type NetTrendItem = {
  month: number;
  net: number;
};
