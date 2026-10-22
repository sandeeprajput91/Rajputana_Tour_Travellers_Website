"""
Rajputana Tour & Travellers - Enterprise Flask & SQLite Backend Server
Full RESTful API for bookings, fleet, drivers, tour packages, route rates, inquiries,
and dynamic fare calculator adhering to the 250 KM/day minimum rule and Same Day Drop actual KM rule.
"""

from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "rajputana.db")

app = Flask(__name__, static_folder=BASE_DIR)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------------------------------------------------
# STATIC FILE ROUTES
# -------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(BASE_DIR, path)

# -------------------------------------------------------------
# REST API ENDPOINTS
# -------------------------------------------------------------
@app.route("/api/status", methods=["GET"])
def api_status():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM bookings")
        b_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM fleet")
        f_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tour_packages")
        t_count = cursor.fetchone()[0]
        conn.close()
        return jsonify({
            "status": "online",
            "database": "connected",
            "db_type": "SQLite3",
            "db_path": DB_PATH,
            "total_bookings": b_count,
            "total_fleet": f_count,
            "total_tours": t_count,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/fleet", methods=["GET"])
def get_fleet():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fleet")
    rows = cursor.fetchall()
    fleet = []
    for r in rows:
        d = dict(r)
        d["features"] = json.loads(d["features"]) if isinstance(d["features"], str) else d["features"]
        d["available"] = bool(d["available"])
        fleet.append(d)
    conn.close()
    return jsonify(fleet)

@app.route("/api/drivers", methods=["GET"])
def get_drivers():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drivers")
    rows = cursor.fetchall()
    drivers = [dict(r) for r in rows]
    conn.close()
    return jsonify(drivers)

@app.route("/api/services", methods=["GET"])
def get_services():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM services ORDER BY display_order ASC")
    rows = cursor.fetchall()
    services = [dict(r) for r in rows]
    conn.close()
    return jsonify(services)

@app.route("/api/tours", methods=["GET"])
def get_tours():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tour_packages")
    rows = cursor.fetchall()
    tours = []
    for r in rows:
        d = dict(r)
        d["highlights"] = json.loads(d["highlights"]) if isinstance(d["highlights"], str) else d["highlights"]
        d["includes"] = json.loads(d["includes"]) if isinstance(d["includes"], str) else d["includes"]
        tours.append(d)
    conn.close()
    return jsonify(tours)

@app.route("/api/routes", methods=["GET"])
def get_routes():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM route_rates")
    rows = cursor.fetchall()
    routes = [dict(r) for r in rows]
    conn.close()
    return jsonify(routes)

@app.route("/api/calculate", methods=["GET", "POST"])
def calculate_fare():
    """
    Dynamic pricing calculator from SQLite database:
    - Same Day Drop: Calculated on actual KM (KM * rate_per_km). Zero night charges.
    - Multi-Day Tour: Billed on 250 KM/day minimum rule (Days * 250 KM * rate_per_km) + Driver Night Allowance extra.
    - Format output as 'Up to ₹...'
    """
    params = request.json if request.is_json else request.args
    vehicle_id = params.get("vehicleId", "innova-crysta")
    trip_mode = params.get("tripMode", "same_day") # 'same_day' or 'multi_day'
    days = int(params.get("days", 1))
    distance_km = int(params.get("distanceKm", 0))
    drop_city = params.get("drop", "").strip().lower()

    conn = get_db()
    cursor = conn.cursor()

    # Get vehicle specs
    cursor.execute("SELECT * FROM fleet WHERE id = ?", (vehicle_id,))
    v_row = cursor.fetchone()
    if not v_row:
        cursor.execute("SELECT * FROM fleet LIMIT 1")
        v_row = cursor.fetchone()

    vehicle = dict(v_row)
    rate_per_km = float(vehicle.get("rate_per_km", 18.0))
    min_km_per_day = int(vehicle.get("min_km_per_day", 250))
    night_charge = float(vehicle.get("night_charge", 350.0))

    # Auto-resolve distance if not supplied
    if distance_km <= 0:
        if "udaipur" in drop_city:
            distance_km = 395
        elif "jaisalmer" in drop_city:
            distance_km = 560
        elif "jodhpur" in drop_city:
            distance_km = 335
        elif "delhi" in drop_city or "gurgaon" in drop_city or "noida" in drop_city:
            distance_km = 275
        elif "agra" in drop_city or "taj" in drop_city:
            distance_km = 240
        elif "pushkar" in drop_city or "ajmer" in drop_city:
            distance_km = 145
        elif "ranthambore" in drop_city or "sawai" in drop_city:
            distance_km = 160
        elif "khatu" in drop_city or "salasar" in drop_city:
            distance_km = 180
        elif "mount abu" in drop_city:
            distance_km = 490
        elif "bikaner" in drop_city:
            distance_km = 335
        elif "chittor" in drop_city:
            distance_km = 310
        elif "airport" in drop_city:
            distance_km = 35
        elif "darshan" in drop_city or "local" in drop_city or "sightseeing" in drop_city:
            distance_km = 80
        else:
            cursor.execute("SELECT distance_km FROM route_rates WHERE ? LIKE '%' || LOWER(to_city) || '%' OR LOWER(to_city) LIKE ? LIMIT 1", (drop_city, f"%{drop_city}%"))
            r_match = cursor.fetchone()
            if r_match:
                distance_km = r_match[0]
            else:
                distance_km = 250

    conn.close()

    if trip_mode == "multi_day":
        days = max(2, days)
        # Multi-day tour: minimum 250 KM per day rule + extra KM + driver night charges extra
        nights = max(1, days - 1)
        min_allowance_km = days * min_km_per_day
        total_km = max(distance_km, min_allowance_km)
        km_fare = total_km * rate_per_km
        driver_night_allowance = nights * night_charge
        total_fare = km_fare + driver_night_allowance
        rounded_total = int(((total_fare + 49) // 50) * 50)
        if distance_km > min_allowance_km:
            extra_km = distance_km - min_allowance_km
            rule_desc = f"Multi-Day Tour: {days} Days ({min_allowance_km} KM Base Min + {extra_km} Extra KM @ ₹{rate_per_km:g}/KM) + {nights} Night{'s' if nights > 1 else ''} Driver Allowance (₹{int(night_charge)}/night)"
        else:
            rule_desc = f"Multi-Day Tour: {days} Days × {min_km_per_day} KM/Day Min ({min_allowance_km} KM) @ ₹{rate_per_km:g}/KM + {nights} Night{'s' if nights > 1 else ''} Driver Allowance (₹{int(night_charge)}/night)"
    else:
        trip_mode = "same_day"
        days = 1
        # Same day drop: 250 KM minimum running rule applies! Extra KM charged above 250 KM
        min_allowance_km = min_km_per_day
        total_km = max(min_allowance_km, distance_km)
        km_fare = total_km * rate_per_km
        driver_night_allowance = 0
        total_fare = km_fare
        rounded_total = int(((total_fare + 49) // 50) * 50)
        if distance_km > min_allowance_km:
            extra_km = distance_km - min_allowance_km
            rule_desc = f"Same Day Drop: {distance_km} KM Billed ({min_allowance_km} KM Base Min + {extra_km} Extra KM @ ₹{rate_per_km:g}/KM • Zero Night Charge)"
        else:
            rule_desc = f"Same Day Drop: Min. {min_allowance_km} KM Running Rule Applied ({distance_km} KM distance @ ₹{rate_per_km:g}/KM • Zero Night Charge)"

    price_upto = f"Up to ₹{rounded_total:,}"

    return jsonify({
        "success": True,
        "tripMode": trip_mode,
        "days": days,
        "nights": max(0, days - 1) if trip_mode == "multi_day" else 0,
        "distanceKm": distance_km,
        "ratePerKm": rate_per_km,
        "minKmPerDay": min_km_per_day,
        "billableKm": total_km,
        "kmFare": km_fare,
        "nightAllowance": driver_night_allowance,
        "totalEstimate": rounded_total,
        "priceUpto": price_upto,
        "pricingRule": rule_desc,
        "vehicleName": vehicle.get("name")
    })

@app.route("/api/bookings", methods=["GET"])
def get_bookings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    bookings = []
    for r in rows:
        d = dict(r)
        d["id"] = d["id"]
        d["customerName"] = d["customer_name"]
        d["drop"] = d["drop_location"]
        d["date"] = d["travel_date"]
        d["time"] = d["travel_time"]
        d["vehicleName"] = d["vehicle_name"]
        d["vehicleId"] = d["vehicle_id"]
        d["paymentStatus"] = d["payment_status"]
        d["paymentMethod"] = d["payment_method"]
        d["tripStatus"] = d["trip_status"]
        d["driverName"] = d["driver_name"]
        d["driverPhone"] = d["driver_phone"]
        d["vehiclePlate"] = d["vehicle_plate"]
        d["estimatedFareUpto"] = d.get("estimated_fare_upto", "Custom Quote")
        d["pricingRule"] = d.get("pricing_rule", "")
        d["tripMode"] = d.get("trip_mode", "same_day")
        d["durationDays"] = int(d.get("duration_days", 1) or 1)
        d["serviceType"] = d.get("service_type", "outstation")
        d["createdAt"] = d["created_at"]
        bookings.append(d)
    conn.close()
    return jsonify(bookings)

@app.route("/api/bookings/my", methods=["GET"])
def get_my_bookings():
    phone = request.args.get("phone", "").strip()
    if not phone:
        return jsonify([])
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE phone LIKE ? ORDER BY created_at DESC", (f"%{phone}%",))
    rows = cursor.fetchall()
    bookings = []
    for r in rows:
        d = dict(r)
        d["id"] = d["id"]
        d["customerName"] = d["customer_name"]
        d["drop"] = d["drop_location"]
        d["date"] = d["travel_date"]
        d["time"] = d["travel_time"]
        d["vehicleName"] = d["vehicle_name"]
        d["vehicleId"] = d["vehicle_id"]
        d["paymentStatus"] = d["payment_status"]
        d["paymentMethod"] = d["payment_method"]
        d["tripStatus"] = d["trip_status"]
        d["driverName"] = d["driver_name"]
        d["driverPhone"] = d["driver_phone"]
        d["vehiclePlate"] = d["vehicle_plate"]
        d["estimatedFareUpto"] = d.get("estimated_fare_upto", "Custom Quote")
        d["pricingRule"] = d.get("pricing_rule", "")
        d["tripMode"] = d.get("trip_mode", "same_day")
        d["durationDays"] = int(d.get("duration_days", 1) or 1)
        d["serviceType"] = d.get("service_type", "outstation")
        d["createdAt"] = d["created_at"]
        bookings.append(d)
    conn.close()
    return jsonify(bookings)

@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.json or {}
    conn = get_db()
    cursor = conn.cursor()

    booking_id = data.get("id") or f"RTT-{datetime.now().year}-{abs(hash(str(datetime.now()))) % 9000 + 1000}"
    created_at = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO bookings (
        id, customer_name, phone, email, service_type, trip_mode, duration_days, pickup, drop_location,
        travel_date, travel_time, passengers, vehicle_id, vehicle_name, estimated_fare_upto, pricing_rule,
        payment_status, payment_method, trip_status, driver_id, driver_name,
        driver_phone, vehicle_plate, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id,
        data.get("customerName", "Guest"),
        data.get("phone", ""),
        data.get("email", ""),
        data.get("serviceType", "outstation"),
        data.get("tripMode", "same_day"),
        int(data.get("durationDays", 1)),
        data.get("pickup", ""),
        data.get("drop", ""),
        data.get("date", datetime.now().strftime("%Y-%m-%d")),
        data.get("time", "09:00 AM"),
        int(data.get("passengers", 4)),
        data.get("vehicleId", "innova-crysta"),
        data.get("vehicleName", "Toyota Innova Crysta"),
        data.get("estimatedFareUpto", "Custom Quote"),
        data.get("pricingRule", ""),
        data.get("paymentStatus", "Custom Quote / Pay to Driver"),
        data.get("paymentMethod", data.get("paymentMethod", "Pay on Arrival")),
        data.get("tripStatus", "Driver Assigned"),
        data.get("driverId", "drv-01"),
        data.get("driverName", "Kalu Singh Bankawat"),
        data.get("driverPhone", "9829837082"),
        data.get("vehiclePlate", "RJ 14 TA 7890"),
        data.get("notes", ""),
        created_at
    ))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "bookingId": booking_id, "message": "Booking saved to SQLite database"}), 201

@app.route("/api/bookings/<booking_id>/status", methods=["PUT"])
def update_booking_status(booking_id):
    data = request.json or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Missing status"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE bookings SET trip_status = ? WHERE id = ?", (new_status, booking_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "bookingId": booking_id, "status": new_status})

@app.route("/api/bookings/<booking_id>/driver", methods=["PUT"])
def update_booking_driver(booking_id):
    data = request.json or {}
    driver_id = data.get("driverId")
    driver_name = data.get("driverName")
    driver_phone = data.get("driverPhone")
    vehicle_plate = data.get("vehiclePlate")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE bookings 
    SET driver_id = ?, driver_name = ?, driver_phone = ?, vehicle_plate = ?, trip_status = 'Driver Assigned'
    WHERE id = ?
    """, (driver_id, driver_name, driver_phone, vehicle_plate, booking_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "bookingId": booking_id, "driverName": driver_name})

@app.route("/api/bookings/<booking_id>", methods=["DELETE"])
def delete_booking(booking_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Booking {booking_id} cancelled"})

@app.route("/api/inquiries", methods=["POST"])
def submit_inquiry():
    data = request.json or {}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO inquiries (name, phone, service_type, message, status, created_at)
    VALUES (?, ?, ?, ?, 'New', ?)
    """, (
        data.get("name", ""),
        data.get("phone", ""),
        data.get("serviceType", "General Inquiry"),
        data.get("message", ""),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Inquiry recorded in database"}), 201

@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM bookings")
    total_bookings = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM bookings WHERE trip_status IN ('Driver Assigned', 'Driver on Way', 'Trip Started')")
    active_trips = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM bookings WHERE trip_status = 'Completed'")
    completed_trips = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM fleet WHERE available = 1")
    available_fleet = cursor.fetchone()[0]

    conn.close()
    return jsonify({
        "totalBookings": total_bookings,
        "activeTrips": active_trips,
        "completedTrips": completed_trips,
        "availableFleet": available_fleet
    })

if __name__ == "__main__":
    from database.init_db import init_database
    init_database()
    print("Serving Rajputana Tour & Travellers on http://localhost:8080 with SQLite DB backend...")
    app.run(host="0.0.0.0", port=8080, debug=False)
