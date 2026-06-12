import { supabase, phoneToEmail } from '@/lib/supabase'

class ApiClient {
  // ========== AUTH ==========

  async login(phone: string, password: string) {
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    const { data: profile } = await supabase
      .from('customers')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // If no profile exists, auto-create one
    if (!profile) {
      const role = this.getDefaultRole(phone)
      const newProfile = {
        id: data.user.id,
        phone,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || phone,
        points: role === 'admin' ? 99999 : 100,
        total_visits: 0,
        role,
      }
      const { data: created, error: createError } = await supabase
        .from('customers')
        .insert(newProfile)
        .select()
        .single()

      if (createError) throw new Error('Failed to create profile: ' + createError.message)
      return { user: created, token: data.session?.access_token || '' }
    }

    return { user: profile, token: data.session?.access_token || '' }
  }

  private getDefaultRole(phone: string): 'admin' | 'employee' | 'customer' {
    if (phone === '000000') return 'admin'
    if (phone === '111111') return 'employee'
    return 'customer'
  }

  async signup(phone: string, email: string, name: string, password: string) {
    const authEmail = phoneToEmail(phone)
    const role = this.getDefaultRole(phone)

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
    })
    if (error) throw new Error(error.message)

    const userId = data.user?.id
    if (!userId) throw new Error('Signup failed')

    // Create customer profile
    const { error: profileError } = await supabase.from('customers').insert({
      id: userId,
      phone,
      email,
      name,
      role,
      points: role === 'admin' ? 99999 : 100,
    })
    if (profileError) throw new Error(profileError.message)

    // Create default missions for customers
    if (role === 'customer') {
      await supabase.from('missions').insert([
        { customer_id: userId, type: 'visit_5', title: 'Visit 5 Times', target: 5, progress: 0, points: 200 },
        { customer_id: userId, type: 'visit_10', title: 'Visit 10 Times', target: 10, progress: 0, points: 500 },
        { customer_id: userId, type: 'spend_200', title: 'Spend $200 Total', target: 200, progress: 0, points: 300 },
      ])
    }

    const { data: profile } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single()

    return { user: profile, token: data.session?.access_token || '' }
  }

  async getMe() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data: profile } = await supabase
      .from('customers')
      .select('*')
      .eq('id', authUser.id)
      .single()

    return { user: profile }
  }

  // ========== VISITS ==========

  async createVisit(customerId: string, invoiceAmount: number) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data, error } = await supabase.rpc('add_visit', {
      p_customer_id: customerId,
      p_invoice_amount: invoiceAmount,
      p_created_by: authUser.id,
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data
  }

  async getVisits(customerId?: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const targetId = customerId || authUser.id

    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('customer_id', targetId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return { visits: data || [] }
  }

  // ========== MENU ==========

  async getMenu() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true })

    if (error) throw new Error(error.message)
    return { menuItems: (data || []).map(item => ({ ...item, imageUrl: item.image_url, createdAt: item.created_at, updatedAt: item.updated_at })) }
  }

  async createMenuItem(data: { name: string; description: string; price: number; category: string; imageUrl?: string }) {
    const { data: result, error } = await supabase.from('menu_items').insert({
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      image_url: data.imageUrl || '',
    }).select().single()

    if (error) throw new Error(error.message)
    return { menuItem: result }
  }

  async updateMenuItem(id: string, data: any) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.price !== undefined) updateData.price = data.price
    if (data.category !== undefined) updateData.category = data.category
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
    if (data.available !== undefined) updateData.available = data.available

    const { data: result, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { menuItem: result }
  }

  async deleteMenuItem(id: string) {
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  // ========== REWARDS ==========

  async getRewards() {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('available', true)
      .order('points_cost', { ascending: true })

    if (error) throw new Error(error.message)
    return { rewards: (data || []).map(r => ({ ...r, imageUrl: r.image_url, pointsCost: r.points_cost, createdAt: r.created_at, updatedAt: r.updated_at })) }
  }

  async createReward(data: { name: string; description: string; pointsCost: number; imageUrl?: string }) {
    const { data: result, error } = await supabase.from('rewards').insert({
      name: data.name,
      description: data.description,
      points_cost: data.pointsCost,
      image_url: data.imageUrl || '',
    }).select().single()

    if (error) throw new Error(error.message)
    return { reward: result }
  }

  async updateReward(id: string, data: any) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.pointsCost !== undefined) updateData.points_cost = data.pointsCost
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
    if (data.available !== undefined) updateData.available = data.available

    const { data: result, error } = await supabase
      .from('rewards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { reward: result }
  }

  async deleteReward(id: string) {
    const { error } = await supabase.from('rewards').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  async redeemReward(rewardId: string, customerId?: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const targetId = customerId || authUser.id

    const { data, error } = await supabase.rpc('redeem_reward', {
      p_customer_id: targetId,
      p_reward_id: rewardId,
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data
  }

  // ========== GAMES ==========

  async playGame(gameType: string, winnings: number) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data, error } = await supabase.rpc('play_game', {
      p_customer_id: authUser.id,
      p_game_type: gameType,
      p_winnings: winnings,
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data
  }

  async getGameStatus(gameType: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    // Get game cost from settings
    const { data: costSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `game_cost_${gameType}`)
      .single()

    const defaultCosts: Record<string, number> = { burger_catch: 50, coffee_shooter: 50, grand_wheel: 100 }
    const entryCost = costSetting ? parseInt(costSetting.value) : defaultCosts[gameType] || 50

    // Get cooldown from settings
    const { data: cooldownSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `game_cooldown_${gameType}`)
      .single()

    const defaultCooldowns: Record<string, number> = { burger_catch: 7, coffee_shooter: 7, grand_wheel: 30 }
    const cooldownDays = cooldownSetting ? parseInt(cooldownSetting.value) : defaultCooldowns[gameType] || 7

    // Check last play
    const { data: lastPlay } = await supabase
      .from('game_history')
      .select('played_at')
      .eq('customer_id', authUser.id)
      .eq('game_type', gameType)
      .order('played_at', { ascending: false })
      .limit(1)
      .single()

    let canPlay = true
    let cooldownRemaining = 0

    if (lastPlay) {
      const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000
      const timeSince = Date.now() - new Date(lastPlay.played_at).getTime()
      if (timeSince < cooldownMs) {
        canPlay = false
        cooldownRemaining = cooldownMs - timeSince
      }
    }

    return { canPlay, entryCost, cooldownRemaining, lastPlayedAt: lastPlay?.played_at || null }
  }

  async getGameHistory() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('customer_id', authUser.id)
      .order('played_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return { history: (data || []).map(g => ({ ...g, playedAt: g.played_at, entryCost: g.entry_cost })) }
  }

  // ========== SETTINGS ==========

  async getSettings() {
    const { data, error } = await supabase.from('app_settings').select('key, value')
    if (error) throw new Error(error.message)

    const settingsMap: Record<string, string> = {}
    for (const s of data || []) {
      settingsMap[s.key] = s.value
    }
    return { settings: settingsMap }
  }

  async updateSettings(settings: Record<string, string>) {
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' })
      if (error) throw new Error(error.message)
    }
    return { success: true }
  }

  // ========== MISSIONS ==========

  async getMissions() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('customer_id', authUser.id)
      .order('completed', { ascending: true })

    if (error) throw new Error(error.message)
    return { missions: data || [] }
  }

  // ========== ADMIN ==========

  async getAnalytics() {
    const [usersResult, visitsResult, redemptionsResult, gamesResult, settingsResult] = await Promise.all([
      supabase.from('customers').select('points, role'),
      supabase.from('visits').select('id, created_at'),
      supabase.from('reward_redemptions').select('points_cost'),
      supabase.from('game_history').select('game_type, entry_cost, winnings'),
      supabase.from('app_settings').select('key, value'),
    ])

    const allUsers = usersResult.data || []
    const allVisits = visitsResult.data || []
    const allRedemptions = redemptionsResult.data || []
    const allGames = gamesResult.data || []

    const totalUsers = allUsers.filter(u => u.role === 'customer').length
    const totalEmployees = allUsers.filter(u => u.role === 'employee').length
    const pointsInCirculation = allUsers.filter(u => u.role === 'customer').reduce((sum, u) => sum + (u.points || 0), 0)
    const totalVisits = allVisits.length
    const totalRedemptions = allRedemptions.length
    const totalRedemptionPoints = allRedemptions.reduce((sum, r) => sum + r.points_cost, 0)
    const totalGamesPlayed = allGames.length
    const totalGameWinnings = allGames.reduce((sum, g) => sum + g.winnings, 0)
    const totalGameCosts = allGames.reduce((sum, g) => sum + g.entry_cost, 0)

    // Game distribution
    const gameDistribution: Record<string, number> = {}
    for (const g of allGames) {
      gameDistribution[g.game_type] = (gameDistribution[g.game_type] || 0) + 1
    }

    // Recent visits (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentVisits = allVisits.filter(v => new Date(v.created_at) >= sevenDaysAgo)

    return {
      totalUsers,
      totalEmployees,
      pointsInCirculation,
      totalVisits,
      totalRedemptions,
      totalRedemptionPoints,
      totalGamesPlayed,
      totalGameWinnings,
      totalGameCosts,
      recentVisits,
      gameDistribution,
    }
  }

  // ========== EMPLOYEE ==========

  async searchCustomer(phone: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*, visits(*, order(created_at, ascending: false)), missions(*)')
      .eq('phone', phone)
      .single()

    if (error) throw new Error('Customer not found')
    return { customer: data }
  }

  // ========== SEED (not available with Supabase - use SQL) ==========

  async seedDatabase() {
    throw new Error('Seeding is done via Supabase SQL Editor. Run supabase/schema.sql and supabase/seed.sql')
  }
}

export const api = new ApiClient()
