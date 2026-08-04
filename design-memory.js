(() => {
  const key = 'lensos.design-memory.v1';
  const defaults = {
    version: 1,
    rules: {
      noDividerLines: true,
      hierarchy: ['spacing', 'typography', 'surface contrast']
    }
  };

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (error) {}

  const memory = {
    ...defaults,
    ...saved,
    rules: { ...defaults.rules, ...(saved.rules || {}), noDividerLines: true }
  };

  localStorage.setItem(key, JSON.stringify(memory));
  document.documentElement.dataset.lensosDividers = memory.rules.noDividerLines ? 'off' : 'on';
  window.LensOSDesignMemory = Object.freeze(memory);
})();
