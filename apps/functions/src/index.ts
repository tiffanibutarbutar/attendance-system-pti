import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

type AttendanceType = "check_in" | "check_out";

type CreateAttendancePayload = {
  type: AttendanceType;
  faceScore: number;
  selfieUrl: string;
  latitude?: number;
  longitude?: number;
  note?: string;
};

type CallableRequest = {
  auth?: {
    uid?: string;
  };
  data: unknown;
};

type FirestoreLike = {
  collection: (name: string) => any;
};

function ensureSignedIn(uid?: string): string {
  if (!uid) {
    throw new HttpsError("unauthenticated", "User harus login terlebih dahulu.");
  }
  return uid;
}

function assertCreateAttendancePayload(data: unknown): CreateAttendancePayload {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Payload tidak valid.");
  }

  const payload = data as Partial<CreateAttendancePayload>;
  if (payload.type !== "check_in" && payload.type !== "check_out") {
    throw new HttpsError("invalid-argument", "type harus check_in atau check_out.");
  }

  if (typeof payload.faceScore !== "number" || Number.isNaN(payload.faceScore)) {
    throw new HttpsError("invalid-argument", "faceScore wajib angka.");
  }

  if (payload.faceScore < 0 || payload.faceScore > 1) {
    throw new HttpsError("invalid-argument", "faceScore harus antara 0 hingga 1.");
  }

  if (typeof payload.selfieUrl !== "string" || payload.selfieUrl.length < 10) {
    throw new HttpsError("invalid-argument", "selfieUrl wajib diisi.");
  }

  if (payload.latitude !== undefined && typeof payload.latitude !== "number") {
    throw new HttpsError("invalid-argument", "latitude harus angka.");
  }

  if (payload.longitude !== undefined && typeof payload.longitude !== "number") {
    throw new HttpsError("invalid-argument", "longitude harus angka.");
  }

  return {
    type: payload.type,
    faceScore: payload.faceScore,
    selfieUrl: payload.selfieUrl,
    latitude: payload.latitude,
    longitude: payload.longitude,
    note: payload.note,
  };
}

async function canMarkAttendance(
  firestore: FirestoreLike,
  uid: string,
  type: AttendanceType
): Promise<void> {
  const now = Timestamp.now();
  const startOfDay = Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0)));
  const endOfDay = Timestamp.fromDate(new Date(new Date().setHours(23, 59, 59, 999)));

  const snapshot = await firestore
    .collection("attendance")
    .where("uid", "==", uid)
    .where("type", "==", type)
    .where("createdAt", ">=", startOfDay)
    .where("createdAt", "<=", endOfDay)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    throw new HttpsError(
      "already-exists",
      `Absensi ${type} untuk hari ini sudah tercatat.`
    );
  }

  logger.debug("Attendance allowed", {uid, type, now: now.toDate().toISOString()});
}

export const health = onRequest({region: "asia-southeast2"}, (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "attendance-functions",
    timestamp: new Date().toISOString(),
  });
});

export async function createAttendanceHandler(
  request: CallableRequest,
  deps: {db: FirestoreLike} = {db}
) {
  const uid = ensureSignedIn(request.auth?.uid);
  const payload = assertCreateAttendancePayload(request.data);

  // Minimum threshold awal, bisa dipindah ke Remote Config atau env var.
  const minFaceScore = 0.8;
  if (payload.faceScore < minFaceScore) {
    throw new HttpsError("permission-denied", "Verifikasi wajah gagal, skor terlalu rendah.");
  }

  await canMarkAttendance(deps.db, uid, payload.type);

  const attendanceRef = await deps.db.collection("attendance").add({
    uid,
    type: payload.type,
    faceScore: payload.faceScore,
    selfieUrl: payload.selfieUrl,
    location: payload.latitude !== undefined && payload.longitude !== undefined ? {
      latitude: payload.latitude,
      longitude: payload.longitude,
    } : null,
    note: payload.note ?? null,
    status: "verified",
    source: "mobile",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    id: attendanceRef.id,
    message: "Absensi berhasil direkam.",
  };
}

export async function listMyAttendanceHandler(
  request: CallableRequest,
  deps: {db: FirestoreLike} = {db}
) {
  const uid = ensureSignedIn(request.auth?.uid);

  const snapshot = await deps.db
    .collection("attendance")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(30)
    .get();

  const data = snapshot.docs.map((doc: {id: string; data: () => any}) => {
    const value = doc.data();
    return {
      id: doc.id,
      type: value.type,
      status: value.status,
      faceScore: value.faceScore,
      createdAt: value.createdAt ?? null,
      selfieUrl: value.selfieUrl,
    };
  });

  return {data};
}

export const createAttendance = onCall({region: "asia-southeast2"}, async (request) => {
  return createAttendanceHandler(request);
});

export const listMyAttendance = onCall({region: "asia-southeast2"}, async (request) => {
  return listMyAttendanceHandler(request);
});
