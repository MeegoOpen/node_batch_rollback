import type { SDKClient } from '@lark-project/js-sdk';

declare global {
  interface Window {
    JSSDK: SDKClient;
  }
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';
declare module '*.ttf';
declare module '*.woff';
declare module '*.woff2';
declare module '*.less';
declare module '*.mp4';
declare module '*.svg' {
  const content: any;
  export default content;
}

// Ambient module declarations to prevent type resolution errors when dependencies are unavailable
declare module 'react';
declare module 'react-dom/client';
declare module '@byted-meego/meego-components';
declare module '@douyinfe/semi-ui/lib/es/form';
declare module 'moment';
declare module '@lark-project/js-sdk';
declare module 'lodash';
declare module 'axios';
