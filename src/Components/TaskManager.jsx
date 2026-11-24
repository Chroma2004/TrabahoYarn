import { useState } from 'react';

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
  dueDate: '',
};

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

function getTaskMonth(task) {
  if (task.month && /^\d{4}-\d{2}$/.test(task.month)) {
    return task.month;
  }

  if (task.createdAt) {
    const date = new Date(task.createdAt);

    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
      }).formatToParts(date);

      const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
      );

      return `${values.year}-${values.month}`;
    }
  }

  const today = getPHDate();

  return getMonthKey(today.year, today.month);
}

function formatDueDate(dateString) {
  if (!dateString) return '';

  const date = new Date(`${dateString}T12:00:00Z`);

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

function getCategoryDetails(category) {
  return (
    CATEGORIES.find((item) => item.name === category) || {
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
  const trimmed = value.trim();

  if (!trimmed) return '';

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
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

    if (!parsed.hostname.includes('.')) {
      return '';
    }

    return parsed.href;
  } catch {
    return '';
  }
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
  monthlyCounts,
}) {
  return (
    <section className="rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 sm:p-5">
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
            className="rounded-md border border-[#D8C4AD] px-3 py-1.5 text-[11px] font-semibold text-[#176D70] hover:bg-[#F1DFCA]"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onPreviousYear}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D8C4AD] text-[#675C50] hover:bg-[#F1DFCA]"
            aria-label="Previous year"
          >
            <ChevronLeft size={15} />
          </button>

          <span className="min-w-[40px] text-center text-xs font-bold text-[#191919]">
            {selectedYear}
          </span>

          <button
            type="button"
            onClick={onNextYear}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D8C4AD] text-[#675C50] hover:bg-[#F1DFCA]"
            aria-label="Next year"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-12">
        {MONTHS.map((month, index) => {
          const isSelected = selectedMonth === index;
          const count = monthlyCounts[index] || 0;

          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelectMonth(index)}
              aria-pressed={isSelected}
              className={`
                flex min-h-[40px] min-w-0
                flex-col items-center justify-center
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

              {count > 0 && (
                <span
                  className={`mt-0.5 text-[9px] ${
                    isSelected
                      ? 'text-white/80'
                      : 'text-[#857665]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
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
    <section className="rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#191919]">
          Work Categories
        </h3>

        {selectedCategory !== 'All' && (
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="text-[11px] font-semibold text-[#F36B21]"
          >
            Clear
          </button>
        )}
      </div>

      {/* COMPACT CATEGORY BUTTONS */}

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
                  isSelected ? 'All' : category.name
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
  todayDate,
}) {
  const category = getCategoryDetails(task.category);
  const CategoryIcon = category.icon;

  const isOverdue =
    !!task.dueDate &&
    !task.completed &&
    task.dueDate < todayDate;

  const projectLink = normalizeProjectLink(
    task.projectLink || ''
  );

  return (
    <div
      className={`
        group flex min-w-0 items-start gap-3
        border-b border-[#D8C4AD]
        px-4 py-4
        transition-colors
        last:border-b-0
        hover:bg-[#F5E4CF]
        sm:items-center sm:gap-4 sm:px-5
        ${
          task.completed
            ? 'bg-[#176D70]/[0.04]'
            : ''
        }
      `}
    >
      {/* COMPLETE */}

      <button
        type="button"
        onClick={() => onToggle(task)}
        className="mt-0.5 shrink-0 sm:mt-0"
        aria-label={
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

      {/* TASK DETAILS */}

      <div className="min-w-0 flex-1">
        <h3
          className={`break-words text-sm font-semibold ${
            task.completed
              ? 'text-[#A39280] line-through'
              : 'text-[#191919]'
          }`}
        >
          {task.title}
        </h3>

        {task.description && (
          <p className="mt-1 line-clamp-2 break-words text-xs text-[#857665]">
            {task.description}
          </p>
        )}

        {/* SAVED PROJECT LINK */}

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

        <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
          <span
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold"
            style={{
              backgroundColor: category.background,
              color: category.text,
              borderColor: category.border,
            }}
          >
            <CategoryIcon size={12} />
            {category.name}
          </span>

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
                  ? 'text-[#C7503E]'
                  : 'text-[#857665]'
              }`}
            >
              <CalendarDays size={12} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* DESKTOP CATEGORY */}

      <div className="hidden w-[180px] shrink-0 items-center sm:flex lg:w-[210px]">
        <span
          className="inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-2"
          style={{
            backgroundColor: category.background,
            color: category.text,
            borderColor: category.border,
          }}
        >
          <CategoryIcon
            size={14}
            className="shrink-0"
          />

          <span className="line-clamp-2 text-[10px] font-semibold leading-snug">
            {category.name}
          </span>
        </span>
      </div>

      {/* PRIORITY */}

      <div className="hidden w-[80px] shrink-0 justify-center sm:flex">
        <span
          className={`text-[11px] font-semibold ${getPriorityStyle(
            task.priority
          )}`}
        >
          {task.priority || 'Medium'}
        </span>
      </div>

      {/* DUE DATE */}

      <div
        className={`hidden w-[110px] shrink-0 items-center gap-1.5 text-[11px] lg:flex ${
          isOverdue
            ? 'text-[#C7503E]'
            : 'text-[#857665]'
        }`}
      >
        <CalendarDays size={13} />

        <span>
          {task.dueDate
            ? formatDueDate(task.dueDate)
            : '—'}
        </span>
      </div>

      {/* ACTIONS */}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md p-2 text-[#857665] hover:bg-[#EAD5BD] hover:text-[#176D70]"
          aria-label="Edit task"
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-md p-2 text-[#857665] hover:bg-[#EAD5BD] hover:text-[#C7503E]"
          aria-label="Delete task"
        >
          <Trash2 size={15} />
        </button>
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
  const initialToday = getPHDate();

  const [selectedYear, setSelectedYear] =
    useState(initialToday.year);

  const [selectedMonth, setSelectedMonth] =
    useState(initialToday.month);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [selectedCategory, setSelectedCategory] =
    useState('All');

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyTask);

  // PROJECT LINK POPUP STATES

  const [linkTask, setLinkTask] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');

  // ==========================================================
  // MONTHLY DATA
  // ==========================================================

  const selectedMonthKey = getMonthKey(
    selectedYear,
    selectedMonth
  );

  const monthTasks = tasks.filter(
    (task) => getTaskMonth(task) === selectedMonthKey
  );

  const total = monthTasks.length;

  const completed = monthTasks.filter(
    (task) => task.completed
  ).length;

  const pending = total - completed;

  const progress = total
    ? Math.round((completed / total) * 100)
    : 0;

  const monthlyCounts = MONTHS.map(
    (_, monthIndex) => {
      const monthKey = getMonthKey(
        selectedYear,
        monthIndex
      );

      return tasks.filter(
        (task) => getTaskMonth(task) === monthKey
      ).length;
    }
  );

  // ==========================================================
  // FILTERED TASKS
  // ==========================================================

  const filteredTasks = monthTasks.filter((task) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      (task.title || '').toLowerCase().includes(query) ||
      (task.description || '').toLowerCase().includes(query);

    const matchesStatus =
      filter === 'All' ||
      (filter === 'To Do' && !task.completed) ||
      (filter === 'Done' && task.completed);

    const matchesCategory =
      selectedCategory === 'All' ||
      task.category === selectedCategory;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory
    );
  });

  // ==========================================================
  // TASK ACTIONS
  // ==========================================================

  const resetFilters = () => {
    setSearch('');
    setFilter('All');
    setSelectedCategory('All');
  };

  const openAdd = () => {
    setEditingId(null);

    setForm({
      ...emptyTask,
      category:
        selectedCategory === 'All'
          ? emptyTask.category
          : selectedCategory,
    });

    setCreateTask(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);

    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'Medium',
      category: task.category || 'Other',
      dueDate: task.dueDate || '',
    });

    setCreateTask(true);
  };

  const closeModal = () => {
    setCreateTask(false);
    setEditingId(null);
    setForm(emptyTask);
  };

  const saveTask = (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    const timestamp = new Date().toISOString();

    if (editingId) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingId
            ? {
                ...task,
                ...form,
                title: form.title.trim(),
                updatedAt: timestamp,
              }
            : task
        )
      );
    } else {
      setTasks((previous) => [
        {
          ...form,
          id: crypto.randomUUID(),
          title: form.title.trim(),
          month: selectedMonthKey,
          completed: false,
          projectLink: '',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        ...previous,
      ]);
    }

    closeModal();
  };

  // ==========================================================
  // COMPLETION WITH PROJECT LINK
  // ==========================================================

  const toggleTask = (task) => {
    if (task.completed) {
      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? {
                ...item,
                completed: false,
                projectLink: '',
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      return;
    }

    const category = getCategoryDetails(task.category);

    if (category.requiresLink) {
      setLinkTask(task);
      setLinkInput('');
      setLinkError('');
      return;
    }

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: true,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const closeLinkModal = () => {
    setLinkTask(null);
    setLinkInput('');
    setLinkError('');
  };

  const saveLinkAndComplete = (event) => {
    event.preventDefault();

    if (!linkTask) return;

    const normalizedLink = normalizeProjectLink(linkInput);

    if (!normalizedLink) {
      setLinkError('Please enter a valid project link.');
      return;
    }

    setTasks((previous) =>
      previous.map((task) =>
        task.id === linkTask.id
          ? {
              ...task,
              projectLink: normalizedLink,
              completed: true,
              updatedAt: new Date().toISOString(),
            }
          : task
      )
    );

    closeLinkModal();
  };

  // ==========================================================
  // OTHER ACTIONS
  // ==========================================================

  const deleteTask = (id) => {
    if (!window.confirm('Delete this task?')) {
      return;
    }

    setTasks((previous) =>
      previous.filter((task) => task.id !== id)
    );
  };

  const goToToday = () => {
    const current = getPHDate();

    setSelectedYear(current.year);
    setSelectedMonth(current.month);

    resetFilters();
  };

  // ==========================================================
  // FORM STYLES
  // ==========================================================

  const inputClass =
    'w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] px-4 py-3 text-sm text-[#191919] outline-none transition-colors focus:border-[#F36B21]';

  const linkCategory = linkTask
    ? getCategoryDetails(linkTask.category)
    : null;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8 text-[#191919]">

      {/* HEADER */}

      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8C4AD] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Things To Do
            <span className="text-[#F36B21]">.</span>
          </h2>

          <p className="mt-1 text-xs text-[#857665]">
            Manage your monthly tasks
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

      {/* MONTH SELECTOR */}

      <MonthSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectMonth={(monthIndex) => {
          setSelectedMonth(monthIndex);
          resetFilters();
        }}
        onPreviousYear={() => {
          setSelectedYear((year) => year - 1);
          resetFilters();
        }}
        onNextYear={() => {
          setSelectedYear((year) => year + 1);
          resetFilters();
        }}
        onToday={goToToday}
        monthlyCounts={monthlyCounts}
      />

      {/* MONTH SUMMARY */}

      <section className="rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              {MONTHS[selectedMonth]} {selectedYear}
            </h3>

            <p className="mt-1 text-xs text-[#857665]">
              Monthly Overview
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:gap-7">
            <div className="text-center">
              <p className="text-xl font-bold">{total}</p>
              <p className="text-[10px] text-[#857665]">
                Total
              </p>
            </div>

            <div className="text-center">
              <p className="text-xl font-bold text-[#F36B21]">
                {pending}
              </p>
              <p className="text-[10px] text-[#857665]">
                To Do
              </p>
            </div>

            <div className="text-center">
              <p className="text-xl font-bold text-[#176D70]">
                {completed}
              </p>
              <p className="text-[10px] text-[#857665]">
                Done
              </p>
            </div>

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

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#E6D3BD]">
          <div
            className="h-full rounded-full bg-[#176D70] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* CATEGORIES */}

      <CategoryFilter
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* TASK LIST */}

      <section className="overflow-hidden rounded-xl border border-[#D8C4AD] bg-[#FAEBD7]">

        {/* LIST HEADER */}

        <div className="border-b border-[#D8C4AD] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold">
                Your Tasks
              </h3>

              <p className="mt-1 text-[11px] text-[#857665]">
                {filteredTasks.length} tasks
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
                className="w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] py-2.5 pl-10 pr-4 text-xs text-[#191919] outline-none focus:border-[#F36B21]"
              />
            </div>

            <div className="flex items-center gap-1">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
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
          <div className="hidden grid-cols-[minmax(0,1fr)_180px_80px_auto] gap-4 border-b border-[#D8C4AD] bg-[#F5E4CF] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#857665] sm:grid lg:grid-cols-[minmax(0,1fr)_210px_80px_110px_auto]">
            <span>Task</span>
            <span>Category</span>
            <span className="text-center">
              Priority
            </span>
            <span className="hidden lg:block">
              Due Date
            </span>
            <span className="w-[72px] text-center">
              Actions
            </span>
          </div>
        )}

        {/* TASK ROWS */}

        {filteredTasks.length > 0 ? (
          <div>
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={openEdit}
                onDelete={deleteTask}
                todayDate={getPHDate().date}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
            <ListTodo
              size={28}
              className="text-[#F36B21]"
            />

            <h3 className="mt-3 text-sm font-bold">
              {total === 0
                ? 'No tasks yet'
                : 'No matching tasks'}
            </h3>

            <p className="mt-1 text-xs text-[#857665]">
              {total === 0
                ? `Add a task for ${MONTHS[selectedMonth]}.`
                : 'Try changing your filters.'}
            </p>

            {total === 0 ? (
              <button
                type="button"
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 rounded-md bg-[#F36B21] px-4 py-2.5 text-xs font-bold text-white"
              >
                <Plus size={15} />
                New Task
              </button>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-md border border-[#D8C4AD] px-4 py-2.5 text-xs font-semibold text-[#176D70]"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* ADD / EDIT TASK MODAL */}

      {createTask && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#191919]/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="my-auto w-full max-w-lg rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#F36B21]">
                  {MONTHS[selectedMonth]} {selectedYear}
                </p>

                <h3 className="text-xl font-bold text-[#191919]">
                  {editingId ? 'Edit Task' : 'New Task'}
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

            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#675C50]">
                  Task Name
                </label>

                <input
                  autoFocus
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                  placeholder="Task name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#675C50]">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Optional details"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#675C50]">
                  Work Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
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

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{
                      backgroundColor:
                        getCategoryDetails(form.category).text,
                    }}
                  />

                  <span className="text-[11px] text-[#857665]">
                    {form.category}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#675C50]">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#675C50]">
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        dueDate: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="border-t border-[#D8C4AD] pt-3">
                <p className="text-[11px] text-[#857665]">
                  Month:{' '}
                  <span className="font-semibold text-[#176D70]">
                    {MONTHS[selectedMonth]} {selectedYear}
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
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

                  {editingId
                    ? 'Save Changes'
                    : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT LINK COMPLETION POPUP */}

      {linkTask && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[#191919]/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLinkModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-link-title"
            className="w-full max-w-md rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: linkCategory.background,
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
                    Required before completing this task.
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

            <div className="mt-5 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
              <p className="text-sm font-semibold text-[#191919]">
                {linkTask.title}
              </p>

              <span
                className="mt-2 inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold"
                style={{
                  backgroundColor: linkCategory.background,
                  color: linkCategory.text,
                }}
              >
                {linkTask.category}
              </span>
            </div>

            <form
              onSubmit={saveLinkAndComplete}
              className="mt-5"
            >
              <label
                htmlFor="project-link-input"
                className="mb-2 block text-xs font-semibold text-[#675C50]"
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
                  autoFocus
                  required
                  value={linkInput}
                  onChange={(event) => {
                    setLinkInput(event.target.value);
                    setLinkError('');
                  }}
                  placeholder="Paste your project link here..."
                  className="w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] py-3 pl-10 pr-4 text-sm text-[#191919] outline-none transition-colors focus:border-[#F36B21]"
                />
              </div>

              {linkError && (
                <p className="mt-2 text-xs font-medium text-[#C7503E]">
                  {linkError}
                </p>
              )}

              <p className="mt-2 text-[11px] text-[#857665]">
                Your link will appear under the task title.
              </p>

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
    </div>
  );
}

export default TaskManager;