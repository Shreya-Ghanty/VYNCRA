(async () => {
  try {
    // Dynamically import the backend ES module entry.
    await import('./backend/src/server.js');
  } catch (err) {
    console.error('Failed to start backend:', err);
    process.exit(1);
  }
})();

// Root wrapper so hosts that run `node server.js` (like Render) start the backend.