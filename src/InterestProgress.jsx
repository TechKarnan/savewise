import React from 'react';

function InterestProgressCard({
  title,
  valueId,
  barId,
  detailId,
  description,
  showProgress = true
}) {
  return (
    <article className="interest-progress-card">
      <div className="interest-progress-copy">
        <h3>{title}</h3>
        <strong id={valueId}>₹0</strong>
      </div>
      {showProgress && (
        <div
          className="interest-progress-track"
          role="progressbar"
          id={barId}
          aria-label={title}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="0"
        >
          <span />
        </div>
      )}
      <p className="interest-progress-detail" id={detailId}>
        {description}
      </p>
    </article>
  );
}

export default function InterestProgress() {
  return (
    <section className="panel interest-progress" aria-labelledby="interestProgressTitle">
      <div className="section-head">
        <div>
          <h2 id="interestProgressTitle">Your interest growth</h2>
          <p>See how your money is earning and building over time.</p>
        </div>
      </div>

      <div className="interest-progress-grid">
        <InterestProgressCard
          title="Estimated interest today"
          valueId="todayInterestValue"
          barId="todayInterestBar"
          detailId="todayInterestDetail"
          description="Compared with the projected daily interest at the end of your plan."
        />
        <InterestProgressCard
          title="Cumulative interest this month"
          valueId="cumulativeInterestValue"
          barId="cumulativeInterestBar"
          detailId="cumulativeInterestDetail"
          description="Interest earned from the 1st of this month through today."
        />
        <InterestProgressCard
          title="Estimated total this month"
          valueId="monthlyInterestForecastValue"
          detailId="monthlyInterestForecastDetail"
          description="Projected interest from the 1st through the last day of this month."
          showProgress={false}
        />
      </div>
      <p className="interest-progress-note">
        The monthly estimate uses your current inputs and contribution schedule
        from the 1st of this month. Actual bank interest may differ.
      </p>
    </section>
  );
}
