"use client";

import { useState } from "react"
import { Dialog } from "@headlessui/react"
import { Button } from "@/components/ui/button"
import { ChevronDown, X } from "lucide-react"
import Navbar from "@/components/navbar";

const coins = ["ETH", "USDT", "BTC", "BNB", "MATIC"]

export default function SwapPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fromCoin, setFromCoin] = useState("ETH")
  const [toCoin, setToCoin] = useState("USDT")

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const selectCoin = (coin: string) => {
    setFromCoin(coin)
    closeModal()
  }

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-10 px-4">
      {/* Wallet Button */}
      <div className="self-end w-full max-w-md mb-6">
        <Button className="ml-auto bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
          Connect Wallet
        </Button>
      </div>

      {/* Swap Box */}
      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Swap</h2>

        <div className="space-y-4">
          {/* From Coin */}
          <div className="bg-gray-800 p-4 rounded-xl flex justify-between items-center cursor-pointer" onClick={openModal}>
            <span>{fromCoin}</span>
            <ChevronDown className="w-5 h-5" />
          </div>

          {/* To Coin */}
          <div className="bg-gray-800 p-4 rounded-xl flex justify-between items-center">
            <span>{toCoin}</span>
            <ChevronDown className="w-5 h-5 opacity-50" />
          </div>

          <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white">
            Swap
          </Button>
        </div>
      </div>

      {/* Coin Select Modal */}
      <Dialog open={isModalOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <Dialog.Panel className="bg-gray-900 p-6 rounded-xl w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold">Select a Coin</Dialog.Title>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>

            {coins.map((coin) => (
              <div
                key={coin}
                onClick={() => selectCoin(coin)}
                className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer"
              >
                {coin}
              </div>
            ))}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
    </>
  )
}
