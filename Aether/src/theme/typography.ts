import { StyleSheet } from 'react-native';
import { typography as raw } from './tokens';

export const typography = StyleSheet.create({
  display: raw.display,
  h1: raw.h1,
  h2: raw.h2,
  h3: raw.h3,
  body: raw.body,
  bodyBold: raw.bodyBold,
  caption: raw.caption,
  captionBold: raw.captionBold,
  button: raw.button,
  small: raw.small,
});

export { raw as typographyRaw };
