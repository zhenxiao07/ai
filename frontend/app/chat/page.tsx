"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { sendChatStream } from "@/lib/api"


const QUICK_QUESTIONS = [
  "帮我整体评估一下我的志愿方案",
  "我的分数能上哪些 985/211？",
  "张雪峰怎么看我的Top专业？",
  "我意向院校值得报吗？",
]

export default function ChatPage() {
  const router = useRouter()
  const { userInfo, result, chatMessages, addMessage, updateLastAssistantMessage } = useAppStore()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const topMajors = result?.recommended_majors.slice(0, 3).map((m) => m.name) || []
  const topSchool = result?.recommended_schools["稳"]?.[0]?.university_name || ""

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setInput("")
    setLoading(true)

    addMessage({ role: "user", content: text })
    addMessage({ role: "assistant", content: "" })

    let accumulated = ""
    await sendChatStream(
      userInfo ?? { province: "广东" },
      result?.mbti_type || "",
      topMajors,
      topSchool,
      chatMessages.filter((m) => m.content),
      text,
      (chunk) => {
        accumulated += chunk
        updateLastAssistantMessage(accumulated)
      },
      () => setLoading(false)
    )
  }

  const toggleVoice = () => {
    if (reachedLimit || loading) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert("当前浏览器不支持语音输入，请使用 Chrome 或 Edge")
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SR()
    recognition.lang = "zh-CN"
    recognition.continuous = false
    recognition.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setInput((prev) => prev + text)
      inputRef.current?.focus()
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const FREE_ROUNDS = 3
  const userMsgCount = chatMessages.filter((m) => m.role === "user").length
  const reachedLimit = userMsgCount >= FREE_ROUNDS

  return (
    <div className="flex flex-col h-screen" style={{ background: "#F8F9FC" }}>
      {/* 顶栏 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 text-sm">←</button>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">AI 志愿师</div>
          <div className="text-xs text-gray-400">
            {userInfo?.province ?? "全国"}
            {result && ` · ${result.mbti_type} · ${topMajors[0] || ""}`}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          免费 {Math.min(userMsgCount, FREE_ROUNDS)}/{FREE_ROUNDS} 次
        </div>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎓</div>
            <p className="font-semibold text-gray-800 mb-1">你好！我是你的AI志愿师</p>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              基于你的测评结果，我可以帮你分析专业选择、院校志愿，用数据和张雪峰的视角给你最直接的建议。
            </p>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 mt-1">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
              }`}
            >
              {msg.content || (loading && i === chatMessages.length - 1 ? (
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </span>
              ) : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 快捷问题 */}
      {chatMessages.length === 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 付费提示 */}
      {reachedLimit && (
        <div className="mx-4 mb-2 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm font-medium text-indigo-800 mb-1">免费次数已用完</p>
          <p className="text-xs text-indigo-600 mb-2">开通会员，无限次AI咨询 + 完整院校方案</p>
          <button className="bg-indigo-600 text-white text-sm px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-all">
            开通会员 · ¥49
          </button>
        </div>
      )}

      {/* 输入框 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        {isListening && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="flex gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-red-400 animate-bounce"
                  style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </span>
            <span className="text-xs text-red-500 font-medium">正在聆听，说完后自动停止...</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder={reachedLimit ? "免费次数已用完，开通会员继续" : "问我任何志愿问题..."}
            disabled={reachedLimit || loading}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={toggleVoice}
            disabled={reachedLimit || loading}
            title={isListening ? "点击停止" : "语音输入"}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 border ${
              isListening
                ? "bg-red-50 border-red-300 text-red-500 animate-pulse"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || reachedLimit}
            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
