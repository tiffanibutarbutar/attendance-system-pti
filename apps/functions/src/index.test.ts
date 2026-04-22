import {describe, expect, it} from "vitest";
import {createAttendanceHandler, listMyAttendanceHandler} from "./index";

function buildCreateAttendanceDb(emptyResult = true) {
  const queryChain = {
    where: () => queryChain,
    limit: () => queryChain,
    get: async () => ({empty: emptyResult}),
  };

  return {
    collection: () => ({
      where: () => queryChain,
      add: async () => ({id: "att-1"}),
    }),
  };
}

describe("createAttendanceHandler", () => {
  it("creates attendance for signed in user", async () => {
    const db = buildCreateAttendanceDb(true);

    const result = await createAttendanceHandler(
      {
        auth: {uid: "user-1"},
        data: {
          type: "check_in",
          faceScore: 0.91,
          selfieUrl: "https://example.com/selfie.jpg",
          latitude: -6.2,
          longitude: 106.8,
        },
      },
      {db}
    );

    expect(result.success).toBe(true);
    expect(result.id).toBe("att-1");
  });

  it("rejects when face score too low", async () => {
    const db = buildCreateAttendanceDb(true);

    await expect(
      createAttendanceHandler(
        {
          auth: {uid: "user-1"},
          data: {
            type: "check_in",
            faceScore: 0.55,
            selfieUrl: "https://example.com/selfie.jpg",
          },
        },
        {db}
      )
    ).rejects.toMatchObject({code: "permission-denied"});
  });
});

describe("listMyAttendanceHandler", () => {
  it("returns attendance list for signed in user", async () => {
    const docs = [
      {
        id: "att-1",
        data: () => ({
          type: "check_in",
          status: "verified",
          faceScore: 0.95,
          createdAt: {seconds: 1},
          selfieUrl: "https://example.com/1.jpg",
        }),
      },
      {
        id: "att-2",
        data: () => ({
          type: "check_out",
          status: "verified",
          faceScore: 0.9,
          createdAt: {seconds: 2},
          selfieUrl: "https://example.com/2.jpg",
        }),
      },
    ];

    const db = {
      collection: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              get: async () => ({docs}),
            }),
          }),
        }),
      }),
    };

    const result = await listMyAttendanceHandler(
      {
        auth: {uid: "user-1"},
        data: {},
      },
      {db}
    );

    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe("att-1");
  });

  it("rejects when unauthenticated", async () => {
    const db = {
      collection: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              get: async () => ({docs: []}),
            }),
          }),
        }),
      }),
    };

    await expect(
      listMyAttendanceHandler(
        {
          data: {},
        },
        {db}
      )
    ).rejects.toMatchObject({code: "unauthenticated"});
  });
});
