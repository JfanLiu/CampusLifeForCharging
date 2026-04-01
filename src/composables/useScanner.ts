import { onMounted, onUnmounted, ref, type Ref } from 'vue';

export function useScanner(
  videoElement: Ref<HTMLVideoElement | null>,
  onDetected: (code: string) => void,
) {
  const isOpen = ref(false);
  const statusMessage = ref('正在尝试打开后置摄像头。');

  let stream: MediaStream | null = null;
  let detector: BarcodeDetector | null = null;
  let rafId = 0;

  async function open() {
    if (!hasCameraSupport()) {
      throw new Error('当前浏览器不支持相机访问');
    }

    if (!hasBarcodeSupport()) {
      throw new Error('当前浏览器暂不支持网页扫码，请手动输入编号');
    }

    const video = videoElement.value;
    if (!video) {
      throw new Error('扫码组件尚未就绪');
    }

    statusMessage.value = '正在尝试打开后置摄像头。';
    isOpen.value = true;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      });

      video.srcObject = stream;
      await video.play();

      const desiredFormats = [
        'qr_code',
        'code_128',
        'code_39',
        'code_93',
        'ean_13',
        'ean_8',
        'pdf417',
        'aztec',
        'data_matrix',
      ];
      const supportedFormats =
        typeof BarcodeDetector.getSupportedFormats === 'function'
          ? await BarcodeDetector.getSupportedFormats()
          : desiredFormats;

      const activeFormats = desiredFormats.filter((format) => supportedFormats.includes(format));
      detector = new BarcodeDetector(activeFormats.length ? { formats: activeFormats } : undefined);
      statusMessage.value = '识别中，请将二维码放在画面中央。';
      void scanLoop();
    } catch (error) {
      close();
      throw error;
    }
  }

  function close() {
    isOpen.value = false;
    statusMessage.value = '正在尝试打开后置摄像头。';

    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    detector = null;

    if (videoElement.value) {
      videoElement.value.srcObject = null;
    }
  }

  async function scanLoop() {
    if (!isOpen.value || !detector || !videoElement.value) {
      return;
    }

    try {
      if (videoElement.value.readyState >= 2) {
        const results = await detector.detect(videoElement.value);
        if (results.length > 0) {
          const code = String(results[0].rawValue || '').trim();
          if (code) {
            onDetected(code);
            close();
            return;
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      statusMessage.value = `识别失败：${message}`;
    }

    rafId = window.requestAnimationFrame(() => {
      void scanLoop();
    });
  }

  function handleVisibilityChange() {
    if (document.hidden && isOpen.value) {
      close();
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    close();
  });

  return {
    isOpen,
    statusMessage,
    open,
    close,
  };
}

function hasCameraSupport(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

function hasBarcodeSupport(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}
