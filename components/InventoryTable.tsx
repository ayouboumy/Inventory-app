import React, { useState, useMemo } from 'react';
import { InventoryItem, ItemCategory } from '../types';
import { Search, Plus, Edit2, Trash2, MapPin, Sparkles, LogOut, ArrowRight, Tag, AlertCircle, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { analyzeItemWithGemini } from '../services/geminiService';

interface InventoryTableProps {
  inventory: InventoryItem[];
  categoryFilter?: ItemCategory; // If provided, locks the table to this category
  onAdd: (item: InventoryItem) => void;
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onOutput: (itemId: string, quantity: number, destination: string) => void;
}

type SortKey = 'name' | 'quantity' | 'location';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  inventory, 
  categoryFilter,
  onAdd, 
  onUpdate, 
  onDelete,
  onOutput
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubsection, setActiveSubsection] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  
  const [selectedItemForOutput, setSelectedItemForOutput] = useState<InventoryItem | null>(null);
  
  // Output Form State
  const [outputQty, setOutputQty] = useState(1);
  const [outputDestination, setOutputDestination] = useState('');

  // Add/Edit Form State
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: categoryFilter || ItemCategory.SONORISATION,
    subsection: '',
    quantity: 0,
    minStockLevel: 5,
    location: '',
    description: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle Sort Request
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and Sort Items
  const filteredAndSortedItems = useMemo(() => {
    // 1. Filter
    let items = inventory.filter(item => {
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubsection = activeSubsection === 'All' || item.subsection === activeSubsection;
      
      return matchesCategory && matchesSearch && matchesSubsection;
    });

    // 2. Sort
    return items.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [inventory, categoryFilter, searchTerm, activeSubsection, sortConfig]);

  // Extract unique subsections for tabs
  const subsections = useMemo(() => {
    const relevantItems = categoryFilter ? inventory.filter(i => i.category === categoryFilter) : inventory;
    const subs = Array.from(new Set(relevantItems.map(i => i.subsection || 'General')));
    return ['All', ...subs.sort()];
  }, [inventory, categoryFilter]);

  // Handlers
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Subsection', 'Quantity', 'Min Stock', 'Location', 'Description'];
    const rows = filteredAndSortedItems.map(item => [
      item.id,
      `"${item.name}"`, // Quote strings to handle commas
      item.category,
      item.subsection,
      item.quantity,
      item.minStockLevel,
      `"${item.location}"`,
      `"${item.description}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSmartFill = async () => {
    if (!formData.name) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeItemWithGemini(formData.name);
      setFormData(prev => ({
        ...prev,
        category: result.category,
        subsection: result.subsection,
        description: result.description,
        minStockLevel: result.suggestedMinStock
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      id: isEditing || crypto.randomUUID(),
      name: formData.name || 'Unnamed Item',
      category: formData.category || ItemCategory.OTHER,
      subsection: formData.subsection || 'General',
      quantity: Number(formData.quantity) || 0,
      minStockLevel: Number(formData.minStockLevel) || 0,
      location: formData.location || 'Unknown',
      description: formData.description || '',
      lastUpdated: new Date().toISOString()
    };

    if (isEditing) {
      onUpdate(item);
    } else {
      onAdd(item);
    }
    closeModal();
  };

  const handleOutputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemForOutput) {
      onOutput(selectedItemForOutput.id, outputQty, outputDestination);
      setIsOutputModalOpen(false);
      setSelectedItemForOutput(null);
      setOutputQty(1);
      setOutputDestination('');
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setIsEditing(item.id);
      setFormData(item);
    } else {
      setIsEditing(null);
      setFormData({ 
        category: categoryFilter || ItemCategory.SONORISATION, 
        subsection: '',
        quantity: 1, 
        minStockLevel: 5 
      });
    }
    setIsModalOpen(true);
  };

  const openOutputModal = (item: InventoryItem) => {
    setSelectedItemForOutput(item);
    setOutputQty(1);
    setOutputDestination('');
    setIsOutputModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  // Sort Icon Helper
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-emerald-600" /> 
      : <ArrowDown size={14} className="text-emerald-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full md:w-96">
            <Search className="text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search items..."
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              title="Export visible items to CSV"
            >
              <Download size={18} /> Export
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus size={18} /> Add {categoryFilter ? categoryFilter.replace('Book', '') : 'Item'}
            </button>
          </div>
        </div>

        {/* Subsection Tabs */}
        {subsections.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {subsections.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubsection(sub)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border
                  ${activeSubsection === sub 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    Item Details <SortIcon column="name" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('quantity')}
                  className="px-6 py-4 font-semibold text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    In Stock <SortIcon column="quantity" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('location')}
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                   <div className="flex items-center gap-2">
                    Location <SortIcon column="location" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20"/>
                      <p>No items found in {activeSubsection !== 'All' ? activeSubsection : 'this section'}.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-900 text-base">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                            {item.subsection || 'General'}
                          </span>
                          {!categoryFilter && (
                             <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 rounded">{item.category}</span>
                          )}
                        </div>
                        {item.description && <span className="text-xs text-slate-400 mt-1">{item.description}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                         <span className={`text-lg font-bold ${item.quantity <= item.minStockLevel ? 'text-red-600' : 'text-slate-700'}`}>
                          {item.quantity}
                        </span>
                        {item.quantity <= item.minStockLevel && (
                          <span className="text-[10px] text-red-500 font-medium">Low Stock</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={14} />
                        {item.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                          onClick={() => openOutputModal(item)}
                          disabled={item.quantity <= 0}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Register Stock Output"
                        >
                          <LogOut size={14} /> Out
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button 
                          onClick={() => openModal(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setItemToDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Item?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Are you sure you want to delete <span className="font-semibold text-slate-800">"{itemToDelete.name}"</span>? 
                  This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setItemToDelete(null)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Item Name</label>
                <div className="flex gap-2">
                  <input 
                    required
                    type="text" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g., Shure SM58"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {!isEditing && (
                    <button 
                      type="button"
                      onClick={handleSmartFill}
                      disabled={isAnalyzing || !formData.name}
                      className="bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100 px-3 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                      {isAnalyzing ? <span className="animate-spin">✨</span> : <Sparkles size={14} />}
                      AI
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as ItemCategory})}
                    disabled={!!categoryFilter}
                  >
                    <option value={ItemCategory.SONORISATION}>Sonorisation</option>
                    <option value={ItemCategory.QURAN_BOOK}>Quran Book</option>
                    <option value={ItemCategory.OTHER}>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Subsection</label>
                  <input 
                    type="text"
                    list="subsection-suggestions"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Cables"
                    value={formData.subsection}
                    onChange={(e) => setFormData({...formData, subsection: e.target.value})}
                  />
                  <datalist id="subsection-suggestions">
                    {subsections.filter(s => s !== 'All').map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Location</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Storage A"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Output Modal */}
      {isOutputModalOpen && selectedItemForOutput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                  <LogOut size={20} /> Record Stock Output
                </h3>
                <p className="text-orange-600/80 text-xs mt-1">
                  Taking item from inventory
                </p>
             </div>
             
             <form onSubmit={handleOutputSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Item</label>
                  <p className="font-medium text-slate-800 text-lg">{selectedItemForOutput.name}</p>
                  <p className="text-xs text-slate-500">Available: <span className="font-bold">{selectedItemForOutput.quantity}</span></p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Quantity Out</label>
                  <input 
                    type="number" 
                    min="1"
                    max={selectedItemForOutput.quantity}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={outputQty}
                    onChange={(e) => setOutputQty(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Destination / Place</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Mosque Main Hall, Event A"
                      className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      value={outputDestination}
                      onChange={(e) => setOutputDestination(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Confirm Output <ArrowRight size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsOutputModalOpen(false)}
                    className="w-full text-slate-500 py-2 text-sm hover:text-slate-800 mt-2"
                  >
                    Cancel
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};