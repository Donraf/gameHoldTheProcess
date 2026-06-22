import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CssBaseline,
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

const emptyForm = {
  slug: TEST_TYPE_OPTIONS[0].value,
  title: "",
  description: "",
  config: JSON.stringify(TEST_CONFIG_EXAMPLES.likert, null, 2),
  is_active: true,
  sort_order: 0,
};

export default function AdminTests() {
  const { enqueueSnackbar } = useSnackbar();
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadTests = () => {
    fetchAllTests()
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(() => {
        enqueueSnackbar("Не удалось загрузить тесты", { variant: "error" });
      });
  };

  useEffect(() => {
    loadTests();
  }, []);

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
    try {
      JSON.parse(form.config);
    } catch (e) {
      enqueueSnackbar("Конфигурация должна быть валидным JSON", { variant: "error" });
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      config: JSON.parse(form.config),
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };

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

  const handleDelete = async (id) => {
    try {
      await deleteTest(id);
      enqueueSnackbar("Тест удалён", { variant: "success" });
      if (editingId === id) {
        resetForm();
      }
      loadTests();
    } catch (e) {
      enqueueSnackbar("Ошибка при удалении теста", { variant: "error" });
    }
  };

  const handleToggleActive = async (test) => {
    try {
      await updateTest(test.id, { is_active: !test.is_active });
      loadTests();
    } catch (e) {
      enqueueSnackbar("Ошибка при изменении статуса теста", { variant: "error" });
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

          <Stack spacing={2}>
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
            />
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleSave}>
                {editingId ? "Сохранить изменения" : "Создать тест"}
              </Button>
              {editingId ? (
                <Button variant="outlined" onClick={resetForm}>
                  Отменить редактирование
                </Button>
              ) : null}
            </Stack>
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
                {tests.map((test) => (
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
                        <Button size="small" onClick={() => handleToggleActive(test)}>
                          {test.is_active ? "Выключить" : "Включить"}
                        </Button>
                        <Button size="small" color="error" onClick={() => handleDelete(test.id)}>
                          Удалить
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Box>
    </Box>
  );
}
