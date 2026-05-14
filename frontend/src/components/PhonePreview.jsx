import { Heart, MessageCircle, Share2, Bookmark, Music, Plus } from "lucide-react";

export default function PhonePreview({ script, product, formatType }) {
  const currentScene = script?.scenes?.[0];
  const displayText = formatType === "text_on_screen"
    ? currentScene?.text_on_screen
    : currentScene?.voiceover;

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-text-muted mb-3 font-medium">TikTok Preview</p>
      <div
        className="relative overflow-hidden rounded-[2.5rem] border-4 border-[#2e2e2e] shadow-2xl"
        style={{ width: 260, height: 520, background: "#000" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

        {product?.image_url ? (
          <img src={product.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-pink-900/40" />
        )}

        {script ? (
          <>
            {displayText && (
              <div className="absolute inset-x-4 top-1/3 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                  <p className="text-white font-bold text-sm leading-snug">{displayText}</p>
                </div>
              </div>
            )}

            {!displayText && script.hook && (
              <div className="absolute inset-x-4 top-1/3 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                  <p className="text-white font-bold text-sm leading-snug">{script.hook}</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 p-4">
              <div className="flex items-end justify-between">
                <div className="flex-1 pr-4">
                  <p className="text-white font-semibold text-xs">@skincarevibes</p>
                  <p className="text-white/80 text-xs mt-1 line-clamp-2">{script.caption}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Music size={10} className="text-white/60" />
                    <p className="text-white/60 text-xs truncate">{script.music_vibe || "trending sound"}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-highlight border-2 border-white flex items-center justify-center">
                    <Plus size={14} className="text-white" />
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Heart size={20} className="text-white" />
                    <span className="text-white text-xs">12.4K</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <MessageCircle size={20} className="text-white" />
                    <span className="text-white text-xs">342</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Bookmark size={20} className="text-white" />
                    <span className="text-white text-xs">1.2K</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Share2 size={20} className="text-white" />
                    <span className="text-white text-xs">89</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-white/60 text-sm">Preview sẽ hiện ở đây sau khi tạo script</p>
          </div>
        )}

        <div className="absolute top-0 inset-x-0 h-6 bg-black flex items-center justify-center">
          <div className="w-16 h-1.5 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
