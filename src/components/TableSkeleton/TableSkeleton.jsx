import Skeleton from '../Skeleton/Skeleton';

// Drop straight into a <tbody> in place of real rows while a table is
// loading (initial render or any re-fetch, e.g. search/filter/page change).
// `columns` describes each <td>'s placeholder: { width, variant }. variant
// 'badge' renders a short pill instead of a text bar, for Badge-shaped cells.
export default function TableSkeleton({ rows = 6, columns }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {columns.map((column, colIndex) => (
            <td key={colIndex}>
              <Skeleton
                width={column.width}
                height={column.variant === 'badge' ? '2rem' : '1.4rem'}
                style={{
                  borderRadius: column.variant === 'badge' ? '999px' : undefined,
                  animationDelay: `${rowIndex * 0.06}s`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
