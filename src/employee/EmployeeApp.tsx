import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { EmployeeAuthProvider } from './EmployeeAuthContext';
import { EmployeeRequireAuth } from './components/EmployeeLayout';
import { EmployeeLoginPage } from './pages/EmployeeLoginPage';
import { EmployeeHomePage } from './pages/EmployeeHomePage';
import { EmployeeAttendancePage } from './pages/EmployeeAttendancePage';
import { EmployeeLeavePage } from './pages/EmployeeLeavePage';
import { EmployeeSchedulePage } from './pages/EmployeeSchedulePage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { EmployeeChangePasswordPage } from './pages/EmployeeChangePasswordPage';
import { EmployeeSalaryPage } from './pages/EmployeeSalaryPage';

export default function EmployeeApp() {
  useEffect(() => {
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const previous = manifest?.href;
    if (manifest) manifest.href = '/employee.webmanifest';
    return () => { if (manifest && previous) manifest.href = previous; };
  }, []);

  return <EmployeeAuthProvider><Routes><Route path="login" element={<EmployeeLoginPage />} /><Route path="/" element={<EmployeeRequireAuth />}><Route index element={<EmployeeHomePage />} /><Route path="change-password" element={<EmployeeChangePasswordPage />} /><Route path="attendance" element={<EmployeeAttendancePage />} /><Route path="leave" element={<EmployeeLeavePage />} /><Route path="schedule" element={<EmployeeSchedulePage />} /><Route path="salary" element={<EmployeeSalaryPage />} /><Route path="profile" element={<EmployeeProfilePage />} /></Route><Route path="*" element={<Navigate to="/employee" replace />} /></Routes></EmployeeAuthProvider>;
}
