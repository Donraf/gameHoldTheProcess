import React from "react";
import { Button } from "@mui/material";
import GameModal from "./GameModal";
import RulesTextContent from "./RulesTextContent";
import VideoGuidePlayer from "./VideoGuidePlayer";
import { DEFAULT_RULES_TEXT, substituteRuleLimits } from "../../constants/defaultRulesText";

const backButtonSx = {
  color: "#FFFFFF",
  backgroundColor: "#9356A0",
  flexGrow: 1,
};

export default function RulesModal({ open, onClose, rulesText, parSet }) {
  if (rulesText?.trim()) {
    return (
      <GameModal open={open} onClose={onClose} contentSx={{ height: "90%", width: 800, overflow: "scroll" }}>
        <VideoGuidePlayer />
        <RulesTextContent text={substituteRuleLimits(rulesText, parSet)} />
        <Button sx={backButtonSx} onClick={onClose}>
          К игре
        </Button>
      </GameModal>
    );
  }

  return (
    <GameModal open={open} onClose={onClose} contentSx={{ height: "90%", width: 800, overflow: "scroll" }}>
      <VideoGuidePlayer />
      <RulesTextContent text={substituteRuleLimits(DEFAULT_RULES_TEXT, parSet)} />
      <Button sx={backButtonSx} onClick={onClose}>
        К игре
      </Button>
    </GameModal>
  );
}
