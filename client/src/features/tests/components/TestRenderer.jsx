import React from "react";
import { Typography } from "@mui/material";
import {
  TEST_TYPE_LIKERT,
  TEST_TYPE_SINGLE_CHOICE,
  TEST_TYPE_TEXT,
} from "../testTypes";
import LikertTestForm from "./LikertTestForm";
import SingleChoiceTestForm from "./SingleChoiceTestForm";
import TextTestForm from "./TextTestForm";

export default function TestRenderer({ test, onSubmit, submitting }) {
  switch (test.slug) {
    case TEST_TYPE_LIKERT:
      return <LikertTestForm test={test} onSubmit={onSubmit} submitting={submitting} />;
    case TEST_TYPE_SINGLE_CHOICE:
      return <SingleChoiceTestForm test={test} onSubmit={onSubmit} submitting={submitting} />;
    case TEST_TYPE_TEXT:
      return <TextTestForm test={test} onSubmit={onSubmit} submitting={submitting} />;
    default:
      return <Typography>Неизвестный тип теста: {test.slug}</Typography>;
  }
}
