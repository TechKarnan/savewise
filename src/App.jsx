import React, { useEffect } from 'react';
import Investments, { BankLogo, banks } from './Investments.jsx';
import InterestProgress from './InterestProgress.jsx';

export default function App() {
  useEffect(() => {
    const $ = id => document.getElementById(id);

    const fmt = n =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(Number.isFinite(n) ? n : 0);

    const compact = n => {
      if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
      if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
      return fmt(n);
    };

    function updateTimeProgress() {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      const elapsedToday = (now.getTime() - startOfDay) / 86_400_000;
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).getTime();
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      ).getTime();
      const elapsedThisMonth =
        (now.getTime() - startOfMonth) /
        (startOfNextMonth - startOfMonth);

      const progressItems = [
        {
          barId: 'todayInterestBar',
          detailId: 'todayInterestDetail',
          percentage: elapsedToday * 100,
          ariaDescription: '24-hour day elapsed',
          description: 'of 24 hours elapsed today'
        },
        {
          barId: 'cumulativeInterestBar',
          detailId: 'cumulativeInterestDetail',
          percentage: elapsedThisMonth * 100,
          ariaDescription: 'current month elapsed',
          description: 'of this month elapsed'
        }
      ];

      progressItems.forEach(item => {
        const percentage = Math.min(100, Math.max(0, item.percentage));
        const bar = $(item.barId);
        bar.setAttribute('aria-valuenow', percentage.toFixed(1));
        bar.setAttribute(
          'aria-valuetext',
          percentage.toFixed(1) + '% ' + item.ariaDescription
        );
        bar.firstElementChild.style.width = percentage + '%';
        $(item.detailId).textContent =
          percentage.toFixed(1) + '% ' + item.description;
      });
    }

    let interval = 'monthly';
    let model = null;
    let dirty = false;

    const inputs = [
      'initial',
      'contribution',
      'frequency',
      'rate',
      'years',
      'goal'
    ];

    function dateAt(day) {
      let d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + day);
      return d;
    }

    function addDays(d, n) {
      let x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    }

    function isDeposit(day, freq, start) {
      if (day === 0) return true;

      let d = addDays(start, day);

      if (freq === 'daily') return true;
      if (freq === 'weekly') return day % 7 === 0;

      if (freq === 'monthly') {
        return (
          d.getDate() === start.getDate() ||
          (
            d.getDate() ===
              new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() &&
            start.getDate() > d.getDate()
          )
        );
      }

      if (freq === 'yearly') {
        return (
          d.getMonth() === start.getMonth() &&
          d.getDate() === start.getDate()
        );
      }

      return false;
    }

    function simulate(days, startDate = new Date()) {
      let initial = Math.max(0, +$('initial').value || 0);
      let c = Math.max(0, +$('contribution').value || 0);
      let freq = $('frequency').value;
      let rate =
        Math.max(0, Math.min(100, +$('rate').value || 0)) / 100;

      let per = Math.pow(1 + rate, 1 / 365) - 1;

      let start = new Date(startDate);
      start.setHours(12, 0, 0, 0);

      let bal = initial;
      let principal = initial;
      let interest = 0;

      let rows = [];
      let daily = [];

      for (let day = 0; day <= days; day++) {
        if (day > 0 && isDeposit(day, freq, start)) {
          bal += c;
          principal += c;
        }

        let earned = bal * per;

        bal += earned;
        interest += earned;

        let d = addDays(start, day);

        let row = {
          day,
          date: d,
          balance: bal,
          principal,
          interest,
          earned
        };

        daily.push(row);
      }

      return {
        daily,
        bal,
        principal,
        interest,
        start
      };
    }

    function periodGroups(daily, kind) {
      let groups = [];
      let keyPrev = '';
      let g = null;

      for (let r of daily) {
        let d = r.date;
        let key;

        if (kind === 'daily') {
          key = 'd' + r.day;
        } else if (kind === 'weekly') {
          key = 'w' + Math.floor(r.day / 7);
        } else if (kind === 'monthly') {
          key = d.getFullYear() + '-' + d.getMonth();
        } else {
          key = 'y' + d.getFullYear();
        }

        if (key !== keyPrev) {
          g = {
            label:
              kind === 'daily'
                ? 'Day ' + (r.day + 1)
                : kind === 'weekly'
                ? 'Week ' + (Math.floor(r.day / 7) + 1)
                : kind === 'monthly'
                ? d.toLocaleDateString('en-IN', {
                    month: 'short',
                    year: '2-digit'
                  })
                : 'Year ' +
                  (
                    d.getFullYear() -
                    daily[0].date.getFullYear() +
                    1
                  ),

            value: 0,
            day: r.day
          };

          groups.push(g);
          keyPrev = key;
        }

        g.value += r.earned;
      }

      return groups;
    }

    function draw(canvas, series, opts = {}) {
      let rect = canvas.getBoundingClientRect();

      let w = Math.max(280, rect.width);
      let h = Math.max(180, rect.height);

      let dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      let ctx = canvas.getContext('2d');

      ctx.scale(dpr, dpr);

      let pad = {
        l: 62,
        r: 12,
        t: 13,
        b: 38
      };

      let cw = w - pad.l - pad.r;
      let ch = h - pad.t - pad.b;

      ctx.clearRect(0, 0, w, h);

      let vals = series.flatMap(s =>
        s.values.map(p => p.y)
      );

      let max = Math.max(1, ...vals);

      let nice =
        Math.pow(
          10,
          Math.floor(Math.log10(max))
        );

      let top =
        Math.ceil((max / nice) * 1.12) * nice;

      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 4; i++) {
        let v = (top * i) / 4;

        let y =
          pad.t +
          ch -
          (ch * i) / 4;

        ctx.strokeStyle = '#edf1f6';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
        ctx.stroke();

        ctx.fillStyle = '#8290a4';

        ctx.fillText(
          v >= 1e6
            ? '₹' + (v / 1e6).toFixed(1) + 'm'
            : v >= 1000
            ? '₹' + (v / 1000).toFixed(0) + 'k'
            : '₹' + Math.round(v),
          pad.l - 8,
          y
        );
      }

      let n = Math.max(
        ...series.map(s => s.values.length),
        1
      );

      let step = cw / n;

      if (opts.bars) {
        let s = series[0];

        let bw = Math.max(
          1,
          Math.min(24, step * 0.66)
        );

        s.values.forEach((p, i) => {
          let bh = (p.y / top) * ch;

          let x =
            pad.l +
            i * step +
            (step - bw) / 2;

          let y =
            pad.t +
            ch -
            bh;

          ctx.fillStyle = '#16a477';

          ctx.beginPath();

          let r = Math.min(5, bw / 2);

          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(
              x,
              y,
              bw,
              bh,
              [r, r, 0, 0]
            );
          } else {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + bw - r, y);

            ctx.quadraticCurveTo(
              x + bw,
              y,
              x + bw,
              y + r
            );

            ctx.lineTo(
              x + bw,
              y + bh
            );

            ctx.lineTo(x, y + bh);

            ctx.lineTo(x, y + r);

            ctx.quadraticCurveTo(
              x,
              y,
              x + r,
              y
            );

            ctx.closePath();
          }

          ctx.fill();
        });
      } else {
        series.forEach(s => {
          ctx.beginPath();

          s.values.forEach((p, i) => {
            let x =
              pad.l +
              (
                s.values.length === 1
                  ? cw / 2
                  : (i / (s.values.length - 1)) * cw
              );

            let y =
              pad.t +
              ch -
              (p.y / top) * ch;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });

          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.width || 2.5;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';

          ctx.stroke();
        });
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#8290a4';

      let count = Math.min(
        opts.bars ? Math.min(6, n) : 6,
        n
      );

      for (let j = 0; j < count; j++) {
        let i = Math.round(
          (j * (n - 1)) /
            Math.max(1, count - 1)
        );

        let x =
          pad.l +
          (i + 0.5) * step;

        let label =
          series[0].values[i]?.label || '';

        ctx.fillText(
          label.length > 11
            ? label.slice(0, 10)
            : label,
          x,
          h - pad.b + 12
        );
      }

      // Touch-friendly tooltip
      let wrap = canvas.parentElement;

      let tip =
        wrap.querySelector('.chart-tooltip');

      if (!tip) {
        tip = document.createElement('div');
        tip.className = 'chart-tooltip';
        wrap.appendChild(tip);
      }

      tip.style.cssText =
        'display:none;position:absolute;z-index:5;pointer-events:none;background:#142238;color:#fff;border-radius:9px;padding:9px 11px;font:12px/1.5 system-ui;box-shadow:0 5px 18px #14223830;min-width:112px;max-width:190px;white-space:normal';

      function showAt(clientX) {
        let cr =
          canvas.getBoundingClientRect();

        let localX =
          clientX - cr.left;

        if (
          localX < pad.l ||
          localX > w - pad.r
        ) {
          tip.style.display = 'none';
          return;
        }

        let idx;

        if (opts.bars) {
          idx = Math.max(
            0,
            Math.min(
              n - 1,
              Math.floor(
                (localX - pad.l) / step
              )
            )
          );
        } else {
          idx = Math.max(
            0,
            Math.min(
              n - 1,
              Math.round(
                ((localX - pad.l) /
                  cw) *
                  (n - 1)
              )
            )
          );
        }

        let label =
          series[0].values[idx]?.label ||
          '';

        let lines = series
          .map(s => {
            let point =
              s.values[
                Math.min(
                  idx,
                  s.values.length - 1
                )
              ];

            return (
              '<div style="display:flex;gap:8px;justify-content:space-between">' +
              '<span>' +
              (s.name || 'Value') +
              '</span>' +
              '<b>' +
              fmt(point?.y || 0) +
              '</b>' +
              '</div>'
            );
          })
          .join('');

        tip.innerHTML =
          '<div style="font-weight:800;margin-bottom:3px;color:#9de8c9">' +
          label +
          '</div>' +
          lines;

        tip.style.display = 'block';

        let left = Math.max(
          5,
          Math.min(
            w - tip.offsetWidth - 5,
            localX + 10
          )
        );

        let topPos = opts.bars
          ? Math.max(
              5,
              pad.t +
                ch -
                (
                  (series[0].values[idx]?.y ||
                    0) /
                  top
                ) *
                  ch -
                tip.offsetHeight -
                8
            )
          : 12;

        tip.style.left =
          left + 'px';

        tip.style.top =
          topPos + 'px';
      }

      canvas.onmousemove = e =>
        showAt(e.clientX);

      canvas.onmouseleave = () => {
        tip.style.display = 'none';
      };

      canvas.ontouchstart = e => {
        if (e.touches[0]) {
          showAt(
            e.touches[0].clientX
          );
        }
      };

      canvas.ontouchmove = e => {
        if (e.touches[0]) {
          showAt(
            e.touches[0].clientX
          );
        }
      };

      canvas.ontouchend = () => {
        setTimeout(() => {
          tip.style.display = 'none';
        }, 1800);
      };
    }

    function render() {
      dirty = false;

      let years = Math.max(
        0.1,
        Math.min(
          50,
          +$('years').value || 5
        )
      );

      let days = Math.max(
        1,
        Math.round(years * 365)
      );

      let sim = simulate(days);
      let daily = sim.daily;
      let today = new Date();
      today.setHours(12, 0, 0, 0);
      let monthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
        12
      );
      let elapsedMonthDays = today.getDate() - 1;
      let daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();
      let monthToDateSim = simulate(elapsedMonthDays, monthStart);
      let fullMonthSim = simulate(daysInMonth - 1, monthStart);
      let todayInterest =
        monthToDateSim.daily[monthToDateSim.daily.length - 1].earned;
      let cumulativeInterest = monthToDateSim.interest;
      let projectedMonthInterest = fullMonthSim.interest;

      updateInterestProgress(
        todayInterest,
        cumulativeInterest,
        projectedMonthInterest
      );

      model = sim;

      let end = sim.bal;
      let interest = sim.interest;
      let principal = sim.principal;

      $('final').textContent =
        compact(end);

      $('finalDetail').textContent =
        'After ' + years + ' years';

      $('principal').textContent =
        compact(principal);

      $('interest').textContent =
        compact(interest);

      $('growth').textContent =
        (
          principal
            ? (interest / principal) * 100
            : 0
        ).toFixed(1) + '%';

      $('endBadge').textContent =
        years + '-year outlook';

      $('endBalance').textContent =
        fmt(end);

      let groups =
        periodGroups(
          daily,
          interval
        );

      let visible = groups;

      draw(
        $('interestChart'),
        [
          {
            name: 'Interest earned',
            values: visible.map(g => ({
              x: g.day,
              y: g.value,
              label: g.label
            }))
          }
        ],
        {
          bars: true
        }
      );

      let stride = Math.max(
        1,
        Math.ceil(
          daily.length / 160
        )
      );

      let sample =
        daily.filter(
          (r, i) =>
            i % stride === 0 ||
            i === daily.length - 1
        );

      let labels =
        sample.map((r, i) => ({
          x: r.day,
          y: r.principal,
          label:
            r.day === 0
              ? 'Start'
              : r.date.toLocaleDateString(
                  'en-IN',
                  {
                    month: 'short',
                    year: '2-digit'
                  }
                )
        }));

      draw(
        $('growthChart'),
        [
          {
            name: 'Your contributions',
            color: '#4778e8',
            values: labels
          },
          {
            name: 'Interest earned',
            color: '#16a477',
            values: sample.map(r => ({
              x: r.day,
              y: r.interest,
              label: ''
            }))
          },
          {
            name: 'Total balance',
            color: '#172338',
            width: 3,
            values: sample.map(r => ({
              x: r.day,
              y: r.balance,
              label:
                r.day === 0
                  ? 'Start'
                  : r.date.toLocaleDateString(
                      'en-IN',
                      {
                        month: 'short',
                        year: '2-digit'
                      }
                    )
            }))
          }
        ]
      );

      let goal = Math.max(
        1,
        +$('goal').value || 1
      );

      let pct =
        (end / goal) * 100;

      let shown =
        Math.min(100, pct);

      let remaining =
        Math.max(
          0,
          goal - end
        );

      $('goalPct').textContent =
        shown.toFixed(1) + '%';

      $('goalRemaining').textContent =
        remaining
          ? fmt(remaining) +
            ' remaining'
          : 'Goal reached!';

      let gardenMessage =
        'A team at work turns good ideas into revenue.';

      let gardenSub =
        'Save a share of what you earn, then let compounding help it grow.';

      if (pct >= 100) {
        gardenMessage =
          'Your hard work and steady saving reached the goal!';

        gardenSub =
          'Revenue can become lasting wealth when you save and let interest compound.';
      } else if (pct >= 75) {
        gardenMessage =
          'Your work is creating momentum!';

        gardenSub =
          'Keep turning a share of your earnings into savings that can grow.';
      } else if (pct >= 50) {
        gardenMessage =
          'Your growing savings are starting to work for you.';

        gardenSub =
          'Regular saving plus interest on past interest can build momentum.';
      } else if (pct >= 25) {
        gardenMessage =
          'Every great business starts with people and ideas.';

        gardenSub =
          'Save part of the revenue and give your money time to compound.';
      }

      $('gardenMessage').textContent =
        gardenMessage;

      $('gardenSub').textContent =
        gardenSub;

      $('goalBar').style.width =
        shown + '%';

      $('goalCurrent').textContent =
        fmt(end) + ' projected';

      $('goalTarget').textContent =
        'Goal: ' + compact(goal);

      $('goalStatus').textContent =
        end >= goal
          ? 'Goal reached 🎉'
          : 'In progress';

      document
        .querySelectorAll('.mile')
        .forEach(el => {
          el.classList.toggle(
            'done',
            pct >= +el.dataset.m
          );
        });

      let hit = null;

      let goalSim = simulate(
        Math.min(
          365 * 100,
          Math.max(
            days,
            365 * 100
          )
        )
      );

      for (let r of goalSim.daily) {
        if (r.balance >= goal) {
          hit = r;
          break;
        }
      }

      function updateInterestProgress(
        todayInterest,
        cumulativeInterest,
        projectedMonthInterest
      ) {
        $('monthlyInterestForecastValue').textContent =
          compact(projectedMonthInterest);
        $('monthlyInterestForecastDetail').textContent =
          'Estimated for all ' + daysInMonth + ' days of this month.';

        $('todayInterestValue').textContent = compact(todayInterest);
        $('cumulativeInterestValue').textContent = compact(cumulativeInterest);
        updateTimeProgress();
      }

      if (end >= goal) {
        $('goalDate').textContent =
          'Within your plan 🎉';

        $('goalDateNote').textContent =
          'Your projected balance reaches this goal by ' +
          dateAt(days).toLocaleDateString(
            'en-IN',
            {
              month: 'long',
              year: 'numeric'
            }
          );
      } else if (hit) {
        $('goalDate').textContent =
          hit.date.toLocaleDateString(
            'en-IN',
            {
              month: 'long',
              year: 'numeric'
            }
          );

        $('goalDateNote').textContent =
          'About ' +
          Math.floor(hit.day / 365) +
          ' years and ' +
          Math.round(
            (hit.day % 365) / 30
          ) +
          ' months from today';
      } else {
        $('goalDate').textContent =
          'Not reached yet';

        $('goalDateNote').textContent =
          'Try increasing your contribution or duration.';
      }
    }

    inputs.forEach(id =>
      $(id).addEventListener(
        'input',
        () => {
          dirty = true;

          $('calculationStatus').textContent =
            'Inputs changed — press Calculate savings to update your results.';
        }
      )
    );

    $('calculateBtn').addEventListener(
      'click',
      () => {
        const numericIds = [
          'initial',
          'contribution',
          'rate',
          'years',
          'goal'
        ];

        const invalid =
          numericIds.find(
            id =>
              $(id).value === '' ||
              !Number.isFinite(
                Number($(id).value)
              ) ||
              Number($(id).value) < 0
          );

        if (invalid) {
          $('calculationStatus').textContent =
            'Please enter valid non-negative values in all fields.';

          $(invalid).focus();

          return;
        }

        if (
          Number($('years').value) <= 0 ||
          Number($('years').value) > 50 ||
          Number($('rate').value) > 100 ||
          Number($('goal').value) <= 0
        ) {
          $('calculationStatus').textContent =
            'Duration must be greater than 0 and at most 50 years, annual interest at most 100%, and goal greater than 0.';

          return;
        }

        render();

        $('calculationStatus').textContent =
          'Calculated using all current inputs.';
      }
    );

    document
      .querySelectorAll(
        '#intervals button'
      )
      .forEach(b =>
        b.addEventListener(
          'click',
          () => {
            interval = b.dataset.v;

            document
              .querySelectorAll(
                '#intervals button'
              )
              .forEach(x =>
                x.classList.toggle(
                  'active',
                  x === b
                )
              );

            if (dirty) {
              const numericIds = [
                'initial',
                'contribution',
                'rate',
                'years',
                'goal'
              ];

              const invalid =
                numericIds.find(
                  id =>
                    $(id).value === '' ||
                    !Number.isFinite(
                      Number($(id).value)
                    ) ||
                    Number($(id).value) < 0
                );

              if (invalid) {
                $('calculationStatus').textContent =
                  'Please enter valid non-negative values in all fields before changing the chart.';

                $(invalid).focus();

                return;
              }

              if (
                Number($('years').value) <= 0 ||
                Number($('years').value) > 50 ||
                Number($('rate').value) > 100 ||
                Number($('goal').value) <= 0
              ) {
                $('calculationStatus').textContent =
                  'Check duration, interest rate and savings goal before changing the chart.';

                return;
              }

              render();

              $('calculationStatus').textContent =
                'Calculated using all current inputs.';
            } else {
              render();
            }
          }
        )
      );

    let resizeTimer;

    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
          if (!dirty) render();
        }, 100);
      }
    );

    render();

    $('calculationStatus').textContent =
      'Showing default results. Change any input and press Calculate savings to recalculate.';

    const interestProgressTimer = window.setInterval(
      updateTimeProgress,
      60_000
    );

    return () => window.clearInterval(interestProgressTimer);
  }, []);

  return (
    <>
      <header>
        <div className="top">
          <div className="brand">
            ✦ save<span>wise</span>
          </div>

          <div className="tag">
            YOUR MONEY, GROWING
          </div>
        </div>

        <div className="hero">
          <div className="eyebrow">
            Your personal wealth dashboard
          </div>

          <div className="hero-title-row">
            <h1>
              Small steps. Bigger possibilities.
            </h1>
          </div>

          <p>
            See how your regular savings and
            the power of compounding can build
            your future wealth.
          </p>
        </div>
      </header>

      <main>
        <div className="grid">

          <aside className="panel">
            <h2>
              Build your savings plan
            </h2>

            <p className="sub">
              Adjust your numbers to explore
              what’s possible.
            </p>

            <Investments
              onTotalChange={total => {
                const initialInput = document.getElementById('initial');
                initialInput.value = String(total);
                initialInput.dispatchEvent(
                  new Event('input', { bubbles: true })
                );
              }}
            />

            <div className="field">
              <label htmlFor="initial">
                Initial investments
                <span className="hint">
                  ₹
                </span>
              </label>

              <input
                id="initial"
                type="number"
                min="0"
                step="1000"
                defaultValue="0"
                readOnly
                aria-describedby="initialInvestmentsHelp"
              />
              <small id="initialInvestmentsHelp" className="field-help">
                Automatically totaled from your bank investments.
              </small>
            </div>

            <div className="field">
              <label htmlFor="contribution">
                Regular contribution
                <span className="hint">
                  ₹ per period
                </span>
              </label>

              <input
                id="contribution"
                type="number"
                min="0"
                step="500"
                defaultValue="30000"
              />
            </div>

            <div className="field">
              <label htmlFor="frequency">
                Contribution frequency
              </label>

              <select
                id="frequency"
                defaultValue="monthly"
              >
                <option value="daily">
                  Daily
                </option>

                <option value="weekly">
                  Weekly
                </option>

                <option value="monthly">
                  Monthly
                </option>

                <option value="yearly">
                  Yearly
                </option>
              </select>
            </div>

            <div className="pair">

              <div className="field">
                <label htmlFor="rate">
                  Annual interest
                </label>

                <input
                  id="rate"
                  type="number"
                  min="0"
                  max="100"
                  step=".1"
                  defaultValue="7"
                />
              </div>

              <div className="field">
                <label htmlFor="years">
                  Duration (years)
                </label>

                <input
                  id="years"
                  type="number"
                  min=".1"
                  max="50"
                  step=".5"
                  defaultValue="5"
                />
              </div>

            </div>

            <div className="field">
              <label htmlFor="goal">
                Savings goal
                <span className="hint">
                  ₹
                </span>
              </label>

              <input
                id="goal"
                type="number"
                min="1"
                step="10000"
                defaultValue="500000"
              />
            </div>

            <div className="note">
              <b>
                Calculation assumption
              </b>

              <br />

              Interest compounds daily using
              an effective daily rate of
              (1 + annual rate)
              <sup>1/365</sup>
              − 1. Contributions are added
              at the start of each contribution
              period (including today for the
              first period), then earn interest.
              A 365-day year is used; leap days
              are treated as ordinary days.
            </div>

            <button
              type="button"
              id="calculateBtn"
              className="calculate-btn"
            >
              Calculate savings
            </button>

            <div
              id="calculationStatus"
              className="calculation-status"
              role="status"
              aria-live="polite"
            >
              Update your inputs, then select
              Calculate savings.
            </div>
          </aside>

          <div className="right">

            <div className="metrics">

              <div className="metric primary">
                <div className="label">
                  Projected final savings
                </div>

                <div
                  className="value"
                  id="final"
                >
                  —
                </div>

                <div
                  className="detail"
                  id="finalDetail"
                >
                  At the end of your plan
                </div>
              </div>

              <div className="metric">
                <div className="label">
                  Your total contributions
                </div>

                <div
                  className="value"
                  id="principal"
                >
                  —
                </div>

                <div className="detail">
                  Initial savings + deposits
                </div>
              </div>

              <div className="metric">
                <div className="label">
                  Interest earned
                </div>

                <div
                  className="value"
                  id="interest"
                >
                  —
                </div>

                <div className="detail">
                  Growth from compounding
                </div>
              </div>

              <div className="metric">
                <div className="label">
                  Overall growth
                </div>

                <div
                  className="value"
                  id="growth"
                >
                  —
                </div>

                <div className="detail">
                  Interest ÷ your contributions
                </div>
              </div>

            </div>

            <InterestProgress />

            <div className="panel">

              <div className="section-head">

                <div>
                  <h2>
                    Interest earned by interval
                  </h2>

                  <p>
                    Choose Daily, Weekly,
                    Monthly or Yearly to view
                    interest across your full
                    selected duration.
                  </p>
                </div>

                <div
                  className="seg"
                  id="intervals"
                >
                  <button data-v="daily">
                    Daily
                  </button>

                  <button data-v="weekly">
                    Weekly
                  </button>

                  <button
                    data-v="monthly"
                    className="active"
                  >
                    Monthly
                  </button>

                  <button data-v="yearly">
                    Yearly
                  </button>
                </div>

              </div>

              <div className="chart-wrap">
                <canvas
                  id="interestChart"
                  aria-label="Interest earned per interval bar chart"
                ></canvas>
              </div>

            </div>

            <div className="panel">

              <div className="section-head">

                <div>
                  <h2>
                    Your wealth journey
                  </h2>

                  <p>
                    See your contributions,
                    earned interest and total
                    balance over time.
                  </p>
                </div>

                <span
                  className="pill"
                  id="endBadge"
                >
                  5-year outlook
                </span>

              </div>

              <div
                className="savings-journey"
                id="growthGarden"
                aria-label="Animated Axis, Canara, IDFC FIRST, and Kotak Mahindra bank branches transferring money into a savings vault"
              >

                <div className="journey-heading">
                  <span className="journey-kicker">
                    YOUR BANKS TO YOUR SAVINGS
                  </span>

                  <strong id="gardenMessage">
                    Bring your bank savings together.
                  </strong>

                  <span id="gardenSub">
                    Watch your money move into your savings vault.
                  </span>
                </div>

                <div className="growth-scene" aria-hidden="true">
                  <div className="bank-network">
                    {banks.map(bank => (
                      <div className={`bank-branch bank-branch-${bank.id}`} key={bank.id}>
                        <BankLogo bank={bank} />
                        <svg viewBox="0 0 40 27" aria-hidden="true">
                          <path d="M3 9 20 2l17 7H3Zm3 2v11m7-11v11m14-11v11m7-11v11M3 24h34" />
                        </svg>
                        <span>{bank.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bank-transfer-label">SAVINGS TRANSFER</div>
                  <div className="transfer-note transfer-note-one"><span>$</span><span>$100</span><span>$</span></div>
                  <div className="transfer-note transfer-note-two"><span>$</span><span>$100</span><span>$</span></div>
                  <div className="transfer-note transfer-note-three"><span>$</span><span>$100</span><span>$</span></div>

                  <div className="vault-savings">
                    <div className="savings-amount" aria-label="Illustrative savings amount increasing from zero to one thousand dollars">
                      <span>$0</span>
                      <span>$250</span>
                      <span>$500</span>
                      <span>$750</span>
                      <span>$1,000</span>
                    </div>
                    <div className="savings-vault">
                      <div className="vault-interior">
                        <span className="stored-bundle stored-bundle-one"></span>
                        <span className="stored-bundle stored-bundle-two"></span>
                        <span className="stored-bundle stored-bundle-three"></span>
                        <span className="stored-bundle stored-bundle-four"></span>
                      </div>
                      <div className="vault-slot"></div>
                      <div className="vault-door">
                        <span>○</span>
                      </div>
                      <span className="vault-handle"></span>
                    </div>
                    <strong className="vault-label">SAVINGS VAULT</strong>
                  </div>

                  <div className="interest-loop">+ INTEREST</div>
                  <div className="growth-spark spark-one">✦</div>
                  <div className="growth-spark spark-two">✦</div>
                  <div className="growth-ground"></div>
                </div>

                <div className="journey-caption">
                  <span className="journey-live-dot"></span>
                  Earn revenue. Save consistently. Let compounding work.
                </div>

              </div>

              <div className="chart-wrap">
                <canvas
                  id="growthChart"
                  aria-label="Savings growth line chart"
                ></canvas>
              </div>

              <div className="legend">
                <span>
                  <i className="dot dot-blue"></i>
                  Your contributions
                </span>

                <span>
                  <i className="dot dot-green"></i>
                  Interest earned
                </span>

                <span>
                  <i className="dot dot-dark"></i>
                  Total balance
                </span>
              </div>

            </div>

            <div className="two">

              <div className="panel">

                <div className="section-head">

                  <div>
                    <h2>
                      Your savings goal
                    </h2>

                    <p>
                      Every deposit gets you closer.
                    </p>
                  </div>

                  <span
                    className="pill"
                    id="goalStatus"
                  >
                    In progress
                  </span>

                </div>

                <div className="goal-row">
                  <strong id="goalPct">
                    0%
                  </strong>

                  <small id="goalRemaining">
                    — remaining
                  </small>
                </div>

                <div className="progress">
                  <div id="goalBar"></div>
                </div>

                <div className="goal-foot">
                  <span id="goalCurrent">
                    ₹0 saved
                  </span>

                  <span id="goalTarget">
                    Goal: ₹5 lakh
                  </span>
                </div>

                <div className="milestones">
                  <span
                    className="mile"
                    data-m="25"
                  >
                    25%
                  </span>

                  <span
                    className="mile"
                    data-m="50"
                  >
                    50%
                  </span>

                  <span
                    className="mile"
                    data-m="75"
                  >
                    75%
                  </span>

                  <span
                    className="mile"
                    data-m="100"
                  >
                    100% 🎉
                  </span>
                </div>

              </div>

              <div className="panel">

                <h2>
                  Goal timeline
                </h2>

                <p className="sub">
                  Estimated using the same
                  savings and interest assumptions.
                </p>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)'
                  }}
                >
                  Estimated date to reach your goal
                </div>

                <div
                  id="goalDate"
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    margin: '8px 0'
                  }}
                >
                  Calculating…
                </div>

                <div
                  id="goalDateNote"
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)'
                  }}
                >
                  Based on your current plan
                </div>

                <div className="timeline-divider"></div>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)'
                  }}
                >
                  Balance at the end of your plan
                </div>

                <div
                  id="endBalance"
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    marginTop: '5px'
                  }}
                >
                  —
                </div>

              </div>

            </div>

          </div>
        </div>

        <div className="footer">
          A projection, not a guaranteed return.
          Actual savings rates, taxes, fees and
          deposit timing may differ.
        </div>
      </main>
    </>
  );
}