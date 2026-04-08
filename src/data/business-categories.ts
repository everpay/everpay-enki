// Extensive business types and industry categories modeled after PayPal's merchant classification system

export const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'non_profit', label: 'Non-Profit Organization' },
  { value: 'government', label: 'Government Entity' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'trust', label: 'Trust' },
  { value: 'association', label: 'Association' },
  { value: 'joint_venture', label: 'Joint Venture' },
  { value: 'public_company', label: 'Publicly Traded Company' },
  { value: 'individual', label: 'Individual / Freelancer' },
  { value: 's_corporation', label: 'S Corporation' },
  { value: 'limited_partnership', label: 'Limited Partnership (LP)' },
  { value: 'holding_company', label: 'Holding Company' },
];

export const INDUSTRY_CATEGORIES = [
  // ═══════════════════════════════════
  // Arts, Crafts & Collectibles
  // ═══════════════════════════════════
  { value: 'antiques', label: 'Antiques', category: 'Arts, Crafts & Collectibles', mcc: '5932' },
  { value: 'art_craft_supplies', label: 'Art & Craft Supplies', category: 'Arts, Crafts & Collectibles', mcc: '5970' },
  { value: 'art_dealers_galleries', label: 'Art Dealers & Galleries', category: 'Arts, Crafts & Collectibles', mcc: '5971' },
  { value: 'camera_photo_supplies', label: 'Camera & Photographic Supplies', category: 'Arts, Crafts & Collectibles', mcc: '5946' },
  { value: 'digital_art', label: 'Digital Art & NFTs', category: 'Arts, Crafts & Collectibles', mcc: '5971' },
  { value: 'memorabilia', label: 'Memorabilia & Collectibles', category: 'Arts, Crafts & Collectibles', mcc: '5999' },
  { value: 'music_instruments', label: 'Musical Instruments & Sheet Music', category: 'Arts, Crafts & Collectibles', mcc: '5733' },
  { value: 'stamps_coins', label: 'Stamps & Coins', category: 'Arts, Crafts & Collectibles', mcc: '5972' },
  { value: 'vintage_collectibles', label: 'Vintage & Rare Collectibles', category: 'Arts, Crafts & Collectibles', mcc: '5999' },

  // ═══════════════════════════════════
  // Beauty & Personal Care
  // ═══════════════════════════════════
  { value: 'beauty_fragrances', label: 'Beauty & Fragrances', category: 'Beauty & Personal Care', mcc: '5977' },
  { value: 'cosmetics', label: 'Cosmetics & Skincare', category: 'Beauty & Personal Care', mcc: '5977' },
  { value: 'bath_body', label: 'Bath & Body Products', category: 'Beauty & Personal Care', mcc: '5977' },
  { value: 'hair_care', label: 'Hair Care & Styling', category: 'Beauty & Personal Care', mcc: '7230' },
  { value: 'nail_salon', label: 'Nail Salon & Spa', category: 'Beauty & Personal Care', mcc: '7298' },
  { value: 'barber_shop', label: 'Barber Shop', category: 'Beauty & Personal Care', mcc: '7241' },
  { value: 'tattoo_piercing', label: 'Tattoo & Body Piercing', category: 'Beauty & Personal Care', mcc: '7299' },

  // ═══════════════════════════════════
  // Books & Media
  // ═══════════════════════════════════
  { value: 'books_magazines', label: 'Books & Magazines', category: 'Books & Media', mcc: '5942' },
  { value: 'digital_content', label: 'Digital Content & Media', category: 'Books & Media', mcc: '5815' },
  { value: 'music_movies', label: 'Music, Movies & Entertainment', category: 'Books & Media', mcc: '5735' },
  { value: 'newspaper_subscriptions', label: 'Newspaper & Periodical Subscriptions', category: 'Books & Media', mcc: '5994' },
  { value: 'audiobooks_podcasts', label: 'Audiobooks & Podcasts', category: 'Books & Media', mcc: '5815' },
  { value: 'stationery', label: 'Stationery & Writing Supplies', category: 'Books & Media', mcc: '5943' },

  // ═══════════════════════════════════
  // Business Services
  // ═══════════════════════════════════
  { value: 'b2b', label: 'Business to Business (B2B)', category: 'Business Services', mcc: '7399' },
  { value: 'accounting', label: 'Accounting & Bookkeeping', category: 'Business Services', mcc: '8931' },
  { value: 'advertising_marketing', label: 'Advertising & Marketing', category: 'Business Services', mcc: '7311' },
  { value: 'consulting', label: 'Consulting Services', category: 'Business Services', mcc: '7392' },
  { value: 'legal_services', label: 'Legal Services', category: 'Business Services', mcc: '8111' },
  { value: 'office_supplies', label: 'Office & Commercial Supplies', category: 'Business Services', mcc: '5943' },
  { value: 'printing_publishing', label: 'Printing & Publishing', category: 'Business Services', mcc: '2741' },
  { value: 'staffing_recruiting', label: 'Staffing & Recruiting', category: 'Business Services', mcc: '7361' },
  { value: 'real_estate', label: 'Real Estate', category: 'Business Services', mcc: '6513' },
  { value: 'business_coaching', label: 'Business Coaching & Mentoring', category: 'Business Services', mcc: '7399' },
  { value: 'translation_services', label: 'Translation & Interpretation', category: 'Business Services', mcc: '7389' },
  { value: 'market_research', label: 'Market Research & Surveys', category: 'Business Services', mcc: '7389' },
  { value: 'public_relations', label: 'Public Relations', category: 'Business Services', mcc: '7311' },
  { value: 'trade_shows', label: 'Trade Shows & Event Planning', category: 'Business Services', mcc: '7941' },

  // ═══════════════════════════════════
  // Children & Baby
  // ═══════════════════════════════════
  { value: 'baby_products', label: 'Baby Products & Accessories', category: 'Children & Baby', mcc: '5641' },
  { value: 'children_clothing', label: "Children's Clothing", category: 'Children & Baby', mcc: '5641' },
  { value: 'toys_games', label: 'Toys & Games', category: 'Children & Baby', mcc: '5945' },
  { value: 'daycare', label: 'Day Care & Child Care', category: 'Children & Baby', mcc: '8351' },
  { value: 'children_education', label: "Children's Education & Tutoring", category: 'Children & Baby', mcc: '8299' },

  // ═══════════════════════════════════
  // Clothing & Accessories
  // ═══════════════════════════════════
  { value: 'clothing_accessories', label: 'Clothing, Accessories & Shoes', category: 'Clothing & Accessories', mcc: '5651' },
  { value: 'jewelry', label: 'Jewelry & Watches', category: 'Clothing & Accessories', mcc: '5944' },
  { value: 'fashion_wholesale', label: 'Fashion Wholesale & Distribution', category: 'Clothing & Accessories', mcc: '5137' },
  { value: 'mens_clothing', label: "Men's Clothing & Accessories", category: 'Clothing & Accessories', mcc: '5611' },
  { value: 'womens_clothing', label: "Women's Clothing & Accessories", category: 'Clothing & Accessories', mcc: '5621' },
  { value: 'shoes_footwear', label: 'Shoes & Footwear', category: 'Clothing & Accessories', mcc: '5661' },
  { value: 'handbags_luggage', label: 'Handbags & Luggage', category: 'Clothing & Accessories', mcc: '5948' },
  { value: 'sunglasses_eyewear', label: 'Sunglasses & Eyewear', category: 'Clothing & Accessories', mcc: '8042' },

  // ═══════════════════════════════════
  // Computers & Electronics
  // ═══════════════════════════════════
  { value: 'computers', label: 'Computers & Computer Accessories', category: 'Computers & Electronics', mcc: '5734' },
  { value: 'electronics_telecom', label: 'Electronics & Telecom', category: 'Computers & Electronics', mcc: '5732' },
  { value: 'network_equipment', label: 'Networking Equipment', category: 'Computers & Electronics', mcc: '5734' },
  { value: 'software', label: 'Software & Digital Goods', category: 'Computers & Electronics', mcc: '5817' },
  { value: 'mobile_phones', label: 'Mobile Phones & Tablets', category: 'Computers & Electronics', mcc: '5732' },
  { value: 'consumer_electronics', label: 'Consumer Electronics & Appliances', category: 'Computers & Electronics', mcc: '5722' },
  { value: 'smart_home', label: 'Smart Home & IoT Devices', category: 'Computers & Electronics', mcc: '5732' },
  { value: 'video_audio_equipment', label: 'Video & Audio Equipment', category: 'Computers & Electronics', mcc: '5731' },

  // ═══════════════════════════════════
  // Construction & Industrial
  // ═══════════════════════════════════
  { value: 'construction', label: 'Construction Services', category: 'Construction & Industrial', mcc: '1520' },
  { value: 'building_materials', label: 'Building Materials & Hardware', category: 'Construction & Industrial', mcc: '5211' },
  { value: 'electrical_work', label: 'Electrical Contractors', category: 'Construction & Industrial', mcc: '1731' },
  { value: 'plumbing_heating', label: 'Plumbing & Heating', category: 'Construction & Industrial', mcc: '1711' },
  { value: 'industrial_supplies', label: 'Industrial Supplies & Equipment', category: 'Construction & Industrial', mcc: '5085' },
  { value: 'heavy_machinery', label: 'Heavy Machinery & Equipment', category: 'Construction & Industrial', mcc: '5082' },

  // ═══════════════════════════════════
  // E-Commerce & Digital
  // ═══════════════════════════════════
  { value: 'e_commerce', label: 'E-Commerce (General)', category: 'E-Commerce & Digital', mcc: '5999' },
  { value: 'marketplace', label: 'Online Marketplace / Platform', category: 'E-Commerce & Digital', mcc: '5999' },
  { value: 'saas', label: 'Software as a Service (SaaS)', category: 'E-Commerce & Digital', mcc: '5817' },
  { value: 'subscription_services', label: 'Subscription Services', category: 'E-Commerce & Digital', mcc: '5968' },
  { value: 'digital_services', label: 'Digital Services', category: 'E-Commerce & Digital', mcc: '5818' },
  { value: 'web_hosting', label: 'Web Hosting & Domains', category: 'E-Commerce & Digital', mcc: '4816' },
  { value: 'dropshipping', label: 'Dropshipping & Fulfillment', category: 'E-Commerce & Digital', mcc: '5999' },
  { value: 'affiliate_marketing', label: 'Affiliate Marketing', category: 'E-Commerce & Digital', mcc: '7311' },
  { value: 'digital_downloads', label: 'Digital Downloads & Templates', category: 'E-Commerce & Digital', mcc: '5818' },
  { value: 'cloud_services', label: 'Cloud Services & Infrastructure', category: 'E-Commerce & Digital', mcc: '7372' },

  // ═══════════════════════════════════
  // Education
  // ═══════════════════════════════════
  { value: 'education', label: 'Education (General)', category: 'Education', mcc: '8299' },
  { value: 'online_education', label: 'Online Courses & E-Learning', category: 'Education', mcc: '8299' },
  { value: 'tutoring', label: 'Tutoring & Test Prep', category: 'Education', mcc: '8299' },
  { value: 'vocational_schools', label: 'Vocational & Trade Schools', category: 'Education', mcc: '8249' },
  { value: 'college_university', label: 'Colleges & Universities', category: 'Education', mcc: '8220' },
  { value: 'driving_school', label: 'Driving Schools', category: 'Education', mcc: '8249' },
  { value: 'language_school', label: 'Language Schools', category: 'Education', mcc: '8299' },
  { value: 'certification_training', label: 'Certification & Professional Training', category: 'Education', mcc: '8299' },

  // ═══════════════════════════════════
  // Entertainment & Media
  // ═══════════════════════════════════
  { value: 'entertainment_media', label: 'Entertainment & Media (General)', category: 'Entertainment & Media', mcc: '7922' },
  { value: 'gaming', label: 'Gaming & Esports', category: 'Entertainment & Media', mcc: '7993' },
  { value: 'online_gaming', label: 'Online Gaming & Virtual Goods', category: 'Entertainment & Media', mcc: '5816' },
  { value: 'streaming', label: 'Streaming & Content Platforms', category: 'Entertainment & Media', mcc: '4899' },
  { value: 'events_ticketing', label: 'Events & Ticketing', category: 'Entertainment & Media', mcc: '7922' },
  { value: 'amusement_parks', label: 'Amusement Parks & Attractions', category: 'Entertainment & Media', mcc: '7996' },
  { value: 'movie_theaters', label: 'Movie Theaters & Cinemas', category: 'Entertainment & Media', mcc: '7832' },
  { value: 'nightclubs_dance', label: 'Nightclubs & Dance Halls', category: 'Entertainment & Media', mcc: '7911' },
  { value: 'live_performances', label: 'Live Performances & Concerts', category: 'Entertainment & Media', mcc: '7929' },

  // ═══════════════════════════════════
  // Environmental & Green
  // ═══════════════════════════════════
  { value: 'renewable_energy', label: 'Renewable Energy & Solar', category: 'Environmental & Green', mcc: '4900' },
  { value: 'recycling_waste', label: 'Recycling & Waste Management', category: 'Environmental & Green', mcc: '4214' },
  { value: 'eco_products', label: 'Eco-Friendly Products', category: 'Environmental & Green', mcc: '5999' },

  // ═══════════════════════════════════
  // Financial Services
  // ═══════════════════════════════════
  { value: 'fintech', label: 'Financial Technology (Fintech)', category: 'Financial Services', mcc: '6012' },
  { value: 'insurance', label: 'Insurance', category: 'Financial Services', mcc: '6300' },
  { value: 'money_transfer', label: 'Money Transfer & Remittance', category: 'Financial Services', mcc: '6051' },
  { value: 'crypto_blockchain', label: 'Cryptocurrency & Blockchain', category: 'Financial Services', mcc: '6051' },
  { value: 'lending', label: 'Lending & Credit', category: 'Financial Services', mcc: '6153' },
  { value: 'investment_securities', label: 'Investment & Securities', category: 'Financial Services', mcc: '6211' },
  { value: 'tax_preparation', label: 'Tax Preparation Services', category: 'Financial Services', mcc: '7276' },
  { value: 'debt_collection', label: 'Debt Collection', category: 'Financial Services', mcc: '7322' },
  { value: 'foreign_exchange', label: 'Foreign Exchange & Currency', category: 'Financial Services', mcc: '6051' },
  { value: 'payment_processing', label: 'Payment Processing & Gateways', category: 'Financial Services', mcc: '4829' },

  // ═══════════════════════════════════
  // Food & Beverage
  // ═══════════════════════════════════
  { value: 'food_retail', label: 'Food Retail & Grocery', category: 'Food & Beverage', mcc: '5411' },
  { value: 'restaurants_dining', label: 'Restaurants & Dining', category: 'Food & Beverage', mcc: '5812' },
  { value: 'catering', label: 'Catering Services', category: 'Food & Beverage', mcc: '5811' },
  { value: 'food_delivery', label: 'Food Delivery & Meal Kits', category: 'Food & Beverage', mcc: '5812' },
  { value: 'bars_nightlife', label: 'Bars & Nightlife', category: 'Food & Beverage', mcc: '5813' },
  { value: 'bakeries', label: 'Bakeries & Pastry Shops', category: 'Food & Beverage', mcc: '5462' },
  { value: 'coffee_tea', label: 'Coffee & Tea Shops', category: 'Food & Beverage', mcc: '5814' },
  { value: 'specialty_foods', label: 'Specialty Foods & Gourmet', category: 'Food & Beverage', mcc: '5499' },
  { value: 'wine_spirits', label: 'Wine, Beer & Spirits', category: 'Food & Beverage', mcc: '5921' },
  { value: 'food_trucks', label: 'Food Trucks & Mobile Vendors', category: 'Food & Beverage', mcc: '5812' },

  // ═══════════════════════════════════
  // Government & Public Sector
  // ═══════════════════════════════════
  { value: 'government_services', label: 'Government Services & Fees', category: 'Government & Public Sector', mcc: '9399' },
  { value: 'postal_services', label: 'Postal Services', category: 'Government & Public Sector', mcc: '9402' },
  { value: 'court_fines', label: 'Court Costs & Fines', category: 'Government & Public Sector', mcc: '9211' },
  { value: 'tax_payments', label: 'Tax Payments', category: 'Government & Public Sector', mcc: '9311' },

  // ═══════════════════════════════════
  // Health & Wellness
  // ═══════════════════════════════════
  { value: 'healthcare', label: 'Healthcare (General)', category: 'Health & Wellness', mcc: '8099' },
  { value: 'dental', label: 'Dental Services', category: 'Health & Wellness', mcc: '8021' },
  { value: 'medical_services', label: 'Medical Services', category: 'Health & Wellness', mcc: '8011' },
  { value: 'pharmacy', label: 'Pharmacy & Drug Stores', category: 'Health & Wellness', mcc: '5912' },
  { value: 'health_supplements', label: 'Health Supplements & Vitamins', category: 'Health & Wellness', mcc: '5499' },
  { value: 'fitness_gym', label: 'Fitness & Gym', category: 'Health & Wellness', mcc: '7941' },
  { value: 'mental_health', label: 'Mental Health & Therapy', category: 'Health & Wellness', mcc: '8049' },
  { value: 'telehealth', label: 'Telehealth & Digital Health', category: 'Health & Wellness', mcc: '8099' },
  { value: 'optometry', label: 'Optometry & Vision Care', category: 'Health & Wellness', mcc: '8042' },
  { value: 'chiropractic', label: 'Chiropractic Services', category: 'Health & Wellness', mcc: '8041' },
  { value: 'medical_equipment', label: 'Medical Equipment & Supplies', category: 'Health & Wellness', mcc: '5047' },
  { value: 'spa_massage', label: 'Spa & Massage Therapy', category: 'Health & Wellness', mcc: '7298' },
  { value: 'yoga_meditation', label: 'Yoga & Meditation', category: 'Health & Wellness', mcc: '7941' },

  // ═══════════════════════════════════
  // Home & Garden
  // ═══════════════════════════════════
  { value: 'home_garden', label: 'Home & Garden', category: 'Home & Garden', mcc: '5200' },
  { value: 'furniture', label: 'Furniture & Décor', category: 'Home & Garden', mcc: '5712' },
  { value: 'home_improvement', label: 'Home Improvement & Contractors', category: 'Home & Garden', mcc: '5211' },
  { value: 'kitchen_appliances', label: 'Kitchen & Home Appliances', category: 'Home & Garden', mcc: '5722' },
  { value: 'garden_nursery', label: 'Garden Centers & Nurseries', category: 'Home & Garden', mcc: '5261' },
  { value: 'interior_design', label: 'Interior Design Services', category: 'Home & Garden', mcc: '7389' },
  { value: 'pest_control', label: 'Pest Control Services', category: 'Home & Garden', mcc: '7342' },

  // ═══════════════════════════════════
  // Insurance
  // ═══════════════════════════════════
  { value: 'life_insurance', label: 'Life Insurance', category: 'Insurance', mcc: '6300' },
  { value: 'health_insurance', label: 'Health Insurance', category: 'Insurance', mcc: '6300' },
  { value: 'auto_insurance', label: 'Auto Insurance', category: 'Insurance', mcc: '6300' },
  { value: 'property_insurance', label: 'Property & Casualty Insurance', category: 'Insurance', mcc: '6300' },
  { value: 'travel_insurance', label: 'Travel Insurance', category: 'Insurance', mcc: '6300' },

  // ═══════════════════════════════════
  // Non-Profit & Charity
  // ═══════════════════════════════════
  { value: 'non_profit_org', label: 'Non-Profit Organization', category: 'Non-Profit & Charity', mcc: '8398' },
  { value: 'charitable_donations', label: 'Charitable & Social Organizations', category: 'Non-Profit & Charity', mcc: '8661' },
  { value: 'political_organizations', label: 'Political Organizations', category: 'Non-Profit & Charity', mcc: '8651' },
  { value: 'religious_organizations', label: 'Religious Organizations', category: 'Non-Profit & Charity', mcc: '8661' },
  { value: 'fundraising', label: 'Fundraising & Crowdfunding', category: 'Non-Profit & Charity', mcc: '8398' },
  { value: 'humanitarian', label: 'Humanitarian & Relief Organizations', category: 'Non-Profit & Charity', mcc: '8398' },

  // ═══════════════════════════════════
  // Pets & Animals
  // ═══════════════════════════════════
  { value: 'pets_animals', label: 'Pets & Animals', category: 'Pets & Animals', mcc: '5995' },
  { value: 'veterinary', label: 'Veterinary Services', category: 'Pets & Animals', mcc: '0742' },
  { value: 'pet_grooming', label: 'Pet Grooming & Boarding', category: 'Pets & Animals', mcc: '7299' },
  { value: 'pet_food_supplies', label: 'Pet Food & Supplies', category: 'Pets & Animals', mcc: '5995' },

  // ═══════════════════════════════════
  // Professional Services
  // ═══════════════════════════════════
  { value: 'professional_services', label: 'Professional Services (General)', category: 'Professional Services', mcc: '7399' },
  { value: 'architecture_engineering', label: 'Architecture & Engineering', category: 'Professional Services', mcc: '8911' },
  { value: 'photography', label: 'Photography', category: 'Professional Services', mcc: '7332' },
  { value: 'cleaning_services', label: 'Cleaning & Janitorial', category: 'Professional Services', mcc: '7349' },
  { value: 'landscaping', label: 'Landscaping & Lawn Care', category: 'Professional Services', mcc: '0780' },
  { value: 'graphic_design', label: 'Graphic Design & Branding', category: 'Professional Services', mcc: '7336' },
  { value: 'web_development', label: 'Web Development & IT Services', category: 'Professional Services', mcc: '7372' },
  { value: 'video_production', label: 'Video & Film Production', category: 'Professional Services', mcc: '7812' },
  { value: 'security_services', label: 'Security & Guard Services', category: 'Professional Services', mcc: '7382' },
  { value: 'moving_storage', label: 'Moving & Storage', category: 'Professional Services', mcc: '4214' },

  // ═══════════════════════════════════
  // Real Estate & Property
  // ═══════════════════════════════════
  { value: 'real_estate_agents', label: 'Real Estate Agents & Brokers', category: 'Real Estate & Property', mcc: '6513' },
  { value: 'property_management', label: 'Property Management', category: 'Real Estate & Property', mcc: '6513' },
  { value: 'vacation_rentals', label: 'Vacation Rentals & Airbnb', category: 'Real Estate & Property', mcc: '7011' },
  { value: 'coworking_spaces', label: 'Coworking & Office Spaces', category: 'Real Estate & Property', mcc: '6513' },

  // ═══════════════════════════════════
  // Retail
  // ═══════════════════════════════════
  { value: 'retail', label: 'Retail (General)', category: 'Retail', mcc: '5999' },
  { value: 'department_stores', label: 'Department Stores', category: 'Retail', mcc: '5311' },
  { value: 'variety_stores', label: 'Variety & Discount Stores', category: 'Retail', mcc: '5331' },
  { value: 'convenience_stores', label: 'Convenience Stores', category: 'Retail', mcc: '5499' },
  { value: 'warehouse_clubs', label: 'Warehouse Clubs & Wholesale', category: 'Retail', mcc: '5300' },
  { value: 'gift_shops', label: 'Gift Shops & Novelty', category: 'Retail', mcc: '5947' },
  { value: 'florists', label: 'Florists & Flower Shops', category: 'Retail', mcc: '5992' },
  { value: 'tobacco_vape', label: 'Tobacco & Vape Shops', category: 'Retail', mcc: '5993' },

  // ═══════════════════════════════════
  // Sports & Recreation
  // ═══════════════════════════════════
  { value: 'sports_outdoors', label: 'Sports & Outdoors', category: 'Sports & Recreation', mcc: '5941' },
  { value: 'sporting_goods', label: 'Sporting Goods & Equipment', category: 'Sports & Recreation', mcc: '5941' },
  { value: 'golf_courses', label: 'Golf Courses & Country Clubs', category: 'Sports & Recreation', mcc: '7992' },
  { value: 'swimming_pools', label: 'Swimming Pools & Aquatic Centers', category: 'Sports & Recreation', mcc: '7941' },
  { value: 'ski_snowboard', label: 'Ski & Snowboard Resorts', category: 'Sports & Recreation', mcc: '7012' },
  { value: 'camping_outdoors', label: 'Camping & Outdoor Recreation', category: 'Sports & Recreation', mcc: '7033' },
  { value: 'martial_arts', label: 'Martial Arts & Self-Defense', category: 'Sports & Recreation', mcc: '7941' },
  { value: 'bicycle_shops', label: 'Bicycle Shops & Repairs', category: 'Sports & Recreation', mcc: '5571' },

  // ═══════════════════════════════════
  // Telecommunications
  // ═══════════════════════════════════
  { value: 'telecom', label: 'Telecommunications', category: 'Telecommunications', mcc: '4814' },
  { value: 'internet_service', label: 'Internet Service Providers', category: 'Telecommunications', mcc: '4816' },
  { value: 'cable_satellite', label: 'Cable & Satellite TV', category: 'Telecommunications', mcc: '4899' },
  { value: 'voip_services', label: 'VoIP & Communication Services', category: 'Telecommunications', mcc: '4814' },

  // ═══════════════════════════════════
  // Transportation & Travel
  // ═══════════════════════════════════
  { value: 'travel', label: 'Travel (General)', category: 'Transportation & Travel', mcc: '4722' },
  { value: 'airlines', label: 'Airlines & Aviation', category: 'Transportation & Travel', mcc: '4511' },
  { value: 'hotels_lodging', label: 'Hotels & Lodging', category: 'Transportation & Travel', mcc: '7011' },
  { value: 'car_rental', label: 'Car Rental & Ride Services', category: 'Transportation & Travel', mcc: '7512' },
  { value: 'travel_agency', label: 'Travel Agencies & Tour Operators', category: 'Transportation & Travel', mcc: '4722' },
  { value: 'transportation', label: 'Transportation & Logistics', category: 'Transportation & Travel', mcc: '4789' },
  { value: 'cruise_lines', label: 'Cruise Lines', category: 'Transportation & Travel', mcc: '4411' },
  { value: 'bus_coach', label: 'Bus & Coach Services', category: 'Transportation & Travel', mcc: '4131' },
  { value: 'freight_shipping', label: 'Freight & Shipping Services', category: 'Transportation & Travel', mcc: '4214' },
  { value: 'taxi_rideshare', label: 'Taxi & Rideshare', category: 'Transportation & Travel', mcc: '4121' },
  { value: 'parking_garages', label: 'Parking Lots & Garages', category: 'Transportation & Travel', mcc: '7523' },

  // ═══════════════════════════════════
  // Utilities
  // ═══════════════════════════════════
  { value: 'utilities', label: 'Utilities (Electric, Gas, Water)', category: 'Utilities', mcc: '4900' },
  { value: 'waste_management', label: 'Waste Management & Sanitation', category: 'Utilities', mcc: '4214' },

  // ═══════════════════════════════════
  // Vehicles & Automotive
  // ═══════════════════════════════════
  { value: 'vehicle_sales', label: 'Vehicle Sales', category: 'Vehicles & Automotive', mcc: '5511' },
  { value: 'auto_parts', label: 'Auto Parts & Accessories', category: 'Vehicles & Automotive', mcc: '5533' },
  { value: 'auto_service', label: 'Auto Service & Repair', category: 'Vehicles & Automotive', mcc: '7538' },
  { value: 'motorcycle_dealers', label: 'Motorcycle Dealers & Parts', category: 'Vehicles & Automotive', mcc: '5571' },
  { value: 'boat_marine', label: 'Boat & Marine Dealers', category: 'Vehicles & Automotive', mcc: '5551' },
  { value: 'rv_dealers', label: 'RV & Camper Dealers', category: 'Vehicles & Automotive', mcc: '5561' },
  { value: 'gas_stations', label: 'Gas Stations & Fuel', category: 'Vehicles & Automotive', mcc: '5541' },
  { value: 'car_wash', label: 'Car Wash & Detailing', category: 'Vehicles & Automotive', mcc: '7542' },
  { value: 'towing_services', label: 'Towing Services', category: 'Vehicles & Automotive', mcc: '7549' },
  { value: 'ev_charging', label: 'EV Charging Stations', category: 'Vehicles & Automotive', mcc: '5541' },

  // ═══════════════════════════════════
  // Wedding & Events
  // ═══════════════════════════════════
  { value: 'wedding_planning', label: 'Wedding Planning & Services', category: 'Wedding & Events', mcc: '7299' },
  { value: 'event_venues', label: 'Event Venues & Banquet Halls', category: 'Wedding & Events', mcc: '7299' },
  { value: 'dj_entertainment', label: 'DJ & Entertainment Services', category: 'Wedding & Events', mcc: '7929' },
  { value: 'party_supplies', label: 'Party Supplies & Decorations', category: 'Wedding & Events', mcc: '5947' },

  // ═══════════════════════════════════
  // Other
  // ═══════════════════════════════════
  { value: 'other', label: 'Other / Not Listed', category: 'Other', mcc: '5999' },
];

// Grouped for use in select dropdowns
export function getIndustryGroups() {
  const groups: Record<string, typeof INDUSTRY_CATEGORIES> = {};
  for (const ind of INDUSTRY_CATEGORIES) {
    if (!groups[ind.category]) groups[ind.category] = [];
    groups[ind.category].push(ind);
  }
  return groups;
}

// Lookup MCC by industry value
export function getMccByIndustry(industryValue: string): string | null {
  const found = INDUSTRY_CATEGORIES.find(i => i.value === industryValue);
  return found?.mcc || null;
}
