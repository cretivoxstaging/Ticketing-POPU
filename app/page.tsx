"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";

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

type EventStatus = {
  event_id: number;
  remaining: number;
  waiting: number;
  waitingRoomFull: boolean;
  soldOut: boolean;
};

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
  const [isLoadingContinue, setIsLoadingContinue] = useState(false);
  const [participantData, setParticipantData] = useState<{
    id: number;
    order_id: string;
  } | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(10 * 60); // 10 minutes in seconds
  const [qrCode, setQrCode] = useState<string>("");
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);
  const [isPaymentNotDoneDialogOpen, setIsPaymentNotDoneDialogOpen] =
    useState(false);
  const [isThankYouDialogOpen, setIsThankYouDialogOpen] = useState(false);
  const [eventStatuses, setEventStatuses] = useState<
    Record<number, EventStatus>
  >({});
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const timerInitializedRef = useRef(false);
  const totalPrice = qty * ticketPrice;

  // Hitung menit dan detik untuk countdown timer
  const timerMinutes = String(Math.floor(remainingTime / 60)).padStart(2, "0");
  const timerSeconds = String(remainingTime % 60).padStart(2, "0");

  // Reset semua state setelah pembayaran selesai
  const resetAllStates = () => {
    setFormData({ name: "", email: "", whatsapp: "" });
    setSelectedDates([]);
    setTicketCategory("");
    setTicketPrice(0);
    setQty(1);
    setSubmitError(null);
    setParticipantData(null);
    setQrCode("");
    timerInitializedRef.current = false; // Reset timer untuk proses baru
  };

  // Fungsi untuk menutup popup thank you dan reset state
  const handleCloseThankYou = () => {
    setIsThankYouDialogOpen(false);
    resetAllStates();
  };

  // Jalankan countdown ketika popup information dibuka dan berlanjut ke popup berikutnya
  useEffect(() => {
    // Timer dimulai saat popup information dibuka
    if (
      !isContactDialogOpen &&
      !isConfirmationDialogOpen &&
      !isPaymentDialogOpen
    ) {
      // Reset flag saat semua popup tertutup
      timerInitializedRef.current = false;
      return;
    }

    // Reset timer ke 10 menit hanya saat popup information pertama kali dibuka
    // dan timer belum pernah diinisialisasi
    if (
      isContactDialogOpen &&
      !isConfirmationDialogOpen &&
      !isPaymentDialogOpen &&
      !timerInitializedRef.current
    ) {
      setRemainingTime(10 * 60);
      timerInitializedRef.current = true;
    }

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Tutup semua popup ketika timer habis
          setIsDateDialogOpen(false);
          setIsContactDialogOpen(false);
          setIsConfirmationDialogOpen(false);
          setIsPaymentDialogOpen(false);
          timerInitializedRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isContactDialogOpen, isConfirmationDialogOpen, isPaymentDialogOpen]);

  const decrease = () => {
    setQty((prev) => Math.max(1, prev - 1));
  };

  const increase = () => {
    setQty((prev) => Math.min(5, prev + 1));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID").format(value);

  const fetchEventStatuses = async () => {
    setIsStatusLoading(true);
    setStatusError(null);
    try {
      const response = await fetch("/api/participant/status");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memuat status tiket");
      }
      const data = await response.json();
      if (Array.isArray(data.data)) {
        const statusMap: Record<number, EventStatus> = {};
        data.data.forEach((status: EventStatus) => {
          statusMap[status.event_id] = status;
        });
        setEventStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching event statuses:", error);
      setStatusError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memuat status tiket"
      );
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleBuyClick = (price: number, category: string) => {
    setTicketPrice(price);
    setTicketCategory(category);
    setQty(1);
    setSelectedDates([]);
    setParticipantData(null);
    timerInitializedRef.current = false; // Reset timer untuk proses baru
    setIsDateDialogOpen(true);
    fetchEventStatuses();
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
      SINGLE: {
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
      SINGLE: "Single",
      "COUPLE BUNDLE": "Couple Bundle",
      "FAMILY BUNDLE": "Family Bundle",
      "GROUP BUNDLE": "Group Bundle",
      "NORMAL TICKET": "Normal Ticket",
    };
    return categoryMap[category] || category;
  };

  const getStatusByDate = (category: string, date: number) => {
    const eventId = getEventId(category, date);
    return eventStatuses[eventId];
  };

  const validateEmail = (email: string): boolean => {
    // Validasi email harus memiliki @ dan domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateOrderData = () => {
    if (!formData.name || !formData.email || !formData.whatsapp) {
      setSubmitError("Mohon lengkapi semua field");
      return false;
    }

    // Validasi format email
    if (!validateEmail(formData.email)) {
      setSubmitError(
        "Mohon masukkan email yang valid (contoh: nama@domain.com)"
      );
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

  const handlePaymentCompleted = async () => {
    if (!participantData?.order_id) {
      setSubmitError("Order ID tidak ditemukan");
      return;
    }

    setIsCompletingPayment(true);
    setSubmitError(null);

    try {
      const response = await fetch(
        `/api/callback-payment/${participantData.order_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        // Cek jika pembayaran belum dilakukan (404 atau error terkait payment log)
        if (
          response.status === 404 ||
          errorData.error?.toLowerCase().includes("no payment log") ||
          errorData.error?.toLowerCase().includes("payment log found")
        ) {
          setIsPaymentNotDoneDialogOpen(true);
          return;
        }

        throw new Error(errorData.error || "Gagal memverifikasi pembayaran");
      }

      const data = await response.json();

      // Tutup popup payment dan buka popup thank you
      setIsPaymentDialogOpen(false);
      setIsThankYouDialogOpen(true);

      // Reset state setelah popup thank you ditutup
      // resetAllStates() akan dipanggil saat popup thank you ditutup
    } catch (error) {
      console.error("Error completing payment:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memverifikasi pembayaran";

      // Cek jika error terkait pembayaran belum dilakukan
      if (
        errorMessage.toLowerCase().includes("no payment log") ||
        errorMessage.toLowerCase().includes("payment log found")
      ) {
        setIsPaymentNotDoneDialogOpen(true);
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setIsCompletingPayment(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateOrderData()) return;
    if (!participantData?.order_id) {
      setSubmitError(
        "Order ID tidak ditemukan. Silakan ulangi pemilihan tanggal terlebih dahulu."
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedDate = selectedDates[0];
      const eventId = getEventId(ticketCategory, selectedDate);
      const dateTicket = formatDateTicket(selectedDate);
      const typeTicket = formatTicketType(ticketCategory);

      const payload = {
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        type_ticket: typeTicket,
        event_id: eventId,
        date_ticket: dateTicket,
        total_paid: totalPrice,
      };

      const response = await fetch(
        `/api/participant/${participantData.order_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengkonfirmasi pembayaran");
      }

      const data = await response.json();

      // Simpan qr_code dari response
      if (data.qr_code) {
        setQrCode(data.qr_code);
      }

      setIsContactDialogOpen(false);
      setIsConfirmationDialogOpen(false);
      setIsPaymentDialogOpen(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim data"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToContact = async () => {
    if (!selectedDates.length) return;

    setIsLoadingContinue(true);
    setSubmitError(null);
    setParticipantData(null);

    try {
      const selectedDate = selectedDates[0];
      const eventId = getEventId(ticketCategory, selectedDate);

      const response = await fetch("/api/participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_id: eventId, qty }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat participant");
      }

      const data = await response.json();

      // Simpan data response (id dan order_id)
      if (data.id && data.order_id) {
        setParticipantData({
          id: data.id,
          order_id: data.order_id,
        });
      }

      setIsDateDialogOpen(false);
      setIsContactDialogOpen(true);
    } catch (error) {
      console.error("Error creating participant:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat participant"
      );
    } finally {
      setIsLoadingContinue(false);
    }
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
              Copyright © 2025 Popu Weekend Club x Cretech.
            </p>
            <p className="text-[10px] -mt-3">All Rights Reserved.</p>
          </div>
        </div>
      </div>

      {/* Popup */}
      {/* Popup Selection */}
      <Dialog open={isDateDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="max-w-[390px] w-[370px] sm:-ml-1.5 md:ml-0.5 rounded-2xl text-white border-none max-h-[80vh] overflow-y-auto bg-linear-to-b from-[#1E4492] to-[#399BDA]"
        >
          <DialogClose
            onClick={() => setIsDateDialogOpen(false)}
            className="absolute top-4 right-4 size-9 rounded-full bg-white/20 text-white font-bold hover:bg-white/40 transition"
          >
            ×
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="sr-only">
              Ticket Selection
            </DialogTitle>
            <div className="flex justify-center mb-3 mt-5">
              <img
                src="/images/selection.png"
                alt="Thank You"
                className="w-64 max-w-full"
              />
            </div>
            <DialogDescription className="text-center text-xs text-white/90 mb-6">
              Plase Select your visit date(s). You can buy tickets for multiple
              days, with a maximum of 5 tickets per day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-3">
              {[6, 7, 8].map((date) => {
                const status = ticketCategory
                  ? getStatusByDate(ticketCategory, date)
                  : null;
                const isSoldOut = status?.soldOut;
                const isSelected = selectedDates.includes(date);
                const baseClasses =
                  "w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all";
                const stateClasses = isSoldOut
                  ? "bg-[#d9d9d9] text-gray-700 border-gray-400 cursor-not-allowed"
                  : isSelected
                  ? "bg-[#FF4808] text-white border-[#FF4808] shadow-lg shadow-orange-500/40"
                  : "bg-[#FF7C63] text-white border-[#ff6c05] hover:translate-y-0.5";
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleDateToggle(date)}
                    disabled={isSoldOut || isStatusLoading}
                    className={`${baseClasses} ${stateClasses}`}
                  >
                    <span className="text-lg font-semibold">
                      {formatDateTicket(date)}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isSoldOut ? "text-gray-700" : "text-white"
                      }`}
                    >
                      {isSoldOut ? "Soldout" : "Available"}
                    </span>
                  </button>
                );
              })}
            </div>

            {statusError && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                {statusError}
              </div>
            )}

            {/* Price + Quantity + Total */}
            <div className="rounded-3xl p-4 text-white space-y-3 border border-white/20">
              <div className="text-center text-base font-semibold">
                {ticketCategory ? `${ticketCategory} - Price:` : "Price:"}{" "}
                {ticketPrice ? formatCurrency(ticketPrice) : "-"}
              </div>
              <div className="flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={decrease}
                  disabled={isLoadingContinue}
                  className="size-10 rounded-full bg-[#F5B045] text-black text-2xl font-bold leading-none shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="text-3xl font-black text-white">{qty}</span>
                <button
                  type="button"
                  onClick={increase}
                  disabled={isLoadingContinue || qty >= 5}
                  className="size-10 rounded-full bg-yellow-400 text-black text-2xl font-bold leading-none shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              {/* <div className="text-center text-sm">
                Total: Rp {formatCurrency(totalPrice)}
              </div> */}

              {submitError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                  {submitError}
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleProceedToContact}
              disabled={
                !selectedDates.length || isLoadingContinue || isStatusLoading
              }
              className="flex w-full mt-4 items-center justify-between rounded-2xl bg-[#F8BE1C] px-5 py-5 font-semibold text-black tracking-wide transition disabled:bg-yellow-200 disabled:text-black/50 hover:bg-[#e0a819] hover:translate-y-0.5 hover:shadow-lg "
            >
              <span>
                {isStatusLoading
                  ? "Checking availability..."
                  : isLoadingContinue
                  ? "Processing..."
                  : "Payment"}
              </span>
              <span>Total: {formatCurrency(totalPrice)}</span>
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
          <DialogClose
            onClick={() => setIsContactDialogOpen(false)}
            className="absolute top-4 right-4 size-9 rounded-full bg-white/20 text-white font-bold hover:bg-white/40 transition"
          >
            ×
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="sr-only">CONTACT INFORMATION</DialogTitle>
            <div className="flex justify-center mb-2 mt-5">
              <img
                src="/images/informasi.png"
                alt="CONTACT INFORMATION"
                className="w-auto h-auto max-w-full"
              />
            </div>
            <DialogDescription className="text-center text-xs text-white/90 p-10 -mt-10">
              Make sure the number and email you input can be contacted
            </DialogDescription>
            <div className="flex justify-center -mt-10 mb-7">
              <div className="text-center text-2xl font-black text-yellow-400 tracking-[0.2em]">
                {timerMinutes}:{timerSeconds}
              </div>
            </div>
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
              className="w-full bg-yellow-400 text-black font-bold text-lg py-2 rounded-xl hover:bg-yellow-500 disabled:bg-yellow-200 disabled:text-black/50 mt-7 mb-5"
            >
              <span>{isSubmitting ? "Processing..." : "Submit"}</span>
            </button>
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
            <DialogTitle className="sr-only">Konfirmasi Pesanan</DialogTitle>
            <div className="flex justify-center mb-2 mt-5">
              <img
                src="/images/konfirmasi.png"
                alt="Please re-confirm"
                className="w-64 max-w-full"
              />
            </div>
            <DialogDescription className="text-center text-xs text-white/90 p-10 -mt-10">
              Confirm your order before payment
            </DialogDescription>
            <div className="flex justify-center -mt-10 mb-5">
              <div className="text-center text-2xl font-black text-yellow-300 tracking-[0.2em]">
                {timerMinutes}:{timerSeconds}
              </div>
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
                {selectedDates.length
                  ? formatDateTicket(selectedDates[0])
                  : "-"}
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
              className="w-full bg-yellow-400 text-black font-bold text-lg py-4 rounded-xl hover:bg-yellow-500 disabled:bg-yellow-200 disabled:text-black/50 mt-5 mb-5"
            >
              {isSubmitting ? "Processing..." : "Confirm & Pay"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup Payment */}
      <Dialog open={isPaymentDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="max-w-[390px] w-[370px] sm:-ml-1.5 rounded-3xl text-white border-none max-h-[80vh] overflow-y-auto bg-[#FFC21E] px-0 pb-8"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">Pembayaran</DialogTitle>
            <DialogDescription className="sr-only">
              Lengkapi pembayaran dengan memindai QR code atau transfer sesuai
              instruksi
            </DialogDescription>
          </DialogHeader>
          {/* Header Payment */}
          <div className="flex flex-col items-center pt-4 pb-4">
            <img
              src="/images/payment.png"
              alt="Payment"
              className="h-12 w-auto drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]"
            />

            <p className="mt-2 text-xs font-semibold text-black/80">
              Complete payment before:
            </p>
            <div className="mt-3 text-center text-3xl font-black text-black tracking-[0.2em]">
              {timerMinutes}:{timerSeconds}
            </div>
          </div>

          {/* Orange Card with QR & Timer */}
          <div className="mx-6 rounded-3xl bg-[#FF4808] px-4 pt-6 pb-5 shadow-lg shadow-[#FF4808]/50">
            <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl bg-white p-3">
              {/* QR Code */}
              {qrCode ? (
                <QRCodeSVG
                  value={qrCode}
                  size={208}
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <div className="h-52 w-52 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-xs">
                    Loading QR Code...
                  </span>
                </div>
              )}
            </div>

            <p className="mt-2 text-center text-xs font-semibold text-white">
              Order ID:{" "}
              <span className="font-bold">
                {participantData?.order_id || "-"}
              </span>
            </p>
          </div>

          {/* Order Detail Card */}
          <div className="mx-6 mt-4 rounded-3xl bg-[#0042A6] px-5 py-5 text-xs font-semibold shadow-md shadow-black/20">
            <p className="text-sm font-black tracking-wide mb-4">
              ORDER DETAIL
            </p>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-white/80">NAME:</span>
                <span className="text-right text-white">
                  {formData.name || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/80">EMAIL:</span>
                <span className="text-right text-white">
                  {formData.email || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/80">WHATSAPP NUMBER:</span>
                <span className="text-right text-white">
                  {formData.whatsapp || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/80">TICKET:</span>
                <span className="text-right text-white">
                  {ticketCategory ? formatTicketType(ticketCategory) : "-"}
                  {qty ? ` - ${qty} Ticket(s)` : ""}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/80">DATE:</span>
                <span className="text-right text-white">
                  {selectedDates.length
                    ? formatDateTicket(selectedDates[0])
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-1 border-t border-white/20 mt-2">
                <span className="text-white/80">TOTAL:</span>
                <span className="text-right text-white">
                  Rp {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
              {submitError}
            </div>
          )}

          {/* Payment Completed Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handlePaymentCompleted}
              disabled={isCompletingPayment || !participantData?.order_id}
              className="w-[80%] rounded-2xl bg-[#FF4808] py-3 text-center text-base font-bold text-white shadow-md shadow-[#FF4808]/40 hover:bg-[#e13c01] active:translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCompletingPayment ? "Verifying..." : "Payment Completed"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup Hold On */}
      <Dialog open={isPaymentNotDoneDialogOpen}>
        <DialogContent
          showCloseButton={true}
          className="max-w-[390px] w-[370px] sm:-ml-1.5 rounded-2xl text-white border-none bg-[#FF4808]"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              HOLD ON
            </DialogTitle>
            <div className="flex justify-center mb-5 mt-5">
              <img
                src="/images/holdon.png"
                alt="Please re-confirm"
                className="w-44 max-w-full"
              />
            </div>
            <DialogDescription className="text-center text-sm text-white/90">
              Your payment has not been completed. Please finish your payment
              first, before clicking.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              onClick={() => setIsPaymentNotDoneDialogOpen(false)}
              className="w-full bg-yellow-400 text-black font-bold text-lg py-3 rounded-xl hover:bg-yellow-500"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup Thank You */}
      <Dialog open={isThankYouDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="max-w-[390px] w-[370px] sm:-ml-1.5 rounded-2xl text-white border-none bg-linear-to-b from-[#1E4492] to-[#399BDA]"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              Thank You!
            </DialogTitle>
            <div className="flex justify-center mb-7 mt-5">
              <img
                src="/images/thankyou.png"
                alt="Thank You"
                className="w-64 h-auto max-w-full"
              />
            </div>
            <DialogDescription className="text-center text-sm text-white/90 mb-2">
              Your payment has been successfully verified.
            </DialogDescription>
            <DialogDescription className="text-center text-sm text-white/80">
              Thank you for purchasing your tickets. We will send your ticket
              details to your email and WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              onClick={handleCloseThankYou}
              className="w-full bg-yellow-400 text-black font-bold text-lg py-3 rounded-xl hover:bg-yellow-500"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
