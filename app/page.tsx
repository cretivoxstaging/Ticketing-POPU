'use client'

import { useState } from 'react'

export default function Home() {
  const [qty, setQty] = useState(1)

  const decrease = () => {
    setQty((prev) => Math.max(1, prev - 1))
  }

  const increase = () => {
    setQty((prev) => prev + 1)
  }

  const formattedQty = qty.toString().padStart(2, '0')

  return (
    <div className="min-h-screen w-full flex justify-center bg-zinc-800">
      <div
        className="w-full max-w-[390px] min-h-screen bg-contain bg-top bg-no-repeat"
        style={{
          backgroundImage: `url('/images/bg.png')`,
          backgroundSize: '390px auto',
        }}
      >
        <div className="pt-50 flex flex-col items-center px-6">
          <img src="/images/logo.png" alt="Popu Weekend Club Season 2" className="w-48 h-auto" />
          <div className="mt-6 w-full rounded-xl bg-white/80 p-4 text-center font-mono text-sm text-zinc-900">
            <p className="tracking-[0.2em] text-xs text-zinc-700">********************************</p>
            <p className="text-[13px] mt-3 leading-relaxed">
              Where all gamers, geeks, weebs, &amp; art enthusiasts gather in one place with POP Culture
              Spirits. While we love events as you guys love your card collections, this year we’ll move from
              convenience store to a bigger place.
            </p>
          </div>
          <div className="-mt-4 flex w-full items-center justify-center gap-4">
            <img
              src="/images/tanggal.png"
              alt="Tanggal acara 6, 7, 8 Feb 2026"
              className="w-32 h-auto"
            />
            <img
              src="/images/lokasi.png"
              alt="Lokasi acara Taman Ismail Marzuki"
              className="w-36 h-auto"
            />
          </div>
          <div className="mt-2 w-full flex justify-center">
            <img
              src="/images/katagory.png"
              alt="Ticket Category"
              className="w-full max-w-xs h-auto"
            />
          </div>
          <div className="mt-4 w-full rounded-xl bg-white/80 px-4 py-3 font-mono text-xs text-zinc-900">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span>Category.</span>
              <span className="ml-20">Qty.</span>
              <span>Price.</span>
            </div>
            <p className="mt-1 text-center text-[10px] tracking-[0.2em] text-zinc-700">
              **************************************
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold tracking-wide text-orange-600">EARLY BIRD</p>
                <p className="mt-1 text-[9px] text-orange-600">promo price, limited stock!</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decrease}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-400 text-lg"
                >
                  –
                </button>
                <span className="w-6 text-center text-lg font-semibold text-zinc-900">
                  {formattedQty}
                </span>
                <button
                  type="button"
                  onClick={increase}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-400 text-lg"
                >
                  +
                </button>
              </div>
              <div className="text-lg font-bold text-orange-600">25k</div>
            </div>
            <p className="mt-3 text-center text-[10px] tracking-[0.2em] text-zinc-700">
              **************************************
            </p>
          </div>

          <button
            type="button"
            className="mt-6 w-60 max-w-xs rounded-2xl bg-yellow-400 py-3 text-center text-lg font-semibold text-black shadow-md"
          >
            Continue Payment
          </button>

          <div className="mt-8 flex flex-col items-center gap-4 pb-10 text-center font-mono text-xs text-zinc-900">
            <img src="/images/logo2.png" alt="Popu Weekend Club" className="w-16 h-auto" />
            <p className="flex items-center gap-2 text-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <img src="/images/instagram.svg" alt="Instagram" className="h-5 w-5" />
              </span>
              <span>@POPUWEEKENDCLUB</span>
            </p>
            <p className="text-[10px]">
              Copyright Popu © Weekend Club. All Right Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
