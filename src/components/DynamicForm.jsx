import { useState } from "react";
import './DynamicForm.css';

export default function DynamicForm({ onSubmit, onSkip }) {
  const [rows, setRows] = useState([
    {
      type: "",
      pairs: [{ key: "", value: "" }]
    }
  ]);

  // Change dropdown or input
  const handleChange = (rowIndex, pairIndex, field, value) => {
    const updated = [...rows];
    updated[rowIndex].pairs[pairIndex][field] = value;
    setRows(updated);
  };

  const handleTypeChange = (rowIndex, value) => {
    const updated = [...rows];
    updated[rowIndex].type = value;
    setRows(updated);
  };

  // Add key-value pair inside row
  const addPair = (rowIndex) => {
    const updated = [...rows];
    updated[rowIndex].pairs.push({ key: "", value: "" });
    setRows(updated);
  };

  // Remove pair
  const removePair = (rowIndex, pairIndex) => {
    const updated = [...rows];
    updated[rowIndex].pairs.splice(pairIndex, 1);
    setRows(updated);
  };

  // Add new row
  const addRow = () => {
    setRows([
      ...rows,
      { type: "", pairs: [{ key: "", value: "" }] }
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(rows);
  };

  return (
    <div className="dynamic-form-container">
      <h2 className="dynamic-form-title">Test User Details</h2>
      <p className="dynamic-form-subtitle">Provide credentials or details for AI testing.</p>

      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="dynamic-form-row">
          
          {/* Dropdown */}
          <select
            className="dynamic-form-select"
            value={row.type}
            onChange={(e) => handleTypeChange(rowIndex, e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="log">Login</option>
            <option value="register">Register</option>
            <option value="content">Content</option>
            <option value="other">Other</option>
          </select>

          {/* Key-Value Pairs */}
          <div className="dynamic-form-pairs">
            {row.pairs.map((pair, pairIndex) => (
              <div key={pairIndex} className="dynamic-form-pair">
                <input
                  className="dynamic-form-input"
                  placeholder="Key (e.g. username)"
                  value={pair.key}
                  onChange={(e) =>
                    handleChange(rowIndex, pairIndex, "key", e.target.value)
                  }
                />

                <input
                  className="dynamic-form-input"
                  placeholder="Value (e.g. test@example.com)"
                  value={pair.value}
                  onChange={(e) =>
                    handleChange(rowIndex, pairIndex, "value", e.target.value)
                  }
                />

                <button type="button" className="dynamic-form-btn-icon" onClick={() => addPair(rowIndex)} title="Add Pair">➕</button>

                {pairIndex > 0 && (
                  <button type="button" className="dynamic-form-btn-icon" onClick={() => removePair(rowIndex, pairIndex)} title="Remove Pair">
                    ➖
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="button" className="dynamic-form-btn-add" onClick={addRow}>+ Add More Rows</button>

      <div className="dynamic-form-actions">
        <button className="dynamic-form-btn-submit" onClick={handleSubmit}>Submit Test Details</button>
        <button className="dynamic-form-btn-skip" onClick={() => onSkip()}>Skip</button>
      </div>
    </div>
  );
}
