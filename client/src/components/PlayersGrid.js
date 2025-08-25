import React from "react";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid2";
import { Box } from "@mui/material";
import PlayerCard from "./PlayerCard";

const PlayersGrid = observer(({ players }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        {players ? (
          players.map((player) => (
            <Grid size={4}>
              <PlayerCard key={player.user_id} player={player} />
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
