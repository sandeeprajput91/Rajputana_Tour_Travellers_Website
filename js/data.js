/**
 * Rajputana Tour & Travellers - Core Master Data & Knowledge Engine
 * Production Grade Data Store for Fleet, Tours, Routes, Drivers & AI Assistant
 */

const RTT_DATA = {
  company: {
    name: "Rajputana Tour & Travellers",
    hindiName: "राजपूताना टूर एंड ट्रेवलर्स",
    tagline: "Rajasthan Taxi & Tempo Traveller Booking",
    hindiTagline: "राजस्थान टैक्सी एवं टेम्पो ट्रैवलर बुकिंग सेवा",
    slogan: "Royal Journeys, Trusted Chauffeurs, All India Service",
    phone1: "9829837082",
    phone2: "8107841422",
    whatsapp1: "919829837082",
    whatsapp2: "918107841422",
    email: "bannasandeep7568@gmail.com",
    address: "Plot No. 14, Rajputana House, Opp. Sindhi Camp / Airport Link Road, Jaipur, Rajasthan - 302001",
    serviceArea: "Jaipur, All Rajasthan & All India",
    established: "2014",
    experienceYears: "10+ Years of Excellence"
  },

  fleet: [
    {
      id: "innova-crysta",
      name: "Toyota Innova Crysta",
      type: "Luxury SUV",
      seats: 7,
      luggage: "4 Large Bags",
      ac: true,
      ratePerKm: 18,
      minKmPerDay: 250,
      driverAllowance: 350,
      halfDayLocal: 2400, // 4hrs 40km
      fullDayLocal: 3600, // 8hrs 80km
      airportTransfer: 1199,
      image: "assets/innova_crysta.jpeg",
      features: ["Push-back Captain Seats", "Dual AC Vents", "Fast USB Chargers", "Spacious Boot", "First Aid Kit", "Bottle Holder"],
      badge: "Most Popular for Families",
      available: true
    },
    {
      id: "swift-dzire",
      name: "Maruti Suzuki Dzire",
      type: "Prime Sedan",
      seats: 4,
      luggage: "2 Medium Bags",
      ac: true,
      ratePerKm: 11,
      minKmPerDay: 250,
      driverAllowance: 300,
      halfDayLocal: 1400,
      fullDayLocal: 2200,
      airportTransfer: 699,
      image: "assets/swift_dzire.jpeg",
      features: ["Chilled AC", "Comfortable Legroom", "Music System", "Sanitized Cab", "Experienced Chauffeur"],
      badge: "Best Value for Couples & Solo",
      available: true
    },
    {
      id: "hyundai-aura",
      name: "Hyundai Aura",
      type: "Executive Sedan",
      seats: 4,
      luggage: "2 Medium Bags",
      ac: true,
      ratePerKm: 11,
      minKmPerDay: 250,
      driverAllowance: 300,
      halfDayLocal: 1400,
      fullDayLocal: 2200,
      airportTransfer: 699,
      image: "assets/hyundai_aura.jpeg",
      features: ["Smooth Ride", "Chilled AC", "Mobile Charging", "Clean Seat Covers", "City & Outstation"],
      badge: "Comfort Sedan",
      available: true
    },
    {
      id: "tempo-traveller",
      name: "Force Tempo Traveller",
      type: "Luxury Minibus / Van",
      seats: 12,
      luggage: "8 Large Bags",
      ac: true,
      ratePerKm: 24,
      minKmPerDay: 300,
      driverAllowance: 500,
      halfDayLocal: 3800,
      fullDayLocal: 5600,
      airportTransfer: 1899,
      image: "assets/tempo_traveller.jpeg",
      features: ["1x1 Pushback Recliner Seats", "Roof AC Vents", "LED TV & Surround Sound", "Ample Luggage Carrier", "Curtains & Ice Box"],
      badge: "Ideal for Large Groups & Weddings",
      available: true
    }
  ],

  popularRoutes: [
    { from: "Jaipur", to: "Pushkar & Ajmer", distanceKm: 145, duration: "2.5 hrs", toll: 180, popularVehicle: "Swift Dzire", estimateSedan: 2900, estimateSuv: 4200 },
    { from: "Jaipur", to: "Udaipur", distanceKm: 395, duration: "6.5 hrs", toll: 420, popularVehicle: "Innova Crysta", estimateSedan: 5800, estimateSuv: 8200 },
    { from: "Jaipur", to: "Jodhpur", distanceKm: 335, duration: "5.5 hrs", toll: 380, popularVehicle: "Innova Crysta", estimateSedan: 4900, estimateSuv: 7100 },
    { from: "Jaipur", to: "Jaisalmer", distanceKm: 560, duration: "9.5 hrs", toll: 550, popularVehicle: "Innova Crysta", estimateSedan: 8400, estimateSuv: 11900 },
    { from: "Jaipur", to: "Ranthambore", distanceKm: 160, duration: "3.5 hrs", toll: 210, popularVehicle: "Swift Dzire", estimateSedan: 3200, estimateSuv: 4600 },
    { from: "Jaipur", to: "Delhi NCR", distanceKm: 275, duration: "4.5 hrs", toll: 450, popularVehicle: "Innova Crysta", estimateSedan: 4200, estimateSuv: 6300 },
    { from: "Jaipur", to: "Agra (Taj Mahal)", distanceKm: 240, duration: "4.0 hrs", toll: 360, popularVehicle: "Swift Dzire", estimateSedan: 3800, estimateSuv: 5500 },
    { from: "Jaipur", to: "Khatu Shyam Ji & Salasar", distanceKm: 180, duration: "3.5 hrs", toll: 190, popularVehicle: "Innova Crysta", estimateSedan: 3500, estimateSuv: 4900 }
  ],

  tourPackages: [
    {
      id: "jaipur-darshan",
      title: "Jaipur Full Day Royal Darshan",
      hindiTitle: "जयपुर एक दिवसीय सम्पूर्ण शाही दर्शन",
      duration: "1 Day (8-9 Hours)",
      trip_mode: "same_day",
      days: 1,
      nights: 0,
      price_upto: "Up to ₹2,400",
      pricing_rule: "Same Day Drop: Calculated on actual sightseeing circuit KM (Zero Night Charge)",
      tag: "Best Seller",
      cover: "assets/hero_rajasthan.png",
      highlights: [
        "Amber Fort (Amer) & Elephant Sanctuary View",
        "Jal Mahal (Water Palace) Photo stop",
        "Hawa Mahal (Palace of Winds)",
        "City Palace & Royal Museum",
        "Jantar Mantar (UNESCO World Heritage Observatory)",
        "Albert Hall Museum & Evening Light Show"
      ],
      includes: ["Chilled AC Private Car", "Fuel & Parking", "Uniformed Driver Cum Guide", "Pickup & Drop at Hotel/Airport"]
    },
    {
      id: "golden-triangle",
      title: "Golden Triangle Tour (Jaipur - Agra - Delhi)",
      hindiTitle: "स्वर्ण त्रिभुज टूर (जयपुर - आगरा - दिल्ली)",
      duration: "4 Days / 3 Nights",
      trip_mode: "multi_day",
      days: 4,
      nights: 3,
      price_upto: "Up to ₹14,500",
      pricing_rule: "Multi-Day Tour: 250 KM/Day Rule (1,000 KM Min) + 3 Nights Driver Allowance",
      tag: "International Favorite",
      cover: "assets/hero_rajasthan.png",
      highlights: [
        "Jaipur: Amer Fort, Hawa Mahal, City Palace",
        "Enroute: Abhaneri Stepwell (Chand Baori) & Fatehpur Sikri",
        "Agra: Taj Mahal Sunrise Visit, Agra Fort",
        "Delhi: India Gate, Qutub Minar, Lotus Temple, Red Fort"
      ],
      includes: ["All Inter-state Tolls & Taxes", "Chilled AC Vehicle for 4 Days", "Driver Night Allowances", "Door-to-door Transfers"]
    },
    {
      id: "rajasthan-grandeur",
      title: "Royal Rajasthan Grand Circuit",
      hindiTitle: "शाही राजस्थान महायात्रा (6 रातें / 7 दिन)",
      duration: "7 Days / 6 Nights",
      trip_mode: "multi_day",
      days: 7,
      nights: 6,
      price_upto: "Up to ₹26,900",
      pricing_rule: "Multi-Day Tour: 250 KM/Day Rule (1,750 KM Min) + 6 Nights Driver Allowance",
      tag: "Comprehensive Tour",
      cover: "assets/hero_rajasthan.png",
      highlights: [
        "Jaipur (2 Nights) -> Ajmer Dargah & Pushkar Holy Lake",
        "Jodhpur (1 Night): Mehrangarh Fort & Umaid Bhawan",
        "Jaisalmer (2 Nights): Golden Fort, Sam Sand Dunes & Camel Safari",
        "Udaipur (1 Night): Lake Pichola Boat Ride, City Palace"
      ],
      includes: ["Complete Interstate Cab with Fuel", "Driver Allowance for 7 Days", "Customizable Itinerary", "24x7 Trip Concierge Support"]
    },
    {
      id: "desert-safari",
      title: "Jodhpur & Jaisalmer Desert Adventure",
      hindiTitle: "जोधपुर और जैसलमेर मरुस्थल रोमांच",
      duration: "4 Days / 3 Nights",
      trip_mode: "multi_day",
      days: 4,
      nights: 3,
      price_upto: "Up to ₹16,800",
      pricing_rule: "Multi-Day Tour: 250 KM/Day Rule (1,000 KM Min) + 3 Nights Driver Allowance",
      tag: "Winter Special",
      cover: "assets/hero_rajasthan.png",
      highlights: [
        "Mehrangarh Fort & Jaswant Thada in Jodhpur",
        "Thar Desert Sunset, Camel Ride & Cultural Folk Dance",
        "Jaisalmer Living Fort & Patwon Ki Haveli",
        "Ghost Village of Kuldhara Exploration"
      ],
      includes: ["Dedicated SUV / Sedan with Driver", "All Tolls, Parking & Taxes", "Desert Camp Coordination", "Pickup & Drop at Jaipur/Jodhpur"]
    }
  ],

  drivers: [
    {
      id: "drv-01",
      name: "Kalu Singh Bankawat",
      role: "Lead Chauffeur & Co-Founder",
      phone: "9829837082",
      rating: 4.98,
      tripsCompleted: 1420,
      languages: ["Hindi", "Rajasthani", "Basic English"],
      assignedVehicle: "Toyota Innova Crysta (RJ 14 TA 7890)",
      license: "RJ14-2012004812",
      status: "Available"
    },
    {
      id: "drv-02",
      name: "Kuldeep Singh Bankawat",
      role: "Senior Driver & Route Specialist",
      phone: "8107841422",
      rating: 4.97,
      tripsCompleted: 1280,
      languages: ["Hindi", "English", "Rajasthani"],
      assignedVehicle: "Maruti Dzire / Innova (RJ 14 TC 2341)",
      license: "RJ14-2015009142",
      status: "Available"
    }
  ],

  initialBookings: [
    {
      id: "RTT-2026-1042",
      customerName: "Rahul Sharma",
      phone: "9876543210",
      email: "rahul.sharma@gmail.com",
      serviceType: "outstation",
      pickup: "Civil Lines, Jaipur",
      drop: "Lake Palace Road, Udaipur",
      date: "2026-10-18",
      time: "06:30 AM",
      passengers: 4,
      vehicleId: "innova-crysta",
      vehicleName: "Toyota Innova Crysta",
      totalFare: 8400,
      advancePaid: 1680,
      paymentStatus: "Advance Paid (Razorpay: pay_Okx721A)",
      paymentMethod: "Razorpay UPI",
      tripStatus: "Driver Assigned",
      driverId: "drv-01",
      driverName: "Kalu Singh Bankawat",
      driverPhone: "9829837082",
      vehiclePlate: "RJ 14 TA 7890",
      notes: "Family trip. Needs child safety seat and extra luggage space.",
      createdAt: "2026-10-15T10:30:00Z"
    },
    {
      id: "RTT-2026-1043",
      customerName: "David Miller",
      phone: "9988776655",
      email: "david.miller@uktravel.co",
      serviceType: "local",
      pickup: "ITC Rajputana, Jaipur",
      drop: "Jaipur Full Day Sightseeing (Amer, Hawa Mahal, City Palace)",
      date: "2026-10-17",
      time: "09:00 AM",
      passengers: 2,
      vehicleId: "swift-dzire",
      vehicleName: "Maruti Suzuki Dzire",
      totalFare: 2200,
      advancePaid: 2200,
      paymentStatus: "Full Paid (Razorpay: pay_Lmn449B)",
      paymentMethod: "International Card",
      tripStatus: "Confirmed",
      driverId: "drv-02",
      driverName: "Kuldeep Singh Bankawat",
      driverPhone: "8107841422",
      vehiclePlate: "RJ 14 TC 2341",
      notes: "International guest. English speaking driver required.",
      createdAt: "2026-10-16T08:15:00Z"
    },
    {
      id: "RTT-2026-1044",
      customerName: "Pooja Singhania",
      phone: "9123456780",
      email: "pooja.singhania@weddingevent.in",
      serviceType: "wedding",
      pickup: "Jaipur International Airport (JAI)",
      drop: "Fairmont Hotel, Kukas, Jaipur",
      date: "2026-10-19",
      time: "02:00 PM",
      passengers: 12,
      vehicleId: "tempo-traveller",
      vehicleName: "Force Tempo Traveller",
      totalFare: 4500,
      advancePaid: 1000,
      paymentStatus: "Advance Paid (Razorpay: pay_Wdg902C)",
      paymentMethod: "UPI",
      tripStatus: "Driver Assigned",
      driverId: "drv-01",
      driverName: "Kalu Singh Bankawat",
      driverPhone: "9829837082",
      vehiclePlate: "RJ 14 TA 7890",
      notes: "Wedding guests transfer with large baggage.",
      createdAt: "2026-10-16T14:45:00Z"
    }
  ],

  // AI Knowledge Base tailored strictly for Rajputana Tour & Travellers
  aiKnowledge: {
    systemPrompt: "You are Rajputana Travel Genie, the official tour, cab and travel consultant for Rajputana Tour & Travellers, Jaipur. You only assist with Rajasthan travel, taxi booking, tour packages, Tempo Traveller, airport pickup, sightseeing itineraries, and company services.",
    intents: [
      {
        keywords: ["jaipur sightseeing", "local tour", "places to visit in jaipur", "amer fort", "hawa mahal", "1 day tour"],
        en: "Our **Jaipur Royal Full Day Sightseeing (8 Hours / 80 Km)** covers Amber Fort, Jal Mahal, Hawa Mahal, City Palace, Jantar Mantar, and Albert Hall Museum. We offer private Sedans, luxury Innova Crysta, and Tempo Travellers with pickup and drop anywhere in Jaipur included at guaranteed best rates!",
        hi: "हमारा **जयपुर सम्पूर्ण दर्शन (8 घंटे / 80 किमी)** आमेर किला, जल महल, हवा महल, सिटी पैलेस, जंतर मंतर और अल्बर्ट हॉल को कवर करता है। हम सेडान, लग्जरी इनोवा क्रिस्टा एवं टेम्पो ट्रैवलर पर होटल/एयरपोर्ट पिकअप सहित सबसे किफायती दरों पर गाड़ियाँ उपलब्ध कराते हैं!"
      },
      {
        keywords: ["fare", "rate", "cost", "price", "per km", "charges", "how much"],
        en: "We offer 100% transparent, personalized quotations with **zero hidden charges**! Rates depend on vehicle category (Sedan, Innova Crysta, Tempo Traveller) and trip duration. Click 'Book Cab' or call **+91 9829837082** for an instant best-rate quote!",
        hi: "हम बिना किसी छुपे शुल्क के 100% पारदर्शी कोटेशन प्रदान करते हैं! दरें गाड़ी की श्रेणी (सेडान, इनोवा, टेम्पो ट्रैवलर) और दूरी पर आधारित होती हैं। तुरंत सर्वश्रेष्ठ कोटेशन के लिए 'Book Cab' पर क्लिक करें या **9829837082** पर संपर्क करें!"
      },
      {
        keywords: ["udaipur", "jaipur to udaipur", "udaipur cab", "lake city"],
        en: "Jaipur to Udaipur is approx. 395 km (6.5 hours). We provide reliable one-way and round-trip cabs with optional sightseeing stops at Chittorgarh Fort or Nathdwara Shrinathji enroute. Instant quote available on booking!",
        hi: "जयपुर से उदयपुर लगभग 395 किमी (6.5 घंटे) है। हम वन-वे व राउंड-ट्रिप के लिए आरामदायक एसी गाड़ियाँ उपलब्ध कराते हैं। रास्ते में चित्तौड़गढ़ या नाथद्वारा दर्शन भी कराए जा सकते हैं!"
      },
      {
        keywords: ["jodhpur", "jaisalmer", "desert", "sam sand dunes", "camel safari"],
        en: "For Jodhpur & Jaisalmer, we offer customized **Desert Safari & Heritage Packages** covering Mehrangarh Fort, Umaid Bhawan, Jaisalmer Living Fort, Sam Sand Dunes sunset, camel safari, and Rajasthani cultural folk dance.",
        hi: "जोधपुर और जैसलमेर के लिए हमारा कस्टमाइज्ड **डेजर्ट सफारी पैकेज** उपलब्ध है, जिसमें मेहरानगढ़ किला, जैसलमेर किला, सैम सैंड ड्यून्स पर ऊंट की सवारी व लोक नृत्य शामिल हैं।"
      },
      {
        keywords: ["tempo traveller", "group", "family trip", "12 seater", "17 seater", "bus"],
        en: "We offer luxury 12, 17, and 20 seater Force Tempo Travellers with 1x1 Maharaja pushback recliner seats, individual AC vents, LED screen, icebox, and huge luggage boot. Perfect for family reunions, pilgrimages, and weddings at group discount rates!",
        hi: "हमारे पास 12, 17 और 20 सीटर लग्जरी टेम्पो ट्रैवलर उपलब्ध हैं जिनमें महाराजा पुशबैक सीटें, व्यक्तिगत एसी, एलईडी टीवी और बड़ा लगेज स्पेस है। परिवार और ग्रुप टूर के लिए विशेष डिस्काउंट उपलब्ध है!"
      },
      {
        keywords: ["airport", "airport transfer", "pickup", "drop", "flight"],
        en: "We provide 24x7 guaranteed on-time Jaipur Airport (JAI) pickups & drops. Flight tracking is included so our chauffeur is waiting with your name placard even if your flight is delayed!",
        hi: "जयपुर एयरपोर्ट (JAI) के लिए हमारी 24x7 टैक्सी सेवा उपलब्ध है। फ्लाइट देरी होने पर भी ड्राइवर आपका नाम बोर्ड लिए तैयार रहेगा!"
      },
      {
        keywords: ["international", "foreign", "tourist", "english", "uk", "usa", "europe"],
        en: "Namaste! We warmly welcome international travelers. We provide 100% verified, polite, English-speaking chauffeurs, chilled AC cabs, complimentary bottled mineral water, and custom Rajasthan heritage itineraries. Online payment via international cards is accepted.",
        hi: "अंतर्राष्ट्रीय पर्यटकों का राजस्थान में स्वागत है! हम अंग्रेजी बोलने वाले विनम्र ड्राइवर, साफ-सुथरी एसी गाड़ियाँ, मिनरल वाटर और अंतर्राष्ट्रीय कार्ड से ऑनलाइन भुगतान की सुविधा प्रदान करते हैं।"
      },
      {
        keywords: ["advance", "payment", "razorpay", "cancel", "refund", "cash"],
        en: "Advance payment is **completely optional**! You can pay an optional 20% advance online via Razorpay (UPI, Credit/Debit cards, NetBanking) or choose to pay the full amount to the driver at the time of pickup. Flexible and customer-friendly!",
        hi: "अग्रिम भुगतान (Advance Payment) पूरी तरह **वैकल्पिक (Optional)** है! आप चाहें तो 20% ऑनलाइन रेज़रपे (UPI, कार्ड) से दे सकते हैं, या यात्रा के समय सीधे ड्राइवर को नकद/UPI से भुगतान कर सकते हैं!"
      },
      {
        keywords: ["contact", "phone", "number", "owner", "whatsapp", "call"],
        en: "You can reach Rajputana Tour & Travellers directly:\n📞 Kalu Singh: +91 9829837082\n📞 Kuldeep Singh: +91 8107841422\n💬 WhatsApp: +91 9829837082\n📧 bannasandeep7568@gmail.com\nAvailable 24 hours, 7 days a week!",
        hi: "राजपूताना टूर एंड ट्रेवलर्स से तुरंत संपर्क करें:\n📞 कालू सिंह: +91 9829837082\n📞 कुलदीप सिंह: +91 8107841422\n💬 व्हाट्सएप: +91 9829837082\n📧 bannasandeep7568@gmail.com\n24 घंटे सातों दिन सेवा उपलब्ध!"
      }
    ],
    defaultResponse: {
      en: "I am Rajputana Travel Genie! I can help you with Jaipur sightseeing, Rajasthan tour itineraries, outstation taxi fares, Tempo Traveller booking, and airport transfers. You can also directly call our trip manager at **+91 9829837082** or **+91 8107841422**.",
      hi: "मैं राजपूताना ट्रेवल जिनी हूँ! मैं आपको जयपुर दर्शन, राजस्थान टूर पैकेज, आउटस्टेशन टैक्सी किराया, टेम्पो ट्रैवलर और एयरपोर्ट पिकअप में सहायता कर सकता हूँ। आप हमारे प्रबंधक से सीधे **9829837082** या **8107841422** पर भी बात कर सकते हैं।"
    }
  }
};

// Make accessible globally
window.RTT_DATA = RTT_DATA;
