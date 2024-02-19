# Figma icon font generator plugin
Easy to use from figma vectors, with it you will generate:

- SVG
- EOT
- TrueType
- Woff
- Woff2
- Symbol-defs SVG
- each vector
- json config

Plugin link in figma community: [Figma-icon-font-generator](https://www.figma.com/community/plugin/1136442533698384554/Figma-icon-font-generator)

## How it Works

This pluggin detects all vectors selected. It then convert to fonts files, show a preview of result.

## Basic Usage

Select a vector.*
click in "Generate Font" to download of zip with files.

> *Note: unpredictable things can happen if you select more complex vectors.

## More Configs

### Font Parameters:
On the tab "Font Config" you can config some parameters from the font, including "Font Name", "Font Weight", "Font Style" ...*

> *Note: That informations are save on the file.

### Ligatures and Unicode:

Next to button "Generate Font" you choice if must have ligadures, and unicode is generated automatic.

For ligatures we use the name of files, but you can customizing both ligature and unicode.

You may also assign **tags** to your icons. They will be stored in the generated JSON configuration for later use.

In the vector name, we separede the props as follows:

> {custom unicode}-{name}--{custom ligature}, so you custom parameters of icon.

**For example: uEA01-iconName--customliga**
