import { Steps, Step } from '../Steps';

interface PlatformNavProps {
  product: string;
  path?: string;
}

export function PlatformNav({ product, path }: PlatformNavProps) {
  return (
    <Steps>
      <Step title="Open Immerse Platform">
        Navigate to <a href="https://uhg.immerse.com">Immerse Platform</a> and sign in with your credentials.
      </Step>
      <Step title={`Go to ${product}`}>
        From the left navigation sidebar, select <strong>{product}</strong>{path ? ` > ${path}` : ''}.
      </Step>
    </Steps>
  );
}
