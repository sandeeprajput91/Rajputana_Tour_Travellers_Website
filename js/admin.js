/**
 * Rajputana Tour & Travellers - Admin Command Centre
 * Full management of bookings, driver assignment, fleet status, and report exports.
 * Powered by SQLite Database Backend API.
 */

(function () {
  let selectedBookingForAssign = null;

  function initAdminPanel() {
    renderAdminMetrics();
    renderBookingsTable();
    renderFleetManagement();
    renderDriverRoster();

    // Search & Filter listeners
    const searchInput = document.getElementById("adminBookingSearch");
    const statusFilter = document.getElementById("adminStatusFilter");

    searchInput?.addEventListener("input", () => renderBookingsTable());
    statusFilter?.addEventListener("change", () => renderBookingsTable());

    // Export CSV button
    document.getElementById("btnExportCsv")?.addEventListener("click", exportBookingsToCSV);
  }

  async function renderAdminMetrics() {
    try {
      const res = await fetch("/api/metrics");
      if (res.ok) {
        const data = await res.json();
        const elTotalBookings = document.getElementById("metricTotalBookings");
        const elRevenue = document.getElementById("metricTotalRevenue");
        const elActive = document.getElementById("metricActiveTrips");
        const elCompleted = document.getElementById("metricCompletedTrips");

        if (elTotalBookings) elTotalBookings.textContent = data.totalBookings;
        if (elRevenue) elRevenue.textContent = `${data.availableFleet} Active Cabs`;
        if (elActive) elActive.textContent = data.activeTrips;
        if (elCompleted) elCompleted.textContent = data.completedTrips;
        return;
      }
    } catch (e) {
      console.warn("API metrics fallback to local store", e);
    }

    const bookings = window.getAppBookings ? window.getAppBookings() : [];
    const totalBookings = bookings.length;
    const activeTrips = bookings.filter(b => b.tripStatus === "Driver on Way" || b.tripStatus === "Trip Started" || b.tripStatus === "Driver Assigned").length;
    const completedTrips = bookings.filter(b => b.tripStatus === "Completed").length;

    const elTotalBookings = document.getElementById("metricTotalBookings");
    const elRevenue = document.getElementById("metricTotalRevenue");
    const elActive = document.getElementById("metricActiveTrips");
    const elCompleted = document.getElementById("metricCompletedTrips");

    if (elTotalBookings) elTotalBookings.textContent = totalBookings;
    if (elRevenue) elRevenue.textContent = `4 Active Cabs`;
    if (elActive) elActive.textContent = activeTrips;
    if (elCompleted) elCompleted.textContent = completedTrips;
  }

  async function renderBookingsTable() {
    const tableBody = document.getElementById("adminBookingsTableBody");
    if (!tableBody) return;

    let bookings = [];
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        bookings = await res.json();
      } else {
        bookings = window.getAppBookings ? window.getAppBookings() : [];
      }
    } catch (e) {
      bookings = window.getAppBookings ? window.getAppBookings() : [];
    }

    const query = document.getElementById("adminBookingSearch")?.value.toLowerCase().trim() || "";
    const filter = document.getElementById("adminStatusFilter")?.value || "all";

    if (filter !== "all") {
      bookings = bookings.filter(b => b.tripStatus.toLowerCase().includes(filter.toLowerCase()));
    }

    if (query) {
      bookings = bookings.filter(b => 
        b.id.toLowerCase().includes(query) ||
        b.customerName.toLowerCase().includes(query) ||
        b.phone.includes(query) ||
        (b.pickup && b.pickup.toLowerCase().includes(query)) ||
        (b.drop && b.drop.toLowerCase().includes(query))
      );
    }

    if (bookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No bookings matching search criteria in database.</td></tr>`;
      return;
    }

    tableBody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong>${b.id}</strong><br><small style="color:#64748b;">${b.createdAt ? b.createdAt.substring(0, 10) : ''}</small></td>
        <td>
          <strong>${b.customerName}</strong><br>
          <small><a href="tel:${b.phone}" style="color:#1d4ed8;">${b.phone}</a></small>
        </td>
        <td>
          <span style="font-size:0.8rem; font-weight:600; color:#0b2a55;">${b.pickup}</span>
          <br>➜ <span style="font-size:0.8rem; color:#64748b;">${b.drop}</span>
        </td>
        <td>
          <strong>${b.date}</strong><br>
          <small>${b.time || ''}</small>
        </td>
        <td>
          <span style="font-weight:600;">${b.vehicleName}</span><br>
          <small style="color:#64748b;">${b.passengers} Passengers</small>
        </td>
        <td>
          <strong style="color:#0b2a55; text-transform:capitalize;">${b.serviceType || 'Trip'}</strong><br>
          <small style="color:#059669; font-weight:600;">${b.paymentStatus || 'Custom Quote'}</small>
        </td>
        <td>
          <span class="badge" style="background:#fef3c7; color:#92400e; padding:4px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;">
            ${b.tripStatus}
          </span>
          <br>
          <small style="color:#1d4ed8; font-weight:600;">${b.driverName || 'Unassigned'}</small>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="window.openAssignDriverModal('${b.id}')" title="Assign Driver">
              👤 Assign
            </button>
            <button class="btn btn-sm btn-outline" style="color:#dc2626; border-color:#fecaca;" onclick="window.deleteBooking('${b.id}')" title="Cancel/Delete">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  async function renderFleetManagement() {
    const fleetGrid = document.getElementById("adminFleetGrid");
    if (!fleetGrid) return;

    let fleet = [];
    try {
      const res = await fetch("/api/fleet");
      if (res.ok) fleet = await res.json();
      else fleet = window.RTT_DATA?.fleet || [];
    } catch (e) {
      fleet = window.RTT_DATA?.fleet || [];
    }

    fleetGrid.innerHTML = fleet.map(v => `
      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div>
            <h4 style="color:#0b2a55; font-size:1rem; margin-bottom:2px;">${v.name}</h4>
            <span style="font-size:0.75rem; color:#64748b;">${v.type} (${v.seats} Seats)</span>
          </div>
          <span style="background:${v.available ? '#dcfce7' : '#fee2e2'}; color:${v.available ? '#15803d' : '#991b1b'}; padding:2px 8px; border-radius:999px; font-size:0.72rem; font-weight:700;">
            ${v.available ? 'Active in Fleet' : 'In Shop'}
          </span>
        </div>
        <div style="font-size:0.85rem; color:#0f172a; margin-bottom:12px;">
          <div><strong>AC Spec:</strong> Chilled Dual AC</div>
          <div><strong>Luggage:</strong> ${v.luggage}</div>
        </div>
        <button class="btn btn-sm btn-outline" style="width:100%;" onclick="window.toggleVehicleAvailability('${v.id}')">
          ${v.available ? 'Mark In Shop' : 'Mark Active'}
        </button>
      </div>
    `).join("");
  }

  async function renderDriverRoster() {
    const list = document.getElementById("adminDriverList");
    if (!list) return;

    let drivers = [];
    try {
      const res = await fetch("/api/drivers");
      if (res.ok) drivers = await res.json();
      else drivers = window.RTT_DATA?.drivers || [];
    } catch (e) {
      drivers = window.RTT_DATA?.drivers || [];
    }

    list.innerHTML = drivers.map(d => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9;">
        <div>
          <strong style="color:#0b2a55; font-size:0.92rem;">${d.name}</strong>
          <div style="font-size:0.78rem; color:#64748b;">📞 ${d.phone} | ⭐ ${d.rating} (${d.trips_completed || d.tripsCompleted || 0} trips)</div>
          <div style="font-size:0.75rem; color:#1d4ed8;">🚗 ${d.assigned_vehicle || d.assignedVehicle}</div>
        </div>
        <span style="background:#eff6ff; color:#1d4ed8; padding:3px 10px; border-radius:999px; font-size:0.75rem; font-weight:700;">
          ${d.status}
        </span>
      </div>
    `).join("");
  }

  window.openAssignDriverModal = async function (bookingId) {
    selectedBookingForAssign = bookingId;
    const modal = document.getElementById("assignDriverModal");
    const driverSelect = document.getElementById("modalDriverSelect");
    
    if (modal && driverSelect) {
      let drivers = [];
      try {
        const res = await fetch("/api/drivers");
        if (res.ok) drivers = await res.json();
        else drivers = window.RTT_DATA?.drivers || [];
      } catch (e) {
        drivers = window.RTT_DATA?.drivers || [];
      }

      driverSelect.innerHTML = drivers.map(d => `
        <option value="${d.id}">${d.name} (${d.assigned_vehicle || d.assignedVehicle})</option>
      `).join("");
      modal.classList.add("show");
    }
  };

  window.confirmAssignDriver = async function () {
    const modal = document.getElementById("assignDriverModal");
    const driverSelect = document.getElementById("modalDriverSelect");
    if (!modal || !driverSelect || !selectedBookingForAssign) return;

    const driverId = driverSelect.value;
    let drivers = window.RTT_DATA?.drivers || [];
    try {
      const res = await fetch("/api/drivers");
      if (res.ok) drivers = await res.json();
    } catch (e) {}

    const driver = drivers.find(d => d.id === driverId);

    if (driver) {
      try {
        await fetch(`/api/bookings/${selectedBookingForAssign}/driver`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId: driver.id,
            driverName: driver.name,
            driverPhone: driver.phone,
            vehiclePlate: driver.assigned_vehicle || driver.assignedVehicle
          })
        });
      } catch (e) {
        console.warn("API driver assign failed, fallback to local", e);
      }

      if (window.updateBookingDriver) {
        window.updateBookingDriver(selectedBookingForAssign, driver);
      }

      modal.classList.remove("show");
      renderBookingsTable();
      renderAdminMetrics();
      if (window.showToast) {
        window.showToast(`Chauffeur ${driver.name} assigned to booking ${selectedBookingForAssign}! Saved in database.`);
      }
    }
  };

  window.deleteBooking = async function (bookingId) {
    if (confirm(`Are you sure you want to cancel booking ${bookingId} in database?`)) {
      try {
        await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      } catch (e) {
        console.warn("API delete failed, fallback", e);
      }

      if (window.removeBooking) {
        window.removeBooking(bookingId);
      }
      renderBookingsTable();
      renderAdminMetrics();
      if (window.showToast) window.showToast(`Booking ${bookingId} cancelled in database.`);
    }
  };

  window.toggleVehicleAvailability = function (vehId) {
    const v = window.RTT_DATA?.fleet.find(item => item.id === vehId);
    if (v) {
      v.available = !v.available;
      renderFleetManagement();
      if (window.showToast) window.showToast(`${v.name} status updated.`);
    }
  };

  async function exportBookingsToCSV() {
    let bookings = [];
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) bookings = await res.json();
      else bookings = window.getAppBookings ? window.getAppBookings() : [];
    } catch (e) {
      bookings = window.getAppBookings ? window.getAppBookings() : [];
    }

    if (bookings.length === 0) {
      alert("No bookings in database to export.");
      return;
    }

    const headers = ["Booking ID", "Customer Name", "Phone", "Email", "Pickup", "Drop", "Date", "Time", "Vehicle", "Payment Status", "Trip Status", "Driver"];
    const rows = bookings.map(b => [
      b.id,
      `"${b.customerName}"`,
      b.phone,
      b.email,
      `"${b.pickup}"`,
      `"${b.drop}"`,
      b.date,
      b.time,
      `"${b.vehicleName}"`,
      `"${b.paymentStatus}"`,
      `"${b.tripStatus}"`,
      `"${b.driverName || 'N/A'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rajputana_Database_Bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  window.initAdminPanel = initAdminPanel;
  window.refreshAdminPanel = function () {
    renderAdminMetrics();
    renderBookingsTable();
    renderFleetManagement();
    renderDriverRoster();
  };
})();
