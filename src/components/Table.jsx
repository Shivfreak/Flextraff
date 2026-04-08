export default function Table({ columns, data, loading }) {
  return (
    <div className="overflow-x-auto w-full rounded-lg border border-slate-700/50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-b border-slate-700/50">
            {columns.map((col, index) => (
              <th key={index} className="px-4 py-4 text-sm font-semibold text-blue-400 uppercase tracking-wide">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-300 divide-y divide-slate-700/50">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                Loading data...
              </td>
            </tr>
          ) : data.length ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-700/30 transition-colors duration-150">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="py-4 px-4 text-sm">
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📭</span>
                  <span>No data available</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}