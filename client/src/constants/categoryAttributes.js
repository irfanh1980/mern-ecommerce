// Dynamic, category-specific listing attributes.
// Universal fields (title, description, condition, price) live on the product
// itself; these attributes are rendered in the listing form based on the
// selected category and become search filters on the marketplace.

const COLOR_OPTIONS = [
  'Black',
  'White',
  'Grey',
  'Navy/Dark Blue',
  'Blue',
  'Beige/Cream',
  'Brown',
  'Green',
  'Red',
  'Burgundy',
  'Pink',
  'Purple',
  'Yellow',
  'Orange',
  'Gold / Silver',
  'Multi-colored / Patterned',
];

const LETTER_SIZES = { label: 'Letter sizes', options: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'] };
const EU_MEN_SIZES = { label: "EU suit / blazer (Men's)", options: ['44', '46', '48', '50', '52', '54', '56', '58', '60'] };
const EU_WOMEN_SIZES = { label: "EU sizes (Women's)", options: ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50'] };

const SIZE_BY_GENDER = {
  Men: [LETTER_SIZES, EU_MEN_SIZES],
  Women: [LETTER_SIZES, EU_WOMEN_SIZES],
  Unisex: [LETTER_SIZES],
  Kids: [LETTER_SIZES],
  default: [LETTER_SIZES],
};

// Children's clothing is sized in centilong (cl) = child's height in cm,
// in 6 cm increments from 50 (newborn) to 170 (14+ years).
const CHILDREN_CL_SIZE_OPTIONS = [
  '50', '56', '62', '68', '74', '80', '86', '92', '98', '104',
  '110', '116', '122', '128', '134', '140', '146', '152', '158', '164', '170',
];
const CHILDREN_CL_SIZE_GROUPS = [
  { label: "Children's clothing — centilong (height in cm)", options: CHILDREN_CL_SIZE_OPTIONS },
];

const FASHION_BRAND_GROUPS = [
  {
    label: 'Swedish & Nordic high-street',
    options: [
      'H&M', 'Lindex', 'KappAhl', 'Gina Tricot', 'Monki', 'Weekday', 'MQ', 'Cubus', 'Bik Bok',
      'Polarn O. Pyret', 'Didriksons', 'Fjällräven', 'Peak Performance', 'Haglöfs',
    ],
  },
  {
    label: 'Scandinavian contemporary / tailoring',
    options: [
      'Acne Studios', 'Filippa K', 'Tiger of Sweden', 'Oscar Jacobson', 'J.Lindeberg', 'Nudie Jeans',
      'Totême', 'Ganni', 'Samsøe Samsøe', 'COS', 'Arket', '& Other Stories', 'Björn Borg', 'Stenströms', 'Eton',
    ],
  },
  {
    label: 'Global sportswear & denim',
    options: [
      'Nike', 'Adidas', 'Levi’s', 'Puma', 'New Balance', 'The North Face', 'Patagonia', 'Champion',
      'Reebok', 'Converse',
    ],
  },
  {
    label: 'International fashion & luxury',
    options: [
      'Zara', 'Mango', 'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Hugo Boss', 'Lacoste', 'Gant',
      'Marimekko', 'Moncler', 'Balenciaga', 'Gucci', 'Louis Vuitton',
    ],
  },
];
const FASHION_BRANDS = FASHION_BRAND_GROUPS.flatMap((g) => g.options);
const ELECTRONICS_BRANDS = [
  'Apple', 'Samsung', 'Sony', 'LG', 'Huawei', 'Xiaomi', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer',
  'Microsoft', 'Google', 'Canon', 'Nikon', 'Philips', 'Bosch', 'Siemens', 'Electrolux', 'JBL', 'Bose', 'Sennheiser',
];
const FURNITURE_BRANDS = [
  'IKEA', 'Jysk', 'Elfa', 'String', 'Hemtex', 'Ellos', 'Rusta', 'Biltema',
];
const VEHICLE_BRANDS = [
  'Toyota', 'Volvo', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Ford', 'Hyundai', 'Kia', 'Nissan',
  'Honda', 'Mazda', 'Peugeot', 'Renault', 'Skoda', 'Seat', 'Tesla', 'Polestar', 'Lexus', 'Mitsubishi', 'Suzuki',
  'Fiat', 'Opel', 'Citroën',
];

const TEXTILE_MATERIALS = [
  'Cotton', 'Polyester', 'Wool', 'Linen', 'Silk', 'Leather', 'Suede', 'Denim',
  'Nylon / Synthetic', 'Viscose', 'Cashmere', 'Fleece / Down', 'Rubber', 'Mixed materials',
];
const FURNITURE_MATERIALS = [
  'Wood', 'Metal / Steel / Iron / Brass', 'Glass', 'Plastic', 'Fabric / Textile',
  'Leather / Faux leather', 'Stone / Marble / Ceramic / Porcelain', 'Rattan / Bamboo', 'Mixed materials',
];
const JEWELRY_MATERIALS = [
  'Gold', 'Silver', 'Stainless steel', 'Titanium', 'Plated / Base metal',
  'Pearls / Gemstones / Semi-precious stones', 'Mixed materials',
];

const JEWELRY_SUBCATEGORIES = ['Jewelry and jewelry storage', 'Watches and clocks'];

const VEHICLE_ATTRIBUTES = [
  { key: 'brand', label: 'Brand', type: 'select', searchable: true, options: VEHICLE_BRANDS },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'mileage', label: 'Mileage', type: 'number' },
  {
    key: 'fuelType',
    label: 'Fuel type',
    type: 'select',
    options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other'],
  },
];

export const CATEGORY_ATTRIBUTES = {
  'Clothing, cosmetics and accessories': [
    // Rendered separately above the Category field, but kept here so it counts
    // as a valid attribute key for this category.
    { key: 'gender', label: 'Sex/Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'], hidden: true },
    { key: 'size', label: 'Size', type: 'select', dependsOn: 'gender', optionsBy: SIZE_BY_GENDER, resolveGroups: (attrs = {}) => (attrs.subcategory === "Children's clothing" ? CHILDREN_CL_SIZE_GROUPS : attrs.gender ? SIZE_BY_GENDER[attrs.gender] || SIZE_BY_GENDER.default : SIZE_BY_GENDER.default) },
    { key: 'brand', label: 'Brand', type: 'select', searchable: true, groups: FASHION_BRAND_GROUPS },
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      searchable: true,
      resolveGroups: (attrs = {}) =>
        JEWELRY_SUBCATEGORIES.includes(attrs.subcategory)
          ? [{ label: 'Jewelry & watches', options: JEWELRY_MATERIALS }]
          : [{ label: 'Textile & leather', options: TEXTILE_MATERIALS }],
    },
    { key: 'color', label: 'Color', type: 'select', options: COLOR_OPTIONS },
  ],
  'Electronics and appliances': [
    { key: 'brand', label: 'Brand', type: 'select', searchable: true, options: ELECTRONICS_BRANDS },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'storage', label: 'Storage capacity', type: 'text' },
    { key: 'color', label: 'Color', type: 'select', options: COLOR_OPTIONS },
  ],
  'Furniture and interior design': [
    { key: 'material', label: 'Material', type: 'select', searchable: true, options: FURNITURE_MATERIALS },
    { key: 'brand', label: 'Brand', type: 'select', searchable: true, options: FURNITURE_BRANDS },
    { key: 'dimensions', label: 'Dimensions', type: 'text' },
    { key: 'color', label: 'Color', type: 'select', options: COLOR_OPTIONS },
  ],
  'Vehicles & Parts': VEHICLE_ATTRIBUTES,
  Car: VEHICLE_ATTRIBUTES,
  Boat: VEHICLE_ATTRIBUTES,
  'Motorcycles, ATVs and snowmobiles': VEHICLE_ATTRIBUTES,
  'Vehicle accessories': VEHICLE_ATTRIBUTES,
  'Construction and agricultural machinery': VEHICLE_ATTRIBUTES,
  'Motorhome and caravan': VEHICLE_ATTRIBUTES,
  _default: [{ key: 'brand', label: 'Brand', type: 'select', searchable: true, options: FASHION_BRANDS }],
};

export function getCategoryAttributes(category) {
  if (category && CATEGORY_ATTRIBUTES[category]) return CATEGORY_ATTRIBUTES[category];
  return CATEGORY_ATTRIBUTES._default;
}

export function getCategoryAttributeKeys(category) {
  return getCategoryAttributes(category)
    .map((a) => a.key)
    .filter(Boolean);
}

// Keep only the attributes that are valid for the selected category.
export function filterAttributesForCategory(category, attributes = {}) {
  const allowed = new Set(getCategoryAttributeKeys(category));
  return Object.fromEntries(
    Object.entries(attributes).filter(([key, value]) => allowed.has(key) && value !== '' && value != null),
  );
}