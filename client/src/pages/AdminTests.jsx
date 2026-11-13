import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  Paper,
} from "@mui/material";
import NavBarDrawer from "../components/NavBarDrawer";
import { useSnackbar } from "notistack";
import { createTest, deleteTest, fetchAllTests, updateTest } from "../http/testAPI";
import { TEST_CONFIG_EXAMPLES, TEST_TYPE_OPTIONS } from "../features/tests/testTypes";
import TestRenderer from "../features/tests/components/TestRenderer";

const emptyForm = {
  slug: TEST_TYPE_OPTIONS[0].value,
  title: "",
  description: "",
  config: JSON.stringify(TEST_CONFIG_EXAMPLES.likert, null, 2),
  is_active: true,
  sort_order: 0,
};

function hasValidShape(config) {
  return config != null && typeof config === "object" && Array.isArray(config.questions);
}

export default function AdminTests() {
  const { enqueueSnackbar } = useSnackbar();
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadTests = useCallback(() => {
    fetchAllTests()
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(() => {
        enqueueSnackbar("Не удалось загрузить тесты", { variant: "error" });
      });
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // Живое превью: парсим конфиг при каждом изменении.
  const preview = useMemo(() => {
    try {
      const config = JSON.parse(form.config);
      if (!hasValidShape(config)) {
        return { error: 'В конфигурации должен быть массив "questions"' };
      }
      return { config };
    } catch (e) {
      return { error: "JSON невалиден: " + e.message };
    }
  }, [form.config]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSlugChange = (slug) => {
    setForm((prev) => ({
      ...prev,
      slug,
      config: JSON.stringify(TEST_CONFIG_EXAMPLES[slug] || {}, null, 2),
    }));
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(form.config);
    } catch (e) {
      enqueueSnackbar("Конфигурация должна быть валидным JSON", { variant: "error" });
      return;
    }
    if (!hasValidShape(parsedConfig)) {
      enqueueSnackbar('В конфигурации должен быть массив "questions"', { variant: "error" });
      return;
    }
    if (form.title.trim() === "") {
      enqueueSnackbar("Введите название теста", { variant: "error" });
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title.trim(),
      description: form.description,
      config: parsedConfig,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateTest(editingId, payload);
        enqueueSnackbar("Тест обновлён", { variant: "success" });
      } else {
        await createTest(payload);
        enqueueSnackbar("Тест создан", { variant: "success" });
      }
      resetForm();
      loadTests();
    } catch (e) {
      enqueueSnackbar("Ошибка при сохранении теста", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (test) => {
    setEditingId(test.id);
    setForm({
      slug: test.slug,
      title: test.title,
      description: test.description,
      config: JSON.stringify(test.config, null, 2),
      is_active: test.is_active,
      sort_order: test.sort_order,
    });
  };

  const confirmDelete = async () => {
    if (deleting || deleteTarget == null) {
      return;
    }
    setDeleting(true);
    try {
      await deleteTest(deleteTarget.id);
      enqueueSnackbar("Тест удалён", { variant: "success" });
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      loadTests();
    } catch (e) {
      enqueueSnackbar("Ошибка при удалении теста", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (test) => {
    if (togglingId !== null) {
      return;
    }
    setTogglingId(test.id);
    try {
      await updateTest(test.id, { is_active: !test.is_active });
      loadTests();
    } catch (e) {
      enqueueSnackbar("Ошибка при изменении статуса теста", { variant: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <Stack spacing={3}>
          <Typography variant="h4">Управление тестами</Typography>
          <Typography color="text.secondary">
            Активные тесты показываются пользователям после регистрации. Если активных тестов нет, этап
            пропускается. Новые тесты потребуют прохождения у пользователей, которые их ещё не сдавали.
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
            <Stack spacing={2} sx={{ flexGrow: 1, minWidth: 0 }}>
              <TextField
                select
                label="Тип теста (slug)"
                value={form.slug}
                onChange={(event) => handleSlugChange(event.target.value)}
              >
                {TEST_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Название"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <TextField
                label="Описание"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <TextField
                label="Порядок"
                type="number"
                value={form.sort_order}
                onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  />
                }
                label="Активен"
              />
              <TextField
                label="Конфигурация (JSON)"
                value={form.config}
                onChange={(event) => setForm((prev) => ({ ...prev, config: event.target.value }))}
                multiline
                minRows={10}
                error={preview.error != null}
                helperText={preview.error ?? "Превью справа обновляется по мере ввода"}
              />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? "Сохранение..." : editingId ? "Сохранить изменения" : "Создать тест"}
                </Button>
                {editingId ? (
                  <Button variant="outlined" onClick={resetForm} disabled={saving}>
                    Отменить редактирование
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, width: { xs: "100%", md: 420 }, flexShrink: 0, position: { md: "sticky" }, top: 88 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Превью теста
              </Typography>
              {preview.error != null ? (
                <Typography color="error" variant="body2">
                  {preview.error}
                </Typography>
              ) : (
                <TestRenderer
                  key={form.slug}
                  test={{
                    slug: form.slug,
                    title: form.title,
                    description: form.description,
                    config: preview.config,
                  }}
                  onSubmit={() => {}}
                  submitting={false}
                />
              )}
            </Paper>
          </Stack>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Активен</TableCell>
                  <TableCell>Порядок</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      Тесты не созданы
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>{test.id}</TableCell>
                      <TableCell>{test.slug}</TableCell>
                      <TableCell>{test.title}</TableCell>
                      <TableCell>{test.is_active ? "Да" : "Нет"}</TableCell>
                      <TableCell>{test.sort_order}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={() => handleEdit(test)}>
                            Изменить
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleToggleActive(test)}
                            disabled={togglingId === test.id}
                          >
                            {test.is_active ? "Выключить" : "Включить"}
                          </Button>
                          <Button size="small" color="error" onClick={() => setDeleteTarget(test)}>
                            Удалить
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>

        <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
          <DialogTitle>Удалить тест?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Удалить тест «{deleteTarget?.title}» ({deleteTarget?.slug})? Результаты уже пройденных
              пользователей также будут удалены.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Отмена</Button>
            <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
