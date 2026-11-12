import React, { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { getPlayerVideoGuideUrl, PLAYER_VIDEO_GUIDE } from "../../constants/videoGuide";

export default function VideoGuidePlayer() {
  const [missing, setMissing] = useState(false);
  const src = getPlayerVideoGuideUrl();

  if (!src || missing) {
    return null;
  }

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Typography variant="h6">Видеоинструкция</Typography>
      <Typography variant="body2" color="text.secondary">
        Рекомендуем посмотреть перед первой игрой.
        {PLAYER_VIDEO_GUIDE.duration ? ` (${PLAYER_VIDEO_GUIDE.duration})` : ""}
      </Typography>
      <Box
        component="video"
        controls
        playsInline
        preload="metadata"
        src={src}
        onError={() => setMissing(true)}
        sx={{
          width: "100%",
          maxHeight: 360,
          borderRadius: 1,
          bgcolor: "#000",
        }}
      >
        {PLAYER_VIDEO_GUIDE.title}
      </Box>
    </Stack>
  );
}
