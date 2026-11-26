import {
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';

import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Check,
  X,
  CalendarDays,
  Circle,
  CheckCircle2,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Image,
  Clapperboard,
  Camera,
  Video,
  Palette,
  BriefcaseBusiness,
  Layers3,
  ExternalLink,
  Link2,
  Eye,
  Clock,
} from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CATEGORIES = [
  {
    name: 'GPX Design (Poster)',
    shortName: 'GPX Design',
    icon: Image,
    background: '#FCE0CA',
    activeBackground: '#F8C9A5',
    text: '#A94D19',
    border: '#E8A06C',
    linkLabel: 'GPX Link',
    requiresLink: true,
  },
  {
    name: 'Video Edit',
    shortName: 'Video Edit',
    icon: Clapperboard,
    background: '#E8DDF8',
    activeBackground: '#D7C4F3',
    text: '#7651A8',
    border: '#B69ADE',
    linkLabel: 'Video Link',
    requiresLink: true,
  },
  {
    name: 'Event Assistance (Photography and Videography)',
    shortName: 'Event Assist',
    icon: Camera,
    background: '#D9EAF8',
    activeBackground: '#BCDDF5',
    text: '#356F9C',
    border: '#8ABCE0',
    linkLabel: 'Project Link',
    requiresLink: false,
  },
  {
    name: 'Key Visuals Design',
    shortName: 'KV Design',
    icon: Palette,
    background: '#F8DDE8',
    activeBackground: '#F2C5D7',
    text: '#AC4C73',
    border: '#E4A0BB',
    linkLabel: 'KV Link',
    requiresLink: true,
  },
  {
    name: 'Recruitment Video Shoot',
    shortName: 'Recruitment Shoot',
    icon: Video,
    background: '#D6F0EB',
    activeBackground: '#B8E4DC',
    text: '#287C73',
    border: '#8CCBC0',
    linkLabel: 'Shoot Link',
    requiresLink: false,
  },
  {
    name: 'External Client Request',
    shortName: 'Client Request',
    icon: BriefcaseBusiness,
    background: '#DCEEDC',
    activeBackground: '#C5E3C5',
    text: '#397B49',
    border: '#98C99D',
    linkLabel: 'Project Link',
    requiresLink: false,
  },
  {
    name: 'Other',
    shortName: 'Other',
    icon: Layers3,
    background: '#F8EDCB',
    activeBackground: '#F0DFA5',
    text: '#9B762B',
    border: '#DDC37A',
    linkLabel: 'Project Link',
    requiresLink: false,
  },
];

const PRIORITIES = ['Low', 'Medium', 'High'];

const FILTERS = ['All', 'To Do', 'Done'];

const emptyTask = {
  title: '',
  description: '',
  priority: 'Medium',
  category: 'GPX Design (Poster)',
  taskDate: '',
  dueDate: '',
};

const inputClass =
  'w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] px-4 py-3 text-sm text-[#191919] outline-none transition-colors focus:border-[#F36B21]';

const labelClass =
  'mb-2 block text-xs font-semibold text-[#675C50]';

const detailLabelClass =
  'mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#857665]';

// ============================================================
// DATE HELPERS
// ============================================================

function getPHDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month) - 1,
    day: Number(values.day),
    date: `${values.year}-${values.month}-${values.day}`,
  };
}

function getMonthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function getDateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(
    year,
    monthIndex + 1,
    0
  ).getDate();
}

function getPHDateFromTimestamp(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDateKey(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T12:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function getTaskDate(task) {
  if (isValidDateKey(task.taskDate)) {
    return task.taskDate;
  }

  const createdDate = getPHDateFromTimestamp(
    task.createdAt
  );

  if (
    task.month &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(task.month)
  ) {
    if (
      createdDate &&
      createdDate.slice(0, 7) === task.month
    ) {
      return createdDate;
    }

    if (
      isValidDateKey(task.dueDate) &&
      task.dueDate.slice(0, 7) === task.month
    ) {
      return task.dueDate;
    }

    return '';
  }

  return createdDate || '';
}

function getTaskMonth(task) {
  if (isValidDateKey(task.taskDate)) {
    return task.taskDate.slice(0, 7);
  }

  if (
    task.month &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(task.month)
  ) {
    return task.month;
  }

  const createdDate = getPHDateFromTimestamp(
    task.createdAt
  );

  if (createdDate) {
    return createdDate.slice(0, 7);
  }

  const today = getPHDate();

  return getMonthKey(
    today.year,
    today.month
  );
}

function formatDueDate(dateString) {
  if (!dateString) return '';

  const date = new Date(
    `${dateString}T12:00:00Z`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'Not recorded';
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function getWeekday(year, month, day) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(
    new Date(Date.UTC(year, month, day))
  );
}

// ============================================================
// CATEGORY AND PRIORITY HELPERS
// ============================================================

function getCategoryDetails(category) {
  return (
    CATEGORIES.find(
      (item) => item.name === category
    ) || {
      name: category || 'Other',
      shortName: category || 'Other',
      icon: Layers3,
      background: '#F8EDCB',
      activeBackground: '#F0DFA5',
      text: '#9B762B',
      border: '#DDC37A',
      linkLabel: 'Project Link',
      requiresLink: false,
    }
  );
}

function getPriorityStyle(priority) {
  switch (priority) {
    case 'High':
      return 'text-[#C7503E]';

    case 'Low':
      return 'text-[#176D70]';

    default:
      return 'text-[#B77A35]';
  }
}

// ============================================================
// LINK HELPERS
// ============================================================

function normalizeProjectLink(value) {
  const trimmed = String(value || '').trim();

  if (!trimmed) return '';

  const candidate =
    /^[a-z][a-z\d+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);

    if (
      parsed.protocol !== 'https:' &&
      parsed.protocol !== 'http:'
    ) {
      return '';
    }

    if (
      !parsed.hostname.includes('.') ||
      parsed.username ||
      parsed.password
    ) {
      return '';
    }

    return parsed.href;
  } catch {
    return '';
  }
}

// ============================================================
// CATEGORY BADGE
// ============================================================

function CategoryBadge({
  category,
  compact = false,
}) {
  const details = getCategoryDetails(category);
  const Icon = details.icon;

  return (
    <span
      className={`
        inline-flex max-w-full items-center
        gap-1.5 rounded-md border
        ${
          compact
            ? 'px-2 py-1 text-[10px]'
            : 'px-2.5 py-2 text-[11px]'
        }
        font-semibold leading-snug
      `}
      style={{
        backgroundColor: details.background,
        borderColor: details.border,
        color: details.text,
      }}
    >
      <Icon
        size={compact ? 12 : 14}
        className="shrink-0"
      />

      <span className="break-words">
        {details.name}
      </span>
    </span>
  );
}

// ============================================================
// MONTH SELECTOR
// ============================================================

function MonthSelector({
  selectedYear,
  selectedMonth,
  onSelectMonth,
  onPreviousYear,
  onNextYear,
  onToday,
  maxYear,
}) {
  const isMaxYear = selectedYear >= maxYear;

  return (
    <section className="min-w-0 rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange
            size={17}
            className="text-[#F36B21]"
          />

          <h3 className="text-sm font-bold text-[#191919]">
            Monthly Planner
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="rounded-md border border-[#D8C4AD] px-3 py-1.5 text-[11px] font-semibold text-[#176D70] transition-colors hover:bg-[#F1DFCA]"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onPreviousYear}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#D8C4AD] text-[#675C50] transition-colors hover:bg-[#F1DFCA]"
            aria-label="Previous year"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="min-w-[40px] text-center text-xs font-bold text-[#191919]">
            {selectedYear}
          </span>

          <button
            type="button"
            onClick={onNextYear}
            disabled={isMaxYear}
            aria-label="Next year"
            title={
              isMaxYear
                ? 'Maximum year reached'
                : 'Next year'
            }
            className={`
              flex h-7 w-7 items-center
              justify-center rounded-md border
              transition-colors
              ${
                isMaxYear
                  ? 'cursor-not-allowed border-[#D8C4AD] text-[#B9A895] opacity-40'
                  : 'border-[#D8C4AD] text-[#675C50] hover:bg-[#F1DFCA]'
              }
            `}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* MONTH BUTTONS */}

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-12">
        {MONTHS.map((month, index) => {
          const isSelected =
            selectedMonth === index;

          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelectMonth(index)}
              aria-pressed={isSelected}
              title={month}
              className={`
                flex min-h-[34px] min-w-0
                items-center justify-center
                rounded-md border px-1 py-1.5
                transition-colors
                ${
                  isSelected
                    ? 'border-[#F36B21] bg-[#F36B21] text-white'
                    : 'border-[#D8C4AD] bg-[#F5E4CF] text-[#675C50] hover:border-[#F36B21]'
                }
              `}
            >
              <span className="text-[10px] font-bold uppercase">
                {month.slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// DAILY PLANNER
// ============================================================

function DailyPlanner({
  selectedYear,
  selectedMonth,
  selectedDay,
  onSelectDay,
  tasks,
  today,
}) {
  const scrollContainerRef = useRef(null);
  const selectedDayRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] =
    useState(false);

  const [canScrollRight, setCanScrollRight] =
    useState(false);

  const daysInMonth = getDaysInMonth(
    selectedYear,
    selectedMonth
  );

  const unassignedCount = tasks.filter(
    (task) => !getTaskDate(task)
  ).length;

  // ==========================================================
  // SCROLL POSITION
  // ==========================================================

  const updateScrollState = () => {
    const container =
      scrollContainerRef.current;

    if (!container) return;

    const maxScroll =
      container.scrollWidth -
      container.clientWidth;

    setCanScrollLeft(
      container.scrollLeft > 2
    );

    setCanScrollRight(
      container.scrollLeft < maxScroll - 2
    );
  };

  // ==========================================================
  // AUTO SCROLL TO SELECTED DAY
  // ==========================================================

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container =
        scrollContainerRef.current;

      const selectedButton =
        selectedDayRef.current;

      if (!container) return;

      if (selectedButton) {
        const containerRect =
          container.getBoundingClientRect();

        const buttonRect =
          selectedButton.getBoundingClientRect();

        const targetPosition =
          container.scrollLeft +
          buttonRect.left -
          containerRect.left -
          container.clientWidth / 2 +
          selectedButton.offsetWidth / 2;

        const maxScroll =
          container.scrollWidth -
          container.clientWidth;

        container.scrollTo({
          left: Math.max(
            0,
            Math.min(targetPosition, maxScroll)
          ),
          behavior: 'auto',
        });
      } else {
        container.scrollTo({
          left: 0,
          behavior: 'auto',
        });
      }

      updateScrollState();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    selectedYear,
    selectedMonth,
    selectedDay,
  ]);

  // ==========================================================
  // SCROLL AND RESIZE LISTENERS
  // ==========================================================

  useEffect(() => {
    const container =
      scrollContainerRef.current;

    if (!container) return;

    updateScrollState();

    container.addEventListener(
      'scroll',
      updateScrollState,
      { passive: true }
    );

    window.addEventListener(
      'resize',
      updateScrollState
    );

    let resizeObserver;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(
        updateScrollState
      );

      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener(
        'scroll',
        updateScrollState
      );

      window.removeEventListener(
        'resize',
        updateScrollState
      );

      resizeObserver?.disconnect();
    };
  }, []);

  // ==========================================================
  // MOUSE WHEEL HORIZONTAL SCROLL
  // ==========================================================

  useEffect(() => {
    const container =
      scrollContainerRef.current;

    if (!container) return;

    const handleWheel = (event) => {
      const hasHorizontalOverflow =
        container.scrollWidth >
        container.clientWidth;

      if (
        !hasHorizontalOverflow ||
        event.ctrlKey
      ) {
        return;
      }

      // Allow native trackpad horizontal scrolling.

      if (
        Math.abs(event.deltaX) >=
        Math.abs(event.deltaY)
      ) {
        return;
      }

      const multiplier =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? container.clientWidth
            : 1;

      const delta =
        event.deltaY * multiplier;

      const maxScroll =
        container.scrollWidth -
        container.clientWidth;

      const canMove =
        delta > 0
          ? container.scrollLeft < maxScroll - 1
          : container.scrollLeft > 1;

      // Allow normal page scrolling at either edge.

      if (!canMove) return;

      event.preventDefault();

      container.scrollLeft += delta;
    };

    container.addEventListener(
      'wheel',
      handleWheel,
      { passive: false }
    );

    return () => {
      container.removeEventListener(
        'wheel',
        handleWheel
      );
    };
  }, []);

  // ==========================================================
  // SCROLL ARROW HANDLERS
  // ==========================================================

  const scrollDays = (direction) => {
    const container =
      scrollContainerRef.current;

    if (!container) return;

    const reducedMotion =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    container.scrollBy({
      left:
        direction *
        Math.max(
          160,
          container.clientWidth * 0.65
        ),

      behavior: reducedMotion
        ? 'auto'
        : 'smooth',
    });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 sm:p-5">

      {/* HEADER */}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={17}
            className="text-[#F36B21]"
          />

          <div>
            <h3 className="text-sm font-bold text-[#191919]">
              Daily Planner
            </h3>

            <p className="mt-0.5 text-[10px] text-[#857665]">
              {MONTHS[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectDay(null)}
          aria-pressed={selectedDay === null}
          className={`rounded-md border px-3 py-1.5 text-[10px] font-bold transition-colors ${
            selectedDay === null
              ? 'border-[#F36B21] bg-[#F36B21] text-white'
              : 'border-[#D8C4AD] text-[#675C50] hover:bg-[#F1DFCA]'
          }`}
        >
          All Days
        </button>
      </div>

      {/* SCROLLABLE DAILY PLANNER */}

      <div className="flex min-w-0 items-center gap-2">

        {/* SCROLL LEFT */}

        <button
          type="button"
          onClick={() => scrollDays(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll to previous days"
          className={`
            flex h-8 w-6 shrink-0
            items-center justify-center
            rounded-md border
            transition-colors
            ${
              canScrollLeft
                ? 'border-[#D8C4AD] text-[#675C50] hover:border-[#F36B21] hover:text-[#F36B21]'
                : 'cursor-not-allowed border-transparent text-[#B9A895] opacity-40'
            }
          `}
        >
          <ChevronLeft size={15} />
        </button>

        {/* DAYS CONTAINER */}

        <div
          ref={scrollContainerRef}
          tabIndex={0}
          aria-label="Scrollable days of the month"
          className="
            daily-planner-scroll
            min-w-0 flex-1
            overflow-x-auto overflow-y-hidden
            overscroll-x-contain
            rounded-md pb-2
            outline-none
            focus-visible:ring-1
            focus-visible:ring-[#F36B21]
          "
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor:
              '#D8C4AD transparent',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex w-max min-w-full gap-1.5">

            {Array.from(
              { length: daysInMonth },
              (_, index) => index + 1
            ).map((day) => {
              const dateKey = getDateKey(
                selectedYear,
                selectedMonth,
                day
              );

              const weekday = getWeekday(
                selectedYear,
                selectedMonth,
                day
              );

              const isSelected =
                selectedDay === day;

              const isToday =
                today.year === selectedYear &&
                today.month === selectedMonth &&
                today.day === day;

              const isWeekend =
                weekday === 'Sat' ||
                weekday === 'Sun';

              return (
                <button
                  key={dateKey}
                  ref={
                    isSelected
                      ? selectedDayRef
                      : null
                  }
                  type="button"
                  onClick={() => onSelectDay(day)}
                  aria-pressed={isSelected}
                  aria-current={
                    isToday
                      ? 'date'
                      : undefined
                  }
                  title={`${weekday}, ${MONTHS[selectedMonth]} ${day}, ${selectedYear}`}
                  className={`
                    flex h-[48px] w-[36px]
                    shrink-0 flex-col
                    items-center justify-center
                    gap-1 rounded-md border
                    transition-colors
                    ${
                      isSelected
                        ? 'border-[#F36B21] bg-[#F36B21] text-white'
                        : isToday
                          ? 'border-[#F36B21] bg-[#FCE0CA] text-[#191919]'
                          : 'border-[#D8C4AD] bg-[#F5E4CF] text-[#675C50] hover:border-[#F36B21]'
                    }
                  `}
                >
                  <span
                    className={`text-[8px] font-bold uppercase leading-none ${
                      isSelected
                        ? 'text-white/80'
                        : isWeekend
                          ? 'text-[#C7503E]'
                          : 'text-[#857665]'
                    }`}
                  >
                    {weekday}
                  </span>

                  <span className="text-[13px] font-bold leading-none">
                    {day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SCROLL RIGHT */}

        <button
          type="button"
          onClick={() => scrollDays(1)}
          disabled={!canScrollRight}
          aria-label="Scroll to next days"
          className={`
            flex h-8 w-6 shrink-0
            items-center justify-center
            rounded-md border
            transition-colors
            ${
              canScrollRight
                ? 'border-[#D8C4AD] text-[#675C50] hover:border-[#F36B21] hover:text-[#F36B21]'
                : 'cursor-not-allowed border-transparent text-[#B9A895] opacity-40'
            }
          `}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* OLDER TASKS WITHOUT ASSIGNED DAYS */}

      {unassignedCount > 0 && (
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() =>
              onSelectDay(
                selectedDay === 'unassigned'
                  ? null
                  : 'unassigned'
              )
            }
            className={`text-[10px] font-semibold transition-colors ${
              selectedDay === 'unassigned'
                ? 'text-[#F36B21]'
                : 'text-[#857665] hover:text-[#F36B21]'
            }`}
          >
            {selectedDay === 'unassigned'
              ? 'View All Days'
              : 'View Unassigned Tasks'}
          </button>
        </div>
      )}
    </section>
  );
}

// ============================================================
// CATEGORY FILTER
// ============================================================

function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
}) {
  return (
    <section className="min-w-0 rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#191919]">
          Work Categories
        </h3>

        {selectedCategory !== 'All' && (
          <button
            type="button"
            onClick={() =>
              setSelectedCategory('All')
            }
            className="text-[11px] font-semibold text-[#F36B21]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;

          const isSelected =
            selectedCategory === category.name;

          return (
            <button
              key={category.name}
              type="button"
              title={category.name}
              onClick={() =>
                setSelectedCategory(
                  isSelected
                    ? 'All'
                    : category.name
                )
              }
              aria-pressed={isSelected}
              className="
                flex h-[40px] min-w-0
                items-center justify-center gap-1.5
                rounded-md border px-2
                text-center transition-colors
                hover:brightness-[0.97]
              "
              style={{
                backgroundColor: isSelected
                  ? category.activeBackground
                  : category.background,

                borderColor: isSelected
                  ? category.text
                  : category.border,

                color: category.text,

                boxShadow: isSelected
                  ? `inset 0 0 0 1px ${category.text}`
                  : 'none',
              }}
            >
              <Icon
                size={14}
                strokeWidth={2}
                className="shrink-0"
              />

              <span className="truncate text-[10px] font-bold leading-tight">
                {category.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// TASK ROW
// ============================================================

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onView,
  todayDate,
}) {
  const category = getCategoryDetails(
    task.category
  );

  const taskDate = getTaskDate(task);

  const isOverdue =
    Boolean(task.dueDate) &&
    !task.completed &&
    task.dueDate < todayDate;

  const projectLink = normalizeProjectLink(
    task.projectLink
  );

  return (
    <div
      className={`
        group grid min-w-0
        grid-cols-[auto_minmax(0,1fr)_auto]
        items-start gap-3
        border-b border-[#D8C4AD]
        px-4 py-4 transition-colors
        last:border-b-0
        hover:bg-[#F5E4CF]
        lg:grid-cols-[21px_minmax(0,1fr)_170px_65px_100px_100px]
        lg:items-center lg:gap-3 lg:px-5
        xl:grid-cols-[21px_minmax(0,1fr)_210px_80px_110px_100px]
        ${
          task.completed
            ? 'bg-[#176D70]/[0.04]'
            : ''
        }
      `}
    >

      {/* COMPLETION BUTTON */}

      <button
        type="button"
        onClick={() => onToggle(task)}
        className="mt-0.5 shrink-0 transition-transform hover:scale-110 lg:mt-0"
        aria-label={
          task.completed
            ? 'Mark incomplete'
            : 'Mark complete'
        }
        title={
          task.completed
            ? 'Mark incomplete'
            : 'Mark complete'
        }
      >
        {task.completed ? (
          <CheckCircle2
            size={21}
            className="text-[#176D70]"
          />
        ) : (
          <Circle
            size={21}
            className="text-[#F36B21]"
          />
        )}
      </button>

      {/* TASK INFORMATION */}

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onView(task)}
          className={`break-words text-left text-sm font-semibold transition-colors hover:text-[#F36B21] ${
            task.completed
              ? 'text-[#A39280] line-through'
              : 'text-[#191919]'
          }`}
        >
          {task.title}
        </button>

        {task.description && (
          <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-[#857665]">
            {task.description}
          </p>
        )}

        {/* TASK DATE */}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {taskDate ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#857665]">
              <CalendarDays
                size={12}
                className="text-[#F36B21]"
              />

              {formatDueDate(taskDate)}
            </span>
          ) : (
            <span className="text-[10px] text-[#857665]">
              No assigned day
            </span>
          )}

          {task.completed &&
            task.completedAt && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#176D70]">
                <CheckCircle2 size={12} />

                Completed{' '}

                {formatDueDate(
                  getPHDateFromTimestamp(
                    task.completedAt
                  )
                )}
              </span>
            )}
        </div>

        {/* PROJECT LINK */}

        {projectLink && (
          <a
            href={projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
            style={{
              backgroundColor: category.background,
              borderColor: category.border,
              color: category.text,
            }}
            title={projectLink}
          >
            <Link2 size={13} />

            {category.linkLabel}

            <ExternalLink size={12} />
          </a>
        )}

        {/* MOBILE DETAILS */}

        <div className="mt-2 flex flex-wrap items-center gap-2 lg:hidden">
          <CategoryBadge
            category={task.category}
            compact
          />

          <span
            className={`text-[10px] font-semibold ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority || 'Medium'}
          </span>

          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[10px] ${
                isOverdue
                  ? 'font-semibold text-[#C7503E]'
                  : 'text-[#857665]'
              }`}
            >
              <CalendarDays size={12} />

              Due: {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* DESKTOP CATEGORY */}

      <div className="hidden min-w-0 items-center lg:flex">
        <CategoryBadge
          category={task.category}
        />
      </div>

      {/* DESKTOP PRIORITY */}

      <div className="hidden justify-center lg:flex">
        <span
          className={`text-[11px] font-semibold ${getPriorityStyle(
            task.priority
          )}`}
        >
          {task.priority || 'Medium'}
        </span>
      </div>

      {/* DESKTOP DUE DATE */}

      <div
        className={`hidden items-center gap-1.5 text-[11px] lg:flex ${
          isOverdue
            ? 'font-semibold text-[#C7503E]'
            : 'text-[#857665]'
        }`}
      >
        <CalendarDays
          size={13}
          className="shrink-0"
        />

        <span>
          {task.dueDate
            ? formatDueDate(task.dueDate)
            : '—'}
        </span>
      </div>

      {/* ACTIONS */}

      <div className="flex shrink-0 items-center justify-end gap-0.5">
        <button
          type="button"
          onClick={() => onView(task)}
          className="rounded-md p-2 text-[#857665] transition-colors hover:bg-[#EAD5BD] hover:text-[#176D70]"
          aria-label="View task details"
          title="View details"
        >
          <Eye size={16} />
        </button>

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md p-2 text-[#857665] transition-colors hover:bg-[#EAD5BD] hover:text-[#176D70]"
          aria-label="Edit task"
          title="Edit task"
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-md p-2 text-[#857665] transition-colors hover:bg-[#EAD5BD] hover:text-[#C7503E]"
          aria-label="Delete task"
          title="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TASK GROUP
// ============================================================

function TaskGroup({
  tasks,
  completed = false,
  onToggle,
  onEdit,
  onDelete,
  onView,
  todayDate,
}) {
  if (!tasks.length) return null;

  const Icon = completed
    ? CheckCircle2
    : Circle;

  return (
    <div>

      {/* GROUP HEADER */}

      <div
        className={`flex items-center justify-between gap-3 border-b border-[#D8C4AD] px-4 py-3 sm:px-5 ${
          completed
            ? 'bg-[#D6F0EB]/60'
            : 'bg-[#FCE0CA]/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon
            size={15}
            className={
              completed
                ? 'text-[#176D70]'
                : 'text-[#F36B21]'
            }
          />

          <h4
            className={`text-[11px] font-bold uppercase tracking-wider ${
              completed
                ? 'text-[#176D70]'
                : 'text-[#A94D19]'
            }`}
          >
            {completed
              ? 'Completed Tasks'
              : 'Pending Tasks'}
          </h4>
        </div>

        <span
          className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${
            completed
              ? 'bg-[#D6F0EB] text-[#176D70]'
              : 'bg-[#FCE0CA] text-[#A94D19]'
          }`}
        >
          {tasks.length}
        </span>
      </div>

      {/* TASK ROWS */}

      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          todayDate={todayDate}
        />
      ))}
    </div>
  );
}

// ============================================================
// VIEW TASK DETAILS MODAL
// ============================================================

function TaskDetailsModal({
  task,
  onClose,
  onEdit,
}) {
  if (!task) return null;

  const category = getCategoryDetails(
    task.category
  );

  const projectLink = normalizeProjectLink(
    task.projectLink
  );

  const taskDate = getTaskDate(task);

  const isOverdue =
    Boolean(task.dueDate) &&
    !task.completed &&
    task.dueDate < getPHDate().date;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#191919]/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        className="my-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] shadow-xl"
      >

        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FCE0CA] text-[#F36B21]">
              <Eye size={21} />
            </div>

            <div>
              <h3
                id="task-details-title"
                className="text-lg font-bold text-[#191919]"
              >
                Task Details
              </h3>

              <p className="mt-1 text-[11px] text-[#857665]">
                View your recorded task information.
              </p>
            </div>
          </div>

          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-md p-2 text-[#857665] hover:bg-[#F1DFCA]"
            aria-label="Close task details"
          >
            <X size={19} />
          </button>
        </div>

        {/* CONTENT */}

        <div className="space-y-5 p-5 sm:p-6">

          {/* STATUS AND TITLE */}

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-bold ${
                  task.completed
                    ? 'border-[#8CCBC0] bg-[#D6F0EB] text-[#176D70]'
                    : 'border-[#E8A06C] bg-[#FCE0CA] text-[#A94D19]'
                }`}
              >
                {task.completed ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Circle size={13} />
                )}

                {task.completed
                  ? 'Completed'
                  : 'Pending'}
              </span>

              {isOverdue && (
                <span className="rounded-md bg-[#F8DDE8] px-2.5 py-1.5 text-[10px] font-bold text-[#C7503E]">
                  Overdue
                </span>
              )}
            </div>

            <h2 className="break-words text-xl font-bold text-[#191919]">
              {task.title}
            </h2>
          </div>

          {/* DESCRIPTION */}

          <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
            <p className={detailLabelClass}>
              Description
            </p>

            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#675C50]">
              {task.description ||
                'No description provided.'}
            </p>
          </div>

          {/* CATEGORY */}

          <div>
            <p className={detailLabelClass}>
              Work Category
            </p>

            <CategoryBadge
              category={task.category}
            />
          </div>

          {/* INFORMATION GRID */}

          <div className="grid grid-cols-2 gap-5 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
            <div>
              <p className={detailLabelClass}>
                Priority
              </p>

              <p
                className={`text-sm font-bold ${getPriorityStyle(
                  task.priority
                )}`}
              >
                {task.priority || 'Medium'}
              </p>
            </div>

            <div>
              <p className={detailLabelClass}>
                Task Date
              </p>

              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#191919]">
                <CalendarDays
                  size={14}
                  className="shrink-0 text-[#F36B21]"
                />

                {taskDate
                  ? formatDueDate(taskDate)
                  : 'Not assigned'}
              </p>
            </div>

            <div>
              <p className={detailLabelClass}>
                Due Date
              </p>

              <p
                className={`text-xs font-semibold ${
                  isOverdue
                    ? 'text-[#C7503E]'
                    : 'text-[#191919]'
                }`}
              >
                {task.dueDate
                  ? formatDueDate(task.dueDate)
                  : 'No deadline'}
              </p>
            </div>

            <div>
              <p className={detailLabelClass}>
                Status
              </p>

              <p
                className={`text-xs font-bold ${
                  task.completed
                    ? 'text-[#176D70]'
                    : 'text-[#F36B21]'
                }`}
              >
                {task.completed
                  ? 'Done'
                  : 'To Do'}
              </p>
            </div>
          </div>

          {/* PROJECT LINK */}

          <div>
            <p className={detailLabelClass}>
              {category.linkLabel}
            </p>

            {projectLink ? (
              <a
                href={projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-3 transition-colors hover:border-[#F36B21]"
              >
                <Link2
                  size={18}
                  className="shrink-0 text-[#176D70]"
                />

                <span className="min-w-0 flex-1 break-all text-xs font-semibold text-[#176D70]">
                  {projectLink}
                </span>

                <ExternalLink
                  size={14}
                  className="shrink-0 text-[#176D70]"
                />
              </a>
            ) : (
              <p className="text-xs text-[#857665]">
                No project link added.
              </p>
            )}
          </div>

          {/* TASK ACTIVITY */}

          <div className="space-y-3 border-t border-[#D8C4AD] pt-4">
            <div className="mb-4 flex items-center gap-2">
              <Clock
                size={15}
                className="text-[#F36B21]"
              />

              <h4 className="text-xs font-bold">
                Task Activity
              </h4>
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-[11px]">
              <span className="text-[#857665]">
                Created
              </span>

              <span className="font-semibold text-[#191919]">
                {formatTimestamp(task.createdAt)}
              </span>
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-[11px]">
              <span className="text-[#857665]">
                Last Updated
              </span>

              <span className="font-semibold text-[#191919]">
                {formatTimestamp(task.updatedAt)}
              </span>
            </div>

            {task.completed && (
              <div className="flex flex-wrap justify-between gap-2 text-[11px]">
                <span className="text-[#857665]">
                  Completed
                </span>

                <span className="font-semibold text-[#176D70]">
                  {formatTimestamp(
                    task.completedAt
                  )}
                </span>
              </div>
            )}

            <p className="pt-1 text-[10px] text-[#857665]">
              All timestamps use Philippine time.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 flex gap-3 border-t border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D8C4AD] py-3 text-xs font-semibold text-[#675C50] hover:bg-[#F1DFCA]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(task);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#F36B21] py-3 text-xs font-bold text-white hover:bg-[#DC5814]"
          >
            <Pencil size={15} />

            Edit Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TASK MANAGER
// ============================================================

function TaskManager({
  tasks = [],
  setTasks,
  createTask,
  setCreateTask,
}) {
  // ==========================================================
  // INITIAL CURRENT DATE
  // ==========================================================

  const [today, setToday] = useState(
    getPHDate
  );

  const [selectedYear, setSelectedYear] =
    useState(today.year);

  const [selectedMonth, setSelectedMonth] =
    useState(today.month);

  const [selectedDay, setSelectedDay] =
    useState(today.day);

  // Only allow one year ahead.

  const maxYear = today.year + 1;

  const maxTaskDate = `${maxYear}-12-31`;

  // ==========================================================
  // FILTER STATES
  // ==========================================================

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState('All');

  const [selectedCategory, setSelectedCategory] =
    useState('All');

  // ==========================================================
  // TASK MODAL STATES
  // ==========================================================

  const [editingId, setEditingId] =
    useState(null);

  const [viewingTaskId, setViewingTaskId] =
    useState(null);

  const [form, setForm] =
    useState({
      ...emptyTask,
      taskDate: today.date,
    });

  const [formError, setFormError] =
    useState('');

  // ==========================================================
  // PROJECT LINK STATES
  // ==========================================================

  const [linkTask, setLinkTask] =
    useState(null);

  const [linkInput, setLinkInput] =
    useState('');

  const [linkError, setLinkError] =
    useState('');

  // ==========================================================
  // UPDATE PHILIPPINE DATE
  // ==========================================================

  useEffect(() => {
    const updateToday = () => {
      const current = getPHDate();

      setToday((previous) =>
        previous.date === current.date
          ? previous
          : current
      );
    };

    const interval = window.setInterval(
      updateToday,
      60000
    );

    const handleVisibility = () => {
      if (!document.hidden) {
        updateToday();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    window.addEventListener(
      'focus',
      updateToday
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

      window.removeEventListener(
        'focus',
        updateToday
      );
    };
  }, []);

  // ==========================================================
  // SELECTED DATE
  // ==========================================================

  const selectedMonthKey = getMonthKey(
    selectedYear,
    selectedMonth
  );

  const selectedDateKey =
    typeof selectedDay === 'number'
      ? getDateKey(
          selectedYear,
          selectedMonth,
          selectedDay
        )
      : null;

  // ==========================================================
  // MONTHLY DATA
  // ==========================================================

  const monthTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          getTaskMonth(task) === selectedMonthKey
      ),
    [tasks, selectedMonthKey]
  );

  const total = monthTasks.length;

  const completed = monthTasks.filter(
    (task) => task.completed
  ).length;

  const pending = total - completed;

  const progress = total
    ? Math.round((completed / total) * 100)
    : 0;

  // ==========================================================
  // DAILY DATA
  // ==========================================================

  const dailyTasks = useMemo(() => {
    if (selectedDay === null) {
      return monthTasks;
    }

    if (selectedDay === 'unassigned') {
      return monthTasks.filter(
        (task) => !getTaskDate(task)
      );
    }

    return monthTasks.filter(
      (task) =>
        getTaskDate(task) === selectedDateKey
    );
  }, [
    monthTasks,
    selectedDay,
    selectedDateKey,
  ]);

  const dailyTotal = dailyTasks.length;

  const dailyCompleted = dailyTasks.filter(
    (task) => task.completed
  ).length;

  const dailyPending =
    dailyTotal - dailyCompleted;

  // ==========================================================
  // FILTERED TASKS
  // ==========================================================

  const filteredTasks = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return dailyTasks.filter((task) => {
      const matchesSearch =
        (task.title || '')
          .toLowerCase()
          .includes(query) ||
        (task.description || '')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        filter === 'All' ||
        (
          filter === 'To Do' &&
          !task.completed
        ) ||
        (
          filter === 'Done' &&
          task.completed
        );

      const matchesCategory =
        selectedCategory === 'All' ||
        task.category === selectedCategory;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    dailyTasks,
    search,
    filter,
    selectedCategory,
  ]);

  // ==========================================================
  // PENDING TASKS FIRST
  // ==========================================================

  const pendingTasks = useMemo(
    () =>
      filteredTasks.filter(
        (task) => !task.completed
      ),
    [filteredTasks]
  );

  // ==========================================================
  // COMPLETED TASKS LAST
  // ==========================================================

  const completedTasks = useMemo(
    () =>
      filteredTasks.filter(
        (task) => task.completed
      ),
    [filteredTasks]
  );

  // ==========================================================
  // VIEWED TASK
  // ==========================================================

  const viewingTask =
    tasks.find(
      (task) => task.id === viewingTaskId
    ) || null;

  const linkCategory = linkTask
    ? getCategoryDetails(linkTask.category)
    : null;

  // ==========================================================
  // MODAL SCROLL LOCK
  // ==========================================================

  const hasOpenModal =
    Boolean(createTask) ||
    Boolean(linkTask) ||
    Boolean(viewingTask);

  useEffect(() => {
    if (!hasOpenModal) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [hasOpenModal]);

  // ==========================================================
  // ESCAPE KEY
  // ==========================================================

  useEffect(() => {
    if (!hasOpenModal) return;

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;

      if (viewingTaskId !== null) {
        setViewingTaskId(null);
        return;
      }

      if (linkTask) {
        setLinkTask(null);
        setLinkInput('');
        setLinkError('');
        return;
      }

      if (createTask) {
        setCreateTask(false);
        setEditingId(null);
        setForm({ ...emptyTask });
        setFormError('');
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [
    hasOpenModal,
    viewingTaskId,
    linkTask,
    createTask,
    setCreateTask,
  ]);

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch('');
    setFilter('All');
    setSelectedCategory('All');
  };

  // ==========================================================
  // SELECT MONTH
  // ==========================================================

  const selectMonth = (monthIndex) => {
    const current = getPHDate();

    setSelectedMonth(monthIndex);

    // Current month opens on today's date.
    // Other months open on their first day.

    if (
      selectedYear === current.year &&
      monthIndex === current.month
    ) {
      setSelectedDay(current.day);
    } else {
      setSelectedDay(1);
    }

    resetFilters();
  };

  // ==========================================================
  // SELECT DAY
  // ==========================================================

  const selectDay = (day) => {
    setSelectedDay(day);
  };

  // ==========================================================
  // CHANGE YEAR
  // ==========================================================

  const changeYear = (amount) => {
    const current = getPHDate();

    const nextYear =
      selectedYear + amount;

    const allowedMaxYear =
      current.year + 1;

    if (nextYear > allowedMaxYear) {
      return;
    }

    setSelectedYear(nextYear);

    if (
      nextYear === current.year &&
      selectedMonth === current.month
    ) {
      setSelectedDay(current.day);
    } else {
      setSelectedDay(1);
    }

    resetFilters();
  };

  // ==========================================================
  // GO TO TODAY
  // ==========================================================

  const goToToday = () => {
    const current = getPHDate();

    setToday(current);

    setSelectedYear(current.year);

    setSelectedMonth(current.month);

    setSelectedDay(current.day);

    resetFilters();
  };

  // ==========================================================
  // DEFAULT TASK DATE
  // ==========================================================

  const getDefaultTaskDate = () => {
    const current = getPHDate();

    const defaultDay =
      typeof selectedDay === 'number'
        ? selectedDay
        : selectedYear === current.year &&
            selectedMonth === current.month
          ? current.day
          : 1;

    return getDateKey(
      selectedYear,
      selectedMonth,
      defaultDay
    );
  };

  // ==========================================================
  // ADD TASK
  // ==========================================================

  const openAdd = () => {
    setEditingId(null);
    setFormError('');

    setForm({
      ...emptyTask,

      category:
        selectedCategory === 'All'
          ? emptyTask.category
          : selectedCategory,

      taskDate: getDefaultTaskDate(),
    });

    setCreateTask(true);
  };

  // ==========================================================
  // EDIT TASK
  // ==========================================================

  const openEdit = (task) => {
    setEditingId(task.id);
    setFormError('');

    setForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      category: task.category || 'Other',

      taskDate:
        getTaskDate(task) ||
        getDefaultTaskDate(),

      dueDate: task.dueDate || '',
    });

    setCreateTask(true);
  };

  // ==========================================================
  // VIEW TASK
  // ==========================================================

  const openView = (task) => {
    setViewingTaskId(task.id);
  };

  // ==========================================================
  // CLOSE TASK MODAL
  // ==========================================================

  const closeModal = () => {
    setCreateTask(false);
    setEditingId(null);
    setForm({ ...emptyTask });
    setFormError('');
  };

  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError('');
  };

  // ==========================================================
  // SAVE TASK
  // ==========================================================

  const saveTask = (event) => {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setFormError(
        'Please enter a task name.'
      );

      return;
    }

    if (!isValidDateKey(form.taskDate)) {
      setFormError(
        'Please select a valid task date.'
      );

      return;
    }

    if (form.taskDate > maxTaskDate) {
      setFormError(
        `Tasks can only be scheduled up to December 31, ${maxYear}.`
      );

      return;
    }

    if (
      form.dueDate &&
      !isValidDateKey(form.dueDate)
    ) {
      setFormError(
        'Please select a valid due date.'
      );

      return;
    }

    const timestamp =
      new Date().toISOString();

    const taskData = {
      ...form,
      title,
      description: form.description.trim(),
      month: form.taskDate.slice(0, 7),
      updatedAt: timestamp,
    };

    // EDIT EXISTING TASK

    if (editingId !== null) {
      setTasks((previous) =>
        previous.map((task) => {
          if (task.id !== editingId) {
            return task;
          }

          const category =
            getCategoryDetails(form.category);

          const needsCompletion =
            task.completed &&
            category.requiresLink &&
            !normalizeProjectLink(
              task.projectLink
            );

          return {
            ...task,
            ...taskData,

            ...(needsCompletion
              ? {
                  completed: false,
                  completedAt: null,
                }
              : {}),
          };
        })
      );
    } else {
      // CREATE NEW TASK

      const id =
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      setTasks((previous) => [
        {
          ...taskData,
          id,
          completed: false,
          completedAt: null,
          projectLink: '',
          createdAt: timestamp,
        },
        ...previous,
      ]);
    }

    // Navigate to the saved task's date.

    const [year, month, day] =
      form.taskDate.split('-').map(Number);

    setSelectedYear(year);
    setSelectedMonth(month - 1);
    setSelectedDay(day);

    resetFilters();
    closeModal();
  };

  // ==========================================================
  // TASK COMPLETION
  // ==========================================================

  const toggleTask = (task) => {
    const timestamp =
      new Date().toISOString();

    // REOPEN COMPLETED TASK

    if (task.completed) {
      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? {
                ...item,
                completed: false,
                completedAt: null,
                updatedAt: timestamp,
              }
            : item
        )
      );

      return;
    }

    const category =
      getCategoryDetails(task.category);

    // REQUIRED PROJECT LINK

    if (category.requiresLink) {
      setLinkTask(task);

      setLinkInput(
        task.projectLink || ''
      );

      setLinkError('');

      return;
    }

    // COMPLETE TASK DIRECTLY

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: true,
              completedAt: timestamp,
              updatedAt: timestamp,
            }
          : item
      )
    );
  };

  // ==========================================================
  // CLOSE PROJECT LINK MODAL
  // ==========================================================

  const closeLinkModal = () => {
    setLinkTask(null);
    setLinkInput('');
    setLinkError('');
  };

  // ==========================================================
  // SAVE PROJECT LINK AND COMPLETE
  // ==========================================================

  const saveLinkAndComplete = (event) => {
    event.preventDefault();

    if (!linkTask) return;

    const normalizedLink =
      normalizeProjectLink(linkInput);

    if (!normalizedLink) {
      setLinkError(
        'Please enter a valid project link.'
      );

      return;
    }

    const timestamp =
      new Date().toISOString();

    setTasks((previous) =>
      previous.map((task) =>
        task.id === linkTask.id
          ? {
              ...task,
              projectLink: normalizedLink,
              completed: true,
              completedAt: timestamp,
              updatedAt: timestamp,
            }
          : task
      )
    );

    closeLinkModal();
  };

  // ==========================================================
  // DELETE TASK
  // ==========================================================

  const deleteTask = (id) => {
    const task = tasks.find(
      (item) => item.id === id
    );

    const confirmed = window.confirm(
      `Delete "${task?.title || 'this task'}"?`
    );

    if (!confirmed) return;

    setTasks((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    if (viewingTaskId === id) {
      setViewingTaskId(null);
    }

    if (linkTask?.id === id) {
      closeLinkModal();
    }

    if (editingId === id) {
      closeModal();
    }
  };

  // ==========================================================
  // SELECTED PERIOD LABEL
  // ==========================================================

  const selectedPeriodLabel =
    selectedDay === 'unassigned'
      ? `Unassigned Days — ${MONTHS[selectedMonth]} ${selectedYear}`
      : typeof selectedDay === 'number'
        ? `${MONTHS[selectedMonth]} ${selectedDay}, ${selectedYear}`
        : `${MONTHS[selectedMonth]} ${selectedYear}`;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-5 pb-8 text-[#191919]">

      {/* SCROLLBAR STYLING */}

      <style>{`
        .daily-planner-scroll::-webkit-scrollbar {
          height: 4px;
        }

        .daily-planner-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .daily-planner-scroll::-webkit-scrollbar-thumb {
          background: #D8C4AD;
          border-radius: 999px;
        }

        .daily-planner-scroll::-webkit-scrollbar-thumb:hover {
          background: #B9A895;
        }
      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8C4AD] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Things To Do

            <span className="text-[#F36B21]">
              .
            </span>
          </h2>

          <p className="mt-1 text-xs text-[#857665]">
            Manage your daily and monthly tasks
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F36B21] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#DC5814]"
        >
          <Plus size={17} />

          New Task
        </button>
      </section>

      {/* ======================================================
          MONTH SELECTOR
      ====================================================== */}

      <MonthSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectMonth={selectMonth}
        onPreviousYear={() => changeYear(-1)}
        onNextYear={() => changeYear(1)}
        onToday={goToToday}
        maxYear={maxYear}
      />

      {/* ======================================================
          DAILY PLANNER
      ====================================================== */}

      <DailyPlanner
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        onSelectDay={selectDay}
        tasks={monthTasks}
        today={today}
      />

      {/* ======================================================
          MONTHLY OVERVIEW
      ====================================================== */}

      <section className="min-w-0 rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              {MONTHS[selectedMonth]}{' '}
              {selectedYear}
            </h3>

            <p className="mt-1 text-xs text-[#857665]">
              Monthly Overview
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 sm:gap-7">

            {/* TOTAL */}

            <div className="text-center">
              <p className="text-xl font-bold">
                {total}
              </p>

              <p className="text-[10px] text-[#857665]">
                Total
              </p>
            </div>

            {/* PENDING */}

            <div className="text-center">
              <p className="text-xl font-bold text-[#F36B21]">
                {pending}
              </p>

              <p className="text-[10px] text-[#857665]">
                To Do
              </p>
            </div>

            {/* COMPLETED */}

            <div className="text-center">
              <p className="text-xl font-bold text-[#176D70]">
                {completed}
              </p>

              <p className="text-[10px] text-[#857665]">
                Done
              </p>
            </div>

            {/* PROGRESS */}

            <div className="text-center">
              <p className="text-xl font-bold">
                {progress}%
              </p>

              <p className="text-[10px] text-[#857665]">
                Progress
              </p>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}

        <div
          role="progressbar"
          aria-label="Monthly task progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#E6D3BD]"
        >
          <div
            className="h-full rounded-full bg-[#176D70] transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {/* DAILY OVERVIEW */}

        {selectedDay !== null && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#D8C4AD] pt-4">
            <div>
              <h4 className="text-xs font-bold">
                {selectedDay === 'unassigned'
                  ? 'Unassigned Tasks'
                  : 'Daily Overview'}
              </h4>

              <p className="mt-1 text-[10px] text-[#857665]">
                {selectedPeriodLabel}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <div className="text-center">
                <p className="text-sm font-bold">
                  {dailyTotal}
                </p>

                <p className="text-[10px] text-[#857665]">
                  Total
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-[#F36B21]">
                  {dailyPending}
                </p>

                <p className="text-[10px] text-[#857665]">
                  To Do
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-[#176D70]">
                  {dailyCompleted}
                </p>

                <p className="text-[10px] text-[#857665]">
                  Done
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================
          CATEGORY FILTER
      ====================================================== */}

      <CategoryFilter
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* ======================================================
          TASK LIST
      ====================================================== */}

      <section className="min-w-0 overflow-hidden rounded-xl border border-[#D8C4AD] bg-[#FAEBD7]">

        {/* TASK LIST HEADER */}

        <div className="border-b border-[#D8C4AD] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold">
                Your Tasks
              </h3>

              <p className="mt-1 text-[11px] text-[#857665]">
                {selectedPeriodLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-md border border-[#D8C4AD] px-3 py-2 text-xs font-semibold text-[#F36B21] hover:bg-[#F1DFCA]"
            >
              <Plus size={15} />

              Add
            </button>
          </div>

          {/* SEARCH AND STATUS FILTER */}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#857665]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] py-2.5 pl-10 pr-10 text-xs text-[#191919] outline-none focus:border-[#F36B21]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#857665]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                  className={`rounded-md px-3 py-2 text-[11px] font-semibold transition-colors ${
                    filter === item
                      ? 'bg-[#F36B21] text-white'
                      : 'text-[#857665] hover:bg-[#F1DFCA]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP COLUMN LABELS */}

        {filteredTasks.length > 0 && (
          <div className="hidden grid-cols-[21px_minmax(0,1fr)_170px_65px_100px_100px] gap-3 border-b border-[#D8C4AD] bg-[#F5E4CF] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#857665] lg:grid xl:grid-cols-[21px_minmax(0,1fr)_210px_80px_110px_100px]">
            <span />

            <span>Task</span>

            <span>Category</span>

            <span className="text-center">
              Priority
            </span>

            <span>Due Date</span>

            <span className="text-center">
              Actions
            </span>
          </div>
        )}

        {/* ====================================================
            TASK GROUPS
        ==================================================== */}

        {filteredTasks.length > 0 ? (
          <div>

            {/* PENDING TASKS FIRST */}

            <TaskGroup
              tasks={pendingTasks}
              completed={false}
              onToggle={toggleTask}
              onEdit={openEdit}
              onDelete={deleteTask}
              onView={openView}
              todayDate={today.date}
            />

            {/* DIVIDER */}

            {pendingTasks.length > 0 &&
              completedTasks.length > 0 && (
                <div className="h-2 border-y border-[#D8C4AD] bg-[#EAD5BD]/50" />
              )}

            {/* COMPLETED TASKS LAST */}

            <TaskGroup
              tasks={completedTasks}
              completed
              onToggle={toggleTask}
              onEdit={openEdit}
              onDelete={deleteTask}
              onView={openView}
              todayDate={today.date}
            />
          </div>
        ) : (

          /* EMPTY STATE */

          <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FCE0CA]">
              <ListTodo
                size={28}
                className="text-[#F36B21]"
              />
            </div>

            <h3 className="mt-4 text-sm font-bold">
              {dailyTotal === 0
                ? 'No tasks yet'
                : 'No matching tasks'}
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#857665]">
              {dailyTotal === 0
                ? selectedDay === 'unassigned'
                  ? 'All tasks have an assigned day.'
                  : `Add a task for ${selectedPeriodLabel}.`
                : 'Try changing your search or filters.'}
            </p>

            {dailyTotal === 0 ? (
              <button
                type="button"
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 rounded-md bg-[#F36B21] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#DC5814]"
              >
                <Plus size={15} />

                New Task
              </button>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-md border border-[#D8C4AD] px-4 py-2.5 text-xs font-semibold text-[#176D70] hover:bg-[#F1DFCA]"
              >
                Clear Filters
              </button>
            )}

            {selectedDay !== null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  resetFilters();
                }}
                className="mt-3 text-[11px] font-semibold text-[#857665] hover:text-[#F36B21]"
              >
                View all tasks this month
              </button>
            )}
          </div>
        )}
      </section>

      {/* ======================================================
          ADD / EDIT TASK MODAL
      ====================================================== */}

      {createTask && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#191919]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-form-title"
            className="my-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] shadow-xl"
          >

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-6">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#F36B21]">
                  {editingId !== null
                    ? 'Update Task Information'
                    : 'Daily Task Planner'}
                </p>

                <h3
                  id="task-form-title"
                  className="text-xl font-bold text-[#191919]"
                >
                  {editingId !== null
                    ? 'Edit Task'
                    : 'New Task'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-2 text-[#857665] hover:bg-[#F1DFCA]"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* TASK FORM */}

            <form
              onSubmit={saveTask}
              className="space-y-4 p-5 sm:p-6"
            >

              {/* TASK NAME */}

              <div>
                <label
                  htmlFor="task-name"
                  className={labelClass}
                >
                  Task Name
                </label>

                <input
                  id="task-name"
                  autoFocus
                  required
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      'title',
                      event.target.value
                    )
                  }
                  placeholder="Enter task name"
                  className={inputClass}
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="task-description"
                  className={labelClass}
                >
                  Description
                </label>

                <textarea
                  id="task-description"
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      'description',
                      event.target.value
                    )
                  }
                  placeholder="Add task details..."
                  rows={4}
                  className={`${inputClass} resize-y`}
                />
              </div>

              {/* WORK CATEGORY */}

              <div>
                <label
                  htmlFor="task-category"
                  className={labelClass}
                >
                  Work Category
                </label>

                <select
                  id="task-category"
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      'category',
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  {!CATEGORIES.some(
                    (category) =>
                      category.name === form.category
                  ) && (
                    <option value={form.category}>
                      {form.category}
                    </option>
                  )}

                  {CATEGORIES.map((category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <div className="mt-2">
                  <CategoryBadge
                    category={form.category}
                    compact
                  />
                </div>
              </div>

              {/* TASK DATE */}

              <div>
                <label
                  htmlFor="task-date"
                  className={labelClass}
                >
                  Task Date

                  <span className="ml-1 text-[#F36B21]">
                    *
                  </span>
                </label>

                <input
                  id="task-date"
                  type="date"
                  required
                  max={maxTaskDate}
                  value={form.taskDate}
                  onChange={(event) =>
                    updateForm(
                      'taskDate',
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

                <p className="mt-1.5 text-[10px] leading-relaxed text-[#857665]">
                  The day this task belongs to in
                  your daily planner.
                </p>
              </div>

              {/* PRIORITY AND DUE DATE */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-priority"
                    className={labelClass}
                  >
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    value={form.priority}
                    onChange={(event) =>
                      updateForm(
                        'priority',
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    {PRIORITIES.map((priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-due-date"
                    className={labelClass}
                  >
                    Due Date
                  </label>

                  <input
                    id="task-due-date"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      updateForm(
                        'dueDate',
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {/* SELECTED DATE INFORMATION */}

              <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-3">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-[#F36B21]"
                  />

                  <p className="text-[11px] text-[#857665]">
                    Assigned to:{' '}

                    <span className="font-semibold text-[#176D70]">
                      {form.taskDate
                        ? formatDueDate(
                            form.taskDate
                          )
                        : 'No date selected'}
                    </span>
                  </p>
                </div>

                {getCategoryDetails(form.category)
                  .requiresLink && (
                  <div className="mt-2 flex items-start gap-2 border-t border-[#D8C4AD] pt-2">
                    <Link2
                      size={14}
                      className="mt-0.5 shrink-0 text-[#F36B21]"
                    />

                    <p className="text-[10px] leading-relaxed text-[#857665]">
                      A project link is required
                      before completing this task.
                    </p>
                  </div>
                )}
              </div>

              {/* FORM ERROR */}

              {formError && (
                <p
                  role="alert"
                  className="rounded-md border border-[#E4A0BB] bg-[#F8DDE8] p-3 text-xs font-semibold text-[#C7503E]"
                >
                  {formError}
                </p>
              )}

              {/* FORM ACTIONS */}

              <div className="flex gap-3 border-t border-[#D8C4AD] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-[#D8C4AD] py-3 text-sm font-semibold text-[#675C50] hover:bg-[#F1DFCA]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-lg bg-[#F36B21] py-3 text-sm font-bold text-white hover:bg-[#DC5814]"
                >
                  <Check size={17} />

                  {editingId !== null
                    ? 'Save Changes'
                    : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          PROJECT LINK COMPLETION MODAL
      ====================================================== */}

      {linkTask && linkCategory && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-[#191919]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeLinkModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-link-title"
            className="my-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 shadow-xl sm:p-6"
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      linkCategory.background,

                    color: linkCategory.text,
                  }}
                >
                  <Link2 size={21} />
                </div>

                <div>
                  <h3
                    id="project-link-title"
                    className="text-lg font-bold text-[#191919]"
                  >
                    Add Project Link
                  </h3>

                  <p className="mt-1 text-xs text-[#857665]">
                    Required before completing
                    this task.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeLinkModal}
                className="rounded-md p-2 text-[#857665] hover:bg-[#F1DFCA]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* TASK INFORMATION */}

            <div className="mt-5 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
              <p className="break-words text-sm font-semibold text-[#191919]">
                {linkTask.title}
              </p>

              <div className="mt-2">
                <CategoryBadge
                  category={linkTask.category}
                  compact
                />
              </div>

              {getTaskDate(linkTask) && (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#857665]">
                  <CalendarDays size={12} />

                  {formatDueDate(
                    getTaskDate(linkTask)
                  )}
                </p>
              )}
            </div>

            {/* PROJECT LINK FORM */}

            <form
              onSubmit={saveLinkAndComplete}
              className="mt-5"
            >
              <label
                htmlFor="project-link-input"
                className={labelClass}
              >
                {linkCategory.linkLabel}
              </label>

              <div className="relative">
                <Link2
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#857665]"
                />

                <input
                  id="project-link-input"
                  type="text"
                  inputMode="url"
                  autoFocus
                  required
                  value={linkInput}
                  onChange={(event) => {
                    setLinkInput(
                      event.target.value
                    );

                    setLinkError('');
                  }}
                  placeholder="Paste your project link here..."
                  className="w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] py-3 pl-10 pr-4 text-sm text-[#191919] outline-none transition-colors focus:border-[#F36B21]"
                />
              </div>

              {linkError && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-medium text-[#C7503E]"
                >
                  {linkError}
                </p>
              )}

              <p className="mt-2 text-[11px] leading-relaxed text-[#857665]">
                Your link will appear under the
                task title and inside its details.
              </p>

              {/* COMPLETION ACTIONS */}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeLinkModal}
                  className="flex-1 rounded-lg border border-[#D8C4AD] py-3 text-xs font-semibold text-[#675C50] transition-colors hover:bg-[#F1DFCA]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-lg bg-[#176D70] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#10484A]"
                >
                  <CheckCircle2 size={17} />

                  Save & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          VIEW TASK DETAILS MODAL
      ====================================================== */}

      {viewingTask && (
        <TaskDetailsModal
          task={viewingTask}
          onClose={() =>
            setViewingTaskId(null)
          }
          onEdit={openEdit}
        />
      )}
    </div>
  );
}

export default TaskManager;