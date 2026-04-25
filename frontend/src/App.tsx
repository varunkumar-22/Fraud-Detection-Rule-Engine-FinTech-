import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/shared/Sidebar';
import Dashboard from './pages/Dashboard';
import Rules from './pages/Rules';
import Simulate from './pages/Simulate';
import Results from './pages/Results';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/rules"    element={<Rules />} />
            <Route path="/simulate" element={<Simulate />} />
            <Route path="/results"  element={<Results />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
