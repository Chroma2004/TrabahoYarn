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
