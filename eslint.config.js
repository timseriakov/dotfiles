import globals from "globals";
import pluginJs from "@eslint/js";
import pluginSecurity from "eslint-plugin-security";

export default [
  pluginJs.configs.recommended,
  pluginSecurity.configs.recommended,
  {
    languageOptions: { globals: globals.browser },
  },
  {
    ignores: ["qutebrowser/greasemonkey/"],
  },
];
