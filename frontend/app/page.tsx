"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function HomePage() {
  const router = useRouter()
  const [showComingSoon, setShowComingSoon] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #EEF2FF 0%, #F8F9FC 60%)" }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-indigo-200"
          style={{ background: "rgba(238,242,255,0.9)" }}>
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse inline-block" />
          AI 驱动 · 张雪峰风格顾问 · 免费体验
        </div>

        <h1 className="text-4xl font-black text-gray-900 text-center mb-3 leading-tight">
          AI <span className="text-indigo-600">志愿师</span>
        </h1>
        <p className="text-gray-500 text-center text-base max-w-xs leading-relaxed mb-12">
          根据你的兴趣和性格，找到最适合你的专业方向
        </p>

        {/* 两个主入口 */}
        <div className="w-full max-w-sm space-y-4">
          {/* 主功能：探索专业 */}
          <button
            onClick={() => router.push("/self-assess")}
            className="w-full rounded-2xl p-5 text-left shadow-lg transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <span className="text-white font-bold text-lg">探索适合我的专业</span>
                </div>
                <p className="text-indigo-200 text-sm leading-relaxed">
                  评估兴趣爱好 + 性格特点<br />
                  AI 为你量身推荐专业方向
                </p>
              </div>
              <span className="text-white/60 text-xl ml-2 mt-1">→</span>
            </div>
            <div className="mt-4 flex gap-2">
              {["兴趣自评", "MBTI测评", "专业推荐"].map((tag) => (
                <span key={tag} className="text-xs text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* 次功能：按分数填报（敬请期待） */}
          <button
            onClick={() => setShowComingSoon(true)}
            className="w-full rounded-2xl p-5 text-left border-2 border-dashed border-gray-200 bg-white/70 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📊</span>
                  <div>
                    <span className="text-gray-700 font-bold text-base">按分数填报志愿</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">即将上线</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  输入分数 · 智能推荐冲稳保院校<br />
                  覆盖全国2000+高校数据
                </p>
              </div>
              <span className="text-gray-300 text-xl ml-2 mt-1">→</span>
            </div>
          </button>
        </div>

        {/* AI 顾问入口 */}
        <button
          onClick={() => router.push("/chat")}
          className="mt-8 flex items-center gap-2 text-indigo-600 text-sm font-medium px-5 py-2.5 rounded-xl border border-indigo-200 bg-white/80 hover:bg-indigo-50 transition-all"
        >
          <span>💬</span>
          有问题？问问 AI 顾问
          <span className="text-indigo-300">→</span>
        </button>

        <p className="text-gray-400 text-xs mt-8 text-center">
          已帮助 10,000+ 考生找到心仪专业
        </p>
      </div>

      {/* 敬请期待弹窗 */}
      {showComingSoon && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl px-6 py-8 pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🚧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">功能开发中</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                「按分数填报志愿」正在接入全国高校录取数据库，敬请期待！
              </p>
              <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl px-4 py-3 mb-6">
                💡 现在可以先用「探索适合我的专业」了解自己的方向
              </p>
              <button
                onClick={() => { setShowComingSoon(false); router.push("/self-assess") }}
                className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl text-sm mb-3"
              >
                去探索适合我的专业 →
              </button>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full text-gray-400 text-sm py-2"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
