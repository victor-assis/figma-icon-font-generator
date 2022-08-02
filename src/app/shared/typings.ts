import { ReactNode } from 'react';

export interface JsonType {
  svg: string;
  name: string;
  unicode: string[] | string;
  ligature?: string[] | string;
}

export interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}