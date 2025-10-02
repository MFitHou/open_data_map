import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SimpleMap from './components/map/SimpleMap';

function App() {

  return (
    <>
      <div style={{ height: "100%", width: "100%" }}>
        <SimpleMap />
      </div>
    </>
  )
}

export default App
