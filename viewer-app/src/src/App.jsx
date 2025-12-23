import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity, Clock, DollarSign, TrendingUp, Calendar, BarChart3, List, Download, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function App() {
  const [sales, setSales] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'stats'

  useEffect(() => {
    // Query for recent sales (last 300 to have good chart data)
    const q = query(
      collection(db, "sales"),
      orderBy("date", "desc"),
      limit(300)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));

      setSales(salesData);

      // Calculate Today's Total
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= today;
      });

      const total = todaysSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
      setTodayTotal(total);
      setLoading(false);
    }, (error) => {
      console.error("Error getting sales:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(date);
  };

  // Filter Logic
  const filteredSales = sales.filter(sale => {
    const matchesSearch = (sale.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.product || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDebt = filterDebt ? sale.paymentStatus === 'debt' : true;

    return matchesSearch && matchesDebt;
  });

  // Chart Data Preparation
  const getDailySalesData = () => {
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    return last7Days.map(date => {
      const dayName = date.toLocaleDateString('es-PE', { weekday: 'short' });
      const dayTotal = sales
        .filter(s => {
          const sDate = new Date(s.date);
          sDate.setHours(0, 0, 0, 0);
          return sDate.getTime() === date.getTime();
        })
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

      return { name: dayName, total: dayTotal };
    });
  };

  const getDebtData = () => {
    const debt = sales.filter(s => s.paymentStatus === 'debt').length;
    const paid = sales.filter(s => s.paymentStatus !== 'debt').length;
    return [
      { name: 'Pagado', value: paid, color: '#22c55e' },
      { name: 'Deuda', value: debt, color: '#ef4444' }
    ];
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Ventas');

    // Columns
    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Cliente', key: 'client', width: 30 },
      { header: 'Producto', key: 'product', width: 30 },
      { header: 'Cantidad', key: 'quantity', width: 10 },
      { header: 'Total (S/)', key: 'total', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    // Add Rows
    sales.forEach(sale => {
      const row = worksheet.addRow({
        date: sale.date.toLocaleString('es-PE'),
        client: sale.client || 'General',
        product: sale.product || '-',
        quantity: (sale.quantity || 1) + (sale.unit || ''),
        total: Number(sale.total) || 0,
        status: sale.paymentStatus === 'debt' ? 'DEUDA' : 'PAGADO'
      });

      // Colorize Status
      const statusCell = row.getCell('status');
      if (sale.paymentStatus === 'debt') {
        statusCell.font = { color: { argb: 'FFFF0000' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FF008000' }, bold: true };
      }
    });

    // Generate File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Ventas_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.xlsx`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark text-white p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Activity size={20} />
          </div>
          <h1 className="font-bold text-xl">Registro<span className="text-primary">Visor</span></h1>
        </div>
        <div className="flex bg-card rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setCurrentView('list')}
            className={`p-2 rounded-md transition-all ${currentView === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`p-2 rounded-md transition-all ${currentView === 'stats' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </div>

      {currentView === 'stats' ? (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-card border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} /> Ventas (Últimos 7 días)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDailySalesData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `S/${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: '#374151', opacity: 0.4 }}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChart className="text-primary" size={20} /> Estado de Pagos
            </h2>
            <div className="h-64 w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={getDebtData()}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getDebtData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button
            onClick={exportToExcel}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
          >
            <Download size={20} />
            Descargar Reporte Excel
          </button>
        </div>
      ) : (
        <>
          {/* Today's Stats Card */}
          <div className="bg-gradient-to-br from-card to-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp size={100} />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                <Calendar size={14} />
                Total Hoy
              </p>
              <div className="text-5xl font-bold tracking-tight text-white mb-2">
                {formatCurrency(todayTotal)}
              </div>
              <p className="text-xs text-gray-500">
                {sales.filter(s => new Date(s.date) >= new Date().setHours(0, 0, 0, 0)).length} ventas registradas hoy
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar cliente o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <button
              onClick={() => setFilterDebt(!filterDebt)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${filterDebt
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-card border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
            >
              {filterDebt ? 'Solo Deuda' : 'Ver Deudas'}
            </button>
          </div>

          {/* Recent Transactions List */}
          <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4 px-1">
            {filterDebt ? 'Deudores Pendientes' : 'Últimos Movimientos'}
          </h2>

          <div className="space-y-6 pb-20">
            {Object.entries(filteredSales.reduce((groups, sale) => {
              const date = new Date(sale.date);
              // Format: "Lunes, 12 de Agosto" (Spanih locale)
              const dateKey = date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
              const key = dateKey.charAt(0).toUpperCase() + dateKey.slice(1); // Capitalize first letter

              if (!groups[key]) groups[key] = { sales: [], total: 0 };
              groups[key].sales.push(sale);
              groups[key].total += (Number(sale.total) || 0);
              return groups;
            }, {})).sort((a, b) => { // Sort descending by date of first item (hacky but works since list is already sorted)
              // We rely on the fact that sales list is already sorted descending
              // But to be safe, compare timestamp of first item
              return b[1].sales[0].date - a[1].sales[0].date;
            }).map(([dateLabel, group]) => (
              <div key={dateLabel} className="animate-fade-in-up">
                {/* Day Header */}
                <div className="flex justify-between items-end mb-3 px-1">
                  <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">{dateLabel}</h3>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase block">Total Día</span>
                    <span className="text-white font-bold">{formatCurrency(group.total)}</span>
                  </div>
                </div>

                {/* Sales List for this Day */}
                <div className="space-y-3">
                  {group.sales.map((sale) => (
                    <div key={sale.id} className="bg-card border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{sale.client || "Cliente General"}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={12} />
                            <span>{formatTime(sale.date)}</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span>{sale.product || "Producto"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-lg text-primary">
                          +{formatCurrency(sale.total)}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                            {(sale.quantity || 1) + (sale.unit || ' und')}
                          </span>
                          {sale.paymentStatus === 'debt' ? (
                            <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wider">
                              Deuda
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-wider">
                              Pagado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}


            {filteredSales.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || filterDebt
                  ? "No se encontraron resultados con los filtros actuales."
                  : "No hay ventas registradas aún."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
