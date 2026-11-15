import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { fetchUsers, getMergePreview, mergeUsers } from "../http/userAPI";

const SEARCH_DEBOUNCE_MS = 400;

const PROFILE_FIELDS = [
  { key: "name", label: "ФИО", get: (u) => u.name ?? "—", differs: (a, b) => (a.name ?? "") !== (b.name ?? "") },
  {
    key: "profession",
    label: "Профессия",
    get: (u) => u.profession ?? "—",
    differs: (a, b) => (a.profession ?? "") !== (b.profession ?? ""),
  },
  {
    key: "experience",
    label: "Стаж",
    get: (u) => `${u.experience_years ?? 0} л. ${u.experience_months ?? 0} мес.`,
    differs: (a, b) =>
      (a.experience_years ?? 0) !== (b.experience_years ?? 0) ||
      (a.experience_months ?? 0) !== (b.experience_months ?? 0),
  },
  { key: "gender", label: "Пол", get: (u) => u.gender ?? "—", differs: (a, b) => (a.gender ?? "") !== (b.gender ?? "") },
  { key: "age", label: "Возраст", get: (u) => u.age ?? "—", differs: (a, b) => (a.age ?? 0) !== (b.age ?? 0) },
];

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("ru-RU") : "—");

/**
 * Модалка объединения двух аккаунтов.
 * sourceUser — пользователь из строки таблицы, с которого начато объединение.
 */
const MergeUsersModal = ({ open, onClose, sourceUser, onMerged }) => {
  const { enqueueSnackbar } = useSnackbar();
  const notifyError = (text) =>
    enqueueSnackbar(text, { variant: "error", autoHideDuration: 4000, preventDuplicate: true });

  const [step, setStep] = useState("select");
  const [candidates, setCandidates] = useState([]);
  const [candidateInput, setCandidateInput] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const [keepId, setKeepId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fieldChoices, setFieldChoices] = useState({});
  const [loginChoice, setLoginChoice] = useState("keep");
  const [testChoices, setTestChoices] = useState({});
  const [merging, setMerging] = useState(false);

  const reset = useCallback(() => {
    setStep("select");
    setCandidates([]);
    setCandidateInput("");
    setCandidate(null);
    setKeepId(null);
    setPreview(null);
    setFieldChoices({});
    setLoginChoice("keep");
    setTestChoices({});
    setMerging(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  // Поиск второго аккаунта по ФИО и логину с дебаунсом.
  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = setTimeout(() => {
      setLoadingCandidates(true);
      const query = candidateInput.trim();
      const requests =
        query === ""
          ? [fetchUsers(null, null, 1)]
          : [fetchUsers("user_name", query, 1), fetchUsers("login", query, 1)];
      Promise.all(requests)
        .then((results) => {
          const byId = new Map();
          results.flat().forEach((u) => {
            if (u.user_id !== sourceUser.user_id) {
              byId.set(u.user_id, u);
            }
          });
          setCandidates(Array.from(byId.values()));
        })
        .catch(() => notifyError("Ошибка при поиске пользователей"))
        .finally(() => setLoadingCandidates(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateInput, open, sourceUser]);

  const loadPreview = useCallback(
    (selectedKeepId, selectedDropId) => {
      setLoadingPreview(true);
      getMergePreview(selectedKeepId, selectedDropId)
        .then((data) => {
          setPreview(data);
          setFieldChoices({});
          setLoginChoice("keep");
          const initialTestChoices = {};
          (data.conflicting_tests ?? []).forEach((t) => {
            initialTestChoices[t.test_id] = "keep";
          });
          setTestChoices(initialTestChoices);
        })
        .catch((e) => {
          const serverError = e.response?.data?.error;
          notifyError("Ошибка при загрузке данных для объединения" + (serverError ? `: ${serverError}` : ""));
          setStep("select");
        })
        .finally(() => setLoadingPreview(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleCandidateNext = () => {
    if (candidate == null) {
      notifyError("Выберите второй аккаунт");
      return;
    }
    setKeepId(sourceUser.user_id);
    setStep("preview");
    loadPreview(sourceUser.user_id, candidate.user_id);
  };

  const handleDirectionChange = (newKeepId) => {
    if (preview == null) {
      return;
    }
    const newDropId = newKeepId === preview.keep_user.user_id ? preview.drop_user.user_id : preview.keep_user.user_id;
    setKeepId(newKeepId);
    loadPreview(newKeepId, newDropId);
  };

  const handleMerge = () => {
    if (preview == null || merging) {
      return;
    }
    const keep = preview.keep_user;
    const drop = preview.drop_user;
    const pick = (key, getValue) => (fieldChoices[key] === "drop" ? getValue(drop) : getValue(keep));

    const payload = {
      keep_user_id: keep.user_id,
      drop_user_id: drop.user_id,
      login: loginChoice === "drop" ? drop.login : keep.login,
      name: pick("name", (u) => u.name ?? ""),
      profession: pick("profession", (u) => u.profession ?? null),
      experience_years: pick("experience", (u) => u.experience_years ?? 0),
      experience_months: pick("experience", (u) => u.experience_months ?? 0),
      gender: pick("gender", (u) => u.gender ?? null),
      age: pick("age", (u) => u.age ?? null),
      test_results: testChoices,
    };

    setMerging(true);
    mergeUsers(payload)
      .then(() => {
        enqueueSnackbar(`Аккаунты объединены: данные перенесены на ${payload.login}`, {
          variant: "success",
          autoHideDuration: 4000,
          preventDuplicate: true,
        });
        handleClose();
        onMerged();
      })
      .catch((e) => {
        setMerging(false);
        const serverError = e.response?.data?.error;
        notifyError("Ошибка при объединении аккаунтов" + (serverError ? `: ${serverError}` : ""));
      });
  };

  const renderChoiceRow = (label, keepText, dropText, value, onChange, keepCaption, dropCaption) => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography sx={{ minWidth: 140, fontWeight: 600 }}>{label}</Typography>
      <RadioGroup row value={value} onChange={(e) => onChange(e.target.value)}>
        <FormControlLabel value="keep" control={<Radio size="small" />} label={`${keepText}${keepCaption ?? ""}`} />
        <FormControlLabel value="drop" control={<Radio size="small" />} label={`${dropText}${dropCaption ?? ""}`} />
      </RadioGroup>
    </Stack>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Объединение аккаунтов</DialogTitle>
      <DialogContent>
        {step === "select" ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <DialogContentText>
              Аккаунт «{sourceUser.login}» ({sourceUser.name}) будет объединён с выбранным ниже. На следующем шаге вы
              решите, какой из них останется.
            </DialogContentText>
            <Autocomplete
              options={candidates}
              loading={loadingCandidates}
              getOptionLabel={(u) => `${u.login} — ${u.name}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Второй аккаунт (поиск по ФИО или логину)"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCandidates ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              value={candidate}
              inputValue={candidateInput}
              onInputChange={(_, value) => setCandidateInput(value)}
              onChange={(_, value) => setCandidate(value)}
              isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
            />
          </Stack>
        ) : loadingPreview || preview == null ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">
              Объединение необратимо: аккаунт, который не оставлен, будет удалён вместе с логином, а его игры, графики,
              результаты тестов и членство в группах перейдут оставшемуся аккаунту.
            </Alert>

            <Typography variant="h6">Какой аккаунт оставить</Typography>
            <RadioGroup
              value={keepId}
              onChange={(e) => handleDirectionChange(Number(e.target.value))}
            >
              <FormControlLabel
                value={preview.keep_user.user_id}
                control={<Radio />}
                label={`${preview.keep_user.login} — ${preview.keep_user.name}`}
              />
              <FormControlLabel
                value={preview.drop_user.user_id}
                control={<Radio />}
                label={`${preview.drop_user.login} — ${preview.drop_user.name}`}
              />
            </RadioGroup>

            <Typography variant="h6">Логин для входа</Typography>
            {preview.keep_user.login === preview.drop_user.login ? (
              <Typography>{preview.keep_user.login}</Typography>
            ) : (
              renderChoiceRow(
                "Логин",
                preview.keep_user.login,
                preview.drop_user.login,
                loginChoice,
                setLoginChoice
              )
            )}

            <Typography variant="h6">Данные профиля</Typography>
            {PROFILE_FIELDS.map((field) =>
              field.differs(preview.keep_user, preview.drop_user) ? (
                <React.Fragment key={field.key}>
                  {renderChoiceRow(
                    field.label,
                    field.get(preview.keep_user),
                    field.get(preview.drop_user),
                    fieldChoices[field.key] ?? "keep",
                    (value) => setFieldChoices((prev) => ({ ...prev, [field.key]: value }))
                  )}
                </React.Fragment>
              ) : (
                <Stack key={field.key} direction="row" spacing={2}>
                  <Typography sx={{ minWidth: 140, fontWeight: 600 }}>{field.label}</Typography>
                  <Typography>{field.get(preview.keep_user)} (совпадает)</Typography>
                </Stack>
              )
            )}

            {(preview.conflicting_tests ?? []).length > 0 ? (
              <>
                <Typography variant="h6">Результаты тестов (пройдены обоими)</Typography>
                {preview.conflicting_tests.map((test) => (
                  <React.Fragment key={test.test_id}>
                    {renderChoiceRow(
                      test.title,
                      `результат: ${test.keep_score ?? "—"}, ${formatDateTime(test.keep_completed_at)}`,
                      `результат: ${test.drop_score ?? "—"}, ${formatDateTime(test.drop_completed_at)}`,
                      testChoices[test.test_id] ?? "keep",
                      (value) => setTestChoices((prev) => ({ ...prev, [test.test_id]: value }))
                    )}
                  </React.Fragment>
                ))}
              </>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        {step === "select" ? (
          <Button variant="contained" onClick={handleCandidateNext} disabled={candidate == null}>
            Далее
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={handleMerge}
            disabled={merging || loadingPreview || preview == null}
          >
            {merging ? "Объединение..." : "Объединить аккаунты"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MergeUsersModal;
