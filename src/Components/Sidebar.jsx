import {
  LayoutDashboard,
  ListTodo,
  StickyNote,
  Image,
  RefreshCw,
  Settings,
  X,
  CalendarCheck2,
  Layers3,
  FileArchive,
} from 'lucide-react';

// ============================================================
// NAVIGATION
// ============================================================

const navigation = [
  {
    title: 'TRABAHOYARN',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'attendance',
        label: 'Attendance',
        icon: CalendarCheck2,
      },
      {
        id: 'tasks',
        label: 'My Tasks',
        icon: ListTodo,
      },
      {
        id: 'notes',
        label: 'My Notes',
        icon: StickyNote,
      },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      {
        id: 'image',
        label: 'Image Studio',
        icon: Image,
      },
      {
        id: 'converter',
        label: 'File Converter',
        icon: RefreshCw,
      },
      {
        id: 'file-compressor',
        label: 'File Compressor',
        icon: FileArchive,
      },
    ],
  },
  {
    title: 'PREFERENCES',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
      },
    ],
  },
];

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({
  activeTab,
  navigate,
  isOpen,
  close,
}) {
  return (
    <>

      {/* MOBILE OVERLAY */}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#191919]/40 lg:hidden"
          onClick={close}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[250px] flex-col
          border-r border-[#D8C4AD]
          bg-[#FAEBD7]
          transition-transform duration-300
          lg:translate-x-0
          ${
            isOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >

        {/* BRAND */}

        <div className="flex h-[100px] items-center justify-between border-b border-[#D8C4AD] px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F36B21] text-white">
              <Layers3
                size={21}
                strokeWidth={2}
              />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-[#191919]">
                TRABAHOYARN
                <span className="text-[#F36B21]">
                  .
                </span>
              </h1>

              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#857665]">
                Creative Workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-[#857665] hover:bg-[#F1DFCA] lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          {navigation.map((group) => (
            <div
              key={group.title}
              className="mb-8"
            >

              {/* GROUP TITLE */}

              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A39280]">
                {group.title}
              </p>

              {/* ITEMS */}

              <div className="space-y-1">

                {group.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      aria-current={
                        active ? 'page' : undefined
                      }
                      className={`
                        flex w-full items-center gap-3
                        rounded-lg px-3 py-3
                        text-left text-[13px] font-semibold
                        transition-colors duration-200
                        ${
                          active
                            ? 'bg-[#F36B21] text-white'
                            : 'text-[#675C50] hover:bg-[#F1DFCA] hover:text-[#191919]'
                        }
                      `}
                    >
                      <Icon
                        size={18}
                        strokeWidth={2}
                        className="shrink-0"
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}

              </div>
            </div>
          ))}

        </nav>

        {/* FOOTER */}

        <div className="border-t border-[#D8C4AD] p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#176D70] text-xs font-bold text-white">
              W
            </div>

            <div>
              <p className="text-xs font-bold text-[#191919]">
                TRABAHOYARN
              </p>

              <p className="mt-0.5 text-[10px] text-[#857665]">
                Your daily workspace
              </p>
            </div>

          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[#D8C4AD] pt-4">

            <span className="text-[10px] font-medium text-[#A39280]">
              TRABAHOYARN
            </span>

            <span className="text-[10px] font-medium text-[#A39280]">
              © 2026
            </span>

          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;