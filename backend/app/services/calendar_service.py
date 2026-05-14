from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.database import ContentCalendar, Script, Product
from app.services.gemini_service import GeminiService

gemini = GeminiService()

TIME_SLOTS = {
    "11:00": "morning",
    "19:00": "afternoon",
    "21:00": "evening",
}


async def generate_and_save_calendar(
    product_ids: list,
    month: int,
    year: int,
    db: Session,
) -> list:
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    result = await gemini.generate_monthly_calendar(products, month, year)
    calendar_items = result.get("calendar", [])
    saved_entries = []
    for item in calendar_items:
        try:
            date = datetime.strptime(item["date"], "%Y-%m-%d")
            time_parts = item.get("time_slot", "19:00").split(":")
            scheduled = date.replace(hour=int(time_parts[0]), minute=int(time_parts[1]))
            entry = ContentCalendar(
                scheduled_date=scheduled,
                time_slot=TIME_SLOTS.get(item.get("time_slot", "19:00"), "evening"),
                platform="tiktok",
                status="planned",
            )
            db.add(entry)
            db.flush()
            saved_entries.append(entry)
        except (ValueError, KeyError):
            continue
    db.commit()
    return saved_entries


def get_golden_hours(date: datetime) -> list:
    return [
        date.replace(hour=11, minute=0),
        date.replace(hour=19, minute=0),
        date.replace(hour=21, minute=0),
    ]
