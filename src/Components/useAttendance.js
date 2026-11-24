import { useCallback, useEffect, useMemo, useState } from 'react';

export const DAILY_SALARY = 755;
export const PH_TIMEZONE = 'Asia/Manila';
export const ATTENDANCE_KEY = 'workhub_attendance_v1';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PH_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function getPHNow() {
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

export function getPHDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll('/', '-');
}

export function isWorkday(dateKey) {
  const day = new Date(`${dateKey}T12:00:00+08:00`).getUTCDay();

  return day >= 1 && day <= 5;
}

export function getMonthKey(dateKey) {
  return dateKey.slice(0, 7);
}

export function getPreviousMonthKey(year, month) {
  const date = new Date(Date.UTC(year, month - 2, 1));

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, '0')}`;
}

export function formatPHP(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(time) {
  if (!time) return '--:--';

  const [hour, minute] = time.split(':').map(Number);

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function getAttendanceStatus(dateKey, record, now = getPHNow()) {
  if (!isWorkday(dateKey)) return 'rest';

  if (record?.timeIn && record?.timeOut) {
    return 'present';
  }

  if (dateKey > now.date) return 'upcoming';

  if (dateKey === now.date) {
    if (now.hour < 17) {
      return record?.timeIn ? 'working' : 'pending';
    }

    return 'absent';
  }

  return 'absent';
}

function readAttendance() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(ATTENDANCE_KEY) || '{}'
    );

    return stored && typeof stored === 'object' && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}

function pruneAttendance(records, now = getPHNow()) {
  const currentMonth = `${now.year}-${String(now.month).padStart(2, '0')}`;
  const previousMonth = getPreviousMonthKey(now.year, now.month);

  return Object.fromEntries(
    Object.entries(records).filter(([date]) => {
      const month = getMonthKey(date);

      return month === currentMonth || month === previousMonth;
    })
  );
}

export default function useAttendance() {
  const [now, setNow] = useState(getPHNow);

  const [records, setRecords] = useState(() =>
    pruneAttendance(readAttendance())
  );

  const [popup, setPopup] = useState(null);

  const [dismissed, setDismissed] = useState({});

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(getPHNow());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setRecords((previous) => pruneAttendance(previous, now));
  }, [now.year, now.month]);

  useEffect(() => {
    localStorage.setItem(
      ATTENDANCE_KEY,
      JSON.stringify(records)
    );
  }, [records]);

  const todayRecord = records[now.date] || null;

  const timeIn = useCallback(() => {
    const current = getPHNow();

    if (!isWorkday(current.date)) return false;

    let recorded = false;

    setRecords((previous) => {
      const existing = previous[current.date] || {};

      if (existing.timeIn) return previous;

      recorded = true;

      return {
        ...previous,
        [current.date]: {
          ...existing,
          date: current.date,
          timeIn: current.time,
          timeOut: existing.timeOut || null,
        },
      };
    });

    setPopup(null);

    return recorded;
  }, []);

  const timeOut = useCallback(() => {
    const current = getPHNow();

    if (!isWorkday(current.date)) return false;

    setRecords((previous) => {
      const existing = previous[current.date] || {};

      if (!existing.timeIn || existing.timeOut) {
        return previous;
      }

      return {
        ...previous,
        [current.date]: {
          ...existing,
          date: current.date,
          timeOut: current.time,
        },
      };
    });

    setPopup(null);

    return true;
  }, []);

  useEffect(() => {
    if (!isWorkday(now.date)) {
      setPopup(null);
      return;
    }

    const record = records[now.date] || {};

    const currentMinutes = now.hour * 60 + now.minute;

    const timeInKey = `${now.date}-in`;
    const timeOutKey = `${now.date}-out`;

    if (
      currentMinutes >= 17 * 60 &&
      record.timeIn &&
      !record.timeOut &&
      !dismissed[timeOutKey]
    ) {
      setPopup('out');
      return;
    }

    if (
      currentMinutes >= 8 * 60 &&
      currentMinutes < 17 * 60 &&
      !record.timeIn &&
      !dismissed[timeInKey]
    ) {
      setPopup('in');
      return;
    }

    setPopup(null);
  }, [now.date, now.hour, now.minute, records, dismissed]);

  const dismissPopup = useCallback(() => {
    const key = `${now.date}-${popup}`;

    setDismissed((previous) => ({
      ...previous,
      [key]: true,
    }));

    setPopup(null);
  }, [now.date, popup]);

  const currentMonth = `${now.year}-${String(now.month).padStart(2, '0')}`;

  const previousMonth = getPreviousMonthKey(now.year, now.month);

  const getMonthStats = useCallback(
    (monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);

      const daysInMonth = new Date(
        Date.UTC(year, month, 0)
      ).getUTCDate();

      let present = 0;
      let absent = 0;
      let working = 0;
      let pending = 0;
      let workdays = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;

        if (!isWorkday(dateKey)) continue;

        workdays++;

        const status = getAttendanceStatus(
          dateKey,
          records[dateKey],
          now
        );

        if (status === 'present') present++;
        if (status === 'absent') absent++;
        if (status === 'working') working++;
        if (status === 'pending') pending++;
      }

      return {
        present,
        absent,
        working,
        pending,
        workdays,
        earned: present * DAILY_SALARY,
      };
    },
    [records, now.date, now.hour]
  );

  const currentStats = useMemo(
    () => getMonthStats(currentMonth),
    [getMonthStats, currentMonth]
  );

  const previousStats = useMemo(
    () => getMonthStats(previousMonth),
    [getMonthStats, previousMonth]
  );

  return {
    now,
    records,
    popup,
    todayRecord,
    currentMonth,
    previousMonth,
    currentStats,
    previousStats,
    timeIn,
    timeOut,
    dismissPopup,
    getMonthStats,
  };
}