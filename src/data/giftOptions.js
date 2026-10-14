export const PACKAGING_OPTIONS = [
  {
    id: 'luxury-ribbon',
    name: 'Luxury Ribbon Box',
    subtitle: 'Gold & Burgundy Silk Ribbon with Velvet Lining',
    price: 3500,
    badge: 'Most Popular',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    description: 'A handcrafted rigid gift box tied with premium satin ribbon and lined with soft velvet shredding.'
  },
  {
    id: 'wooden-crate',
    name: 'Celebration Wooden Crate',
    subtitle: 'Rustic Wooden Box with Eco Shredded Filler',
    price: 5000,
    badge: 'Premium Artisan',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd486a?auto=format&fit=crop&w=800&q=80',
    description: 'Custom pine wood keepsake crate sealed with a custom wax seal stamp and dried botanical accents.'
  },
  {
    id: 'festive-basket',
    name: 'Festive Gift Basket',
    subtitle: 'Woven Basket with Cellophane Wrap & Satin Bow',
    price: 4000,
    badge: 'Festive Classic',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    description: 'Traditional handcrafted wicker basket wrapped in clear cellophane with a lush multi-tiered bow.'
  },
  {
    id: 'sleek-matte',
    name: 'Sleek Matte Gift Box',
    subtitle: 'Minimalist Matte Finish Box with Foil Stamp',
    price: 3000,
    badge: 'Modern Sleek',
    image: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=800&q=80',
    description: 'Elegant monochrome gift box with metallic hot foil stamping and magnetic closure.'
  }
];

export const GREETING_CARD_OPTIONS = [
  {
    id: 'standard-card',
    name: 'Standard Greeting Card',
    price: 500,
    badge: 'Included',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
    description: 'High-quality heavy cardstock card with custom printed note.'
  },
  {
    id: 'gold-foil-card',
    name: 'Embossed Gold Foil Card',
    price: 1500,
    badge: 'Luxury',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
    description: 'Custom gold foil lettering on textured Italian cotton paper.'
  },
  {
    id: 'handcrafted-flower-card',
    name: 'Handcrafted Pressed Flower Card',
    price: 2000,
    badge: 'Artisan',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    description: 'Real dried botanical flowers pressed on handmade Deckle edge paper.'
  }
];

export const GIFT_OCCASIONS = [
  { id: 'birthday', label: '🎂 Birthday', color: '#f59e0b' },
  { id: 'anniversary', label: '💍 Anniversary', color: '#ec4899' },
  { id: 'graduation', label: '🎓 Graduation', color: '#3b82f6' },
  { id: 'appreciation', label: '🙏 Appreciation / Thank You', color: '#10b981' },
  { id: 'celebration', label: '🥳 General Celebration', color: '#8b5cf6' },
  { id: 'wedding', label: '💒 Wedding / Engagement', color: '#f43f5e' },
  { id: 'custom', label: '✨ Custom Special Surprise', color: '#d97706' }
];

export const MONEY_BOUQUET_VARIANTS = [
  { amount: 10000, label: '₦10,000 Cash Bouquet', fee: 3500 },
  { amount: 25000, label: '₦25,000 Cash Bouquet', fee: 4500 },
  { amount: 50000, label: '₦50,000 Cash Bouquet', fee: 6000 },
  { amount: 100000, label: '₦100,000 Cash Bouquet', fee: 8500 },
  { amount: 200000, label: '₦200,000 Cash Bouquet', fee: 12000 }
];

export const GIFT_ADDONS = [
  {
    id: 'money-bouquet',
    name: 'Crisp Money Bouquet',
    category: 'bouquets',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80',
    description: 'Artfully crafted cash bouquet with crisp mint notes, floral accents, and silk ribbon.',
    hasVariants: true,
    variants: MONEY_BOUQUET_VARIANTS
  },
  {
    id: 'sparkling-wine',
    name: 'Non-Alcoholic Sparkling Celebration Wine',
    category: 'wine',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    description: 'Premium chilled sparkling white grape wine with golden bubbles.'
  },
  {
    id: 'premium-red-wine',
    name: 'Premium Reserve Red Wine',
    category: 'wine',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=600&q=80',
    description: 'Aged French Cabernet Sauvignon with rich dark berry aromas.'
  },
  {
    id: 'moet-champagne',
    name: 'Moët & Chandon Imperial Brut Champagne',
    category: 'wine',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=600&q=80',
    description: 'Iconic luxury French champagne presented in an insulated gold chill sleeve.'
  },
  {
    id: 'ferrero-box',
    name: 'Ferrero Rocher Chocolate Box (16 Pcs)',
    category: 'chocolates',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp hazelnut milk chocolate pralines wrapped in signature gold foil.'
  },
  {
    id: 'belgian-truffles',
    name: 'Belgian Chocolate Truffle Collection',
    category: 'chocolates',
    price: 13500,
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=600&q=80',
    description: 'Handcrafted Belgian dark and milk chocolate cocoa-dusted truffles.'
  },
  {
    id: 'giant-teddy',
    name: 'Giant Luxury Plush Teddy Bear (60cm)',
    category: 'plush',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80',
    description: 'Ultra-soft cuddly beige teddy bear wearing an Alizson satin bow.'
  },
  {
    id: 'scented-candle',
    name: 'French Vanilla & Caramel Soy Candle',
    category: 'candles',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80',
    description: 'Hand-poured 100% natural soy wax candle in a reusable amber glass jar.'
  }
];

export const DEFAULT_GIFT_CONFIG = {
  isGift: false,
  packaging: PACKAGING_OPTIONS[0],
  card: GREETING_CARD_OPTIONS[0],
  occasion: 'Birthday',
  recipientName: '',
  recipientPhone: '',
  deliveryAddress: '',
  personalMessage: '',
  senderName: '',
  deliveryDate: '',
  specialInstructions: '',
  selectedAddons: [], // array of { id, name, variantAmount, price }
  moneyBouquetAmount: 25000
};
