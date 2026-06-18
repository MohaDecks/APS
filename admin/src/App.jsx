import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Reports from './pages/Reports';
import DailyReport from './pages/reports/DailyReport';
import WeeklyReport from './pages/reports/WeeklyReport';
import MonthlyReport from './pages/reports/MonthlyReport';
import Invoices from './pages/Invoices';
import PaymentMethods from './pages/PaymentMethods';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (user.role !== 'admin') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="history" element={<History />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/daily" element={<DailyReport />} />
        <Route path="reports/weekly" element={<WeeklyReport />} />
        <Route path="reports/monthly" element={<MonthlyReport />} />
        <Route path="users" element={<Users />} />
        <Route path="payments" element={<PaymentMethods />} />
        <Route path="settings" element={<Settings />} />
        <Route path="terminal" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
