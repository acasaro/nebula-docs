import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface HeaderSlotValue {
  /** Replace the current top-bar main content. Pass `null` to clear. */
  setSlot: (node: ReactNode) => void;
  /** Replace the column at the leftmost edge of the top bar — sized to
   * match the editor sidebar below it. Pass `null` to clear. */
  setLeading: (node: ReactNode) => void;
}

const HeaderSlotContext = createContext<HeaderSlotValue | null>(null);

interface HeaderSlotProviderProps {
  children: ReactNode;
  /** Render prop for AppShell to lay out whatever is in the slots. */
  render: (slots: { slot: ReactNode; leading: ReactNode }) => ReactNode;
}

export function HeaderSlotProvider({ children, render }: HeaderSlotProviderProps) {
  const [slot, setSlotState] = useState<ReactNode>(null);
  const [leading, setLeadingState] = useState<ReactNode>(null);
  const setSlot = useCallback((node: ReactNode) => setSlotState(node), []);
  const setLeading = useCallback((node: ReactNode) => setLeadingState(node), []);
  return (
    <HeaderSlotContext.Provider value={{ setSlot, setLeading }}>
      {render({ slot, leading })}
      {children}
    </HeaderSlotContext.Provider>
  );
}

/**
 * Subscribe a route's content to the top-bar main slot. Pass `null` to
 * clear (e.g. while loading). The slot is automatically cleared on unmount.
 */
export function useHeaderSlot(node: ReactNode): void {
  const ctx = useContext(HeaderSlotContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setSlot(node);
    return () => ctx.setSlot(null);
  }, [ctx, node]);
}

/**
 * Subscribe a route's content to the top-bar leading column — sized to
 * match the editor sidebar below it. Auto-clears on unmount.
 */
export function useHeaderLeading(node: ReactNode): void {
  const ctx = useContext(HeaderSlotContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setLeading(node);
    return () => ctx.setLeading(null);
  }, [ctx, node]);
}
