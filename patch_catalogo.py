import re

with open('src/pages/tienda/Catalogo.tsx', 'r') as f:
    content = f.read()

# Replace sidebar class
content = content.replace(
    '<aside className="w-64 flex-shrink-0 space-y-6 text-sm hidden lg:block bg-black rounded-xl border border-gray-800 p-5 h-fit sticky top-24">',
    '<aside className="w-64 flex-shrink-0 space-y-6 text-sm hidden lg:block bg-white rounded-xl border border-gray-100 p-5 h-fit sticky top-24 shadow-sm">'
)

# Replace titles in sidebar
content = content.replace('text-white text-lg tracking-wide uppercase border-b border-gray-800', 'text-gray-900 text-lg tracking-wide uppercase border-b border-gray-100')
content = content.replace('text-gray-400 uppercase tracking-wider mb-3', 'text-gray-900 uppercase tracking-wider mb-3')
content = content.replace('border-t border-gray-800 pt-5', 'border-t border-gray-100 pt-5')

# Replace bg classes for inputs/elements in sidebar
content = content.replace('bg-[#1A1A1A] text-white', 'bg-gray-50 text-gray-900')
content = content.replace('bg-[#1A1A1A] border border-gray-800', 'bg-gray-100 border border-gray-200')
content = content.replace('bg-gray-800', 'bg-gray-200')
content = content.replace('bg-[#1A1A1A] text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border border-gray-700', 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors border border-gray-200')

# Replace text colors in sidebar
content = content.replace('text-gray-300 group-hover:text-white', 'text-gray-600 group-hover:text-gray-900')

# Replace English to Spanish
content = content.replace('Limpiar Filtros', 'Limpiar Filtros') # Already Spanish? Wait.
content = content.replace('Clear Filters', 'Limpiar Filtros')
content = content.replace('Categories', 'Categorías')
content = content.replace('Brands', 'Marcas')
content = content.replace('Min Price', 'Precio Mínimo')

# Catalog header translations
content = content.replace('>Catalog<', '>Catálogo<')
content = content.replace('Showing <span className="font-bold text-gray-900">{sortedProductos.length}</span> of {total} results', 'Mostrando <span className="font-bold text-gray-900">{sortedProductos.length}</span> de {total} resultados')
content = content.replace('<span> for "{selectedCategories[0] || selectedBrands[0] || search}"</span>', '<span> para "{selectedCategories[0] || selectedBrands[0] || search}"</span>')

# Sort translations
content = content.replace('Sort by Relevance', 'Ordenar por Relevancia')
content = content.replace('Price (Low to High)', 'Precio (Menor a Mayor)')
content = content.replace('Price (High to Low)', 'Precio (Mayor a Menor)')
content = content.replace('Alphabetical (A-Z)', 'Alfabético (A-Z)')

# Empty state translations
content = content.replace('No parts found', 'No se encontraron productos')
content = content.replace('Try adjusting your filters or search terms.', 'Intenta ajustar los filtros o el término de búsqueda.')

# Alignment gap
content = content.replace('<div className="flex gap-8 items-start">', '<div className="flex gap-6 items-start">')
# Catalog width
content = content.replace('<main className="container mx-auto px-4 xl:px-8 py-8">', '<main className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-8">')

with open('src/pages/tienda/Catalogo.tsx', 'w') as f:
    f.write(content)
