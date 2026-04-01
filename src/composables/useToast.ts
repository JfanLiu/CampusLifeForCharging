import { onUnmounted, reactive } from 'vue';
import type { ToastState } from '../types';

export function useToast() {
  const state = reactive<ToastState>({
    visible: false,
    message: '',
    tone: 'success',
  });

  let timer = 0;

  function show(message: string, tone: ToastState['tone'] = 'success') {
    window.clearTimeout(timer);
    state.message = message;
    state.tone = tone;
    state.visible = true;
    timer = window.setTimeout(() => {
      state.visible = false;
    }, 2800);
  }

  function hide() {
    window.clearTimeout(timer);
    state.visible = false;
  }

  onUnmounted(() => {
    window.clearTimeout(timer);
  });

  return {
    state,
    show,
    hide,
  };
}
