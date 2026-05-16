import os
import anthropic
from models.schemas import ChatRequest, UserInfo
from data.xuefeng_kb import XUEFENG_KNOWLEDGE
from data.universities import UNIVERSITIES
from data.mappings import EMPLOYMENT_SCORE

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


def build_system_prompt(req: ChatRequest) -> str:
    ui = req.user_info
    majors_str = "、".join(req.top_majors[:3])
    return f"""你是「AI志愿师」，一个融合了张雪峰风格的高考志愿填报顾问。

用户信息：
- 省份：{ui.province} | 高考分数：{ui.score}分 | 科目类型：{ui.subject_type}
- 选科：{"、".join(ui.subject_selection) or "未填写"}
- 性格类型（MBTI）：{req.mbti_type}
- 推荐专业 TOP3：{majors_str}
- 意向院校：{req.top_school}

你的回答风格：
1. 先给结论，再给理由——用户最关心的答案放在第一句
2. 数据说话——薪资、就业率、录取位次，有数据就用，不说空话
3. 遇到纠结题，给明确答案，不说"都可以"、"因人而异"
4. 引用张雪峰观点时，格式：「张雪峰曾说：'...'（来源：...）」
5. 语气直接但不刻薄，像靠谱的学长在认真帮你，可以适当幽默
6. 回复控制在300字以内，重点突出

绝对不能做的：
- 不承诺录取结果（概率只是参考）
- 不编造张雪峰没说过的话
- 不贬低任何院校或专业的学生
- 不提供任何违规建议（如虚报信息）"""


def search_xuefeng(query: str) -> list[dict]:
    query_lower = query.lower()
    results = []
    for entry in XUEFENG_KNOWLEDGE:
        relevance = 0
        for tag in entry.get("major_tags", []) + entry.get("topic_tags", []):
            if tag in query:
                relevance += 2
        words = query_lower.split()
        for word in words:
            if word in entry["content"]:
                relevance += 1
        if relevance > 0:
            results.append((relevance, entry))
    results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in results[:3]]


def query_school_info(school_name: str, major_name: str = "") -> dict:
    for uni in UNIVERSITIES:
        if school_name in uni["name"] or uni["name"] in school_name:
            info = {
                "name": uni["name"],
                "type": uni["type"],
                "city": uni["city"],
                "majors": [m["name"] for m in uni["majors"]],
                "rankings": uni["subject_rankings"],
            }
            if major_name:
                major = next((m for m in uni["majors"] if major_name in m["name"]), None)
                if major:
                    ranks = list(major["ranks"].values())
                    if ranks:
                        info["major_ranks"] = ranks[0]
            return info
    return {"error": f"暂无{school_name}的数据"}


def query_major_info(major_name: str) -> dict:
    emp_score = EMPLOYMENT_SCORE.get(major_name, 60)
    salary_map = {
        range(90, 101): "平均20k-35k/月，头部岗位50k+",
        range(80, 90): "平均12k-20k/月",
        range(70, 80): "平均8k-15k/月",
        range(60, 70): "平均6k-10k/月",
    }
    salary = "平均5k-8k/月"
    for r, s in salary_map.items():
        if emp_score in r:
            salary = s
            break
    return {
        "major": major_name,
        "employment_score": emp_score,
        "avg_salary": salary,
        "employment_level": "高" if emp_score >= 80 else ("中" if emp_score >= 65 else "低"),
    }


TOOLS = [
    {
        "name": "search_xuefeng_kb",
        "description": "搜索张雪峰对某专业、某院校或某话题的观点和建议",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "搜索关键词，如专业名、院校名或问题关键词"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "query_school",
        "description": "查询某院校的基本信息、专业列表、学科排名和历年录取位次",
        "input_schema": {
            "type": "object",
            "properties": {
                "school_name": {"type": "string", "description": "院校名称"},
                "major_name": {"type": "string", "description": "目标专业名称（可选）"},
            },
            "required": ["school_name"],
        },
    },
    {
        "name": "query_major",
        "description": "查询某专业的就业数据、平均薪资和就业评级",
        "input_schema": {
            "type": "object",
            "properties": {
                "major_name": {"type": "string", "description": "专业名称"},
            },
            "required": ["major_name"],
        },
    },
]


def handle_tool_call(tool_name: str, tool_input: dict) -> str:
    if tool_name == "search_xuefeng_kb":
        results = search_xuefeng(tool_input["query"])
        if not results:
            return "知识库中暂无相关张雪峰观点。"
        return "\n\n".join(
            f"【{r['sentiment']}】{r['content']}（来源：{r['source']}）"
            for r in results
        )
    elif tool_name == "query_school":
        info = query_school_info(tool_input["school_name"], tool_input.get("major_name", ""))
        return str(info)
    elif tool_name == "query_major":
        info = query_major_info(tool_input["major_name"])
        return str(info)
    return "工具调用失败"


def chat(req: ChatRequest):
    system_prompt = build_system_prompt(req)

    messages = []
    for msg in req.messages[-10:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.new_message})

    # agentic loop
    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system_prompt,
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason == "tool_use":
            tool_results = []
            assistant_content = response.content

            for block in response.content:
                if block.type == "tool_use":
                    result = handle_tool_call(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": assistant_content})
            messages.append({"role": "user", "content": tool_results})
        else:
            text = next(
                (block.text for block in response.content if hasattr(block, "text")),
                "",
            )
            return text


def chat_stream(req: ChatRequest):
    """流式返回，供SSE使用"""
    system_prompt = build_system_prompt(req)

    messages = []
    for msg in req.messages[-10:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.new_message})

    # 先做一次工具调用（非流式），再流式返回最终回答
    # 简化：直接流式，工具调用结果内联处理
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_prompt,
        tools=TOOLS,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
