'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore, type AdminView } from '@/store/app-store'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart3, Settings, UtensilsCrossed, Gift, Users, Coins,
  TrendingUp, Gamepad2, LogOut, Plus, Trash2, Edit3, Save, X,
  ShoppingBag, Award
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

const adminNavItems: { key: AdminView; label: string; icon: any }[] = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { key: 'rewards', label: 'Rewards', icon: Gift },
]

const CHART_COLORS = ['#8b5cf6', '#a855f7', '#c084fc', '#ec4899', '#f59e0b', '#6366f1']

export function AdminDashboard() {
  const { logout } = useAuthStore()
  const { adminView, setAdminView } = useAppStore()
  const [analytics, setAnalytics] = useState<any>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit states
  const [editingMenuItem, setEditingMenuItem] = useState<string | null>(null)
  const [editingReward, setEditingReward] = useState<string | null>(null)
  const [newMenuItem, setNewMenuItem] = useState({ name: '', description: '', price: '', category: 'Main' })
  const [newReward, setNewReward] = useState({ name: '', description: '', pointsCost: '' })

  const fetchData = useCallback(async () => {
    try {
      const [analyticsData, settingsData, menuData, rewardsData] = await Promise.all([
        api.getAnalytics(),
        api.getSettings(),
        api.getMenu(),
        api.getRewards(),
      ])
      setAnalytics(analyticsData)
      setSettings(settingsData.settings)
      setMenuItems(menuData.menuItems)
      setRewards(rewardsData.rewards)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveSettings = async () => {
    try {
      await api.updateSettings(settings)
      toast.success('Settings saved!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    }
  }

  const handleCreateMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price) {
      toast.error('Name and price are required')
      return
    }
    try {
      await api.createMenuItem({
        name: newMenuItem.name,
        description: newMenuItem.description,
        price: parseFloat(newMenuItem.price),
        category: newMenuItem.category,
      })
      setNewMenuItem({ name: '', description: '', price: '', category: 'Main' })
      toast.success('Menu item created!')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create menu item')
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await api.deleteMenuItem(id)
      toast.success('Menu item deleted!')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete')
    }
  }

  const handleCreateReward = async () => {
    if (!newReward.name || !newReward.pointsCost) {
      toast.error('Name and points cost are required')
      return
    }
    try {
      await api.createReward({
        name: newReward.name,
        description: newReward.description,
        pointsCost: parseInt(newReward.pointsCost),
      })
      setNewReward({ name: '', description: '', pointsCost: '' })
      toast.success('Reward created!')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create reward')
    }
  }

  const handleDeleteReward = async (id: string) => {
    try {
      await api.deleteReward(id)
      toast.success('Reward deleted!')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  const renderAnalytics = () => {
    if (!analytics) return null

    // Prepare visit chart data
    const visitData: any[] = []
    const dayMap: Record<string, number> = {}
    for (const v of analytics.recentVisits || []) {
      const day = new Date(v.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
      dayMap[day] = (dayMap[day] || 0) + 1
    }
    for (const [day, count] of Object.entries(dayMap)) {
      visitData.push({ name: day, visits: count })
    }
    if (visitData.length === 0) {
      visitData.push({ name: 'Mon', visits: 0 }, { name: 'Tue', visits: 0 }, { name: 'Wed', visits: 3 })
    }

    // Game distribution pie data
    const gameData = Object.entries(analytics.gameDistribution || {}).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value: value as number,
    }))
    if (gameData.length === 0) {
      gameData.push({ name: 'burger catch', value: 5 }, { name: 'coffee shooter', value: 3 }, { name: 'grand wheel', value: 2 })
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Analytics
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'from-purple-500/20 to-indigo-500/20', textColor: 'text-purple-400' },
            { label: 'Points in Circulation', value: analytics.pointsInCirculation?.toLocaleString(), icon: Coins, color: 'from-yellow-500/20 to-amber-500/20', textColor: 'text-yellow-400' },
            { label: 'Total Visits', value: analytics.totalVisits, icon: ShoppingBag, color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-400' },
            { label: 'Games Played', value: analytics.totalGamesPlayed, icon: Gamepad2, color: 'from-pink-500/20 to-rose-500/20', textColor: 'text-pink-400' },
          ].map(stat => (
            <Card key={stat.label} className="glass-card border-0">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Visits (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={visitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px' }}
                    labelStyle={{ color: '#a855f7' }}
                  />
                  <Bar dataKey="visits" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Game Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={gameData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {gameData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* More Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glass-card border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Redemptions</p>
              <p className="text-2xl font-bold text-pink-400">{analytics.totalRedemptions}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Points Redeemed</p>
              <p className="text-2xl font-bold text-orange-400">{analytics.totalRedemptionPoints?.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Net Game Revenue</p>
              <p className="text-2xl font-bold text-emerald-400">{(analytics.totalGameCosts - analytics.totalGameWinnings)?.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Settings className="w-5 h-5 text-purple-400" />
        Settings
      </h2>

      <Card className="glass-card border-0">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Points per $1 Spent</Label>
            <Input
              type="number"
              value={settings.points_per_currency || '1'}
              onChange={e => setSettings(prev => ({ ...prev, points_per_currency: e.target.value }))}
              className="glass-input h-11"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Game Costs</h3>
            {['burger_catch', 'coffee_shooter', 'grand_wheel'].map(game => (
              <div key={game} className="space-y-1">
                <Label className="text-xs text-muted-foreground capitalize">{game.replace(/_/g, ' ')} Cost</Label>
                <Input
                  type="number"
                  value={settings[`game_cost_${game}`] || ''}
                  onChange={e => setSettings(prev => ({ ...prev, [`game_cost_${game}`]: e.target.value }))}
                  className="glass-input h-10"
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Game Cooldowns (Days)</h3>
            {['burger_catch', 'coffee_shooter', 'grand_wheel'].map(game => (
              <div key={game} className="space-y-1">
                <Label className="text-xs text-muted-foreground capitalize">{game.replace(/_/g, ' ')} Cooldown</Label>
                <Input
                  type="number"
                  value={settings[`game_cooldown_${game}`] || ''}
                  onChange={e => setSettings(prev => ({ ...prev, [`game_cooldown_${game}`]: e.target.value }))}
                  className="glass-input h-10"
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSaveSettings} className="glass-button w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderMenuManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <UtensilsCrossed className="w-5 h-5 text-purple-400" />
        Menu Management
      </h2>

      {/* Add new menu item */}
      <Card className="glass-card border-0">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-400" />
            Add Menu Item
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Name"
              value={newMenuItem.name}
              onChange={e => setNewMenuItem(prev => ({ ...prev, name: e.target.value }))}
              className="glass-input h-10"
            />
            <Input
              placeholder="Price"
              type="number"
              value={newMenuItem.price}
              onChange={e => setNewMenuItem(prev => ({ ...prev, price: e.target.value }))}
              className="glass-input h-10"
            />
          </div>
          <Input
            placeholder="Description"
            value={newMenuItem.description}
            onChange={e => setNewMenuItem(prev => ({ ...prev, description: e.target.value }))}
            className="glass-input h-10"
          />
          <div className="flex gap-3">
            <select
              value={newMenuItem.category}
              onChange={e => setNewMenuItem(prev => ({ ...prev, category: e.target.value }))}
              className="glass-input h-10 px-3 flex-1"
            >
              {['Main', 'Burgers', 'Coffee', 'Salads', 'Sides', 'Desserts'].map(c => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
            <Button onClick={handleCreateMenuItem} className="glass-button-success h-10">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu items list */}
      <ScrollArea className="max-h-[500px]">
        <div className="space-y-3">
          {menuItems.map(item => (
            <Card key={item.id} className="glass-card border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-purple-500/30 text-purple-400">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  <p className="text-sm font-bold text-green-400 mt-1">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDeleteMenuItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  const renderRewardManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Gift className="w-5 h-5 text-pink-400" />
        Reward Management
      </h2>

      {/* Add new reward */}
      <Card className="glass-card border-0">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-400" />
            Add Reward
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Name"
              value={newReward.name}
              onChange={e => setNewReward(prev => ({ ...prev, name: e.target.value }))}
              className="glass-input h-10"
            />
            <Input
              placeholder="Points Cost"
              type="number"
              value={newReward.pointsCost}
              onChange={e => setNewReward(prev => ({ ...prev, pointsCost: e.target.value }))}
              className="glass-input h-10"
            />
          </div>
          <Input
            placeholder="Description"
            value={newReward.description}
            onChange={e => setNewReward(prev => ({ ...prev, description: e.target.value }))}
            className="glass-input h-10"
          />
          <Button onClick={handleCreateReward} className="glass-button-success h-10 w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Reward
          </Button>
        </CardContent>
      </Card>

      {/* Rewards list */}
      <ScrollArea className="max-h-[500px]">
        <div className="space-y-3">
          {rewards.map(reward => (
            <Card key={reward.id} className="glass-card border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{reward.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{reward.description}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-400">{reward.pointsCost} pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDeleteReward(reward.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  const renderContent = () => {
    switch (adminView) {
      case 'analytics': return renderAnalytics()
      case 'settings': return renderSettings()
      case 'menu': return renderMenuManagement()
      case 'rewards': return renderRewardManagement()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main flex flex-col">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Admin Panel</h1>
            <p className="text-[10px] text-muted-foreground">FlavorPoints Management</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="h-9 w-9 text-muted-foreground hover:text-white">
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {adminNavItems.map(item => {
            const Icon = item.icon
            const isActive = adminView === item.key
            return (
              <button
                key={item.key}
                onClick={() => setAdminView(item.key)}
                className={`mobile-nav-item relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'active text-purple-400' : 'text-muted-foreground hover:text-white/70'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
