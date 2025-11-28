"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StarDividerProps {
  content: string;
  wrapperClassName?: string;
  textClassName?: string;
}

const StarDivider = ({
  content,
  wrapperClassName = "",
  textClassName = "",
}: StarDividerProps) => (
  <div className={`relative w-full overflow-hidden ${wrapperClassName}`}>
    <span
      className={`relative left-1/2 -translate-x-1/2 inline-block whitespace-nowrap font-mono tracking-[0.2em] text-zinc-700 ${textClassName}`}
    >
      {content}
    </span>
  </div>
);

export default function Home() {
  const [qty, setQty] = useState(1);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [ticketCategory, setTicketCategory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const totalPrice = qty * ticketPrice;

  const decrease = () => {
    setQty((prev) => Math.max(1, prev - 1));
  };

  const increase = () => {
    setQty((prev) => prev + 1);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID").format(value);

  const handleBuyClick = (price: number, category: string) => {
    setTicketPrice(price);
    setTicketCategory(category);
    setQty(1);
    setSelectedDates([]);
    setIsDateDialogOpen(true);
  };

  const handleDateToggle = (date: number) => {
    setSelectedDates((prev) => (prev.includes(date) ? [] : [date]));
  };

  // Fungsi untuk menghitung event_id berdasarkan tipe tiket dan tanggal
  const getEventId = (category: string, date: number): number => {
    // Mapping event_id berdasarkan kombinasi tipe tiket dan tanggal
    const eventIdMap: Record<string, Record<number, number>> = {
      "EARLY BIRD": {
        6: 1,
        7: 2,
        8: 3,
      },
      "SINGLE": {
        6: 4,
        7: 5,
        8: 6,
      },
      "COUPLE BUNDLE": {
        6: 7,
        7: 8,
        8: 9,
      },
      "FAMILY BUNDLE": {
        6: 10,
        7: 11,
        8: 12,
      },
      "GROUP BUNDLE": {
        6: 13,
        7: 14,
        8: 15,
      },
      "NORMAL TICKET": {
        6: 16,
        7: 17,
        8: 18,
      },
    };

    return eventIdMap[category]?.[date] || 1;
  };

  // Fungsi untuk memformat tanggal ke format "6 February 2026"
  const formatDateTicket = (date: number): string => {
    return `${date} February 2026`;
  };

  // Fungsi untuk mengkonversi kategori tiket ke format API
  const formatTicketType = (category: string): string => {
    const categoryMap: Record<string, string> = {
      "EARLY BIRD": "Early Bird",
      "SINGLE": "Single",
      "COUPLE BUNDLE": "Couple Bundle",
      "FAMILY BUNDLE": "Family Bundle",
      "GROUP BUNDLE": "Group Bundle",
      "NORMAL TICKET": "Normal Ticket",
    };
    return categoryMap[category] || category;
  };

  const validateOrderData = () => {
    if (!formData.name || !formData.email || !formData.whatsapp) {
      setSubmitError("Mohon lengkapi semua field");
      return false;
    }

    if (!selectedDates.length) {
      setSubmitError("Mohon pilih tanggal");
      return false;
    }

    setSubmitError(null);
    return true;
  };

  const handleOpenConfirmation = () => {
    if (!validateOrderData()) return;
    setIsConfirmationDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateOrderData()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedDate = selectedDates[0]; // Ambil tanggal pertama yang dipilih
      const eventId = getEventId(ticketCategory, selectedDate);
      const dateTicket = formatDateTicket(selectedDate);
      const typeTicket = formatTicketType(ticketCategory);

      const payload = {
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        type_ticket: typeTicket,
        qty: qty,
        event_id: eventId,
        date_ticket: dateTicket,
      };

      const response = await fetch("/api/participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat participant");
      }

      const data = await response.json();
      console.log("Participant created:", data);

      // Reset form setelah berhasil
      setIsContactDialogOpen(false);
      setIsConfirmationDialogOpen(false);
      setFormData({ name: "", email: "", whatsapp: "" });
      setSelectedDates([]);
      setTicketCategory("");
      setTicketPrice(0);
      setQty(1);
      setSubmitError(null);

      // Bisa tambahkan notifikasi sukses di sini
      alert("Pesanan berhasil dibuat!");
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim data"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToContact = () => {
    if (!selectedDates.length) return;
    setIsDateDialogOpen(false);
    setIsContactDialogOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-zinc-800">
      <div
        className="w-full max-w-[390px] min-h-screen bg-contain bg-top bg-no-repeat"
        style={{
          backgroundImage: `url('/images/bg.png')`,
          backgroundSize: "390px auto",
        }}
      >
        {/* Header */}
        <div className="pt-50 flex flex-col items-center px-6">
          <img
            src="/images/logo.png"
            alt="Popu Weekend Club Season 2"
            className="w-48 h-auto"
          />
          <div className="mt-1 w-full rounded-xl p-4 text-center font-mono text-sm text-zinc-900">
            <StarDivider
              content="********************************"
              textClassName="text-xs"
            />
            <p className="text-[11px] mt-3 leading-relaxed">
              Where all gamers, geeks, weebs, &amp; art enthusiasts gather in
              one place with POP Culture Spirits. While we love events as you
              guys love your card collections, this year we’ll move from
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
          <div className="-mt-2 w-full flex justify-center">
            <img
              src="/images/katagory.png"
              alt="Ticket Category"
              className="w-full max-w-xs h-auto"
            />
          </div>

          {/* Ticket */}
          <div className="mt-2 w-full rounded-xl px-4 py-3 font-mono text-xs text-zinc-900">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span>Category.</span>
              <span className="ml-24">Price.</span>
              <span>Action.</span>
            </div>
            <StarDivider
              content="***************************************"
              wrapperClassName="mt-1"
              textClassName="text-[10px]"
            />

            {/* Early Bird */}
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold tracking-wide text-orange-600">
                  EARLY BIRD
                </p>
                <p className="mt-1 text-[9px] font-bold text-orange-600">
                  promo price, limited stock!
                </p>
              </div>
              <div className="flex items-center text-[18px] font-semibold text-orange-600">
                25k
              </div>
              <div className="">
                <button
                  type="button"
                  onClick={() => handleBuyClick(25000, "EARLY BIRD")}
                  className="mt-2 w-10 max-w-xs rounded-2xl bg-yellow-400 py-1 text-center text-[15px] font-semibold text-black shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
                >
                  Buy
                </button>
              </div>
            </div>
            <StarDivider
              content="***************************************"
              wrapperClassName="mt-2"
              textClassName="text-[10px]"
            />

            {/* SINGLE */}
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold tracking-wide text-orange-600">
                  SINGLE
                </p>
                <p className="mt-1 text-[9px] font-bold text-orange-600">
                  1 ticket - ala carte
                </p>
              </div>
              <div className="flex items-center text-[18px] font-semibold text-orange-600 ml-10">
                50k
              </div>
              <div className="">
                <button
                  type="button"
                  onClick={() => handleBuyClick(50000, "SINGLE")}
                  className="mt-2 w-10 max-w-xs rounded-2xl bg-yellow-400 py-1 text-center text-[15px] font-semibold text-black shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
                >
                  Buy
                </button>
              </div>
            </div>
            <StarDivider
              content="***************************************"
              wrapperClassName="mt-2"
              textClassName="text-[10px]"
            />

            {/* COUPLE */}
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold tracking-wide text-orange-600">
                  COUPLE BUNDLE
                </p>
                <p className="mt-1 text-[9px] font-bold text-orange-600">
                  2 tickets - buy in pair
                </p>
              </div>
              <div className="flex items-center text-[18px] font-semibold text-orange-600">
                90k
              </div>
              <div className="">
                <button
                  type="button"
                  onClick={() => handleBuyClick(90000, "COUPLE BUNDLE")}
                  className="mt-2 w-10 max-w-xs rounded-2xl bg-yellow-400 py-1 text-center text-[15px] font-semibold text-black shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
                >
                  Buy
                </button>
              </div>
            </div>
            <StarDivider
              content="***************************************"
              wrapperClassName="mt-2"
              textClassName="text-[10px]"
            />

            {/* Family Bundle */}
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold tracking-wide text-orange-600">
                  FAMILY BUNDLE
                </p>
                <p className="mt-1 text-[9px] font-bold text-orange-600">
                  4 tickets - family pack
                </p>
              </div>
              <div className="flex items-center text-[18px] font-semibold text-orange-600 -ml-3">
                170k
              </div>
              <div className="">
                <button
                  type="button"
                  onClick={() => handleBuyClick(170000, "FAMILY BUNDLE")}
                  className="mt-2 w-10 max-w-xs rounded-2xl bg-yellow-400 py-1 text-center text-[15px] font-semibold text-black shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
                >
                  Buy
                </button>
              </div>
            </div>
            <StarDivider
              content="***************************************"
              wrapperClassName="mt-2"
              textClassName="text-[10px]"
            />

            {/* Group Bundle */}
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold tracking-wide text-orange-600">
                  GROUP BUNDLE
                </p>
                <p className="mt-1 text-[9px] font-bold text-orange-600">
                  8 tickets - Jumbo pack
                </p>
              </div>
              <div className="flex items-center text-[18px] font-semibold text-orange-600">
                300k
              </div>
              <div className="">
                <button
                  type="button"
                  onClick={() => handleBuyClick(300000, "GROUP BUNDLE")}
                  className="mt-2 w-10 max-w-xs rounded-2xl bg-yellow-400 py-1 text-center text-[15px] font-semibold text-black shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
                >
                  Buy
                </button>
              </div>
            </div>
            <StarDivider
              content="***************************************"
              wrapperClassName="mt-2"
              textClassName="text-[10px]"
            />

            {/* Normal */}
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold tracking-wide text-orange-600">
                  NORMAL TICKET
                </p>
                <p className="mt-1 text-[9px] font-bold text-orange-600">
                  promo price, limited stock!
                </p>
              </div>
              <div className="flex items-center text-[18px] font-semibold text-orange-600">
                75k
              </div>
              <div className="">
                <button
                  type="button"
                  onClick={() => handleBuyClick(75000, "NORMAL TICKET")}
                  className="mt-2 w-10 max-w-xs rounded-2xl bg-yellow-400 py-1 text-center text-[15px] font-semibold text-black shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
                >
                  Buy
                </button>
              </div>
            </div>
            <StarDivider
              content="***************************************"
              wrapperClassName="mt-2"
              textClassName="text-[10px]"
            />
          </div>

          {/* continue payment button */}
          {/* <button
            type="button"
            className="mt-2 w-60 max-w-xs rounded-2xl bg-yellow-400 py-3 text-center text-lg font-semibold text-black shadow-md
             transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
          >
            Continue Payment
          </button> */}

          {/* footer */}
          <div className="mt-8 flex flex-col items-center gap-4 pb-6 text-center font-mono text-xs text-zinc-900">
            <img
              src="/images/logo2.png"
              alt="Popu Weekend Club"
              className="w-16 h-auto"
            />
            <p className="flex items-center gap-2 text-sm">
              <a
                href="https://www.instagram.com/popuweekendclub/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <img
                    src="/images/instagram.svg"
                    alt="Instagram"
                    className="h-5 w-5"
                  />
                </span>
                <span>@POPUWEEKENDCLUB</span>
              </a>
            </p>
            <p className="text-[10px]">
              Copyright Popu © Weekend Club. All Right Reserved.
            </p>
          </div>
        </div>
      </div>

    {/* Popup */}
      {/* Popup Select Date */}
      <Dialog open={isDateDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="max-w-[390px] w-[370px] sm:-ml-1.5 rounded-2xl text-white border-none max-h-[80vh] overflow-y-auto bg-linear-to-b from-[#1E4492] to-[#399BDA]"
        >
          <DialogClose
            onClick={() => setIsDateDialogOpen(false)}
            className="absolute top-4 right-4 size-9 rounded-full bg-white/20 text-white font-bold hover:bg-white/40 transition"
          >
            ×
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-yellow-400 mb-2">
              Select Date(s)
            </DialogTitle>
            <p className="text-center text-xs text-white/90 mb-6">
              Please choose one date before continuing
            </p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex justify-center gap-3">
              {[6, 7, 8].map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleDateToggle(date)}
                  className={`w-16 h-16 rounded-xl font-black text-2xl transition-all ${
                    selectedDates.includes(date)
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {date}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-white/80">February 2026</p>

            <Button
              type="button"
              onClick={handleProceedToContact}
              disabled={!selectedDates.length}
              className="w-full bg-yellow-400 text-black font-bold text-lg py-5 rounded-xl hover:bg-yellow-500 disabled:bg-yellow-200 disabled:text-black/50"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup Information */}
      <Dialog open={isContactDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="max-w-[390px] w-[370px] sm:-ml-1.5 rounded-2xl text-white border-none max-h-[80vh] overflow-y-auto 
          bg-linear-to-b from-[#1E4492] to-[#399BDA]"
        >
          <button
            type="button"
            onClick={() => {
              setIsContactDialogOpen(false);
              setIsDateDialogOpen(true);
            }}
            className="absolute top-4 left-4 size-9 rounded-full bg-white/20 text-white text-lg font-bold hover:bg-white/40 transition"
            aria-label="Kembali"
          >
            ←
          </button>
          <DialogClose
            onClick={() => setIsContactDialogOpen(false)}
            className="absolute top-4 right-4 size-9 rounded-full bg-white/20 text-white font-bold hover:bg-white/40 transition"
          >
            ×
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="sr-only">CONTACT INFORMATION</DialogTitle>
            <div className="flex justify-center mb-2">
              <img
                src="/images/informasi.png"
                alt="CONTACT INFORMATION"
                className="w-auto h-auto max-w-full"
              />
            </div>
            <p className="text-center text-xs text-white/90 p-10 -mt-10">
              Make sure the number and email you input can be contacted
            </p>
          </DialogHeader>

          <div className="space-y-5 -mt-5">
            {/* Name Input */}
            <div className="space-y-2">
              <Label className="text-white font-semibold">NAME:</Label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-white text-black placeholder:text-gray-400 rounded-lg h-11"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label className="text-white font-semibold">EMAIL:</Label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-white text-black placeholder:text-gray-400 rounded-lg h-11"
              />
            </div>

            {/* WhatsApp Input */}
            <div className="space-y-2">
              <Label className="text-white font-semibold">
                WhatsApp NUMBER:
              </Label>
              <Input
                type="tel"
                placeholder="Enter your WhatsApp Number"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp: e.target.value })
                }
                className="bg-white text-black placeholder:text-gray-400 rounded-lg h-11"
              />
            </div>

            {/* Price + Qty + Total */}
            <div className="rounded-3xl p-4 text-white space-y-3 border border-white/20">
              <div className="text-center text-base font-semibold">
                {ticketCategory ? `${ticketCategory} - Price:` : "Price:"}{" "}
                {ticketPrice ? formatCurrency(ticketPrice) : "-"}
              </div>
              <div className="flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={decrease}
                  disabled={isSubmitting}
                  className="size-10 rounded-full bg-[#F5B045] text-black text-2xl font-bold leading-none shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="text-3xl font-black text-white">{qty}</span>
                <button
                  type="button"
                  onClick={increase}
                  disabled={isSubmitting}
                  className="size-10 rounded-full bg-yellow-400 text-black text-2xl font-bold leading-none shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              
              {/* Error Message */}
              {submitError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                  {submitError}
                </div>
              )}

              {/* Payment Button */}
              <button
                type="button"
                onClick={handleOpenConfirmation}
                disabled={
                  !ticketPrice ||
                  isSubmitting ||
                  !formData.name ||
                  !formData.email ||
                  !formData.whatsapp ||
                  !selectedDates.length
                }
                className="flex w-full mt-8 items-center justify-between rounded-2xl bg-[#F8BE1C] px-5 py-3 font-semibold text-black tracking-wide transition disabled:bg-yellow-200 disabled:text-black/50 hover:bg-[#e0a819] hover:translate-y-0.5 hover:shadow-lg"
              >
                <span>{isSubmitting ? "Processing..." : "Payment"}</span>
                <span>Total: {formatCurrency(totalPrice)}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup Konfirmasi */}
      <Dialog open={isConfirmationDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="max-w-[390px] w-[370px] sm:-ml-1.5 rounded-2xl text-white border-none max-h-[80vh] overflow-y-auto bg-[#FF4808]"
        >
          <button
            type="button"
            onClick={() => setIsConfirmationDialogOpen(false)}
            className="absolute top-4 left-4 size-9 rounded-full bg-white/20 text-white text-lg font-bold hover:bg-white/40 transition"
            aria-label="Kembali"
          >
            ←
          </button>
          <DialogClose
            onClick={() => setIsConfirmationDialogOpen(false)}
            className="absolute top-4 right-4 size-9 rounded-full bg-white/20 text-white font-bold hover:bg-white/40 transition"
          >
            ×
          </DialogClose>

          <DialogHeader>
            <div className="flex justify-center mb-2 mt-5">
              <img
                src="/images/konfirmasi.png"
                alt="Please re-confirm"
                className="w-64 max-w-full"
              />
            </div>
          </DialogHeader>

          <div className="space-y-4 text-sm font-semibold">
            <div className="flex justify-between border border-white/10 rounded-2xl px-4 py-3 bg-white/5">
              <span className="text-white/70">Name</span>
              <span className="text-right">{formData.name || "-"}</span>
            </div>
            <div className="flex justify-between border border-white/10 rounded-2xl px-4 py-3 bg-white/5">
              <span className="text-white/70">Email</span>
              <span className="text-right">{formData.email || "-"}</span>
            </div>
            <div className="flex justify-between border border-white/10 rounded-2xl px-4 py-3 bg-white/5">
              <span className="text-white/70">WhatsApp</span>
              <span className="text-right">{formData.whatsapp || "-"}</span>
            </div>
            <div className="flex justify-between border border-white/10 rounded-2xl px-4 py-3 bg-white/5">
              <span className="text-white/70">Type Ticket</span>
              <span className="text-right">
                {ticketCategory ? formatTicketType(ticketCategory) : "-"}
              </span>
            </div>
            <div className="flex justify-between border border-white/10 rounded-2xl px-4 py-3 bg-white/5">
              <span className="text-white/70">Date</span>
              <span className="text-right">
                {selectedDates.length ? formatDateTicket(selectedDates[0]) : "-"}
              </span>
            </div>
            <div className="flex justify-between border border-white/10 rounded-2xl px-4 py-3 bg-white/5">
              <span className="text-white/70">Quantity</span>
              <span className="text-right">{qty}</span>
            </div>
            <div className="flex justify-between border border-white/10 rounded-2xl px-4 py-3 bg-white/10">
              <span className="text-white/70">Total Paid</span>
              <span className="text-right text-lg text-yellow-300">
                Rp {formatCurrency(totalPrice)}
              </span>
            </div>

            {submitError && (
              <div className="mt-2 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                {submitError}
              </div>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-yellow-400 text-black font-bold text-lg py-4 rounded-xl hover:bg-yellow-500 disabled:bg-yellow-200 disabled:text-black/50 mt-5"
            >
              {isSubmitting ? "Processing..." : "Confirm & Pay"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
