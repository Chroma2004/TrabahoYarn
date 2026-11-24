import { useRef, useState } from 'react';

import {
  Download,
  Upload,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  FileJson,
} from 'lucide-react';

function Settings({
  tasks = [],
  notes = [],
  setTasks,
  setNotes,
}) {
  const inputRef = useRef(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  // ==========================================================
  // EXPORT DATA
  // ==========================================================

  const exportData = () => {
    const data = {
      version: 1,
      tasks,
      notes,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: 'application/json',
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'workhub-backup.json';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    showMessage('Backup downloaded successfully.');
  };

  // ==========================================================
  // IMPORT DATA
  // ==========================================================

  const importData = async (file) => {
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      if (
        !Array.isArray(data.tasks) ||
        !Array.isArray(data.notes)
      ) {
        throw new Error('Invalid backup.');
      }

      const validTasks = data.tasks.every(
        (task) =>
          task &&
          typeof task.id === 'string' &&
          typeof task.title === 'string' &&
          typeof task.completed === 'boolean'
      );

      const validNotes = data.notes.every(
        (note) =>
          note &&
          typeof note.id === 'string' &&
          typeof note.title === 'string' &&
          typeof note.content === 'string'
      );

      if (!validTasks || !validNotes) {
        throw new Error('Invalid backup records.');
      }

      if (
        !window.confirm(
          'Replace your current tasks and notes with this backup?'
        )
      ) {
        return;
      }

      setTasks(data.tasks);
      setNotes(data.notes);

      showMessage('Workspace restored successfully.');
    } catch {
      showMessage(
        'Unable to restore this backup file.',
        'error'
      );
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  // ==========================================================
  // CLEAR DATA
  // ==========================================================

  const clearData = () => {
    if (
      !window.confirm(
        'Delete all tasks and notes? This cannot be undone.'
      )
    ) {
      return;
    }

    setTasks([]);
    setNotes([]);

    showMessage('Workspace data cleared.');
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-8 text-[#191919]">

      {/* HEADER */}

      <div className="border-b border-[#D8C4AD] pb-5">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Settings
          <span className="text-[#F36B21]">.</span>
        </h2>

        <p className="mt-1 text-xs text-[#857665]">
          Manage your workspace data
        </p>
      </div>

      {/* WORKSPACE DATA */}

      <section className="rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-6">

        <div className="mb-5 flex items-center gap-3">
          <Database
            size={19}
            className="text-[#176D70]"
          />

          <h3 className="text-base font-bold">
            Workspace Data
          </h3>
        </div>

        {/* STATISTICS */}

        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
            <p className="text-2xl font-bold text-[#F36B21]">
              {tasks.length}
            </p>

            <p className="mt-1 text-xs text-[#857665]">
              Saved Tasks
            </p>
          </div>

          <div className="rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">
            <p className="text-2xl font-bold text-[#176D70]">
              {notes.length}
            </p>

            <p className="mt-1 text-xs text-[#857665]">
              Saved Notes
            </p>
          </div>

        </div>

        {/* BACKUP ACTIONS */}

        <div className="mt-6 border-t border-[#D8C4AD] pt-5">

          <div className="mb-4 flex items-center gap-2">
            <FileJson
              size={17}
              className="text-[#857665]"
            />

            <h4 className="text-sm font-semibold">
              Backup & Restore
            </h4>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={exportData}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F36B21] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#DC5814]"
            >
              <Download size={16} />
              Download Backup
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) =>
                importData(event.target.files?.[0])
              }
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] px-5 py-3 text-xs font-semibold text-[#176D70] transition-colors hover:bg-[#EAD5BD]"
            >
              <Upload size={16} />
              Restore Backup
            </button>

          </div>
        </div>

        {/* STATUS MESSAGE */}

        {message && (
          <div
            role="status"
            className={`mt-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-medium ${
              messageType === 'error'
                ? 'border-[#C7503E]/30 bg-[#C7503E]/10 text-[#C7503E]'
                : 'border-[#176D70]/20 bg-[#176D70]/10 text-[#176D70]'
            }`}
          >
            {messageType === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}

            {message}
          </div>
        )}

      </section>

      {/* DANGER ZONE */}

      <section className="rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-6">

        <h3 className="text-base font-bold">
          Clear Workspace
        </h3>

        <p className="mt-2 text-xs leading-5 text-[#857665]">
          Permanently remove all saved tasks and notes.
        </p>

        <button
          type="button"
          onClick={clearData}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#C7503E]/30 bg-[#C7503E]/10 px-4 py-2.5 text-xs font-semibold text-[#C7503E] transition-colors hover:bg-[#C7503E]/15"
        >
          <Trash2 size={16} />
          Clear All Data
        </button>

      </section>

      {/* FOOTER */}

      <p className="text-center text-xs text-[#857665]">
        Your data is stored locally in this browser.
      </p>

    </div>
  );
}

export default Settings;