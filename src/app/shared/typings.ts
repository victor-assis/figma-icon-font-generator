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

export type IconInformation = {
  code: string,
  liga?: string,
  name: string,
  ref: string,
  svg: string,
  pathData: string,
  figmaName?: string,
};