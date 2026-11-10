export function summarize(rows, daysStored, shelfLife) {
  if (!rows || !rows.length) return null;
  const today = rows[0];
  const best = rows.reduce((a, b) => (b.expected_value > a.expected_value ? b : a));
  const last = rows[rows.length - 1];
  return {
    days_left_before_spoiled: Math.max(shelfLife - daysStored, 0),
    value_if_sold_today: today.expected_value,
    best_day_to_sell: best.sell_on,
    wait_days_for_best: best.wait_days,
    value_on_best_day: best.expected_value,
    loss_if_you_wait_until_the_end: Math.round((today.expected_value - last.expected_value) * 100) / 100,
    rows,
  };
}
