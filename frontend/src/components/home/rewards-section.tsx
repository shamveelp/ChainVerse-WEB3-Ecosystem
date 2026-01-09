"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Gift, Award, Star, Zap, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

gsap.registerPlugin(ScrollTrigger)

const rewards = [
    {
        title: "Daily Login Bonus",
        description: "Earn 10 XP daily just for checking in.",
        icon: <Gift className="w-8 h-8 text-purple-400" />,
        color: "from-purple-500/20 to-indigo-500/20",
        border: "group-hover:border-purple-500/50",
    },
    {
        title: "Trading Milestones",
        description: "Unlock exclusive badges by reaching trade volume goals.",
        icon: <Award className="w-8 h-8 text-blue-400" />,
        color: "from-blue-500/20 to-cyan-500/20",
        border: "group-hover:border-blue-500/50",
    },
    {
        title: "Community Quests",
        description: "Participate in governance and events to win tokens.",
        icon: <Star className="w-8 h-8 text-yellow-400" />,
        color: "from-yellow-500/20 to-orange-500/20",
        border: "group-hover:border-yellow-500/50",
    },
    {
        title: "Referral Program",
        description: "Invite friends and earn 5% of their trading fees forever.",
        icon: <Zap className="w-8 h-8 text-pink-400" />,
        color: "from-pink-500/20 to-rose-500/20",
        border: "group-hover:border-pink-500/50",
    },
]

export default function RewardsSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const cardsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".reward-card",
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: cardsRef.current,
                        start: "top 80%",
                        toggleActions: "play none none reverse",
                    },
                }
            )

            gsap.fromTo(
                ".reward-header",
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 80%",
                    },
                }
            )
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-900/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-blue-900/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16 reward-header">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                        Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Premium Rewards</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Level up your Web3 journey. Complete quests, trade assets, and earn exclusive perks in the ChainVerse ecosystem.
                    </p>
                </div>

                <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {rewards.map((reward, index) => (
                        <Card
                            key={index}
                            className={`reward-card group bg-gray-900/50 backdrop-blur-sm border-gray-800 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl ${reward.border}`}
                        >
                            <CardContent className="p-6 h-full flex flex-col items-center text-center relative overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-br ${reward.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="relative z-10 bg-gray-900 p-4 rounded-full mb-6 group-hover:bg-gray-800 transition-colors">
                                    {reward.icon}
                                </div>

                                <h3 className="relative z-10 text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300">
                                    {reward.title}
                                </h3>

                                <p className="relative z-10 text-gray-400 text-sm leading-relaxed">
                                    {reward.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="text-center reward-header opacity-0">
                    <Button
                        size="lg"
                        className="group bg-white text-black hover:bg-gray-200 font-semibold px-8 py-6 rounded-full text-lg"
                    >
                        Start Earning
                        <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </section>
    )
}
