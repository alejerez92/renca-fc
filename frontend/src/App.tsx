import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PublicDashboard from './PublicDashboard'
import AdminDashboard from './AdminDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
