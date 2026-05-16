"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { MajorCard } from "@/lib/types"

const HOLLAND_DESC: Record<string, string> = {
  R: "实际型", I: "研究型", A: "艺术型", S: "社会型", E: "企业型", C: "常规型",
}

function MajorCardItem({ major, rank }: { major: MajorCard; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const empColor = major.employment_rating === "高"
    ? "bg-green-100 text-green-700"
    : major.employment_rating === "中"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-red-100 text-red-700"

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0">
              {rank}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">{major.name}</h3>
                {major.has_xuefeng && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">张</span>
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${empColor}`}>
                就业{major.employment_rating}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-indigo-600">{major.score.toFixed(0)}<span className="text-xs text-gray-400 font-normal">分</span></div>
            <div className="text-xs text-gray-500">{major.avg_salary}</div>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{major.fit_reason}</p>

        {major.caution && (
          <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-2">
            ⚠️ {major.caution}
          </p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-indigo-500 font-medium"
        >
          {expanded ? "收起 ▲" : "查看详情 ▼"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">MBTI匹配</div>
              <div className="text-sm font-bold text-gray-800">{major.mbti_match.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Holland匹配</div>
              <div className="text-sm font-bold text-gray-800">{major.holland_match.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">就业前景</div>
              <div className="text-sm font-bold text-gray-800">{major.employment_score.toFixed(0)}分</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MajorsPage() {
  const router = useRouter()
  const { result, userInfo } = useAppStore()

  useEffect(() => {
    if (!result) router.replace("/")
  }, [result, router])

  if (!result) return null

  const FREE_LIMIT = 3
  const majors = result.recommended_majors

  return (
    <div className="min-h-screen pb-24" style={{ background: "#F8F9FC" }}>
      {/* 顶部 */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.back()} className="text-sm text-gray-500 mb-3">← 返回</button>
          <h1 className="text-xl font-bold text-gray-900 mb-3">专业推荐</h1>

          {/* MBTI 标签 */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
              <span className="text-base">🧠</span>
              {result.mbti_type}
              <span className="text-indigo-200 text-xs ml-1 font-normal">{result.mbti_desc.slice(0, 10)}...</span>
            </div>
            {result.holland_top2.map((dim) => (
              <div key={dim} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-2 rounded-xl text-sm font-medium border border-amber-200">
                {HOLLAND_DESC[dim] || dim}型
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 专业列表 */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {majors.slice(0, FREE_LIMIT).map((m, i) => (
          <MajorCardItem key={m.name} major={m} rank={i + 1} />
        ))}

        {/* 付费墙 */}
        {majors.length > FREE_LIMIT && (
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-sm bg-white/60 rounded-2xl z-10 flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="font-bold text-gray-800 mb-1">解锁完整推荐</p>
              <p className="text-sm text-gray-500 mb-4">还有 {majors.length - FREE_LIMIT} 个专业推荐 + 完整院校方案</p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:bg-indigo-700 transition-all">
                开通会员 · ¥49
              </button>
            </div>
            <div className="opacity-30 pointer-events-none space-y-4">
              {majors.slice(FREE_LIMIT).map((m, i) => (
                <MajorCardItem key={m.name} major={m} rank={i + FREE_LIMIT + 1} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4 fixed-bottom-safe">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/results/schools")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
          >
            去选院校 →
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl border border-gray-200 transition-all text-sm"
          >
            问问AI顾问
          </button>
        </div>
      </div>
    </div>
  )
}
