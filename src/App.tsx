import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Onboarding from './components/Onboarding'
import Today from './components/Today'
import MedicationList from './components/MedicationList'
import History from './components/History'
import Care from './components/Care'
import Settings from './components/Settings'

type Tab = 'today' | 'medications' | 'history' | 'care' | 'settings'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: '🕐' },
  { key: 'medications', label: 'Meds', icon: '💊' },
  { key: 'history', label: 'History', icon: '📈' },
  { key: 'care', label: 'Care', icon: '🤝' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]

function Shell() {
  const { state } = useApp()
  const [tab, setTab] = useState<Tab>('today')

  if (!state.onboarded) return <Onboarding />

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="logo">Medicina</span>
      </header>
      <main className="app-main">
        {tab === 'today' && <Today />}
        {tab === 'medications' && <MedicationList />}
        {tab === 'history' && <History />}
        {tab === 'care' && <Care />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t.key} className={t.key === tab ? 'tab active' : 'tab'} onClick={() => setTab(t.key)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
