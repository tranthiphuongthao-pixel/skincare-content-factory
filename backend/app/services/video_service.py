import os
from typing import Optional


class VideoService:
    """Video processing service. Requires ffmpeg in environment."""

    def get_video_info(self, file_path: str) -> dict:
        """Get video metadata."""
        return {
            "duration": 0,
            "width": 1080,
            "height": 1920,
            "size": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        }

    def generate_thumbnail(self, video_path: str, output_path: str) -> Optional[str]:
        """Extract thumbnail from video at 2 seconds."""
        try:
            import subprocess

            cmd = [
                "ffmpeg",
                "-i",
                video_path,
                "-ss",
                "00:00:02",
                "-vframes",
                "1",
                "-vf",
                "scale=720:1280",
                "-y",
                output_path,
            ]
            subprocess.run(cmd, capture_output=True, timeout=30)
            return output_path if os.path.exists(output_path) else None
        except Exception:
            return None


video_service = VideoService()
