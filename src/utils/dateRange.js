function rangeToDates(range = '7d') {
  const now = new Date();
  const start = new Date(now);

  const m = /^(\d+)(d|w|m)$/.exec(range);
  if (!m)
    return { start: new Date(now.getTime() - 7 * 24 * 3600 * 1000), end: now };

  const n = Number(m[1]);
  const unit = m[2];

  const day = 24 * 3600 * 1000;
  if (unit === 'd') start.setTime(now.getTime() - n * day);
  if (unit === 'w') start.setTime(now.getTime() - n * 7 * day);
  if (unit === 'm') start.setMonth(now.getMonth() - n);

  return { start, end: now };
}

module.exports = { rangeToDates };
