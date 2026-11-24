import { useEffect, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  Coffee,
  LogIn,
  LogOut,
} from 'lucide-react';

import {
  getAttendanceStatus,
  formatTime,
} from './useAttendance';

const WEEKDAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const STATUS_CONFIG = {
  present: {
    label: 'Present',
    background: 'bg-[#176D70]',
    text: 'text-white',
    dot: 'bg-[#176D70]',
    icon: CheckCircle2,
  },

  absent: {
    label: 'Absent',
    background: 'bg-[#C7503E]',
    text: 'text-white',
    dot: 'bg-[#C7503E]',
    icon: XCircle,
  },

  working: {
    label: 'Working',
    background: 'bg-[#F36B21]',
    text: 'text-white',
    dot: 'bg-[#F36B21]',
    icon: Clock3,
  },

  pending: {
    label: 'Pending',
    background: 'bg-[#F36B21]/15',
    text: 'text-[#C55419]',
    dot: 'bg-[#F36B21]',
    icon: Clock3,
  },

  upcoming: {
    label: 'Upcoming',
    background: 'bg-[#F5E4CF]',
    text: 'text-[#857665]',
    dot: 'bg-[#B5A28E]',
    icon: CalendarDays,
  },

  rest: {
    label: 'Rest Day',
    background: 'bg-transparent',
    text: 'text-[#A39280]',
    dot: 'bg-[#C7B8A6]',
    icon: Coffee,
  },
};

function formatSelectedDate(dateKey) {
  if (!dateKey) return '';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${color}`}
      />

      <span className="text-[11px] text-[#857665]">
        {label}
      </span>
    </div>
  );
}

function AttendanceCalendar({
  monthKey,
  records = {},
  now,
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
  onSelectDate,
}) {
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setSelectedDate(null);
  }, [monthKey]);

  const [year, month] = monthKey.split('-').map(Number);

  const firstDay = new Date(
    Date.UTC(year, month - 1, 1)
  ).getUTCDay();

  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    ),
  ];

  const monthDates = Array.from(
    { length: daysInMonth },
    (_, index) =>
      `${monthKey}-${String(index + 1).padStart(2, '0')}`
  );

  const getStatus = (dateKey) =>
    getAttendanceStatus(
      dateKey,
      records[dateKey],
      now
    );

  const presentCount = monthDates.filter(
    (dateKey) => getStatus(dateKey) === 'present'
  ).length;

  const absentCount = monthDates.filter(
    (dateKey) => getStatus(dateKey) === 'absent'
  ).length;

  const selectedRecord = selectedDate
    ? records[selectedDate]
    : null;

  const selectedStatus = selectedDate
    ? getStatus(selectedDate)
    : null;

  const selectedConfig = selectedStatus
    ? STATUS_CONFIG[selectedStatus] || STATUS_CONFIG.upcoming
    : null;

  const SelectedIcon =
    selectedConfig?.icon || CalendarDays;

  const handleDateClick = (dateKey) => {
    setSelectedDate((previous) =>
      previous === dateKey ? null : dateKey
    );

    onSelectDate?.(dateKey);
  };

  return (
    <div className="w-full min-w-0 rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 text-[#191919] sm:p-6">

      {/* HEADER */}

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#857665]">
            <CalendarDays size={15} />

            <span className="text-[11px] font-medium">
              Attendance Calendar
            </span>
          </div>

          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            {monthName} {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canPrevious || !onPrevious}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] text-[#191919] transition-colors hover:border-[#F36B21] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!canNext || !onNext}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] text-[#191919] transition-colors hover:border-[#F36B21] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-3">
          <p className="text-xl font-bold text-[#176D70]">
            {presentCount}
          </p>

          <p className="mt-1 text-[11px] text-[#857665]">
            Present
          </p>
        </div>

        <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-3">
          <p className="text-xl font-bold text-[#C7503E]">
            {absentCount}
          </p>

          <p className="mt-1 text-[11px] text-[#857665]">
            Absent
          </p>
        </div>
      </div>

      {/* CALENDAR GRID */}

      <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-2 sm:p-4">

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="flex h-9 items-center justify-center text-[10px] font-semibold text-[#857665] sm:text-xs"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-10"
                />
              );
            }

            const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;

            const status = getStatus(dateKey);

            const config =
              STATUS_CONFIG[status] ||
              STATUS_CONFIG.upcoming;

            const isToday = dateKey === now.date;
            const isSelected = selectedDate === dateKey;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => handleDateClick(dateKey)}
                title={`${dateKey}: ${config.label}`}
                aria-label={`${formatSelectedDate(dateKey)}: ${config.label}`}
                aria-pressed={isSelected}
                className={`
                  mx-auto flex h-9 w-9
                  items-center justify-center
                  rounded-lg text-xs font-semibold
                  transition-colors
                  sm:h-10 sm:w-10
                  ${config.background}
                  ${config.text}
                  ${
                    isToday
                      ? 'ring-2 ring-[#F36B21] ring-offset-2 ring-offset-[#F5E4CF]'
                      : ''
                  }
                  ${
                    isSelected
                      ? 'outline outline-2 outline-offset-2 outline-[#191919]'
                      : ''
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE */}

      {selectedDate && (
        <div className="mt-4 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              {formatSelectedDate(selectedDate)}
            </h3>

            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${selectedConfig.background} ${selectedConfig.text}`}
            >
              <SelectedIcon size={13} />
              {selectedConfig.label}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-lg border border-[#D8C4AD] bg-[#FAEBD7] p-3">
              <div className="flex items-center gap-2 text-[#857665]">
                <LogIn size={14} />

                <span className="text-[11px]">
                  Time In
                </span>
              </div>

              <p className="mt-2 text-sm font-bold">
                {formatTime(selectedRecord?.timeIn)}
              </p>
            </div>

            <div className="rounded-lg border border-[#D8C4AD] bg-[#FAEBD7] p-3">
              <div className="flex items-center gap-2 text-[#857665]">
                <LogOut size={14} />

                <span className="text-[11px]">
                  Time Out
                </span>
              </div>

              <p className="mt-2 text-sm font-bold">
                {formatTime(selectedRecord?.timeOut)}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* LEGEND */}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[#D8C4AD] pt-4">
        <LegendItem
          color="bg-[#176D70]"
          label="Present"
        />

        <LegendItem
          color="bg-[#C7503E]"
          label="Absent"
        />

        <LegendItem
          color="bg-[#F36B21]"
          label="Working"
        />

        <LegendItem
          color="bg-[#F36B21]/40"
          label="Pending"
        />

        <LegendItem
          color="bg-[#C7B8A6]"
          label="Rest Day"
        />
      </div>

    </div>
  );
}

export default AttendanceCalendar;