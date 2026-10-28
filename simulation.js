// simulation.js - Core Discrete Event OS Engine for RideSync
// Seamlessly couples genuine Producer-Consumer Bounded Buffer logic with realistic Uber/Ola dispatch mechanics

class RideSyncSimulation {
  constructor(options = {}) {
    this.bufferSize = options.bufferSize || 5;
    this.speed = options.speed || 'normal'; // 'slow' | 'normal' | 'fast'
    this.isPaused = false;
    this.stepMode = false;
    this.currentStepAction = null; // Used by step mode
    this.stepPromiseResolver = null;
    this.autoInterval = null;

    // Realistic Cities & Landmarks
    this.locations = [
      'Airport T2',
      'Tech Park',
      'City Center',
      'Metro Station',
      'College Road',
      'Railway Station',
      'MG Road',
      'Residency Road',
      'Central Hospital'
    ];

    // Realistic Human Profiles
    this.riderProfiles = [
      { name: 'Aarav Sharma', rating: '4.95', avatar: '👨‍💼', phone: '+91 98765 43210' },
      { name: 'Priya Patel', rating: '4.92', avatar: '👩‍💻', phone: '+91 98123 45678' },
      { name: 'Rahul Sen', rating: '4.88', avatar: '👨‍🎓', phone: '+91 97654 32109' },
      { name: 'Sneha Rao', rating: '4.97', avatar: '👩‍⚕️', phone: '+91 99001 12233' },
      { name: 'Vikram Malhotra', rating: '4.91', avatar: '👨‍💼', phone: '+91 98450 98765' },
      { name: 'Ananya Iyer', rating: '4.96', avatar: '👩‍🎨', phone: '+91 97312 34567' },
      { name: 'Kabir Sen', rating: '4.89', avatar: '👨‍🔬', phone: '+91 98200 54321' },
      { name: 'Meera Reddy', rating: '4.94', avatar: '👩‍💼', phone: '+91 99455 67890' }
    ];

    this.driverProfiles = [
      { name: 'Amit Kumar', car: 'White Swift Dzire', plate: 'KA-01-AB-1234', rating: '4.92', vehicleType: 'ubergo', trips: 1420, avatar: '👨‍✈️' },
      { name: 'Rohan Verma', car: 'Silver Hyundai Aura', plate: 'KA-05-XY-8821', rating: '4.88', vehicleType: 'sedan', trips: 980, avatar: '👨‍✈️' },
      { name: 'Neha Sharma', car: 'Bajaj RE Auto', plate: 'MH-02-CD-5432', rating: '4.97', vehicleType: 'auto', trips: 2150, avatar: '👩‍✈️' },
      { name: 'Vikram Singh', car: 'Black Ertiga XL', plate: 'KA-01-ER-7744', rating: '4.95', vehicleType: 'xl', trips: 3200, avatar: '👨‍✈️' },
      { name: 'Deepak Joshi', car: 'Bajaj Pulsar 150', plate: 'KA-03-MN-3312', rating: '4.89', vehicleType: 'moto', trips: 840, avatar: '👨‍✈️' },
      { name: 'Manoj Singh', car: 'Honda City Prime', plate: 'DL-04-GH-9911', rating: '4.91', vehicleType: 'premier', trips: 1650, avatar: '👨‍✈️' },
      { name: 'Sunil Shetty', car: 'WagonR CNG', plate: 'KA-04-PQ-5522', rating: '4.86', vehicleType: 'ubergo', trips: 1120, avatar: '👨‍✈️' },
      { name: 'Kiran Rao', car: 'TVS King Deluxe', plate: 'KA-02-JJ-7788', rating: '4.94', vehicleType: 'auto', trips: 1890, avatar: '👨‍✈️' }
    ];

    this.vehicleClasses = {
      moto: { name: 'Uber Moto', icon: '🛵', baseFare: 40, perKm: 10, eta: '2 mins away', capacity: 1, desc: 'Quick bike taxi to beat traffic' },
      auto: { name: 'Uber Auto', icon: '🛺', baseFare: 50, perKm: 14, eta: '3 mins away', capacity: 3, desc: 'No bargaining, doorstep pickup' },
      ubergo: { name: 'Uber Go', icon: '🚗', baseFare: 70, perKm: 18, eta: '4 mins away', capacity: 4, desc: 'Affordable, compact AC rides' },
      sedan: { name: 'Go Sedan', icon: '🚙', baseFare: 90, perKm: 22, eta: '4 mins away', capacity: 4, desc: 'Comfortable sedans with top drivers' },
      premier: { name: 'Uber Premier', icon: '🚘', baseFare: 120, perKm: 28, eta: '5 mins away', capacity: 4, desc: 'Premium comfort and executive cars' },
      xl: { name: 'Uber XL', icon: '🚐', baseFare: 160, perKm: 34, eta: '6 mins away', capacity: 6, desc: 'Spacious SUVs with extra legroom' }
    };

    // Statistics & Live Telemetry
    this.stats = {
      totalRequests: 0,
      completedRides: 0,
      waitingRiders: 0,
      waitingDrivers: 0,
      totalEarnings: 0
    };

    // Counters
    this.rideIdCounter = 101;
    this.riderSeq = 1;
    this.driverSeq = 1;

    // Shared Bounded Buffer Array
    this.buffer = new Array(this.bufferSize).fill(null);

    // Active visual actors
    this.activeRider = null;
    this.activeDriver = null;
    this.activeTrip = null; // Recently matched trip for tracking sheet

    // Blocked queues for UI rendering
    this.waitingRidersList = []; // [{ id, name, pickup, dest, rideId, fare, vehicleIcon }]
    this.waitingDriversList = []; // [{ id, name, car, rating }]

    // Event listeners
    this.listeners = {
      onStateChange: [],
      onExplanation: [],
      onActivity: [],
      onStepUpdate: [],
      onTripMatched: []
    };

    // Initialize Semaphores
    this.initPrimitives();
  }

  initPrimitives() {
    this.empty = new Semaphore('empty', this.bufferSize, (e) => this.handleSemaphoreChange(e));
    this.full = new Semaphore('full', 0, (e) => this.handleSemaphoreChange(e));
    this.mutex = new Mutex('mutex', (e) => this.handleMutexChange(e));
  }

  // Event Subscription helper
  subscribe(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  explain(message, icon = '💡', tag = "WHAT'S HAPPENING?") {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.emit('onExplanation', {
      message,
      icon,
      tag,
      time: timeStr
    });
  }

  logActivity(category, message) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.emit('onActivity', {
      timestamp: timeStr,
      category, // 'RIDER' | 'DRIVER' | 'SYSTEM'
      message
    });
  }

  getStepDelay() {
    if (this.speed === 'slow') return 1600;
    if (this.speed === 'fast') return 350;
    return 800; // normal
  }

  async sleep(ms = this.getStepDelay()) {
    // If Step Mode is enabled, wait for manual user trigger
    if (this.stepMode) {
      return new Promise((resolve) => {
        this.stepPromiseResolver = resolve;
      });
    }

    return new Promise((resolve) => {
      const check = () => {
        if (!this.isPaused) {
          setTimeout(resolve, ms);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  nextStep() {
    if (this.stepPromiseResolver) {
      const resolver = this.stepPromiseResolver;
      this.stepPromiseResolver = null;
      resolver();
    }
  }

  cancelStepModeAction() {
    if (this.stepPromiseResolver) {
      const resolver = this.stepPromiseResolver;
      this.stepPromiseResolver = null;
      resolver(false);
    }
    this.currentStepAction = null;
    this.notifyStepUpdate(0, 0, 'Cancelled');
  }

  setStepMode(enabled) {
    this.stepMode = enabled;
    if (enabled && this.isAutoRunning()) {
      this.stopAutoSimulation();
    }
    this.notifyState();
  }

  notifyStepUpdate(current, total, label) {
    this.emit('onStepUpdate', {
      current,
      total,
      label,
      active: this.stepMode
    });
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  setBufferSize(newSize) {
    if (newSize < 3 || newSize > 10) return;
    this.bufferSize = newSize;
    this.buffer = new Array(this.bufferSize).fill(null);
    this.initPrimitives();
    this.waitingRidersList = [];
    this.waitingDriversList = [];
    this.activeRider = null;
    this.activeDriver = null;

    this.explain(`Dispatch Queue capacity resized to ${newSize} slots. EMPTY = ${newSize}, FULL = 0, MUTEX = UNLOCKED.`, '⚙️', 'CONFIGURATION');
    this.logActivity('SYSTEM', `Dispatch Queue capacity configured to ${newSize} slots.`);
    this.notifyState();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.explain(this.isPaused ? 'Simulation paused.' : 'Simulation resumed.', this.isPaused ? '⏸' : '▶', 'STATUS');
    this.notifyState();
    return this.isPaused;
  }

  handleSemaphoreChange() {
    this.stats.waitingRiders = this.empty.queue.length;
    this.stats.waitingDrivers = this.full.queue.length;
    this.notifyState();
  }

  handleMutexChange() {
    this.notifyState();
  }

  notifyState() {
    const occupiedCount = this.buffer.filter(Boolean).length;

    this.emit('onStateChange', {
      buffer: [...this.buffer],
      bufferSize: this.bufferSize,
      emptyCount: this.empty.value,
      fullCount: this.full.value,
      mutexLocked: this.mutex.locked,
      mutexHolder: this.mutex.holderName || this.mutex.holder,
      waitingRiders: this.waitingRidersList,
      waitingDrivers: this.waitingDriversList,
      activeRider: this.activeRider,
      activeDriver: this.activeDriver,
      activeTrip: this.activeTrip,
      stats: {
        totalRequests: this.stats.totalRequests,
        completedRides: this.stats.completedRides,
        totalEarnings: this.stats.totalEarnings,
        occupiedCount
      },
      isPaused: this.isPaused,
      speed: this.speed,
      stepMode: this.stepMode
    });
  }

  generateRideData(customOptions = {}) {
    const profile = customOptions.riderProfile || this.riderProfiles[Math.floor(Math.random() * this.riderProfiles.length)];
    const rideId = `RIDE-${this.rideIdCounter++}`;
    const vType = customOptions.vehicleType || 'ubergo';
    const vInfo = this.vehicleClasses[vType] || this.vehicleClasses.ubergo;

    let loc1 = customOptions.pickup || this.locations[Math.floor(Math.random() * this.locations.length)];
    let loc2 = customOptions.destination || this.locations[Math.floor(Math.random() * this.locations.length)];
    while (loc2 === loc1) {
      loc2 = this.locations[Math.floor(Math.random() * this.locations.length)];
    }

    const estDistance = (2.5 + Math.random() * 8.5).toFixed(1);
    const estFare = Math.round(vInfo.baseFare + parseFloat(estDistance) * vInfo.perKm);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    return {
      rideId,
      riderName: profile.name,
      riderRating: profile.rating,
      riderAvatar: profile.avatar,
      riderPhone: profile.phone,
      pickup: loc1,
      destination: loc2,
      vehicleType: vType,
      vehicleName: vInfo.name,
      vehicleIcon: vInfo.icon,
      fare: estFare,
      distance: `${estDistance} km`,
      otp,
      paymentMethod: customOptions.paymentMethod || 'UPI (Google Pay)',
      status: 'Waiting in Dispatch Buffer',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // =========================================================================
  // PRODUCER: BOOK A RIDE (Rider Enqueues Request)
  // =========================================================================
  async produceRide(customData = null) {
    const ride = customData ? { ...this.generateRideData(customData), ...customData } : this.generateRideData();
    const riderThreadId = `T_RIDER_${Date.now()}`;
    this.stats.totalRequests++;

    // 1. Show rider initiating request
    this.activeRider = {
      name: ride.riderName,
      rideId: ride.rideId,
      vehicleIcon: ride.vehicleIcon,
      fare: ride.fare,
      route: `${ride.pickup} → ${ride.destination}`,
      status: `${ride.riderName} is requesting an ${ride.vehicleName}...`
    };
    this.notifyState();

    this.logActivity('RIDER', `${ride.riderName} requested ${ride.vehicleIcon} ${ride.vehicleName} (${ride.pickup} → ${ride.destination}, ₹${ride.fare}).`);


    // Check if buffer is full BEFORE wait
    const isBufferFull = this.empty.value === 0;

    if (isBufferFull) {
      this.explain(
        `Cloud Dispatch Buffer is FULL (${this.bufferSize}/${this.bufferSize} slots occupied). <strong>${ride.riderName}</strong> must wait on <code>wait(empty)</code> until a driver accepts a ride.`,
        '⏳',
        'DISPATCH BUFFER FULL'
      );
      this.activeRider.status = `${ride.riderName} is waiting for available queue slot...`;
      this.waitingRidersList.push({
        id: riderThreadId,
        name: ride.riderName,
        rideId: ride.rideId,
        pickup: ride.pickup,
        destination: ride.destination,
        fare: ride.fare,
        vehicleIcon: ride.vehicleIcon
      });
      this.logActivity('RIDER', `${ride.riderName} blocked on wait(empty) – Dispatch queue full.`);
      this.notifyState();
      window.soundEffects.playWarning();
    } else {
      this.explain(
        `<strong>${ride.riderName}</strong> wants to book ${ride.vehicleName}. Free slots available (EMPTY = ${this.empty.value}). Checking synchronization locks.`,
        '👤',
        'PRODUCER (RIDER REQUEST)'
      );
    }

    // STEP 1: wait(empty)
    this.notifyStepUpdate(1, 6, `Step 1: ${ride.riderName} executes wait(empty) to ensure buffer has space`);
    await this.sleep();

    // Block on counting semaphore if full
    await this.empty.wait(riderThreadId, ride.riderName);

    // Unblocked or space was available! Remove from waiting line if was waiting
    this.waitingRidersList = this.waitingRidersList.filter((r) => r.id !== riderThreadId);
    this.activeRider.status = `${ride.riderName} acquiring Mutex lock for dispatch buffer...`;
    this.notifyState();

    // STEP 2: Check EMPTY status
    this.notifyStepUpdate(2, 6, `Step 2: Buffer space reserved (empty = ${this.empty.value})`);
    await this.sleep();

    // STEP 3: Lock queue wait(mutex)
    this.notifyStepUpdate(3, 6, `Step 3: Acquiring exclusive queue Mutex - wait(mutex)`);
    this.explain(`Rider thread acquired Mutex. Critical section locked against race conditions.`, '🔒', 'MUTEX LOCK ACQUIRED');
    await this.sleep();

    await this.mutex.wait(riderThreadId, `${ride.riderName}'s booking`);
    window.soundEffects.playLock();
    this.notifyState();

    // STEP 4: Insert ride card into bounded buffer slot
    this.notifyStepUpdate(4, 6, `Step 4: Writing ${ride.rideId} into first available bounded buffer slot`);
    await this.sleep();

    const emptySlotIndex = this.buffer.findIndex((slot) => slot === null);
    if (emptySlotIndex !== -1) {
      this.buffer[emptySlotIndex] = {
        ...ride,
        slotIndex: emptySlotIndex
      };
      this.activeRider.status = `Ride request broadcasted to dispatch cloud!`;
      this.explain(`Ride request #${ride.rideId} placed into slot #${String(emptySlotIndex + 1).padStart(2, '0')}.`, '✅', 'DISPATCH ENQUEUED');
      this.logActivity('RIDER', `${ride.rideId} (${ride.riderName}) entered queue at slot #${String(emptySlotIndex + 1).padStart(2, '0')}.`);
      window.soundEffects.playRequest();
    }
    this.notifyState();
    await this.sleep();

    // STEP 5: Unlock queue signal(mutex)
    this.notifyStepUpdate(5, 6, `Step 5: Releasing Queue Mutex - signal(mutex)`);
    this.mutex.signal(riderThreadId);
    window.soundEffects.playUnlock();
    this.notifyState();
    await this.sleep();

    // STEP 6: signal(full)
    this.notifyStepUpdate(6, 6, `Step 6: Notifying waiting drivers - signal(full) (full = ${this.full.value + 1})`);
    this.full.signal(riderThreadId);
    this.notifyState();
    await this.sleep();

    // Finish visual
    this.notifyStepUpdate(0, 0, 'Completed');
    setTimeout(() => {
      this.activeRider = null;
      this.notifyState();
    }, 1200);

    return ride;
  }

  // =========================================================================
  // CONSUMER: FIND / ACCEPT A RIDE (Driver Dequeues Request)
  // =========================================================================
  async consumeRide(customDriver = null) {
    let driver = customDriver;
    if (!driver) {
      driver = this.driverProfiles[Math.floor(Math.random() * this.driverProfiles.length)];
    } else if (typeof driver === 'string') {
      driver = this.driverProfiles.find((d) => d.name === customDriver) || { name: customDriver, car: 'Swift Dzire', plate: 'KA-01-AB-1234', rating: '4.90' };
    }

    const driverThreadId = `T_DRIVER_${Date.now()}`;

    // 1. Show driver approaching
    this.activeDriver = {
      name: driver.name,
      car: driver.car,
      plate: driver.plate,
      rating: driver.rating,
      status: `${driver.name} is searching for incoming ride offers...`
    };
    this.notifyState();

    // Check if buffer is empty BEFORE wait
    const isBufferEmpty = this.full.value === 0;

    if (isBufferEmpty) {
      this.explain(
        `There are NO pending ride requests in the queue (FULL = 0). <strong>${driver.name}</strong> must wait on <code>wait(full)</code> until a rider requests a trip.`,
        '🚖',
        'DISPATCH BUFFER EMPTY'
      );
      this.activeDriver.status = `${driver.name} is waiting on stand-by...`;
      this.waitingDriversList.push({
        id: driverThreadId,
        name: driver.name,
        car: driver.car,
        plate: driver.plate,
        rating: driver.rating
      });
      this.logActivity('DRIVER', `${driver.name} blocked on wait(full) – Queue is empty.`);
      this.notifyState();
      window.soundEffects.playWarning();
    } else {
      this.explain(
        `<strong>${driver.name}</strong> received a dispatch offer from the queue. Attempting to accept ride.`,
        '🚖',
        'CONSUMER (DRIVER DISPATCH)'
      );
    }

    // STEP 1: wait(full)
    this.notifyStepUpdate(1, 6, `Step 1: ${driver.name} executes wait(full) to check for pending requests`);
    await this.sleep();

    // Block on counting semaphore if buffer empty
    await this.full.wait(driverThreadId, driver.name);

    // Unblocked or ride was available!
    this.waitingDriversList = this.waitingDriversList.filter((d) => d.id !== driverThreadId);
    this.activeDriver.status = `${driver.name} locking Mutex to safely claim ride...`;
    this.notifyState();

    // STEP 2: Check FULL status
    this.notifyStepUpdate(2, 6, `Step 2: Request claimed from queue (full = ${this.full.value})`);
    await this.sleep();

    // STEP 3: Lock queue wait(mutex)
    this.notifyStepUpdate(3, 6, `Step 3: Acquiring exclusive queue lock - wait(mutex)`);
    this.explain(`Driver thread locked Mutex to prevent another driver from claiming the same ride.`, '🔒', 'MUTEX LOCK ACQUIRED');
    await this.sleep();

    await this.mutex.wait(driverThreadId, `${driver.name}'s acceptance`);
    window.soundEffects.playLock();
    this.notifyState();

    // STEP 4: Remove oldest ride from buffer (FIFO order)
    this.notifyStepUpdate(4, 6, `Step 4: Removing oldest ride ticket from dispatch buffer`);
    await this.sleep();

    let oldestSlotIndex = -1;
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] !== null) {
        oldestSlotIndex = i;
        break;
      }
    }

    let takenRide = null;
    if (oldestSlotIndex !== -1) {
      takenRide = this.buffer[oldestSlotIndex];
      this.buffer[oldestSlotIndex] = null;
      this.stats.completedRides++;
      this.stats.totalEarnings += takenRide.fare;

      this.activeDriver.status = `${driver.name} accepted ${takenRide.riderName}'s trip!`;
      this.activeTrip = {
        ...takenRide,
        driverName: driver.name,
        driverCar: driver.car,
        driverPlate: driver.plate,
        driverRating: driver.rating,
        matchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      this.explain(
        `🎉 <strong>${driver.name}</strong> accepted <strong>${takenRide.riderName}'s</strong> ride (#${takenRide.rideId})! PIN: <strong>${takenRide.otp}</strong>. Fare: ₹${takenRide.fare}. Slot #${String(oldestSlotIndex + 1).padStart(2, '0')} is now free.`,
        '🎉',
        'RIDE MATCHED & DISPATCHED'
      );
      this.logActivity('DRIVER', `${driver.name} (${driver.car}) accepted ${takenRide.rideId} for ${takenRide.riderName} (₹${takenRide.fare}).`);
      this.logActivity('SYSTEM', `Slot #${String(oldestSlotIndex + 1).padStart(2, '0')} freed in dispatch buffer.`);

      window.soundEffects.playAccept();


      this.emit('onTripMatched', this.activeTrip);
    }
    this.notifyState();
    await this.sleep();

    // STEP 5: Unlock queue signal(mutex)
    this.notifyStepUpdate(5, 6, `Step 5: Releasing Queue Mutex - signal(mutex)`);
    this.mutex.signal(driverThreadId);
    window.soundEffects.playUnlock();
    this.notifyState();
    await this.sleep();

    // STEP 6: signal(empty)
    this.notifyStepUpdate(6, 6, `Step 6: Signaled empty slot available - signal(empty) (empty = ${this.empty.value + 1})`);
    this.empty.signal(driverThreadId);
    this.notifyState();
    await this.sleep();

    // Finish visual
    this.notifyStepUpdate(0, 0, 'Completed');
    setTimeout(() => {
      this.activeDriver = null;
      this.notifyState();
    }, 1400);

    return takenRide;
  }

  // =========================================================================
  // AUTO LIVE SIMULATION
  // =========================================================================
  startAutoSimulation() {
    if (this.autoInterval) return;
    this.stepMode = false;
    this.explain(
      'Live Uber dispatch running. Riders and drivers are synchronizing in real time across the Bounded Buffer.',
      '⚡',
      'LIVE DISPATCH SIMULATION'
    );
    this.logActivity('SYSTEM', 'Automatic live city dispatch simulation started.');

    this.autoInterval = setInterval(() => {
      if (this.isPaused) return;

      const randomChoice = Math.random();
      // Slight bias toward booking to build realistic buffer occupancy
      if (randomChoice < 0.54) {
        this.produceRide();
      } else {
        this.consumeRide();
      }
    }, this.getAutoIntervalTime());

    this.notifyState();
  }

  stopAutoSimulation() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
      this.explain('Live dispatch simulation paused.', '⏹', 'SIMULATION STOPPED');
      this.logActivity('SYSTEM', 'Live dispatch simulation stopped.');
      this.notifyState();
    }
  }

  isAutoRunning() {
    return this.autoInterval !== null;
  }

  getAutoIntervalTime() {
    if (this.speed === 'slow') return 2800;
    if (this.speed === 'fast') return 750;
    return 1600;
  }

  // =========================================================================
  // RESET
  // =========================================================================
  reset() {
    this.stopAutoSimulation();
    this.isPaused = false;
    this.stepMode = false;
    this.buffer = new Array(this.bufferSize).fill(null);
    this.initPrimitives();
    this.waitingRidersList = [];
    this.waitingDriversList = [];
    this.activeRider = null;
    this.activeDriver = null;
    this.activeTrip = null;

    this.stats = {
      totalRequests: 0,
      completedRides: 0,
      waitingRiders: 0,
      waitingDrivers: 0,
      totalEarnings: 0
    };

    this.explain(
      `System reset. Dispatch queue initialized with ${this.bufferSize} free slots. Mutex unlocked.`,
      '🔄',
      'SYSTEM RESET'
    );
    this.logActivity('SYSTEM', 'Simulation reset to clean initial state.');
    this.notifyState();
  }
}

window.RideSyncSimulation = RideSyncSimulation;
