import { Routes, Route } from 'react-router'
import { Toaster } from "@/components/ui/sonner"
import Dashboard from './pages/Dashboard'
import TransactionsPage from './pages/Transactions'
import JournalPage from './pages/Journal'
import AccountsPage from './pages/Accounts'
import ContactsPage from './pages/Contacts'
import ReportsPage from './pages/Reports'
import SettingsPage from './pages/Settings'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-center" />
    </>
  )
}
