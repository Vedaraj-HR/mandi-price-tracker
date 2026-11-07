// components/DataTable.js : shows any array of objects as a table
export default function DataTable({ rows, highlightFirst = false }) {
  if (!rows || rows.length === 0) return <p className='hint'>No rows.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <table>
      <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={highlightFirst && i === 0 ? 'best' : ''}>
            {cols.map((c) => <td key={c}>{String(r[c] ?? '')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
