import React from 'react';

export default function InvestmentJar() {
  return (
    <section className="investment-jar-panel" aria-labelledby="investmentJarTitle">
      <div className="investment-jar-intro">
        <span className="investment-jar-kicker">SMALL SAVINGS, STEADY GROWTH</span>
        <h2 id="investmentJarTitle">Your investment jar</h2>
        <p>Every rupee you invest gives your savings more room to grow.</p>
      </div>

      <div className="investment-jar-visual" aria-hidden="true">
        <div className="investment-jar-neck" />
        <div className="investment-jar-glass" id="investmentJarGlass">
          <div className="investment-jar-interest" />
          <div className="investment-jar-principal" />
          <span className="investment-jar-shine" />
        </div>
        <div className="investment-jar-base" />
      </div>

      <div className="investment-jar-values">
        <div className="investment-jar-value principal">
          <span><i />Your total contributions</span>
          <strong id="investmentJarPrincipal">₹0</strong>
        </div>
        <div className="investment-jar-value interest">
          <span><i />Interest earned</span>
          <strong id="investmentJarInterest">₹0</strong>
        </div>
        <p id="investmentJarNote">
          Jar layers match your total contributions and interest earned across
          the selected plan.
        </p>
      </div>
    </section>
  );
}
