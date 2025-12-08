import type { Ref } from 'vue';

/**
 * Composable for handling dialer logic
 * Manages phone number input, validation, keyboard handling, and digit pad interaction
 */

// Valid phone characters regex
const VALID_CHARS = /[0-9*#+\-() ]/;

// Keyboard key mappings for numpad and regular keys
const KEY_MAP: Record<string, string> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  'Numpad0': '0', 'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3', 'Numpad4': '4',
  'Numpad5': '5', 'Numpad6': '6', 'Numpad7': '7', 'Numpad8': '8', 'Numpad9': '9',
  '*': '*', 'NumpadMultiply': '*',
  '#': '#', 'NumpadSubtract': '#',
};

const CONTROL_KEYS = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Enter', 'NumpadEnter'];

interface UseDialerOptions {
  phoneNumber: Ref<string>;
  inputRef: Ref<HTMLInputElement | null>;
  onCall?: () => void;
}

export const useDialer = (options: UseDialerOptions) => {
  const { phoneNumber, inputRef, onCall } = options;

  // State for visual feedback
  const buttonRefs = ref<Record<string, any>>({});
  const pressedKey = ref<string | null>(null);


  const setButtonRef = (digit: string, el: any) => {
    if (el) {
      buttonRefs.value[digit] = el;
    }
  };


  const addDigit = (digit: string) => {
    phoneNumber.value += digit;
    // Auto-focus input after clicking button
    inputRef.value?.focus();
  };

  const clearPhoneNumber = () => {
    phoneNumber.value = '';
  };


  const handleInputKeydown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    if (CONTROL_KEYS.includes(event.key)) {
      return;
    }

    const isValidKey = event.key.length === 1 && VALID_CHARS.test(event.key);

    if (!isValidKey) {
      event.preventDefault();
    }
  };


  const filterInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const filtered = target.value.split('').filter(char => VALID_CHARS.test(char)).join('');

    if (filtered !== target.value) {
      phoneNumber.value = filtered;
    }
  };


  const handleKeydown = (event: KeyboardEvent) => {
    const digit = KEY_MAP[event.key];

    if (digit) {
      event.preventDefault();

      phoneNumber.value += digit;

      // Visual feedback
      pressedKey.value = digit;
      setTimeout(() => {
        pressedKey.value = null;
      }, 150);
    }

    // Handle Enter key
    if (event.key === 'Enter' || event.key === 'NumpadEnter') {
      onCall?.();
    }

    // Handle Backspace
    if (event.key === 'Backspace' && phoneNumber.value) {
      event.preventDefault();
      phoneNumber.value = phoneNumber.value.slice(0, -1);
    }
  };

  /**
   * Auto-focus input on mount
   */
  const focusInput = () => {
    setTimeout(() => {
      inputRef.value?.focus();
    }, 100);
  };


  const isValidNumber = (minDigits: number = 8) => {
    return phoneNumber.value.length >= minDigits;
  };

  return {
    // State
    buttonRefs,
    pressedKey,

    // Constants (exposed for reference if needed)
    VALID_CHARS,
    KEY_MAP,

    // Methods
    setButtonRef,
    addDigit,
    clearPhoneNumber,
    handleInputKeydown,
    filterInput,
    handleKeydown,
    focusInput,
    isValidNumber,
  };
};
