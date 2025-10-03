import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/home/Home';
import SimpleMap from './components/map/SimpleMap';

function App() {
  return (
    <Router>
      <div style={{ height: "100%", width: "100%" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<SimpleMap />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
