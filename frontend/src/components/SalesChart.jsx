import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#aa3bff', '#3b9dff', '#ff8a3b', '#3bffb0', '#ff3b6b']

function formatYen(value) {
  return `¥${value.toLocaleString()}`
}

export function MonthlyLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v) => `${v / 10000}万`} />
        <Tooltip formatter={formatYen} />
        <Line type="monotone" dataKey="sales" stroke="#aa3bff" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CategoryBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis tickFormatter={(v) => `${v / 10000}万`} />
        <Tooltip formatter={formatYen} />
        <Bar dataKey="sales" fill="#3b9dff" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="sales"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatYen} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function SalesTable({ data }) {
  return (
    <div className="sales-table-wrapper">
      <table className="sales-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td>{formatYen(row.sales)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
