import ReportView from '../../components/ReportView';
import { getTodayDate, getMonthStartDate } from '../../lib/date';

export default function MonthlyReport() {
  return (
    <ReportView
      title="Monthly Report"
      subtitle="Revenue summary for the current month"
      defaultFrom={getMonthStartDate()}
      defaultTo={getTodayDate()}
      breakdownTitle="Revenue by Day"
      exportPrefix="monthly-report"
    />
  );
}
