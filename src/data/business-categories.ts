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
];

export const INDUSTRY_CATEGORIES = [
  // Arts, Crafts & Collectibles
  { value: 'antiques', label: 'Antiques', category: 'Arts, Crafts & Collectibles', mcc: '5932' },
  { value: 'art_craft_supplies', label: 'Art & Craft Supplies', category: 'Arts, Crafts & Collectibles', mcc: '5970' },
  { value: 'art_dealers_galleries', label: 'Art Dealers & Galleries', category: 'Arts, Crafts & Collectibles', mcc: '5971' },
  { value: 'camera_photo_supplies', label: 'Camera & Photographic Supplies', category: 'Arts, Crafts & Collectibles', mcc: '5946' },
  { value: 'digital_art', label: 'Digital Art & NFTs', category: 'Arts, Crafts & Collectibles', mcc: '5971' },
  { value: 'memorabilia', label: 'Memorabilia & Collectibles', category: 'Arts, Crafts & Collectibles', mcc: '5999' },
  { value: 'music_instruments', label: 'Musical Instruments & Sheet Music', category: 'Arts, Crafts & Collectibles', mcc: '5733' },
  { value: 'stamps_coins', label: 'Stamps & Coins', category: 'Arts, Crafts & Collectibles', mcc: '5972' },

  // Beauty & Personal Care
  { value: 'beauty_fragrances', label: 'Beauty & Fragrances', category: 'Beauty & Personal Care', mcc: '5977' },
  { value: 'cosmetics', label: 'Cosmetics & Skincare', category: 'Beauty & Personal Care', mcc: '5977' },
  { value: 'bath_body', label: 'Bath & Body Products', category: 'Beauty & Personal Care', mcc: '5977' },

  // Books & Media
  { value: 'books_magazines', label: 'Books & Magazines', category: 'Books & Media', mcc: '5942' },
  { value: 'digital_content', label: 'Digital Content & Media', category: 'Books & Media', mcc: '5815' },
  { value: 'music_movies', label: 'Music, Movies & Entertainment', category: 'Books & Media', mcc: '5735' },

  // Business Services
  { value: 'b2b', label: 'Business to Business (B2B)', category: 'Business Services', mcc: '7399' },
  { value: 'accounting', label: 'Accounting & Bookkeeping', category: 'Business Services', mcc: '8931' },
  { value: 'advertising_marketing', label: 'Advertising & Marketing', category: 'Business Services', mcc: '7311' },
  { value: 'consulting', label: 'Consulting Services', category: 'Business Services', mcc: '7392' },
  { value: 'legal_services', label: 'Legal Services', category: 'Business Services', mcc: '8111' },
  { value: 'office_supplies', label: 'Office & Commercial Supplies', category: 'Business Services', mcc: '5943' },
  { value: 'printing_publishing', label: 'Printing & Publishing', category: 'Business Services', mcc: '2741' },
  { value: 'staffing_recruiting', label: 'Staffing & Recruiting', category: 'Business Services', mcc: '7361' },
  { value: 'real_estate', label: 'Real Estate', category: 'Business Services', mcc: '6513' },

  // Clothing & Accessories
  { value: 'clothing_accessories', label: 'Clothing, Accessories & Shoes', category: 'Clothing & Accessories', mcc: '5651' },
  { value: 'jewelry', label: 'Jewelry & Watches', category: 'Clothing & Accessories', mcc: '5944' },
  { value: 'fashion_wholesale', label: 'Fashion Wholesale & Distribution', category: 'Clothing & Accessories', mcc: '5137' },

  // Computers & Electronics
  { value: 'computers', label: 'Computers & Computer Accessories', category: 'Computers & Electronics', mcc: '5734' },
  { value: 'electronics_telecom', label: 'Electronics & Telecom', category: 'Computers & Electronics', mcc: '5732' },
  { value: 'network_equipment', label: 'Networking Equipment', category: 'Computers & Electronics', mcc: '5734' },
  { value: 'software', label: 'Software & Digital Goods', category: 'Computers & Electronics', mcc: '5817' },

  // E-Commerce & Digital
  { value: 'e_commerce', label: 'E-Commerce (General)', category: 'E-Commerce & Digital', mcc: '5999' },
  { value: 'marketplace', label: 'Online Marketplace / Platform', category: 'E-Commerce & Digital', mcc: '5999' },
  { value: 'saas', label: 'Software as a Service (SaaS)', category: 'E-Commerce & Digital', mcc: '5817' },
  { value: 'subscription_services', label: 'Subscription Services', category: 'E-Commerce & Digital', mcc: '5968' },
  { value: 'digital_services', label: 'Digital Services', category: 'E-Commerce & Digital', mcc: '5818' },
  { value: 'web_hosting', label: 'Web Hosting & Domains', category: 'E-Commerce & Digital', mcc: '4816' },

  // Education
  { value: 'education', label: 'Education (General)', category: 'Education', mcc: '8299' },
  { value: 'online_education', label: 'Online Courses & E-Learning', category: 'Education', mcc: '8299' },
  { value: 'tutoring', label: 'Tutoring & Test Prep', category: 'Education', mcc: '8299' },
  { value: 'vocational_schools', label: 'Vocational & Trade Schools', category: 'Education', mcc: '8249' },

  // Entertainment & Media
  { value: 'entertainment_media', label: 'Entertainment & Media (General)', category: 'Entertainment & Media', mcc: '7922' },
  { value: 'gaming', label: 'Gaming & Esports', category: 'Entertainment & Media', mcc: '7993' },
  { value: 'online_gaming', label: 'Online Gaming & Virtual Goods', category: 'Entertainment & Media', mcc: '5816' },
  { value: 'streaming', label: 'Streaming & Content Platforms', category: 'Entertainment & Media', mcc: '4899' },
  { value: 'events_ticketing', label: 'Events & Ticketing', category: 'Entertainment & Media', mcc: '7922' },

  // Financial Services
  { value: 'fintech', label: 'Financial Technology (Fintech)', category: 'Financial Services', mcc: '6012' },
  { value: 'insurance', label: 'Insurance', category: 'Financial Services', mcc: '6300' },
  { value: 'money_transfer', label: 'Money Transfer & Remittance', category: 'Financial Services', mcc: '6051' },
  { value: 'crypto_blockchain', label: 'Cryptocurrency & Blockchain', category: 'Financial Services', mcc: '6051' },
  { value: 'lending', label: 'Lending & Credit', category: 'Financial Services', mcc: '6153' },
  { value: 'investment_securities', label: 'Investment & Securities', category: 'Financial Services', mcc: '6211' },

  // Food & Beverage
  { value: 'food_retail', label: 'Food Retail & Grocery', category: 'Food & Beverage', mcc: '5411' },
  { value: 'restaurants_dining', label: 'Restaurants & Dining', category: 'Food & Beverage', mcc: '5812' },
  { value: 'catering', label: 'Catering Services', category: 'Food & Beverage', mcc: '5811' },
  { value: 'food_delivery', label: 'Food Delivery & Meal Kits', category: 'Food & Beverage', mcc: '5812' },
  { value: 'bars_nightlife', label: 'Bars & Nightlife', category: 'Food & Beverage', mcc: '5813' },

  // Health & Wellness
  { value: 'healthcare', label: 'Healthcare (General)', category: 'Health & Wellness', mcc: '8099' },
  { value: 'dental', label: 'Dental Services', category: 'Health & Wellness', mcc: '8021' },
  { value: 'medical_services', label: 'Medical Services', category: 'Health & Wellness', mcc: '8011' },
  { value: 'pharmacy', label: 'Pharmacy & Drug Stores', category: 'Health & Wellness', mcc: '5912' },
  { value: 'health_supplements', label: 'Health Supplements & Vitamins', category: 'Health & Wellness', mcc: '5499' },
  { value: 'fitness_gym', label: 'Fitness & Gym', category: 'Health & Wellness', mcc: '7941' },
  { value: 'mental_health', label: 'Mental Health & Therapy', category: 'Health & Wellness', mcc: '8049' },
  { value: 'telehealth', label: 'Telehealth & Digital Health', category: 'Health & Wellness', mcc: '8099' },

  // Home & Garden
  { value: 'home_garden', label: 'Home & Garden', category: 'Home & Garden', mcc: '5200' },
  { value: 'furniture', label: 'Furniture & Décor', category: 'Home & Garden', mcc: '5712' },
  { value: 'home_improvement', label: 'Home Improvement & Contractors', category: 'Home & Garden', mcc: '5211' },

  // Non-Profit & Charity
  { value: 'non_profit_org', label: 'Non-Profit Organization', category: 'Non-Profit & Charity', mcc: '8398' },
  { value: 'charitable_donations', label: 'Charitable & Social Organizations', category: 'Non-Profit & Charity', mcc: '8661' },
  { value: 'political_organizations', label: 'Political Organizations', category: 'Non-Profit & Charity', mcc: '8651' },
  { value: 'religious_organizations', label: 'Religious Organizations', category: 'Non-Profit & Charity', mcc: '8661' },

  // Pets & Animals
  { value: 'pets_animals', label: 'Pets & Animals', category: 'Pets & Animals', mcc: '5995' },
  { value: 'veterinary', label: 'Veterinary Services', category: 'Pets & Animals', mcc: '0742' },

  // Professional Services
  { value: 'professional_services', label: 'Professional Services (General)', category: 'Professional Services', mcc: '7399' },
  { value: 'architecture_engineering', label: 'Architecture & Engineering', category: 'Professional Services', mcc: '8911' },
  { value: 'photography', label: 'Photography', category: 'Professional Services', mcc: '7332' },
  { value: 'cleaning_services', label: 'Cleaning & Janitorial', category: 'Professional Services', mcc: '7349' },
  { value: 'landscaping', label: 'Landscaping & Lawn Care', category: 'Professional Services', mcc: '0780' },

  // Retail
  { value: 'retail', label: 'Retail (General)', category: 'Retail', mcc: '5999' },
  { value: 'department_stores', label: 'Department Stores', category: 'Retail', mcc: '5311' },
  { value: 'variety_stores', label: 'Variety & Discount Stores', category: 'Retail', mcc: '5331' },
  { value: 'convenience_stores', label: 'Convenience Stores', category: 'Retail', mcc: '5499' },

  // Sports & Recreation
  { value: 'sports_outdoors', label: 'Sports & Outdoors', category: 'Sports & Recreation', mcc: '5941' },
  { value: 'sporting_goods', label: 'Sporting Goods & Equipment', category: 'Sports & Recreation', mcc: '5941' },

  // Transportation & Travel
  { value: 'travel', label: 'Travel (General)', category: 'Transportation & Travel', mcc: '4722' },
  { value: 'airlines', label: 'Airlines & Aviation', category: 'Transportation & Travel', mcc: '4511' },
  { value: 'hotels_lodging', label: 'Hotels & Lodging', category: 'Transportation & Travel', mcc: '7011' },
  { value: 'car_rental', label: 'Car Rental & Ride Services', category: 'Transportation & Travel', mcc: '7512' },
  { value: 'travel_agency', label: 'Travel Agencies & Tour Operators', category: 'Transportation & Travel', mcc: '4722' },
  { value: 'transportation', label: 'Transportation & Logistics', category: 'Transportation & Travel', mcc: '4789' },

  // Vehicles
  { value: 'vehicle_sales', label: 'Vehicle Sales', category: 'Vehicles', mcc: '5511' },
  { value: 'auto_parts', label: 'Auto Parts & Accessories', category: 'Vehicles', mcc: '5533' },
  { value: 'auto_service', label: 'Auto Service & Repair', category: 'Vehicles', mcc: '7538' },

  // Utilities & Telecom
  { value: 'utilities', label: 'Utilities', category: 'Utilities & Telecom', mcc: '4900' },
  { value: 'telecom', label: 'Telecommunications', category: 'Utilities & Telecom', mcc: '4814' },

  // Other
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
