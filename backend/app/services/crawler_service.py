import httpx
import re
from typing import Optional


class CrawlerService:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; SkincareBot/1.0)"
        }

    async def crawl_product_info(self, name: str, brand: str) -> dict:
        """Search and extract product info. Returns whatever we can find."""
        result = {
            "name": name,
            "brand": brand,
            "description": None,
            "ingredients": [],
            "how_to_use": None,
            "image_url": None,
            "source_url": None,
        }

        # Try to get product info from a simple search
        # In production this would crawl actual sites
        # For now returns a structured placeholder
        search_query = f"{brand} {name} skincare ingredients"
        result["description"] = (
            f"{name} là sản phẩm skincare của {brand}. "
            "Thông tin chi tiết đang được cập nhật."
        )
        result["how_to_use"] = (
            "Vui lòng tham khảo hướng dẫn sử dụng trên bao bì sản phẩm."
        )

        return result


crawler_service = CrawlerService()
