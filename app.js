// app.js - Uber Web Dashboard Controller & OS Synchronization Engine
// Binds the authentic Uber.com/ride UI with the Producer-Consumer Bounded Buffer Simulation

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Simulation Engine & Labs
  const sim = new RideSyncSimulation({ bufferSize: 5, speed: 'normal' });
  const labs = new SimulationLabs(sim);

  // Cached DOM Elements
  const dom = {
    // Navigation & Top Toggles
    navItems: document.querySelectorAll('.nav-item'),
    cityBadge: document.getElementById('city-badge'),
    currentCityLabel: document.getElementById('current-city-label'),
    btnRaceDemo: document.getElementById('btn-race-demo'),
    btnDeadlockDemo: document.getElementById('btn-deadlock-demo'),
    btnStepMode: document.getElementById('btn-step-mode'),
    stepModeStatus: document.getElementById('step-mode-status'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundIcon: document.getElementById('sound-icon'),

    // Views
    mainBookingView: document.getElementById('main-booking-view'),
    tabGuideView: document.getElementById('tab-guide-view'),

    // Control Bar
    btnAutoSim: document.getElementById('btn-auto-sim'),
    autoBtnText: document.getElementById('auto-btn-text'),
    btnPauseSim: document.getElementById('btn-pause-sim'),
    pauseIcon: document.getElementById('pause-icon'),
    pauseText: document.getElementById('pause-text'),
    btnResetSim: document.getElementById('btn-reset-sim'),
    capButtons: document.querySelectorAll('.seg-btn[data-cap]'),
    speedButtons: document.querySelectorAll('.seg-btn[data-speed]'),

    // Step Mode Banner
    stepModeBanner: document.getElementById('step-mode-banner'),
    stepGuideText: document.getElementById('step-guide-text'),
    stepCounterLabel: document.getElementById('step-counter-label'),
    btnNextStep: document.getElementById('btn-next-step'),
    btnCancelStep: document.getElementById('btn-cancel-step'),

    // "What's happening?" Panel
    explanationCard: document.getElementById('explanation-card'),
    explanationIcon: document.getElementById('explanation-icon'),
    explanationTag: document.getElementById('explanation-tag'),
    explanationTime: document.getElementById('explanation-time'),
    explanationText: document.getElementById('explanation-text'),

    // Rider Booking Card (Left)
    catTabs: document.querySelectorAll('.cat-tab'),
    riderProfileSelect: document.getElementById('rider-profile-select'),
    pickupInput: document.getElementById('pickup-input'),
    destinationInput: document.getElementById('destination-input'),
    btnSwapLocations: document.getElementById('btn-swap-locations'),
    uberChips: document.querySelectorAll('.uber-chip'),
    productCards: document.querySelectorAll('.uber-product-card'),
    paymentMethodSelect: document.getElementById('payment-method-select'),
    btnBookRide: document.getElementById('btn-book-ride'),
    bookingCtaText: document.getElementById('booking-cta-text'),

    // Rider State
    riderIdlePlaceholder: document.getElementById('rider-idle-placeholder'),
    activeRiderCard: document.getElementById('active-rider-card'),
    waitingRidersBadge: document.getElementById('waiting-riders-badge'),
    waitingRidersLane: document.getElementById('waiting-riders-lane'),

    // Driver Partner (Right)
    driverProfileSelect: document.getElementById('driver-profile-select'),
    driverPayoutText: document.getElementById('driver-payout-text'),
    incomingOffersBox: document.getElementById('incoming-offers-box'),
    offerEmptyState: document.getElementById('offer-empty-state'),
    offerActiveState: document.getElementById('offer-active-state'),
    btnFindRide: document.getElementById('btn-find-ride'),
    driverIdlePlaceholder: document.getElementById('driver-idle-placeholder'),
    activeDriverCard: document.getElementById('active-driver-card'),
    waitingDriversBadge: document.getElementById('waiting-drivers-badge'),
    waitingDriversLane: document.getElementById('waiting-drivers-lane'),

    // Bounded Buffer Section (Center)
    queueOccupancyTag: document.getElementById('queue-occupancy-tag'),
    mutexBanner: document.getElementById('mutex-banner'),
    mutexIcon: document.getElementById('mutex-icon'),
    mutexHeadline: document.getElementById('mutex-headline'),
    mutexSubline: document.getElementById('mutex-subline'),
    physicalQueueBoard: document.getElementById('physical-queue-board'),
    queueMeterBar: document.getElementById('queue-meter-bar'),

    // OS Semaphores Cards
    valEmpty: document.getElementById('val-empty'),
    descEmpty: document.getElementById('desc-empty'),
    valFull: document.getElementById('val-full'),
    descFull: document.getElementById('desc-full'),
    valMutex: document.getElementById('val-mutex'),
    descMutex: document.getElementById('desc-mutex'),
    cardMutexSem: document.getElementById('card-mutex-sem'),

    // Activity Feed
    activityFeedList: document.getElementById('activity-feed-list'),
    logFilters: document.querySelectorAll('.filter-tab'),
    btnClearFeed: document.getElementById('btn-clear-feed'),

    // Trip Sheet Modal
    tripSheetModal: document.getElementById('trip-sheet-modal'),
    closeTripSheet: document.getElementById('close-trip-sheet'),
    tripDriverName: document.getElementById('trip-driver-name'),
    tripDriverCar: document.getElementById('trip-driver-car'),
    tripDriverPlate: document.getElementById('trip-driver-plate'),
    tripDriverRating: document.getElementById('trip-driver-rating'),
    tripOtpPin: document.getElementById('trip-otp-pin'),
    tripPickupLoc: document.getElementById('trip-pickup-loc'),
    tripDestLoc: document.getElementById('trip-dest-loc'),
    tripFareTotal: document.getElementById('trip-fare-total'),
    btnCompleteTripPreview: document.getElementById('btn-complete-trip-preview'),

    // Labs Modals
    raceModal: document.getElementById('race-modal'),
    closeRaceModal: document.getElementById('close-race-modal'),
    btnRunRaceNoMutex: document.getElementById('btn-run-race-nomutex'),
    btnRunRaceWithMutex: document.getElementById('btn-run-race-withmutex'),

    deadlockModal: document.getElementById('deadlock-modal'),
    closeDeadlockModal: document.getElementById('close-deadlock-modal'),
    btnRunDlWrong: document.getElementById('btn-run-dl-wrong'),
    btnRunDlCorrect: document.getElementById('btn-run-dl-correct')
  };

  // State Management
  let selectedVehicleType = 'ubergo';
  let selectedVehicleName = 'Uber Go';
  let selectedVehicleFare = 185;

  const activities = [];
  let currentActivityFilter = 'ALL';

  const cities = ['Bengaluru Central', 'Delhi NCR', 'Mumbai Metro', 'Hyderabad Cybercity', 'London West End', 'San Francisco'];
  let cityIndex = 0;

  // =========================================================================
  // SIMULATION EVENT SUBSCRIPTIONS
  // =========================================================================

  sim.subscribe('onStateChange', (state) => {
    renderQueue(state);
    renderActors(state);
    renderSystemStatus(state);
    renderControls(state);
    renderIncomingOffers(state);
  });

  sim.subscribe('onExplanation', (data) => {
    if (dom.explanationIcon) dom.explanationIcon.textContent = data.icon;
    if (dom.explanationTag) dom.explanationTag.textContent = data.tag;
    if (dom.explanationTime) dom.explanationTime.textContent = data.time;
    if (dom.explanationText) dom.explanationText.innerHTML = data.message;
  });

  sim.subscribe('onActivity', (activity) => {
    activities.unshift(activity);
    if (activities.length > 100) activities.pop();
    renderActivities();
  });

  sim.subscribe('onStepUpdate', (data) => {
    if (!dom.stepModeBanner) return;
    if (data.active) {
      dom.stepModeBanner.classList.remove('hidden');
      if (data.current > 0) {
        if (dom.stepCounterLabel) dom.stepCounterLabel.textContent = `Step ${data.current} of ${data.total}`;
        if (dom.stepGuideText) dom.stepGuideText.textContent = data.label;
        if (dom.btnNextStep) dom.btnNextStep.disabled = false;
      } else {
        if (dom.stepCounterLabel) dom.stepCounterLabel.textContent = `Step 0 of 6`;
        if (dom.stepGuideText) dom.stepGuideText.textContent = `Ready. Click "Request ${selectedVehicleName}" or "ACCEPT RIDE OFFER" to step through.`;
        if (dom.btnNextStep) dom.btnNextStep.disabled = true;
      }
    } else {
      dom.stepModeBanner.classList.add('hidden');
    }
  });

  sim.subscribe('onTripMatched', (trip) => {
    updateTripSheetModal(trip);
  });

  // =========================================================================
  // RENDER FUNCTIONS
  // =========================================================================

  function renderQueue(state) {
    if (!dom.physicalQueueBoard) return;
    dom.physicalQueueBoard.innerHTML = '';
    const filledCount = state.buffer.filter(Boolean).length;
    if (dom.queueOccupancyTag) dom.queueOccupancyTag.textContent = `${filledCount} / ${state.bufferSize} Filled`;

    const percentage = Math.round((filledCount / state.bufferSize) * 100);
    if (dom.queueMeterBar) dom.queueMeterBar.style.width = `${percentage}%`;

    state.buffer.forEach((slot, idx) => {
      const slotCard = document.createElement('div');
      slotCard.className = `queue-slot-card ${slot ? 'occupied' : 'empty'}`;

      const slotNumber = String(idx + 1).padStart(2, '0');

      if (slot) {
        slotCard.innerHTML = `
          <div class="slot-index">${slotNumber}</div>
          <div class="slot-content-occupied">
            <div class="slot-rider-info">
              <div class="slot-rider-header">
                <span class="slot-rider-name">${slot.vehicleIcon || '🚗'} ${slot.riderName}</span>
                <span class="slot-ride-id">#${slot.rideId}</span>
              </div>
              <div class="slot-route">📍 ${slot.pickup} &rarr; 🎯 ${slot.destination}</div>
            </div>
            <div class="slot-meta-right">
              <span class="slot-fare-badge">₹${slot.fare}</span>
              <span class="slot-badge-waiting">Waiting (${slot.vehicleName || 'Uber Go'})</span>
            </div>
          </div>
        `;
      } else {
        slotCard.innerHTML = `
          <div class="slot-index">${slotNumber}</div>
          <div class="slot-content-empty">
            <div class="slot-empty-circle"></div>
            <span>EMPTY (Slot available for new booking)</span>
          </div>
        `;
      }

      dom.physicalQueueBoard.appendChild(slotCard);
    });

    // Mutex Status Banner
    if (dom.mutexBanner) {
      if (state.mutexLocked) {
        dom.mutexBanner.className = 'mutex-status-banner locked';
        if (dom.mutexIcon) dom.mutexIcon.textContent = '🔒';
        if (dom.mutexHeadline) dom.mutexHeadline.textContent = `MUTEX: LOCKED (${state.mutexHolder || 'In Use'})`;
        if (dom.mutexSubline) dom.mutexSubline.textContent = `Queue is locked exclusively to prevent race conditions.`;
      } else {
        dom.mutexBanner.className = 'mutex-status-banner unlocked';
        if (dom.mutexIcon) dom.mutexIcon.textContent = '🔓';
        if (dom.mutexHeadline) dom.mutexHeadline.textContent = 'MUTEX: UNLOCKED';
        if (dom.mutexSubline) dom.mutexSubline.textContent = 'Shared dispatch buffer is free for concurrent thread access.';
      }
    }
  }

  function renderActors(state) {
    // 1. Left: Rider active showcase
    if (dom.riderIdlePlaceholder && dom.activeRiderCard) {
      if (state.activeRider) {
        dom.riderIdlePlaceholder.style.display = 'none';
        dom.activeRiderCard.classList.remove('hidden');
        dom.activeRiderCard.innerHTML = `
          <div class="actor-header">
            <span class="actor-id-badge">${state.activeRider.rideId}</span>
            <span class="actor-status-pill status-booking">Rider Booking</span>
          </div>
          <div class="actor-profile-row">
            <div class="actor-avatar-circle">👤</div>
            <div class="actor-details">
              <h4>${state.activeRider.name}</h4>
              <p>${state.activeRider.status}</p>
            </div>
          </div>
          <div class="actor-route-line">
            <span>${state.activeRider.vehicleIcon || '🚗'}</span>
            <span>${state.activeRider.route || 'Planning route...'}</span>
            ${state.activeRider.fare ? `<strong style="margin-left: auto; color: var(--uber-green);">₹${state.activeRider.fare}</strong>` : ''}
          </div>
        `;
      } else {
        dom.riderIdlePlaceholder.style.display = 'block';
        dom.activeRiderCard.classList.add('hidden');
      }
    }

    // Left: Waiting Riders Line (Buffer Full)
    if (dom.waitingRidersBadge && dom.waitingRidersLane) {
      dom.waitingRidersBadge.textContent = state.waitingRiders.length;
      dom.waitingRidersLane.innerHTML = '';
      if (state.waitingRiders.length === 0) {
        dom.waitingRidersLane.innerHTML = `<div class="waiting-empty-msg">No riders blocked. Free slots available in dispatch queue.</div>`;
      } else {
        state.waitingRiders.forEach((r) => {
          const item = document.createElement('div');
          item.className = 'waiting-person-item';
          item.innerHTML = `
            <div class="waiting-person-info">
              <span>${r.vehicleIcon || '👤'}</span>
              <span>${r.name} (${r.rideId})</span>
            </div>
            <span class="waiting-person-status">wait(empty) Blocked</span>
          `;
          dom.waitingRidersLane.appendChild(item);
        });
      }
    }

    // 2. Right: Driver active showcase
    if (dom.driverIdlePlaceholder && dom.activeDriverCard) {
      if (state.activeDriver) {
        dom.driverIdlePlaceholder.style.display = 'none';
        dom.activeDriverCard.classList.remove('hidden');
        dom.activeDriverCard.innerHTML = `
          <div class="actor-header">
            <span class="actor-id-badge">${state.activeDriver.plate || 'Driver Partner'}</span>
            <span class="actor-status-pill status-accepted">Driver Active</span>
          </div>
          <div class="actor-profile-row">
            <div class="actor-avatar-circle">🚖</div>
            <div class="actor-details">
              <h4>${state.activeDriver.name}</h4>
              <p>${state.activeDriver.status}</p>
            </div>
          </div>
        `;
      } else {
        dom.driverIdlePlaceholder.style.display = 'block';
        dom.activeDriverCard.classList.add('hidden');
      }
    }

    // Right: Waiting Drivers Line (Buffer Empty)
    if (dom.waitingDriversBadge && dom.waitingDriversLane) {
      dom.waitingDriversBadge.textContent = state.waitingDrivers.length;
      dom.waitingDriversLane.innerHTML = '';
      if (state.waitingDrivers.length === 0) {
        dom.waitingDriversLane.innerHTML = `<div class="waiting-empty-msg">No drivers blocked. Rides are available or drivers are on active trips.</div>`;
      } else {
        state.waitingDrivers.forEach((d) => {
          const item = document.createElement('div');
          item.className = 'waiting-person-item';
          item.innerHTML = `
            <div class="waiting-person-info">
              <span>🚖</span>
              <span>${d.name} (${d.plate || d.car})</span>
            </div>
            <span class="waiting-person-status">wait(full) Blocked</span>
          `;
          dom.waitingDriversLane.appendChild(item);
        });
      }
    }

    // Driver Earnings Counter
    if (dom.driverPayoutText) {
      dom.driverPayoutText.textContent = `₹${1420 + (state.stats.totalEarnings || 0)}`;
    }
  }

  function renderIncomingOffers(state) {
    if (!dom.offerEmptyState || !dom.offerActiveState) return;
    const oldestWaitingRide = state.buffer.find((slot) => slot !== null);

    if (oldestWaitingRide) {
      dom.offerEmptyState.style.display = 'none';
      dom.offerActiveState.classList.remove('hidden');
      dom.offerActiveState.innerHTML = `
        <div class="incoming-offer-card-active">
          <div class="offer-row-top">
            <span class="offer-passenger-name">${oldestWaitingRide.riderAvatar || '👤'} ${oldestWaitingRide.riderName} (⭐${oldestWaitingRide.riderRating || '4.9'})</span>
            <span class="offer-fare-badge">₹${oldestWaitingRide.fare}</span>
          </div>
          <div class="offer-route-text">
            📍 ${oldestWaitingRide.pickup} &rarr; 🎯 ${oldestWaitingRide.destination}
          </div>
          <div class="offer-meta-footer">
            <span>${oldestWaitingRide.vehicleIcon || '🚗'} ${oldestWaitingRide.vehicleName || 'Uber Go'}</span>
            <span>${oldestWaitingRide.distance || '3.5 km'}</span>
            <span>PIN: <strong>${oldestWaitingRide.otp}</strong></span>
          </div>
        </div>
      `;
    } else {
      dom.offerEmptyState.style.display = 'flex';
      dom.offerActiveState.classList.add('hidden');
    }
  }

  function renderSystemStatus(state) {
    if (dom.valEmpty) dom.valEmpty.textContent = state.emptyCount;
    if (dom.descEmpty) dom.descEmpty.textContent = `${state.emptyCount} ${state.emptyCount === 1 ? 'slot' : 'slots'} available`;

    if (dom.valFull) dom.valFull.textContent = state.fullCount;
    if (dom.descFull) dom.descFull.textContent = `${state.fullCount} ${state.fullCount === 1 ? 'ride' : 'rides'} waiting`;

    if (dom.valMutex && dom.descMutex && dom.cardMutexSem) {
      if (state.mutexLocked) {
        dom.valMutex.textContent = 'LOCKED';
        dom.descMutex.textContent = `Used by ${state.mutexHolder || 'Thread'}`;
        dom.cardMutexSem.classList.add('locked');
      } else {
        dom.valMutex.textContent = 'UNLOCKED';
        dom.descMutex.textContent = 'Shared queue available';
        dom.cardMutexSem.classList.remove('locked');
      }
    }
  }

  function renderControls(state) {
    if (dom.btnAutoSim && dom.autoBtnText) {
      if (sim.isAutoRunning()) {
        dom.btnAutoSim.classList.add('active');
        dom.autoBtnText.textContent = 'Live Sim: RUNNING';
      } else {
        dom.btnAutoSim.classList.remove('active');
        dom.autoBtnText.textContent = 'Start Live Simulation';
      }
    }

    if (dom.pauseIcon && dom.pauseText) {
      if (state.isPaused) {
        dom.pauseIcon.textContent = '▶';
        dom.pauseText.textContent = 'Resume';
      } else {
        dom.pauseIcon.textContent = '⏸';
        dom.pauseText.textContent = 'Pause';
      }
    }

    if (dom.btnStepMode && dom.stepModeStatus) {
      dom.btnStepMode.classList.toggle('active', state.stepMode);
      dom.stepModeStatus.textContent = state.stepMode ? 'ON' : 'OFF';
    }
  }

  function renderActivities() {
    if (!dom.activityFeedList) return;
    dom.activityFeedList.innerHTML = '';
    const filtered = currentActivityFilter === 'ALL'
      ? activities
      : activities.filter((a) => a.category === currentActivityFilter);

    if (filtered.length === 0) {
      dom.activityFeedList.innerHTML = `<div class="waiting-empty-msg">No activity recorded yet.</div>`;
      return;
    }

    filtered.forEach((act) => {
      const row = document.createElement('div');
      row.className = 'activity-row';
      const badgeClass = act.category === 'RIDER' ? 'badge-rider' : act.category === 'DRIVER' ? 'badge-driver' : 'badge-system';

      row.innerHTML = `
        <span class="activity-time">${act.timestamp}</span>
        <span class="activity-badge ${badgeClass}">${act.category}</span>
        <span class="activity-text">${act.message}</span>
      `;
      dom.activityFeedList.appendChild(row);
    });
  }

  function updateTripSheetModal(trip) {
    if (dom.tripDriverName) dom.tripDriverName.textContent = trip.driverName;
    if (dom.tripDriverCar) dom.tripDriverCar.textContent = trip.driverCar;
    if (dom.tripDriverPlate) dom.tripDriverPlate.textContent = trip.driverPlate;
    if (dom.tripDriverRating) dom.tripDriverRating.textContent = `⭐ ${trip.driverRating || '4.92'} (1,420 trips)`;
    if (dom.tripOtpPin) dom.tripOtpPin.textContent = trip.otp;
    if (dom.tripPickupLoc) dom.tripPickupLoc.textContent = trip.pickup;
    if (dom.tripDestLoc) dom.tripDestLoc.textContent = trip.destination;
    if (dom.tripFareTotal) dom.tripFareTotal.textContent = `₹${trip.fare}`;
  }

  // =========================================================================
  // INTERACTIVE UBER WIDGET EVENT HANDLERS
  // =========================================================================

  // Top Category Tabs (Ride, Auto, Moto, Sedan, XL)
  dom.catTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      dom.catTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const cat = tab.getAttribute('data-cat');
      const cardToSelect = document.querySelector(`.uber-product-card[data-type="${cat === 'ride' ? 'ubergo' : cat}"]`);
      if (cardToSelect) {
        cardToSelect.click();
      }
    });
  });

  // Vehicle Selection Cards
  dom.productCards.forEach((card) => {
    card.addEventListener('click', () => {
      dom.productCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');

      selectedVehicleType = card.getAttribute('data-type');
      selectedVehicleFare = parseInt(card.getAttribute('data-fare'), 10);
      const nameEl = card.querySelector('.product-name');
      selectedVehicleName = nameEl ? nameEl.textContent : 'Uber Go';

      if (dom.bookingCtaText) {
        dom.bookingCtaText.textContent = `Request ${selectedVehicleName} \u2022 ₹${selectedVehicleFare}`;
      }
      window.soundEffects.playUnlock();
    });
  });

  // Popular Location Chips
  dom.uberChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      dom.uberChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const p = chip.getAttribute('data-pickup');
      const d = chip.getAttribute('data-dest');
      if (p && dom.pickupInput) dom.pickupInput.value = p;
      if (d && dom.destinationInput) dom.destinationInput.value = d;

      window.soundEffects.playUnlock();
    });
  });

  // Swap Locations Button
  if (dom.btnSwapLocations) {
    dom.btnSwapLocations.addEventListener('click', () => {
      if (dom.pickupInput && dom.destinationInput) {
        const temp = dom.pickupInput.value;
        dom.pickupInput.value = dom.destinationInput.value;
        dom.destinationInput.value = temp;
        window.soundEffects.playUnlock();
      }
    });
  }

  // City Selector Switcher Click
  if (dom.cityBadge) {
    dom.cityBadge.addEventListener('click', () => {
      cityIndex = (cityIndex + 1) % cities.length;
      if (dom.currentCityLabel) dom.currentCityLabel.textContent = cities[cityIndex];
      sim.explain(`City dispatch center switched to ${cities[cityIndex]}.`, '📍', 'CITY DISPATCH');
      window.soundEffects.playUnlock();
    });
  }

  // =========================================================================
  // CORE SIMULATION TRIGGERS
  // =========================================================================

  // "Request Uber" (Producer)
  if (dom.btnBookRide) {
    dom.btnBookRide.addEventListener('click', () => {
      const profileIdx = dom.riderProfileSelect ? parseInt(dom.riderProfileSelect.value, 10) : 0;
      const profile = sim.riderProfiles[profileIdx] || sim.riderProfiles[0];
      const pickup = (dom.pickupInput && dom.pickupInput.value) ? dom.pickupInput.value : 'Tech Park';
      const destination = (dom.destinationInput && dom.destinationInput.value) ? dom.destinationInput.value : 'Airport T2';
      const paymentMethod = dom.paymentMethodSelect ? dom.paymentMethodSelect.value : 'UPI (Google Pay)';

      sim.produceRide({
        riderProfile: profile,
        pickup,
        destination,
        vehicleType: selectedVehicleType,
        paymentMethod
      });
    });
  }

  // "ACCEPT RIDE OFFER" (Consumer)
  if (dom.btnFindRide) {
    dom.btnFindRide.addEventListener('click', () => {
      const driverIdx = dom.driverProfileSelect ? parseInt(dom.driverProfileSelect.value, 10) : 0;
      const driver = sim.driverProfiles[driverIdx] || sim.driverProfiles[0];

      sim.consumeRide(driver);
    });
  }

  // "Start Live Simulation"
  if (dom.btnAutoSim) {
    dom.btnAutoSim.addEventListener('click', () => {
      if (sim.isAutoRunning()) {
        sim.stopAutoSimulation();
      } else {
        sim.startAutoSimulation();
      }
    });
  }

  // Pause / Resume
  if (dom.btnPauseSim) {
    dom.btnPauseSim.addEventListener('click', () => {
      sim.togglePause();
    });
  }

  // Reset
  if (dom.btnResetSim) {
    dom.btnResetSim.addEventListener('click', () => {
      sim.reset();
    });
  }

  // Capacity Selector (3, 5, 7, 10)
  dom.capButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      dom.capButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cap = parseInt(btn.getAttribute('data-cap'), 10);
      sim.setBufferSize(cap);
    });
  });

  // Speed Selector
  dom.speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      dom.speedButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = btn.getAttribute('data-speed');
      sim.setSpeed(speed);
    });
  });

  // Step Mode Toggle
  if (dom.btnStepMode) {
    dom.btnStepMode.addEventListener('click', () => {
      const isNowActive = !sim.stepMode;
      sim.setStepMode(isNowActive);
      if (isNowActive) {
        sim.explain(`Step Mode enabled. Click "Request ${selectedVehicleName}" or "ACCEPT RIDE OFFER", then use "Next Step" to advance step by step.`, '👣', 'STEP MODE');
        sim.notifyStepUpdate(0, 6, 'Ready for first action.');
      } else {
        sim.cancelStepModeAction();
        sim.explain('Step Mode disabled. Normal simulation active.', '▶', 'STEP MODE');
      }
    });
  }

  // Next Step Button
  if (dom.btnNextStep) {
    dom.btnNextStep.addEventListener('click', () => {
      sim.nextStep();
    });
  }

  // Cancel Step Button
  if (dom.btnCancelStep) {
    dom.btnCancelStep.addEventListener('click', () => {
      sim.cancelStepModeAction();
    });
  }

  // Top Nav Items (Ride, Viva)
  dom.navItems.forEach((tab) => {
    tab.addEventListener('click', () => {
      dom.navItems.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-nav');
      if (target === 'viva') {
        if (dom.tabGuideView) dom.tabGuideView.classList.remove('hidden');
        if (dom.mainBookingView) dom.mainBookingView.classList.add('hidden');
      } else {
        if (dom.tabGuideView) dom.tabGuideView.classList.add('hidden');
        if (dom.mainBookingView) dom.mainBookingView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Theme Toggle (Light / Dark)
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      if (dom.themeIcon) dom.themeIcon.textContent = nextTheme === 'light' ? '🌙' : '☀️';
    });
  }

  // Sound Toggle
  if (dom.soundToggleBtn) {
    dom.soundToggleBtn.addEventListener('click', () => {
      const isSoundOn = window.soundEffects.toggle();
      if (dom.soundIcon) dom.soundIcon.textContent = isSoundOn ? '🔊' : '🔇';
    });
  }

  // Activity Filter Tabs
  dom.logFilters.forEach((tab) => {
    tab.addEventListener('click', () => {
      dom.logFilters.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentActivityFilter = tab.getAttribute('data-filter');
      renderActivities();
    });
  });

  // Clear Activity Feed
  if (dom.btnClearFeed) {
    dom.btnClearFeed.addEventListener('click', () => {
      activities.length = 0;
      renderActivities();
    });
  }

  // =========================================================================
  // MODALS & LABS
  // =========================================================================

  // Trip Sheet Modal Close
  if (dom.closeTripSheet) {
    dom.closeTripSheet.addEventListener('click', () => {
      if (dom.tripSheetModal) dom.tripSheetModal.classList.remove('active');
    });
  }

  if (dom.btnCompleteTripPreview) {
    dom.btnCompleteTripPreview.addEventListener('click', () => {
      window.soundEffects.playTripComplete();
      if (dom.tripSheetModal) dom.tripSheetModal.classList.remove('active');
      sim.explain('Trip completed successfully. Passenger rating: ⭐5.0.', '✨', 'TRIP COMPLETED');
    });
  }

  // Race Demo Modal
  if (dom.btnRaceDemo) {
    dom.btnRaceDemo.addEventListener('click', () => {
      if (dom.raceModal) dom.raceModal.classList.add('active');
      labs.runRaceConditionLab('unsynchronized');
    });
  }

  if (dom.closeRaceModal) {
    dom.closeRaceModal.addEventListener('click', () => {
      if (dom.raceModal) dom.raceModal.classList.remove('active');
    });
  }

  if (dom.btnRunRaceNoMutex) {
    dom.btnRunRaceNoMutex.addEventListener('click', () => {
      labs.runRaceConditionLab('unsynchronized');
    });
  }

  if (dom.btnRunRaceWithMutex) {
    dom.btnRunRaceWithMutex.addEventListener('click', () => {
      labs.runRaceConditionLab('synchronized');
    });
  }

  // Deadlock Demo Modal
  if (dom.btnDeadlockDemo) {
    dom.btnDeadlockDemo.addEventListener('click', () => {
      if (dom.deadlockModal) dom.deadlockModal.classList.add('active');
      labs.runDeadlockLab('incorrect');
    });
  }

  if (dom.closeDeadlockModal) {
    dom.closeDeadlockModal.addEventListener('click', () => {
      if (dom.deadlockModal) dom.deadlockModal.classList.remove('active');
    });
  }

  if (dom.btnRunDlWrong) {
    dom.btnRunDlWrong.addEventListener('click', () => {
      labs.runDeadlockLab('incorrect');
    });
  }

  if (dom.btnRunDlCorrect) {
    dom.btnRunDlCorrect.addEventListener('click', () => {
      labs.runDeadlockLab('correct');
    });
  }

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (dom.raceModal && e.target === dom.raceModal) dom.raceModal.classList.remove('active');
    if (dom.deadlockModal && e.target === dom.deadlockModal) dom.deadlockModal.classList.remove('active');
    if (dom.tripSheetModal && e.target === dom.tripSheetModal) dom.tripSheetModal.classList.remove('active');
  });

  // Initial State Notification
  sim.notifyState();
  sim.logActivity('SYSTEM', 'Uber Cloud Dispatch platform initialized with 5 buffer slots.');
});
