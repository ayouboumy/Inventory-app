import React, { useState, useEffect } from 'react';
import { InventoryItem, ItemCategory, ViewState, OutputRecord } from './types';
import { Dashboard } from './components/Dashboard';
import { InventoryTable } from './components/InventoryTable';
import { AIChat } from './components/AIChat';
import { StockOutputs } from './components/StockOutputs';
import { LoginScreen } from './components/LoginScreen';
import { LayoutDashboard, Mic2, BookOpen, Sparkles, Menu, X, ArrowUpRight, LogOut } from 'lucide-react';

// Mock Initial Data
const INITIAL_DATA: InventoryItem[] = [
  { id: '1', name: 'Shure SM58', category: ItemCategory.SONORISATION, subsection: 'Microphones', quantity: 4, location: 'Main Hall', description: 'Standard vocal mic', minStockLevel: 2, lastUpdated: new Date().toISOString() },
  { id: '2', name: 'XLR Cable 10m', category: ItemCategory.SONORISATION, subsection: 'Cables', quantity: 12, location: 'Storage Room B', description: 'Balanced audio cables', minStockLevel: 5, lastUpdated: new Date().toISOString() },
  { id: '3', name: 'Mushaf Madinah (Large)', category: ItemCategory.QURAN_BOOK, subsection: 'Mushaf', quantity: 45, location: 'Shelf A1-A3', description: 'Blue cover standard print', minStockLevel: 10, lastUpdated: new Date().toISOString() },
  { id: '4', name: 'Yamaha MG10XU', category: ItemCategory.SONORISATION, subsection: 'Mixers', quantity: 1, location: 'Control Booth', description: 'Mixing console', minStockLevel: 1, lastUpdated: new Date().toISOString() },
  { id: '5', name: 'Juz Amma Pamphlet', category: ItemCategory.QURAN_BOOK, subsection: 'Education', quantity: 100, location: 'Entrance Rack', description: 'For students', minStockLevel: 20, lastUpdated: new Date().toISOString() },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_DATA);
  const [outputs, setOutputs] = useState<OutputRecord[]>([]);
  const [view, setView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persistence
  useEffect(() => {
    // Check Session Auth
    const sessionAuth = sessionStorage.getItem('noor-auth');
    if (sessionAuth === 'true') setIsAuthenticated(true);

    const savedInv = localStorage.getItem('noor-inventory-data');
    const savedOut = localStorage.getItem('noor-outputs-data');
    if (savedInv) {
      try { setInventory(JSON.parse(savedInv)); } catch (e) { console.error(e); }
    }
    if (savedOut) {
      try { setOutputs(JSON.parse(savedOut)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('noor-inventory-data', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('noor-outputs-data', JSON.stringify(outputs));
  }, [outputs]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('noor-auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('noor-auth');
  };

  // Inventory Actions
  const addItem = (item: InventoryItem) => {
    setInventory(prev => [item, ...prev]);
  };

  const updateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const handleOutput = (itemId: string, quantity: number, destination: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    // 1. Create Output Record
    const newOutput: OutputRecord = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      subsection: item.subsection || 'General',
      quantity: quantity,
      destination: destination,
      date: new Date().toISOString()
    };
    setOutputs(prev => [newOutput, ...prev]);

    // 2. Decrease Stock
    const updatedItem = { ...item, quantity: item.quantity - quantity };
    updateItem(updatedItem);
  };

  const NavItem = ({ id, label, icon: Icon }: { id: ViewState, label: string, icon: any }) => (
    <button
      onClick={() => {
        setView(id);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
        ${view === id 
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xl">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <BookOpen size={24} className="text-emerald-600" />
            </div>
            <span>Noor<span className="text-slate-800">Inv</span></span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sections
          </div>
          <NavItem id="sonorisation" label="Sonorisation" icon={Mic2} />
          <NavItem id="quran" label="Quran Books" icon={BookOpen} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Activity
          </div>
          <NavItem id="outputs" label="Stock Outputs" icon={ArrowUpRight} />
          <NavItem id="ai-chat" label="AI Assistant" icon={Sparkles} />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-400 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-slate-800">{inventory.reduce((a, b) => a + b.quantity, 0)}</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 py-2 text-xs font-semibold transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <BookOpen size={20} className="text-emerald-600" /> NoorInv
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 p-2">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-10 pt-20 px-4 pb-4 lg:hidden">
            <div className="space-y-2">
              <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
              <NavItem id="sonorisation" label="Sonorisation" icon={Mic2} />
              <NavItem id="quran" label="Quran Books" icon={BookOpen} />
              <NavItem id="outputs" label="Stock Outputs" icon={ArrowUpRight} />
              <NavItem id="ai-chat" label="AI Assistant" icon={Sparkles} />
              <div className="border-t border-slate-100 my-2"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} /> Sign Out
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 capitalize">
                {view === 'sonorisation' && 'Sound Equipment'}
                {view === 'quran' && 'Quran & Books'}
                {view === 'outputs' && 'Stock Output History'}
                {view === 'dashboard' && 'Dashboard'}
                {view === 'ai-chat' && 'AI Assistant'}
              </h1>
              <p className="text-slate-500 mt-1">
                {view === 'sonorisation' && 'Manage microphones, speakers, cables, and mixers.'}
                {view === 'quran' && 'Manage Mushaf stock, educational pamphlets, and religious texts.'}
                {view === 'outputs' && 'History of items taken out of inventory.'}
              </p>
            </div>

            {view === 'dashboard' && <Dashboard inventory={inventory} outputs={outputs} />}
            
            {view === 'sonorisation' && (
              <InventoryTable 
                inventory={inventory} 
                categoryFilter={ItemCategory.SONORISATION}
                onAdd={addItem} 
                onUpdate={updateItem} 
                onDelete={deleteItem} 
                onOutput={handleOutput}
              />
            )}

            {view === 'quran' && (
              <InventoryTable 
                inventory={inventory} 
                categoryFilter={ItemCategory.QURAN_BOOK}
                onAdd={addItem} 
                onUpdate={updateItem} 
                onDelete={deleteItem}
                onOutput={handleOutput}
              />
            )}

            {view === 'outputs' && <StockOutputs outputs={outputs} />}

            {view === 'ai-chat' && <AIChat inventory={inventory} />}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;