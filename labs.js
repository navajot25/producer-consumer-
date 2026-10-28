// labs.js - Interactive Demonstration Labs for Race Conditions and Deadlocks

class SimulationLabs {
  constructor(sim) {
    this.sim = sim;
    this.isLabRunning = false;
  }

  sleep(ms = 800) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // =========================================================================
  // 1. RACE CONDITION LAB
  // =========================================================================
  async runRaceConditionLab(mode = 'unsynchronized') {
    if (this.isLabRunning) return;
    this.isLabRunning = true;

    const rohanCard = document.getElementById('race-driver-rohan');
    const nehaCard = document.getElementById('race-driver-neha');
    const rideCard = document.getElementById('race-target-ride');
    const lockBox = document.getElementById('race-lock-box');
    const lockIcon = document.getElementById('race-lock-icon');
    const lockText = document.getElementById('race-lock-text');
    const timeline = document.getElementById('race-timeline');
    const outcomeBox = document.getElementById('race-outcome-box');
    const rohanStatus = document.getElementById('rohan-status');
    const nehaStatus = document.getElementById('neha-status');
    const rideStatus = document.getElementById('race-ride-status');

    // Reset Elements
    rohanCard.className = 'race-driver-box';
    nehaCard.className = 'race-driver-box';
    rideCard.className = 'race-ride-card';
    rohanStatus.textContent = 'Approaching queue...';
    nehaStatus.textContent = 'Approaching queue...';
    rideStatus.textContent = 'Waiting in Queue';
    lockBox.className = 'race-lock-indicator';
    lockIcon.textContent = '🔓';
    lockText.textContent = 'Queue Unlocked';
    timeline.innerHTML = '';
    outcomeBox.className = 'race-outcome-box hidden';

    const addStep = (text, className = '') => {
      const item = document.createElement('div');
      item.className = `race-timeline-item ${className}`;
      item.textContent = text;
      timeline.appendChild(item);
      timeline.scrollTop = timeline.scrollHeight;
    };

    if (mode === 'unsynchronized') {
      // -----------------------------------------------------
      // WITHOUT MUTEX (RACE CONDITION)
      // -----------------------------------------------------
      addStep('1. Rohan checks the queue and sees Ride #101.', 'highlight-step');
      rohanCard.classList.add('active-access');
      rohanStatus.textContent = 'Reading Ride #101...';
      window.soundEffects.playRequest();
      await this.sleep(800);

      addStep('2. Neha checks the queue at the SAME time and ALSO sees Ride #101.', 'highlight-step');
      nehaCard.classList.add('active-access');
      nehaStatus.textContent = 'Reading Ride #101...';
      window.soundEffects.playRequest();
      await this.sleep(900);

      addStep('3. ⚠️ No Mutex lock was acquired! Both drivers attempt to accept the same ride.', 'conflict-step');
      window.soundEffects.playWarning();
      await this.sleep(900);

      rohanStatus.innerHTML = '❌ Accepted Ride #101';
      rohanCard.classList.add('conflict-box');
      addStep('❌ Rohan accepted Ride #101', 'conflict-step');
      await this.sleep(600);

      nehaStatus.innerHTML = '❌ Also accepted Ride #101';
      nehaCard.classList.add('conflict-box');
      addStep('❌ Neha also accepted Ride #101', 'conflict-step');
      window.soundEffects.playWarning();

      rideCard.classList.add('corrupted');
      rideStatus.textContent = '💥 Double Booked!';

      outcomeBox.className = 'race-outcome-box error';
      outcomeBox.innerHTML = `
        <strong>🚨 Race Condition Detected!</strong><br/>
        Two drivers accessed the same request at the same time without mutual exclusion. Both perceived the ride as available and dispatched duplicate bookings.
      `;
      this.sim.logActivity('SYSTEM', 'Race Condition simulated: Double booking of Ride #101 occurred without Mutex.');

    } else {
      // -----------------------------------------------------
      // WITH MUTEX (SYNCHRONIZED)
      // -----------------------------------------------------
      addStep('1. Rohan arrives first and locks the queue 🔒', 'highlight-step');
      rohanCard.classList.add('active-access');
      rohanStatus.textContent = 'Acquiring Lock...';
      lockIcon.textContent = '🔒';
      lockText.textContent = 'Queue Locked by Rohan';
      lockBox.style.color = 'var(--amber-warning)';
      window.soundEffects.playLock();
      await this.sleep(900);

      rohanStatus.textContent = 'Accepted Ride #101';
      rideStatus.textContent = 'Taken by Rohan';
      addStep('2. Rohan accepts Aarav\'s ride (#101) and removes it from the queue.', 'highlight-step');
      window.soundEffects.playAccept();
      await this.sleep(900);

      addStep('3. Rohan unlocks the queue 🔓', 'highlight-step');
      lockIcon.textContent = '🔓';
      lockText.textContent = 'Queue Unlocked';
      lockBox.style.color = 'var(--driver-green)';
      rohanCard.classList.remove('active-access');
      rohanStatus.textContent = '✅ Ride in Progress';
      window.soundEffects.playUnlock();
      await this.sleep(800);

      addStep('4. Neha checks the queue. Ride #101 is already gone.', 'highlight-step');
      nehaCard.classList.add('active-access');
      nehaStatus.textContent = 'Queue is empty / Ride taken';
      rideCard.innerHTML = '<div class="ride-card-badge">SLOT #01</div><div class="ride-card-name" style="color: var(--text-muted); font-weight: normal;">(Empty)</div><div class="ride-card-route">Ride fulfilled</div>';
      await this.sleep(800);

      nehaStatus.textContent = '⏳ Waiting for next ride';
      nehaCard.classList.remove('active-access');
      addStep('5. Neha waits safely without causing conflicts.', 'highlight-step');

      outcomeBox.className = 'race-outcome-box success';
      outcomeBox.innerHTML = `
        <strong>🛡️ Mutex Protected the Queue!</strong><br/>
        With the Mutex lock, Rohan claimed the ride first. Neha safely saw that the ride was already gone and avoided a double-booking bug.
      `;
      this.sim.logActivity('SYSTEM', 'Synchronized access: Mutex prevented race condition between Rohan and Neha.');
    }

    this.isLabRunning = false;
  }

  // =========================================================================
  // 2. DEADLOCK LAB
  // =========================================================================
  async runDeadlockLab(mode = 'incorrect') {
    if (this.isLabRunning) return;
    this.isLabRunning = true;

    const riderCard = document.getElementById('dl-rider-card');
    const driverCard = document.getElementById('dl-driver-card');
    const queueCard = document.getElementById('dl-queue-card');
    const riderStatus = document.getElementById('dl-rider-status');
    const driverStatus = document.getElementById('dl-driver-status');
    const lockPill = document.getElementById('dl-lock-pill');
    const timeline = document.getElementById('dl-timeline');
    const outcomeBox = document.getElementById('dl-outcome-box');

    // Reset Elements
    timeline.innerHTML = '';
    outcomeBox.className = 'race-outcome-box hidden';
    riderStatus.textContent = 'Ready';
    driverStatus.textContent = 'Ready';
    lockPill.textContent = '🔓 Mutex Unlocked';
    lockPill.style.color = 'var(--text-secondary)';

    const addStep = (text, className = '') => {
      const item = document.createElement('div');
      item.className = `race-timeline-item ${className}`;
      item.textContent = text;
      timeline.appendChild(item);
      timeline.scrollTop = timeline.scrollHeight;
    };

    if (mode === 'incorrect') {
      // -----------------------------------------------------
      // WRONG ORDER: wait(mutex) BEFORE wait(empty)
      // -----------------------------------------------------
      addStep('1. Rider Aarav locks the queue first: wait(mutex) 🔒', 'highlight-step');
      riderStatus.textContent = 'Holds Mutex Lock 🔒';
      lockPill.textContent = '🔒 Locked by Rider';
      lockPill.style.color = 'var(--amber-warning)';
      window.soundEffects.playLock();
      await this.sleep(900);

      addStep('2. Queue is full (empty = 0). Rider calls wait(empty) and SLEEPS holding the lock! 💤', 'conflict-step');
      riderStatus.textContent = '💤 Sleeping (Holding Lock)';
      await this.sleep(1000);

      addStep('3. Driver Rohan arrives to accept a ride and calls wait(mutex) to access queue.', 'highlight-step');
      driverStatus.textContent = 'Blocked on wait(mutex) 🛑';
      window.soundEffects.playWarning();
      await this.sleep(1000);

      addStep('4. 💀 CIRCULAR WAIT: Rider is waiting for space. Driver is waiting for the lock. Nobody can move!', 'conflict-step');
      window.soundEffects.playDeadlock();

      outcomeBox.className = 'race-outcome-box error';
      outcomeBox.innerHTML = `
        <strong>💀 DEADLOCK OCCURRED!</strong><br/>
        Because the Rider locked the queue before checking for space, it went to sleep holding the lock. The Driver cannot unlock or remove a ride. Both threads are frozen forever.
      `;
      this.sim.logActivity('SYSTEM', 'Deadlock simulated: wait(mutex) executed before wait(empty) on full buffer.');

    } else {
      // -----------------------------------------------------
      // CORRECT ORDER: wait(empty) BEFORE wait(mutex)
      // -----------------------------------------------------
      addStep('1. Rider checks for space first: wait(empty)', 'highlight-step');
      riderStatus.textContent = 'wait(empty): Queue is full, sleeping WITHOUT lock';
      await this.sleep(900);

      addStep('2. Driver Rohan arrives to take a ride: wait(full) & wait(mutex)', 'highlight-step');
      driverStatus.textContent = 'Holds Mutex Lock 🔒';
      lockPill.textContent = '🔒 Locked by Driver';
      lockPill.style.color = 'var(--driver-green)';
      window.soundEffects.playLock();
      await this.sleep(900);

      addStep('3. Driver removes one ride and signals signal(empty) 🔓', 'highlight-step');
      driverStatus.textContent = '✅ Ride Accepted';
      lockPill.textContent = '🔓 Mutex Unlocked';
      lockPill.style.color = 'var(--driver-green)';
      window.soundEffects.playAccept();
      window.soundEffects.playUnlock();
      await this.sleep(900);

      addStep('4. signal(empty) wakes up Rider Aarav! Aarav safely locks queue and books his ride 🎉', 'highlight-step');
      riderStatus.textContent = '✅ Request Added Successfully';

      outcomeBox.className = 'race-outcome-box success';
      outcomeBox.innerHTML = `
        <strong>🛡️ Deadlock Prevented! (Correct Order)</strong><br/>
        <strong>Golden Rule:</strong> Always check if space is available (<code>wait(empty)</code>) BEFORE locking the queue (<code>wait(mutex)</code>).
      `;
      this.sim.logActivity('SYSTEM', 'Deadlock prevented by wait(empty) -> wait(mutex) order.');
    }

    this.isLabRunning = false;
  }
}

window.SimulationLabs = SimulationLabs;
