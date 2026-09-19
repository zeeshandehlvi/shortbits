// Generated from the uploaded ShortBits master news source registry.
/* eslint-disable */
// ============================================================
// THE SHORTBITS — MASTER NEWS SOURCE REGISTRY
// ============================================================
// One registry for:
// - World / global news
// - Wars / conflicts / geopolitics
// - Politics
// - India
// - Business / money
// - Technology / AI
// - Science / space / nature
// - Sports
// - Entertainment / celebrity
// - Viral / internet culture
// - Fashion / beauty
// - Travel
// - Jobs / careers
// - Scholarships / education
// - Visa / immigration
// - Kids / family
// - Trending / discovery
//
// Direct RSS sources are used where practical.
// Google News RSS is used for discovery/site-specific searches.
// Trend/API sources are registered now and handled later.
// ============================================================

const googleNews = (query: string, hl = "en-US", gl = "US") =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(query.includes("when:") ? query : `${query} when:48h`)}&hl=${hl}&gl=${gl}&ceid=${gl}:en`;

const sources = [

    // ==========================================================
    // 1. GLOBAL / WORLD NEWS
    // ==========================================================

    {
        source_id: "bbc_world",
        source_name: "BBC",
        feed_name: "BBC World",
        type: "rss",
        category: "world",
        subcategories: ["global", "breaking", "politics", "conflict"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 4,
        visual_weight: 7,
        feed_url: "https://feeds.bbci.co.uk/news/world/rss.xml",
        enabled: true
    },

    {
        source_id: "aljazeera_world",
        source_name: "Al Jazeera",
        feed_name: "Al Jazeera World",
        type: "google_news",
        category: "world",
        subcategories: ["global", "breaking", "middle_east", "politics"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 4,
        viral_weight: 6,
        visual_weight: 8,
        feed_url: googleNews("site:aljazeera.com world"),
        enabled: true
    },

    {
        source_id: "france24_world",
        source_name: "France 24",
        feed_name: "France 24 World",
        type: "google_news",
        category: "world",
        subcategories: ["global", "europe", "africa", "conflict"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 4,
        viral_weight: 5,
        visual_weight: 7,
        feed_url: googleNews("site:france24.com world"),
        enabled: true
    },

    {
        source_id: "dw_world",
        source_name: "DW",
        feed_name: "DW World",
        type: "google_news",
        category: "world",
        subcategories: ["global", "europe", "politics", "conflict"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 4,
        viral_weight: 4,
        visual_weight: 6,
        feed_url: googleNews("site:dw.com world"),
        enabled: true
    },

    {
        source_id: "cnn_world",
        source_name: "CNN",
        feed_name: "CNN World",
        type: "google_news",
        category: "world",
        subcategories: ["global", "breaking", "politics"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 7,
        visual_weight: 8,
        feed_url: googleNews("site:cnn.com world"),
        enabled: true
    },

    {
        source_id: "guardian_world",
        source_name: "The Guardian",
        feed_name: "The Guardian World",
        type: "google_news",
        category: "world",
        subcategories: ["global", "politics", "culture", "conflict"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 6,
        visual_weight: 6,
        feed_url: googleNews("site:theguardian.com world"),
        enabled: true
    },

    {
        source_id: "euronews_world",
        source_name: "Euronews",
        feed_name: "Euronews World",
        type: "google_news",
        category: "world",
        subcategories: ["europe", "global", "politics"],
        region: "europe",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 5,
        visual_weight: 6,
        feed_url: googleNews("site:euronews.com world"),
        enabled: true
    },

    {
        source_id: "nhk_world",
        source_name: "NHK World",
        feed_name: "NHK World",
        type: "google_news",
        category: "world",
        subcategories: ["asia", "japan", "global"],
        region: "asia",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 4,
        visual_weight: 6,
        feed_url: googleNews("site:nhk.or.jp world"),
        enabled: true
    },

    {
        source_id: "voa_world",
        source_name: "Voice of America",
        feed_name: "VOA World",
        type: "google_news",
        category: "world",
        subcategories: ["global", "politics", "conflict"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 4,
        visual_weight: 6,
        feed_url: googleNews("site:voanews.com world"),
        enabled: true
    },

    {
        source_id: "sky_world",
        source_name: "Sky News",
        feed_name: "Sky News World",
        type: "google_news",
        category: "world",
        subcategories: ["breaking", "global", "politics"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 7,
        visual_weight: 8,
        feed_url: googleNews("site:news.sky.com world"),
        enabled: true
    },

    // ==========================================================
    // 2. REUTERS / AP DISCOVERY
    // ==========================================================

    {
        source_id: "reuters_world",
        source_name: "Reuters",
        feed_name: "Reuters World",
        type: "google_news",
        category: "world",
        subcategories: ["breaking", "global", "politics", "business"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 4,
        visual_weight: 6,
        feed_url: googleNews("site:reuters.com world"),
        enabled: true
    },

    {
        source_id: "reuters_conflict",
        source_name: "Reuters",
        feed_name: "Reuters Conflicts",
        type: "google_news",
        category: "war",
        subcategories: ["war", "conflict", "geopolitics"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 5,
        visual_weight: 8,
        feed_url: googleNews("site:reuters.com war conflict"),
        enabled: true
    },

    {
        source_id: "reuters_technology",
        source_name: "Reuters",
        feed_name: "Reuters Technology",
        type: "google_news",
        category: "technology",
        subcategories: ["ai", "technology", "business"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 5,
        visual_weight: 7,
        feed_url: googleNews("site:reuters.com technology"),
        enabled: true
    },

    {
        source_id: "reuters_india",
        source_name: "Reuters",
        feed_name: "Reuters India",
        type: "google_news",
        category: "india",
        subcategories: ["india", "politics", "business", "breaking"],
        region: "india",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 6,
        visual_weight: 7,
        feed_url: googleNews("site:reuters.com India"),
        enabled: true
    },

    {
        source_id: "ap_world",
        source_name: "Associated Press",
        feed_name: "AP World",
        type: "google_news",
        category: "world",
        subcategories: ["global", "breaking", "politics"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 5,
        visual_weight: 7,
        feed_url: googleNews("site:apnews.com world"),
        enabled: true
    },

    {
        source_id: "ap_breaking",
        source_name: "Associated Press",
        feed_name: "AP Breaking",
        type: "google_news",
        category: "breaking",
        subcategories: ["breaking", "global", "disaster"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 8,
        feed_url: googleNews("site:apnews.com breaking news"),
        enabled: true
    },

    // ==========================================================
    // 3. WAR / CONFLICT / GEOPOLITICS
    // ==========================================================

    {
        source_id: "icg_conflict",
        source_name: "International Crisis Group",
        feed_name: "Crisis Group",
        type: "google_news",
        category: "war",
        subcategories: ["conflict", "geopolitics", "analysis"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 3,
        visual_weight: 5,
        feed_url: googleNews("site:crisisgroup.org conflict"),
        enabled: true
    },

    {
        source_id: "isw_conflict",
        source_name: "Institute for the Study of War",
        feed_name: "ISW",
        type: "google_news",
        category: "war",
        subcategories: ["military", "ukraine", "conflict"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 4,
        viral_weight: 4,
        visual_weight: 7,
        feed_url: googleNews("site:understandingwar.org war"),
        enabled: true
    },

    {
        source_id: "kyiv_independent",
        source_name: "The Kyiv Independent",
        feed_name: "Ukraine",
        type: "google_news",
        category: "war",
        subcategories: ["ukraine", "russia", "war"],
        region: "europe",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 6,
        visual_weight: 8,
        feed_url: googleNews("site:kyivindependent.com war"),
        enabled: true
    },

    {
        source_id: "un_news",
        source_name: "UN News",
        feed_name: "UN News",
        type: "google_news",
        category: "world",
        subcategories: ["diplomacy", "conflict", "humanitarian"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 3,
        visual_weight: 5,
        feed_url: googleNews("site:news.un.org"),
        enabled: true
    },

    {
        source_id: "middle_east_trends",
        source_name: "Google News",
        feed_name: "Middle East",
        type: "google_news",
        category: "war",
        subcategories: ["middle_east", "iran", "israel", "gaza"],
        region: "middle_east",
        language: "en",
        priority: 1,
        reliability: 3,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("Middle East war conflict Iran Israel Gaza"),
        enabled: true
    },

    {
        source_id: "ukraine_trends",
        source_name: "Google News",
        feed_name: "Ukraine War",
        type: "google_news",
        category: "war",
        subcategories: ["ukraine", "russia", "war"],
        region: "europe",
        language: "en",
        priority: 1,
        reliability: 3,
        viral_weight: 8,
        visual_weight: 9,
        feed_url: googleNews("Ukraine Russia war"),
        enabled: true
    },

    // ==========================================================
    // 4. POLITICS
    // ==========================================================

    {
        source_id: "politico",
        source_name: "Politico",
        feed_name: "Politico",
        type: "google_news",
        category: "politics",
        subcategories: ["us", "europe", "elections"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 7,
        visual_weight: 6,
        feed_url: googleNews("site:politico.com politics"),
        enabled: true
    },

    {
        source_id: "axios_politics",
        source_name: "Axios",
        feed_name: "Axios Politics",
        type: "google_news",
        category: "politics",
        subcategories: ["us", "politics", "breaking"],
        region: "us",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 7,
        visual_weight: 6,
        feed_url: googleNews("site:axios.com politics"),
        enabled: true
    },

    {
        source_id: "the_hill",
        source_name: "The Hill",
        feed_name: "The Hill Politics",
        type: "google_news",
        category: "politics",
        subcategories: ["us", "congress", "politics"],
        region: "us",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 7,
        visual_weight: 6,
        feed_url: googleNews("site:thehill.com politics"),
        enabled: true
    },

    {
        source_id: "foreign_policy",
        source_name: "Foreign Policy",
        feed_name: "Foreign Policy",
        type: "google_news",
        category: "politics",
        subcategories: ["geopolitics", "diplomacy", "international"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 4,
        visual_weight: 5,
        feed_url: googleNews("site:foreignpolicy.com"),
        enabled: true
    },

    {
        source_id: "foreign_affairs",
        source_name: "Foreign Affairs",
        feed_name: "Foreign Affairs",
        type: "google_news",
        category: "politics",
        subcategories: ["geopolitics", "international"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 3,
        visual_weight: 4,
        feed_url: googleNews("site:foreignaffairs.com"),
        enabled: true
    },

    // ==========================================================
    // 5. INDIA — NATIONAL / GLOBAL IMPACT
    // ==========================================================

    {
        source_id: "bbc_india",
        source_name: "BBC",
        feed_name: "BBC India",
        type: "google_news",
        category: "india",
        subcategories: ["india", "politics", "breaking", "global"],
        region: "india",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 7,
        feed_url: googleNews("site:bbc.com India"),
        enabled: true
    },

    {
        source_id: "the_hindu",
        source_name: "The Hindu",
        feed_name: "The Hindu",
        type: "google_news",
        category: "india",
        subcategories: ["politics", "national", "business"],
        region: "india",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 5,
        visual_weight: 6,
        feed_url: googleNews("site:thehindu.com India"),
        enabled: true
    },

    {
        source_id: "indian_express",
        source_name: "The Indian Express",
        feed_name: "Indian Express",
        type: "google_news",
        category: "india",
        subcategories: ["politics", "national", "courts"],
        region: "india",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 6,
        visual_weight: 6,
        feed_url: googleNews("site:indianexpress.com India"),
        enabled: true
    },

    {
        source_id: "hindustan_times",
        source_name: "Hindustan Times",
        feed_name: "Hindustan Times",
        type: "google_news",
        category: "india",
        subcategories: ["national", "politics", "viral"],
        region: "india",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 7,
        feed_url: googleNews("site:hindustantimes.com India"),
        enabled: true
    },

    {
        source_id: "ndtv",
        source_name: "NDTV",
        feed_name: "NDTV India",
        type: "google_news",
        category: "india",
        subcategories: ["breaking", "politics", "national"],
        region: "india",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 8,
        feed_url: googleNews("site:ndtv.com India"),
        enabled: true
    },

    {
        source_id: "times_of_india",
        source_name: "Times of India",
        feed_name: "TOI India",
        type: "google_news",
        category: "india",
        subcategories: ["breaking", "national", "viral"],
        region: "india",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 9,
        visual_weight: 8,
        feed_url: googleNews("site:timesofindia.indiatimes.com India"),
        enabled: true
    },

    {
        source_id: "pib_india",
        source_name: "Press Information Bureau",
        feed_name: "PIB",
        type: "google_news",
        category: "india",
        subcategories: ["government", "policy", "official"],
        region: "india",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 3,
        visual_weight: 5,
        feed_url: googleNews("site:pib.gov.in"),
        enabled: true
    },

    {
        source_id: "isro",
        source_name: "ISRO",
        feed_name: "ISRO",
        type: "google_news",
        category: "science",
        subcategories: ["india", "space", "science"],
        region: "india",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 10,
        feed_url: googleNews("site:isro.gov.in"),
        enabled: true
    },

    // ==========================================================
    // 6. BUSINESS / MONEY / MARKETS
    // ==========================================================

    {
        source_id: "cnbc",
        source_name: "CNBC",
        feed_name: "CNBC Business",
        type: "google_news",
        category: "business",
        subcategories: ["markets", "companies", "money"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 5,
        visual_weight: 6,
        feed_url: googleNews("site:cnbc.com business"),
        enabled: true
    },

    {
        source_id: "yahoo_finance",
        source_name: "Yahoo Finance",
        feed_name: "Yahoo Finance",
        type: "google_news",
        category: "business",
        subcategories: ["stocks", "markets", "money"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 6,
        visual_weight: 6,
        feed_url: googleNews("site:finance.yahoo.com"),
        enabled: true
    },

    {
        source_id: "fortune",
        source_name: "Fortune",
        feed_name: "Fortune",
        type: "google_news",
        category: "business",
        subcategories: ["business", "companies", "markets"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 5,
        visual_weight: 6,
        feed_url: googleNews("site:fortune.com business"),
        enabled: true
    },

    {
        source_id: "marketwatch",
        source_name: "MarketWatch",
        feed_name: "MarketWatch",
        type: "google_news",
        category: "business",
        subcategories: ["markets", "stocks", "money"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 5,
        visual_weight: 6,
        feed_url: googleNews("site:marketwatch.com"),
        enabled: true
    },

    {
        source_id: "coindesk",
        source_name: "CoinDesk",
        feed_name: "CoinDesk",
        type: "google_news",
        category: "business",
        subcategories: ["crypto", "bitcoin", "markets"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 7,
        feed_url: googleNews("site:coindesk.com crypto"),
        enabled: true
    },

    // ==========================================================
    // 7. TECHNOLOGY / AI / CYBER
    // ==========================================================

    {
        source_id: "bbc_technology",
        source_name: "BBC",
        feed_name: "BBC Technology",
        type: "rss",
        category: "technology",
        subcategories: ["technology", "ai", "internet"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 8,
        feed_url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
        enabled: true
    },

    {
        source_id: "techcrunch",
        source_name: "TechCrunch",
        feed_name: "TechCrunch",
        type: "rss",
        category: "technology",
        subcategories: ["startups", "ai", "venture"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 8,
        feed_url: "https://techcrunch.com/feed/",
        enabled: true
    },

    {
        source_id: "the_verge",
        source_name: "The Verge",
        feed_name: "The Verge",
        type: "rss",
        category: "technology",
        subcategories: ["consumer", "ai", "internet"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 9,
        visual_weight: 9,
        feed_url: "https://www.theverge.com/rss/index.xml",
        enabled: true
    },

    {
        source_id: "wired",
        source_name: "WIRED",
        feed_name: "WIRED Technology",
        type: "google_news",
        category: "technology",
        subcategories: ["ai", "science", "security"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 8,
        feed_url: googleNews("site:wired.com technology AI"),
        enabled: true
    },

    {
        source_id: "ars_technica",
        source_name: "Ars Technica",
        feed_name: "Ars Technica",
        type: "google_news",
        category: "technology",
        subcategories: ["engineering", "security", "science"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 6,
        visual_weight: 7,
        feed_url: googleNews("site:arstechnica.com technology"),
        enabled: true
    },

    {
        source_id: "mit_tech_review",
        source_name: "MIT Technology Review",
        feed_name: "MIT Technology Review",
        type: "google_news",
        category: "technology",
        subcategories: ["ai", "science", "emerging_tech"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 6,
        visual_weight: 7,
        feed_url: googleNews("site:technologyreview.com AI technology"),
        enabled: true
    },

    {
        source_id: "ieee_spectrum",
        source_name: "IEEE Spectrum",
        feed_name: "IEEE Spectrum",
        type: "google_news",
        category: "technology",
        subcategories: ["engineering", "robotics", "ai"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 5,
        visual_weight: 8,
        feed_url: googleNews("site:spectrum.ieee.org"),
        enabled: true
    },

    {
        source_id: "techmeme",
        source_name: "Techmeme",
        feed_name: "Techmeme",
        type: "google_news",
        category: "technology",
        subcategories: ["tech_trends", "viral", "internet"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 8,
        feed_url: googleNews("site:techmeme.com"),
        enabled: true
    },

    {
        source_id: "cybersecurity_trends",
        source_name: "Google News",
        feed_name: "Cybersecurity",
        type: "google_news",
        category: "technology",
        subcategories: ["cybersecurity", "hacking", "privacy"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 3,
        viral_weight: 8,
        visual_weight: 7,
        feed_url: googleNews("cybersecurity hacking data breach"),
        enabled: true
    },

    // ==========================================================
    // 8. SPORTS
    // ==========================================================

    {
        source_id: "bbc_sport",
        source_name: "BBC Sport",
        feed_name: "BBC Sport",
        type: "rss",
        category: "sports",
        subcategories: ["football", "cricket", "tennis", "f1"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 10,
        feed_url: "https://feeds.bbci.co.uk/sport/rss.xml",
        enabled: true
    },

    {
        source_id: "espn",
        source_name: "ESPN",
        feed_name: "ESPN",
        type: "google_news",
        category: "sports",
        subcategories: ["football", "nba", "nfl", "baseball"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:espn.com sports"),
        enabled: true
    },

    {
        source_id: "espn_cricinfo",
        source_name: "ESPNcricinfo",
        feed_name: "ESPNcricinfo",
        type: "google_news",
        category: "sports",
        subcategories: ["cricket", "india", "international"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("site:espncricinfo.com cricket"),
        enabled: true
    },

    {
        source_id: "formula1",
        source_name: "Formula 1",
        feed_name: "Formula 1",
        type: "google_news",
        category: "sports",
        subcategories: ["f1", "motorsport"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 10,
        feed_url: googleNews("Formula 1 F1"),
        enabled: true
    },

    {
        source_id: "fifa",
        source_name: "FIFA",
        feed_name: "FIFA",
        type: "google_news",
        category: "sports",
        subcategories: ["football", "soccer"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:fifa.com football"),
        enabled: true
    },

    {
        source_id: "nba",
        source_name: "NBA",
        feed_name: "NBA",
        type: "google_news",
        category: "sports",
        subcategories: ["basketball"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:nba.com"),
        enabled: true
    },

    {
        source_id: "icc",
        source_name: "ICC",
        feed_name: "ICC Cricket",
        type: "google_news",
        category: "sports",
        subcategories: ["cricket"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:icc-cricket.com"),
        enabled: true
    },

    // ==========================================================
    // 9. SCIENCE / SPACE / NATURE
    // ==========================================================

    {
        source_id: "nasa",
        source_name: "NASA",
        feed_name: "NASA",
        type: "google_news",
        category: "science",
        subcategories: ["space", "nasa", "astronomy"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:nasa.gov space"),
        enabled: true
    },

    {
        source_id: "esa",
        source_name: "European Space Agency",
        feed_name: "ESA",
        type: "google_news",
        category: "science",
        subcategories: ["space", "astronomy"],
        region: "europe",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 10,
        feed_url: googleNews("site:esa.int space"),
        enabled: true
    },

    {
        source_id: "nature",
        source_name: "Nature",
        feed_name: "Nature News",
        type: "google_news",
        category: "science",
        subcategories: ["science", "medicine", "research"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 6,
        visual_weight: 7,
        feed_url: googleNews("site:nature.com science"),
        enabled: true
    },

    {
        source_id: "scientific_american",
        source_name: "Scientific American",
        feed_name: "Scientific American",
        type: "google_news",
        category: "science",
        subcategories: ["science", "health", "space"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 8,
        feed_url: googleNews("site:scientificamerican.com"),
        enabled: true
    },

    {
        source_id: "usgs",
        source_name: "USGS",
        feed_name: "USGS Earthquakes",
        type: "google_news",
        category: "nature",
        subcategories: ["earthquake", "natural_disaster", "geology"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("site:usgs.gov earthquake"),
        enabled: true
    },

    {
        source_id: "noaa",
        source_name: "NOAA",
        feed_name: "NOAA",
        type: "google_news",
        category: "nature",
        subcategories: ["weather", "climate", "hurricane", "ocean"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 9,
        feed_url: googleNews("site:noaa.gov weather climate"),
        enabled: true
    },

    {
        source_id: "national_geographic",
        source_name: "National Geographic",
        feed_name: "National Geographic",
        type: "google_news",
        category: "nature",
        subcategories: ["animals", "nature", "science"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:nationalgeographic.com nature animals"),
        enabled: true
    },

    // ==========================================================
    // 10. ENTERTAINMENT / CELEBRITY / VIRAL CULTURE
    // ==========================================================

    {
        source_id: "variety",
        source_name: "Variety",
        feed_name: "Variety",
        type: "google_news",
        category: "entertainment",
        subcategories: ["movies", "tv", "celebrity"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 9,
        visual_weight: 9,
        feed_url: googleNews("site:variety.com entertainment"),
        enabled: true
    },

    {
        source_id: "deadline",
        source_name: "Deadline",
        feed_name: "Deadline",
        type: "google_news",
        category: "entertainment",
        subcategories: ["hollywood", "movies", "tv"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 9,
        feed_url: googleNews("site:deadline.com"),
        enabled: true
    },

    {
        source_id: "hollywood_reporter",
        source_name: "The Hollywood Reporter",
        feed_name: "THR",
        type: "google_news",
        category: "entertainment",
        subcategories: ["movies", "celebrity", "tv"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 9,
        feed_url: googleNews("site:hollywoodreporter.com"),
        enabled: true
    },

    {
        source_id: "billboard",
        source_name: "Billboard",
        feed_name: "Billboard",
        type: "google_news",
        category: "entertainment",
        subcategories: ["music", "celebrities"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 10,
        visual_weight: 9,
        feed_url: googleNews("site:billboard.com"),
        enabled: true
    },

    {
        source_id: "tmz",
        source_name: "TMZ",
        feed_name: "TMZ",
        type: "google_news",
        category: "viral",
        subcategories: ["celebrity", "entertainment", "viral"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("site:tmz.com celebrity"),
        enabled: true
    },

    // ==========================================================
    // 11. FASHION / BEAUTY
    // ==========================================================

    {
        source_id: "vogue",
        source_name: "Vogue",
        feed_name: "Vogue",
        type: "google_news",
        category: "fashion",
        subcategories: ["fashion", "beauty", "celebrity"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:vogue.com fashion beauty"),
        enabled: true
    },

    {
        source_id: "harpers_bazaar",
        source_name: "Harper's Bazaar",
        feed_name: "Harper's Bazaar",
        type: "google_news",
        category: "fashion",
        subcategories: ["fashion", "beauty", "celebrity"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 10,
        feed_url: googleNews("site:harpersbazaar.com fashion beauty"),
        enabled: true
    },

    {
        source_id: "allure",
        source_name: "Allure",
        feed_name: "Allure",
        type: "google_news",
        category: "beauty",
        subcategories: ["beauty", "skincare", "fashion"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("site:allure.com beauty"),
        enabled: true
    },

    {
        source_id: "hypebeast",
        source_name: "Hypebeast",
        feed_name: "Hypebeast",
        type: "google_news",
        category: "fashion",
        subcategories: ["streetwear", "fashion", "culture"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("site:hypebeast.com"),
        enabled: true
    },

    // ==========================================================
    // 12. TRAVEL / AVIATION
    // ==========================================================

    {
        source_id: "euronews_travel",
        source_name: "Euronews Travel",
        feed_name: "Euronews Travel",
        type: "google_news",
        category: "travel",
        subcategories: ["travel", "tourism", "europe"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 10,
        feed_url: googleNews("site:euronews.com travel"),
        enabled: true
    },

    {
        source_id: "travel_leisure",
        source_name: "Travel + Leisure",
        feed_name: "Travel + Leisure",
        type: "google_news",
        category: "travel",
        subcategories: ["travel", "destinations"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 10,
        feed_url: googleNews("site:travelandleisure.com"),
        enabled: true
    },

    {
        source_id: "simple_flying",
        source_name: "Simple Flying",
        feed_name: "Simple Flying",
        type: "google_news",
        category: "travel",
        subcategories: ["aviation", "airlines", "travel"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 8,
        visual_weight: 9,
        feed_url: googleNews("site:simpleflying.com"),
        enabled: true
    },

    {
        source_id: "lonely_planet",
        source_name: "Lonely Planet",
        feed_name: "Lonely Planet",
        type: "google_news",
        category: "travel",
        subcategories: ["travel", "destinations", "tourism"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 7,
        visual_weight: 10,
        feed_url: googleNews("site:lonelyplanet.com"),
        enabled: true
    },

    // ==========================================================
    // 13. JOBS / CAREERS
    // ==========================================================

    {
        source_id: "indeed_jobs",
        source_name: "Indeed",
        feed_name: "Indeed Jobs",
        type: "google_news",
        category: "jobs",
        subcategories: ["jobs", "careers", "employment"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 4,
        viral_weight: 6,
        visual_weight: 4,
        feed_url: googleNews("site:indeed.com jobs"),
        enabled: true
    },

    {
        source_id: "un_jobs",
        source_name: "United Nations",
        feed_name: "UN Careers",
        type: "google_news",
        category: "jobs",
        subcategories: ["international", "un", "careers"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 5,
        feed_url: googleNews("site:careers.un.org jobs"),
        enabled: true
    },

    {
        source_id: "usajobs",
        source_name: "USAJOBS",
        feed_name: "USAJOBS",
        type: "google_news",
        category: "jobs",
        subcategories: ["government", "jobs", "usa"],
        region: "us",
        language: "en",
        priority: 3,
        reliability: 5,
        viral_weight: 5,
        visual_weight: 4,
        feed_url: googleNews("site:usajobs.gov jobs"),
        enabled: true
    },

    {
        source_id: "remote_jobs_trend",
        source_name: "Google News",
        feed_name: "Remote Jobs",
        type: "google_news",
        category: "jobs",
        subcategories: ["remote", "jobs", "careers"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("remote jobs work from home hiring"),
        enabled: true
    },

    // ==========================================================
    // 14. SCHOLARSHIPS / EDUCATION
    // ==========================================================

    {
        source_id: "daad",
        source_name: "DAAD",
        feed_name: "DAAD Scholarships",
        type: "google_news",
        category: "education",
        subcategories: ["scholarships", "germany", "international_students"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 4,
        feed_url: googleNews("site:daad.de scholarships"),
        enabled: true
    },

    {
        source_id: "erasmus",
        source_name: "Erasmus+",
        feed_name: "Erasmus+",
        type: "google_news",
        category: "education",
        subcategories: ["scholarships", "europe", "students"],
        region: "europe",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("site:erasmus-plus.ec.europa.eu scholarships"),
        enabled: true
    },

    {
        source_id: "chevening",
        source_name: "Chevening",
        feed_name: "Chevening Scholarships",
        type: "google_news",
        category: "education",
        subcategories: ["scholarships", "uk", "masters"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("site:chevening.org scholarships"),
        enabled: true
    },

    {
        source_id: "fulbright",
        source_name: "Fulbright",
        feed_name: "Fulbright",
        type: "google_news",
        category: "education",
        subcategories: ["scholarships", "usa", "international_students"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("site:foreign.fulbrightonline.org"),
        enabled: true
    },

    {
        source_id: "scholarship_trends",
        source_name: "Google News",
        feed_name: "Fully Funded Scholarships",
        type: "google_news",
        category: "education",
        subcategories: ["scholarships", "fully_funded", "international_students"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 4,
        feed_url: googleNews("fully funded scholarships international students"),
        enabled: true
    },

    // ==========================================================
    // 15. VISA / IMMIGRATION
    // ==========================================================

    {
        source_id: "home_affairs_au",
        source_name: "Australian Department of Home Affairs",
        feed_name: "Australia Immigration",
        type: "google_news",
        category: "visa",
        subcategories: ["australia", "visa", "immigration", "students"],
        region: "australia",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("site:homeaffairs.gov.au visa immigration"),
        enabled: true
    },

    {
        source_id: "ircc_canada",
        source_name: "IRCC",
        feed_name: "Canada Immigration",
        type: "google_news",
        category: "visa",
        subcategories: ["canada", "visa", "immigration", "students"],
        region: "canada",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("site:canada.ca immigration visa"),
        enabled: true
    },

    {
        source_id: "uscis",
        source_name: "USCIS",
        feed_name: "US Immigration",
        type: "google_news",
        category: "visa",
        subcategories: ["usa", "visa", "immigration"],
        region: "us",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("site:uscis.gov immigration visa"),
        enabled: true
    },

    {
        source_id: "uk_home_office",
        source_name: "UK Home Office",
        feed_name: "UK Immigration",
        type: "google_news",
        category: "visa",
        subcategories: ["uk", "visa", "immigration"],
        region: "uk",
        language: "en",
        priority: 1,
        reliability: 5,
        viral_weight: 8,
        visual_weight: 4,
        feed_url: googleNews("site:gov.uk visa immigration"),
        enabled: true
    },

    {
        source_id: "new_zealand_immigration",
        source_name: "Immigration New Zealand",
        feed_name: "New Zealand Immigration",
        type: "google_news",
        category: "visa",
        subcategories: ["new_zealand", "visa", "immigration"],
        region: "new_zealand",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 7,
        visual_weight: 4,
        feed_url: googleNews("site:immigration.govt.nz"),
        enabled: true
    },

    // ==========================================================
    // 16. KIDS / FAMILY
    // ==========================================================

    {
        source_id: "unicef",
        source_name: "UNICEF",
        feed_name: "UNICEF",
        type: "google_news",
        category: "kids",
        subcategories: ["children", "education", "humanitarian"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 5,
        viral_weight: 5,
        visual_weight: 7,
        feed_url: googleNews("site:unicef.org children"),
        enabled: true
    },

    {
        source_id: "parents",
        source_name: "Parents",
        feed_name: "Parents",
        type: "google_news",
        category: "family",
        subcategories: ["parenting", "kids", "family"],
        region: "global",
        language: "en",
        priority: 4,
        reliability: 3,
        viral_weight: 7,
        visual_weight: 8,
        feed_url: googleNews("site:parents.com parenting"),
        enabled: true
    },

    // ==========================================================
    // 17. TRENDING / VIRAL DISCOVERY
    // ==========================================================

    {
        source_id: "google_news_global_trending",
        source_name: "Google News",
        feed_name: "Global Trending",
        type: "google_news",
        category: "trending",
        subcategories: ["trending", "viral", "breaking"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 9,
        feed_url: googleNews("trending viral breaking news"),
        enabled: true
    },

    {
        source_id: "google_news_viral",
        source_name: "Google News",
        feed_name: "Viral News",
        type: "google_news",
        category: "viral",
        subcategories: ["viral", "internet", "social"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 2,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("viral internet social media"),
        enabled: true
    },

    {
        source_id: "google_news_breaking",
        source_name: "Google News",
        feed_name: "Breaking News",
        type: "google_news",
        category: "breaking",
        subcategories: ["breaking", "urgent", "disaster"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("breaking news"),
        enabled: true
    },

    {
        source_id: "google_news_india_viral",
        source_name: "Google News",
        feed_name: "India Viral",
        type: "google_news",
        category: "viral",
        subcategories: ["india", "viral", "trending"],
        region: "india",
        language: "en",
        priority: 2,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("India viral trending"),
        enabled: true
    },

    {
        source_id: "google_news_social_media",
        source_name: "Google News",
        feed_name: "Social Media Trends",
        type: "google_news",
        category: "viral",
        subcategories: ["social_media", "internet", "trending"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 2,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("social media viral trending"),
        enabled: true
    },

    // ==========================================================
    // 18. TRENDS / API SOURCES
    // ==========================================================
    // These are registered here but will be collected by
    // dedicated nodes later, not by the RSS HTTP collector.

    {
        source_id: "google_trends_global",
        source_name: "Google Trends",
        feed_name: "Google Trends Global",
        type: "trend",
        category: "trending",
        subcategories: ["search", "viral", "emerging_topics"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 8,
        feed_url: null,
        enabled: true
    },

    {
        source_id: "google_trends_india",
        source_name: "Google Trends",
        feed_name: "Google Trends India",
        type: "trend",
        category: "trending",
        subcategories: ["search", "india", "viral"],
        region: "india",
        language: "en",
        priority: 1,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 8,
        feed_url: null,
        enabled: true
    },

    {
        source_id: "youtube_trending",
        source_name: "YouTube",
        feed_name: "YouTube Trending",
        type: "api",
        category: "trending",
        subcategories: ["youtube", "viral", "video"],
        region: "global",
        language: "en",
        priority: 1,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: null,
        enabled: true
    },

    {
        source_id: "reddit_trending",
        source_name: "Reddit",
        feed_name: "Reddit Trending",
        type: "api",
        category: "viral",
        subcategories: ["reddit", "viral", "internet"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 2,
        viral_weight: 10,
        visual_weight: 9,
        feed_url: null,
        enabled: true
    },

    {
        source_id: "hacker_news",
        source_name: "Hacker News",
        feed_name: "Hacker News",
        type: "rss",
        category: "technology",
        subcategories: ["developers", "startups", "internet", "ai"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 8,
        visual_weight: 7,
        feed_url: "https://news.ycombinator.com/rss",
        enabled: true
    },

    // ==========================================================
    // 19. BROAD TREND QUERIES
    // ==========================================================

    {
        source_id: "trending_ai",
        source_name: "Google News",
        feed_name: "Trending AI",
        type: "google_news",
        category: "technology",
        subcategories: ["ai", "viral", "trending"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 9,
        feed_url: googleNews("AI breakthrough viral trending"),
        enabled: true
    },

    {
        source_id: "trending_science",
        source_name: "Google News",
        feed_name: "Trending Science",
        type: "google_news",
        category: "science",
        subcategories: ["science", "discovery", "viral"],
        region: "global",
        language: "en",
        priority: 2,
        reliability: 3,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("science discovery viral trending"),
        enabled: true
    },

    {
        source_id: "trending_nature",
        source_name: "Google News",
        feed_name: "Trending Nature",
        type: "google_news",
        category: "nature",
        subcategories: ["animals", "nature", "viral"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("nature animals wildlife viral"),
        enabled: true
    },

    {
        source_id: "trending_travel",
        source_name: "Google News",
        feed_name: "Trending Travel",
        type: "google_news",
        category: "travel",
        subcategories: ["travel", "tourism", "viral"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 9,
        visual_weight: 10,
        feed_url: googleNews("travel tourism viral trending"),
        enabled: true
    },

    {
        source_id: "trending_fashion",
        source_name: "Google News",
        feed_name: "Trending Fashion",
        type: "google_news",
        category: "fashion",
        subcategories: ["fashion", "celebrity", "viral"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("fashion celebrity viral trending"),
        enabled: true
    },

    {
        source_id: "trending_entertainment",
        source_name: "Google News",
        feed_name: "Trending Entertainment",
        type: "google_news",
        category: "entertainment",
        subcategories: ["celebrity", "music", "movies", "viral"],
        region: "global",
        language: "en",
        priority: 3,
        reliability: 3,
        viral_weight: 10,
        visual_weight: 10,
        feed_url: googleNews("entertainment celebrity viral trending"),
        enabled: true
    }
];

export type NewsSource = {
  source_id: string;
  source_name: string;
  feed_name: string;
  type: string;
  category: string;
  subcategories: string[];
  region: string;
  language: string;
  priority: number;
  reliability: number;
  viral_weight: number;
  visual_weight: number;
  feed_url: string | null;
  enabled: boolean;
};

export const NEWS_SOURCES: NewsSource[] = (sources as NewsSource[]).filter(
  (source) => source.enabled && Boolean(source.feed_url),
);

export const NEWS_CATEGORIES: string[] = Array.from(
  new Set(NEWS_SOURCES.map((source) => source.category)),
).sort();
