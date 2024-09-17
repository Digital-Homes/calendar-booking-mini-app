import { genesisIcons } from '@formkit/icons';
import { createMultiStepPlugin } from '@formkit/addons';
import '@formkit/addons/css/multistep';

const config = {
  icons: { ...genesisIcons },
  plugins: [createMultiStepPlugin()],
};

export default config;
