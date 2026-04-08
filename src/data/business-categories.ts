// Extensive business types and industry categories
// Modeled after PayPal's business categories for comprehensive merchant onboarding

export const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 'corporation', label: 'Corporation' },
  { value: 's_corporation', label: 'S Corporation' },
  { value: 'c_corporation', label: 'C Corporation' },
  { value: 'non_profit', label: 'Non-Profit Organization' },
  { value: 'government', label: 'Government Entity' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'trust', label: 'Trust' },
  { value: 'joint_venture', label: 'Joint Venture' },
  { value: 'franchise', label: 'Franchise' },
  { value: 'holding_company', label: 'Holding Company' },
  { value: 'publicly_traded', label: 'Publicly Traded Company' },
  { value: 'freelancer', label: 'Freelancer / Independent Contractor' },
] as const;

export interface IndustryCategory {
  value: string;
  label: string;
  mcc?: string;
  subcategories?: { value: string; label: string; mcc?: string }[];
}

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    value: 'arts_crafts_collectibles', label: 'Arts, Crafts & Collectibles', mcc: '5970',
    subcategories: [
      { value: 'antiques', label: 'Antiques', mcc: '5932' },
      { value: 'art_supplies', label: 'Art & Craft Supplies', mcc: '5970' },
      { value: 'art_dealers_galleries', label: 'Art Dealers & Galleries', mcc: '5971' },
      { value: 'camera_photo', label: 'Camera & Photographic Supplies', mcc: '5946' },
      { value: 'digital_art', label: 'Digital Art', mcc: '5971' },
      { value: 'memorabilia', label: 'Memorabilia', mcc: '5999' },
      { value: 'music_instruments', label: 'Musical Instruments', mcc: '5733' },
      { value: 'stamps_coins', label: 'Stamps & Coins', mcc: '5972' },
      { value: 'vintage_collectibles', label: 'Vintage & Collectibles', mcc: '5999' },
    ],
  },
  {
    value: 'baby', label: 'Baby', mcc: '5641',
    subcategories: [
      { value: 'baby_clothing', label: 'Baby Clothing', mcc: '5641' },
      { value: 'baby_products', label: 'Baby Products & Supplies', mcc: '5999' },
      { value: 'childcare', label: 'Childcare Services', mcc: '8351' },
    ],
  },
  {
    value: 'beauty_fragrances', label: 'Beauty & Fragrances', mcc: '5977',
    subcategories: [
      { value: 'cosmetics', label: 'Cosmetics & Skincare', mcc: '5977' },
      { value: 'fragrances', label: 'Fragrances & Perfumes', mcc: '5977' },
      { value: 'salon_spa', label: 'Salon & Spa Services', mcc: '7230' },
      { value: 'bath_body', label: 'Bath & Body Products', mcc: '5977' },
    ],
  },
  {
    value: 'books_magazines', label: 'Books & Magazines', mcc: '5192',
    subcategories: [
      { value: 'books', label: 'Books', mcc: '5942' },
      { value: 'digital_content', label: 'Digital Content & eBooks', mcc: '5815' },
      { value: 'magazines_newspapers', label: 'Magazines & Newspapers', mcc: '5994' },
      { value: 'publishing', label: 'Publishing & Printing', mcc: '2741' },
    ],
  },
  {
    value: 'b2b', label: 'Business to Business (B2B)', mcc: '5999',
    subcategories: [
      { value: 'accounting', label: 'Accounting & Bookkeeping', mcc: '8931' },
      { value: 'advertising', label: 'Advertising & Marketing', mcc: '7311' },
      { value: 'consulting', label: 'Business Consulting', mcc: '7392' },
      { value: 'data_analytics', label: 'Data Analytics & BI', mcc: '7372' },
      { value: 'hr_staffing', label: 'HR & Staffing', mcc: '7361' },
      { value: 'industrial_supply', label: 'Industrial & Manufacturing Supply', mcc: '5085' },
      { value: 'legal_services', label: 'Legal Services', mcc: '8111' },
      { value: 'office_supplies', label: 'Office Supplies & Equipment', mcc: '5943' },
      { value: 'shipping_logistics', label: 'Shipping & Logistics', mcc: '4215' },
      { value: 'wholesale', label: 'Wholesale', mcc: '5099' },
    ],
  },
  {
    value: 'clothing_accessories', label: 'Clothing, Accessories & Shoes', mcc: '5651',
    subcategories: [
      { value: 'mens_clothing', label: "Men's Clothing", mcc: '5611' },
      { value: 'womens_clothing', label: "Women's Clothing", mcc: '5621' },
      { value: 'childrens_clothing', label: "Children's Clothing", mcc: '5641' },
      { value: 'shoes', label: 'Shoes & Footwear', mcc: '5661' },
      { value: 'accessories', label: 'Accessories & Jewelry', mcc: '5944' },
      { value: 'watches', label: 'Watches & Luxury Goods', mcc: '5094' },
      { value: 'sportswear', label: 'Sportswear & Athletic', mcc: '5655' },
    ],
  },
  {
    value: 'computers_tech', label: 'Computers, Tech & Services', mcc: '5734',
    subcategories: [
      { value: 'computer_hardware', label: 'Computer Hardware', mcc: '5045' },
      { value: 'computer_software', label: 'Computer Software', mcc: '5734' },
      { value: 'it_services', label: 'IT Services & Support', mcc: '7379' },
      { value: 'web_hosting', label: 'Web Hosting & Domains', mcc: '4816' },
      { value: 'networking', label: 'Networking Equipment', mcc: '5065' },
      { value: 'cybersecurity', label: 'Cybersecurity Services', mcc: '7372' },
    ],
  },
  {
    value: 'education', label: 'Education', mcc: '8299',
    subcategories: [
      { value: 'online_courses', label: 'Online Courses & E-Learning', mcc: '5818' },
      { value: 'tutoring', label: 'Tutoring & Coaching', mcc: '8299' },
      { value: 'schools', label: 'Schools & Universities', mcc: '8211' },
      { value: 'vocational_training', label: 'Vocational & Trade Training', mcc: '8249' },
      { value: 'educational_supplies', label: 'Educational Supplies', mcc: '5943' },
      { value: 'test_prep', label: 'Test Preparation', mcc: '8299' },
    ],
  },
  {
    value: 'electronics_telecom', label: 'Electronics & Telecom', mcc: '5732',
    subcategories: [
      { value: 'consumer_electronics', label: 'Consumer Electronics', mcc: '5732' },
      { value: 'mobile_phones', label: 'Mobile Phones & Accessories', mcc: '5065' },
      { value: 'telecom_services', label: 'Telecom Services', mcc: '4814' },
      { value: 'audio_video', label: 'Audio & Video Equipment', mcc: '5732' },
      { value: 'home_automation', label: 'Home Automation & Smart Devices', mcc: '5065' },
    ],
  },
  {
    value: 'entertainment_media', label: 'Entertainment & Media', mcc: '7829',
    subcategories: [
      { value: 'streaming', label: 'Streaming Services', mcc: '5815' },
      { value: 'gaming', label: 'Gaming & eSports', mcc: '5816' },
      { value: 'music', label: 'Music & Audio', mcc: '5735' },
      { value: 'movies_film', label: 'Movies & Film Production', mcc: '7829' },
      { value: 'event_tickets', label: 'Event Tickets & Entertainment', mcc: '7922' },
      { value: 'podcasting', label: 'Podcasting & Content Creation', mcc: '5815' },
    ],
  },
  {
    value: 'financial_services', label: 'Financial Services & Products', mcc: '6012',
    subcategories: [
      { value: 'fintech', label: 'Fintech & Digital Payments', mcc: '6012' },
      { value: 'insurance', label: 'Insurance', mcc: '6300' },
      { value: 'investments', label: 'Investment Services', mcc: '6211' },
      { value: 'lending', label: 'Lending & Credit', mcc: '6153' },
      { value: 'money_transfer', label: 'Money Transfer & Remittance', mcc: '6051' },
      { value: 'crypto_blockchain', label: 'Cryptocurrency & Blockchain', mcc: '6051' },
      { value: 'tax_preparation', label: 'Tax Preparation', mcc: '7276' },
      { value: 'wealth_management', label: 'Wealth Management', mcc: '6282' },
    ],
  },
  {
    value: 'food_retail', label: 'Food Retail & Service', mcc: '5812',
    subcategories: [
      { value: 'restaurants', label: 'Restaurants & Cafés', mcc: '5812' },
      { value: 'fast_food', label: 'Fast Food & QSR', mcc: '5814' },
      { value: 'catering', label: 'Catering Services', mcc: '5811' },
      { value: 'food_delivery', label: 'Food Delivery & Meal Kits', mcc: '5812' },
      { value: 'grocery', label: 'Grocery & Supermarkets', mcc: '5411' },
      { value: 'bakery', label: 'Bakery & Confectionery', mcc: '5462' },
      { value: 'beverages', label: 'Beverages & Wine', mcc: '5921' },
      { value: 'specialty_food', label: 'Specialty & Organic Food', mcc: '5499' },
    ],
  },
  {
    value: 'gifts_flowers', label: 'Gifts & Flowers', mcc: '5947',
    subcategories: [
      { value: 'gift_shops', label: 'Gift Shops', mcc: '5947' },
      { value: 'flowers', label: 'Florists', mcc: '5992' },
      { value: 'party_supplies', label: 'Party Supplies', mcc: '5947' },
      { value: 'stationery', label: 'Stationery & Greeting Cards', mcc: '5943' },
    ],
  },
  {
    value: 'government', label: 'Government', mcc: '9399',
    subcategories: [
      { value: 'gov_services', label: 'Government Services', mcc: '9399' },
      { value: 'public_utilities', label: 'Public Utilities', mcc: '4900' },
    ],
  },
  {
    value: 'health_personal_care', label: 'Health & Personal Care', mcc: '8099',
    subcategories: [
      { value: 'healthcare_services', label: 'Healthcare Services', mcc: '8099' },
      { value: 'pharmacy', label: 'Pharmacy & Drug Stores', mcc: '5912' },
      { value: 'dental', label: 'Dental Services', mcc: '8021' },
      { value: 'optometry', label: 'Optometry & Vision Care', mcc: '8042' },
      { value: 'mental_health', label: 'Mental Health Services', mcc: '8049' },
      { value: 'fitness_gym', label: 'Fitness & Gym', mcc: '7941' },
      { value: 'supplements', label: 'Health Supplements & Vitamins', mcc: '5499' },
      { value: 'telemedicine', label: 'Telemedicine & Digital Health', mcc: '8099' },
      { value: 'medical_devices', label: 'Medical Devices & Equipment', mcc: '5047' },
    ],
  },
  {
    value: 'home_garden', label: 'Home & Garden', mcc: '5200',
    subcategories: [
      { value: 'furniture', label: 'Furniture', mcc: '5712' },
      { value: 'home_decor', label: 'Home Décor & Interior Design', mcc: '5714' },
      { value: 'hardware_tools', label: 'Hardware & Tools', mcc: '5251' },
      { value: 'garden_supplies', label: 'Garden & Landscaping', mcc: '5261' },
      { value: 'kitchen_appliances', label: 'Kitchen & Appliances', mcc: '5722' },
      { value: 'home_improvement', label: 'Home Improvement & Renovation', mcc: '5211' },
      { value: 'cleaning_supplies', label: 'Cleaning Supplies', mcc: '5999' },
    ],
  },
  {
    value: 'nonprofit', label: 'Nonprofit & Charity', mcc: '8398',
    subcategories: [
      { value: 'charitable_org', label: 'Charitable Organizations', mcc: '8398' },
      { value: 'fundraising', label: 'Fundraising & Crowdfunding', mcc: '8398' },
      { value: 'religious_org', label: 'Religious Organizations', mcc: '8661' },
      { value: 'political_org', label: 'Political Organizations', mcc: '8651' },
    ],
  },
  {
    value: 'pets_animals', label: 'Pets & Animals', mcc: '5995',
    subcategories: [
      { value: 'pet_supplies', label: 'Pet Supplies & Food', mcc: '5995' },
      { value: 'veterinary', label: 'Veterinary Services', mcc: '742' },
      { value: 'pet_grooming', label: 'Pet Grooming & Boarding', mcc: '7299' },
    ],
  },
  {
    value: 'real_estate', label: 'Real Estate', mcc: '6513',
    subcategories: [
      { value: 'property_management', label: 'Property Management', mcc: '6513' },
      { value: 'real_estate_agents', label: 'Real Estate Agents', mcc: '6513' },
      { value: 'vacation_rentals', label: 'Vacation Rentals', mcc: '7011' },
      { value: 'coworking', label: 'Coworking Spaces', mcc: '6513' },
    ],
  },
  {
    value: 'retail', label: 'Retail (General)', mcc: '5999',
    subcategories: [
      { value: 'e_commerce', label: 'E-Commerce & Online Retail', mcc: '5999' },
      { value: 'marketplace', label: 'Marketplace & Multi-vendor', mcc: '5999' },
      { value: 'department_stores', label: 'Department Stores', mcc: '5311' },
      { value: 'convenience_stores', label: 'Convenience Stores', mcc: '5331' },
      { value: 'discount_stores', label: 'Discount & Dollar Stores', mcc: '5310' },
      { value: 'subscription_box', label: 'Subscription Box Services', mcc: '5999' },
    ],
  },
  {
    value: 'saas_software', label: 'SaaS & Software', mcc: '5817',
    subcategories: [
      { value: 'saas', label: 'SaaS / Cloud Software', mcc: '5817' },
      { value: 'mobile_apps', label: 'Mobile Apps', mcc: '5817' },
      { value: 'developer_tools', label: 'Developer Tools & APIs', mcc: '5817' },
      { value: 'enterprise_software', label: 'Enterprise Software', mcc: '7372' },
      { value: 'ai_ml', label: 'AI / Machine Learning Services', mcc: '7372' },
    ],
  },
  {
    value: 'services_other', label: 'Professional Services', mcc: '7399',
    subcategories: [
      { value: 'photography', label: 'Photography & Videography', mcc: '7333' },
      { value: 'graphic_design', label: 'Graphic Design', mcc: '7336' },
      { value: 'cleaning_services', label: 'Cleaning & Janitorial', mcc: '7349' },
      { value: 'event_planning', label: 'Event Planning', mcc: '7399' },
      { value: 'translation', label: 'Translation & Localization', mcc: '7389' },
      { value: 'moving_storage', label: 'Moving & Storage', mcc: '4214' },
      { value: 'security_services', label: 'Security Services', mcc: '7382' },
      { value: 'freelance_creative', label: 'Freelance & Creative Services', mcc: '7333' },
    ],
  },
  {
    value: 'sports_outdoors', label: 'Sports & Outdoors', mcc: '5941',
    subcategories: [
      { value: 'sporting_goods', label: 'Sporting Goods', mcc: '5941' },
      { value: 'outdoor_recreation', label: 'Outdoor Recreation', mcc: '7941' },
      { value: 'cycling', label: 'Bicycles & Cycling', mcc: '5940' },
      { value: 'camping_hiking', label: 'Camping & Hiking', mcc: '5941' },
    ],
  },
  {
    value: 'toys_hobbies', label: 'Toys & Hobbies', mcc: '5945',
    subcategories: [
      { value: 'toys', label: 'Toys & Games', mcc: '5945' },
      { value: 'hobby_supplies', label: 'Hobby & Craft Supplies', mcc: '5945' },
      { value: 'model_kits', label: 'Model Kits & RC', mcc: '5945' },
    ],
  },
  {
    value: 'travel', label: 'Travel & Hospitality', mcc: '4722',
    subcategories: [
      { value: 'airlines', label: 'Airlines', mcc: '4511' },
      { value: 'hotels_accommodation', label: 'Hotels & Accommodation', mcc: '7011' },
      { value: 'travel_agencies', label: 'Travel Agencies', mcc: '4722' },
      { value: 'car_rental', label: 'Car Rental', mcc: '7512' },
      { value: 'cruises', label: 'Cruises', mcc: '4411' },
      { value: 'tours_activities', label: 'Tours & Activities', mcc: '7991' },
      { value: 'ride_sharing', label: 'Ride Sharing & Transportation', mcc: '4121' },
    ],
  },
  {
    value: 'vehicle_sales', label: 'Vehicle Sales', mcc: '5511',
    subcategories: [
      { value: 'auto_dealers', label: 'Auto Dealers — New & Used', mcc: '5511' },
      { value: 'motorcycles', label: 'Motorcycles & Powersports', mcc: '5571' },
      { value: 'boats_marine', label: 'Boats & Marine', mcc: '5551' },
    ],
  },
  {
    value: 'vehicle_service', label: 'Vehicle Service & Accessories', mcc: '7538',
    subcategories: [
      { value: 'auto_repair', label: 'Auto Repair & Maintenance', mcc: '7538' },
      { value: 'auto_parts', label: 'Auto Parts & Accessories', mcc: '5533' },
      { value: 'car_wash', label: 'Car Wash & Detailing', mcc: '7542' },
      { value: 'towing', label: 'Towing Services', mcc: '7549' },
      { value: 'fuel_stations', label: 'Fuel Stations', mcc: '5541' },
    ],
  },
  {
    value: 'construction', label: 'Construction & Trades', mcc: '1520',
    subcategories: [
      { value: 'general_contractor', label: 'General Contractors', mcc: '1520' },
      { value: 'electrical', label: 'Electrical Contractors', mcc: '1731' },
      { value: 'plumbing_hvac', label: 'Plumbing & HVAC', mcc: '1711' },
      { value: 'roofing', label: 'Roofing & Siding', mcc: '1761' },
      { value: 'architecture', label: 'Architecture & Engineering', mcc: '8911' },
    ],
  },
  {
    value: 'agriculture', label: 'Agriculture & Farming', mcc: '0763',
    subcategories: [
      { value: 'farming', label: 'Farming & Ranching', mcc: '0763' },
      { value: 'agricultural_supply', label: 'Agricultural Supplies', mcc: '5191' },
      { value: 'agritech', label: 'AgriTech', mcc: '0763' },
    ],
  },
  {
    value: 'media_communications', label: 'Media & Communications', mcc: '4899',
    subcategories: [
      { value: 'pr_communications', label: 'PR & Communications', mcc: '7311' },
      { value: 'broadcasting', label: 'Broadcasting & Cable', mcc: '4899' },
      { value: 'social_media', label: 'Social Media Management', mcc: '7311' },
      { value: 'digital_marketing', label: 'Digital Marketing & SEO', mcc: '7311' },
    ],
  },
];

// Flat list of all industries for simple select dropdowns
export function getFlatIndustryList(): { value: string; label: string; mcc?: string }[] {
  const result: { value: string; label: string; mcc?: string }[] = [];
  for (const cat of INDUSTRY_CATEGORIES) {
    if (cat.subcategories && cat.subcategories.length > 0) {
      for (const sub of cat.subcategories) {
        result.push({ value: sub.value, label: `${cat.label} → ${sub.label}`, mcc: sub.mcc });
      }
    } else {
      result.push({ value: cat.value, label: cat.label, mcc: cat.mcc });
    }
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

// Get MCC code for a given industry value
export function getMccForIndustry(industryValue: string): string | undefined {
  for (const cat of INDUSTRY_CATEGORIES) {
    if (cat.value === industryValue) return cat.mcc;
    if (cat.subcategories) {
      const sub = cat.subcategories.find(s => s.value === industryValue);
      if (sub) return sub.mcc;
    }
  }
  return undefined;
}
