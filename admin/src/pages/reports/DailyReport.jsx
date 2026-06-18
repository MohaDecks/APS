import ReportView from '../../components/ReportView';
import { getTodayDate } from '../../lib/date';

export default function DailyReport() {
  const today = getTodayDate();
  return (
    <ReportView
      title="Daily Report"
      subtitle="Session and revenue detail for a single day"
      defaultFrom={today}
      defaultTo={today}
      breakdownTitle="Revenue by Hour"
      exportPrefix="daily-report"
      preferHourly
    />
  );
}
