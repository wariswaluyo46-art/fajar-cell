"use client";

import {
  AlertCircle,
  Bot,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import { buildGeneralInquiryUrl } from "@/lib/whatsapp";
import type { AiChatMessage } from "@/types";

const GREETING =
  "Halo! Saya Fajar AI, asisten belanja Konter Fajar Cell. Tanyakan HP bekas, HP baru, aksesoris, atau tukar tambah — saya bantu carikan sesuai budget dan kebutuhan.";

const SUGGESTIONS = [
  "HP bekas bagus budget 1 jutaan?",
  "Rekomendasi HP kamera terbaik",
  "HP murah untuk kebutuhan harian",
  "Aksesoris apa yang ready?",
] as const;

const HISTORY_LIMIT = 8;
const MAX_INPUT_CHARS = 1_200;

interface ChatEntry extends AiChatMessage {
  id: string;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readError(value: unknown, fallback: string): string {
  if (
    isRecord(value) &&
    typeof value.error === "string" &&
    value.error.trim() !== ""
  ) {
    return value.error;
  }

  return fallback;
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
        aria-label="Fajar AI sedang menulis balasan"
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-royal-400 motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export function AiAssistant() {
  const panelId = useId();
  const inputId = `${panelId}-input`;
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([
    { id: "greeting", role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const requestIdRef = useRef(0);

  const requestReply = useCallback(async (history: ChatEntry[]) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsSending(true);
    setError(null);

    try {
      const payload: { messages: AiChatMessage[] } = {
        messages: history
          .slice(-HISTORY_LIMIT)
          .map(({ role, content }) => ({ role, content })),
      };

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => null);
      if (requestId !== requestIdRef.current) return;

      if (!response.ok) {
        setError(
          readError(
            data,
            "Asisten AI sedang sibuk. Coba lagi sebentar lagi.",
          ),
        );
        return;
      }

      if (
        !isRecord(data) ||
        data.success !== true ||
        typeof data.reply !== "string" ||
        data.reply.trim() === ""
      ) {
        setError("Balasan AI tidak valid. Coba kirim ulang pertanyaanmu.");
        return;
      }

      const reply = data.reply.trim();
      if (reply === "") {
        setError("Balasan AI tidak valid. Coba kirim ulang pertanyaanmu.");
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: reply,
        },
      ]);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(
        "Tidak dapat menghubungi asisten. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSending(false);
      }
    }
  }, []);

  function sendText(raw: string) {
    const text = raw.trim();
    if (text === "" || isSending) return;

    const entry: ChatEntry = {
      id: createId(),
      role: "user",
      content: text,
    };
    const next = [...messages, entry];

    setMessages(next);
    setInput("");
    void requestReply(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendText(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      sendText(input);
    }
  }

  function handleRetry() {
    if (isSending) return;

    const last = messages[messages.length - 1];
    if (last?.role !== "user") return;

    void requestReply(messages);
  }

  function resetConversation() {
    requestIdRef.current += 1;
    setMessages([
      { id: "greeting", role: "assistant", content: GREETING },
    ]);
    setInput("");
    setError(null);
    setIsSending(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    list.scrollTop = list.scrollHeight;
  }, [messages, isSending, error]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [input]);

  const canRetry =
    !isSending && messages[messages.length - 1]?.role === "user";
  const showSuggestions =
    messages.length === 1 && !isSending && error === null;

  return (
    <>
      {/* Smart Bottom-Right Action Dock (Harmonisasi AI + WA untuk Segala Usia) */}
      <div className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6 z-40 flex items-center gap-2 p-1.5 rounded-full border border-slate-200/90 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl">
        {/* Tombol Tanya AI */}
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={isOpen ? "Tutup Fajar AI" : "Buka Fajar AI"}
          className={cn(
            "inline-flex h-11 sm:h-12 items-center gap-2 rounded-full px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer active:scale-95",
            isOpen
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-brand-gradient text-white shadow-md shadow-royal-600/30 hover:scale-[1.03]",
          )}
        >
          {isOpen ? (
            <X className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4 text-cyan-300 shrink-0" aria-hidden="true" />
          )}
          <span>{isOpen ? "Tutup AI" : "Tanya AI"}</span>
        </button>

        {/* Tombol Chat WA Admin */}
        <a
          href={buildGeneralInquiryUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat admin Konter Fajar Cell via WhatsApp"
          onClick={() =>
            showToast({
              variant: "info",
              title: "Mengarahkan ke WhatsApp...",
              description: "Chat admin dibuka di tab baru.",
            })
          }
          className="group relative inline-flex h-11 sm:h-12 items-center gap-2 rounded-full bg-wa-gradient px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition-all duration-300 hover:scale-[1.03] active:scale-95"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
          <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>Chat WA Admin</span>
        </a>
      </div>

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Fajar AI, asisten belanja Konter Fajar Cell"
          className="animate-fade-up fixed inset-x-3 bottom-18 z-50 flex max-h-[min(72dvh,600px)] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/25 sm:inset-x-auto sm:bottom-22 sm:right-6 sm:w-[400px]"
        >
          <div className="flex items-center gap-2.5 bg-brand-gradient px-4 py-3.5 text-white">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">Fajar AI</p>
              <p className="flex items-center gap-1.5 text-[11px] text-royal-100">
                <span
                  className="size-1.5 rounded-full bg-emerald-400 animate-pulse-dot"
                  aria-hidden="true"
                />
                Asisten belanja • Online
              </p>
            </div>
            <button
              type="button"
              onClick={resetConversation}
              aria-label="Mulai percakapan baru"
              title="Mulai percakapan baru"
              className="inline-flex size-9 items-center justify-center rounded-xl text-royal-100 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup Fajar AI"
              className="inline-flex size-9 items-center justify-center rounded-xl text-royal-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Percakapan dengan Fajar AI"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3.5 py-4 sm:px-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap",
                    message.role === "user"
                      ? "rounded-br-md bg-royal-700 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="flex flex-wrap gap-1.5 pl-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendText(suggestion)}
                    className="rounded-full border border-royal-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-royal-700 shadow-sm transition hover:border-royal-300 hover:bg-royal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {isSending && <TypingBubble />}

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-700"
              >
                <p className="flex items-start gap-2">
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </p>
                {canRetry && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-2.5 py-1 font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                  >
                    <RotateCcw className="size-3" aria-hidden="true" />
                    Coba lagi
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor={inputId} className="sr-only">
                Tulis pertanyaan untuk Fajar AI
              </label>
              <textarea
                id={inputId}
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya stok, harga, atau tukar tambah..."
                maxLength={MAX_INPUT_CHARS}
                autoComplete="off"
                enterKeyHint="send"
                className="max-h-28 min-h-11 w-full flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-100"
              />
              <button
                type="submit"
                disabled={input.trim() === "" || isSending}
                aria-label="Kirim pesan"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-royal-700 text-white shadow-sm transition hover:bg-royal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSending ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-500">
              Fajar AI bisa salah. Konfirmasi stok dan harga lewat WhatsApp
              admin.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
