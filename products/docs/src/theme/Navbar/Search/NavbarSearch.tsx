import React, {type ReactNode} from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

export interface Props {
  readonly children: ReactNode;
  readonly className?: string;
}

export default function NavbarSearch({children, className}: Props): ReactNode {
  return (
    <div className={clsx(className, styles.navbarSearchContainer)}>
      {children}
    </div>
  );
}
