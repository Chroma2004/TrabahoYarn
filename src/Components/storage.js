// ============================================================
// LOCAL STORAGE
// ============================================================

export const loadData = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);

    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error('Storage read error:', error);

    return fallback;
  }
};

export const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));

    return true;
  } catch (error) {
    console.error('Storage save error:', error);

    return false;
  }
};

// ============================================================
// BACKUP CONFIGURATION
// ============================================================

export const BACKUP_CONFIG = {
  latestFile: 'latest-backup.json',
  historyFolder: 'History',
  retentionDays: 7,
  startHour: 8,
  endHour: 17,
  timezone: 'Asia/Manila',
};

const DB_NAME = 'trabahoyarn_backup_db';
const DB_VERSION = 1;
const STORE_NAME = 'backup_settings';

// ============================================================
// BACKUP DATA
// ============================================================

export const createBackupData = (tasks = [], notes = []) => ({
  version: 1,
  tasks,
  notes,
  exportedAt: new Date().toISOString(),
});

export const getBackupSignature = (tasks = [], notes = []) =>
  JSON.stringify({
    tasks,
    notes,
  });

export const validateBackupData = (data) => {
  if (
    !data ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.notes)
  ) {
    return false;
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

  return validTasks && validNotes;
};

// ============================================================
// PHILIPPINE TIME
// ============================================================

export const getPhilippineDateTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BACKUP_CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    date: `${values.year}-${values.month}-${values.day}`,
  };
};

export const formatBackupDate = (value) => {
  if (!value) return 'Not yet';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: BACKUP_CONFIG.timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export const getNextBackupTime = (date = new Date()) => {
  const now = getPhilippineDateTime(date);

  let nextHour;
  let dayOffset = 0;

  if (now.hour < BACKUP_CONFIG.startHour) {
    nextHour = BACKUP_CONFIG.startHour;
  } else if (now.hour >= BACKUP_CONFIG.endHour) {
    nextHour = BACKUP_CONFIG.startHour;
    dayOffset = 1;
  } else {
    nextHour = now.hour + 1;
  }

  // Philippine time is UTC+8.

  return new Date(
    Date.UTC(
      now.year,
      now.month - 1,
      now.day + dayOffset,
      nextHour - 8,
      0,
      0
    )
  ).toISOString();
};

// ============================================================
// INDEXED DB
// ============================================================

const openBackupDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

export const saveBackupSetting = async (key, value) => {
  const db = await openBackupDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      'readwrite'
    );

    transaction.objectStore(STORE_NAME).put(
      value,
      key
    );

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const loadBackupSetting = async (
  key,
  fallback = null
) => {
  const db = await openBackupDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      'readonly'
    );

    const request = transaction
      .objectStore(STORE_NAME)
      .get(key);

    request.onsuccess = () => {
      resolve(request.result ?? fallback);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const deleteBackupSetting = async (key) => {
  const db = await openBackupDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      'readwrite'
    );

    transaction.objectStore(STORE_NAME).delete(key);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

// ============================================================
// FILE SYSTEM PERMISSIONS
// ============================================================

export const isBackupSupported = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof window.showDirectoryPicker === 'function' &&
  typeof indexedDB !== 'undefined';

export const checkFolderPermission = async (
  handle,
  requestPermission = false
) => {
  if (!handle) return false;

  const options = {
    mode: 'readwrite',
  };

  const permission = await handle.queryPermission(
    options
  );

  if (permission === 'granted') {
    return true;
  }

  if (requestPermission) {
    const result = await handle.requestPermission(
      options
    );

    return result === 'granted';
  }

  return false;
};

// ============================================================
// WRITE JSON FILE
// ============================================================

export const writeBackupFile = async (
  directoryHandle,
  filename,
  data
) => {
  const fileHandle = await directoryHandle.getFileHandle(
    filename,
    {
      create: true,
    }
  );

  const writable = await fileHandle.createWritable();

  try {
    await writable.write(
      JSON.stringify(data, null, 2)
    );

    await writable.close();
  } catch (error) {
    try {
      await writable.abort();
    } catch {
      // The stream may already be closed.
    }

    throw error;
  }
};

// ============================================================
// READ EXISTING BACKUP
// ============================================================

export const readExistingBackup = async (
  directoryHandle,
  filename
) => {
  try {
    const handle = await directoryHandle.getFileHandle(
      filename
    );

    const file = await handle.getFile();

    const data = JSON.parse(await file.text());

    return validateBackupData(data)
      ? data
      : null;
  } catch (error) {
    if (
      error.name === 'NotFoundError' ||
      error instanceof SyntaxError
    ) {
      return null;
    }

    throw error;
  }
};

// ============================================================
// BACKUP HISTORY
// ============================================================

export const createDailyBackup = async (
  directoryHandle,
  data
) => {
  const historyDirectory =
    await directoryHandle.getDirectoryHandle(
      BACKUP_CONFIG.historyFolder,
      {
        create: true,
      }
    );

  const today = getPhilippineDateTime().date;

  const filename = `backup-${today}.json`;

  await writeBackupFile(
    historyDirectory,
    filename,
    data
  );

  return historyDirectory;
};

export const cleanBackupHistory = async (
  historyDirectory
) => {
  const today = getPhilippineDateTime();

  const cutoff = new Date(
    Date.UTC(
      today.year,
      today.month - 1,
      today.day - (BACKUP_CONFIG.retentionDays - 1)
    )
  )
    .toISOString()
    .slice(0, 10);

  for await (const entry of historyDirectory.values()) {
    if (entry.kind !== 'file') continue;

    const match = entry.name.match(
      /^backup-(\d{4}-\d{2}-\d{2})\.json$/
    );

    if (!match) continue;

    if (match[1] < cutoff) {
      await historyDirectory.removeEntry(
        entry.name
      );
    }
  }
};

// ============================================================
// MANUAL DOWNLOAD
// ============================================================

export const downloadBackup = (tasks, notes) => {
  const data = createBackupData(tasks, notes);

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
};