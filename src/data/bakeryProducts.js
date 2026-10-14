export const initialBakeryProducts = [
  {
    id: 'bak-001',
    store: 'bakery',
    name: 'Chocolate Fudge Decadence Cake',
    slug: 'chocolate-fudge-decadence-cake',
    category: 'Cakes',
    price: 18500,
    rating: 4.9,
    reviewsCount: 48,
    badge: 'Bestseller',
    shortDescription: 'Rich triple-layered Belgian chocolate sponge draped in silky dark chocolate fudge frosting.',
    description: 'Our signature chocolate fudge cake is handcrafted with premium single-origin cocoa, layered with velvety chocolate ganache, and topped with delicate chocolate curls. Perfect for birthdays, anniversaries, and milestone celebrations.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'ALZ-CK-001',
    inStock: true,
    stockQuantity: 15,
    sizes: [
      { name: '6 inch (Feeds 6-8)', priceMultiplier: 1.0 },
      { name: '8 inch (Feeds 12-16)', priceMultiplier: 1.45 },
      { name: '10 inch (Feeds 20-25)', priceMultiplier: 2.1 },
      { name: 'Custom Tiered', priceMultiplier: 3.2 }
    ],
    flavours: ['Belgian Chocolate', 'Vanilla Bean Infused', 'Salted Caramel Swirl', 'Mocha Espresso'],
    availableAddOns: [
      { id: 'frosting', name: 'Extra Silk Frosting', price: 1500 },
      { id: 'drip', name: 'Gold Drip Glaze', price: 2000 },
      { id: 'candles', name: 'Sparkling Candle Pack (6pcs)', price: 1200 },
      { id: 'topper', name: 'Acrylic "Happy Birthday" Topper', price: 2500 },
      { id: 'macarons', name: 'Gourmet French Macarons Crown (4pcs)', price: 3000 }
    ],
    ingredients: 'Unbleached wheat flour, organic cane sugar, 70% dark Belgian cocoa, Madagascar vanilla bean, fresh dairy cream, pasteurized eggs, pure unsalted butter.',
    prepTime: 'Same day dispatch if ordered before 12 PM',
    dietary: ['Vegetarian', 'Nut-Free Option Available']
  },
  {
    id: 'bak-002',
    store: 'bakery',
    name: 'Red Velvet Royale Celebration Cake',
    slug: 'red-velvet-royale-cake',
    category: 'Cakes',
    price: 22000,
    rating: 5.0,
    reviewsCount: 62,
    badge: 'Popular',
    shortDescription: 'Classic southern red velvet sponge paired with signature Madagascan vanilla cream cheese frosting.',
    description: 'An iconic customer favorite featuring luscious, ruby-red velvet layers infused with a delicate hint of cacao and enveloped in our rich, whipped cream cheese frosting, garnished with fine velvet crumbs and fresh berries.',
    image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'ALZ-CK-002',
    inStock: true,
    stockQuantity: 12,
    sizes: [
      { name: '6 inch (Feeds 6-8)', priceMultiplier: 1.0 },
      { name: '8 inch (Feeds 12-16)', priceMultiplier: 1.4 },
      { name: '10 inch (Feeds 20-25)', priceMultiplier: 2.0 }
    ],
    flavours: ['Classic Red Velvet', 'Red Velvet Cheesecake Core', 'Berry Infused Red Velvet'],
    availableAddOns: [
      { id: 'frosting', name: 'Double Cream Cheese Frosting', price: 1800 },
      { id: 'topper', name: 'Custom Acrylic Name Topper', price: 2800 },
      { id: 'berries', name: 'Fresh Raspberry & Strawberry Topping', price: 3500 }
    ],
    ingredients: 'Cake flour, buttermilk, cocoa powder, white vinegar, pure vanilla extract, Philadelphia cream cheese, farm fresh eggs.',
    prepTime: '2 hours preparation lead time',
    dietary: ['Vegetarian']
  },
  {
    id: 'bak-003',
    store: 'bakery',
    name: 'Artisan Vanilla Funfetti Celebration Box',
    slug: 'vanilla-funfetti-cupcakes',
    category: 'Cupcakes',
    price: 9500,
    rating: 4.8,
    reviewsCount: 34,
    badge: 'Freshly Baked',
    shortDescription: 'Box of 6 fluffy vanilla bean cupcakes crowned with pastel buttercream and golden confetti.',
    description: 'Delightful box of 6 handcrafted artisan cupcakes baked fresh each morning. Soft vanilla sponge loaded with natural rainbow sprinkles and finished with our creamy Italian meringue buttercream.',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'ALZ-CP-001',
    inStock: true,
    stockQuantity: 24,
    sizes: [
      { name: 'Box of 6', priceMultiplier: 1.0 },
      { name: 'Box of 12', priceMultiplier: 1.85 },
      { name: 'Party Platter (24pcs)', priceMultiplier: 3.5 }
    ],
    flavours: ['Vanilla Funfetti', 'Assorted Mixed Flavours', 'Salted Caramel & Choc'],
    availableAddOns: [
      { id: 'giftbox', name: 'Luxury Gold Ribbon Gift Box', price: 1000 },
      { id: 'card', name: 'Handwritten Calligraphy Card', price: 500 }
    ],
    ingredients: 'Flour, butter, sugar, whole milk, free-range eggs, gourmet sprinkles, natural vanilla.',
    prepTime: 'Ready for immediate pickup / delivery',
    dietary: ['Vegetarian']
  },
  {
    id: 'bak-004',
    store: 'bakery',
    name: 'Glazed Brioche Gourmet Doughnuts',
    slug: 'glazed-brioche-doughnuts',
    category: 'Doughnuts',
    price: 7200,
    rating: 4.9,
    reviewsCount: 51,
    badge: 'Bestseller',
    shortDescription: 'Box of 4 slow-fermented 24-hour brioche doughnuts with vanilla glaze and lotus biscoff crumble.',
    description: 'Our brioche doughnuts are fermented for 24 hours for unbelievable pillowy softness. Glazed to perfection in Madagascar vanilla glaze, Belgian chocolate drizzle, and speculoos cookie crumbles.',
    image: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'ALZ-DN-001',
    inStock: true,
    stockQuantity: 18,
    sizes: [
      { name: 'Box of 4', priceMultiplier: 1.0 },
      { name: 'Box of 8', priceMultiplier: 1.9 },
      { name: 'Dozen Box (12pcs)', priceMultiplier: 2.7 }
    ],
    flavours: ['Classic Glaze', 'Lotus Biscoff', 'Nutella Filled', 'Assorted Signature'],
    availableAddOns: [
      { id: 'dip', name: 'Extra Warm Chocolate Dip Cup', price: 800 }
    ],
    ingredients: 'French butter, organic flour, yeast, fresh milk, organic cane sugar, whole eggs.',
    prepTime: 'Baked fresh daily at 6 AM',
    dietary: ['Vegetarian']
  },
  {
    id: 'bak-005',
    store: 'bakery',
    name: 'Flaky Golden Beef & Veggie Meat Pies',
    slug: 'golden-beef-meat-pies',
    category: 'Pies',
    price: 4500,
    rating: 4.8,
    reviewsCount: 88,
    badge: 'Popular',
    shortDescription: 'Pack of 3 buttery, flaky shortcrust pastry pies stuffed with seasoned minced beef, potatoes, and carrots.',
    description: 'Crispy, melt-in-the-mouth golden pastry encasing savory, herb-seasoned Nigerian-style minced beef filling. Generously packed with tender beef, diced potatoes, and sweet carrots.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'ALZ-PI-001',
    inStock: true,
    stockQuantity: 30,
    sizes: [
      { name: 'Pack of 3 (Standard)', priceMultiplier: 1.0 },
      { name: 'Pack of 6 (Family)', priceMultiplier: 1.9 },
      { name: 'Party Pack (12pcs)', priceMultiplier: 3.6 }
    ],
    flavours: ['Classic Savory Beef', 'Spicy Peppered Beef', 'Chicken Pot Pie Special'],
    availableAddOns: [
      { id: 'sauce', name: 'Chili Pepper Dip', price: 400 }
    ],
    ingredients: 'Enriched flour, butter, lean minced beef, Irish potatoes, carrots, thyme, nutmeg, seasoning broth.',
    prepTime: 'Hot from the oven',
    dietary: ['Halal Beef']
  },
  {
    id: 'bak-006',
    store: 'bakery',
    name: 'French Butter Croissants & Pain au Chocolat',
    slug: 'french-butter-croissants',
    category: 'Pastries',
    price: 6800,
    rating: 4.9,
    reviewsCount: 42,
    badge: 'Freshly Baked',
    shortDescription: 'Trio of multi-layered French butter croissants with honey butter glaze and chocolate batons.',
    description: 'Laminated with 100% Normandy butter for 36 airy, honeycombed layers. Crisp on the outside with an impossibly soft, buttery center that dissolves on your tongue.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'ALZ-PS-001',
    inStock: true,
    stockQuantity: 20,
    sizes: [
      { name: 'Trio (3 Croissants)', priceMultiplier: 1.0 },
      { name: 'Pastry Box (6 Assorted)', priceMultiplier: 1.85 }
    ],
    flavours: ['Butter Traditional', 'Pain au Chocolat', 'Almond Frangipane'],
    availableAddOns: [
      { id: 'jam', name: 'Artisan Strawberry Marmalade (50g)', price: 1200 }
    ],
    ingredients: 'French T55 flour, Normandy unsalted butter, milk, sugar, sea salt, active yeast.',
    prepTime: 'Freshly baked every 3 hours',
    dietary: ['Vegetarian']
  },
  {
    id: 'bak-007',
    store: 'bakery',
    name: 'Gourmet Stuffed Sausage Rolls',
    slug: 'stuffed-sausage-rolls',
    category: 'Pastries',
    price: 3600,
    rating: 4.7,
    reviewsCount: 29,
    badge: 'Bestseller',
    shortDescription: 'Pack of 3 flaky golden puff pastries wrapped around seasoned pork & beef sausage herbs.',
    description: 'Crisp golden puff pastry encasing juicy seasoned sausage meat with sage, thyme, and black pepper. Perfect quick snack or breakfast treat on the go.',
    image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80'],
    sku: 'ALZ-SR-001',
    inStock: true,
    stockQuantity: 25,
    sizes: [
      { name: 'Pack of 3', priceMultiplier: 1.0 },
      { name: 'Pack of 6', priceMultiplier: 1.9 }
    ],
    flavours: ['Classic Herb Sausage', 'Spicy Pepper Sausage'],
    availableAddOns: [],
    ingredients: 'Puff pastry, beef/pork sausage meat, sage, cracked black pepper, egg wash.',
    prepTime: 'Ready to eat',
    dietary: []
  },
  {
    id: 'bak-008',
    store: 'bakery',
    name: 'Chewy Chocolate Chunk & Pecan Cookies',
    slug: 'chocolate-chunk-cookies',
    category: 'Cookies',
    price: 5500,
    rating: 4.9,
    reviewsCount: 57,
    badge: 'Popular',
    shortDescription: 'Box of 6 giant bakery cookies loaded with Belgian dark chocolate chunks and Maldon sea salt flakes.',
    description: 'Crispy edges with a gooey, molten chocolate center. Studded with generous dark and milk chocolate chunks and finished with a pinch of flaky sea salt.',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80'],
    sku: 'ALZ-CK-003',
    inStock: true,
    stockQuantity: 35,
    sizes: [
      { name: 'Box of 6', priceMultiplier: 1.0 },
      { name: 'Box of 12 (Party Pack)', priceMultiplier: 1.8 }
    ],
    flavours: ['Dark Choc Sea Salt', 'Triple Chocolate', 'White Choc Macadamia'],
    availableAddOns: [],
    ingredients: 'Flour, brown sugar, cultured butter, Belgian dark chocolate, sea salt flakes.',
    prepTime: 'Fresh out of the oven',
    dietary: ['Vegetarian']
  },
  {
    id: 'bak-009',
    store: 'bakery',
    name: 'Artisan Sourdough & Brioche Milk Loaf',
    slug: 'artisan-sourdough-brioche-bread',
    category: 'Bread',
    price: 3200,
    rating: 4.8,
    reviewsCount: 31,
    badge: 'Freshly Baked',
    shortDescription: 'Golden crusty sourdough loaf with airy crumb or ultra-soft Japanese brioche milk bread.',
    description: 'Naturally fermented over 36 hours for complex flavor notes and easy digestion. Has a crisp caramelized crust with a moist, open crumb.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'],
    sku: 'ALZ-BR-001',
    inStock: true,
    stockQuantity: 15,
    sizes: [
      { name: 'Standard Loaf (650g)', priceMultiplier: 1.0 },
      { name: 'Large Loaf (950g)', priceMultiplier: 1.4 }
    ],
    flavours: ['Classic Country Sourdough', 'Brioche Milk Bread', 'Seeded Multigrain'],
    availableAddOns: [],
    ingredients: 'Stone-ground wheat flour, rye starter, water, sea salt.',
    prepTime: 'Baked fresh daily',
    dietary: ['Vegan (Sourdough)', 'Vegetarian']
  },
  {
    id: 'bak-010',
    store: 'bakery',
    name: 'Luxury Grand Dessert Gift Box',
    slug: 'luxury-grand-dessert-box',
    category: 'Gift Boxes',
    price: 28000,
    rating: 5.0,
    reviewsCount: 19,
    badge: 'Special Offers',
    shortDescription: 'Curated luxury collection of 4 mini cakes, 6 macarons, 4 brownies, and chocolate truffles in gold box.',
    description: 'The ultimate tasting hamper for VIP gifts, bridal showers, or corporate celebrations. Includes our finest handcrafted desserts packaged in an embossed gold Alizson gift chest.',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80'],
    sku: 'ALZ-GB-001',
    inStock: true,
    stockQuantity: 8,
    sizes: [
      { name: 'Grand Chest (18 Desserts)', priceMultiplier: 1.0 },
      { name: 'Royal Chest (32 Desserts)', priceMultiplier: 1.75 }
    ],
    flavours: ['Chef’s Selection Luxury Assortment'],
    availableAddOns: [
      { id: 'champagne', name: 'Sparkling Non-Alcoholic Wine', price: 6500 },
      { id: 'ribbon', name: 'Custom Corporate Branded Ribbon', price: 2000 }
    ],
    ingredients: 'Assorted premium artisan bakery ingredients.',
    prepTime: 'Custom packaged upon order',
    dietary: ['Vegetarian']
  },
  {
    id: 'bak-011',
    store: 'bakery',
    name: 'Decadent Layered Cake Parfait Cup',
    slug: 'decadent-layered-cake-parfait',
    category: 'Parfait & Desserts',
    price: 3500,
    rating: 5.0,
    reviewsCount: 38,
    badge: 'Bestseller',
    shortDescription: 'Luscious layers of moist cake sponge, rich Madagascar vanilla buttercream, fruit purée, and chocolate drizzle in a cup.',
    description: 'Our signature Cake Parfait cups feature rich, moist sponge cake layered with silky whipped buttercream, chocolate drip, and crunchy toppings. Choose your favorite flavor: Red Velvet, Vanilla, Chocolate, or select Mix & Match to customize a cup with 2 or more of your favorite cake flavors!',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'ALZ-PF-001',
    inStock: true,
    stockQuantity: 30,
    sizes: [
      { name: 'Standard Cup (350ml)', priceMultiplier: 1.0 },
      { name: 'Jumbo Parfait (500ml)', priceMultiplier: 1.45 },
      { name: 'Party Pack (6 Cups)', priceMultiplier: 5.2 }
    ],
    flavours: ['Red Velvet', 'Vanilla Bean', 'Belgian Chocolate', 'Mix & Match (Select 2+ Flavors)'],
    flavorOptions: ['Red Velvet', 'Vanilla', 'Chocolate'],
    availableAddOns: [
      { id: 'topping', name: 'Extra Oreo & Choc Chip Crumble', price: 500 },
      { id: 'strawberries', name: 'Fresh Strawberry Slices', price: 800 }
    ],
    ingredients: 'Cake sponge, whipped cream frosting, cocoa, vanilla extract, chocolate chips, fruit puree.',
    prepTime: 'Chilled & ready for immediate dispatch',
    dietary: ['Vegetarian']
  }
];
