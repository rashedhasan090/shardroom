export type CapabilityProbe = {
  ramGb: number;
  cores: number;
  webgpu: boolean;
  weight: number;
};

type NavigatorProbe = Navigator & { deviceMemory?: number; gpu?: GpuLike };
type GpuLike = { requestAdapter: () => Promise<unknown> };

export async function probeCapabilities(): Promise<CapabilityProbe> {
  const nav = navigator as NavigatorProbe;
  const ramGb = typeof nav.deviceMemory === "number" ? nav.deviceMemory : 4;
  const cores = navigator.hardwareConcurrency || 4;
  let webgpu = false;
  try {
    if (nav.gpu) {
      const adapter = await Promise.race([
        nav.gpu.requestAdapter(),
        new Promise<null>((resolve) => {
          window.setTimeout(() => resolve(null), 1500);
        }),
      ]);
      webgpu = Boolean(adapter);
    }
  } catch {
    webgpu = false;
  }
  const weight = Math.round(ramGb * 8 + cores * 3 + (webgpu ? 40 : 0));
  return { ramGb, cores, webgpu, weight };
}
