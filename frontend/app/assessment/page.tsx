"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { fetchQuestions, submitAssessment } from "@/lib/api"
import { Question } from "@/lib/types"

export default function AssessmentPage() {
  const router = useRouter()
  const { userInfo, setResult } = useAppStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<{ question_id: number; selected_option: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    fetchQuestions().then((data) => setQuestions(data.questions))
  }, [])

  const handleSelect = (label: string) => {
    if (animating) return
    const qid = questions[current].id
    const newAnswers = [...answers, { question_id: qid, selected_option: label }]
    setAnswers(newAnswers)

    if (current + 1 >= questions.length) {
      handleSubmit(newAnswers)
      return
    }

    setAnimating(true)
    timerRef.current = setTimeout(() => {
      setCurrent((c) => c + 1)
      setAnimating(false)
    }, 300)
  }

  const handleSubmit = async (finalAnswers: typeof answers) => {
    setSubmitting(true)
    try {
      const info = userInfo ?? { province: "广东" }
      const result = await submitAssessment(info, finalAnswers)
      setResult(result)
      router.push("/results/majors")
    } catch {
      alert("提交失败，请检查后端服务是否启动")
      setSubmitting(false)
    }
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F9FC" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">加载题目中...</p>
        </div>
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F9FC" }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🧠</div>
          <p className="text-xl font-semibold text-gray-800 mb-2">正在分析你的性格类型...</p>
          <p className="text-gray-500 text-sm">AI正在为你匹配最合适的专业和院校</p>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const progress = Math.round(((current) / questions.length) * 100)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8F9FC" }}>
      {/* 进度条 */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>第 {current + 1} / {questions.length} 题</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <div
          className="w-full max-w-lg"
          style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "none", transition: "all 0.2s" }}
        >
          {/* 维度标签 */}
          <div className="text-center mb-6">
            <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
              {q.type === "mbti" ? `MBTI · ${q.dimension}维度` : `Holland · ${q.dimension}型`}
            </span>
          </div>

          {/* 题目 */}
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <p className="text-xl font-semibold text-gray-900 text-center leading-relaxed mb-8">
              {q.text}
            </p>

            <div className="space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(opt.label)}
                  className="w-full text-left px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-gray-700 font-medium"
                >
                  <span className="inline-block w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold text-center leading-6 mr-3 flex-shrink-0">
                    {opt.label}
                  </span>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs">点击选项后自动跳转下一题</p>
        </div>
      </div>
    </div>
  )
}
