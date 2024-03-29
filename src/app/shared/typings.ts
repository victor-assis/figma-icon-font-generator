import { ReactNode } from 'react';
import SVGIcons2SVGFontStream from 'svgicons2svgfont';

export interface IJsonType {
  id: string;
  svg: string;
  svgFile: File;
  name: string;
  unicode: string[] | string;
  ligature?: string[] | string;
}

export interface ITabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

export interface IIconInformation {
  code: string;
  liga: string;
  name: string;
  ref: string;
  svg: string;
  pathData: string;
  figmaName: string;
}

export interface ISerializedSVG {
  name: string;
  id: string;
  svg: string;
}

export interface IFormConfig {
  fontName: string;
  fontHeight?: string;
  fontStyle?: string;
  fontWeight?: string;
  fixedWidth?: boolean;
  centerHorizontally?: boolean;
  centerVertically?: boolean;
  normalize?: boolean;
  preserveAspectRatio?: boolean;
  version: string;
}

export interface IFormGithub {
  githubToken: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  commitMessage: string;
  pullRequestTitle: string;
  mainBranch: string;
}

export interface IGeneratedFont {
  urls: IFontFormats;
  optons: SVGIcons2SVGFontStream.SvgIcons2FontOptions & { version: string };
  json: IJsonType[];
}

export interface IFontFormats {
  svg?: string;
  ttf?: string;
  eot?: string;
  woff?: string;
  woff2?: string;
}
