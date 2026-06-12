'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UtensilsCrossed, Coffee, Salad, Beef, Cake, Flame } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
  available: boolean
}

const CATEGORY_ICONS: Record<string, any> = {
  Burgers: Beef,
  Coffee: Coffee,
  Salads: Salad,
  Sides: Flame,
  Desserts: Cake,
  Main: UtensilsCrossed,
}

const CATEGORY_COLORS: Record<string, string> = {
  Burgers: 'from-amber-500/20 to-orange-500/20',
  Coffee: 'from-amber-700/20 to-yellow-600/20',
  Salads: 'from-green-500/20 to-emerald-500/20',
  Sides: 'from-orange-500/20 to-red-500/20',
  Desserts: 'from-pink-500/20 to-rose-500/20',
  Main: 'from-purple-500/20 to-indigo-500/20',
}

export function MenuView() {
  const { t } = useT()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    api.getMenu()
      .then(data => setMenuItems(data.menuItems))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))]
  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-amber-400" />
          {t('ourMenu')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="w-full h-16 rounded-lg bg-white/5 mb-3" />
              <div className="h-4 bg-white/5 rounded mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-amber-400" />
          {t('ourMenu')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('browseOfferings')}</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                : 'glass-card text-muted-foreground hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const CatIcon = CATEGORY_ICONS[item.category] || UtensilsCrossed
          const colorClass = CATEGORY_COLORS[item.category] || 'from-purple-500/20 to-indigo-500/20'

          return (
            <Card key={item.id} className="glass-card border-0 glass-card-hover overflow-hidden">
              <CardContent className="p-4">
                {/* Item Icon/Illustration */}
                <div className={`w-full h-20 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-3`}>
                  <CatIcon className="w-10 h-10 text-white/40" />
                </div>

                {/* Category Badge */}
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 mb-2 border-white/10 text-muted-foreground"
                >
                  {item.category}
                </Badge>

                {/* Name */}
                <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Price */}
                <p className="text-base font-bold text-green-400 mt-2">
                  ${item.price.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="glass-card p-8 text-center">
          <UtensilsCrossed className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('noItemsInCategory')}</p>
        </div>
      )}
    </div>
  )
}
