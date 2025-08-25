import { Box, Card, Divider, Stack, Typography } from "@mui/material";

export default function PlayerCard({ player }) {
  return (
    <Card sx={{ padding: "12px" }}>
      <Stack width={"100%"} direction="column">
        <Stack
          width={"100%"}
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              ФИО: {player ? player.name : ""}
            </Typography>
          </Stack>
        </Stack>

        <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
          Логин: {player ? player.login : ""}
        </Typography>
        <Divider component="div" />

        <Stack width={"100%"} direction="row" spacing={0.5}>
          <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
            Маркировка:
          </Typography>
          <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
            experiment.mark
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}
