import React, { useState } from 'react';

const banks = [
  { id: 'axis', label: 'Axis Bank' },
  { id: 'canara', label: 'Canara Bank' },
  { id: 'idfc', label: 'IDFC FIRST Bank' },
  { id: 'kotak', label: 'Kotak Mahindra Bank' }
];

export default function Investments({ onTotalChange }) {
  const [values, setValues] = useState({
    axis: '0',
    canara: '0',
    idfc: '0',
    kotak: '0'
  });

  function updateBank(id, rawValue) {
    const value =
      rawValue === '' ? '' : String(Math.max(0, Number(rawValue) || 0));
    const nextValues = { ...values, [id]: value };

    setValues(nextValues);
    onTotalChange(
      Object.values(nextValues).reduce(
        (total, amount) => total + (Number(amount) || 0),
        0
      )
    );
  }

  return (
    <section className="investments" aria-labelledby="investmentsTitle">
      <div className="investments-heading">
        <span className="investments-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 9h18L12 4 3 9Z" />
            <path d="M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18M4 18h16" />
          </svg>
        </span>
        <h3 id="investmentsTitle">Investments by bank</h3>
      </div>
      <p className="investments-sub">Enter the amount you have in each bank.</p>

      <div className="investment-fields">
        {banks.map(bank => (
          <div className="field investment-field" key={bank.id}>
            <label htmlFor={`investment-${bank.id}`}>{bank.label}</label>
            <div className="investment-input">
              <span aria-hidden="true">₹</span>
              <input
                id={`investment-${bank.id}`}
                type="number"
                min="0"
                step="1000"
                value={values[bank.id]}
                onChange={event => updateBank(bank.id, event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
