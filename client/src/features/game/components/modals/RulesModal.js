import React from "react";
import { Button } from "@mui/material";
import GameModal from "./GameModal";
import RulesTextContent from "./RulesTextContent";
import { DEFAULT_RULES_TEXT } from "../../constants/defaultRulesText";

const backButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  flexGrow: 1,
};

export default function RulesModal({ open, onClose, rulesText }) {
  if (rulesText?.trim()) {
    return (
      <GameModal open={open} onClose={onClose} contentSx={{ height: "90%", width: 800, overflow: "scroll" }}>
        <RulesTextContent text={rulesText} />
        <Button sx={backButtonSx} onClick={onClose}>
          К игре
        </Button>
      </GameModal>
    );
  }

  return (
    <GameModal open={open} onClose={onClose} contentSx={{ height: "90%", width: 800, overflow: "scroll" }}>
      <RulesTextContent text={DEFAULT_RULES_TEXT} />
      <Button sx={backButtonSx} onClick={onClose}>
        К игре
      </Button>
    </GameModal>
  );
}
