"use client"
import { useRouter } from "next/navigation"

export default function SchoolsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "#F8F9FC" }}>
      <div className="text-center max-w-sm">
        {/* 图标 */}
        <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🏫</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">按分数填报志愿</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          我们正在接入全国 2000+ 高校的历年录取数据，为你提供精准的冲稳保志愿方案。
        </p>
        <p className="text-indigo-600 text-sm font-medium mb-8">预计近期上线，敬请期待！</p>

        {/* 功能预告 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 text-left space-y-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">即将上线功能</p>
          {[
            { icon: "📊", text: "基于历年录取数据的冲稳保分层" },
            { icon: "🎯", text: "结合你的专业偏好精准匹配院校" },
            { icon: "📈", text: "录取趋势分析 + 风险预警" },
            { icon: "🗺️", text: "覆盖全国所有省份志愿规则" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm text-gray-600">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <button
          onClick={() => router.push("/results/majors")}
          className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-2xl text-sm mb-3 shadow-lg"
        >
          返回专业推荐 →
        </button>
        <button
          onClick={() => router.push("/chat")}
          className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl text-sm"
        >
          💬 问问 AI 顾问择校建议
        </button>
      </div>
    </div>
  )
}
