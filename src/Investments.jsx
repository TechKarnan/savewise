import React, { useState } from 'react';

export const banks = [
  {
    id: 'axis',
    label: 'Axis Bank',
    logo: `${import.meta.env.BASE_URL}bank-logos/axis-bank.svg`
  },
  {
    id: 'canara',
    label: 'Canara Bank',
    logo: `${import.meta.env.BASE_URL}bank-logos/canara-bank.webp`
  },
  {
    id: 'idfc',
    label: 'IDFC FIRST Bank',
    logo: `${import.meta.env.BASE_URL}bank-logos/idfc-first-bank.svg`
  },
  {
    id: 'kotak',
    label: 'Kotak Mahindra Bank',
    logo: `${import.meta.env.BASE_URL}bank-logos/kotak-mahindra-bank.svg`
  }
];

export function BankLogo({ bank }) {
  return (
    <span className={`bank-logo-frame bank-logo-frame-${bank.id}`} aria-hidden="true">
      <img src={bank.logo} alt="" />
    </span>
  );
}

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
        <div className="investments-bank-logos" aria-hidden="true">
          {banks.map(bank => <BankLogo key={bank.id} bank={bank} />)}
        </div>
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
