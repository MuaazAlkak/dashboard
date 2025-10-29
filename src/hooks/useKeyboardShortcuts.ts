import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

        return keyMatches && ctrlMatches && shiftMatches && altMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export function getShortcutDisplay(shortcut: ShortcutConfig): string {
  const keys: string[] = [];
  
  if (shortcut.ctrlKey) keys.push('Ctrl');
  if (shortcut.shiftKey) keys.push('Shift');
  if (shortcut.altKey) keys.push('Alt');
  keys.push(shortcut.key.toUpperCase());

  return keys.join(' + ');
}

