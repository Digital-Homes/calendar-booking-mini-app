import { genesisIcons } from '@formkit/icons';
import { rootClasses } from './formkit.theme';
import { DefaultConfigOptions } from '@formkit/vue';
import { createMultiStepPlugin } from '@formkit/addons';
import '@formkit/addons/css/multistep';

const config: DefaultConfigOptions = {
  icons: { ...genesisIcons },
  config: { rootClasses },
  plugins: [createMultiStepPlugin()],
};

export default config;
