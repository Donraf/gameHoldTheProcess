import React from "react";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid2";
import { Box } from "@mui/material";
import PlayerCard from "./PlayerCard";

const PlayersGrid = observer(({ players }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        {players && players.length > 0 ? (
          players.map((player) => (
            <Grid key={player.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <PlayerCard player={player} />
            </Grid>
          ))
        ) : (
          <>Нет пользователей</>
        )}
      </Grid>
    </Box>
  );
});

export default PlayersGrid;
