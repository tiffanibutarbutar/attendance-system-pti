# Backend Attendance System (Firebase Functions)

Backend ini menangani:
- verifikasi request absensi (minimum skor face score),
- penyimpanan data absensi ke Firestore,
- endpoint untuk melihat riwayat absensi user.

## Endpoint yang sudah tersedia

1. `health` (HTTP)
2. `createAttendance` (Callable)
3. `listMyAttendance` (Callable)

## Struktur data Firestore (awal)

### Collection: `users`
```json
{
  "displayName": "Mahasiswa A",
  "email": "mahasiswa@kampus.ac.id",
  "role": "intern",
  "companyId": "pti",
  "createdAt": "serverTimestamp"
}
```

### Collection: `attendance`
```json
{
  "uid": "firebase-auth-uid",
  "type": "check_in",
  "status": "verified",
  "faceScore": 0.92,
  "selfieUrl": "https://...",
  "location": {
    "latitude": -6.2,
    "longitude": 106.8
  },
  "note": null,
  "source": "mobile",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

## Setup lokal

1. Install dependency di folder functions:
   ```bash
   cd apps/functions
   npm install
   ```
2. Login firebase (sekali saja):
   ```bash
   npx -y firebase-tools@latest login
   ```
3. Jalankan emulator dari root project:
   ```bash
   npx -y firebase-tools@latest emulators:start
   ```

## Catatan face detection

Saat ini backend menerima `faceScore` dari klien.
Untuk produksi, sebaiknya pindahkan proses verifikasi wajah ke backend (Cloud Functions + provider vision/ML) agar anti manipulasi.
