import { useEffect, useState } from 'react';

import {
  Clock3,
  LogIn,
  LogOut,
  CalendarDays,
  Wallet,
  CheckCircle2,
  XCircle,
  CalendarCheck2,
} from 'lucide-react';

import AttendanceCalendar from './AttendanceCalendar';

import {
  DAILY_SALARY,
  formatPHP,
  formatTime,
  getAttendanceStatus,
  isWorkday,
} from './useAttendance';

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_STYLES = {
  present: 'bg-[#176D70]/10 text-[#176D70]',
  absent: 'bg-[#C7503E]/10 text-[#C7503E]',
  working: 'bg-[#F36B21]/10 text-[#C55419]',
  pending: 'bg-[#F36B21]/10 text-[#C55419]',
  upcoming: 'bg-[#EAD5BD] text-[#857665]',
  rest: 'bg-[#EAD5BD] text-[#857665]',
};

// ============================================================
// HELPERS
// ============================================================

function formatDisplayDate(dateKey) {
  if (!dateKey) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function formatFullDate(dateKey) {
  if (!dateKey) return '';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] || STATUS_STYLES.upcoming;

  const labels = {
    present: 'Present',
    absent: 'Absent',
    working: 'Working',
    pending: 'Pending',
    upcoming: 'Upcoming',
    rest: 'Rest Day',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${style}`}
    >
      {labels[status] || status}
    </span>
  );
}

// ============================================================
// CARD
// ============================================================

function Card({ children, className = '' }) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] ${className}`}
    >
      {children}
    </section>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${color}15`,
          color,
        }}
      >
        <Icon size={21} />
      </div>

      <div>
        <p className="text-2xl font-bold text-[#191919]">
          {value}
        </p>

        <p className="mt-1 text-xs text-[#857665]">
          {title}
        </p>
      </div>
    </Card>
  );
}

// ============================================================
// ATTENDANCE
// ============================================================

function Attendance({ attendance }) {
  const {
    now,
    records,
    todayRecord,
    currentMonth,
    previousMonth,
    currentStats,
    previousStats,
    timeIn,
    timeOut,
  } = attendance;

  const [selectedMonth, setSelectedMonth] =
    useState(currentMonth);

  const [selectedDate, setSelectedDate] =
    useState(null);

  // ==========================================================
  // MONTH
  // ==========================================================

  const month =
    selectedMonth === previousMonth
      ? previousMonth
      : currentMonth;

  useEffect(() => {
    if (
      selectedMonth !== currentMonth &&
      selectedMonth !== previousMonth
    ) {
      setSelectedMonth(currentMonth);
      setSelectedDate(null);
    }
  }, [
    selectedMonth,
    currentMonth,
    previousMonth,
  ]);

  const [year, monthNumber] =
    month.split('-').map(Number);

  const daysInMonth = new Date(
    Date.UTC(year, monthNumber, 0)
  ).getUTCDate();

  const dates = Array.from(
    { length: daysInMonth },
    (_, index) =>
      `${month}-${String(daysInMonth - index).padStart(2, '0')}`
  ).filter(isWorkday);

  // ==========================================================
  // TODAY
  // ==========================================================

  const todayStatus = getAttendanceStatus(
    now.date,
    todayRecord,
    now
  );

  const canTimeIn =
    isWorkday(now.date) &&
    !todayRecord?.timeIn;

  const canTimeOut =
    isWorkday(now.date) &&
    !!todayRecord?.timeIn &&
    !todayRecord?.timeOut;

  // ==========================================================
  // SELECTED DATE
  // ==========================================================

  const selectedRecord = selectedDate
    ? records[selectedDate]
    : null;

  const selectedStatus = selectedDate
    ? getAttendanceStatus(
        selectedDate,
        selectedRecord,
        now
      )
    : null;

  // ==========================================================
  // MONTHLY STATS
  // ==========================================================

  const monthStats =
    month === currentMonth
      ? currentStats
      : previousStats;

  const earned =
    monthStats?.earned ??
    monthStats.present * DAILY_SALARY;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-w-0 space-y-5 pb-8 text-[#191919]">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8C4AD] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Attendance
            <span className="text-[#F36B21]">.</span>
          </h2>

          <p className="mt-1 text-xs text-[#857665]">
            Time logs and earnings
          </p>
        </div>

        <span className="rounded-lg border border-[#D8C4AD] bg-[#FAEBD7] px-3 py-2 text-xs font-medium text-[#675C50]">
          Mon–Fri · 8 AM–5 PM
        </span>
      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">

        {/* TIME TRACKER */}

        <Card className="p-5 sm:p-6 md:col-span-1 xl:col-span-7">

          <div className="flex flex-wrap items-start justify-between gap-3">

            <div>
              <div className="flex items-center gap-2 text-[#857665]">
                <Clock3 size={16} />

                <span className="text-xs font-medium">
                  Philippine Time
                </span>
              </div>

              <h3 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                {formatTime(now.time)}
              </h3>

              <p className="mt-2 text-xs text-[#857665]">
                {formatFullDate(now.date)}
              </p>
            </div>

            <StatusBadge status={todayStatus} />

          </div>

          {/* TIME RECORDS */}

          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
              <div className="flex items-center gap-2 text-[#857665]">
                <LogIn size={15} />

                <span className="text-xs">
                  Time In
                </span>
              </div>

              <p className="mt-3 text-lg font-bold">
                {formatTime(todayRecord?.timeIn)}
              </p>
            </div>

            <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
              <div className="flex items-center gap-2 text-[#857665]">
                <LogOut size={15} />

                <span className="text-xs">
                  Time Out
                </span>
              </div>

              <p className="mt-3 text-lg font-bold">
                {formatTime(todayRecord?.timeOut)}
              </p>
            </div>

          </div>

          {/* ACTIONS */}

          <div className="mt-4 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={timeIn}
              disabled={!canTimeIn}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#F36B21] px-3 py-3 text-xs font-bold text-white transition-colors hover:bg-[#DC5814] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogIn size={16} />
              Time In
            </button>

            <button
              type="button"
              onClick={timeOut}
              disabled={!canTimeOut}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#176D70] px-3 py-3 text-xs font-bold text-white transition-colors hover:bg-[#10484A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogOut size={16} />
              Time Out
            </button>

          </div>
        </Card>

        {/* EARNINGS */}

        <Card className="flex flex-col justify-between p-5 sm:p-6 md:col-span-1 xl:col-span-5">

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-2 text-[#857665]">
              <Wallet size={17} />

              <span className="text-xs font-medium">
                Estimated Earnings
              </span>
            </div>

            <span className="text-[11px] text-[#857665]">
              {month === currentMonth
                ? 'This Month'
                : 'Last Month'}
            </span>
          </div>

          <div className="my-7">
            <h3 className="break-words text-4xl font-bold tracking-tight text-[#176D70] sm:text-5xl">
              {formatPHP(earned)}
            </h3>

            <p className="mt-3 text-xs text-[#857665]">
              {getMonthLabel(month)}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">

            <span className="text-xs text-[#857665]">
              Daily Rate
            </span>

            <span className="text-sm font-bold">
              {formatPHP(DAILY_SALARY)}
            </span>

          </div>
        </Card>

        {/* PRESENT */}

        <div className="md:col-span-1 xl:col-span-6">
          <StatCard
            title="Days Present"
            value={monthStats.present}
            icon={CheckCircle2}
            color="#176D70"
          />
        </div>

        {/* ABSENT */}

        <div className="md:col-span-1 xl:col-span-6">
          <StatCard
            title="Days Absent"
            value={monthStats.absent}
            icon={XCircle}
            color="#C7503E"
          />
        </div>

        {/* CALENDAR */}

        <div className="min-w-0 md:col-span-1 xl:col-span-6">
          <AttendanceCalendar
            monthKey={month}
            records={records}
            now={now}
            onPrevious={() => {
              setSelectedMonth(previousMonth);
              setSelectedDate(null);
            }}
            onNext={() => {
              setSelectedMonth(currentMonth);
              setSelectedDate(null);
            }}
            canPrevious={month !== previousMonth}
            canNext={month !== currentMonth}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* HISTORY */}

        <Card className="flex min-w-0 flex-col overflow-hidden md:col-span-1 xl:col-span-6">

          <div className="flex items-center justify-between gap-3 border-b border-[#D8C4AD] p-4 sm:p-5">

            <div className="flex items-center gap-2">
              <CalendarCheck2
                size={18}
                className="text-[#176D70]"
              />

              <h3 className="text-sm font-bold">
                Attendance History
              </h3>
            </div>

            <span className="text-[11px] text-[#857665]">
              {getMonthLabel(month)}
            </span>

          </div>

          {/* TABLE HEADER */}

          <div className="grid grid-cols-[1.1fr_1fr_1fr_auto] gap-2 border-b border-[#D8C4AD] bg-[#F5E4CF] px-4 py-3 text-[10px] font-semibold text-[#857665] sm:px-5">
            <span>Date</span>
            <span>In</span>
            <span>Out</span>
            <span>Status</span>
          </div>

          {/* TABLE BODY */}

          <div className="max-h-[500px] flex-1 overflow-y-auto">

            {dates.map((date) => {
              const record = records[date];

              const status = getAttendanceStatus(
                date,
                record,
                now
              );

              const isSelected =
                selectedDate === date;

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() =>
                    setSelectedDate(date)
                  }
                  className={`grid w-full grid-cols-[1.1fr_1fr_1fr_auto] items-center gap-2 border-b border-[#D8C4AD] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#F5E4CF] sm:px-5 ${
                    isSelected
                      ? 'bg-[#F36B21]/10'
                      : ''
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {formatDisplayDate(date)}
                  </span>

                  <span className="text-[11px] text-[#857665]">
                    {formatTime(record?.timeIn)}
                  </span>

                  <span className="text-[11px] text-[#857665]">
                    {formatTime(record?.timeOut)}
                  </span>

                  <StatusBadge status={status} />
                </button>
              );
            })}

          </div>

          <div className="border-t border-[#D8C4AD] px-4 py-3 text-[10px] text-[#857665] sm:px-5">
            {dates.length} workdays
          </div>

        </Card>

        {/* SELECTED DAY */}

        {selectedDate && (
          <Card className="p-5 md:col-span-2 xl:col-span-12">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <p className="text-[11px] text-[#857665]">
                  Selected Date
                </p>

                <h3 className="mt-1 text-base font-bold">
                  {formatFullDate(selectedDate)}
                </h3>
              </div>

              <StatusBadge status={selectedStatus} />

            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
                <div className="flex items-center gap-2 text-[#857665]">
                  <LogIn size={15} />

                  <span className="text-xs">
                    Time In
                  </span>
                </div>

                <p className="mt-2 text-lg font-bold">
                  {formatTime(selectedRecord?.timeIn)}
                </p>
              </div>

              <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
                <div className="flex items-center gap-2 text-[#857665]">
                  <LogOut size={15} />

                  <span className="text-xs">
                    Time Out
                  </span>
                </div>

                <p className="mt-2 text-lg font-bold">
                  {formatTime(selectedRecord?.timeOut)}
                </p>
              </div>

            </div>

          </Card>
        )}

      </div>

      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#857665]">
        <span>
          Records available for the current and previous month.
        </span>

        <span className="flex items-center gap-2">
          <CalendarDays size={13} />
          Philippine Standard Time
        </span>
      </div>

    </div>
  );
}

export default Attendance;