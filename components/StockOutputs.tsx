import React, { useMemo, useState } from 'react';
import { OutputRecord, ItemCategory } from '../types';
import { ArrowUpRight, Calendar, MapPin, Layers, Clock, Filter, Mic2, BookOpen, Package, Download } from 'lucide-react';

interface StockOutputsProps {
  outputs: OutputRecord[];
}

export const StockOutputs: React.FC<StockOutputsProps> = ({ outputs }) => {
  const [groupBy, setGroupBy] = useState<'section' | 'date'>('section');
  const [sectionFilters, setSectionFilters] = useState<Record<string, string>>({});

  // Group by Category -> Subsection -> Records
  const groupedOutputs = useMemo(() => {
    const groups: Record<string, Record<string, OutputRecord[]>> = {};

    // Sort by date desc first
    const sorted = [...outputs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(record => {
      const cat = record.category;
      const sub = record.subsection || 'General';

      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][sub]) groups[cat][sub] = [];

      groups[cat][sub].push(record);
    });

    return groups;
  }, [outputs]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Item Name', 'Category', 'Subsection', 'Quantity', 'Destination', 'ID'];
    const rows = outputs.map(record => [
      `"${new Date(record.date).toLocaleString()}"`,
      `"${record.itemName}"`,
      record.category,
      record.subsection,
      record.quantity,
      `"${record.destination}"`,
      record.id
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_outputs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = Object.keys(groupedOutputs).sort();

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ArrowUpRight className="text-orange-500" /> Stock Output History
          </h2>
          <p className="text-slate-500 text-sm">Track distributed items.</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* View Toggles */}
            <div className="flex bg-slate-100 p-1 rounded-lg self-start md:self-auto">
                <button 
                    onClick={() => setGroupBy('section')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1
                    ${groupBy === 'section' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layers size={14} /> By Section
                </button>
                <button 
                    onClick={() => setGroupBy('date')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1
                    ${groupBy === 'date' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Clock size={14} /> Chronological
                </button>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <Download size={14} /> Export CSV
              </button>
              
              <div className="text-right hidden md:block">
                  <p className="text-2xl font-bold text-slate-800">{outputs.length}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Out</p>
              </div>
            </div>
        </div>
      </div>

      {/* Render based on view mode */}
      {outputs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
            <div className="inline-flex bg-slate-50 p-4 rounded-full mb-3 text-slate-300">
                <ArrowUpRight size={32} />
            </div>
            <p className="text-slate-500">No items have been taken out of stock yet.</p>
        </div>
      ) : groupBy === 'date' ? (
        // Simple Chronological List
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <OutputTable records={[...outputs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())} />
        </div>
      ) : (
        // Grouped by Section View
        <div className="space-y-8">
            {categories.map(category => {
                const subsections = Object.keys(groupedOutputs[category]).sort();
                const activeFilter = sectionFilters[category] || 'All';
                
                const displayedSubsections = activeFilter === 'All' 
                    ? subsections 
                    : subsections.filter(s => s === activeFilter);

                return (
                    <div key={category} className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg 
                                    ${category === ItemCategory.SONORISATION ? 'bg-blue-100 text-blue-600' : 
                                      category === ItemCategory.QURAN_BOOK ? 'bg-emerald-100 text-emerald-600' : 
                                      'bg-slate-100 text-slate-600'}`}>
                                    {category === ItemCategory.SONORISATION ? <Mic2 size={20} /> : 
                                     category === ItemCategory.QURAN_BOOK ? <BookOpen size={20} /> : 
                                     <Package size={20} />}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{category}</h3>
                            </div>

                            {/* Per-Section Filter */}
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <Filter size={14} className="text-slate-400" />
                                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sub-section:</span>
                                <select 
                                    value={activeFilter}
                                    onChange={(e) => setSectionFilters(prev => ({...prev, [category]: e.target.value}))}
                                    className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer pr-2"
                                >
                                    <option value="All">All ({subsections.length})</option>
                                    {subsections.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {displayedSubsections.length === 0 && (
                                <p className="text-sm text-slate-400 italic px-2">No records found for this subsection.</p>
                            )}
                            {displayedSubsections.map(subsection => (
                                <div key={subsection} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                        <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                            {subsection}
                                        </h4>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {groupedOutputs[category][subsection].length} records
                                        </span>
                                    </div>
                                    <OutputTable records={groupedOutputs[category][subsection]} simple />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};

// Sub-component for the table to avoid duplication
const OutputTable: React.FC<{ records: OutputRecord[], simple?: boolean }> = ({ records, simple }) => (
    <div className="w-full">
        {/* Mobile View: Card-like list */}
        <div className="md:hidden divide-y divide-slate-100">
            {records.map((record) => (
                <div key={record.id} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm">{record.itemName}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={10} />
                                {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                         <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded text-xs whitespace-nowrap">-{record.quantity}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                        <div className="flex items-center gap-1.5">
                             <MapPin size={12} className="text-slate-400" />
                             <span className="truncate max-w-[150px]">{record.destination}</span>
                        </div>
                        {!simple && (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                {record.category}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                {!simple && (
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Date</th>
                            <th className="px-6 py-3 font-semibold">Item</th>
                            <th className="px-6 py-3 font-semibold">Category</th>
                            <th className="px-6 py-3 font-semibold text-center">Qty</th>
                            <th className="px-6 py-3 font-semibold">Destination</th>
                        </tr>
                    </thead>
                )}
                <tbody className="divide-y divide-slate-100">
                    {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap w-40">
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <Calendar size={12} />
                                    {new Date(record.date).toLocaleDateString()}
                                    <span className="opacity-60">{new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </td>
                            <td className="px-6 py-3 font-medium text-slate-900">
                                {record.itemName}
                            </td>
                            {!simple && (
                                <td className="px-6 py-3">
                                    <span className="text-xs border border-slate-200 px-2 py-0.5 rounded-full">{record.category}</span>
                                </td>
                            )}
                            <td className="px-6 py-3 text-center">
                                <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded text-xs">-{record.quantity}</span>
                            </td>
                            <td className="px-6 py-3 text-slate-500">
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    {record.destination}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);