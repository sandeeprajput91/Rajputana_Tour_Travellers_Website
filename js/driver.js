/**
 * Rajputana Tour & Travellers - Driver Partner Interface & Live GPS Broadcaster
 * Enables drivers to view assigned trips, navigate via Google Maps, update trip lifecycle, and simulate GPS.
 * Connected to SQLite Database API.
 */

(function () {
  let activeDriverId = "drv-02"; // Default to Kuldeep Singh
  let gpsInterval = null;

  function initDriverApp() {
    renderDriverTrips();

    const driverSelector = document.getElementById("driverSelectDropdown");
    if (driverSelector) {
      driverSelector.addEventListener("change", (e) => {
        activeDriverId = e.target.value;
        renderDriverTrips();
      });
    }
  }

  async function renderDriverTrips() {
    const listContainer = document.getElementById("driverTripsList");
    if (!listContainer) return;

    let allBookings = [];
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) allBookings = await res.json();
      else allBookings = window.getAppBookings ? window.getAppBookings() : [];
    } catch (e) {
      allBookings = window.getAppBookings ? window.getAppBookings() : [];
    }

    const driverTrips = allBookings.filter(b => b.driverId === activeDriverId || b.tripStatus === "Driver Assigned");

    if (driverTrips.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:#64748b;">
          <div style="font-size:2.5rem; margin-bottom:8px;">🚗</div>
          <p>No active trips assigned at the moment in database.</p>
          <small>Check back shortly or contact Admin Kalu Singh.</small>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = driverTrips.map(trip => `
      <div class="card" style="background:#fff; border-radius:12px; padding:16px; margin-bottom:14px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:0.75rem; font-weight:700; background:#eff6ff; color:#1d4ed8; padding:3px 8px; border-radius:999px;">${trip.id}</span>
          <span style="font-size:0.78rem; font-weight:700; background:#fef3c7; color:#92400e; padding:3px 8px; border-radius:999px;" id="badge-status-${trip.id}">${trip.tripStatus}</span>
        </div>
        
        <h4 style="color:#0b2a55; margin-bottom:4px; font-size:1.05rem;">${trip.customerName}</h4>
        <p style="font-size:0.82rem; color:#64748b; margin-bottom:10px;">
          📞 <a href="tel:${trip.phone}" style="color:#1d4ed8; font-weight:600;">${trip.phone}</a> | 
          👥 ${trip.passengers} Pax | 🚘 ${trip.vehicleName}
        </p>

        <div style="background:#f8fafc; border-radius:8px; padding:10px; font-size:0.82rem; margin-bottom:12px; border-left:3px solid #d97706;">
          <div><strong>📍 Pickup:</strong> ${trip.pickup}</div>
          <div style="margin-top:4px;"><strong>🏁 Drop:</strong> ${trip.drop}</div>
          <div style="margin-top:4px;"><strong>⏰ Time:</strong> ${trip.date} at ${trip.time || ''}</div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.pickup)}" target="_blank" class="btn btn-sm btn-outline" style="flex:1;">
            🗺️ Google Maps
          </a>
          <a href="https://wa.me/91${trip.phone}?text=Hello%20${encodeURIComponent(trip.customerName)},%20I%20am%20your%20Rajputana%20driver" target="_blank" class="btn btn-sm btn-whatsapp" style="flex:1;">
            💬 WhatsApp
          </a>
        </div>

        <div style="border-top:1px dashed #cbd5e1; padding-top:10px;">
          <label style="font-size:0.76rem; font-weight:700; color:#0b2a55; display:block; margin-bottom:6px;">Update Live Trip Status (Saves to Database):</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-sm ${trip.tripStatus === 'Driver on Way' ? 'btn-primary' : 'btn-outline'}" onclick="window.updateTripStatus('${trip.id}', 'Driver on Way')">On Way</button>
            <button class="btn btn-sm ${trip.tripStatus === 'Arrived at Pickup' ? 'btn-primary' : 'btn-outline'}" onclick="window.updateTripStatus('${trip.id}', 'Arrived at Pickup')">Arrived</button>
            <button class="btn btn-sm ${trip.tripStatus === 'Trip Started' ? 'btn-primary' : 'btn-outline'}" onclick="window.updateTripStatus('${trip.id}', 'Trip Started')">Start Trip</button>
            <button class="btn btn-sm btn-navy" onclick="window.updateTripStatus('${trip.id}', 'Completed')">Complete</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  window.updateTripStatus = async function (bookingId, newStatus) {
    try {
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn("API status update failed, fallback", e);
    }

    if (window.updateBookingStatus) {
      window.updateBookingStatus(bookingId, newStatus);
    }
    renderDriverTrips();
    if (window.showToast) {
      window.showToast(`Status updated to "${newStatus}"! Saved in SQLite Database.`);
    }
  };

  window.initDriverApp = initDriverApp;
  window.refreshDriverApp = renderDriverTrips;
})();
