import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const data = [
  { name: "Ene", ventas: 10, pendientes: 5 },
  { name: "Feb", ventas: 20, pendientes: 8 },
  { name: "Mar", ventas: 15, pendientes: 6 },
  { name: "Abr", ventas: 30, pendientes: 10 },
  { name: "May", ventas: 25, pendientes: 7 },
];

export default function Chart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">
          Estadísticas
        </h3>
        <button className="text-blue-600 text-sm">
          Ver detalles
        </button>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="ventas"
              stroke="#3b82f6"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="pendientes"
              stroke="#94a3b8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}