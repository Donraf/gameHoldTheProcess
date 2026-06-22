import React from "react";
import { Modal } from "@mui/material";
import { ModalContent } from "../../../../components/ModalContent";

const baseModalSx = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function GameModal({ open, onClose, zIndex, contentSx, children }) {
  return (
    <Modal
      sx={zIndex != null ? { ...baseModalSx, zIndex } : baseModalSx}
      open={open}
      onClose={onClose}
    >
      <ModalContent sx={contentSx}>{children}</ModalContent>
    </Modal>
  );
}
