const DataTable = ({ columns, grid, children }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border dark:border-gray-700">

      {/* HEADER */}
      <div className="bg-[#0b1b3b] text-white text-sm font-medium">
        <div className={`grid ${grid} px-4 py-3`}>
          {columns.map((col) => (
            <div key={col.key} className={col.className || ""}>{col.label}</div>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="text-sm text-gray-700 dark:text-gray-200">
        {children}
      </div>

    </div>
  );
};

export default DataTable;
