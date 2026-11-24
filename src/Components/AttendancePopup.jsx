import {
  Clock3,
  LogIn,
  LogOut,
  X,
} from 'lucide-react';

import {
  formatTime,
} from './useAttendance';

// ============================================================
// ATTENDANCE POPUP
// ============================================================

function AttendancePopup({
  type,
  now,
  onTimeIn,
  onTimeOut,
  onClose,
}) {
  if (!type) return null;

  const isTimeIn = type === 'in';

  const accentColor = isTimeIn
    ? '#F36B21'
    : '#176D70';

  const title = isTimeIn
    ? 'Time to Clock In'
    : 'Time to Clock Out';

  const description = isTimeIn
    ? 'Ready to start your workday?'
    : 'Your workday is complete.';

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#191919]/50 p-4 backdrop-blur-sm">

      {/* MODAL */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-reminder-title"
        className="relative w-full max-w-[420px] rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-6 text-[#191919] shadow-xl sm:p-8"
      >

        {/* CLOSE */}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-md p-2 text-[#857665] transition-colors hover:bg-[#F1DFCA]"
          aria-label="Close reminder"
        >
          <X size={19} />
        </button>

        {/* ICON */}

        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg text-white"
          style={{
            backgroundColor: accentColor,
          }}
        >
          {isTimeIn ? (
            <LogIn size={23} />
          ) : (
            <LogOut size={23} />
          )}
        </div>

        {/* TITLE */}

        <div className="mt-6">

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#857665]">
            Attendance Reminder
          </p>

          <h2
            id="attendance-reminder-title"
            className="text-2xl font-bold tracking-tight"
          >
            {title}
          </h2>

          <p className="mt-2 text-sm text-[#857665]">
            {description}
          </p>

        </div>

        {/* CURRENT TIME */}

        <div className="mt-6 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-5">

          <div className="flex items-center gap-2 text-[#857665]">
            <Clock3 size={16} />

            <span className="text-xs font-medium">
              Current Time
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-[#191919]">
            {formatTime(now.time)}
          </p>

          <p className="mt-2 text-[11px] text-[#857665]">
            Philippine Standard Time
          </p>

        </div>

        {/* ACTION */}

        <button
          type="button"
          onClick={
            isTimeIn
              ? onTimeIn
              : onTimeOut
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{
            backgroundColor: accentColor,
          }}
        >
          {isTimeIn ? (
            <LogIn size={18} />
          ) : (
            <LogOut size={18} />
          )}

          {isTimeIn
            ? 'Time In'
            : 'Time Out'}
        </button>

        {/* SECONDARY ACTION */}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-xs font-semibold text-[#857665] transition-colors hover:text-[#191919]"
        >
          Remind Me Later
        </button>

      </div>
    </div>
  );
}

export default AttendancePopup;