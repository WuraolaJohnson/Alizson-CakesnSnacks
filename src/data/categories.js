// Starter category lists, used until the admin saves her own in
// Admin → Products → Manage categories. Emojis show on the store's chips.
export const DEFAULT_CATEGORIES = {
  bakery: [
    { name: 'Cakes', emoji: '🎂' }, { name: 'Cupcakes', emoji: '🧁' }, { name: 'Doughnuts', emoji: '🍩' },
    { name: 'Pastries', emoji: '🥐' }, { name: 'Cookies', emoji: '🍪' }, { name: 'Pies', emoji: '🥧' },
    { name: 'Bread', emoji: '🍞' }, { name: 'Parfait & Desserts', emoji: '🍮' },
    { name: 'Gift Boxes', emoji: '🎁' }, { name: 'Snacks', emoji: '🥟' }
  ],
  supplies: [
    { name: 'Dry Ingredients', emoji: '🌾' }, { name: 'Wet Ingredients', emoji: '🥛' },
    { name: 'Decorations', emoji: '🎨' }, { name: 'Packaging', emoji: '📦' }, { name: 'Tools', emoji: '🔧' }
  ]
};

/** { name: emoji } for a store's chips, with "All" first. */
export function categoryEmojiMap(list = []) {
  return Object.fromEntries([['All', '🛍️'], ...list.map(c => [c.name, c.emoji || ''])]);
}
