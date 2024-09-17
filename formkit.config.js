import { genesisIcons } from '@formkit/icons';
import { rootClasses } from './formkit.theme';
import { createMultiStepPlugin } from '@formkit/addons';
import '@formkit/addons/css/multistep';

const config = {
  icons: { ...genesisIcons },
  config: { rootClasses },
  plugins: [createMultiStepPlugin()],
};

export default config;
