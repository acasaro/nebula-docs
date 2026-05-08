import { useTheme } from "@/lib/theme";
import { NebulaLoaderBlock, type NebulaLoaderProps } from "./NebulaLoader";

/**
 * NebulaLoader pre-wired to the app's current theme. Use anywhere a
 * page-level loading indicator is needed; the underlying NebulaLoader
 * keeps all of its props (size, variant, speed, etc.).
 */
export function PageLoader(props: Omit<NebulaLoaderProps, "theme">) {
  const { theme } = useTheme();
  return (
    <div className='h-full w-full'>
      <NebulaLoaderBlock
        label='Loading workspace'
        size={480}
        theme={theme}
        {...props}
      />
    </div>
  );
}
