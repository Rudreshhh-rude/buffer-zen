import { useState } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import Strategy from './Strategy';

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const handleSignOut = () => {
    setSession(null);
    setCurrentView('dashboard');
  };

  const handleDemoLogin = () => {
    setSession({ user: { id: 'demo-user-777', email: 'demo@bufferzen.com' } });
  };

  if (!session) {
    return <Auth onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className="min-h-screen bg-buf-bg text-stone-100 font-sans">
      {currentView === 'dashboard' && <Dashboard user={session.user} onSignOut={handleSignOut} currentView={currentView} onViewChange={setCurrentView} />}
      {currentView === 'analytics' && <Analytics currentView={currentView} onViewChange={setCurrentView} onSignOut={handleSignOut} />}
      {currentView === 'strategy' && <Strategy currentView={currentView} onViewChange={setCurrentView} onSignOut={handleSignOut} />}
    </div>
  );
}

export default App;
