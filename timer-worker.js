let timerInterval = null;
let endTime = null;

self.onmessage = function(e) {
  const { action, duration } = e.data;

  switch (action) {
    case 'start':
      endTime = Date.now() + duration * 1000;
      startTimer();
      break;
    case 'pause':
      stopTimer();
      break;
    case 'resume':
      if (e.data.remaining) {
        endTime = Date.now() + e.data.remaining * 1000;
        startTimer();
      }
      break;
    case 'stop':
      stopTimer();
      endTime = null;
      break;
    case 'sync':
      if (endTime) {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        self.postMessage({ type: 'tick', remaining });
      }
      break;
  }
};

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    self.postMessage({ type: 'tick', remaining });

    if (remaining <= 0) {
      stopTimer();
      self.postMessage({ type: 'complete' });
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}