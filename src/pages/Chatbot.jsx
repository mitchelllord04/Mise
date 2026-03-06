import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { origin: "bot", text: "Ask me anything food-related." },
  ]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    const q = text.trim();
    if (!q || thinking) return;

    const nextMessages = [...messages, { origin: "human", text: q }];
    setMessages(nextMessages);
    setText("");
    setThinking(true);

    try {
      const history = nextMessages.map((m) => ({
        role: m.origin === "human" ? "user" : "assistant",
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setMessages((m) => [
        ...m,
        { origin: "bot", text: data.text || "Sorry—no response." },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { origin: "bot", text: err?.message || "Something went wrong." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="card rounded-4 shadow-sm">
        <div className="card-body">
          <h4 className="mb-3">Food Chatbot</h4>

          <div
            className="border rounded-3 p-3 mb-3"
            style={{ height: 600, overflowY: "auto" }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${m.origin === "human" ? "text-end" : ""}`}
              >
                <div
                  className={`d-inline-block px-3 py-2 rounded-3 ${
                    m.origin === "human"
                      ? "bg-dark text-white"
                      : "bg-light text-dark"
                  }`}
                  style={{ maxWidth: "85%", textAlign: "left" }}
                >
                  {m.origin === "bot" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        ul: ({ children }) => (
                          <ul className="mb-2 ps-4">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-2 ps-4">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1">{children}</li>
                        ),
                        a: ({ children, href }) => (
                          <a href={href} target="_blank" rel="noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}

            {thinking && <div className="text-body-secondary">Thinking…</div>}

            <div ref={bottomRef} />
          </div>

          <div className="input-group">
            <input
              className="form-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Ask about recipes, nutrition, cooking, or meal ideas"
            />
            <button className="btn btn-dark" onClick={send} disabled={thinking}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
