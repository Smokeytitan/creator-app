/**
 * Excel Preview Component
 * Displays Excel template as HTML table with interactive cell selection for field mapping
 */

import React from 'react';
import * as XLSX from 'xlsx';

const ExcelPreview = ({ workbook, onCellClick, mappedCells = {} }) => {
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    return (
      <div className="text-center py-8 text-polygon-text-secondary">
        No workbook loaded
      </div>
    );
  }

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to 2D array for easier rendering
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Limit preview to 70 rows x 15 columns
  const maxRows = Math.min(data.length, 70);
  const maxCols = 15;

  // Get column letters (A, B, C, ...)
  const getColumnLetter = (index) => {
    let letter = '';
    let num = index;
    while (num >= 0) {
      letter = String.fromCharCode(65 + (num % 26)) + letter;
      num = Math.floor(num / 26) - 1;
    }
    return letter;
  };

  // Check if cell is mapped
  const isMapped = (rowIndex, colIndex) => {
    const cellAddress = `${getColumnLetter(colIndex)}${rowIndex + 1}`;
    return mappedCells.hasOwnProperty(cellAddress);
  };

  // Get mapped field label
  const getMappedLabel = (rowIndex, colIndex) => {
    const cellAddress = `${getColumnLetter(colIndex)}${rowIndex + 1}`;
    return mappedCells[cellAddress]?.label || '';
  };

  // Handle cell click
  const handleCellClick = (rowIndex, colIndex) => {
    const cellAddress = `${getColumnLetter(colIndex)}${rowIndex + 1}`;
    if (onCellClick) {
      onCellClick(cellAddress, rowIndex, colIndex);
    }
  };

  return (
    <div className="overflow-x-auto border border-white/[0.12] rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/[0.02]">
            <th className="border border-white/[0.06] px-2 py-1 text-polygon-text-secondary text-xs font-mono w-12">
              {/* Row number header */}
            </th>
            {Array.from({ length: maxCols }).map((_, colIndex) => (
              <th
                key={colIndex}
                className="border border-white/[0.06] px-2 py-1 text-polygon-text-secondary text-xs font-mono min-w-[80px]"
              >
                {getColumnLetter(colIndex)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, rowIndex) => {
            const row = data[rowIndex] || [];
            return (
              <tr key={rowIndex} className="hover:bg-white/[0.02]">
                {/* Row number */}
                <td className="border border-white/[0.06] px-2 py-1 text-polygon-text-secondary text-xs font-mono text-center bg-white/[0.02]">
                  {rowIndex + 1}
                </td>
                {/* Data cells */}
                {Array.from({ length: maxCols }).map((_, colIndex) => {
                  const value = row[colIndex];
                  const mapped = isMapped(rowIndex, colIndex);
                  const label = getMappedLabel(rowIndex, colIndex);

                  return (
                    <td
                      key={colIndex}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={`
                        border border-white/[0.06] px-2 py-1 cursor-pointer
                        transition-colors duration-150
                        ${mapped
                          ? 'bg-polygon-primary/20 hover:bg-polygon-primary/30 border-polygon-primary/40'
                          : 'hover:bg-white/[0.05]'
                        }
                      `}
                      title={mapped ? `Mapped to: ${label}` : 'Click to map field'}
                    >
                      <div className="flex flex-col">
                        {value !== undefined && value !== null && (
                          <span className="text-polygon-text-primary truncate">
                            {String(value)}
                          </span>
                        )}
                        {mapped && (
                          <span className="text-xs text-polygon-primary-light mt-1 font-medium truncate">
                            {label}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 bg-white/[0.02] text-xs text-polygon-text-secondary border-t border-white/[0.06]">
        Showing first {maxRows} rows × {maxCols} columns. Click cells to map data fields.
      </div>
    </div>
  );
};

export default ExcelPreview;
