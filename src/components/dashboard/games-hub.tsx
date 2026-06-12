'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type GameType } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Timer, Coins, ArrowLeft, Hamburger, Coffee, CircleDot } from 'lucide-react'
import { toast } from 'sonner'

import { BurgerCatchGame } from '@/components/games/burger-catch'
import { CoffeeShooterGame } from '@/components/games/coffee-shooter'
import { GrandWheelGame } from '@/components/games/grand-wheel'

interface GameStatus {
  canPlay: boolean
  entryCost: number
  cooldownRemaining: number
  lastPlayedAt: string | null
}

interface GamesHubProps {
  onRefresh: () => void
}

const GAME_INFO: Record<GameType, { name: string; icon: any; description: string; color: string; emoji: string }> = {
  burger_catch: {
    name: 'Burger Catch',
    icon: Hamburger,
    description: 'Catch falling burgers to win points! Move your plate left and right.',
    color: 'from-amber-500 to-orange-500',
    emoji: '🍔',
  },
  coffee_shooter: {
    name: 'Coffee Shooter',
    icon: Coffee,
    description: 'Shoot coffee cups as they appear! Test your reflexes.',
    color: 'from-amber-700 to-yellow-600',
    emoji: '☕',
  },
  grand_wheel: {
    name: 'Grand Wheel',
    icon: CircleDot,
    description: 'Spin the wheel for a chance at big rewards! Monthly cooldown.',
    color: 'from-purple-500 to-pink-500',
    emoji: '🎡',
  },
}

export function GamesHub({ onRefresh }: GamesHubProps) {
  const { activeGame, setActiveGame } = useAppStore()
  const { user, updateUser } = useAuthStore()
  const [gameStatuses, setGameStatuses] = useState<Record<GameType, GameStatus | null>>({
    burger_catch: null,
    coffee_shooter: null,
    grand_wheel: null,
  })

  const fetchGameStatuses = async () => {
    const results: Record<string, GameStatus> = {}
    for (const gameType of Object.keys(GAME_INFO) as GameType[]) {
      try {
        const data = await api.getGameStatus(gameType)
        results[gameType] = data as GameStatus
      } catch (error) {
        console.error(`Failed to fetch status for ${gameType}:`, error)
      }
    }
    setGameStatuses(prev => ({ ...prev, ...results }))
  }

  useEffect(() => {
    const load = async () => {
      const results: Record<string, GameStatus> = {}
      for (const gameType of Object.keys(GAME_INFO) as GameType[]) {
        try {
          const data = await api.getGameStatus(gameType)
          results[gameType] = data as GameStatus
        } catch (error) {
          console.error(`Failed to fetch status for ${gameType}:`, error)
        }
      }
      setGameStatuses(prev => ({ ...prev, ...results }))
    }
    load()
  }, [])

  const formatCooldown = (ms: number) => {
    const hours = Math.ceil(ms / (60 * 60 * 1000))
    if (hours >= 24) return `${Math.ceil(hours / 24)}d ${hours % 24}h`
    return `${hours}h`
  }

  const handleGameEnd = async (gameType: GameType, winnings: number) => {
    try {
      const result = await api.playGame(gameType, winnings)
      const newBalance = result.new_points_balance ?? result.newPointsBalance ?? 0
      updateUser({ points: newBalance })
      toast.success(
        winnings > 0
          ? `You won ${winnings} points! 🎉`
          : 'Better luck next time!',
        { description: `New balance: ${newBalance} points` }
      )
      onRefresh()
      fetchGameStatuses()
      setActiveGame(null)
    } catch (error: any) {
      toast.error(error.message || 'Game error')
      setActiveGame(null)
    }
  }

  const handleStartGame = (gameType: GameType) => {
    const status = gameStatuses[gameType]
    if (!status?.canPlay) {
      toast.error('Game is on cooldown!')
      return
    }
    if ((user?.points || 0) < (status?.entryCost || 0)) {
      toast.error('Not enough points!')
      return
    }
    setActiveGame(gameType)
  }

  // If a game is active, render the game component
  if (activeGame) {
    const gameInfo = GAME_INFO[activeGame]
    const status = gameStatuses[activeGame]
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveGame(null)} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">{gameInfo.emoji} {gameInfo.name}</h2>
            <p className="text-xs text-muted-foreground">Entry cost: {status?.entryCost} points</p>
          </div>
        </div>

        {activeGame === 'burger_catch' && (
          <BurgerCatchGame
            onEnd={(winnings) => handleGameEnd('burger_catch', winnings)}
            entryCost={status?.entryCost || 50}
          />
        )}
        {activeGame === 'coffee_shooter' && (
          <CoffeeShooterGame
            onEnd={(winnings) => handleGameEnd('coffee_shooter', winnings)}
            entryCost={status?.entryCost || 50}
          />
        )}
        {activeGame === 'grand_wheel' && (
          <GrandWheelGame
            onEnd={(winnings) => handleGameEnd('grand_wheel', winnings)}
            entryCost={status?.entryCost || 100}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-purple-400" />
          Arcade Games
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Spend points to play & win big!</p>
      </div>

      <div className="space-y-4">
        {(Object.keys(GAME_INFO) as GameType[]).map(gameType => {
          const info = GAME_INFO[gameType]
          const status = gameStatuses[gameType]
          const Icon = info.icon

          return (
            <Card key={gameType} className="glass-card border-0 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl shrink-0`}>
                    {info.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{info.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-yellow-400 font-medium">{status?.entryCost || '...'}</span>
                      </div>
                      {status && !status.canPlay && (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                          <Timer className="w-3 h-3 mr-1" />
                          {formatCooldown(status.cooldownRemaining)}
                        </Badge>
                      )}
                      {status?.canPlay && (
                        <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
                          Available
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStartGame(gameType)}
                    disabled={!status?.canPlay || (user?.points || 0) < (status?.entryCost || 0)}
                    className="glass-button shrink-0"
                    size="sm"
                  >
                    Play
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
