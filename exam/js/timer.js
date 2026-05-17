function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function shuffleArray(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createCountdown(targetTimestamp, onTick, onDone) {
  if (!targetTimestamp) {
    return null;
  }
  const interval = setInterval(() => {
    const remaining = Math.max(0, Math.round((targetTimestamp - Date.now()) / 1000));
    onTick(remaining);
    if (remaining <= 0) {
      clearInterval(interval);
      onDone();
    }
  }, 1000);
  return interval;
}
