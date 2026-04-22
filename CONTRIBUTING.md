# Team Workflow (GitHub)

## Branching

- `main`: branch stabil untuk rilis.
- `develop`: integrasi fitur.
- `feature/<scope>-<short-name>`: branch fitur, contoh `feature/backend-attendance-callable`.
- `fix/<scope>-<short-name>`: branch perbaikan bug.

## Pull Request

1. Buat branch dari `develop`.
2. Commit kecil dan jelas, contoh:
   - `feat(functions): add createAttendance callable`
   - `chore(firestore): add attendance indexes`
3. Buat PR ke `develop`.
4. Minimal 1 reviewer dari role lain (cross-check frontend/backend).
5. Merge hanya jika:
   - build/lint lolos,
   - tidak ada conflict,
   - deskripsi PR menjelaskan perubahan schema/rules.

## Commit Convention

Gunakan format:

`<type>(<scope>): <message>`

Tipe yang dipakai:
- `feat`
- `fix`
- `chore`
- `refactor`
- `docs`
- `test`

## Checklist PR Backend

- [ ] Endpoint baru punya validasi input.
- [ ] Aturan Firestore/Storage diperbarui jika perlu.
- [ ] Perubahan index Firestore terdokumentasi.
- [ ] Dampak ke frontend dicatat di deskripsi PR.
