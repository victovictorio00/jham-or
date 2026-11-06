import { describe, it, expect, vi } from "vitest";
import { adminCached, invalidateAdmin } from "../src/lib/admin-cache";
describe("private admin cache", () => {
  it("deduplicates concurrent reads and invalidates only related data", async () => {
    invalidateAdmin("products", "orders");
    const products = vi.fn(async () => 42),
      orders = vi.fn(async () => 7);
    expect(
      await Promise.all([
        adminCached("test-products", ["products"], products),
        adminCached("test-products", ["products"], products),
      ]),
    ).toEqual([42, 42]);
    await adminCached("test-orders", ["orders"], orders);
    invalidateAdmin("products");
    await adminCached("test-products", ["products"], products);
    await adminCached("test-orders", ["orders"], orders);
    expect(products).toHaveBeenCalledTimes(2);
    expect(orders).toHaveBeenCalledTimes(1);
  });
  it("never restores a stale in-flight read after a mutation", async () => {
    let release!: (value: number) => void;
    const old = adminCached(
      "test-race",
      ["media"],
      () =>
        new Promise<number>((resolve) => {
          release = resolve;
        }),
    );
    await Promise.resolve();
    invalidateAdmin("media");
    expect(await adminCached("test-race", ["media"], async () => 2)).toBe(2);
    release(1);
    expect(await old).toBe(1);
    expect(await adminCached("test-race", ["media"], async () => 3)).toBe(2);
  });
  it("retries failed reads and expires data after five minutes", async () => {
    await expect(
      adminCached("test-failure", ["audit"], async () => {
        throw new Error("offline");
      }),
    ).rejects.toThrow("offline");
    expect(await adminCached("test-failure", ["audit"], async () => 5)).toBe(5);
    vi.useFakeTimers();
    try {
      await adminCached("test-expiry", ["audit"], async () => 1);
      vi.advanceTimersByTime(300001);
      expect(await adminCached("test-expiry", ["audit"], async () => 2)).toBe(
        2,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
