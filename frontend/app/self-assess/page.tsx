"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { submitSelfAssess } from "@/lib/api"

const INTEREST_GROUPS = [
  {
    label: "理工技术",
    color: "indigo",
    items: [
      { id: "coding", label: "💻 编程/计算机", holland: "I" },
      { id: "math", label: "📐 数学/统计", holland: "I" },
      { id: "electronics", label: "⚡ 电子/电气", holland: "R" },
      { id: "engineering", label: "🔧 机械/工程", holland: "R" },
    ],
  },
  {
    label: "生命医学",
    color: "green",
    items: [
      { id: "medicine", label: "🏥 医学/健康", holland: "I" },
      { id: "biology", label: "🧬 生物/化学", holland: "I" },
      { id: "environment", label: "🌱 环境/生态", holland: "R" },
    ],
  },
  {
    label: "人文社科",
    color: "amber",
    items: [
      { id: "law", label: "⚖️ 法律/政治", holland: "E" },
      { id: "economics", label: "📈 经济/商业", holland: "E" },
      { id: "psychology", label: "🧠 心理/教育", holland: "S" },
      { id: "history", label: "📚 历史/哲学", holland: "I" },
    ],
  },
  {
    label: "艺术创意",
    color: "rose",
    items: [
      { id: "design", label: "🎨 设计/美术", holland: "A" },
      { id: "music", label: "🎵 音乐/表演", holland: "A" },
      { id: "writing", label: "✍️ 写作/文学", holland: "A" },
      { id: "media", label: "📸 新媒体/传播", holland: "A" },
    ],
  },
  {
    label: "管理运营",
    color: "purple",
    items: [
      { id: "management", label: "👔 管理/领导", holland: "E" },
      { id: "finance", label: "💰 财务/会计", holland: "C" },
      { id: "sports", label: "⚽ 体育/运动", holland: "R" },
      { id: "agriculture", label: "🌾 农林/食品", holland: "R" },
    ],
  },
]

const PERSONALITY_TAGS = [
  { id: "extrovert", label: "🗣️ 喜欢与人交流", mbti: "E" },
  { id: "introvert", label: "📖 独立安静地思考", mbti: "I" },
  { id: "practical", label: "🔨 注重实际动手", mbti: "S" },
  { id: "creative", label: "💡 富有创意想象", mbti: "N" },
  { id: "logical", label: "🧩 理性逻辑分析", mbti: "T" },
  { id: "empathetic", label: "❤️ 感性关注他人", mbti: "F" },
  { id: "planned", label: "📅 喜欢计划安排", mbti: "J" },
  { id: "flexible", label: "🎲 随机应变灵活", mbti: "P" },
]

const COLOR_SCHEME: Record<string, string> = {
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  green: "bg-green-50 border-green-200 text-green-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  rose: "bg-rose-50 border-rose-200 text-rose-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
}
const ACTIVE_COLOR: Record<string, string> = {
  indigo: "bg-indigo-600 border-indigo-600 text-white",
  green: "bg-green-600 border-green-600 text-white",
  amber: "bg-amber-500 border-amber-500 text-white",
  rose: "bg-rose-500 border-rose-500 text-white",
  purple: "bg-purple-600 border-purple-600 text-white",
}

export default function SelfAssessPage() {
  const router = useRouter()
  const { setSelfAssessData, setResult } = useAppStore()

  const [interests, setInterests] = useState<string[]>([])
  const [personality, setPersonality] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }
  const togglePersonality = (id: string) => {
    const tag = PERSONALITY_TAGS.find((t) => t.id === id)
    if (!tag) return
    const opposite: Record<string, string> = {
      extrovert: "introvert", introvert: "extrovert",
      practical: "creative", creative: "practical",
      logical: "empathetic", empathetic: "logical",
      planned: "flexible", flexible: "planned",
    }
    const opp = opposite[id]
    setPersonality((prev) => {
      const filtered = opp ? prev.filter((x) => x !== opp) : prev
      return filtered.includes(id) ? filtered.filter((x) => x !== id) : [...filtered, id]
    })
  }

  const canSubmit = interests.length >= 2 && personality.length >= 2

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError("")
    try {
      const interestTags = interests.map((id) => {
        for (const g of INTEREST_GROUPS) {
          const found = g.items.find((it) => it.id === id)
          if (found) return found.label.replace(/^.+?\s/, "")
        }
        return id
      })
      const personalityTags = personality.map((id) => {
        const t = PERSONALITY_TAGS.find((p) => p.id === id)
        return t ? t.label.replace(/^.+?\s/, "") : id
      })

      setSelfAssessData({ interests: interestTags, personality: personalityTags, province: "广东" })

      const hollandMap: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
      for (const id of interests) {
        for (const g of INTEREST_GROUPS) {
          const found = g.items.find((it) => it.id === id)
          if (found) hollandMap[found.holland] = (hollandMap[found.holland] || 0) + 1
        }
      }
      const mbtiMap: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
      for (const id of personality) {
        const t = PERSONALITY_TAGS.find((p) => p.id === id)
        if (t) mbtiMap[t.mbti] = (mbtiMap[t.mbti] || 0) + 1
      }

      const result = await submitSelfAssess({
        province: "广东",
        interests: interestTags,
        personality: personalityTags,
        holland_scores: hollandMap,
        mbti_scores: mbtiMap,
      })
      setResult(result)
      router.push("/results/majors")
    } catch {
      setError("提交失败，请检查后端服务是否启动")
      setSubmitting(false)
    }
  }

  const goToTest = () => {
    setSelfAssessData({ interests: [], personality: [], province: "广东" })
    router.push("/assessment")
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F9FC" }}>
        <div className="text-center px-6">
          <div className="text-6xl mb-5">🤖</div>
          <p className="text-xl font-bold text-gray-900 mb-2">AI 正在分析你的特点...</p>
          <p className="text-gray-500 text-sm">结合兴趣、性格，为你匹配最合适的专业</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-40" style={{ background: "#F8F9FC" }}>
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-lg">←</button>
          <div>
            <h1 className="text-base font-bold text-gray-900">了解自己</h1>
            <p className="text-xs text-gray-400">选择兴趣和性格，让 AI 为你推荐专业</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        {/* AI 测评入口 — 主要入口 */}
        <button
          onClick={goToTest}
          className="w-full rounded-2xl p-5 text-left shadow-lg transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🧠</span>
                <span className="text-white font-bold text-lg">参加 40 题精准测评</span>
              </div>
              <p className="text-indigo-200 text-sm leading-relaxed">
                MBTI + Holland 双维度科学分析<br />
                比自己填写更精准，推荐更准确
              </p>
            </div>
            <span className="text-white/60 text-xl ml-2 mt-1">→</span>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {["MBTI测评", "Holland测试", "AI精准匹配"].map((tag) => (
              <span key={tag} className="text-xs text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* 分割线 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 flex-shrink-0">或者自己快速填写</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 兴趣爱好 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">🌟 兴趣爱好</h2>
              <p className="text-xs text-gray-400 mt-0.5">选2个以上你感兴趣的方向</p>
            </div>
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
              已选 {interests.length}
            </span>
          </div>

          {INTEREST_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">{group.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                      interests.includes(item.id)
                        ? ACTIVE_COLOR[group.color]
                        : COLOR_SCHEME[group.color]
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 性格特点 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">🧠 性格特点</h2>
              <p className="text-xs text-gray-400 mt-0.5">每组选一个更符合你的描述</p>
            </div>
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
              已选 {personality.length}
            </span>
          </div>

          {[
            [PERSONALITY_TAGS[0], PERSONALITY_TAGS[1]],
            [PERSONALITY_TAGS[2], PERSONALITY_TAGS[3]],
            [PERSONALITY_TAGS[4], PERSONALITY_TAGS[5]],
            [PERSONALITY_TAGS[6], PERSONALITY_TAGS[7]],
          ].map((pair, pi) => (
            <div key={pi} className="grid grid-cols-2 gap-2 mb-2">
              {pair.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => togglePersonality(tag.id)}
                  className={`px-3 py-3 rounded-xl text-xs font-medium border-2 transition-all text-left ${
                    personality.includes(tag.id)
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-center text-red-500 text-sm bg-red-50 rounded-xl py-3 px-4">{error}</p>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg disabled:shadow-none"
          >
            {canSubmit
              ? "AI 为我推荐专业 →"
              : `还需选择 ${Math.max(0, 2 - interests.length)} 个兴趣、${Math.max(0, 2 - personality.length)} 个性格特征`}
          </button>
          <p className="text-center text-gray-400 text-xs mt-3">
            已选 {interests.length} 个兴趣 · {personality.length} 个性格描述
          </p>
        </div>
      </div>
    </div>
  )
}
