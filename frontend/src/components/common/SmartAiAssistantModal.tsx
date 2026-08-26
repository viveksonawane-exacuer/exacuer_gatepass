import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SmartAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  actionUrl?: string;
  actionLabel?: string;
}

const SUGGESTION_CHIPS = [
  { id: "vip", label: "VIP Fast Pass", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", icon: "🌐" },
  { id: "pending", label: "Pending Approvals", color: "#f97316", bg: "rgba(249, 115, 22, 0.08)", icon: "🟠" },
  { id: "inside", label: "Current Headcount", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)", icon: "🟣" },
  { id: "preregister", label: "Pre-register Host", color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", icon: "🟢" },
  { id: "analytics", label: "Daily Analytics", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.08)", icon: "🔷" },
];

export function SmartAiAssistantModal({ isOpen, onClose }: SmartAiAssistantModalProps) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // initial state
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || prompt).trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setIsThinking(true);

    setTimeout(() => {
      let aiResponse: Message;
      const lower = text.toLowerCase();

      if (lower.includes("headcount") || lower.includes("inside") || lower.includes("count")) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Currently tracking live visitors on premises. You can view real-time occupants and filter by entry zones.",
          actionUrl: "/inside",
          actionLabel: "View Live Visitors",
        };
      } else if (lower.includes("pending") || lower.includes("approval") || lower.includes("pass")) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Found pending visitor entry requests awaiting host verification. Quick action required for VIP visitors.",
          actionUrl: "/approvals",
          actionLabel: "Review Approvals",
        };
      } else if (lower.includes("pre-register") || lower.includes("register") || lower.includes("invite")) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "You can pre-register expected guests or create instant digital QR gate passes.",
          actionUrl: "/pre-register",
          actionLabel: "Create Pre-Registration",
        };
      } else if (lower.includes("analytic") || lower.includes("report") || lower.includes("summary")) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Today's traffic summary and peak hour insights are available on the analytics dashboard.",
          actionUrl: "/analytics",
          actionLabel: "Open Reports",
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `I've analyzed your query "${text}". Smart VMS assistant is ready to assist with gate operations, guest passes, and live monitoring.`,
          actionUrl: "/inside",
          actionLabel: "Explore Gate Desk",
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setIsThinking(false);
    }, 650);
  };

  return (
    <div className="vm-ai-modal-overlay" role="dialog" aria-modal="true" aria-label="Smart AI Gate Assistant">
      <div className="vm-ai-modal-sheet">
        {/* Top Header */}
        <div className="vm-ai-modal-head">
          <button type="button" className="vm-ai-back-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="vm-ai-modal-badge">VMS Intelligence</span>
          <button type="button" className="vm-ai-more-btn" onClick={() => setMessages([])} title="Clear chat">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        {/* Scroll Content */}
        <div className="vm-ai-modal-body" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="vm-ai-hero-section">
              {/* Glowing 3D Orb */}
              <div className="vm-ai-orb-wrap">
                <div className="vm-ai-orb-glow" />
                <div className="vm-ai-orb-sphere" />
              </div>

              <h2 className="vm-ai-hero-title">
                Get smart visitor insights powered by artificial intelligence.
              </h2>

              {/* Chips */}
              <div className="vm-ai-chips-grid">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className="vm-ai-chip"
                    style={{ color: chip.color, background: chip.bg, borderColor: `${chip.color}25` }}
                    onClick={() => handleSend(chip.label)}
                  >
                    <span className="vm-ai-chip-icon">{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="vm-ai-chat-thread">
              {messages.map((m) => (
                <div key={m.id} className={`vm-ai-chat-msg vm-ai-chat-msg--${m.sender}`}>
                  {m.sender === "ai" && <div className="vm-ai-avatar-badge">✦</div>}
                  <div className="vm-ai-msg-bubble">
                    <p className="vm-ai-msg-text">{m.text}</p>
                    {m.actionUrl && (
                      <button
                        type="button"
                        className="vm-ai-msg-action-btn"
                        onClick={() => {
                          onClose();
                          navigate(m.actionUrl!);
                        }}
                      >
                        <span>{m.actionLabel || "View"}</span>
                        <span>›</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="vm-ai-chat-msg vm-ai-chat-msg--ai">
                  <div className="vm-ai-avatar-badge">✦</div>
                  <div className="vm-ai-msg-bubble vm-ai-msg-bubble--thinking">
                    <span className="vm-ai-dot" />
                    <span className="vm-ai-dot" />
                    <span className="vm-ai-dot" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Glowing Border Input Card */}
        <div className="vm-ai-input-card-wrap">
          <div className="vm-ai-input-card">
            <div className="vm-ai-input-header">
              <label htmlFor="vm-ai-prompt-input" className="vm-ai-input-label">
                Ask anything about visitors & gate operations
              </label>
            </div>
            <textarea
              id="vm-ai-prompt-input"
              className="vm-ai-prompt-textarea"
              placeholder="e.g. Show all guests checked in after 10 AM or verify VIP pass"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="vm-ai-input-toolbar">
              <div className="vm-ai-toolbar-left">
                <button
                  type="button"
                  className="vm-ai-tool-btn"
                  onClick={() => handleSend("Show pending approvals")}
                  title="Quick shortcut"
                >
                  +
                </button>
                <button
                  type="button"
                  className="vm-ai-tool-btn"
                  onClick={() => handleSend("Live visitors snapshot")}
                  title="Attach context"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="vm-ai-tool-btn"
                  onClick={() => handleSend("Voice command test")}
                  title="Voice command"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                className="vm-ai-send-btn"
                onClick={() => handleSend()}
                disabled={!prompt.trim() && !isThinking}
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
