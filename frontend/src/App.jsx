import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import PreferencesPage from './pages/PreferencesPage'
import ConcertPickerPage from './pages/ConcertPickerPage'
import ResultsPage from './pages/ResultsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/preferences" element={<PreferencesPage />} />
      <Route path="/picker" element={<ConcertPickerPage />} />
      <Route path="/results" element={<ResultsPage />} />
    </Routes>
  )
}

export default App