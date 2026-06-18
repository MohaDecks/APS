import ReportView from '../../components/ReportView';
import { getTodayDate, getDaysAgoDate } from '../../lib/date';

export default function WeeklyReport() {
  return (
    <ReportView
      title="Weekly Report"
      subtitle="Revenue summary for the past 7 days"
      defaultFrom={getDaysAgoDate(6)}
      defaultTo={getTodayDate()}
      breakdownTitle="Revenue by Day"
      exportPrefix="weekly-report"
    />
  );
}
