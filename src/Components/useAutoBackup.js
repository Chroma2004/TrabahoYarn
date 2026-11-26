import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  BACKUP_CONFIG,
  createBackupData,
  getBackupSignature,
  getPhilippineDateTime,
  getNextBackupTime,
  saveBackupSetting,
  loadBackupSetting,
  deleteBackupSetting,
  isBackupSupported,
  checkFolderPermission,
  writeBackupFile,
  readExistingBackup,
  createDailyBackup,
  cleanBackupHistory,
} from './storage';

// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {
  enabled: false,
  skipUnchanged: true,
  keepHistory: true,
  lastBackup: null,
  lastChecked: null,
  lastSlot: null,
  lastHistoryDate: null,
};

// ============================================================
// AUTO BACKUP HOOK
// ============================================================

function useAutoBackup(tasks = [], notes = []) {
  const supported = isBackupSupported();

  const [settings, setSettings] = useState(
    DEFAULT_SETTINGS
  );

  const [folderName, setFolderName] = useState('');
  const [permission, setPermission] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [status, setStatus] = useState(
    'Not configured'
  );

  const [error, setError] = useState('');

  const [nextBackup, setNextBackup] = useState(
    getNextBackupTime()
  );

  const directoryRef = useRef(null);
  const settingsRef = useRef(DEFAULT_SETTINGS);

  const dataRef = useRef({
    tasks,
    notes,
  });

  const busyRef = useRef(false);
  const mountedRef = useRef(false);

  // ==========================================================
  // KEEP CURRENT DATA
  // ==========================================================

  useEffect(() => {
    dataRef.current = {
      tasks,
      notes,
    };
  }, [tasks, notes]);

  // ==========================================================
  // UPDATE SETTINGS
  // ==========================================================

  const updateSettings = useCallback(
    async (updates) => {
      const updated = {
        ...settingsRef.current,
        ...updates,
      };

      settingsRef.current = updated;

      if (mountedRef.current) {
        setSettings(updated);
      }

      await saveBackupSetting(
        'settings',
        updated
      );

      return updated;
    },
    []
  );

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    const initialize = async () => {
      if (!supported) {
        setStatus('Unsupported browser');
        setInitialized(true);

        return;
      }

      try {
        const savedSettings =
          await loadBackupSetting(
            'settings',
            DEFAULT_SETTINGS
          );

        const savedDirectory =
          await loadBackupSetting(
            'directory',
            null
          );

        if (cancelled) return;

        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...savedSettings,
        };

        settingsRef.current = mergedSettings;

        setSettings(mergedSettings);

        if (savedDirectory) {
          directoryRef.current = savedDirectory;

          setFolderName(savedDirectory.name);

          const granted =
            await checkFolderPermission(
              savedDirectory
            );

          if (cancelled) return;

          setPermission(granted);

          if (!granted) {
            setStatus('Permission required');
          } else if (mergedSettings.enabled) {
            setStatus('Active');
          } else {
            setStatus('Paused');
          }
        } else {
          setStatus('Not configured');
        }
      } catch (backupError) {
        if (cancelled) return;

        setError(
          backupError.message ||
            'Unable to load backup settings.'
        );

        setStatus('Error');
      } finally {
        if (!cancelled) {
          setInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [supported]);

  // ==========================================================
  // BACKUP EXECUTION
  // ==========================================================

  const runBackup = useCallback(
    async ({
      manual = false,
      slot = null,
    } = {}) => {
      if (busyRef.current) return false;

      const directory = directoryRef.current;

      if (!directory) {
        setError('Select a backup folder first.');
        setStatus('Not configured');

        return false;
      }

      busyRef.current = true;

      setIsBackingUp(true);
      setError('');
      setStatus('Backing up');

      try {
        const granted =
          await checkFolderPermission(directory);

        setPermission(granted);

        if (!granted) {
          setStatus('Permission required');

          setError(
            'Reconnect your backup folder to continue.'
          );

          return false;
        }

        const currentSettings =
          settingsRef.current;

        const {
          tasks: currentTasks,
          notes: currentNotes,
        } = dataRef.current;

        const backupData = createBackupData(
          currentTasks,
          currentNotes
        );

        const currentSignature =
          getBackupSignature(
            currentTasks,
            currentNotes
          );

        const today =
          getPhilippineDateTime().date;

        // ====================================================
        // CHECK EXISTING FILE
        // ====================================================

        const existingBackup =
          await readExistingBackup(
            directory,
            BACKUP_CONFIG.latestFile
          );

        const existingSignature = existingBackup
          ? getBackupSignature(
              existingBackup.tasks,
              existingBackup.notes
            )
          : null;

        const unchanged =
          existingSignature === currentSignature;

        const needsDailyHistory =
          currentSettings.keepHistory &&
          currentSettings.lastHistoryDate !== today;

        // ====================================================
        // SKIP UNCHANGED DATA
        // ====================================================

        if (
          !manual &&
          currentSettings.skipUnchanged &&
          unchanged &&
          !needsDailyHistory
        ) {
          await updateSettings({
            lastChecked: new Date().toISOString(),
            ...(slot
              ? { lastSlot: slot }
              : {}),
          });

          setStatus('Up to date');

          return true;
        }

        // ====================================================
        // WRITE LATEST BACKUP
        // ====================================================

        if (
          manual ||
          !currentSettings.skipUnchanged ||
          !unchanged
        ) {
          await writeBackupFile(
            directory,
            BACKUP_CONFIG.latestFile,
            backupData
          );
        }

        // ====================================================
        // DAILY HISTORY
        // ====================================================

        let historyWarning = '';
        let historyDate =
          currentSettings.lastHistoryDate;

        if (currentSettings.keepHistory) {
          try {
            const historyDirectory =
              await createDailyBackup(
                directory,
                backupData
              );

            historyDate = today;

            await cleanBackupHistory(
              historyDirectory
            );
          } catch (historyError) {
            historyWarning =
              'Latest backup saved, but backup history could not be updated.';

            console.error(
              'Backup history error:',
              historyError
            );
          }
        }

        // ====================================================
        // SAVE STATUS
        // ====================================================

        await updateSettings({
          lastBackup: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          lastHistoryDate: historyDate,
          ...(slot
            ? { lastSlot: slot }
            : {}),
        });

        setStatus(
          historyWarning
            ? 'Backup saved with warning'
            : 'Backup saved'
        );

        if (historyWarning) {
          setError(historyWarning);
        }

        setNextBackup(getNextBackupTime());

        return true;
      } catch (backupError) {
        console.error(
          'Automatic backup error:',
          backupError
        );

        setError(
          backupError.message ||
            'Unable to save backup.'
        );

        setStatus('Backup failed');

        return false;
      } finally {
        busyRef.current = false;

        if (mountedRef.current) {
          setIsBackingUp(false);
        }
      }
    },
    [updateSettings]
  );

  // ==========================================================
  // SELECT BACKUP FOLDER
  // ==========================================================

  const selectFolder = useCallback(async () => {
    if (!supported || busyRef.current) {
      return false;
    }

    setIsConnecting(true);
    setError('');

    try {
      const directory =
        await window.showDirectoryPicker({
          id: 'trabahoyarn-backup',
          mode: 'readwrite',
        });

      const granted =
        await checkFolderPermission(
          directory,
          true
        );

      if (!granted) {
        throw new Error(
          'Folder permission was not granted.'
        );
      }

      const existingBackup =
        await readExistingBackup(
          directory,
          BACKUP_CONFIG.latestFile
        );

      if (existingBackup) {
        const existingSignature =
          getBackupSignature(
            existingBackup.tasks,
            existingBackup.notes
          );

        const currentSignature =
          getBackupSignature(
            dataRef.current.tasks,
            dataRef.current.notes
          );

        if (
          existingSignature !== currentSignature &&
          !window.confirm(
            'This folder contains a different backup. Replace it with your current workspace data?'
          )
        ) {
          return false;
        }
      } else {
        // Detect an existing file that is not valid backup JSON.

        try {
          await directory.getFileHandle(
            BACKUP_CONFIG.latestFile
          );

          if (
            !window.confirm(
              'A file named latest-backup.json already exists. Replace it with your workspace backup?'
            )
          ) {
            return false;
          }
        } catch (fileError) {
          if (fileError.name !== 'NotFoundError') {
            throw fileError;
          }
        }
      }

      await saveBackupSetting(
        'directory',
        directory
      );

      directoryRef.current = directory;

      setFolderName(directory.name);
      setPermission(true);

      await updateSettings({
        enabled: true,
        lastBackup: null,
        lastChecked: null,
        lastSlot: null,
        lastHistoryDate: null,
      });

      setStatus('Active');

      // Save immediately after connecting.

      return await runBackup({
        manual: true,
      });
    } catch (backupError) {
      if (backupError.name === 'AbortError') {
        return false;
      }

      setError(
        backupError.message ||
          'Unable to connect backup folder.'
      );

      setStatus('Connection failed');

      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [
    supported,
    updateSettings,
    runBackup,
  ]);

  // ==========================================================
  // RECONNECT PERMISSION
  // ==========================================================

  const reconnectFolder = useCallback(async () => {
    const directory = directoryRef.current;

    if (!directory) {
      return selectFolder();
    }

    setError('');

    try {
      const granted =
        await checkFolderPermission(
          directory,
          true
        );

      setPermission(granted);

      if (!granted) {
        setStatus('Permission required');

        return false;
      }

      setStatus(
        settingsRef.current.enabled
          ? 'Active'
          : 'Paused'
      );

      return true;
    } catch (backupError) {
      setError(
        backupError.message ||
          'Unable to reconnect folder.'
      );

      return false;
    }
  }, [selectFolder]);

  // ==========================================================
  // ENABLE / DISABLE
  // ==========================================================

  const toggleEnabled = useCallback(async () => {
    if (busyRef.current) return;

    if (!directoryRef.current) {
      await selectFolder();

      return;
    }

    try {
      const enabled =
        !settingsRef.current.enabled;

      if (enabled) {
        const granted =
          await checkFolderPermission(
            directoryRef.current,
            true
          );

        setPermission(granted);

        if (!granted) {
          setStatus('Permission required');

          return;
        }
      }

      await updateSettings({
        enabled,
      });

      setStatus(
        enabled
          ? 'Active'
          : 'Paused'
      );

      setError('');
    } catch (backupError) {
      setError(
        backupError.message ||
          'Unable to update backup settings.'
      );
    }
  }, [selectFolder, updateSettings]);

  // ==========================================================
  // SKIP UNCHANGED
  // ==========================================================

  const toggleSkipUnchanged =
    useCallback(async () => {
      try {
        await updateSettings({
          skipUnchanged:
            !settingsRef.current.skipUnchanged,
        });
      } catch (backupError) {
        setError(backupError.message);
      }
    }, [updateSettings]);

  // ==========================================================
  // BACKUP HISTORY
  // ==========================================================

  const toggleHistory = useCallback(async () => {
    try {
      await updateSettings({
        keepHistory:
          !settingsRef.current.keepHistory,
      });
    } catch (backupError) {
      setError(backupError.message);
    }
  }, [updateSettings]);

  // ==========================================================
  // MANUAL BACKUP
  // ==========================================================

  const backupNow = useCallback(async () => {
    if (!directoryRef.current) {
      return selectFolder();
    }

    const granted = await reconnectFolder();

    if (!granted) return false;

    return runBackup({
      manual: true,
    });
  }, [
    selectFolder,
    reconnectFolder,
    runBackup,
  ]);

  // ==========================================================
  // DISCONNECT FOLDER
  // ==========================================================

  const disconnectFolder = useCallback(async () => {
    if (busyRef.current) return;

    if (
      !window.confirm(
        'Disconnect the backup folder? Existing backup files will not be deleted.'
      )
    ) {
      return;
    }

    try {
      await deleteBackupSetting('directory');

      await updateSettings({
        enabled: false,
        lastBackup: null,
        lastChecked: null,
        lastSlot: null,
        lastHistoryDate: null,
      });

      directoryRef.current = null;

      setFolderName('');
      setPermission(false);
      setStatus('Not configured');
      setError('');
    } catch (backupError) {
      setError(
        backupError.message ||
          'Unable to disconnect folder.'
      );
    }
  }, [updateSettings]);

  // ==========================================================
  // AUTOMATIC SCHEDULER
  // ==========================================================

  useEffect(() => {
    if (!initialized || !supported) return;

    const checkSchedule = async () => {
      setNextBackup(getNextBackupTime());

      const currentSettings =
        settingsRef.current;

      if (
        !currentSettings.enabled ||
        !directoryRef.current ||
        busyRef.current
      ) {
        return;
      }

      const now = getPhilippineDateTime();

      // Only run between 8:00 AM and 5:00 PM.
      // Allow a short grace period for the final 5 PM backup.

      const withinSchedule =
        now.hour >= BACKUP_CONFIG.startHour &&
        (
          now.hour < BACKUP_CONFIG.endHour ||
          (
            now.hour === BACKUP_CONFIG.endHour &&
            now.minute < 5
          )
        );

      if (!withinSchedule) return;

      const slot = `${now.date}-${String(
        now.hour
      ).padStart(2, '0')}`;

      // Prevent multiple automatic backups in the same hour.

      if (currentSettings.lastSlot === slot) {
        return;
      }

      // Do not retry continuously after a failed attempt.

      const lastAttempt =
        currentSettings.lastChecked
          ? new Date(
              currentSettings.lastChecked
            ).getTime()
          : 0;

      if (
        Date.now() - lastAttempt <
        60 * 1000
      ) {
        return;
      }

      try {
        const granted =
          await checkFolderPermission(
            directoryRef.current
          );

        setPermission(granted);

        if (!granted) {
          setStatus('Permission required');

          return;
        }

        await updateSettings({
          lastChecked: new Date().toISOString(),
        });

        await runBackup({
          manual: false,
          slot,
        });
      } catch (backupError) {
        setError(
          backupError.message ||
            'Scheduled backup failed.'
        );

        setStatus('Backup failed');
      }
    };

    // Check periodically so the app can recover
    // from delayed browser timers.

    const interval = window.setInterval(
      checkSchedule,
      15000
    );

    const handleVisibility = () => {
      if (
        document.visibilityState === 'visible'
      ) {
        checkSchedule();
      }
    };

    window.addEventListener(
      'focus',
      checkSchedule
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    checkSchedule();

    return () => {
      window.clearInterval(interval);

      window.removeEventListener(
        'focus',
        checkSchedule
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, [
    initialized,
    supported,
    runBackup,
    updateSettings,
  ]);

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {
    supported,
    initialized,
    enabled: settings.enabled,
    skipUnchanged: settings.skipUnchanged,
    keepHistory: settings.keepHistory,
    lastBackup: settings.lastBackup,
    lastChecked: settings.lastChecked,
    nextBackup,
    folderName,
    permission,
    isBackingUp,
    isConnecting,
    status,
    error,
    selectFolder,
    reconnectFolder,
    toggleEnabled,
    toggleSkipUnchanged,
    toggleHistory,
    backupNow,
    disconnectFolder,
  };
}

export default useAutoBackup;