"""
Rajputana Tour & Travellers - SQLite Database Initialization & Seeding
Creates production relational database schema for fleet, drivers, tours, services, route_rates, bookings, and inquiries.
Stores transparent pricing rules:
- Same Day Drop: Calculated on actual Kilometers (KM * Rate/KM) with Zero Night Charge.
- Multi-Day Tour: Calculated on 250 KM/Day minimum running + Driver Night Allowance extra.
- All display prices formatted as "Up to ₹..."
"""

import sqlite3
import os
import json

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "rajputana.db")

def init_database():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Drop tables to recreate with updated rich schema if structure changed
    cursor.execute("DROP TABLE IF EXISTS fleet")
    cursor.execute("DROP TABLE IF EXISTS tour_packages")
    cursor.execute("DROP TABLE IF EXISTS route_rates")
    cursor.execute("DROP TABLE IF EXISTS bookings")
    cursor.execute("DROP TABLE IF EXISTS drivers")

    # 1. Fleet Table (with transparent per-KM rates and night charges)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fleet (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        seats INTEGER NOT NULL,
        luggage TEXT NOT NULL,
        ac INTEGER DEFAULT 1,
        rate_per_km REAL NOT NULL,
        min_km_per_day INTEGER DEFAULT 250,
        night_charge REAL DEFAULT 300,
        features TEXT NOT NULL,
        badge TEXT,
        image TEXT NOT NULL,
        available INTEGER DEFAULT 1
    )
    """)

    # 2. Drivers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        phone TEXT NOT NULL,
        rating REAL DEFAULT 5.0,
        trips_completed INTEGER DEFAULT 0,
        assigned_vehicle TEXT,
        license TEXT,
        status TEXT DEFAULT 'Available'
    )
    """)

    # 3. Services Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_hi TEXT,
        icon TEXT NOT NULL,
        description TEXT NOT NULL,
        badge TEXT NOT NULL,
        display_order INTEGER DEFAULT 0
    )
    """)

    # 4. Tour Packages Table (with Up to ₹ pricing and rule badges)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tour_packages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_hi TEXT,
        duration TEXT NOT NULL,
        trip_mode TEXT NOT NULL, -- 'same_day' or 'multi_day'
        days INTEGER DEFAULT 1,
        nights INTEGER DEFAULT 0,
        min_km INTEGER DEFAULT 250,
        price_upto TEXT NOT NULL,
        pricing_rule TEXT NOT NULL,
        pricing_detail TEXT,
        tag TEXT,
        cover TEXT NOT NULL,
        highlights TEXT NOT NULL,
        includes TEXT NOT NULL
    )
    """)

    # 5. Route Rates Table (Same Day Actual KM vs Multi-Day 250 KM/day)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS route_rates (
        id TEXT PRIMARY KEY,
        from_city TEXT NOT NULL,
        to_city TEXT NOT NULL,
        distance_km INTEGER NOT NULL,
        duration_hours TEXT NOT NULL,
        sedan_rate_km REAL DEFAULT 11,
        suv_rate_km REAL DEFAULT 18,
        tempo_rate_km REAL DEFAULT 24,
        sedan_same_day_upto TEXT NOT NULL,
        suv_same_day_upto TEXT NOT NULL,
        tempo_same_day_upto TEXT NOT NULL,
        toll_info TEXT
    )
    """)

    # 6. Bookings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        service_type TEXT,
        trip_mode TEXT DEFAULT 'same_day',
        duration_days INTEGER DEFAULT 1,
        pickup TEXT NOT NULL,
        drop_location TEXT NOT NULL,
        travel_date TEXT NOT NULL,
        travel_time TEXT,
        passengers INTEGER DEFAULT 1,
        vehicle_id TEXT,
        vehicle_name TEXT,
        estimated_fare_upto TEXT,
        pricing_rule TEXT,
        payment_status TEXT DEFAULT 'Custom Quote / Pay to Driver',
        payment_method TEXT DEFAULT 'Pay on Arrival',
        trip_status TEXT DEFAULT 'Confirmed',
        driver_id TEXT,
        driver_name TEXT,
        driver_phone TEXT,
        vehicle_plate TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 7. Inquiries / Quotes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        service_type TEXT,
        message TEXT,
        status TEXT DEFAULT 'New',
        created_at TEXT NOT NULL
    )
    """)

    # -------------------------------------------------------------
    # SEED DATA
    # -------------------------------------------------------------

    # Fleet data
    fleet_data = [
        ("swift-dzire", "Maruti Suzuki Dzire", "Prime Sedan", 4, "2 Medium Bags", 1,
         11.0, 250, 300.0,
         json.dumps(["Chilled Dual AC", "Comfortable Legroom", "Bluetooth Audio", "Sanitized Cab", "Experienced Chauffeur"]),
         "Best Value Sedan", "assets/swift_dzire.jpeg", 1),
        
        ("hyundai-aura", "Hyundai Aura", "Executive Sedan", 4, "2 Medium Bags", 1,
         11.0, 250, 300.0,
         json.dumps(["Smooth Ride", "Chilled AC", "Mobile Fast Charger", "Clean Seat Covers", "City & Outstation"]),
         "Comfort Sedan", "assets/hyundai_aura.jpeg", 1),

        ("innova-crysta", "Toyota Innova Crysta", "Luxury SUV", 7, "4 Large Bags", 1, 
         18.0, 250, 350.0,
         json.dumps(["Push-back Captain Seats", "Dual Chilled AC", "Fast USB Chargers", "Spacious Boot", "First Aid Kit", "Bottle Holder"]),
         "Most Popular for Families", "assets/innova_crysta.jpeg", 1),

        ("tempo-traveller", "Force Tempo Traveller", "Luxury Minibus / Van", 12, "8 Large Bags", 1,
         24.0, 300, 500.0,
         json.dumps(["1x1 Pushback Recliner Seats", "Roof AC Vents", "LED TV & Surround Sound", "Ample Luggage Carrier", "Curtains & Ice Box"]),
         "Ideal for Large Groups & Weddings", "assets/tempo_traveller.jpeg", 1)
    ]
    cursor.executemany("INSERT INTO fleet VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", fleet_data)

    # Tour Packages with strict "Up to ₹..." and rule badges
    tours_data = [
        ("jaipur-darshan", "Jaipur Full Day Royal Darshan", "जयपुर एक दिवसीय सम्पूर्ण शाही दर्शन",
         "1 Day (8-9 Hours)", "same_day", 1, 0, 80,
         "Up to ₹2,400",
         "Same Day Drop: Calculated on actual sightseeing circuit KM (Zero Night Charge)",
         "Covers Amber Fort, Jal Mahal, Hawa Mahal, City Palace, Jantar Mantar & Albert Hall. Includes chilled AC cab, fuel and parking.",
         "Best Seller", "assets/hero_rajasthan.png",
         json.dumps(["Amber Fort (Amer) & Elephant Sanctuary View", "Jal Mahal (Water Palace) Photo stop", "Hawa Mahal (Palace of Winds)", "City Palace & Royal Museum", "Jantar Mantar (UNESCO Observatory)", "Albert Hall Museum & Light Show"]),
         json.dumps(["Chilled AC Private Car", "Commercial Fuel & Parking", "Uniformed Driver Cum Guide", "Pickup & Drop at Hotel/Airport/Station", "Zero Hidden Fees"])),

        ("golden-triangle", "Golden Triangle Tour (Jaipur - Agra - Delhi)", "स्वर्ण त्रिभुज टूर (जयपुर - आगरा - दिल्ली)",
         "4 Days / 3 Nights", "multi_day", 4, 3, 1000,
         "Up to ₹14,500",
         "Multi-Day Tour: 250 KM/Day Rule (1,000 KM Min) + 3 Nights Driver Allowance",
         "4 Days running billed at minimum 250 KM per day (Total 1,000 KM min. allowance). Driver night charges extra included for 3 nights.",
         "International Favorite", "assets/hero_rajasthan.png",
         json.dumps(["Jaipur: Amer Fort, Hawa Mahal, City Palace", "Enroute: Abhaneri Stepwell (Chand Baori) & Fatehpur Sikri", "Agra: Taj Mahal Sunrise Visit, Agra Fort", "Delhi: India Gate, Qutub Minar, Lotus Temple, Red Fort"]),
         json.dumps(["All Inter-state Tolls & Taxes Included", "Chilled AC Vehicle for 4 Days", "Driver Night Allowances Included", "Door-to-door Transfers", "24x7 Trip Concierge"])),

        ("rajasthan-grandeur", "Royal Rajasthan Grand Circuit", "शाही राजस्थान महायात्रा (6 रातें / 7 दिन)",
         "7 Days / 6 Nights", "multi_day", 7, 6, 1750,
         "Up to ₹26,900",
         "Multi-Day Tour: 250 KM/Day Rule (1,750 KM Min) + 6 Nights Driver Allowance",
         "7 Days comprehensive tour billed at minimum 250 KM/day (1,750 KM min allowance). Driver night stay allowance included for 6 nights.",
         "Comprehensive Tour", "assets/hero_rajasthan.png",
         json.dumps(["Jaipur (2N) -> Ajmer Dargah & Pushkar Holy Lake", "Jodhpur (1N): Mehrangarh Fort & Umaid Bhawan", "Jaisalmer (2N): Living Fort, Sam Sand Dunes & Camel Safari", "Udaipur (1N): Lake Pichola Boat Ride, City Palace"]),
         json.dumps(["Complete Interstate Cab with Commercial Fuel", "Driver Allowance for 7 Days & 6 Nights", "Customizable Itinerary & Flexible Halts", "24x7 Trip Support Desk"])),

        ("desert-safari", "Jodhpur & Jaisalmer Desert Adventure", "जोधपुर और जैसलमेर मरुस्थल रोमांच",
         "4 Days / 3 Nights", "multi_day", 4, 3, 1000,
         "Up to ₹16,800",
         "Multi-Day Tour: 250 KM/Day Rule (1,000 KM Min) + 3 Nights Driver Allowance",
         "4 Days royal desert circuit billed on 250 KM/day minimum rule (1,000 KM). Driver night charges included for 3 nights.",
         "Winter Special", "assets/hero_rajasthan.png",
         json.dumps(["Mehrangarh Fort & Jaswant Thada in Jodhpur", "Thar Desert Sunset, Camel Ride & Cultural Folk Dance", "Jaisalmer Living Fort & Patwon Ki Haveli", "Ghost Village of Kuldhara Exploration"]),
         json.dumps(["Dedicated SUV / Sedan with Driver", "All Tolls, Parking & Interstate Taxes", "Desert Camp Coordination Support", "Doorstep Pickup & Drop at Jaipur/Jodhpur"]))
    ]
    cursor.executemany("INSERT INTO tour_packages VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", tours_data)

    # Route Rates (Distance, Same Day Up to Pricing with Min 250 KM Running Rule)
    routes_data = [
        ("jaipur-pushkar", "Jaipur", "Pushkar & Ajmer", 145, "2.5 Hours", 11.0, 18.0, 24.0, "Up to ₹2,750", "Up to ₹4,500", "Up to ₹7,200", "Min. 250 KM Rule Applied • Toll Extra"),
        ("jaipur-udaipur", "Jaipur", "Udaipur (Lake City)", 395, "6.5 Hours", 11.0, 18.0, 24.0, "Up to ₹4,350", "Up to ₹7,150", "Up to ₹9,500", "395 KM (250 KM Min + 145 Extra KM)"),
        ("jaipur-jodhpur", "Jaipur", "Jodhpur (Sun City)", 335, "5.5 Hours", 11.0, 18.0, 24.0, "Up to ₹3,700", "Up to ₹6,050", "Up to ₹8,050", "335 KM (250 KM Min + 85 Extra KM)"),
        ("jaipur-jaisalmer", "Jaipur", "Jaisalmer (Thar Desert)", 560, "9.5 Hours", 11.0, 18.0, 24.0, "Up to ₹6,200", "Up to ₹10,100", "Up to ₹13,450", "560 KM (250 KM Min + 310 Extra KM)"),
        ("jaipur-ranthambore", "Jaipur", "Ranthambore (Tiger Safari)", 160, "3.5 Hours", 11.0, 18.0, 24.0, "Up to ₹2,750", "Up to ₹4,500", "Up to ₹7,200", "Min. 250 KM Rule Applied"),
        ("jaipur-delhi", "Jaipur", "Delhi NCR (Airport/City)", 275, "4.5 Hours", 11.0, 18.0, 24.0, "Up to ₹3,050", "Up to ₹4,950", "Up to ₹6,600", "275 KM (250 KM Min + 25 Extra KM)"),
        ("jaipur-agra", "Jaipur", "Agra (Taj Mahal)", 240, "4.0 Hours", 11.0, 18.0, 24.0, "Up to ₹2,750", "Up to ₹4,500", "Up to ₹7,200", "Min. 250 KM Rule Applied"),
        ("jaipur-khatu", "Jaipur", "Khatu Shyam Ji & Salasar", 180, "3.5 Hours", 11.0, 18.0, 24.0, "Up to ₹2,750", "Up to ₹4,500", "Up to ₹7,200", "Min. 250 KM Rule Applied")
    ]
    cursor.executemany("INSERT INTO route_rates VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", routes_data)

    # Drivers data (Only 2 Founders & Chauffeurs: Kalu Singh Bankawat & Kuldeep Singh Bankawat)
    cursor.execute("SELECT COUNT(*) FROM drivers")
    if cursor.fetchone()[0] == 0:
        drivers_data = [
            ("drv-01", "Kalu Singh Bankawat", "Lead Chauffeur & Co-Founder", "9829837082", 4.98, 1420, "Toyota Innova Crysta (RJ 14 TA 7890)", "RJ14-2012004812", "Available"),
            ("drv-02", "Kuldeep Singh Bankawat", "Senior Driver & Route Specialist", "8107841422", 4.97, 1280, "Maruti Dzire / Innova (RJ 14 TC 2341)", "RJ14-2015009142", "Available")
        ]
        cursor.executemany("INSERT INTO drivers VALUES (?,?,?,?,?,?,?,?,?)", drivers_data)

    # Services data
    cursor.execute("SELECT COUNT(*) FROM services")
    if cursor.fetchone()[0] == 0:
        services_data = [
            ("local-sightseeing", "Jaipur Local Sightseeing", "जयपुर स्थानीय दर्शन", "🏰",
             "Explore Amber Fort, Hawa Mahal, City Palace, Jal Mahal & Jantar Mantar with our knowledgeable chauffeur-guides.",
             "Same Day Drop: Actual KM Rate • Zero Night Charge", 1),
            ("outstation-taxi", "Rajasthan Outstation Taxi", "आउटस्टेशन टैक्सी सेवा", "🛣️",
             "One-way & round-trip cabs from Jaipur to Udaipur, Jodhpur, Jaisalmer, Pushkar, Mount Abu, Delhi and Agra.",
             "Same Day KM or Multi-Day 250 KM/Day Rule", 2),
            ("airport-transfer", "Jaipur Airport Transfers (JAI)", "जयपुर एयरपोर्ट ट्रांसफर", "✈️",
             "24x7 punctual pickups and drops with flight tracking. Placard pickup at arrival gate for hassle-free start.",
             "Point-to-Point Actual Distance • Transparent Billing", 3),
            ("tempo-traveller", "Luxury Tempo Travellers", "लग्जरी टेम्पो ट्रैवलर", "🚐",
             "12, 17 & 20 Seater Force Tempo Travellers with Maharaja recliner seats, roof AC, LED TV and huge luggage boot.",
             "Multi-Day Group Special • 300 KM/Day Rule", 4),
            ("weddings-events", "Weddings & Event Fleet", "विवाह एवं भव्य आयोजन फ्लीट", "🎉",
             "Complete guest transportation for destination weddings in Jaipur, Udaipur, and Jodhpur. Dedicated transport manager.",
             "Grand Convoys • Tailored Itineraries", 5),
            ("international-tourist", "International Tourist Services", "विदेशी पर्यटकों हेतु सेवा", "🌍",
             "English-speaking polite drivers, international card payments, packaged mineral water, and custom heritage itineraries.",
             "Verified Chauffeur • Custom Heritage Tour", 6)
        ]
        cursor.executemany("INSERT INTO services VALUES (?,?,?,?,?,?,?)", services_data)

    # Initial bookings data
    cursor.execute("SELECT COUNT(*) FROM bookings")
    if cursor.fetchone()[0] == 0:
        bookings_data = [
            ("RTT-2026-1042", "Rahul Sharma", "9876543210", "rahul.sharma@gmail.com", "outstation", "same_day", 1,
             "Civil Lines, Jaipur", "Lake Palace Road, Udaipur", "2026-10-18", "06:30 AM", 4,
             "innova-crysta", "Toyota Innova Crysta", "Up to ₹7,200", "Same Day Drop: 395 KM actual distance rate",
             "Advance Confirmed (Razorpay)", "Razorpay UPI", "Driver Assigned",
             "drv-01", "Kalu Singh Bankawat", "9829837082", "RJ 14 TA 7890",
             "Family trip. Needs child safety seat and extra luggage space.", "2026-10-15T10:30:00Z"),
            ("RTT-2026-1043", "David Miller", "9988776655", "david.miller@uktravel.co", "local", "same_day", 1,
             "ITC Rajputana, Jaipur", "Jaipur Full Day Sightseeing (Amer, Hawa Mahal, City Palace)", "2026-10-17", "09:00 AM", 2,
             "swift-dzire", "Maruti Suzuki Dzire", "Up to ₹2,400", "Same Day Drop: Local circuit sightseeing (80 KM)",
             "Fully Confirmed", "International Card", "Confirmed",
             "drv-02", "Kuldeep Singh Bankawat", "8107841422", "RJ 14 TC 2341",
             "International guest. English speaking driver required.", "2026-10-16T08:15:00Z"),
            ("RTT-2026-1044", "Pooja Singhania", "9123456780", "pooja.singhania@weddingevent.in", "outstation", "multi_day", 4,
             "Jaipur International Airport (JAI)", "Jodhpur & Jaisalmer Circuit", "2026-10-19", "02:00 PM", 12,
             "tempo-traveller", "Force Tempo Traveller", "Up to ₹30,300", "Multi-Day Tour: 4 Days × 300 KM/Day Min + 3 Nights Driver Allowance",
             "Advance Confirmed", "UPI", "Driver Assigned",
             "drv-01", "Kalu Singh Bankawat", "9829837082", "RJ 14 TA 7890",
             "Wedding guests transfer with large baggage.", "2026-10-16T14:45:00Z")
        ]
        cursor.executemany("INSERT INTO bookings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", bookings_data)

    conn.commit()
    conn.close()
    print(f"Database initialized and seeded successfully at: {DB_PATH}")

if __name__ == "__main__":
    init_database()
