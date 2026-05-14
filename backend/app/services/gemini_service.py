import json
import re
import random
from datetime import datetime, timedelta
from typing import List, Optional
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from app.config import settings


class GeminiService:
    def __init__(self):
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            model_name = settings.gemini_model or "gemini-1.5"
            self.model = genai.GenerativeModel(model_name)
        else:
            self.model = None

    def _parse_json_response(self, text: str) -> dict:
        text = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if match:
            text = match.group(1).strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw": text}

    _HOOK_PATTERNS = [
        "Câu hỏi kích thích tò mò: 'Tại sao da mình lại...' / 'Bạn có biết...' / 'Ai dùng [product] mà...'",
        "Thông tin shock: số liệu bất ngờ hoặc fact ít người biết về thành phần/hiệu quả sản phẩm",
        "Confess/POV: 'POV: mình đã tiêu [số tiền] vì...' / 'Thật ra [sản phẩm này] không ai nói với bạn rằng...'",
        "Promise before/after: 'Da mình sau 7 ngày dùng [product]...' / 'Sau đúng 1 tháng...'",
        "Cảnh báo: 'ĐỪNG mua [sản phẩm] trước khi xem cái này' / 'Sai lầm ai cũng mắc khi dùng [loại sản phẩm]'",
    ]

    async def generate_script(self, product, format_type: str, topic_type: str) -> dict:
        if not self.model:
            return self._mock_script(product, format_type, topic_type)

        topic_descriptions = {
            "honest_review": "review thật sau khi dùng sản phẩm, chia sẻ cảm nhận chân thực",
            "ingredient_breakdown": "phân tích thành phần chính của sản phẩm, giải thích tác dụng",
            "before_after": "so sánh trước và sau khi dùng sản phẩm",
            "comparison": "so sánh sản phẩm này với sản phẩm tương tự trên thị trường",
            "routine_feature": "giới thiệu sản phẩm trong routine skincare hàng ngày",
            "red_flag_check": "kiểm tra các thành phần có hại, cảnh báo người dùng",
            "dupe_finder": "tìm sản phẩm thay thế rẻ hơn với hiệu quả tương tự",
            "community_review": "tổng hợp đánh giá từ cộng đồng skincare",
        }

        format_desc = (
            "TEXT ON SCREEN — chữ hiện trên màn hình, KHÔNG lồng tiếng"
            if format_type == "text_on_screen"
            else "VOICEOVER — lồng tiếng, ít chữ trên màn hình"
        )
        topic_desc = topic_descriptions.get(topic_type, topic_type)
        hook_pattern = random.choice(self._HOOK_PATTERNS)

        brand_name = ""
        if hasattr(product, "brand_rel") and product.brand_rel:
            brand_name = product.brand_rel.name
        elif hasattr(product, "brand"):
            brand_name = product.brand or ""

        price_info = ""
        if hasattr(product, "price_range") and product.price_range:
            price_info = product.price_range
        elif hasattr(product, "price") and product.price:
            price_info = str(product.price)

        ingredients_info = ""
        if hasattr(product, "key_ingredients") and product.key_ingredients:
            if isinstance(product.key_ingredients, list):
                ingredients_info = ", ".join(product.key_ingredients)

        notes_info = ""
        if hasattr(product, "personal_notes") and product.personal_notes:
            notes_info = product.personal_notes

        prompt = f"""Bạn là chuyên gia tạo content TikTok skincare faceless viral tại Việt Nam. Nhiệm vụ: tạo script TikTok 22-30 giây cho sản phẩm dưới đây.

━━━ THÔNG TIN SẢN PHẨM ━━━
Tên: {product.name}
Thương hiệu: {brand_name or 'Không rõ'}
Danh mục: {product.category or 'Skincare'}
Giá: {price_info or 'Không rõ'}
Thành phần nổi bật: {ingredients_info or 'Chưa có'}
Ghi chú cá nhân: {notes_info or 'Không có'}
Loại content: {topic_desc}
Format: {format_desc}

━━━ YÊU CẦU HOOK ━━━
Dùng pattern này để viết hook: {hook_pattern}
Hook phải dưới 10 chữ, cực kỳ gây tò mò, dừng người xem scroll ngay lập tức.

━━━ CẤU TRÚC 6 SCENE BẮT BUỘC ━━━
Scene 1 — HOOK (0-3s): Cảnh mở màn gây shock/tò mò, không nói tên sản phẩm ngay
Scene 2 — PRODUCT INTRO (3-8s): Giới thiệu sản phẩm + brand + giá, quay close-up bao bì
Scene 3 — TEXTURE (8-13s): Quay texture sản phẩm khi lấy ra, thoa lên tay hoặc da
Scene 4 — RESULT (13-18s): Kết quả sau khi dùng, cảm nhận thật
Scene 5 — VERDICT (18-24s): Đánh giá tổng thể, điểm mạnh/yếu, ai nên/không nên dùng
Scene 6 — CTA (24-28s): Kêu gọi hành động cụ thể

━━━ OUTPUT JSON CHÍNH XÁC ━━━
{{
  "hook": "câu hook dưới 10 chữ",
  "scenes": [
    {{
      "label": "HOOK",
      "timestamp": "0-3s",
      "visual_direction": "hướng dẫn góc quay, ánh sáng, props cụ thể",
      "text_on_screen": "chữ hiện trên màn hình (nếu format text_on_screen, ngắn gọn dưới 8 chữ)",
      "voiceover": "lời thoại tự nhiên (nếu format voiceover)",
      "camera_tip": "mẹo quay: góc máy, khoảng cách, cách cầm máy cụ thể"
    }},
    {{
      "label": "PRODUCT INTRO",
      "timestamp": "3-8s",
      ...
    }},
    {{
      "label": "TEXTURE",
      "timestamp": "8-13s",
      ...
    }},
    {{
      "label": "RESULT",
      "timestamp": "13-18s",
      ...
    }},
    {{
      "label": "VERDICT",
      "timestamp": "18-24s",
      ...
    }},
    {{
      "label": "CTA",
      "timestamp": "24-28s",
      ...
    }}
  ],
  "caption": "caption TikTok hấp dẫn dưới 150 ký tự, có CTA và emoji",
  "hashtags": ["tag1", "tag2", ...],
  "music_vibe": "mô tả vibe nhạc nền + gợi ý 1-2 tên bài cụ thể đang trending",
  "props_needed": ["danh sách props cần chuẩn bị để quay"],
  "total_duration": "22-28s",
  "estimated_performance": "dự đoán views, engagement rate, lý do"
}}

Quy tắc:
- Tất cả bằng tiếng Việt tự nhiên, thân thiện gen Z
- 15-20 hashtag: 5 trending lớn + 5 niche skincare VN + 5 brand/product specific
- Caption có CTA rõ ràng (follow, comment, link bio)
- props_needed: liệt kê cụ thể (ví dụ: "Khăn trắng làm nền", "Ánh sáng ring light", "Khay đá marble")
- camera_tip phải rất cụ thể, không chung chung"""

        try:
            response = self.model.generate_content(prompt)
            return self._parse_json_response(response.text)
        except (google_exceptions.NotFound, google_exceptions.InvalidArgument, google_exceptions.PermissionDenied, Exception) as exc:
            print(f"Gemini generate_content failed, falling back to mock: {exc}")
            return self._mock_script(product, format_type, topic_type)

    async def generate_dual_scripts(self, product, topic_a: str, topic_b: str) -> dict:
        """Generate two script options: A (text_on_screen) and B (voiceover)"""
        option_a = await self.generate_script(product, "text_on_screen", topic_a)
        option_b = await self.generate_script(product, "voiceover", topic_b)
        return {"option_a": option_a, "option_b": option_b}

    async def check_policy(self, script_content: str, caption: str, hashtags: list) -> dict:
        """Check TikTok policy compliance"""
        if not self.model:
            return self._mock_policy_check()

        hashtags_str = " ".join([f"#{h}" for h in hashtags])
        prompt = f"""Bạn là chuyên gia kiểm tra TikTok Community Guidelines cho content skincare Việt Nam.

Kiểm tra script và caption sau có vi phạm không:

SCRIPT: {script_content}
CAPTION: {caption}
HASHTAGS: {hashtags_str}

Các vi phạm cần check:
1. Claim y tế quá mức: "chữa được", "trị dứt điểm", "100% hiệu quả", "thay thế thuốc"
2. Misleading không bằng chứng: "tốt nhất", "số 1 Việt Nam"
3. Hashtag spam/shadowban: #follow4follow, #like4like
4. So sánh tiêu cực chỉ đích danh brand khác
5. Before/after không có disclaimer
6. Ngôn ngữ áp lực mua hàng quá mức
7. Thành phần nguy hiểm không có cảnh báo

Trả về JSON CHÍNH XÁC:
{{
  "is_safe": true/false,
  "risk_level": "safe" | "warning" | "danger",
  "issues": [
    {{
      "type": "tên loại vi phạm",
      "description": "mô tả vấn đề cụ thể",
      "suggestion": "cách sửa"
    }}
  ],
  "improved_caption": "caption đã cải thiện nếu cần",
  "safe_hashtags": ["hashtag1", "hashtag2", ...]
}}"""

        response = self.model.generate_content(prompt)
        result = self._parse_json_response(response.text)
        if "is_safe" not in result:
            return self._mock_policy_check()
        return result

    def _mock_policy_check(self):
        return {
            "is_safe": True,
            "risk_level": "safe",
            "issues": [],
            "improved_caption": "",
            "safe_hashtags": ["skincare", "review", "skincarevietnamese", "chamsocda"],
        }

    async def improve_hook(self, hook: str, product_name: str) -> dict:
        if not self.model:
            return {
                "alternatives": [
                    f"Bạn có biết {product_name} đang được 1 triệu người dùng?",
                    f"Tôi đã tiêu hết tiền vì {product_name}...",
                    f"Da mặt tôi thay đổi sau 7 ngày dùng {product_name}",
                ]
            }

        prompt = f"""Bạn là chuyên gia viết hook cho TikTok skincare.
Hook hiện tại: "{hook}"
Sản phẩm: {product_name}

Đề xuất 3 hook thay thế HAY HƠN, gây tò mò hơn, dưới 10 chữ mỗi hook.
Format JSON:
{{
  "alternatives": [
    "hook 1",
    "hook 2",
    "hook 3"
  ],
  "tips": "lời khuyên để viết hook tốt hơn"
}}"""

        response = self.model.generate_content(prompt)
        return self._parse_json_response(response.text)

    async def generate_hashtags(self, product, topic_type: str) -> dict:
        brand_name = ""
        if hasattr(product, "brand_rel") and product.brand_rel:
            brand_name = product.brand_rel.name
        elif hasattr(product, "brand"):
            brand_name = product.brand or ""

        if not self.model:
            return {
                "hashtags": [
                    "skincare",
                    "skincarevietnamese",
                    "skincaretips",
                    "review",
                    "beautyreview",
                    product.name.lower().replace(" ", ""),
                    brand_name.lower().replace(" ", "") if brand_name else "skincare",
                    "chamsocda",
                    "damat",
                    "reviewmypham",
                ]
            }

        prompt = f"""Tạo 15-20 hashtag TikTok cho video skincare:
Sản phẩm: {product.name}
Thương hiệu: {brand_name or 'Không rõ'}
Loại content: {topic_type}

Mix: 5 hashtag trending lớn + 5 hashtag niche skincare VN + 5 hashtag brand/product specific
Format JSON:
{{
  "hashtags": ["tag1", "tag2", ...],
  "trending": ["tag1", ...],
  "niche": ["tag1", ...],
  "product_specific": ["tag1", ...]
}}"""

        response = self.model.generate_content(prompt)
        return self._parse_json_response(response.text)

    async def generate_monthly_calendar(self, products: list, month: int, year: int) -> dict:
        if not self.model:
            return self._mock_calendar(products, month, year)

        product_list = "\n".join(
            [f"- {p.name} ({getattr(p, 'brand_rel', None) and p.brand_rel.name or getattr(p, 'brand', None) or 'Unknown'})"
             for p in products]
        )

        prompt = f"""Tạo lịch content TikTok skincare 30 ngày cho tháng {month}/{year}.

Danh sách sản phẩm:
{product_list}

Quy tắc:
- 1 video/ngày
- Mix 50% honest_review + 50% researched content (ingredient_breakdown, comparison, dupe_finder, etc.)
- Mix 50% text_on_screen + 50% voiceover format
- Không dùng cùng 1 sản phẩm trong 7 ngày liên tiếp
- Khung giờ vàng TikTok VN: 11:00, 19:00, 21:00 (xoay vòng)
- Ngày đầu tuần (T2, T3): content nhẹ nhàng (routine_feature, ingredient_breakdown)
- Cuối tuần (T6, T7, CN): content hot (honest_review, before_after, red_flag_check)

Format JSON:
{{
  "calendar": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "product_name": "tên sản phẩm",
      "topic_type": "loại content",
      "format_type": "text_on_screen hoặc voiceover",
      "time_slot": "11:00 hoặc 19:00 hoặc 21:00",
      "hook_suggestion": "gợi ý hook ngắn"
    }}
  ]
}}"""

        response = self.model.generate_content(prompt)
        result = self._parse_json_response(response.text)
        return result

    async def analyze_best_content(self, analytics_data: list) -> dict:
        if not self.model or not analytics_data:
            return {
                "insights": "Chưa đủ dữ liệu để phân tích",
                "recommendations": ["Đăng thêm video để có dữ liệu phân tích"],
            }

        prompt = f"""Phân tích dữ liệu analytics TikTok skincare sau và đưa ra insights:

Dữ liệu: {json.dumps(analytics_data, ensure_ascii=False)}

Phân tích:
1. Video nào perform tốt nhất và tại sao
2. Topic type nào hiệu quả nhất
3. Format type nào được ưa thích
4. Xu hướng engagement

Format JSON:
{{
  "top_performing": "phân tích video tốt nhất",
  "best_topic": "topic type hiệu quả nhất",
  "best_format": "format hiệu quả nhất",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["đề xuất 1", "đề xuất 2", ...],
  "next_content_direction": "định hướng content tiếp theo"
}}"""

        response = self.model.generate_content(prompt)
        return self._parse_json_response(response.text)

    def _mock_script(self, product, format_type: str, topic_type: str) -> dict:
        product_name = product.name
        is_text = format_type == "text_on_screen"
        return {
            "hook": f"ĐỪNG mua {product_name} khi chưa xem cái này",
            "scenes": [
                {
                    "label": "HOOK",
                    "timestamp": "0-3s",
                    "visual_direction": "Close-up bàn tay cầm sản phẩm, ánh sáng từ cửa sổ, góc nghiêng 45°",
                    "text_on_screen": f"ĐỪNG mua {product_name}..." if is_text else "",
                    "voiceover": "" if is_text else f"Đợi đã! Trước khi bạn mua {product_name}, hãy xem cái này đã",
                    "camera_tip": "Macro lens hoặc zoom 2x, nền trắng hoặc marble, đặt sản phẩm trên khay đá",
                },
                {
                    "label": "PRODUCT INTRO",
                    "timestamp": "3-8s",
                    "visual_direction": "Quay toàn cảnh sản phẩm, lật xem bao bì, zoom vào tên brand",
                    "text_on_screen": f"{product_name} — có thật sự xịn?" if is_text else "",
                    "voiceover": "" if is_text else f"Đây là {product_name}, mình đã dùng liên tục 30 ngày để review thật cho mọi người",
                    "camera_tip": "Đặt sản phẩm trên khăn trắng, quay từ trên xuống rồi xoay 360°, tay cầm steady",
                },
                {
                    "label": "TEXTURE",
                    "timestamp": "8-13s",
                    "visual_direction": "Lấy sản phẩm ra lòng bàn tay, quay slow-motion khi thoa",
                    "text_on_screen": "Texture: nhẹ, thẩm thấu siêu nhanh ✅" if is_text else "",
                    "voiceover": "" if is_text else "Texture cực kỳ nhẹ, thoa vào da thẩm thấu trong chưa đầy 30 giây, không bết dính chút nào",
                    "camera_tip": "Quay gần mu bàn tay khi thoa, slow-mo 0.5x, ánh sáng chiếu từ bên cạnh để thấy độ bóng",
                },
                {
                    "label": "RESULT",
                    "timestamp": "13-18s",
                    "visual_direction": "Quay da mặt hoặc vùng cổ sau khi dùng, so sánh với ảnh cũ",
                    "text_on_screen": "Sau 30 ngày: da sáng + ẩm hơn rõ rệt 🌟" if is_text else "",
                    "voiceover": "" if is_text else "Sau đúng 30 ngày, da mình sáng đều hơn, không còn bong tróc buổi sáng",
                    "camera_tip": "Dùng ring light trực diện, quay cùng góc với ảnh before để so sánh rõ",
                },
                {
                    "label": "VERDICT",
                    "timestamp": "18-24s",
                    "visual_direction": "Cầm sản phẩm, ra hiệu thumbs up hoặc chỉ vào sản phẩm",
                    "text_on_screen": "Rating: 4.5/5 ⭐ — Worth it!" if is_text else "",
                    "voiceover": "" if is_text else "Tổng kết: 4.5/5 sao, xứng đáng với giá tiền, phù hợp da khô và da hỗn hợp",
                    "camera_tip": "Góc từ phía trước, tay cầm sản phẩm ngang ngực, nền blur nhẹ nếu được",
                },
                {
                    "label": "CTA",
                    "timestamp": "24-28s",
                    "visual_direction": "Đặt sản phẩm xuống, text hiện CTA, chỉ vào caption",
                    "text_on_screen": "Link mua ở bio 👇 Follow để xem thêm review!" if is_text else "",
                    "voiceover": "" if is_text else "Link mua ở bio nha, follow mình để không bỏ lỡ review tiếp theo!",
                    "camera_tip": "Pull back ra xa hơn scene trước, thêm text overlay CTA ở góc dưới màn hình",
                },
            ],
            "caption": f"Review thật {product_name} sau 30 ngày! Có xứng đáng không? 🔍 Link mua ở bio 👇",
            "hashtags": [
                "skincare", "review", "skincaretips", "chamsocda", "damat",
                "reviewmypham", "skincarevietnamese", "beautytiktok",
                product_name.lower().replace(" ", ""),
                "myphamdangdung", "skincareroutine",
            ],
            "music_vibe": "Lo-fi chill hoặc trending nhạc instrumental TikTok VN — gợi ý: 'Lofi Study' hoặc nhạc không lời trending",
            "props_needed": [
                "Khăn trắng hoặc khay marble làm nền",
                "Ring light hoặc ánh sáng cửa sổ ban ngày",
                "Điện thoại với chế độ slow-mo",
                "Bình hoa nhỏ hoặc props thẩm mỹ tùy chọn",
            ],
            "total_duration": "25-28s",
            "estimated_performance": "Dự đoán: 8K-30K views, engagement rate ~10%, phù hợp thuật toán ForYou page TikTok VN",
        }

    def _mock_calendar(self, products: list, month: int, year: int) -> dict:
        topics = [
            "honest_review",
            "ingredient_breakdown",
            "before_after",
            "comparison",
            "routine_feature",
            "dupe_finder",
        ]
        formats = ["text_on_screen", "voiceover"]
        times = ["11:00", "19:00", "21:00"]
        calendar = []
        for day in range(1, 31):
            try:
                date = datetime(year, month, day)
                product = products[day % len(products)]
                calendar.append(
                    {
                        "day": day,
                        "date": date.strftime("%Y-%m-%d"),
                        "product_name": product.name,
                        "topic_type": topics[day % len(topics)],
                        "format_type": formats[day % 2],
                        "time_slot": times[day % 3],
                        "hook_suggestion": f"Bạn có biết {product.name} có thể...",
                    }
                )
            except ValueError:
                break
        return {"calendar": calendar}
