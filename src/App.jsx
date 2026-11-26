import { useEffect, useState } from 'react';
import { Menu, Circle } from 'lucide-react';

import Sidebar from './Components/Sidebar';
import Dashboard from './Components/Dashboard';
import Attendance from './Components/Attendance';
import TaskManager from './Components/TaskManager';
import Notes from './Components/Notes';
import ImageEditor from './Components/ImageEditor';
import FileConverter from './Components/FileConverter';
import FileCompressor from './Components/FileCompressor';
import Settings from './Components/Settings';

import useAttendance from './Components/useAttendance';

import {
  loadData,
  saveData,
} from './Components/storage';

// ============================================================
// PAGE CONFIGURATION
// ============================================================

const PAGE_NAMES = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  tasks: 'My Tasks',
  notes: 'My Notes',
  image: 'Image Studio',
  converter: 'File Converter',
  'file-compressor': 'File Compressor',
  settings: 'Settings',
};

// ============================================================
// APP
// ============================================================

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tasks, setTasks] = useState(() =>
    loadData('workhub_tasks_v1', [])
  );

  const [notes, setNotes] = useState(() =>
    loadData('workhub_notes_v1', [])
  );

  const [createTask, setCreateTask] = useState(false);

  const attendance = useAttendance();

  // ==========================================================
  // LOCAL STORAGE
  // ==========================================================

  useEffect(() => {
    saveData('workhub_tasks_v1', tasks);
  }, [tasks]);

  useEffect(() => {
    saveData('workhub_notes_v1', notes);
  }, [notes]);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const openTaskCreator = () => {
    setCreateTask(true);
    navigate('tasks');
  };

  // ==========================================================
  // PAGE CONTENT
  // ==========================================================

  const pageContent = {
    dashboard: (
      <Dashboard
        tasks={tasks}
        notes={notes}
        navigate={navigate}
        attendance={attendance}
        addTask={openTaskCreator}
      />
    ),

    attendance: (
      <Attendance attendance={attendance} />
    ),

    tasks: (
      <TaskManager
        tasks={tasks}
        setTasks={setTasks}
        createTask={createTask}
        setCreateTask={setCreateTask}
      />
    ),

    notes: (
      <Notes
        notes={notes}
        setNotes={setNotes}
      />
    ),

    image: <ImageEditor />,

    converter: <FileConverter />,

    'file-compressor': <FileCompressor />,

    settings: (
      <Settings
        tasks={tasks}
        notes={notes}
        setTasks={setTasks}
        setNotes={setNotes}
      />
    ),
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#F1DFCA] text-[#191919]">

      {/* SIDEBAR */}

      <Sidebar
        activeTab={activeTab}
        navigate={navigate}
        isOpen={sidebarOpen}
        close={() => setSidebarOpen(false)}
      />

      {/* MAIN APPLICATION */}

      <div className="min-h-screen lg:ml-[250px]">

        {/* TOP HEADER */}

        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#D8C4AD] bg-[#F1DFCA]/95 px-5 backdrop-blur-md sm:px-8">

          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-4">

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D8C4AD] bg-[#FAEBD7] text-[#191919] transition-colors hover:bg-[#EAD5BD] lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">

              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {PAGE_NAMES[activeTab]}
                <span className="text-[#F36B21]">.</span>
              </h1>

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-2">

            <div className="hidden items-center gap-2 text-xs font-medium text-[#857665] sm:flex">

              <Circle
                size={8}
                fill="#176D70"
                className="text-[#176D70]"
              />

              <span>My Workspace</span>

            </div>

            <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#176D70] text-sm font-bold text-white">
              W
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-8">

          {pageContent[activeTab]}

        </main>

      </div>

    </div>
  );
}

export default App;