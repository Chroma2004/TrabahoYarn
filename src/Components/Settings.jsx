import {
  useRef,
  useState,
} from 'react';

import {
  Download,
  Upload,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FolderOpen,
  Clock3,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  LoaderCircle,
  Unlink,
} from 'lucide-react';

import {
  downloadBackup,
  validateBackupData,
  formatBackupDate,
} from './storage';

// ============================================================
// STYLES
// ============================================================

const panelClass =
  'rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-6';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#F36B21] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#DC5814] disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] px-4 py-2.5 text-xs font-semibold text-[#176D70] transition-colors hover:bg-[#EAD5BD] disabled:cursor-not-allowed disabled:opacity-50';

// ============================================================
// TOGGLE
// ============================================================

function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative h-6 w-11 shrink-0
        rounded-full transition-colors
        duration-200
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${
          checked
            ? 'bg-[#176D70]'
            : 'bg-[#D8C4AD]'
        }
      `}
    >
      <span
        className={`
          absolute left-1 top-1
          h-4 w-4 rounded-full
          bg-white shadow-sm
          transition-transform duration-200
          ${
            checked
              ? 'translate-x-5'
              : 'translate-x-0'
          }
        `}
      />
    </button>
  );
}

// ============================================================
// SETTING ROW
// ============================================================

function SettingRow({
  title,
  description,
  children,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">

      <div className="min-w-0">

        <p className="text-sm font-semibold text-[#191919]">
          {title}
        </p>

        {description && (
          <p className="mt-1 text-[11px] leading-5 text-[#857665]">
            {description}
          </p>
        )}

      </div>

      {children}

    </div>
  );
}

// ============================================================
// INFORMATION CARD
// ============================================================

function InfoCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">

      <div className="flex items-center gap-2">

        {Icon && (
          <Icon
            size={15}
            className="shrink-0 text-[#176D70]"
          />
        )}

        <p className="text-[11px] font-medium text-[#857665]">
          {title}
        </p>

      </div>

      <p className="mt-3 break-words text-xs font-bold text-[#191919]">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// BACKUP STATUS
// ============================================================

function BackupStatus({
  autoBackup,
}) {
  const {
    enabled,
    folderName,
    permission,
    isBackingUp,
    error,
    status,
  } = autoBackup;

  let color = '#857665';
  let label = status;

  if (isBackingUp) {
    color = '#F36B21';
    label = 'Backing up';
  } else if (error) {
    color = '#C7503E';
  } else if (!folderName) {
    label = 'Not configured';
  } else if (!permission) {
    color = '#F36B21';
    label = 'Permission required';
  } else if (!enabled) {
    label = 'Paused';
  } else {
    color = '#176D70';
  }

  return (
    <div
      className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold"
      style={{
        color,
        backgroundColor: `${color}15`,
      }}
    >

      {isBackingUp ? (
        <LoaderCircle
          size={12}
          className="animate-spin"
        />
      ) : (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />
      )}

      {label}

    </div>
  );
}

// ============================================================
// AUTOMATIC BACKUP PANEL
// ============================================================

function AutoBackupPanel({
  autoBackup,
}) {
  const {
    supported,
    initialized,
    enabled,
    skipUnchanged,
    keepHistory,
    lastBackup,
    nextBackup,
    folderName,
    permission,
    isBackingUp,
    isConnecting,
    error,
    selectFolder,
    reconnectFolder,
    toggleEnabled,
    toggleSkipUnchanged,
    toggleHistory,
    backupNow,
    disconnectFolder,
  } = autoBackup;

  const busy =
    isBackingUp ||
    isConnecting ||
    !initialized;

  return (
    <section className={panelClass}>

      {/* HEADER */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <HardDrive
            size={19}
            className="text-[#176D70]"
          />

          <h3 className="text-base font-bold">
            Automatic Backup
          </h3>

        </div>

        <BackupStatus
          autoBackup={autoBackup}
        />

      </div>

      {!supported ? (
        <div className="flex items-start gap-3 rounded-lg border border-[#F36B21]/30 bg-[#F36B21]/10 p-4">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-[#F36B21]"
          />

          <div>

            <p className="text-xs font-semibold">
              Browser not supported
            </p>

            <p className="mt-1 text-xs leading-5 text-[#857665]">
              Use Chrome, Brave, or Edge with
              local file access enabled.
            </p>

          </div>

        </div>
      ) : (
        <>

          {/* SETTINGS */}

          <div className="divide-y divide-[#D8C4AD]">

            <SettingRow
              title="Auto Backup"
              description="Save hourly from 8 AM to 5 PM."
            >

              <Toggle
                label="Automatic backup"
                checked={enabled}
                onChange={toggleEnabled}
                disabled={busy}
              />

            </SettingRow>

            <SettingRow
              title="Skip Unchanged Data"
              description="Only save when your workspace changes."
            >

              <Toggle
                label="Skip unchanged data"
                checked={skipUnchanged}
                onChange={toggleSkipUnchanged}
                disabled={busy}
              />

            </SettingRow>

            <SettingRow
              title="Backup History"
              description="Keep daily backups for seven days."
            >

              <Toggle
                label="Backup history"
                checked={keepHistory}
                onChange={toggleHistory}
                disabled={busy}
              />

            </SettingRow>

          </div>

          {/* BACKUP LOCATION */}

          <div className="mt-3 border-t border-[#D8C4AD] pt-5">

            <p className="mb-3 text-xs font-semibold">
              Backup Location
            </p>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#176D70]/10">

                <FolderOpen
                  size={20}
                  className="text-[#176D70]"
                />

              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold">

                  {folderName ||
                    'No folder selected'}

                </p>

                <p className="mt-1 truncate text-[11px] text-[#857665]">

                  {folderName
                    ? 'latest-backup.json'
                    : 'Select a local backup folder'}

                </p>

              </div>

              <button
                type="button"
                onClick={selectFolder}
                disabled={busy}
                className={secondaryButton}
              >

                {isConnecting ? (
                  <LoaderCircle
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <FolderOpen size={14} />
                )}

                {folderName
                  ? 'Change Folder'
                  : 'Select Folder'}

              </button>

            </div>

          </div>

          {/* PERMISSION */}

          {folderName && !permission && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F36B21]/30 bg-[#F36B21]/10 p-4">

              <div className="flex items-center gap-2">

                <AlertCircle
                  size={17}
                  className="shrink-0 text-[#F36B21]"
                />

                <p className="text-xs font-medium">
                  Folder permission required.
                </p>

              </div>

              <button
                type="button"
                onClick={reconnectFolder}
                disabled={busy}
                className={secondaryButton}
              >
                Reconnect
              </button>

            </div>
          )}

          {/* BACKUP INFORMATION */}

          <div className="mt-5 grid grid-cols-2 gap-3">

            <InfoCard
              title="Frequency"
              value="Every 1 hour"
              icon={RefreshCw}
            />

            <InfoCard
              title="Schedule"
              value="8 AM – 5 PM"
              icon={Clock3}
            />

            <InfoCard
              title="Last Backup"
              value={formatBackupDate(
                lastBackup
              )}
              icon={CheckCircle2}
            />

            <InfoCard
              title="Next Backup"
              value={
                enabled &&
                folderName &&
                permission
                  ? formatBackupDate(nextBackup)
                  : 'Not scheduled'
              }
              icon={Clock3}
            />

          </div>

          {/* ACTIONS */}

          <div className="mt-5 flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={backupNow}
              disabled={busy}
              className={primaryButton}
            >

              {isBackingUp ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <HardDrive size={16} />
              )}

              {isBackingUp
                ? 'Saving...'
                : 'Backup Now'}

            </button>

            {folderName && (
              <button
                type="button"
                onClick={disconnectFolder}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#857665] transition-colors hover:text-[#C7503E] disabled:opacity-50"
              >

                <Unlink size={15} />

                Disconnect

              </button>
            )}

          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-[#C7503E]/30 bg-[#C7503E]/10 p-3 text-xs leading-5 text-[#C7503E]"
            >

              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
              />

              {error}

            </div>
          )}

          {/* FOOTNOTE */}

          <div className="mt-5 flex items-start gap-2 border-t border-[#D8C4AD] pt-4">

            <ShieldCheck
              size={15}
              className="mt-0.5 shrink-0 text-[#176D70]"
            />

            <p className="text-[11px] leading-5 text-[#857665]">
              Backups are saved locally.
              Keep the application open for
              automatic backups.
            </p>

          </div>

        </>
      )}

    </section>
  );
}

// ============================================================
// SETTINGS
// ============================================================

function Settings({
  tasks = [],
  notes = [],
  setTasks,
  setNotes,
  autoBackup,
}) {
  const inputRef = useRef(null);

  const [message, setMessage] = useState('');

  const [messageType, setMessageType] =
    useState('success');

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const showMessage = (
    text,
    type = 'success'
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  // ==========================================================
  // EXPORT DATA
  // ==========================================================

  const exportData = () => {
    try {
      downloadBackup(
        tasks,
        notes
      );

      showMessage(
        'Backup download started.'
      );
    } catch {
      showMessage(
        'Unable to download backup.',
        'error'
      );
    }
  };

  // ==========================================================
  // IMPORT DATA
  // ==========================================================

  const importData = async (file) => {
    if (!file) return;

    try {
      const content = await file.text();

      const data = JSON.parse(content);

      if (!validateBackupData(data)) {
        throw new Error('Invalid backup.');
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

      showMessage(
        'Workspace restored successfully.'
      );
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
        'Delete all tasks and notes? This cannot be undone without a backup.'
      )
    ) {
      return;
    }

    setTasks([]);
    setNotes([]);

    showMessage(
      'Workspace data cleared.'
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-8 text-[#191919]">

      {/* WORKSPACE DATA */}

      <section className={panelClass}>

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

        {/* MANUAL BACKUP */}

        <div className="mt-6 border-t border-[#D8C4AD] pt-5">

          <div className="mb-4 flex items-center gap-2">

            <FileJson
              size={17}
              className="text-[#857665]"
            />

            <h4 className="text-sm font-semibold">
              Manual Backup & Restore
            </h4>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={exportData}
              className={primaryButton}
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
                importData(
                  event.target.files?.[0]
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              className={secondaryButton}
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
            className={`
              mt-5 flex items-center gap-2
              rounded-lg border px-4 py-3
              text-xs font-medium
              ${
                messageType === 'error'
                  ? 'border-[#C7503E]/30 bg-[#C7503E]/10 text-[#C7503E]'
                  : 'border-[#176D70]/20 bg-[#176D70]/10 text-[#176D70]'
              }
            `}
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

      {/* AUTOMATIC BACKUP */}

      {autoBackup && (
        <AutoBackupPanel
          autoBackup={autoBackup}
        />
      )}

      {/* DANGER ZONE */}

      <section className={panelClass}>

        <h3 className="text-base font-bold">
          Clear Workspace
        </h3>

        <p className="mt-2 text-xs leading-5 text-[#857665]">
          Permanently remove all saved tasks
          and notes.
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

      <p className="text-center text-[11px] text-[#857665]">
        Your data is stored locally.
      </p>

    </div>
  );
}

export default Settings;