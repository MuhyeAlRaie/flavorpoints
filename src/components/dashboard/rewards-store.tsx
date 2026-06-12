'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gift, Coins, CheckCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  imageUrl: string
  available: boolean
}

interface RewardsStoreProps {
  onRefresh: () => void
}

export function RewardsStore({ onRefresh }: RewardsStoreProps) {
  const { user, updateUser } = useAuthStore()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  useEffect(() => {
    api.getRewards()
      .then(data => setRewards(data.rewards))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleRedeem = async (reward: Reward) => {
    if ((user?.points || 0) < reward.pointsCost) {
      toast.error('Not enough points!')
      return
    }

    setRedeemingId(reward.id)
    try {
      const result = await api.redeemReward(reward.id)
      const newBalance = result.new_points_balance ?? result.newPointsBalance ?? 0
      updateUser({ points: newBalance })
      toast.success(`Redeemed: ${reward.name}! 🎁`, {
        description: `${newBalance} points remaining`
      })
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Redemption failed')
    } finally {
      setRedeemingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-400" />
          Rewards Store
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="w-full h-20 rounded-lg bg-white/5 mb-3" />
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-400" />
            Rewards Store
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            You have <span className="text-yellow-400 font-bold">{user?.points || 0}</span> points
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {rewards.map(reward => {
          const canAfford = (user?.points || 0) >= reward.pointsCost
          return (
            <Card key={reward.id} className={`glass-card border-0 overflow-hidden ${canAfford ? 'glass-card-hover' : 'opacity-60'}`}>
              <CardContent className="p-4">
                {/* Reward Icon */}
                <div className="w-full h-20 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center mb-3">
                  <Gift className="w-10 h-10 text-pink-400/50" />
                </div>

                <h3 className="font-semibold text-sm truncate">{reward.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{reward.description}</p>

                <div className="flex items-center gap-1 mt-2">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">{reward.pointsCost}</span>
                </div>

                <Button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford || redeemingId === reward.id}
                  className={`w-full mt-3 h-8 text-xs ${
                    canAfford ? 'glass-button-success' : 'glass-button opacity-50'
                  }`}
                >
                  {redeemingId === reward.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : canAfford ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Redeem
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
