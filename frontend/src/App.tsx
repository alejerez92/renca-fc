import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PublicDashboard from './PublicDashboard'
import AdminDashboard from './AdminDashboard'
import Login from './Login'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App
