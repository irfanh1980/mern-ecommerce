// Server-side mirror of client/src/constants/categoryAttributes.js
// Used to validate that submitted attributes match the selected category.

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

const VEHICLE_ATTRIBUTES = [
  { key: 'brand', label: 'Brand', type: 'text' },
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
    { key: 'gender', label: 'Sex/Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'] },
    { key: 'size', label: 'Size', type: 'select', dependsOn: 'gender', optionsBy: SIZE_BY_GENDER },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'material', label: 'Material', type: 'text' },
    { key: 'color', label: 'Color', type: 'select', options: COLOR_OPTIONS },
  ],
  'Electronics and appliances': [
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'storage', label: 'Storage capacity', type: 'text' },
    { key: 'color', label: 'Color', type: 'select', options: COLOR_OPTIONS },
  ],
  'Furniture and interior design': [
    { key: 'material', label: 'Material', type: 'select', options: ['Wood', 'Metal', 'Leather', 'Fabric'] },
    { key: 'brand', label: 'Brand', type: 'text' },
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
  _default: [{ key: 'brand', label: 'Brand', type: 'text' }],
};

export function getCategoryAttributeKeys(category) {
  const attrs = (category && CATEGORY_ATTRIBUTES[category]) || CATEGORY_ATTRIBUTES._default;
  return attrs.map((a) => a.key);
}