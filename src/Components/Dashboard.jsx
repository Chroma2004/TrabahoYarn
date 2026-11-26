import {
  ListTodo,
  Clock3,
  CheckCircle2,
  StickyNote,
  Plus,
  Circle,
  CalendarDays,
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  FileImage,
  ExternalLink,
} from 'lucide-react';

import { getAttendanceStatus } from './useAttendance';

// ============================================================
// CUSTOM FACEBOOK ICON
// ============================================================

function Facebook({ size = 20, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 8.5V6.8c0-.8.5-1 1-1h2.6V2h-3.5C10.2 2 9 4.4 9 6.7v1.8H6V12h3v10h5V12h3.3l.5-3.5H14z" />
    </svg>
  );
}

// ============================================================
// THEME
// ============================================================

const THEME = {
  background: '#F1DFCA',
  card: '#FAEBD7',
  orange: '#F36B21',
  teal: '#176D70',
  darkTeal: '#10484A',
  text: '#191919',
  muted: '#857665',
  border: '#D8C4AD',
};

// ============================================================
// QUICK LINKS
// ============================================================

const QUICK_LINKS = [
  {
    title: 'Media App',
    description: 'Media workspace',
    icon: LayoutGrid,
    url: 'https://spmadridlaw.sg.larksuite.com/wiki/D9yVwowADiZtQZkSrRQl7POVgje?sheet=4AFbz3',
    color: THEME.orange,
  },
  {
    title: 'Poster Request',
    description: 'Poster requests',
    icon: FileImage,
    url: 'https://spmadridlaw.sg.larksuite.com/wiki/T2SwwkxBxiVELhkncgLlnPqhgse',
    color: THEME.teal,
  },
  {
    title: 'Madrid Careers',
    description: 'Facebook Page',
    icon: Facebook,
    url: 'https://www.facebook.com/madridphcareers',
    color: '#1877F2',
  },
  {
    title: 'Madrid Philippines',
    description: 'Facebook Page',
    icon: Facebook,
    url: 'https://www.facebook.com/madridph',
    color: '#1877F2',
  },
];

// ============================================================
// SHARED COMPONENTS
// ============================================================

function Card({ children, className = '' }) {
  return (
    <div
      className={`min-w-0 border border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  icon: Icon,
  action,
  onAction,
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">

      <div className="flex min-w-0 items-center gap-2.5">

        {Icon && (
          <Icon
            size={18}
            strokeWidth={1.8}
            className="shrink-0 text-[#176D70]"
          />
        )}

        <h3 className="truncate text-sm font-bold text-[#191919]">
          {title}
        </h3>

      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#857665] transition-colors hover:text-[#F36B21]"
        >
          {action}
          <ArrowUpRight size={14} />
        </button>
      )}

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  icon: Icon,
  accent = false,
}) {
  return (
    <Card className="flex h-full min-h-[120px] flex-col justify-between">

      <div className="flex items-center justify-between gap-3">

        <p className="text-xs font-medium text-[#857665]">
          {title}
        </p>

        <Icon
          size={19}
          strokeWidth={1.8}
          className={
            accent
              ? 'text-[#F36B21]'
              : 'text-[#176D70]'
          }
        />

      </div>

      <p className="mt-5 text-4xl font-bold tracking-tight text-[#191919]">
        {value}
      </p>

    </Card>
  );
}

// ============================================================
// QUICK ACCESS CARD
// ============================================================

function QuickAccessCard({
  title,
  description,
  icon: Icon,
  url,
  color,
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        group flex min-w-0 items-center gap-3
        border border-[#D8C4AD]
        bg-[#FAEBD7]
        p-4
        transition-all duration-200
        hover:border-[#F36B21]
        hover:bg-[#F5E4CF]
      "
    >

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center text-white"
        style={{ backgroundColor: color }}
      >
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">

        <h3
          title={title}
          className="truncate text-xs font-bold text-[#191919]"
        >
          {title}
        </h3>

        <p className="mt-1 truncate text-[10px] text-[#857665]">
          {description}
        </p>

      </div>

      <ExternalLink
        size={15}
        strokeWidth={1.8}
        className="shrink-0 text-[#857665] transition-colors group-hover:text-[#F36B21]"
      />

    </a>
  );
}

// ============================================================
// MINI CALENDAR
// ============================================================

function MiniAttendanceCalendar({
  monthKey,
  records,
  now,
  navigate,
}) {
  const [year, month] = monthKey
    .split('-')
    .map(Number);

  const firstDay = new Date(
    Date.UTC(year, month - 1, 1)
  ).getUTCDay();

  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC',
  }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );

  const weekdays = [
    'S',
    'M',
    'T',
    'W',
    'T',
    'F',
    'S',
  ];

  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    ),
  ];

  const getDayClass = (dateKey) => {
    const status = getAttendanceStatus(
      dateKey,
      records?.[dateKey],
      now
    );

    if (dateKey === now.date) {
      return 'bg-[#F36B21] text-white';
    }

    if (status === 'present') {
      return 'bg-[#176D70] text-white';
    }

    if (status === 'absent') {
      return 'bg-[#F36B21]/15 text-[#C7503E]';
    }

    if (status === 'working') {
      return 'bg-[#F36B21]/15 text-[#F36B21]';
    }

    if (status === 'rest') {
      return 'text-[#B6A38F]';
    }

    return 'text-[#191919]';
  };

  return (
    <div className="flex h-full w-full flex-col">

      {/* MONTH */}

      <div className="mb-4 flex items-center justify-between">

        <p className="text-sm font-bold text-[#191919]">
          {monthName} {year}
        </p>

        <button
          type="button"
          onClick={() => navigate('attendance')}
          className="text-[#857665] transition-colors hover:text-[#F36B21]"
          aria-label="View attendance"
        >
          <ArrowUpRight size={17} />
        </button>

      </div>

      {/* CALENDAR DAYS */}

      <div className="grid grid-cols-7 gap-1">

        {weekdays.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="flex h-8 items-center justify-center text-[11px] font-medium text-[#857665]"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square"
              />
            );
          }

          const dateKey = `${monthKey}-${String(day).padStart(
            2,
            '0'
          )}`;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => navigate('attendance')}
              aria-label={dateKey}
              className={`
                mx-auto flex aspect-square
                w-full max-w-10 items-center
                justify-center rounded-full
                text-xs font-medium
                transition-opacity hover:opacity-70
                ${getDayClass(dateKey)}
              `}
            >
              {day}
            </button>
          );
        })}

      </div>

      {/* LEGEND */}

      <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">

        <span className="flex items-center gap-1.5 text-[10px] text-[#857665]">
          <span className="h-2 w-2 rounded-full bg-[#F36B21]" />
          Today
        </span>

        <span className="flex items-center gap-1.5 text-[10px] text-[#857665]">
          <span className="h-2 w-2 rounded-full bg-[#176D70]" />
          Present
        </span>

        <span className="flex items-center gap-1.5 text-[10px] text-[#857665]">
          <span className="h-2 w-2 rounded-full bg-[#F36B21]/20" />
          Absent
        </span>

      </div>

    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({
  tasks = [],
  notes = [],
  navigate,
  addTask,
  attendance,
}) {
  // ==========================================================
  // TASKS
  // ==========================================================

  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.completed
  ).length;

  const pending = total - completed;

  const progress = total
    ? Math.round((completed / total) * 100)
    : 0;

  const pendingTasks = tasks
    .filter((task) => !task.completed)
    .slice(0, 5);

  // ==========================================================
  // NOTES
  // ==========================================================

  const recentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0) -
        new Date(a.updatedAt || 0)
    )
    .slice(0, 4);

  // ==========================================================
  // ATTENDANCE
  // ==========================================================

  const {
    now,
    records,
    currentMonth,
  } = attendance;

  // ==========================================================
  // DATE
  // ==========================================================

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(`${now.date}T12:00:00Z`)
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-w-0 bg-[#F1DFCA] pb-8 text-[#191919]">

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <section className="col-span-1 flex flex-wrap items-center justify-between gap-4 border border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:col-span-2 lg:col-span-12">

          <div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Dashboard
              <span className="text-[#F36B21]">.</span>
            </h1>

            <p className="mt-1 text-xs text-[#857665]">
              {formattedDate}
            </p>

          </div>

          <button
            type="button"
            onClick={addTask}
            className="flex w-fit items-center justify-center gap-2 bg-[#F36B21] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#DC5814]"
          >
            <Plus size={17} />
            New Task
          </button>

        </section>

        {/* ================================================== */}
        {/* QUICK ACCESS */}
        {/* ================================================== */}

        <section className="col-span-1 min-w-0 py-1 sm:col-span-2 lg:col-span-12">

          <div className="mb-3 flex items-center justify-between">

            <h2 className="text-sm font-bold text-[#191919]">
              Quick Access
            </h2>

          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

            {QUICK_LINKS.map((link) => (
              <QuickAccessCard
                key={link.title}
                {...link}
              />
            ))}

          </div>

        </section>

        {/* ================================================== */}
        {/* QUICK STATS */}
        {/* ================================================== */}

        <div className="col-span-1 lg:col-span-3">

          <StatCard
            title="All Tasks"
            value={total}
            icon={ListTodo}
            accent
          />

        </div>

        <div className="col-span-1 lg:col-span-3">

          <StatCard
            title="To Do"
            value={pending}
            icon={Clock3}
          />

        </div>

        <div className="col-span-1 lg:col-span-3">

          <StatCard
            title="Completed"
            value={completed}
            icon={CheckCircle2}
          />

        </div>

        <div className="col-span-1 lg:col-span-3">

          <StatCard
            title="Notes"
            value={notes.length}
            icon={StickyNote}
          />

        </div>

        {/* ================================================== */}
        {/* TASK PROGRESS */}
        {/* ================================================== */}

        <Card className="col-span-1 flex flex-col sm:col-span-2 lg:col-span-8">

          <CardHeader
            title="Task Progress"
            icon={TrendingUp}
            action="View Tasks"
            onAction={() => navigate('tasks')}
          />

          <div className="flex flex-1 flex-col justify-center">

            {/* PROGRESS PERCENTAGE */}

            <div className="flex items-end justify-between gap-4">

              <p className="text-6xl font-bold tracking-tight text-[#F36B21] sm:text-7xl">
                {progress}
                <span className="text-3xl sm:text-4xl">
                  %
                </span>
              </p>

              <span className="pb-1 text-xs font-medium text-[#857665]">
                {completed} of {total} tasks
              </span>

            </div>

            {/* PROGRESS BAR */}

            <div
              role="progressbar"
              aria-label="Task progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-6 h-3 w-full overflow-hidden bg-[#D8C4AD]"
            >

              <div
                className="h-full bg-[#176D70] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />

            </div>

            {/* PROGRESS BREAKDOWN */}

            <div className="mt-6 grid grid-cols-2 gap-3">

              <div className="border border-[#D8C4AD] p-4">

                <div className="flex items-center gap-2 text-[#176D70]">

                  <CheckCircle2 size={15} />

                  <span className="text-xs font-medium">
                    Completed
                  </span>

                </div>

                <p className="mt-3 text-3xl font-bold text-[#176D70]">
                  {completed}
                </p>

              </div>

              <div className="border border-[#D8C4AD] p-4">

                <div className="flex items-center gap-2 text-[#F36B21]">

                  <Clock3 size={15} />

                  <span className="text-xs font-medium">
                    Remaining
                  </span>

                </div>

                <p className="mt-3 text-3xl font-bold text-[#F36B21]">
                  {pending}
                </p>

              </div>

            </div>

          </div>

        </Card>

        {/* ================================================== */}
        {/* CALENDAR */}
        {/* ================================================== */}

        <Card className="col-span-1 flex flex-col sm:col-span-2 lg:col-span-4">

          <CardHeader
            title="Calendar"
            icon={CalendarDays}
          />

          <MiniAttendanceCalendar
            monthKey={currentMonth}
            records={records}
            now={now}
            navigate={navigate}
          />

        </Card>

        {/* ================================================== */}
        {/* UPCOMING TASKS */}
        {/* ================================================== */}

        <Card className="col-span-1 flex min-w-0 flex-col sm:col-span-1 lg:col-span-6">

          <CardHeader
            title="Up Next"
            icon={ListTodo}
            action="See All"
            onAction={() => navigate('tasks')}
          />

          {pendingTasks.length ? (
            <div className="divide-y divide-[#D8C4AD]">

              {pendingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate('tasks')}
                  className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:text-[#F36B21]"
                >

                  <Circle
                    size={17}
                    className="shrink-0 text-[#176D70]"
                  />

                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {task.title}
                  </p>

                  <span
                    className={`
                      shrink-0 px-2 py-1
                      text-[10px] font-semibold
                      ${
                        task.priority === 'High'
                          ? 'bg-[#C7503E]/10 text-[#C7503E]'
                          : task.priority === 'Low'
                            ? 'bg-[#176D70]/10 text-[#176D70]'
                            : 'bg-[#EAD5BD] text-[#857665]'
                      }
                    `}
                  >
                    {task.priority || 'Medium'}
                  </span>

                </button>
              ))}

            </div>
          ) : (
            <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center text-center">

              <CheckCircle2
                size={29}
                strokeWidth={1.7}
                className="text-[#176D70]"
              />

              <p className="mt-3 text-sm font-semibold">
                All caught up
              </p>

              <button
                type="button"
                onClick={addTask}
                className="mt-3 text-xs font-semibold text-[#F36B21]"
              >
                Add a task
              </button>

            </div>
          )}

        </Card>

        {/* ================================================== */}
        {/* RECENT NOTES */}
        {/* ================================================== */}

        <Card className="col-span-1 flex min-w-0 flex-col sm:col-span-1 lg:col-span-6">

          <CardHeader
            title="Recent Notes"
            icon={StickyNote}
            action="See All"
            onAction={() => navigate('notes')}
          />

          {recentNotes.length ? (
            <div className="divide-y divide-[#D8C4AD]">

              {recentNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => navigate('notes')}
                  className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:text-[#F36B21]"
                >

                  <StickyNote
                    size={17}
                    className="shrink-0 text-[#176D70]"
                  />

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-medium">
                      {note.title || 'Untitled Note'}
                    </p>

                    <p className="mt-1 truncate text-xs text-[#857665]">
                      {note.content || 'Empty note'}
                    </p>

                  </div>

                  <ArrowUpRight
                    size={15}
                    className="shrink-0 text-[#857665]"
                  />

                </button>
              ))}

            </div>
          ) : (
            <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center text-center">

              <StickyNote
                size={29}
                strokeWidth={1.7}
                className="text-[#176D70]"
              />

              <p className="mt-3 text-sm font-semibold">
                No notes yet
              </p>

              <button
                type="button"
                onClick={() => navigate('notes')}
                className="mt-3 text-xs font-semibold text-[#F36B21]"
              >
                Create a note
              </button>

            </div>
          )}

        </Card>

      </div>

    </div>
  );
}

export default Dashboard;