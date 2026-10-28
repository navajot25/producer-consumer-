// semaphore.js - Genuine OS Synchronization Primitives
// Implements Counting Semaphore and Binary Semaphore (Mutex) with FIFO Wait Queues

class Semaphore {
  /**
   * @param {string} name - Name of semaphore (e.g. 'empty', 'full')
   * @param {number} initialValue - Initial counter value
   * @param {Function} onChange - Callback triggered when semaphore state changes
   */
  constructor(name, initialValue, onChange = null) {
    this.name = name;
    this.value = initialValue;
    this.initialValue = initialValue;
    this.queue = []; // Array of { threadId, name, resolve }
    this.onChange = onChange;
  }

  /**
   * wait() / P() operation
   * Decrements value. If value <= 0, the calling thread blocks until signaled.
   * @param {string} threadId - Identifier of calling process/thread
   * @param {string} actorName - Human readable name (e.g. 'Aarav')
   * @returns {Promise<void>}
   */
  async wait(threadId, actorName = '') {
    if (this.value > 0) {
      this.value--;
      this.notifyChange('DECREMENT', threadId, actorName);
      return Promise.resolve();
    } else {
      // Thread must block
      return new Promise((resolve) => {
        this.queue.push({ threadId, name: actorName || threadId, resolve, timestamp: Date.now() });
        this.notifyChange('BLOCK', threadId, actorName);
      });
    }
  }

  /**
   * signal() / V() operation
   * Increments value. If threads are blocked in queue, unblocks the first one (FIFO).
   * @param {string} threadId - Identifier of calling process/thread
   */
  signal(threadId = null) {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.notifyChange('UNBLOCK', threadId, next.name || next.threadId);
      next.resolve(); // Wake up blocked thread
    } else {
      this.value++;
      this.notifyChange('INCREMENT', threadId);
    }
  }

  reset(value = this.initialValue) {
    this.queue.forEach((item) => item.resolve(false));
    this.queue = [];
    this.value = value;
    this.initialValue = value;
    this.notifyChange('RESET');
  }

  notifyChange(action, callerId = null, targetName = null) {
    if (typeof this.onChange === 'function') {
      this.onChange({
        name: this.name,
        value: this.value,
        queueLength: this.queue.length,
        waitingActors: this.queue.map((q) => ({ id: q.threadId, name: q.name })),
        action,
        callerId,
        targetName
      });
    }
  }
}

class Mutex {
  /**
   * Binary Semaphore for Mutual Exclusion (Value: 1=Unlocked, 0=Locked)
   * @param {string} name - Mutex identifier
   * @param {Function} onChange - Callback triggered on lock/unlock
   */
  constructor(name = 'mutex', onChange = null) {
    this.name = name;
    this.locked = false;
    this.holder = null;
    this.holderName = null;
    this.queue = []; // FIFO Queue of { threadId, name, resolve }
    this.onChange = onChange;
  }

  get value() {
    return this.locked ? 0 : 1;
  }

  /**
   * wait(mutex) / acquire()
   * @param {string} threadId
   * @param {string} actorName
   * @returns {Promise<void>}
   */
  async wait(threadId, actorName = '') {
    if (!this.locked) {
      this.locked = true;
      this.holder = threadId;
      this.holderName = actorName || threadId;
      this.notifyChange('LOCK', threadId, actorName);
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this.queue.push({ threadId, name: actorName || threadId, resolve, timestamp: Date.now() });
        this.notifyChange('MUTEX_BLOCK', threadId, actorName);
      });
    }
  }

  /**
   * signal(mutex) / release()
   * @param {string} threadId
   */
  signal(threadId = null) {
    if (!this.locked) {
      console.warn(`[Mutex] Attempt to signal unlocked mutex by ${threadId}`);
      return;
    }

    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.holder = next.threadId;
      this.holderName = next.name || next.threadId;
      this.notifyChange('MUTEX_HANDOVER', threadId, next.name || next.threadId);
      next.resolve(); // Wake up waiting thread
    } else {
      this.locked = false;
      this.holder = null;
      this.holderName = null;
      this.notifyChange('UNLOCK', threadId);
    }
  }

  reset() {
    this.queue.forEach((item) => item.resolve(false));
    this.queue = [];
    this.locked = false;
    this.holder = null;
    this.holderName = null;
    this.notifyChange('RESET');
  }

  notifyChange(action, callerId = null, targetName = null) {
    if (typeof this.onChange === 'function') {
      this.onChange({
        name: this.name,
        locked: this.locked,
        value: this.value,
        holder: this.holder,
        holderName: this.holderName,
        queueLength: this.queue.length,
        waitingActors: this.queue.map((q) => ({ id: q.threadId, name: q.name })),
        action,
        callerId,
        targetName
      });
    }
  }
}

window.Semaphore = Semaphore;
window.Mutex = Mutex;
