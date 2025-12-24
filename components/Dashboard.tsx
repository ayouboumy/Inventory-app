import React, { useMemo, useState, useRef } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts';
import { InventoryItem, ItemCategory, OutputRecord } from '../types';
import { AlertTriangle, Music, Book, ListFilter } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  outputs: OutputRecord[];
}

const COLORS = ['#059669', '#0284c7', '#64748b', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6'];

export const Dashboard: React.FC<DashboardProps> = ({ inventory, outputs }) => {
  // Default to Sonorisation view instead of generic overview
  const [activeTab, setActiveTab] = useState<ItemCategory.SONORISATION | ItemCategory.QURAN_BOOK>(ItemCategory.SONORISATION);
  const lowStockRef = useRef<HTMLDivElement>(null);
  
  const stats = useMemo(() => {
    const lowStockItems = inventory.filter(item => item.quantity <= item.minStockLevel);
    
    // Helper to sum current inventory + outputs for Total Asset Count
    const getTotalAssets = (cat: ItemCategory) => {
      const invCount = inventory.filter(i => i.category === cat).reduce((acc, i) => acc + i.quantity, 0);
      const outCount = outputs.filter(o => o.category === cat).reduce((acc, o) => acc + o.quantity, 0);
      return invCount + outCount;
    };

    // Category Totals for Summary Cards (Initial/Total Stock)
    const sonorisationTotal = getTotalAssets(ItemCategory.SONORISATION);
    const quranTotal = getTotalAssets(ItemCategory.QURAN_BOOK);

    // Helper to get subsection distribution based on TOTAL ASSETS (Inventory + Outputs)
    const getSubsectionData = (cat: ItemCategory) => {
        const subMap: Record<string, number> = {};
        
        // Add Current Inventory
        inventory.filter(i => i.category === cat).forEach(i => {
          const sub = i.subsection || 'عام';
          subMap[sub] = (subMap[sub] || 0) + i.quantity;
        });

        // Add Distributed Items (Outputs)
        outputs.filter(o => o.category === cat).forEach(o => {
          const sub = o.subsection || 'عام';
          subMap[sub] = (subMap[sub] || 0) + o.quantity;
        });

        return Object.entries(subMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
    };

    const sonorisationSubsections = getSubsectionData(ItemCategory.SONORISATION);
    const quranSubsections = getSubsectionData(ItemCategory.QURAN_BOOK);

    return { lowStockItems, sonorisationTotal, quranTotal, sonorisationSubsections, quranSubsections };
  }, [inventory, outputs]);

  const data = activeTab === ItemCategory.SONORISATION ? stats.sonorisationSubsections : stats.quranSubsections;
  const emptyMessage = data.length === 0 ? "لا توجد بيانات متاحة لهذا التصنيف." : null;
  const activeColor = activeTab === ItemCategory.SONORISATION ? 'text-blue-600' : 'text-emerald-600';

  const handleLowStockClick = () => {
    if (stats.lowStockItems.length > 0 && lowStockRef.current) {
      lowStockRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Sonorisation Card */}
        <div 
             className={`p-6 rounded-xl shadow-sm border transition-all cursor-pointer flex items-center space-x-4 space-x-reverse
             ${activeTab === ItemCategory.SONORISATION ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
             onClick={() => setActiveTab(ItemCategory.SONORISATION)}>
          <div className={`p-3 rounded-lg ${activeTab === ItemCategory.SONORISATION ? 'bg-blue-200 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
            <Music size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">الصوتيات والمعدات</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {stats.sonorisationTotal} <span className="text-xs font-normal text-slate-500">إجمالي الأصول</span>
            </h3>
          </div>
        </div>

        {/* Quran Card */}
        <div 
             className={`p-6 rounded-xl shadow-sm border transition-all cursor-pointer flex items-center space-x-4 space-x-reverse
             ${activeTab === ItemCategory.QURAN_BOOK ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
             onClick={() => setActiveTab(ItemCategory.QURAN_BOOK)}>
          <div className={`p-3 rounded-lg ${activeTab === ItemCategory.QURAN_BOOK ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-50 text-emerald-600'}`}>
            <Book size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">المصاحف والكتب</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {stats.quranTotal} <span className="text-xs font-normal text-slate-500">إجمالي الأصول</span>
            </h3>
          </div>
        </div>

        {/* Low Stock Card */}
        <div 
          onClick={handleLowStockClick}
          className={`p-6 rounded-xl shadow-sm border transition-all flex items-center space-x-4 space-x-reverse
            ${stats.lowStockItems.length > 0 
              ? 'bg-white border-slate-100 hover:bg-red-50 hover:border-red-200 cursor-pointer group ring-offset-2 focus:ring-2' 
              : 'bg-slate-50 border-slate-100 opacity-60 cursor-default'}`}
        >
          <div className={`p-3 rounded-lg transition-colors
            ${stats.lowStockItems.length > 0 ? 'bg-red-50 text-red-600 group-hover:bg-red-100 group-hover:text-red-700' : 'bg-slate-200 text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">تنبيهات المخزون</p>
            <h3 className={`text-2xl font-bold transition-colors ${stats.lowStockItems.length > 0 ? 'text-slate-800 group-hover:text-red-900' : 'text-slate-400'}`}>
              {stats.lowStockItems.length}
            </h3>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 my-4" />

      {/* Detailed View for Selected Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Detailed Subsection Chart */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${activeColor}`}>
                    {activeTab === ItemCategory.SONORISATION ? <Music size={20}/> : <Book size={20}/>}
                    توزيع {activeTab === ItemCategory.SONORISATION ? 'الصوتيات' : 'المصاحف'}
                </h3>
                {emptyMessage ? (
                     <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">{emptyMessage}</div>
                ) : (
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="text-center">
                             <span className="block text-2xl font-bold text-slate-700">{data.reduce((a,b)=>a+b.value,0)}</span>
                             <span className="text-[10px] text-slate-400 uppercase tracking-wide">وحدة</span>
                           </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Subsection Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ListFilter size={20} className="text-slate-400" /> تفاصيل الأقسام الفرعية
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 italic">(المخزون الحالي + الموزع)</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto">
                    {emptyMessage ? (
                         <div className="text-center py-8 text-slate-400 italic">لا توجد عناصر في هذا التصنيف.</div>
                    ) : (
                        <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-lg w-1/2">القسم الفرعي</th>
                                <th className="px-6 py-4 text-left w-24">العدد</th>
                                <th className="px-6 py-4 rounded-tl-lg w-1/3">النسبة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((item, idx) => {
                                const total = data.reduce((a, b) => a + b.value, 0);
                                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                return (
                                    <tr key={item.name} className="hover:bg-slate-50 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 font-medium text-slate-800">
                                                <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <span className="font-mono font-semibold text-slate-600">{item.value}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                                    <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium w-8 text-left tabular-nums">{percent}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        </table>
                    )}
                </div>
            </div>
      </div>

      {/* Low Stock Table (Global - Remains focused on Current Status) */}
      {stats.lowStockItems.length > 0 && (
        <div 
          ref={lowStockRef} 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 scroll-mt-24 transition-colors duration-1000 target:bg-red-50/30"
        >
          <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> إجراء مطلوب: مخزون منخفض
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-600">
              <thead className="bg-red-50 text-red-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">اسم العنصر</th>
                  <th className="px-4 py-3">التصنيف</th>
                  <th className="px-4 py-3">الكمية الحالية</th>
                  <th className="px-4 py-3">الحد الأدنى</th>
                  <th className="px-4 py-3">المكان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${item.category === ItemCategory.SONORISATION ? 'bg-blue-100 text-blue-700' : 
                          item.category === ItemCategory.QURAN_BOOK ? 'bg-emerald-100 text-emerald-700' : 
                          'bg-slate-100 text-slate-700'}`}>
                        {item.category === ItemCategory.SONORISATION ? 'صوتيات' : 
                         item.category === ItemCategory.QURAN_BOOK ? 'مصاحف' : 'أخرى'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-red-600 font-bold">{item.quantity}</td>
                    <td className="px-4 py-3">{item.minStockLevel}</td>
                    <td className="px-4 py-3">{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};