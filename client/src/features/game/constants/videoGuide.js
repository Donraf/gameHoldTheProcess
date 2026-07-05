/**
 * Видеоинструкция: файл client/public/media/player-guide.mp4,
 * раздаётся вместе со сборкой React по /media/player-guide.mp4
 */
export const PLAYER_VIDEO_GUIDE = {
  title: "Как играть: тренировка, сигнал ИИ и очки",
  duration: "~4 мин",
  filename: "player-guide.mp4",
};

export function getPlayerVideoGuideUrl() {
  const publicUrl = process.env.PUBLIC_URL || "";
  return `${publicUrl}/media/${PLAYER_VIDEO_GUIDE.filename}`;
}
