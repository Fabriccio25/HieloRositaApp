import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity, Clock, DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, List, Download, PieChart, Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function App() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'expenses' | 'stats'

  useEffect(() => {
    const qSales = query(collection(db, "sales_v2"), orderBy("date", "desc"), limit(300));
    const qExpenses = query(collection(db, "expenses_v2"), orderBy("date", "desc"), limit(300));

    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      })));
    });

    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      })));
      setLoading(false);
    });

    return () => { unsubSales(); unsubExpenses(); };
  }, []);

  // --- Calculations ---
  const getTodayTotal = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data
      .filter(item => {
        const d = new Date(item.date);
        return d >= today;
      })
      .reduce((sum, item) => sum + (Number(item.total || item.amount) || 0), 0);
  };

  const todaySales = getTodayTotal(sales);
  const todayExpenses = getTodayTotal(expenses);
  const todayBalance = todaySales - todayExpenses;

  // --- Formatters ---
  const formatCurrency = (amount) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  const formatTime = (date) => new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(date);
  const formatDate = (date) => new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });

  // --- Filtering ---
  const filteredSales = sales.filter(sale => {
    const matchesSearch = (sale.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.product || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDebt = filterDebt ? sale.paymentStatus === 'debt' : true;
    return matchesSearch && matchesDebt;
  });

  const filteredExpenses = expenses.filter(exp =>
    (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exp.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Charts Data ---
  const getDailyData = () => {
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    return last7Days.map(date => {
      const dayName = date.toLocaleDateString('es-PE', { weekday: 'short' });
      const daySales = sales.filter(s => new Date(s.date).setHours(0, 0, 0, 0) === date.getTime())
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      const dayExpenses = expenses.filter(e => new Date(e.date).setHours(0, 0, 0, 0) === date.getTime())
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return { name: dayName, ventas: daySales, gastos: dayExpenses };
    });
  };

  // --- Export ---
  const exportData = async (type) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type === 'sales' ? 'Ventas' : 'Gastos');

    if (type === 'sales') {
      worksheet.columns = [
        { header: 'Fecha', key: 'date', width: 20 },
        { header: 'Cliente', key: 'client', width: 25 },
        { header: 'Producto', key: 'product', width: 25 },
        { header: 'Cantidad', key: 'qty', width: 10 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
      ];
      sales.forEach(s => {
        worksheet.addRow({
          date: s.date.toLocaleString('es-PE'),
          client: s.client,
          product: s.product,
          qty: s.quantity + (s.unit || ''),
          total: Number(s.total),
          status: s.paymentStatus === 'debt' ? 'DEUDA' : 'PAGADO'
        });
      });
    } else {
      worksheet.columns = [
        { header: 'Fecha', key: 'date', width: 20 },
        { header: 'Categoría', key: 'cat', width: 20 },
        { header: 'Descripción', key: 'desc', width: 35 },
        { header: 'Monto', key: 'amount', width: 15 },
      ];
      expenses.forEach(e => {
        worksheet.addRow({
          date: e.date.toLocaleString('es-PE'),
          cat: e.category,
          desc: e.description,
          amount: Number(e.amount)
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_${type}_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.xlsx`);
  };

  if (loading) return <div className="min-h-screen flex-center bg-dark text-white p-10">Cargando datos...</div>;

  return (
    <div className="min-h-screen bg-dark text-white p-4 max-w-lg mx-auto pb-20">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <Wallet className="text-primary" /> Finanzas<span className="text-primary">Visor</span>
        </h1>
        <div className="flex bg-card rounded-lg p-1 border border-gray-700">
          {/* View Toggles */}
          <button onClick={() => setCurrentView('list')} className={`p-2 rounded ${currentView === 'list' ? 'bg-green-600 text-white' : 'text-gray-400'}`}><ArrowUp size={20} /></button>
          <button onClick={() => setCurrentView('expenses')} className={`p-2 rounded ${currentView === 'expenses' ? 'bg-red-500 text-white' : 'text-gray-400'}`}><ArrowDown size={20} /></button>
          <button onClick={() => setCurrentView('stats')} className={`p-2 rounded ${currentView === 'stats' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><BarChart3 size={20} /></button>
        </div>
      </div>

      {/* Summary Cards Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-4 snap-x">
        {/* Sales Card */}
        <div className="min-w-[160px] bg-card border border-gray-800 p-4 rounded-2xl relative overflow-hidden snap-center">
          <div className="text-gray-400 text-xs mb-1">Ventas Hoy</div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(todaySales)}</div>
          <div className="absolute top-2 right-2 opacity-10"><ArrowUp size={40} /></div>
        </div>
        {/* Expenses Card */}
        <div className="min-w-[160px] bg-card border border-gray-800 p-4 rounded-2xl relative overflow-hidden snap-center">
          <div className="text-gray-400 text-xs mb-1">Gastos Hoy</div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(todayExpenses)}</div>
          <div className="absolute top-2 right-2 opacity-10"><ArrowDown size={40} /></div>
        </div>
        {/* Balance Card */}
        <div className="min-w-[160px] bg-gradient-to-br from-blue-900 to-gray-900 border border-blue-800 p-4 rounded-2xl relative overflow-hidden snap-center">
          <div className="text-blue-200 text-xs mb-1">Balance Hoy</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(todayBalance)}</div>
          <div className="absolute top-2 right-2 opacity-10"><Wallet size={40} /></div>
        </div>
      </div>

      {/* Main Content Area */}
      {currentView === 'list' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-400 font-bold uppercase text-sm">Ventas Recientes</h2>
            <button
              onClick={() => exportData('sales')}
              className="text-xs bg-gray-800 hover:bg-green-900 text-green-400 border border-green-900 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
            >
              <Download size={14} /> XLSX
            </button>
          </div>

          <div className="space-y-3">
            {filteredSales.map(sale => (
              <div key={sale.id} className="bg-card border border-gray-800 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white mb-0.5">{sale.client}</div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>{formatTime(sale.date)}</span>
                    <span>•</span>
                    <span>{sale.product}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">+{formatCurrency(Number(sale.total))}</div>
                  {sale.paymentStatus === 'debt' && <span className="text-[10px] text-red-500 font-bold uppercase bg-red-900/20 px-1 rounded">Deuda</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'expenses' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-400 font-bold uppercase text-sm">Gastos Recientes</h2>
            <button
              onClick={() => exportData('expenses')}
              className="text-xs bg-gray-800 hover:bg-red-900 text-red-400 border border-red-900 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
            >
              <Download size={14} /> XLSX
            </button>
          </div>

          {/* Search for Expenses */}
          <input
            placeholder="Buscar gasto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-gray-700 rounded-lg p-2 mb-4 text-sm"
          />

          <div className="space-y-3">
            {filteredExpenses.map(exp => (
              <div key={exp.id} className="bg-card border border-gray-800 rounded-xl p-3 flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
                    <TrendingDown size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-white mb-0.5">{exp.category}</div>
                    <div className="text-xs text-gray-500">{exp.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-400">-{formatCurrency(Number(exp.amount))}</div>
                  <div className="text-xs text-gray-600">{formatDate(exp.date)}</div>
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No hay gastos registrados</p>}
          </div>
        </div>
      )}

      {currentView === 'stats' && (
        <div className="animate-fade-in space-y-6">
          <h2 className="text-gray-400 font-bold uppercase text-sm mb-2">Ingresos vs Egresos (7 días)</h2>
          <div className="h-64 w-full bg-card border border-gray-800 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDailyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="ventas" name="Ventas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-xl text-center text-xs text-gray-400">
            Resumen de la última semana
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
