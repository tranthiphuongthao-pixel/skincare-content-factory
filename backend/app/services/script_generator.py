from sqlalchemy.orm import Session
from app.models.database import Script, Product
from app.services.gemini_service import GeminiService

gemini = GeminiService()


async def generate_and_save_script(
    product_id: int,
    format_type: str,
    topic_type: str,
    db: Session,
) -> Script:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product {product_id} not found")
    result = await gemini.generate_script(product, format_type, topic_type)
    script = Script(
        product_id=product_id,
        hook=result.get("hook"),
        scenes=result.get("scenes"),
        caption=result.get("caption"),
        hashtags=result.get("hashtags"),
        voiceover_text=result.get("voiceover_text"),
        music_vibe=result.get("music_vibe"),
        topic_type=topic_type,
        estimated_performance=result.get("estimated_performance"),
        ai_generated=True,
        status="draft",
    )
    db.add(script)
    db.commit()
    db.refresh(script)
    return script
