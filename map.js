// map.js - High Performance Interactive Live City Map for RideSync
// Simulates realistic GPS movement, road grid navigation, and driver-rider matching

class CityMapVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // High DPI Retina display support
    this.dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.clientWidth || 600;
    this.height = this.canvas.clientHeight || 320;
    this.setupCanvas();

    window.addEventListener('resize', () => this.setupCanvas());

    // Defined City Landmarks & Coordinate Anchors (Normalized 0 to 1)
    this.landmarks = [
      { id: 'Airport T2', name: '✈️ Airport T2', x: 0.88, y: 0.16, type: 'airport' },
      { id: 'Tech Park', name: '🏢 Tech Park', x: 0.18, y: 0.22, type: 'office' },
      { id: 'City Center', name: '🛍️ City Center Mall', x: 0.52, y: 0.48, type: 'mall' },
      { id: 'Metro Station', name: '🚇 Metro Station', x: 0.35, y: 0.76, type: 'transit' },
      { id: 'College Road', name: '🎓 University Gate', x: 0.15, y: 0.82, type: 'edu' },
      { id: 'Railway Station', name: '🚆 Railway Stn', x: 0.78, y: 0.78, type: 'transit' },
      { id: 'MG Road', name: '📍 MG Road Plaza', x: 0.50, y: 0.24, type: 'hub' },
      { id: 'Residency Road', name: '🏨 Residency Blvd', x: 0.72, y: 0.45, type: 'hotel' },
      { id: 'Central Hospital', name: '🏥 City Hospital', x: 0.85, y: 0.55, type: 'hospital' }
    ];

    // Grid Roads (Horizontal & Vertical Lines)
    this.roads = [
      // Horizontal avenues
      { y: 0.18, name: 'Airport Expressway' },
      { y: 0.34, name: 'Outer Ring Road' },
      { y: 0.50, name: 'Central Boulevard' },
      { y: 0.68, name: 'Residency Avenue' },
      { y: 0.82, name: 'University Way' },
      // Vertical streets
      { x: 0.16, name: 'Tech Parkway' },
      { x: 0.35, name: 'Metro Corridor' },
      { x: 0.52, name: 'Commercial Street' },
      { x: 0.72, name: 'Station Road' },
      { x: 0.88, name: 'East Highway' }
    ];

    // Ambient Fleet of Drivers
    this.drivers = [
      { id: 'D1', name: 'Amit', car: 'Swift Dzire', plate: 'KA-01-AB-1234', rating: '4.92', vehicleType: 'ubergo', x: 0.16, y: 0.34, targetX: 0.52, targetY: 0.34, speed: 0.0007, status: 'patrolling', angle: 0 },
      { id: 'D2', name: 'Rohan', car: 'Hyundai Aura', plate: 'KA-05-XY-8821', rating: '4.88', vehicleType: 'sedan', x: 0.52, y: 0.50, targetX: 0.72, targetY: 0.50, speed: 0.0009, status: 'patrolling', angle: 0 },
      { id: 'D3', name: 'Neha', car: 'Bajaj RE', plate: 'MH-02-CD-5432', rating: '4.97', vehicleType: 'auto', x: 0.35, y: 0.68, targetX: 0.35, targetY: 0.18, speed: 0.0006, status: 'patrolling', angle: Math.PI / 2 },
      { id: 'D4', name: 'Vikram', car: 'Ertiga XL', plate: 'KA-01-ER-7744', rating: '4.95', vehicleType: 'xl', x: 0.72, y: 0.82, targetX: 0.88, targetY: 0.82, speed: 0.0008, status: 'patrolling', angle: 0 },
      { id: 'D5', name: 'Deepak', car: 'Pulsar 150', plate: 'KA-03-MN-3312', rating: '4.89', vehicleType: 'moto', x: 0.88, y: 0.34, targetX: 0.88, targetY: 0.68, speed: 0.0011, status: 'patrolling', angle: Math.PI / 2 },
      { id: 'D6', name: 'Manoj', car: 'Honda City', plate: 'DL-04-GH-9911', rating: '4.91', vehicleType: 'sedan', x: 0.52, y: 0.82, targetX: 0.16, targetY: 0.82, speed: 0.0007, status: 'patrolling', angle: Math.PI }
    ];

    // Active trip animations: [{ id, riderName, driverName, pickup, dest, state, startPos, pickupPos, destPos, carPos, progress, path }]
    this.activeTrips = [];

    // Active broadcast ripples: [{ x, y, radius, maxRadius, color, alpha }]
    this.broadcastRipples = [];

    // Interaction state
    this.isSettingPickup = false;
    this.isSettingDropoff = false;
    this.customPickup = null;
    this.customDropoff = null;

    this.bindEvents();
    this.startAnimationLoop();
  }

  setupCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 600;
    this.height = rect.height || 320;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / this.width;
      const normY = (e.clientY - rect.top) / this.height;

      // Find nearest landmark
      const nearest = this.getNearestLandmark(normX, normY);
      const locName = nearest ? nearest.id : 'Custom Location';

      // Dispatch custom location select event
      const event = new CustomEvent('map-location-selected', {
        detail: {
          name: locName,
          x: normX,
          y: normY,
          isSettingPickup: this.isSettingPickup
        }
      });
      window.dispatchEvent(event);

      this.addRipple(normX, normY, '#2563eb');
    });
  }

  getNearestLandmark(x, y) {
    let best = null;
    let minDist = 0.18; // Max snap radius
    this.landmarks.forEach((lm) => {
      const d = Math.hypot(lm.x - x, lm.y - y);
      if (d < minDist) {
        minDist = d;
        best = lm;
      }
    });
    return best;
  }

  getLandmarkCoords(name) {
    const found = this.landmarks.find((l) => l.id.toLowerCase() === (name || '').toLowerCase() || l.name.toLowerCase().includes((name || '').toLowerCase()));
    if (found) return { x: found.x, y: found.y };
    // fallback hash
    return { x: 0.35 + ((name ? name.length : 5) % 5) * 0.12, y: 0.3 + ((name ? name.length : 3) % 4) * 0.15 };
  }

  addRipple(normX, normY, color = '#2563eb') {
    this.broadcastRipples.push({
      x: normX,
      y: normY,
      radius: 4,
      maxRadius: 48,
      color,
      alpha: 1
    });
  }

  // Triggered when a new ride is booked into queue (Producer)
  triggerRideRequested(ride) {
    const coords = this.getLandmarkCoords(ride.pickup);
    this.addRipple(coords.x, coords.y, '#2563eb');
  }

  // Triggered when a driver accepts a ride (Consumer)
  triggerRideAccepted(driverName, ride) {
    const pickupCoords = this.getLandmarkCoords(ride.pickup);
    const destCoords = this.getLandmarkCoords(ride.destination);

    // Pick a driver from ambient fleet or use first available
    let driver = this.drivers.find((d) => d.name.toLowerCase() === (driverName || '').toLowerCase()) || this.drivers[0];

    this.addRipple(pickupCoords.x, pickupCoords.y, '#059669');

    // Create an active animated trip
    const trip = {
      id: ride.rideId,
      riderName: ride.riderName,
      driverName: driver.name,
      car: driver.car,
      plate: driver.plate,
      vehicleType: ride.vehicleType || driver.vehicleType,
      phase: 'approaching_pickup', // 'approaching_pickup' | 'on_trip' | 'completed'
      pickupCoords,
      destCoords,
      carX: driver.x,
      carY: driver.y,
      progress: 0,
      createdAt: Date.now()
    };

    this.activeTrips.push(trip);

    // Remove trip after completion (12 seconds)
    setTimeout(() => {
      this.activeTrips = this.activeTrips.filter((t) => t.id !== trip.id);
    }, 12000);
  }

  startAnimationLoop() {
    const loop = () => {
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Clear background
    this.ctx.fillStyle = isDark ? '#0b1120' : '#f8fafc';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 1. Draw City Grid Roads
    this.drawRoads(isDark);

    // 2. Draw Landmarks
    this.drawLandmarks(isDark);

    // 3. Update & Draw Ambient Fleet
    this.updateAndDrawAmbientFleet(isDark);

    // 4. Update & Draw Active Trips
    this.updateAndDrawActiveTrips(isDark);

    // 5. Draw Broadcast Ripples
    this.drawRipples();
  }

  drawRoads(isDark) {
    const ctx = this.ctx;

    // Road styling
    const roadColor = isDark ? '#1e293b' : '#e2e8f0';
    const roadBorderColor = isDark ? '#334155' : '#cbd5e1';
    const laneDashColor = isDark ? '#475569' : '#ffffff';

    // Horizontal roads
    this.roads.forEach((road) => {
      if (road.y !== undefined) {
        const y = road.y * this.height;
        ctx.fillStyle = roadColor;
        ctx.fillRect(0, y - 10, this.width, 20);

        ctx.strokeStyle = roadBorderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y - 10);
        ctx.lineTo(this.width, y - 10);
        ctx.moveTo(0, y + 10);
        ctx.lineTo(this.width, y + 10);
        ctx.stroke();

        // Center lane dash
        ctx.strokeStyle = laneDashColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Vertical roads
      if (road.x !== undefined) {
        const x = road.x * this.width;
        ctx.fillStyle = roadColor;
        ctx.fillRect(x - 10, 0, 20, this.height);

        ctx.strokeStyle = roadBorderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 10, 0);
        ctx.lineTo(x - 10, this.height);
        ctx.moveTo(x + 10, 0);
        ctx.lineTo(x + 10, this.height);
        ctx.stroke();

        // Center lane dash
        ctx.strokeStyle = laneDashColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  drawLandmarks(isDark) {
    const ctx = this.ctx;

    this.landmarks.forEach((lm) => {
      const x = lm.x * this.width;
      const y = lm.y * this.height;

      // Landmark bubble
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 1.5;

      const text = lm.name;
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const pad = 6;
      const boxW = textWidth + pad * 2;
      const boxH = 20;

      // Draw soft shadow
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 10);
      ctx.fill();
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = 'transparent';

      // Text
      ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    });
  }

  updateAndDrawAmbientFleet(isDark) {
    const ctx = this.ctx;

    this.drivers.forEach((driver) => {
      // Simple patrol movement towards target
      const dx = (driver.targetX - driver.x);
      const dy = (driver.targetY - driver.y);
      const dist = Math.hypot(dx, dy);

      if (dist < 0.02) {
        // Pick new random road intersection as target
        const roadX = this.roads.filter((r) => r.x !== undefined);
        const roadY = this.roads.filter((r) => r.y !== undefined);
        driver.targetX = roadX[Math.floor(Math.random() * roadX.length)].x;
        driver.targetY = roadY[Math.floor(Math.random() * roadY.length)].y;
      } else {
        // Move along grid
        if (Math.abs(dx) > 0.01) {
          driver.x += Math.sign(dx) * driver.speed;
          driver.angle = dx > 0 ? 0 : Math.PI;
        } else if (Math.abs(dy) > 0.01) {
          driver.y += Math.sign(dy) * driver.speed;
          driver.angle = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      }

      const px = driver.x * this.width;
      const py = driver.y * this.height;

      // Draw Vehicle Icon & Label
      this.drawCar(px, py, driver.angle, '#059669', driver.name, `⭐${driver.rating}`, isDark);
    });
  }

  updateAndDrawActiveTrips(isDark) {
    const ctx = this.ctx;

    this.activeTrips.forEach((trip) => {
      const pX = trip.pickupCoords.x * this.width;
      const pY = trip.pickupCoords.y * this.height;
      const dX = trip.destCoords.x * this.width;
      const dY = trip.destCoords.y * this.height;

      // 1. Draw Route line connecting pickup to destination
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pX, pY);
      ctx.lineTo(dX, dY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Pickup Pin (Green)
      this.drawPin(pX, pY, '#22c55e', '📍 ' + trip.riderName);

      // 3. Draw Destination Flag (Red)
      this.drawPin(dX, dY, '#ef4444', '🎯 Drop');

      // 4. Animate Car along route
      trip.progress += 0.005;
      if (trip.progress > 1) trip.progress = 1;

      // Linear interpolation for visual demonstration
      const currX = pX + (dX - pX) * trip.progress;
      const currY = pY + (dY - pY) * trip.progress;
      const angle = Math.atan2(dY - pY, dX - pX);

      this.drawCar(currX, currY, angle, '#2563eb', trip.driverName + ' (' + trip.riderName + ')', 'ON TRIP', isDark, true);
    });
  }

  drawCar(x, y, angle, color, driverName, statusTag, isDark, isHero = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Car Body / Pill
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = isHero ? 8 : 4;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = isHero ? '#2563eb' : (isDark ? '#059669' : '#047857');
    ctx.beginPath();
    ctx.arc(0, 0, isHero ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();

    // Inner White Ring
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, isHero ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Label tag above car
    ctx.font = '700 10px system-ui, -apple-system, sans-serif';
    const tagText = `${driverName} ${statusTag}`;
    const textW = ctx.measureText(tagText).width;

    ctx.fillStyle = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-textW / 2 - 4, -22, textW + 8, 14, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, 0, -15);

    ctx.restore();
  }

  drawPin(x, y, color, label) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Pin circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pin label
    ctx.font = '700 10px system-ui, -apple-system, sans-serif';
    const w = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 4, 10, w + 8, 14, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 17);

    ctx.restore();
  }

  drawRipples() {
    const ctx = this.ctx;

    for (let i = this.broadcastRipples.length - 1; i >= 0; i--) {
      const rip = this.broadcastRipples[i];
      rip.radius += 1.2;
      rip.alpha -= 0.025;

      if (rip.alpha <= 0) {
        this.broadcastRipples.splice(i, 1);
        continue;
      }

      const px = rip.x * this.width;
      const py = rip.y * this.height;

      ctx.save();
      ctx.strokeStyle = rip.color;
      ctx.globalAlpha = rip.alpha;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, rip.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

window.CityMapVisualizer = CityMapVisualizer;
